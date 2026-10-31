import type { AuditEvent, Customer, Entry, PayToken, Shop, StockFlag } from "../types";

/** Persistence boundary (ADR-018). Local store for keyless mode, Supabase when keys exist. */
export interface LedgerStore {
  readonly kind: "local" | "supabase";
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
  appendAudit(shopId: string, kind: string, payload: Record<string, unknown>, at: string): Promise<void>;
  listAudit(shopId: string, limit: number): Promise<AuditEvent[]>;
  /** back to the seeded demo shop (demo only) */
  reset(): Promise<void>;
}
