import { beforeEach, describe, expect, it } from "vitest";
import { LocalStore } from "@/lib/store/local";
import { createEntry, voidEntry, computeBalances, getSummary, createStockFlag, LedgerError } from "@/lib/ledger";
import { signProposal, verifyProposal } from "@/lib/proposal";
import { interpretText } from "@/lib/interpret";
import { SEED_SHOP_ID, SEED_CUSTOMERS } from "@/lib/seed";

const SECRET = "test-secret";
const NOW = new Date("2026-11-01T10:00:00Z");
let store: LocalStore;

async function propose(text: string) {
  const customers = await store.listCustomers(SEED_SHOP_ID);
  const p = await interpretText(text, { shopId: SEED_SHOP_ID, customers, llm: null, now: NOW, recentEntries: [] });
  return { p, token: signProposal(p, { shopId: SEED_SHOP_ID, now: NOW, secret: SECRET }) };
}
const AMIT = SEED_CUSTOMERS[0].id;

function baseReq(token: string, over: Record<string, unknown> = {}) {
  return {
    shopId: SEED_SHOP_ID,
    proposalToken: token,
    intentIndex: 0,
    confirmed: true,
    secondConfirmed: false,
    resolutions: [] as string[],
    customerId: AMIT,
    type: "credit_given" as const,
    amountPaise: 50000,
    source: "text" as const,
    idempotencyKey: "key-12345678",
    ...over,
  };
}

beforeEach(() => {
  store = new LocalStore({ file: null });
});

describe("proposal tokens", () => {
  it("round-trips and rejects tampering and expiry", async () => {
    const { token } = await propose("Amit Sharma ne 500 udhaar liye");
    expect(verifyProposal(token, { shopId: SEED_SHOP_ID, now: NOW, secret: SECRET }).intents).toHaveLength(1);
    const tampered = token.slice(0, -3) + "AAA";
    expect(() => verifyProposal(tampered, { shopId: SEED_SHOP_ID, now: NOW, secret: SECRET })).toThrow();
    expect(() => verifyProposal(token, { shopId: SEED_SHOP_ID, now: new Date(NOW.getTime() + 31 * 60_000), secret: SECRET })).toThrow();
    expect(() => verifyProposal(token, { shopId: "other-shop", now: NOW, secret: SECRET })).toThrow();
    expect(() => verifyProposal(token, { shopId: SEED_SHOP_ID, now: NOW, secret: "different" })).toThrow();
  });
});

describe("ledger: nothing is written without a confirmed proposal (silent wrong write is impossible)", () => {
  it("rejects a request that is not confirmed", async () => {
    const { token } = await propose("Amit Sharma ne 500 udhaar liye");
    await expect(createEntry(store, baseReq(token, { confirmed: false }), { now: NOW, secret: SECRET })).rejects.toMatchObject({ code: "not_confirmed" });
    expect(await store.listEntries(SEED_SHOP_ID)).toHaveLength(11);
  });
  it("rejects a missing or forged proposal token", async () => {
    await expect(createEntry(store, baseReq("forged.token"), { now: NOW, secret: SECRET })).rejects.toMatchObject({ code: "bad_proposal" });
    await expect(createEntry(store, baseReq(""), { now: NOW, secret: SECRET })).rejects.toBeInstanceOf(LedgerError);
    expect(await store.listEntries(SEED_SHOP_ID)).toHaveLength(11);
  });
  it("rejects a short idempotency key", async () => {
    const { token } = await propose("Amit Sharma ne 500 udhaar liye");
    await expect(createEntry(store, baseReq(token, { idempotencyKey: "x" }), { now: NOW, secret: SECRET })).rejects.toMatchObject({ code: "bad_request" });
  });
  it("blocks an unresolved direction until the owner resolves it", async () => {
    const { token } = await propose("Verma ji teen sau");
    await expect(createEntry(store, baseReq(token, { customerId: SEED_CUSTOMERS[4].id, amountPaise: 30000 }), { now: NOW, secret: SECRET })).rejects.toMatchObject({ code: "needs_clarification" });
    const ok = await createEntry(store, baseReq(token, { customerId: SEED_CUSTOMERS[4].id, amountPaise: 30000, resolutions: ["direction"] }), { now: NOW, secret: SECRET });
    expect(ok.created).toBe(true);
  });
  it("needs a second confirmation at ₹5,000 and above", async () => {
    const { token } = await propose("Amit Sharma ne 5000 udhaar liye");
    const req = baseReq(token, { amountPaise: 500000 });
    await expect(createEntry(store, req, { now: NOW, secret: SECRET })).rejects.toMatchObject({ code: "second_confirm_required" });
    const ok = await createEntry(store, { ...req, secondConfirmed: true }, { now: NOW, secret: SECRET });
    expect(ok.created).toBe(true);
  });
  it("rejects amounts above the ceiling and non-integer paise", async () => {
    const { token } = await propose("Amit Sharma ne 500 udhaar liye");
    await expect(createEntry(store, baseReq(token, { amountPaise: 10000100, secondConfirmed: true }), { now: NOW, secret: SECRET })).rejects.toMatchObject({ code: "bad_request" });
    await expect(createEntry(store, baseReq(token, { amountPaise: 500.5 }), { now: NOW, secret: SECRET })).rejects.toMatchObject({ code: "bad_request" });
    await expect(createEntry(store, baseReq(token, { amountPaise: 0 }), { now: NOW, secret: SECRET })).rejects.toMatchObject({ code: "bad_request" });
  });
  it("rejects an unknown customer", async () => {
    const { token } = await propose("Amit Sharma ne 500 udhaar liye");
    await expect(createEntry(store, baseReq(token, { customerId: "nope" }), { now: NOW, secret: SECRET })).rejects.toMatchObject({ code: "not_found" });
  });
});

describe("ledger: arithmetic, idempotency and void", () => {
  it("writes once per idempotency key (double tap)", async () => {
    const { token } = await propose("Amit Sharma ne 500 udhaar liye");
    const a = await createEntry(store, baseReq(token), { now: NOW, secret: SECRET });
    const b = await createEntry(store, baseReq(token), { now: NOW, secret: SECRET });
    expect(a.created).toBe(true);
    expect(b.created).toBe(false);
    expect(b.entry.id).toBe(a.entry.id);
    expect(await store.listEntries(SEED_SHOP_ID)).toHaveLength(12);
  });
  it("balance equals credit minus payments, excluding voided entries", async () => {
    const before = computeBalances(await store.listCustomers(SEED_SHOP_ID), await store.listEntries(SEED_SHOP_ID));
    expect(before.get(AMIT)).toBe((1800 - 600) * 100);
    const { token } = await propose("Amit Sharma ne 500 udhaar liye");
    const w = await createEntry(store, baseReq(token), { now: NOW, secret: SECRET });
    expect(w.balancePaise).toBe((1800 - 600 + 500) * 100);
    await voidEntry(store, { shopId: SEED_SHOP_ID, entryId: w.entry.id, reason: "galat likha", confirmed: true }, { now: NOW });
    const after = computeBalances(await store.listCustomers(SEED_SHOP_ID), await store.listEntries(SEED_SHOP_ID));
    expect(after.get(AMIT)).toBe((1800 - 600) * 100);
    const kept = (await store.listEntries(SEED_SHOP_ID)).find((e) => e.id === w.entry.id);
    expect(kept?.voidedAt).toBeTruthy();
    expect(kept?.voidReason).toBe("galat likha");
  });
  it("shows an advance as a negative balance, never hides it", async () => {
    const { token } = await propose("Amit Sharma ne 5000 diye");
    const w = await createEntry(store, baseReq(token, { type: "payment_received", amountPaise: 500000, secondConfirmed: true }), { now: NOW, secret: SECRET });
    expect(w.balancePaise).toBe((1800 - 600 - 5000) * 100);
  });
  it("does not void twice and requires confirmation", async () => {
    const entries = await store.listEntries(SEED_SHOP_ID);
    await expect(voidEntry(store, { shopId: SEED_SHOP_ID, entryId: entries[0].id, reason: "x", confirmed: false }, { now: NOW })).rejects.toMatchObject({ code: "not_confirmed" });
    await voidEntry(store, { shopId: SEED_SHOP_ID, entryId: entries[0].id, reason: "x", confirmed: true }, { now: NOW });
    await expect(voidEntry(store, { shopId: SEED_SHOP_ID, entryId: entries[0].id, reason: "x", confirmed: true }, { now: NOW })).rejects.toMatchObject({ code: "already_voided" });
  });
  it("audits every confirmed write with the sentence heard", async () => {
    const { token } = await propose("Amit Sharma ne 500 udhaar liye");
    await createEntry(store, baseReq(token), { now: NOW, secret: SECRET });
    const audit = await store.listAudit(SEED_SHOP_ID, 5);
    expect(audit[0].kind).toBe("entry_confirmed");
    expect(JSON.stringify(audit[0].payload)).toContain("Amit Sharma ne 500 udhaar liye");
  });
});

describe("summary and stock flags", () => {
  it("totals outstanding, top three debtors and low stock", async () => {
    const s0 = await getSummary(store, SEED_SHOP_ID);
    // balances: Amit 1200, RK 450, Gupta 1200, Pinky 320, Verma 700, Banerjee 1250, Ramesh 90, Meena 0
    expect(s0.totalOutstandingPaise).toBe((1200 + 450 + 1200 + 320 + 700 + 1250 + 90) * 100);
    expect(s0.topDebtors.map((d) => d.name)).toEqual(["Tapan Banerjee", "Amit Sharma", "Gupta ji"]);
    expect(s0.lowStock).toEqual([]);
    const { token } = await propose("Chini khatam ho rahi hai");
    await createStockFlag(store, { shopId: SEED_SHOP_ID, proposalToken: token, intentIndex: 0, confirmed: true, resolutions: [] }, { now: NOW, secret: SECRET });
    const s1 = await getSummary(store, SEED_SHOP_ID);
    expect(s1.lowStock.map((f) => f.itemName)).toEqual(["chini"]);
  });
  it("does not duplicate an unresolved flag for the same item", async () => {
    const { token } = await propose("Chini khatam ho rahi hai");
    const req = { shopId: SEED_SHOP_ID, proposalToken: token, intentIndex: 0, confirmed: true, resolutions: [] as string[] };
    await createStockFlag(store, req, { now: NOW, secret: SECRET });
    await createStockFlag(store, req, { now: NOW, secret: SECRET });
    expect((await store.listStockFlags(SEED_SHOP_ID)).length).toBe(1);
  });
});

describe("review fixes: the proposal binds what may be written", () => {
  it("rejects a customer, direction or amount that the proposal did not ask the owner to choose", async () => {
    const { token } = await propose("Amit Sharma ne 500 udhaar liye");
    const other = SEED_CUSTOMERS[2].id;
    await expect(createEntry(store, baseReq(token, { customerId: other }), { now: NOW, secret: SECRET })).rejects.toMatchObject({ code: "proposal_mismatch" });
    await expect(createEntry(store, baseReq(token, { type: "payment_received" }), { now: NOW, secret: SECRET })).rejects.toMatchObject({ code: "proposal_mismatch" });
    await expect(createEntry(store, baseReq(token, { amountPaise: 90000 }), { now: NOW, secret: SECRET })).rejects.toMatchObject({ code: "proposal_mismatch" });
    expect(await store.listEntries(SEED_SHOP_ID)).toHaveLength(11);
  });
  it("a high amount cannot be slipped past the second confirm by editing a small proposal", async () => {
    const { token } = await propose("Amit Sharma ne 500 udhaar liye");
    await expect(createEntry(store, baseReq(token, { amountPaise: 10000000, secondConfirmed: true }), { now: NOW, secret: SECRET })).rejects.toMatchObject({ code: "proposal_mismatch" });
  });
  it("one proposal writes at most once per intent, whatever idempotency key the client sends", async () => {
    const { token } = await propose("Amit Sharma ne 500 udhaar liye");
    const a = await createEntry(store, baseReq(token, { idempotencyKey: "first-key-123" }), { now: NOW, secret: SECRET });
    const b = await createEntry(store, baseReq(token, { idempotencyKey: "second-key-456" }), { now: NOW, secret: SECRET });
    expect(a.created).toBe(true);
    expect(b.created).toBe(false);
    expect(await store.listEntries(SEED_SHOP_ID)).toHaveLength(12);
  });
  it("refuses an identical entry within 60 seconds unless the owner acknowledged the warning", async () => {
    const one = await propose("Amit Sharma ne 500 udhaar liye");
    await createEntry(store, baseReq(one.token), { now: NOW, secret: SECRET });
    const later = new Date(NOW.getTime() + 20_000);
    const two = { token: signProposal(one.p, { shopId: SEED_SHOP_ID, now: later, secret: SECRET }) };
    const req = baseReq(two.token);
    await expect(createEntry(store, req, { now: later, secret: SECRET })).rejects.toMatchObject({ code: "duplicate_entry" });
    const ok = await createEntry(store, { ...req, allowDuplicate: true }, { now: later, secret: SECRET });
    expect(ok.created).toBe(true);
  });
  it("an undo token only voids the entry it named", async () => {
    const entries = await store.listEntries(SEED_SHOP_ID);
    const last = entries.reduce((a, b) => (a.confirmedAt >= b.confirmedAt ? a : b));
    const customers = await store.listCustomers(SEED_SHOP_ID);
    const p = await interpretText("Pichli entry hata do", { shopId: SEED_SHOP_ID, customers, llm: null, now: NOW, recentEntries: [], lastEntry: { entryId: last.id, customerName: "x", type: last.type, amountPaise: last.amountPaise } });
    const token = signProposal(p, { shopId: SEED_SHOP_ID, now: NOW, secret: SECRET });
    const wrong = entries.find((e) => e.id !== last.id)!;
    await expect(voidEntry(store, { shopId: SEED_SHOP_ID, entryId: wrong.id, reason: "x", confirmed: true, proposalToken: token, intentIndex: 0 }, { now: NOW, secret: SECRET })).rejects.toMatchObject({ code: "proposal_mismatch" });
    await voidEntry(store, { shopId: SEED_SHOP_ID, entryId: last.id, reason: "x", confirmed: true, proposalToken: token, intentIndex: 0 }, { now: NOW, secret: SECRET });
  });
});
