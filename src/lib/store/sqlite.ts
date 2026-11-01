import { randomUUID } from "node:crypto";
import { mkdirSync } from "node:fs";
import path from "node:path";
import type { DatabaseSync } from "node:sqlite";
import { SEED_CUSTOMERS, SEED_ENTRIES, SEED_SHOP, SEED_STOCK } from "../seed";
import type { AuditEvent, Product, StockMovement, RegistrationChallenge, Customer, Entry, OwnerRecord, PayToken, ReminderDelivery, Shop, StockFlag } from "../types";
import { retentionCutoff, UNCONFIRMED_AUDIT_KIND } from "./retention";
import { completeProof, movementResult, normalizedMobile, ownerByMobile, validateProduct } from "./operations";
import type { CompleteRegistrationInput, CustomerPatch, MovementInput, ProductPatch, EraseCounts, LedgerStore } from "./types";

/**
 * A real database file with no account and no key (ADR-023). Uses Node's built-in `node:sqlite`,
 * so there is no dependency to install; Node marks that module experimental, so pin the Node version.
 * It needs a disk that persists (your own machine, a VPS or a Docker volume). Serverless hosts with
 * read-only or throw-away disks cannot keep it.
 * Money is INTEGER paise with a CHECK, entries are voided and never deleted, and the
 * (shop_id, idempotency_key) pair is UNIQUE so a repeated write cannot create a second row.
 */
const SCHEMA = `
create table if not exists shops (
  id text primary key,
  name text not null,
  upi_vpa text,
  is_demo integer not null default 0,
  created_at text not null default (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
create table if not exists customers (
  id text primary key,
  shop_id text not null references shops(id) on delete cascade,
  display_name text not null,
  area text,
  name_roman text not null,
  name_devanagari text,
  aliases text not null default '[]',
  phone_e164 text,
  created_at text not null default (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
create index if not exists customers_shop on customers(shop_id);
create table if not exists entries (
  id text primary key,
  shop_id text not null references shops(id) on delete cascade,
  customer_id text not null references customers(id),
  type text not null check (type in ('credit_given','payment_received')),
  amount_paise integer not null check (amount_paise > 0),
  note text,
  source_text text not null,
  source text not null check (source in ('voice','text','sample')),
  idempotency_key text not null,
  confirmed_at text not null,
  voided_at text,
  void_reason text,
  unique (shop_id, idempotency_key)
);
create index if not exists entries_customer on entries(customer_id);
create table if not exists stock_flags (
  id text primary key,
  shop_id text not null references shops(id) on delete cascade,
  item_name text not null,
  level text not null default 'low',
  source_text text,
  created_at text not null,
  resolved_at text
);
create table if not exists pay_tokens (
  token text primary key,
  shop_id text not null references shops(id) on delete cascade,
  customer_id text not null references customers(id),
  amount_paise integer not null,
  expires_at text not null
);
create table if not exists reminder_deliveries (
  shop_id text not null references shops(id) on delete cascade,
  token text not null references pay_tokens(token) on delete cascade,
  fingerprint text not null,
  status text not null check(status in ('pending','sent','unknown')),
  created_at text not null,
  message_id text,
  simulated integer,
  primary key(shop_id, token)
);
create table if not exists audit_events (
  id integer primary key autoincrement,
  shop_id text not null,
  kind text not null,
  payload text not null,
  created_at text not null
);
create index if not exists audit_shop on audit_events(shop_id, id);
create table if not exists owners (
  shop_id text primary key references shops(id) on delete cascade,
  name text not null,
  mobile text not null,
  passcode_hash text not null,
  auth_version integer not null default 0,
  created_at text not null
);
`;

type Row = Record<string, unknown>;

const toShop = (r: Row): Shop => ({ id: r.id as string, name: r.name as string, upiVpa: (r.upi_vpa as string | null) ?? "", isDemo: r.is_demo === 1 });
const toCustomer = (r: Row): Customer => ({
  id: r.id as string,
  shopId: r.shop_id as string,
  name: r.display_name as string,
  area: (r.area as string | null) ?? undefined,
  nameRoman: r.name_roman as string,
  nameDevanagari: (r.name_devanagari as string | null) ?? undefined,
  aliases: JSON.parse((r.aliases as string) || "[]") as string[],
  phoneE164: (r.phone_e164 as string | null) ?? undefined,
  archivedAt: (r.archived_at as string | null) ?? undefined,
});
const toEntry = (r: Row): Entry => ({
  id: r.id as string,
  shopId: r.shop_id as string,
  customerId: r.customer_id as string,
  type: r.type as Entry["type"],
  amountPaise: Number(r.amount_paise),
  note: (r.note as string | null) ?? undefined,
  sourceText: r.source_text as string,
  source: r.source as Entry["source"],
  idempotencyKey: r.idempotency_key as string,
  confirmedAt: r.confirmed_at as string,
  voidedAt: (r.voided_at as string | null) ?? undefined,
  voidReason: (r.void_reason as string | null) ?? undefined,
});
const toFlag = (r: Row): StockFlag => ({
  id: r.id as string,
  shopId: r.shop_id as string,
  itemName: r.item_name as string,
  level: "low",
  sourceText: (r.source_text as string | null) ?? undefined,
  createdAt: r.created_at as string,
  resolvedAt: (r.resolved_at as string | null) ?? undefined,
});

export class SqliteStore implements LedgerStore {
  readonly kind = "sqlite" as const;
  private db: DatabaseSync;
  private seedDemo: boolean;

  constructor(file: string, opts: { seedDemo?: boolean; shop?: { id: string; name: string; upiVpa: string } } = {}) {
    const sqlite = process.getBuiltinModule("node:sqlite");
    if (!sqlite) throw new Error("node:sqlite is not available. Use Node 22.5 or newer.");
    if (file !== ":memory:") mkdirSync(path.dirname(path.resolve(file)), { recursive: true });
    this.db = new sqlite.DatabaseSync(file);
    this.seedDemo = opts.seedDemo ?? true;
    this.db.exec("PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 5000;");
    if (file !== ":memory:") this.db.exec("PRAGMA journal_mode = WAL;");
    this.db.exec(SCHEMA);
    // Existing owners retain their password and data. Legacy sessions intentionally expire on deploy.
    const ownerColumns = this.db.prepare("pragma table_info(owners)").all() as Row[];
    if (!ownerColumns.some((column) => column.name === "auth_version")) {
      this.db.exec("alter table owners add column auth_version integer not null default 0");
    }
    const customerColumns = this.db.prepare("pragma table_info(customers)").all() as Row[];
    if (!customerColumns.some((c) => c.name === "archived_at")) this.db.exec("alter table customers add column archived_at text");
    if (!ownerColumns.some((c) => c.name === "mobile_key")) this.db.exec("alter table owners add column mobile_key text");
    try { this.tx(() => {
      const owners = this.db.prepare("select shop_id, mobile from owners").all() as Row[];
      const seen = new Set<string>();
      for (const owner of owners) {
        const key = normalizedMobile(owner.mobile as string);
        if (seen.has(key)) throw new Error("duplicate_mobile");
        seen.add(key);
        this.db.prepare("update owners set mobile_key = ?, mobile = ? where shop_id = ?").run(key, key, owner.shop_id as string);
      }
      this.db.exec("create unique index if not exists owners_mobile_unique on owners(mobile_key)");
    }); } catch (error) { this.db.close(); throw error; }
    this.db.exec(`create table if not exists products (
      id text primary key, shop_id text not null references shops(id) on delete cascade, payload text not null
    );
    create index if not exists products_shop on products(shop_id);
    create table if not exists stock_movements (
      id text primary key, shop_id text not null references shops(id) on delete cascade,
      product_id text not null references products(id) on delete cascade,
      idempotency_key text not null, reversal_of text, payload text not null,
      unique(shop_id, idempotency_key), unique(shop_id, reversal_of)
    );
    create index if not exists movements_shop on stock_movements(shop_id, product_id);
    create table if not exists registration_challenges (id text primary key, payload text not null);`);
    const any = this.db.prepare("select count(*) as n from shops").get() as { n: number };
    if (any.n === 0) {
      if (opts.shop) this.db.prepare("insert into shops (id, name, upi_vpa, is_demo) values (?, ?, ?, 0)").run(opts.shop.id, opts.shop.name, opts.shop.upiVpa);
      else if (this.seedDemo) this.seed();
    }
  }

  close() {
    this.db.close();
  }

  private tx<T>(fn: () => T): T {
    this.db.exec("BEGIN IMMEDIATE");
    try {
      const out = fn();
      this.db.exec("COMMIT");
      return out;
    } catch (e) {
      this.db.exec("ROLLBACK");
      throw e;
    }
  }

  private seed() {
    this.tx(() => {
      this.db.prepare("insert into shops (id, name, upi_vpa, is_demo) values (?, ?, ?, ?)").run(SEED_SHOP.id, SEED_SHOP.name, SEED_SHOP.upiVpa, SEED_SHOP.isDemo ? 1 : 0);
      const c = this.db.prepare("insert into customers (id, shop_id, display_name, area, name_roman, name_devanagari, aliases) values (?, ?, ?, ?, ?, ?, ?)");
      for (const x of SEED_CUSTOMERS) c.run(x.id, x.shopId, x.name, x.area ?? null, x.nameRoman, x.nameDevanagari ?? null, JSON.stringify(x.aliases));
      const e = this.db.prepare(
        "insert into entries (id, shop_id, customer_id, type, amount_paise, note, source_text, source, idempotency_key, confirmed_at) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      );
      for (const x of SEED_ENTRIES) e.run(x.id, x.shopId, x.customerId, x.type, x.amountPaise, x.note ?? null, x.sourceText, x.source, x.idempotencyKey, x.confirmedAt);
      const f = this.db.prepare("insert into stock_flags (id, shop_id, item_name, level, source_text, created_at) values (?, ?, ?, ?, ?, ?)");
      for (const x of SEED_STOCK) f.run(x.id, x.shopId, x.itemName, x.level, x.sourceText ?? null, x.createdAt);
    });
  }

  async getShop(shopId: string) {
    const r = this.db.prepare("select * from shops where id = ?").get(shopId) as Row | undefined;
    return r ? toShop(r) : null;
  }

  async updateShop(shopId: string, patch: { name: string; upiVpa: string }) {
    this.db.prepare("update shops set name = ?, upi_vpa = ? where id = ?").run(patch.name, patch.upiVpa, shopId);
    return this.getShop(shopId);
  }

  async listCustomers(shopId: string) {
    return (this.db.prepare("select * from customers where shop_id = ? order by rowid").all(shopId) as Row[]).map(toCustomer);
  }

  async createCustomer(input: Omit<Customer, "id">) {
    const id = randomUUID();
    this.db
      .prepare("insert into customers (id, shop_id, display_name, area, name_roman, name_devanagari, aliases, phone_e164) values (?, ?, ?, ?, ?, ?, ?, ?)")
      .run(id, input.shopId, input.name, input.area ?? null, input.nameRoman, input.nameDevanagari ?? null, JSON.stringify(input.aliases), input.phoneE164 ?? null);
    if (input.archivedAt) this.db.prepare("update customers set archived_at = ? where id = ?").run(input.archivedAt, id);
    return { ...input, id };
  }

  async listEntries(shopId: string) {
    return (this.db.prepare("select * from entries where shop_id = ? order by rowid").all(shopId) as Row[]).map(toEntry);
  }

  async insertEntry(entry: Omit<Entry, "id">) {
    if (!Number.isInteger(entry.amountPaise) || entry.amountPaise <= 0) throw new Error("amountPaise must be a positive integer");
    const id = randomUUID();
    const res = this.db
      .prepare(
        `insert into entries (id, shop_id, customer_id, type, amount_paise, note, source_text, source, idempotency_key, confirmed_at)
         values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?) on conflict (shop_id, idempotency_key) do nothing`,
      )
      .run(id, entry.shopId, entry.customerId, entry.type, entry.amountPaise, entry.note ?? null, entry.sourceText, entry.source, entry.idempotencyKey, entry.confirmedAt);
    const row = this.db.prepare("select * from entries where shop_id = ? and idempotency_key = ?").get(entry.shopId, entry.idempotencyKey) as Row;
    return { entry: toEntry(row), created: Number(res.changes) === 1 };
  }

  async voidEntry(shopId: string, entryId: string, reason: string, at: string) {
    this.db.prepare("update entries set voided_at = ?, void_reason = ? where id = ? and shop_id = ? and voided_at is null").run(at, reason, entryId, shopId);
    const r = this.db.prepare("select * from entries where id = ? and shop_id = ?").get(entryId, shopId) as Row | undefined;
    return r ? toEntry(r) : null;
  }

  async listStockFlags(shopId: string) {
    return (this.db.prepare("select * from stock_flags where shop_id = ? order by rowid").all(shopId) as Row[]).map(toFlag);
  }

  async addStockFlag(flag: Omit<StockFlag, "id">) {
    const id = randomUUID();
    this.db.prepare("insert into stock_flags (id, shop_id, item_name, level, source_text, created_at) values (?, ?, ?, ?, ?, ?)").run(id, flag.shopId, flag.itemName, flag.level, flag.sourceText ?? null, flag.createdAt);
    return { ...flag, id };
  }

  async resolveStockFlag(shopId: string, flagId: string, at: string) {
    this.db.prepare("update stock_flags set resolved_at = ? where id = ? and shop_id = ?").run(at, flagId, shopId);
    const r = this.db.prepare("select * from stock_flags where id = ? and shop_id = ?").get(flagId, shopId) as Row | undefined;
    return r ? toFlag(r) : null;
  }

  async savePayToken(t: PayToken) {
    this.db.prepare("insert into pay_tokens (token, shop_id, customer_id, amount_paise, expires_at) values (?, ?, ?, ?, ?)").run(t.token, t.shopId, t.customerId, t.amountPaise, t.expiresAt);
  }

  async getPayToken(token: string) {
    const r = this.db.prepare("select * from pay_tokens where token = ?").get(token) as Row | undefined;
    return r ? { token: r.token as string, shopId: r.shop_id as string, customerId: r.customer_id as string, amountPaise: Number(r.amount_paise), expiresAt: r.expires_at as string } : null;
  }

  async getReminderDelivery(shopId: string, token: string): Promise<ReminderDelivery | null> {
    const row = this.db.prepare("select * from reminder_deliveries where shop_id = ? and token = ?").get(shopId, token) as Row | undefined;
    return row ? { shopId, token, fingerprint: row.fingerprint as string, status: row.status as ReminderDelivery["status"], createdAt: row.created_at as string, messageId: (row.message_id as string | null) ?? undefined, simulated: row.simulated === null ? undefined : row.simulated === 1 } : null;
  }

  async claimReminderDelivery(delivery: ReminderDelivery) {
    const result = this.db.prepare("insert or ignore into reminder_deliveries (shop_id, token, fingerprint, status, created_at) values (?, ?, ?, ?, ?)").run(delivery.shopId, delivery.token, delivery.fingerprint, "pending", delivery.createdAt);
    return { delivery: (await this.getReminderDelivery(delivery.shopId, delivery.token))!, claimed: Number(result.changes) === 1 };
  }

  async finishReminderDelivery(shopId: string, token: string, result: Pick<ReminderDelivery, "status" | "messageId" | "simulated">) {
    this.db.prepare("update reminder_deliveries set status = ?, message_id = ?, simulated = ? where shop_id = ? and token = ?").run(result.status, result.messageId ?? null, result.simulated === undefined ? null : result.simulated ? 1 : 0, shopId, token);
  }

  async appendAudit(shopId: string, kind: string, payload: Record<string, unknown>, at: string) {
    this.db.prepare("insert into audit_events (shop_id, kind, payload, created_at) values (?, ?, ?, ?)").run(shopId, kind, JSON.stringify(payload), at);
    this.db.prepare("delete from audit_events where kind = ? and created_at < ?").run(UNCONFIRMED_AUDIT_KIND, retentionCutoff(at));
  }

  async listAudit(shopId: string, limit: number): Promise<AuditEvent[]> {
    const rows = this.db.prepare("select * from audit_events where shop_id = ? order by id desc limit ?").all(shopId, limit) as Row[];
    return rows.map((r) => ({ id: Number(r.id), shopId: r.shop_id as string, kind: r.kind as string, payload: JSON.parse(r.payload as string) as Record<string, unknown>, createdAt: r.created_at as string }));
  }

  async eraseShop(shopId: string): Promise<EraseCounts> {
    const n = (sql: string) => Number((this.db.prepare(sql).get(shopId) as { n: number }).n);
    return this.tx(() => {
      const counts = {
        customers: n("select count(*) as n from customers where shop_id = ?"),
        entries: n("select count(*) as n from entries where shop_id = ?"),
        stockFlags: n("select count(*) as n from stock_flags where shop_id = ?"),
        payTokens: n("select count(*) as n from pay_tokens where shop_id = ?"),
        auditEvents: n("select count(*) as n from audit_events where shop_id = ?"),
      };
      for (const t of ["stock_movements", "products", "reminder_deliveries", "pay_tokens", "entries", "stock_flags", "audit_events", "customers"]) this.db.prepare(`delete from ${t} where shop_id = ?`).run(shopId);
      this.db.prepare("delete from registration_challenges where json_extract(payload, '$.resultShopId') = ? or json_extract(payload, '$.mobile') = (select mobile from owners where shop_id = ?)").run(shopId, shopId);
      return counts;
    });
  }

  async createShop(shop: Shop) {
    this.db.prepare("insert or ignore into shops (id, name, upi_vpa, is_demo) values (?, ?, ?, ?)").run(shop.id, shop.name, shop.upiVpa, shop.isDemo ? 1 : 0);
  }

  async getOwner(shopId: string) {
    const r = this.db.prepare("select * from owners where shop_id = ?").get(shopId) as Row | undefined;
    return r ? ({ shopId: r.shop_id, name: r.name, mobile: r.mobile, passcodeHash: r.passcode_hash, authVersion: Number(r.auth_version), createdAt: r.created_at } as OwnerRecord) : null;
  }

  async createOwner(o: OwnerRecord) {
    this.insertOwner(o);
  }

  async setPasscodeHash(shopId: string, passcodeHash: string) {
    this.db.prepare("update owners set passcode_hash = ?, auth_version = auth_version + 1 where shop_id = ?").run(passcodeHash, shopId);
  }

  async revokeOwnerSessions(shopId: string) {
    this.db.prepare("update owners set auth_version = auth_version + 1 where shop_id = ?").run(shopId);
  }


  private allOwners(): OwnerRecord[] {
    return (this.db.prepare("select * from owners").all() as Row[]).map((r) => ({ shopId: r.shop_id as string, name: r.name as string, mobile: r.mobile as string, passcodeHash: r.passcode_hash as string, authVersion: Number(r.auth_version), createdAt: r.created_at as string }));
  }
  private insertOwner(o: OwnerRecord) {
    if (ownerByMobile(this.allOwners(), o.mobile)) throw new Error("duplicate_mobile");
    this.db.prepare("insert into owners (shop_id,name,mobile,mobile_key,passcode_hash,auth_version,created_at) values (?,?,?,?,?,?,?)").run(o.shopId,o.name,normalizedMobile(o.mobile),normalizedMobile(o.mobile),o.passcodeHash,o.authVersion,o.createdAt);
  }
  async hasOwners() { return Boolean((this.db.prepare("select 1 from owners limit 1").get())); }
  async getOwnerByMobile(mobile: string) { return ownerByMobile(this.allOwners(), mobile); }
  async createRegisteredShop(shop: Shop, owner: OwnerRecord) {
    this.tx(() => {
      if (shop.id !== owner.shopId) throw new Error("invalid_registration");
      if (ownerByMobile(this.allOwners(), owner.mobile)) throw new Error("duplicate_mobile");
      this.db.prepare("insert into shops (id,name,upi_vpa,is_demo) values (?,?,?,?)").run(shop.id,shop.name,shop.upiVpa,shop.isDemo ? 1 : 0);
      this.insertOwner(owner);
    });
  }
  private registration(id: string): RegistrationChallenge | null {
    const row = this.db.prepare("select payload from registration_challenges where id = ?").get(id) as Row | undefined;
    return row ? JSON.parse(row.payload as string) as RegistrationChallenge : null;
  }
  async getRegistration(id: string) { return this.registration(id); }
  async createRegistration(input: RegistrationChallenge) {
    this.db.prepare("insert into registration_challenges (id,payload) values (?,?)").run(input.id, JSON.stringify({ ...input, mobile: normalizedMobile(input.mobile) }));
  }
  async pruneRegistrations(before: string) {
    const cutoff = Date.parse(before);
    if (!Number.isFinite(cutoff)) throw new Error("invalid_registration_cutoff");
    this.tx(() => {
      const rows = this.db.prepare("select id,payload from registration_challenges").all() as Row[];
      const remove = this.db.prepare("delete from registration_challenges where id = ?");
      for (const row of rows) if (!(Date.parse((JSON.parse(row.payload as string) as RegistrationChallenge).expiresAt) > cutoff)) remove.run(row.id as string);
    });
  }
  async transitionRegistration(id: string, browserHash: string, from: RegistrationChallenge["state"], to: RegistrationChallenge["state"]) {
    return this.tx(() => {
      const row = this.registration(id);
      if (!row || row.browserHash !== browserHash || row.state !== from) return false;
      const allowed = (from === "requested" && (to === "verifying" || to === "failed")) || (from === "verifying" && (to === "verified" || to === "failed" || to === "requested"));
      if (!allowed) return false;
      if (to === "verifying") { if ((row.verifyAttempts ?? 0) >= 5) return false; row.verifyAttempts = (row.verifyAttempts ?? 0) + 1; }
    row.state = to; if (to === "verified") row.providerVerified = true;
      this.db.prepare("update registration_challenges set payload = ? where id = ?").run(JSON.stringify(row),id); return true;
    });
  }
  async completeRegistration(input: CompleteRegistrationInput) {
    return this.tx(() => {
      const challenge = this.registration(input.id);
      const result = completeProof(challenge, this.allOwners(), input);
      if (result.replay) return { owner: result.owner, created: false };
      if (result.created) {
        const shop = input.shop!;
        this.db.prepare("insert into shops (id,name,upi_vpa,is_demo) values (?,?,?,?)").run(shop.id,shop.name,shop.upiVpa,shop.isDemo ? 1 : 0);
        this.insertOwner(result.owner);
      } else if (challenge!.purpose === "recovery") {
        this.db.prepare("update owners set passcode_hash = ?,auth_version = ? where shop_id = ?").run(result.owner.passcodeHash,result.owner.authVersion,result.owner.shopId);
      }
      Object.assign(challenge!, { state: "completed", resultShopId: result.owner.shopId, resultAuthVersion: result.owner.authVersion });
      this.db.prepare("update registration_challenges set payload = ? where id = ?").run(JSON.stringify(challenge),input.id);
      return { owner: result.owner, created: result.created };
    });
  }
  async updateCustomer(shopId: string, id: string, patch: CustomerPatch) {
    return this.tx(() => {
      const row = this.db.prepare("select * from customers where id = ? and shop_id = ?").get(id,shopId) as Row | undefined;
      if (!row) return null;
      const next = { ...toCustomer(row), ...patch };
      this.db.prepare("update customers set display_name=?,area=?,name_roman=?,name_devanagari=?,aliases=?,phone_e164=?,archived_at=? where id=? and shop_id=?").run(next.name,next.area ?? null,next.nameRoman,next.nameDevanagari ?? null,JSON.stringify(next.aliases),next.phoneE164 ?? null,next.archivedAt ?? null,id,shopId);
      return next;
    });
  }
  private products(shopId: string): Product[] { return (this.db.prepare("select payload from products where shop_id = ? order by rowid").all(shopId) as Row[]).map((r) => JSON.parse(r.payload as string) as Product); }
  async listProducts(shopId: string) { return this.products(shopId); }
  async createProduct(input: Omit<Product,"id"|"version">) {
    validateProduct(input);
    if (input.onHandMinor !== null) throw new Error("opening_required"); const row = { ...input, id: randomUUID(), version: 0 };
    this.db.prepare("insert into products (id,shop_id,payload) values (?,?,?)").run(row.id,row.shopId,JSON.stringify(row)); return row;
  }
  async updateProduct(shopId: string, id: string, patch: ProductPatch, expectedVersion: number) {
    return this.tx(() => {
      const row = this.products(shopId).find((p) => p.id === id); if (!row) return null;
      if (row.version !== expectedVersion) throw new Error("version_conflict");
      const next = { ...row, ...patch, version: row.version + 1 }; validateProduct(next);
      this.db.prepare("update products set payload = ? where id = ? and shop_id = ?").run(JSON.stringify(next),id,shopId); return next;
    });
  }
  private movements(shopId: string, productId?: string): StockMovement[] {
    return (this.db.prepare("select payload from stock_movements where shop_id = ? order by rowid").all(shopId) as Row[]).map((r) => JSON.parse(r.payload as string) as StockMovement).filter((m) => !productId || m.productId === productId);
  }
  async listMovements(shopId: string, productId?: string) { return this.movements(shopId,productId); }
  async applyMovement(input: MovementInput) {
    return this.tx(() => {
      const product = this.products(input.shopId).find((p) => p.id === input.productId); if (!product) throw new Error("product_not_found");
      const result = movementResult(product,this.movements(input.shopId),input);
      if (result.created) {
        this.db.prepare("insert into stock_movements (id,shop_id,product_id,idempotency_key,reversal_of,payload) values (?,?,?,?,?,?)").run(result.movement.id,input.shopId,input.productId,input.idempotencyKey,input.reversalOf ?? null,JSON.stringify(result.movement));
        this.db.prepare("update products set payload = ? where id = ? and shop_id = ?").run(JSON.stringify(result.product),input.productId,input.shopId);
      }
      return result;
    });
  }

  async reset() {
    this.tx(() => {
      for (const t of ["registration_challenges", "stock_movements", "products", "owners", "reminder_deliveries", "pay_tokens", "entries", "stock_flags", "audit_events", "customers", "shops"]) this.db.exec(`delete from ${t}`);
    });
    if (this.seedDemo) this.seed();
  }
}
