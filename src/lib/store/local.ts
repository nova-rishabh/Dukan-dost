import { randomUUID } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { SEED_CUSTOMERS, SEED_ENTRIES, SEED_SHOP, SEED_STOCK } from "../seed";
import { retentionCutoff, UNCONFIRMED_AUDIT_KIND } from "./retention";
import type { AuditEvent, Customer, Entry, OwnerRecord, PayToken, Shop, StockFlag } from "../types";
import type { LedgerStore } from "./types";

interface State {
  shops: Shop[];
  customers: Customer[];
  entries: Entry[];
  stock: StockFlag[];
  tokens: PayToken[];
  audit: AuditEvent[];
  nextAuditId: number;
  owners: OwnerRecord[];
}

const seedState = (): State => ({
  shops: [{ ...SEED_SHOP }],
  customers: SEED_CUSTOMERS.map((c) => ({ ...c, aliases: [...c.aliases] })),
  entries: SEED_ENTRIES.map((e) => ({ ...e })),
  stock: SEED_STOCK.map((s) => ({ ...s })),
  tokens: [],
  audit: [],
  nextAuditId: 1,
  owners: [],
});

/** In-memory store with optional JSON-file persistence. The keyless demo default and the test double; SqliteStore is the durable store. */
export class LocalStore implements LedgerStore {
  readonly kind = "local" as const;
  private state: State;
  private file: string | null;

  constructor(opts: { file: string | null }) {
    this.file = opts.file ? path.resolve(opts.file) : null;
    this.state = this.load();
  }

  private load(): State {
    if (this.file && existsSync(this.file)) {
      try {
        const loaded = JSON.parse(readFileSync(this.file, "utf8")) as State;
        loaded.owners ??= [];
        return loaded;
      } catch {
        // corrupt file: fall through to the seed
      }
    }
    return seedState();
  }

  private persist() {
    if (!this.file) return;
    try {
      mkdirSync(path.dirname(this.file), { recursive: true });
      writeFileSync(this.file, JSON.stringify(this.state));
    } catch {
      // read-only filesystem (serverless): keep working in memory
    }
  }

  async getShop(shopId: string) {
    return this.state.shops.find((s) => s.id === shopId) ?? null;
  }

  async listCustomers(shopId: string) {
    return this.state.customers.filter((c) => c.shopId === shopId);
  }

  async createCustomer(input: Omit<Customer, "id">) {
    const customer: Customer = { ...input, id: randomUUID() };
    this.state.customers.push(customer);
    this.persist();
    return customer;
  }

  async listEntries(shopId: string) {
    return this.state.entries.filter((e) => e.shopId === shopId);
  }

  async insertEntry(entry: Omit<Entry, "id">) {
    if (!Number.isInteger(entry.amountPaise) || entry.amountPaise <= 0) throw new Error("amountPaise must be a positive integer");
    const existing = this.state.entries.find((e) => e.shopId === entry.shopId && e.idempotencyKey === entry.idempotencyKey);
    if (existing) return { entry: existing, created: false };
    const row: Entry = { ...entry, id: randomUUID() };
    this.state.entries.push(row);
    this.persist();
    return { entry: row, created: true };
  }

  async voidEntry(shopId: string, entryId: string, reason: string, at: string) {
    const e = this.state.entries.find((x) => x.id === entryId && x.shopId === shopId);
    if (!e || e.voidedAt) return e ?? null;
    e.voidedAt = at;
    e.voidReason = reason;
    this.persist();
    return e;
  }

  async listStockFlags(shopId: string) {
    return this.state.stock.filter((s) => s.shopId === shopId);
  }

  async addStockFlag(flag: Omit<StockFlag, "id">) {
    const row: StockFlag = { ...flag, id: randomUUID() };
    this.state.stock.push(row);
    this.persist();
    return row;
  }

  async resolveStockFlag(shopId: string, flagId: string, at: string) {
    const f = this.state.stock.find((s) => s.id === flagId && s.shopId === shopId);
    if (!f) return null;
    f.resolvedAt = at;
    this.persist();
    return f;
  }

  async savePayToken(token: PayToken) {
    this.state.tokens.push(token);
    this.persist();
  }

  async getPayToken(token: string) {
    return this.state.tokens.find((t) => t.token === token) ?? null;
  }

  async appendAudit(shopId: string, kind: string, payload: Record<string, unknown>, at: string) {
    this.state.audit.push({ id: this.state.nextAuditId++, shopId, kind, payload, createdAt: at });
    const cutoff = retentionCutoff(at);
    this.state.audit = this.state.audit.filter((a) => !(a.kind === UNCONFIRMED_AUDIT_KIND && a.createdAt < cutoff));
    if (this.state.audit.length > 500) this.state.audit.splice(0, this.state.audit.length - 500);
    this.persist();
  }

  async eraseShop(shopId: string) {
    const s = this.state;
    const counts = {
      customers: s.customers.filter((x) => x.shopId === shopId).length,
      entries: s.entries.filter((x) => x.shopId === shopId).length,
      stockFlags: s.stock.filter((x) => x.shopId === shopId).length,
      payTokens: s.tokens.filter((x) => x.shopId === shopId).length,
      auditEvents: s.audit.filter((x) => x.shopId === shopId).length,
    };
    s.customers = s.customers.filter((x) => x.shopId !== shopId);
    s.entries = s.entries.filter((x) => x.shopId !== shopId);
    s.stock = s.stock.filter((x) => x.shopId !== shopId);
    s.tokens = s.tokens.filter((x) => x.shopId !== shopId);
    s.audit = s.audit.filter((x) => x.shopId !== shopId);
    this.persist();
    return counts;
  }

  async listAudit(shopId: string, limit: number) {
    return this.state.audit
      .filter((a) => a.shopId === shopId)
      .slice(-limit)
      .reverse();
  }

  async createShop(shop: Shop) {
    if (!this.state.shops.some((x) => x.id === shop.id)) {
      this.state.shops.push({ ...shop });
      this.persist();
    }
  }

  async getOwner(shopId: string) {
    return this.state.owners.find((o) => o.shopId === shopId) ?? null;
  }

  async createOwner(owner: OwnerRecord) {
    if (this.state.owners.some((o) => o.shopId === owner.shopId)) throw new Error("owner already exists");
    this.state.owners.push({ ...owner });
    this.persist();
  }

  async setPasscodeHash(shopId: string, passcodeHash: string) {
    const o = this.state.owners.find((x) => x.shopId === shopId);
    if (o) o.passcodeHash = passcodeHash;
    this.persist();
  }

  async reset() {
    this.state = seedState();
    this.persist();
  }
}
