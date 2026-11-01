import { describe, expect, it } from "vitest";
import { csvCell, reportingPeriod, statement } from "@/lib/reporting";
import { buildReminderText } from "@/lib/remind";
import type { Entry } from "@/lib/types";

const entry = (id: string, at: string, amount: number, type: Entry["type"] = "credit_given", voidedAt?: string): Entry => ({ id, shopId: "a", customerId: "c", confirmedAt: at, amountPaise: amount, type, source: "text", sourceText: "record", idempotencyKey: id, voidedAt });
describe("recorded-date statements", () => {
  it("uses inclusive India dates and rejects invalid or reversed dates", () => {
    expect(reportingPeriod("2026-11-01", "2026-11-01")).toEqual({ start: Date.parse("2026-10-31T18:30:00Z"), end: Date.parse("2026-11-01T18:30:00Z") });
    for (const [a, b] of [["2026-02-30", ""], ["2026-13-01", ""], ["2026-12-01", "2026-11-01"]]) expect(() => reportingPeriod(a, b)).toThrow("invalid_period");
  });
  it("carries opening balance, includes void history without counting it, separates period from current", () => {
    const result = statement([
      entry("opening", "2026-10-31T18:29:59Z", 50000),
      entry("received", "2026-10-31T18:30:00Z", 70000, "payment_received"),
      entry("void", "2026-11-01T10:00:00Z", 20000, "credit_given", "2026-11-02T00:00:00Z"),
      entry("future", "2026-11-01T18:30:00Z", 10000),
    ], reportingPeriod("2026-11-01", "2026-11-01"));
    expect(result.openingPaise).toBe(50000);
    expect(result.rows.map((r) => r.id)).toEqual(["received", "void"]);
    expect(result.rows.map((r) => r.runningPaise)).toEqual([-20000, -20000]);
    expect(result.closingPaise).toBe(-20000);
    expect(result.currentPaise).toBe(-10000);
  });
  it("does not mutate source records and includes all dates by default", () => {
    const entries = [entry("b", "2026-11-02T00:00:00Z", 100), entry("a", "2026-11-01T00:00:00Z", 100)];
    expect(statement(entries, reportingPeriod()).closingPaise).toBe(200);
    expect(entries[0].id).toBe("b");
  });
  it("neutralizes formulas including leading whitespace, quotes commas and newlines", () => {
    expect(csvCell(" =1+1")).toBe('"\' =1+1"');
    expect(csvCell("@SUM(A1)")).toBe('"\'@SUM(A1)"');
    expect(csvCell('hello,"world"\nnext')).toBe('"hello,""world""\nnext"');
    expect(csvCell(-500)).toBe('"-500"');
  });
  it("builds English reminder drafts only when selected", () => {
    const input = { customerName: "Sample", shopName: "Test", amountPaise: 10000, payUrl: "https://example.invalid/pay" };
    expect(buildReminderText({ ...input, locale: "en" })).toContain("outstanding balance is ₹100");
    expect(buildReminderText(input)).toContain("Namaste Sample ji");
  });
});
