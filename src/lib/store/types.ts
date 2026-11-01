import type { AuditEvent, Customer, Entry, PayToken, Shop, StockFlag } from "../types";

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
  readonly kind: "local" | "sqlite";
  getShop(shopId: string): Promise<Shop | null>;
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
  /** Appending also drops "proposal_shown" events (raw sentences nobody confirmed) older than 30 days. */
  appendAudit(shopId: string, kind: string, payload: Record<string, unknown>, at: string): Promise<void>;
  listAudit(shopId: string, limit: number): Promise<AuditEvent[]>;
  /** The owner's delete-my-data: removes every row that belongs to the shop and keeps the shop itself. */
  eraseShop(shopId: string): Promise<EraseCounts>;
  /** back to the seeded demo shop (demo only) */
  reset(): Promise<void>;
}
