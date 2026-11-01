import { randomUUID } from "node:crypto";
import { mkdirSync } from "node:fs";
import path from "node:path";
import type { DatabaseSync } from "node:sqlite";
import { SEED_CUSTOMERS, SEED_ENTRIES, SEED_SHOP, SEED_STOCK } from "../seed";
import type { AuditEvent, Customer, Entry, OwnerRecord, PayToken, Shop, StockFlag } from "../types";
import { retentionCutoff, UNCONFIRMED_AUDIT_KIND } from "./retention";
import type { EraseCounts, LedgerStore } from "./types";

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
    this.db.exec("BEGIN");
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

  async listCustomers(shopId: string) {
    return (this.db.prepare("select * from customers where shop_id = ? order by rowid").all(shopId) as Row[]).map(toCustomer);
  }

  async createCustomer(input: Omit<Customer, "id">) {
    const id = randomUUID();
    this.db
      .prepare("insert into customers (id, shop_id, display_name, area, name_roman, name_devanagari, aliases, phone_e164) values (?, ?, ?, ?, ?, ?, ?, ?)")
      .run(id, input.shopId, input.name, input.area ?? null, input.nameRoman, input.nameDevanagari ?? null, JSON.stringify(input.aliases), input.phoneE164 ?? null);
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
      for (const t of ["pay_tokens", "entries", "stock_flags", "audit_events", "customers"]) this.db.prepare(`delete from ${t} where shop_id = ?`).run(shopId);
      return counts;
    });
  }

  async createShop(shop: Shop) {
    this.db.prepare("insert or ignore into shops (id, name, upi_vpa, is_demo) values (?, ?, ?, ?)").run(shop.id, shop.name, shop.upiVpa, shop.isDemo ? 1 : 0);
  }

  async getOwner(shopId: string) {
    const r = this.db.prepare("select * from owners where shop_id = ?").get(shopId) as Row | undefined;
    return r ? ({ shopId: r.shop_id, name: r.name, mobile: r.mobile, passcodeHash: r.passcode_hash, createdAt: r.created_at } as OwnerRecord) : null;
  }

  async createOwner(o: OwnerRecord) {
    this.db.prepare("insert into owners (shop_id, name, mobile, passcode_hash, created_at) values (?, ?, ?, ?, ?)").run(o.shopId, o.name, o.mobile, o.passcodeHash, o.createdAt);
  }

  async setPasscodeHash(shopId: string, passcodeHash: string) {
    this.db.prepare("update owners set passcode_hash = ? where shop_id = ?").run(passcodeHash, shopId);
  }

  async reset() {
    this.tx(() => {
      for (const t of ["owners", "pay_tokens", "entries", "stock_flags", "audit_events", "customers", "shops"]) this.db.exec(`delete from ${t}`);
    });
    if (this.seedDemo) this.seed();
  }
}
