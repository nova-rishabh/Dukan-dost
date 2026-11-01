import { createHash, randomUUID } from "node:crypto";
import { z } from "zod";
import type { Customer, Entry, Product, StockFlag, StockMovement } from "./types";
const id = z.string().min(1).max(100);
const text = z.string().max(2000);
const date = z.string().datetime();
const minor = z.number().int().safe();
const customer = z.object({ id, name: z.string().trim().min(1).max(80), area: z.string().max(80).optional(), nameRoman: text, nameDevanagari: text.optional(), aliases: z.array(z.string().trim().min(1).max(80)).max(20), archivedAt: date.optional() }).strict();
const entry = z.object({ id, customerId: id, type: z.enum(["credit_given", "payment_received"]), amountPaise: minor.positive().max(100000000), note: text.optional(), sourceText: text, source: z.enum(["voice", "text", "sample"]), confirmedAt: date, voidedAt: date.optional(), voidReason: text.optional() }).strict();
const product = z.object({ id, name: z.string().trim().min(1).max(80), unit: z.enum(["piece", "kg", "litre"]), onHandMinor: minor.nonnegative().nullable(), lowThresholdMinor: minor.nonnegative(), version: minor.nonnegative(), archivedAt: date.optional() }).strict();
const movement = z.object({ id, productId: id, kind: z.enum(["opening", "in", "out", "adjustment", "reversal"]), quantityMinor: minor, deltaMinor: minor, reason: text, reversalOf: id.optional(), createdAt: date }).strict();
const flag = z.object({ id, itemName: z.string().min(1).max(100), level: z.literal("low"), sourceText: text.optional(), createdAt: date, resolvedAt: date.optional() }).strict();
export const BusinessSnapshotSchema = z.object({ format: z.literal("dukaan-dost-business"), version: z.literal(1), exportedAt: date, shopName: z.string().min(1).max(100), customers: z.array(customer).max(5000), entries: z.array(entry).max(20000), products: z.array(product).max(5000), movements: z.array(movement).max(20000), stockFlags: z.array(flag).max(5000) }).strict();
export type BusinessSnapshot = z.infer<typeof BusinessSnapshotSchema>;
export interface BusinessRecords { customers: Customer[]; entries: Entry[]; products: Product[]; movements: StockMovement[]; stockFlags: StockFlag[] }
export const snapshotDigest = (snapshot: BusinessSnapshot) => { const { exportedAt: _at, ...data } = snapshot; void _at; return createHash("sha256").update(JSON.stringify(data)).digest("hex"); };
export function businessSnapshot(shopName: string, records: BusinessRecords): BusinessSnapshot {
  return BusinessSnapshotSchema.parse({ format: "dukaan-dost-business", version: 1, exportedAt: new Date().toISOString(), shopName,
    customers: records.customers.map(({ shopId: _s, phoneE164: _p, ...row }) => { void _s; void _p; return row; }),
    entries: records.entries.map(({ shopId: _s, idempotencyKey: _k, ...row }) => { void _s; void _k; return row; }),
    products: records.products.map(({ shopId: _s, ...row }) => { void _s; return row; }),
    movements: records.movements.map(({ shopId: _s, idempotencyKey: _k, ...row }) => { void _s; void _k; return row; }),
    stockFlags: records.stockFlags.map(({ shopId: _s, ...row }) => { void _s; return row; }) });
}
export function validateSnapshot(input: unknown): BusinessSnapshot {
  const data = BusinessSnapshotSchema.parse(input);
  function unique(rows: { id: string }[]) { if (new Set(rows.map((r) => r.id)).size !== rows.length) throw new Error("invalid_import"); }
  for (const rows of [data.customers, data.entries, data.products, data.movements, data.stockFlags]) unique(rows);
  const customerIds = new Set(data.customers.map((c) => c.id));
  const productIds = new Set(data.products.map((p) => p.id));
  if (data.entries.some((e) => !customerIds.has(e.customerId))) throw new Error("invalid_import");
  // Index once so bounded imports cannot multiply product/customer counts into repeated full scans.
  const movementsByProduct = new Map<string, typeof data.movements>();
  for (const row of data.movements) {
    if (!productIds.has(row.productId)) throw new Error("invalid_import");
    const rows = movementsByProduct.get(row.productId) ?? [];
    rows.push(row); movementsByProduct.set(row.productId, rows);
  }
  for (const product of data.products) {
    const rows = movementsByProduct.get(product.id) ?? [];
    let count: number | null = null;
    const seen = new Map<string, typeof rows[number]>();
    const reversed = new Set<string>();
    for (const row of rows) {
      if (row.kind === "opening") { if (count !== null || row.quantityMinor < 0 || row.deltaMinor !== row.quantityMinor) throw new Error("invalid_import"); count = 0; }
      else if (count === null) throw new Error("invalid_import");
      if ((row.kind === "in" || row.kind === "out") && (row.quantityMinor <= 0 || row.deltaMinor !== (row.kind === "in" ? row.quantityMinor : -row.quantityMinor))) throw new Error("invalid_import");
      if (row.kind === "adjustment" && row.deltaMinor !== row.quantityMinor) throw new Error("invalid_import");
      if (row.kind === "reversal") {
        const original = row.reversalOf ? seen.get(row.reversalOf) : undefined;
        if (!original || original.kind === "reversal" || original.kind === "opening" || reversed.has(original.id) || row.deltaMinor !== -original.deltaMinor) throw new Error("invalid_import");
        reversed.add(original.id);
      }
      else if (row.reversalOf) throw new Error("invalid_import");
      count = (count ?? 0) + row.deltaMinor;
      if (!Number.isSafeInteger(count) || count < 0) throw new Error("invalid_import");
      seen.set(row.id, row);
    }
    if (count !== product.onHandMinor) throw new Error("invalid_import");
  }
  return data;
}
export function remapSnapshot(input: unknown, shopId: string, importKey: string): BusinessRecords {
  const data = validateSnapshot(input);
  const customers = new Map(data.customers.map((row) => [row.id, randomUUID()]));
  const products = new Map(data.products.map((row) => [row.id, randomUUID()]));
  const movements = new Map(data.movements.map((row) => [row.id, randomUUID()]));
  return { customers: data.customers.map((row) => ({ ...row, id: customers.get(row.id)!, shopId })),
    entries: data.entries.map((row) => ({ ...row, id: randomUUID(), customerId: customers.get(row.customerId)!, shopId, idempotencyKey: `import:${importKey}:${row.id}` })),
    products: data.products.map((row) => ({ ...row, id: products.get(row.id)!, shopId })),
    movements: data.movements.map((row) => ({ ...row, id: movements.get(row.id)!, productId: products.get(row.productId)!, reversalOf: row.reversalOf ? movements.get(row.reversalOf) : undefined, shopId, idempotencyKey: `import:${importKey}:${row.id}` })),
    stockFlags: data.stockFlags.map((row) => ({ ...row, id: randomUUID(), shopId })) };
}
