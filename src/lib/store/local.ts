import { businessSnapshot, remapSnapshot, snapshotDigest, type BusinessSnapshot } from "../shop-transfer";
import { randomUUID } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { SEED_CUSTOMERS, SEED_ENTRIES, SEED_SHOP, SEED_STOCK } from "../seed";
import { retentionCutoff, UNCONFIRMED_AUDIT_KIND } from "./retention";
import type { AuditEvent, Product, StockMovement, RegistrationChallenge, Customer, Entry, OwnerRecord, PayToken, ReminderDelivery, Shop, StockFlag } from "../types";
import { mobileChangeResult, completeProof, movementResult, normalizedMobile, ownerByMobile, validateProduct } from "./operations";
import type { CompleteRegistrationInput, CustomerPatch, MovementInput, ProductPatch, LedgerStore } from "./types";

interface State {
  rateLimits: Record<string, number[]>;
  imports: { shopId: string; digest: string }[];
  products: Product[];
  movements: StockMovement[];
  registrations: RegistrationChallenge[];
  shops: Shop[];
  customers: Customer[];
  entries: Entry[];
  stock: StockFlag[];
  tokens: PayToken[];
  audit: AuditEvent[];
  nextAuditId: number;
  owners: OwnerRecord[];
  deliveries: ReminderDelivery[];
}

const seedState = (): State => ({
  rateLimits: {}, imports: [],
  products: [], movements: [], registrations: [],
  shops: [{ ...SEED_SHOP }],
  customers: SEED_CUSTOMERS.map((c) => ({ ...c, aliases: [...c.aliases] })),
  entries: SEED_ENTRIES.map((e) => ({ ...e })),
  stock: SEED_STOCK.map((s) => ({ ...s })),
  tokens: [],
  audit: [],
  nextAuditId: 1,
  owners: [],
  deliveries: [],
});

/** In-memory store with optional JSON-file persistence. The keyless demo default and the test double; SqliteStore is the durable store. */
export class LocalStore implements LedgerStore {
  readonly kind = "local" as const;
  private state: State;
  private file: string | null;

  constructor(opts: { file: string | null }) {
    this.file = opts.file ? path.resolve(opts.file) : null;
    this.state = this.load();
    const seen = new Set<string>();
    for (const owner of this.state.owners) {
      const key = normalizedMobile(owner.mobile);
      if (seen.has(key)) throw new Error("duplicate_mobile");
      seen.add(key); owner.mobile = key;
    }
  }

  private load(): State {
    if (this.file && existsSync(this.file)) {
      try {
        const loaded = JSON.parse(readFileSync(this.file, "utf8")) as State;
        loaded.rateLimits ??= {}; loaded.imports ??= [];
        loaded.products ??= []; loaded.movements ??= []; loaded.registrations ??= [];
        loaded.owners ??= [];
        loaded.deliveries ??= [];
        for (const owner of loaded.owners) owner.authVersion ??= 0;
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

  async updateShop(shopId: string, patch: { name: string; upiVpa: string }, expectedAuthVersion?: number) {
    if (expectedAuthVersion !== undefined && this.state.owners.find((o) => o.shopId === shopId)?.authVersion !== expectedAuthVersion) throw new Error("stale_owner");
    const row = this.state.shops.find((s) => s.id === shopId);
    if (!row) return null;
    Object.assign(row, patch); this.persist(); return { ...row };
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

  async getReminderDelivery(shopId: string, token: string) {
    return this.state.deliveries.find((d) => d.shopId === shopId && d.token === token) ?? null;
  }

  async claimReminderDelivery(delivery: ReminderDelivery) {
    const existing = this.state.deliveries.find((d) => d.shopId === delivery.shopId && d.token === delivery.token);
    if (existing) return { delivery: existing, claimed: false };
    this.state.deliveries.push({ ...delivery });
    this.persist();
    return { delivery, claimed: true };
  }

  async finishReminderDelivery(shopId: string, token: string, result: Pick<ReminderDelivery, "status" | "messageId" | "simulated">) {
    const delivery = this.state.deliveries.find((d) => d.shopId === shopId && d.token === token);
    if (delivery) Object.assign(delivery, result);
    this.persist();
  }

  async appendAudit(shopId: string, kind: string, payload: Record<string, unknown>, at: string) {
    this.state.audit.push({ id: this.state.nextAuditId++, shopId, kind, payload, createdAt: at });
    const cutoff = retentionCutoff(at);
    this.state.audit = this.state.audit.filter((a) => !(a.kind === UNCONFIRMED_AUDIT_KIND && a.createdAt < cutoff));
    if (this.state.audit.length > 500) this.state.audit.splice(0, this.state.audit.length - 500);
    this.persist();
  }

  async eraseShop(shopId: string, expectedAuthVersion?: number) {
    const s = this.state;
    if (expectedAuthVersion !== undefined && s.owners.find((owner) => owner.shopId === shopId)?.authVersion !== expectedAuthVersion) throw new Error("stale_owner");
    const counts = {
      customers: s.customers.filter((x) => x.shopId === shopId).length,
      entries: s.entries.filter((x) => x.shopId === shopId).length,
      stockFlags: s.stock.filter((x) => x.shopId === shopId).length,
      payTokens: s.tokens.filter((x) => x.shopId === shopId).length,
      auditEvents: s.audit.filter((x) => x.shopId === shopId).length,
    };
    s.products = s.products.filter((x) => x.shopId !== shopId);
    s.movements = s.movements.filter((x) => x.shopId !== shopId);
    const ownerMobile = s.owners.find((o) => o.shopId === shopId)?.mobile;
    s.imports = s.imports.filter((x) => x.shopId !== shopId);
    s.registrations = s.registrations.filter((x) => x.resultShopId !== shopId && x.ownerShopId !== shopId && (!ownerMobile || x.mobile !== ownerMobile));
    s.customers = s.customers.filter((x) => x.shopId !== shopId);
    s.entries = s.entries.filter((x) => x.shopId !== shopId);
    s.stock = s.stock.filter((x) => x.shopId !== shopId);
    s.deliveries = s.deliveries.filter((x) => x.shopId !== shopId);
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
    const owner = this.state.owners.find((o) => o.shopId === shopId);
    return owner ? { ...owner } : null;
  }

  async createOwner(owner: OwnerRecord) {
    if (this.state.owners.some((o) => o.shopId === owner.shopId)) throw new Error("owner already exists");
    if (ownerByMobile(this.state.owners, owner.mobile)) throw new Error("duplicate_mobile");
    this.state.owners.push({ ...owner, mobile: normalizedMobile(owner.mobile) });
    this.persist();
  }

  async setPasscodeHash(shopId: string, passcodeHash: string) {
    const o = this.state.owners.find((x) => x.shopId === shopId);
    if (o) { o.passcodeHash = passcodeHash; o.authVersion++; }
    this.persist();
  }

  async revokeOwnerSessions(shopId: string) {
    const owner = this.state.owners.find((o) => o.shopId === shopId);
    if (owner) owner.authVersion++;
    this.persist();
  }


  async hasOwners() { return this.state.owners.length > 0; }
  async getOwnerByMobile(mobile: string) { return ownerByMobile(this.state.owners, mobile); }
  async createRegisteredShop(shop: Shop, owner: OwnerRecord) {
    if (shop.id !== owner.shopId) throw new Error("invalid_registration");
    if (ownerByMobile(this.state.owners, owner.mobile)) throw new Error("duplicate_mobile");
    if (this.state.shops.some((s) => s.id === shop.id) || this.state.owners.some((o) => o.shopId === shop.id)) throw new Error("shop_exists");
    this.state.shops.push({ ...shop });
    this.state.owners.push({ ...owner, mobile: normalizedMobile(owner.mobile) });
    this.persist();
  }
  async getRegistration(id: string) { const row = this.state.registrations.find((r) => r.id === id); return row ? { ...row } : null; }
  async createRegistration(input: RegistrationChallenge) {
    if (this.state.registrations.some((r) => r.id === input.id)) throw new Error("registration_exists");
    this.state.registrations.push({ ...input, mobile: normalizedMobile(input.mobile) }); this.persist();
  }
  async pruneRegistrations(before: string) {
    const cutoff = Date.parse(before);
    if (!Number.isFinite(cutoff)) throw new Error("invalid_registration_cutoff");
    this.state.registrations = this.state.registrations.filter((row) => Date.parse(row.expiresAt) > cutoff);
    this.persist();
  }
  async transitionRegistration(id: string, browserHash: string, from: RegistrationChallenge["state"], to: RegistrationChallenge["state"]) {
    const row = this.state.registrations.find((r) => r.id === id && r.browserHash === browserHash && r.state === from);
    if (!row) return false;
    const allowed = (from === "requested" && (to === "verifying" || to === "failed")) || (from === "verifying" && (to === "verified" || to === "failed" || to === "requested"));
    if (!allowed) return false;
    if (to === "verifying") { if ((row.verifyAttempts ?? 0) >= 5) return false; row.verifyAttempts = (row.verifyAttempts ?? 0) + 1; }
    row.state = to; if (to === "verified") row.providerVerified = true; this.persist(); return true;
  }
  async completeRegistration(input: CompleteRegistrationInput) {
    const challenge = this.state.registrations.find((r) => r.id === input.id) ?? null;
    const result = completeProof(challenge, this.state.owners, input);
    if (result.replay) return { owner: result.owner, created: false };
    if (result.created) {
      if (this.state.shops.some((s) => s.id === input.shop!.id)) throw new Error("shop_exists");
      this.state.shops.push({ ...input.shop! }); this.state.owners.push(result.owner);
    } else {
      const index = this.state.owners.findIndex((o) => o.shopId === result.owner.shopId);
      this.state.owners[index] = result.owner;
    }
    Object.assign(challenge!, { state: "completed", resultShopId: result.owner.shopId, resultAuthVersion: result.owner.authVersion });
    this.persist(); return { owner: { ...result.owner }, created: result.created };
  }
  async updateCustomer(shopId: string, id: string, patch: CustomerPatch) {
    const row = this.state.customers.find((c) => c.shopId === shopId && c.id === id);
    if (!row) return null; Object.assign(row, patch); this.persist(); return { ...row, aliases: [...row.aliases] };
  }
  async listProducts(shopId: string) { return this.state.products.filter((p) => p.shopId === shopId).map((p) => ({ ...p })); }
  async createProduct(input: Omit<Product, "id" | "version">) {
    validateProduct(input);
    if (input.onHandMinor !== null) throw new Error("opening_required");
    if (!this.state.shops.some((s) => s.id === input.shopId)) throw new Error("shop_not_found");
    const row = { ...input, id: randomUUID(), version: 0 }; this.state.products.push(row); this.persist(); return { ...row };
  }
  async updateProduct(shopId: string, id: string, patch: ProductPatch, expectedVersion: number) {
    const row = this.state.products.find((p) => p.id === id && p.shopId === shopId);
    if (!row) return null;
    if (row.version !== expectedVersion) throw new Error("version_conflict");
    const next = { ...row, ...patch }; validateProduct(next); Object.assign(row, next, { version: row.version + 1 }); this.persist(); return { ...row };
  }
  async listMovements(shopId: string, productId?: string) { return this.state.movements.filter((m) => m.shopId === shopId && (!productId || m.productId === productId)).map((m) => ({ ...m })); }
  async applyMovement(input: MovementInput) {
    const index = this.state.products.findIndex((p) => p.id === input.productId && p.shopId === input.shopId);
    if (index < 0) throw new Error("product_not_found");
    const result = movementResult(this.state.products[index], this.state.movements, input);
    if (result.created) { this.state.products[index] = result.product; this.state.movements.push(result.movement); this.persist(); }
    return structuredClone(result);
  }

  async consumeRateLimit(key: string, limit: number, windowMs: number, now: number) {
    const hits = (this.state.rateLimits[key] ?? []).filter((at) => at > now - windowMs);
    if (hits.length >= limit) return { allowed: false, retryAfterMs: Math.max(1, hits[0] + windowMs - now) };
    hits.push(now); this.state.rateLimits[key] = hits;
    for (const [k, values] of Object.entries(this.state.rateLimits)) if (!values.some((at) => at > now - 86400000)) delete this.state.rateLimits[k];
    this.persist(); return { allowed: true, retryAfterMs: 0 };
  }
  private snapshot(shopId: string) {
    const shop = this.state.shops.find((row) => row.id === shopId); if (!shop) throw new Error("shop_not_found");
    return businessSnapshot(shop.name, { customers: this.state.customers.filter((r) => r.shopId === shopId), entries: this.state.entries.filter((r) => r.shopId === shopId), products: this.state.products.filter((r) => r.shopId === shopId), movements: this.state.movements.filter((r) => r.shopId === shopId), stockFlags: this.state.stock.filter((r) => r.shopId === shopId) });
  }
  async exportBusiness(shopId: string) { return this.snapshot(shopId); }
  async importBusiness(shopId: string, input: BusinessSnapshot, expectedFingerprint: string, expectedAuthVersion?: number) {
    if (expectedAuthVersion !== undefined && this.state.owners.find((o) => o.shopId === shopId)?.authVersion !== expectedAuthVersion) throw new Error("stale_owner");
    const records = remapSnapshot(input, shopId, snapshotDigest(input)); const digest = snapshotDigest(input);
    if (this.state.imports.some((r) => r.shopId === shopId && r.digest === digest)) return { created: false, customers: 0, entries: 0, products: 0 };
    if (snapshotDigest(this.snapshot(shopId)) !== expectedFingerprint) throw new Error("import_conflict");
    this.state.customers.push(...records.customers); this.state.entries.push(...records.entries); this.state.products.push(...records.products); this.state.movements.push(...records.movements); this.state.stock.push(...records.stockFlags); this.state.imports.push({ shopId, digest }); this.persist();
    return { created: true, customers: records.customers.length, entries: records.entries.length, products: records.products.length };
  }
  async completeMobileChange(input: { id: string; browserHash: string; shopId: string; expectedAuthVersion: number; now: string }) {
    const challenge = this.state.registrations.find((r) => r.id === input.id) ?? null;
    const owner = mobileChangeResult(challenge,this.state.owners,input);
    const old = this.state.owners.find((r) => r.shopId === input.shopId)!;
    this.state.registrations = this.state.registrations.filter((r) => r.id === input.id || (r.mobile !== old.mobile && r.ownerShopId !== input.shopId && r.resultShopId !== input.shopId));
    Object.assign(challenge!, { state: "completed", resultShopId: input.shopId, resultAuthVersion: owner.authVersion });
    this.state.owners[this.state.owners.indexOf(old)] = owner; this.state.audit.push({ id: this.state.nextAuditId++, shopId: input.shopId, kind: "owner_mobile_changed", payload: {}, createdAt: input.now }); this.persist(); return { ...owner };
  }
  async closeShop(shopId: string, expectedAuthVersion: number) {
    const owner = this.state.owners.find((r) => r.shopId === shopId);
    if (!owner || owner.authVersion !== expectedAuthVersion) throw new Error("stale_owner");
    const s = this.state;
    s.products = s.products.filter((r) => r.shopId !== shopId); s.movements = s.movements.filter((r) => r.shopId !== shopId); s.customers = s.customers.filter((r) => r.shopId !== shopId); s.entries = s.entries.filter((r) => r.shopId !== shopId); s.stock = s.stock.filter((r) => r.shopId !== shopId); s.deliveries = s.deliveries.filter((r) => r.shopId !== shopId); s.tokens = s.tokens.filter((r) => r.shopId !== shopId); s.audit = s.audit.filter((r) => r.shopId !== shopId); s.registrations = s.registrations.filter((r) => r.mobile !== owner.mobile && r.ownerShopId !== shopId && r.resultShopId !== shopId);
    this.state.owners = this.state.owners.filter((r) => r.shopId !== shopId); this.state.shops = this.state.shops.filter((r) => r.id !== shopId); this.state.imports = this.state.imports.filter((r) => r.shopId !== shopId); this.persist();
  }
  async listReminderHistory(shopId: string, limit: number) {
    return this.state.deliveries.filter((r) => r.shopId === shopId).sort((a,b) => b.createdAt.localeCompare(a.createdAt)).slice(0, limit).map((r) => { const token = this.state.tokens.find((t) => t.shopId === shopId && t.token === r.token); return { customerId: token?.customerId ?? "", amountPaise: token?.amountPaise ?? 0, status: r.status, createdAt: r.createdAt, simulated: r.simulated }; });
  }

  async reset() {
    this.state = seedState();
    this.persist();
  }
}
