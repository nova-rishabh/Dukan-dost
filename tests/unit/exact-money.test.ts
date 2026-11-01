import { describe, expect, it } from "vitest";
import { parseRupeeText, paiseInWords } from "@/lib/exact-money";
import { signManualEntry } from "@/lib/proposal";
import { createEntry } from "@/lib/ledger";
import { LocalStore } from "@/lib/store/local";
import { SEED_SHOP_ID, SEED_CUSTOMERS } from "@/lib/seed";

describe("exact manual money", () => {
  it("parses decimal digits without floating point multiplication or rounding", () => {
    for (const [text, expected] of [["12.34", 1234], ["0.01", 1], ["1.1", 110], ["100000.00", 10_000_000], ["0001.09", 109]] as const) expect(parseRupeeText(text)).toBe(expected);
    for (const text of ["", "0", "0.00", "-1.00", "1e3", "1,234", "1.001", "100000.01", "Infinity", "₹12.34", "12.34more"]) expect(() => parseRupeeText(text)).toThrow("invalid_amount");
  });
  it("shows rupees and paise in both languages, including subrupee values", () => {
    expect(paiseInWords(1234)).toEqual({ en: "twelve rupees and thirty-four paise", hi: "बारह रुपये और चौंतीस पैसे" });
    expect(paiseInWords(1).en).toBe("zero rupees and one paisa");
    expect(paiseInWords(100).en).toBe("one rupee");
  });
  it("requires confirmation, binds exact paise, blocks tampering and writes one record on replay", async () => {
    const store = new LocalStore({ file: null }); const now = new Date("2026-11-01T10:00:00Z"); const secret = "manual-test-key";
    const customerId = SEED_CUSTOMERS[0].id;
    const token = signManualEntry({ customerId, type: "payment_received", amountPaise: 1234, sourceText: "Manual reviewed ₹12.34" }, { shopId: SEED_SHOP_ID, now, secret });
    const request = { shopId: SEED_SHOP_ID, proposalToken: token, intentIndex: 0, confirmed: true, resolutions: [], customerId, type: "payment_received" as const, amountPaise: 1234, source: "text" as const, idempotencyKey: "manual-key-001" };
    await expect(createEntry(store, { ...request, confirmed: false }, { now, secret })).rejects.toMatchObject({ code: "not_confirmed" });
    await expect(createEntry(store, { ...request, amountPaise: 1235 }, { now, secret })).rejects.toMatchObject({ code: "proposal_mismatch" });
    await expect(createEntry(store, { ...request, type: "credit_given" }, { now, secret })).rejects.toMatchObject({ code: "proposal_mismatch" });
    await expect(createEntry(store, { ...request, shopId: "other" }, { now, secret })).rejects.toMatchObject({ code: "bad_proposal" });
    expect((await createEntry(store, request, { now, secret })).created).toBe(true);
    expect((await createEntry(store, request, { now, secret })).created).toBe(false);
    expect((await store.listEntries(SEED_SHOP_ID)).filter((e) => e.amountPaise === 1234)).toHaveLength(1);
  });
});
