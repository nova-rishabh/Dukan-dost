import { expect, it } from "vitest";
import { validateSnapshot, type BusinessSnapshot } from "@/lib/shop-transfer";

const at = "2026-11-01T10:00:00.000Z";
const empty = (): BusinessSnapshot => ({ format: "dukaan-dost-business", version: 1, exportedAt: at, shopName: "Fictional export", customers: [], entries: [], products: [], movements: [], stockFlags: [] });
it("validates large bounded imports and rejects records beyond the documented ceiling", () => {
  const snapshot = empty();
  snapshot.customers = Array.from({ length: 5000 }, (_, i) => ({ id: `customer-${i}`, name: `Fictional ${i}`, nameRoman: `fictional ${i}`, aliases: [] }));
  snapshot.products = Array.from({ length: 1000 }, (_, i) => ({ id: `product-${i}`, name: `Item ${i}`, unit: "piece", onHandMinor: 20, lowThresholdMinor: 0, version: 20 }));
  snapshot.entries = Array.from({ length: 20000 }, (_, i) => ({ id: `entry-${i}`, customerId: `customer-${i % 5000}`, type: "credit_given", amountPaise: 1050, sourceText: "Reviewed record", source: "text", confirmedAt: at }));
  snapshot.movements = Array.from({ length: 20000 }, (_, i) => ({ id: `movement-${i}`, productId: `product-${i % 1000}`, kind: i < 1000 ? "opening" : "in", quantityMinor: 1, deltaMinor: 1, reason: "Reviewed stock", createdAt: at }));
  expect(validateSnapshot(snapshot).movements).toHaveLength(20000);
  snapshot.entries.push({ ...snapshot.entries[0], id: "one-too-many" });
  expect(() => validateSnapshot(snapshot)).toThrow();
});

it("preserves interleaved per-product chronology and rejects duplicate or forward reversals", () => {
  const snapshot = empty();
  snapshot.products = [{ id: "a", name: "A", unit: "piece", onHandMinor: 10, lowThresholdMinor: 0, version: 3 }, { id: "b", name: "B", unit: "piece", onHandMinor: 2, lowThresholdMinor: 0, version: 1 }];
  const row = { quantityMinor: 10, deltaMinor: 10, reason: "Counted", createdAt: at };
  snapshot.movements = [
    { ...row, id: "a-open", productId: "a", kind: "opening" },
    { ...row, id: "b-open", productId: "b", kind: "opening", quantityMinor: 2, deltaMinor: 2 },
    { ...row, id: "a-out", productId: "a", kind: "out", quantityMinor: 3, deltaMinor: -3 },
    { ...row, id: "a-reverse", productId: "a", kind: "reversal", quantityMinor: 0, deltaMinor: 3, reversalOf: "a-out" },
  ];
  expect(validateSnapshot(snapshot).products[0].onHandMinor).toBe(10);
  const repeated = structuredClone(snapshot);
  repeated.movements.push({ ...snapshot.movements[3], id: "a-reverse-twice" });
  expect(() => validateSnapshot(repeated)).toThrow("invalid_import");
  const forward = structuredClone(snapshot);
  [forward.movements[2], forward.movements[3]] = [forward.movements[3], forward.movements[2]];
  expect(() => validateSnapshot(forward)).toThrow("invalid_import");
  expect(() => validateSnapshot({ ...snapshot, movements: [{ ...snapshot.movements[0], productId: "missing" }] })).toThrow("invalid_import");
});
