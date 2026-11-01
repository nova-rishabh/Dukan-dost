import { describe, expect, it } from "vitest";
import { displayQuantity, parseQuantity, previewQuantity } from "@/lib/inventory";
import { CustomerManageBody, MovementBody } from "@/lib/operationSchemas";

describe("measured inventory quantities", () => {
  it("converts decimal kg/litre exactly to integer grams/ml", () => {
    expect(parseQuantity("1.005", "kg")).toBe(1005);
    expect(parseQuantity("0.001", "litre")).toBe(1);
    expect(parseQuantity("-0.125", "kg", true)).toBe(-125);
    expect(displayQuantity(1000, "kg")).toBe("1 kg");
    expect(displayQuantity(10050, "litre")).toBe("10.05 litre");
  });
  it("rejects fractional pieces, excessive precision, exponent and unsafe values", () => {
    for (const s of ["1.2", "-2", "1e3", "9007199254740992"]) expect(() => parseQuantity(s, "piece")).toThrow();
    expect(() => parseQuantity("0.0001", "kg")).toThrow();
  });
  it("requires a counted baseline and rejects negative stock or repeated opening", () => {
    expect(() => previewQuantity(null, "out", 1)).toThrow();
    expect(() => previewQuantity(2, "opening", 3)).toThrow();
    expect(() => previewQuantity(2, "out", 3)).toThrow();
    expect(previewQuantity(null, "opening", 0)).toBe(0);
    expect(previewQuantity(10, "adjustment", -4)).toBe(6);
    expect(previewQuantity(10, "out", 10)).toBe(0);
  });
});
describe("operations confirmation and consent", () => {
  it("rejects customer writes without confirmation or phone consent", () => {
    expect(CustomerManageBody.safeParse({ name: "A", confirmed: false }).success).toBe(false);
    const phoneE164 = "+91" + ["70000", "00077"].join("");
    expect(CustomerManageBody.safeParse({ name: "A", confirmed: true, phoneE164 }).success).toBe(false);
    expect(CustomerManageBody.safeParse({ name: "A", confirmed: true, phoneE164, phoneConsent: true }).success).toBe(true);
    expect(CustomerManageBody.safeParse({ name: "A", confirmed: true, phoneE164: "" }).success).toBe(true);
  });
  it("requires a reason, version and explicit stock confirmation", () => {
    const body = { kind: "in", quantityMinor: 1, reason: "Delivery", expectedVersion: 1, idempotencyKey: "test-key-001", confirmed: true };
    expect(MovementBody.safeParse(body).success).toBe(true);
    expect(MovementBody.safeParse({ ...body, reason: " " }).success).toBe(false);
    expect(MovementBody.safeParse({ ...body, confirmed: false }).success).toBe(false);
  });
});
