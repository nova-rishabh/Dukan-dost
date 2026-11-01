import type { BusinessSnapshot } from "../shop-transfer";
import type { AuditEvent, Product, StockMovement, RegistrationChallenge, Customer, Entry, OwnerRecord, PayToken, ReminderDelivery, Shop, StockFlag } from "../types";

export interface EraseCounts {
  customers: number;
  entries: number;
  stockFlags: number;
  payTokens: number;
  auditEvents: number;
}

/**
 * Persistence boundary (ADR-018, ADR-023). "local" is the in-memory store with an optional JSON file
 * (keyless demo and tests). "sqlite" is a real database file (node:sqlite), no account or key needed.
 */
export interface LedgerStore {
  consumeRateLimit(key: string, limit: number, windowMs: number, now: number): Promise<{ allowed: boolean; retryAfterMs: number }>;
  exportBusiness(shopId: string): Promise<BusinessSnapshot>;
  importBusiness(shopId: string, input: BusinessSnapshot, expectedFingerprint: string, expectedAuthVersion?: number): Promise<{ created: boolean; customers: number; entries: number; products: number }>;
  closeShop(shopId: string, expectedAuthVersion: number): Promise<void>;
  completeMobileChange(input: { id: string; browserHash: string; shopId: string; expectedAuthVersion: number; now: string }): Promise<OwnerRecord>;
  listReminderHistory(shopId: string, limit: number): Promise<Array<{ customerId: string; amountPaise: number; status: string; createdAt: string; simulated?: boolean }>>;

  hasOwners(): Promise<boolean>;
  getOwnerByMobile(mobile: string): Promise<OwnerRecord | null>;
  createRegisteredShop(shop: Shop, owner: OwnerRecord): Promise<void>;
  getRegistration(id: string): Promise<RegistrationChallenge | null>;
  createRegistration(input: RegistrationChallenge): Promise<void>;
  pruneRegistrations(before: string): Promise<void>;
  transitionRegistration(id: string, browserHash: string, from: RegistrationChallenge["state"], to: RegistrationChallenge["state"]): Promise<boolean>;
  completeRegistration(input: CompleteRegistrationInput): Promise<{ owner: OwnerRecord; created: boolean }>;
  updateCustomer(shopId: string, id: string, patch: CustomerPatch): Promise<Customer | null>;
  listProducts(shopId: string): Promise<Product[]>;
  createProduct(input: Omit<Product, "id" | "version">): Promise<Product>;
  updateProduct(shopId: string, id: string, patch: ProductPatch, expectedVersion: number): Promise<Product | null>;
  listMovements(shopId: string, productId?: string): Promise<StockMovement[]>;
  applyMovement(input: MovementInput): Promise<{ product: Product; movement: StockMovement; created: boolean }>;
  readonly kind: "local" | "sqlite";
  getShop(shopId: string): Promise<Shop | null>;
  updateShop(shopId: string, patch: { name: string; upiVpa: string }, expectedAuthVersion?: number): Promise<Shop | null>;
  listCustomers(shopId: string): Promise<Customer[]>;
  createCustomer(input: Omit<Customer, "id">): Promise<Customer>;
  listEntries(shopId: string): Promise<Entry[]>;
  /** idempotent on (shopId, idempotencyKey): returns created=false with the existing row on a repeat */
  insertEntry(entry: Omit<Entry, "id">): Promise<{ entry: Entry; created: boolean }>;
  voidEntry(shopId: string, entryId: string, reason: string, at: string): Promise<Entry | null>;
  listStockFlags(shopId: string): Promise<StockFlag[]>;
  addStockFlag(flag: Omit<StockFlag, "id">): Promise<StockFlag>;
  resolveStockFlag(shopId: string, flagId: string, at: string): Promise<StockFlag | null>;
  savePayToken(token: PayToken): Promise<void>;
  getPayToken(token: string): Promise<PayToken | null>;
  getReminderDelivery(shopId: string, token: string): Promise<ReminderDelivery | null>;
  /** Atomically reserves a pay draft once; repeated attempts return the original reservation. */
  claimReminderDelivery(delivery: ReminderDelivery): Promise<{ delivery: ReminderDelivery; claimed: boolean }>;
  finishReminderDelivery(shopId: string, token: string, result: Pick<ReminderDelivery, "status" | "messageId" | "simulated">): Promise<void>;
  /** Appending also drops "proposal_shown" events (raw sentences nobody confirmed) older than 30 days. */
  appendAudit(shopId: string, kind: string, payload: Record<string, unknown>, at: string): Promise<void>;
  listAudit(shopId: string, limit: number): Promise<AuditEvent[]>;
  /** The owner's delete-my-data: removes the business data of the shop and keeps the shop row and the owner login. */
  eraseShop(shopId: string, expectedAuthVersion?: number): Promise<EraseCounts>;
  /** Creates the shop row if it does not exist yet (first-run setup of a real shop). */
  createShop(shop: Shop): Promise<void>;
  getOwner(shopId: string): Promise<OwnerRecord | null>;
  /** One owner per shop; throws if one already exists. */
  createOwner(owner: OwnerRecord): Promise<void>;
  setPasscodeHash(shopId: string, passcodeHash: string): Promise<void>;
  revokeOwnerSessions(shopId: string): Promise<void>;
  /** back to the seeded demo shop (demo only) */
  reset(): Promise<void>;
}

export type CustomerPatch = Partial<Pick<Customer, "name" | "nameRoman" | "nameDevanagari" | "area" | "aliases" | "phoneE164" | "archivedAt">>;
export type ProductPatch = Partial<Pick<Product, "name" | "lowThresholdMinor" | "archivedAt">>;
export type MovementInput = Omit<StockMovement, "id" | "deltaMinor"> & { expectedVersion: number };
export interface CompleteRegistrationInput {
  id: string;
  browserHash: string;
  now: string;
  shop?: Shop;
  owner?: OwnerRecord;
  nextPasscodeHash?: string;
}
