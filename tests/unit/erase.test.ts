import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { ERASE_PHRASE, eraseShopData, LedgerError } from "@/lib/ledger";
import { SEED_SHOP_ID } from "@/lib/seed";
import { LocalStore } from "@/lib/store/local";
import { SqliteStore } from "@/lib/store/sqlite";

const REAL = { id: SEED_SHOP_ID, name: "Test Dukaan", upiVpa: "owner@bank" };

describe("eraseShopData (delete-my-data)", () => {
  async function realShop() {
    const s = new SqliteStore(":memory:", { seedDemo: false, shop: REAL });
    const c = await s.createCustomer({ shopId: SEED_SHOP_ID, name: "Raju", nameRoman: "raju", aliases: [] });
    await s.insertEntry({ shopId: SEED_SHOP_ID, customerId: c.id, type: "credit_given", amountPaise: 10000, sourceText: "Raju ko 100 udhaar", source: "text", idempotencyKey: "k-erase-001", confirmedAt: "2026-11-01T10:00:00.000Z" });
    await s.appendAudit(SEED_SHOP_ID, "proposal_shown", { sourceText: "Raju ko 100 udhaar" }, "2026-11-01T10:00:00.000Z");
    return s;
  }

  it("needs confirmation and the typed phrase, and erases nothing otherwise", async () => {
    const s = await realShop();
    await expect(eraseShopData(s, { shopId: SEED_SHOP_ID, confirmed: false, phrase: ERASE_PHRASE })).rejects.toMatchObject({ code: "not_confirmed" });
    await expect(eraseShopData(s, { shopId: SEED_SHOP_ID, confirmed: true, phrase: "haan" })).rejects.toMatchObject({ code: "bad_request" });
    expect(await s.listEntries(SEED_SHOP_ID)).toHaveLength(1);
  });

  it("removes customers, entries, sentences and audit rows, and keeps the shop", async () => {
    const s = await realShop();
    const counts = await eraseShopData(s, { shopId: SEED_SHOP_ID, confirmed: true, phrase: "  Sab Hata Do " });
    expect(counts).toMatchObject({ customers: 1, entries: 1, auditEvents: 1 });
    expect(await s.listEntries(SEED_SHOP_ID)).toEqual([]);
    expect(await s.listAudit(SEED_SHOP_ID, 10)).toEqual([]);
    expect(await s.getShop(SEED_SHOP_ID)).not.toBeNull();
  });

  it("refuses the shared demo shop and points to reset", async () => {
    const s = new LocalStore({ file: null });
    await expect(eraseShopData(s, { shopId: SEED_SHOP_ID, confirmed: true, phrase: ERASE_PHRASE })).rejects.toBeInstanceOf(LedgerError);
    await expect(eraseShopData(s, { shopId: SEED_SHOP_ID, confirmed: true, phrase: ERASE_PHRASE })).rejects.toMatchObject({ hint: expect.stringContaining("reset") });
    expect(await s.listEntries(SEED_SHOP_ID)).toHaveLength(11);
  });
});

describe("a real shop on SQLite through the HTTP route handlers", () => {
  const saved = { ...process.env };
  const g = globalThis as unknown as { __dukaan?: unknown };

  beforeEach(() => {
    g.__dukaan = undefined;
    process.env.DUKAAN_DB_FILE = ":memory:";
    process.env.DUKAAN_SHOP_NAME = "Test Dukaan";
    process.env.PROPOSAL_SECRET = "route-test-secret-route-test-secret";
  });
  afterEach(() => {
    g.__dukaan = undefined;
    process.env = { ...saved };
  });

  const post = (url: string, body: unknown) => new Request(`http://localhost${url}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });

  it("writes through interpret and entries, then erases on request", async () => {
    const customers = await import("@/app/api/customers/route");
    const interpret = await import("@/app/api/interpret/route");
    const entries = await import("@/app/api/entries/route");
    const erase = await import("@/app/api/shop/erase/route");
    const summary = await import("@/app/api/summary/route");

    const made = await (await customers.POST(post("/api/customers", { name: "Raju" }))).json();
    expect(made.customer.name).toBe("Raju");

    const prop = await (await interpret.POST(post("/api/interpret", { text: "Raju ko 100 udhaar diye", source: "text" }))).json();
    const intent = prop.proposal.intents[0];
    expect(intent.writable).toBe(true);

    const written = await (
      await entries.POST(
        post("/api/entries", {
          proposalToken: prop.proposal.token, intentIndex: 0, confirmed: true, resolutions: [], customerId: made.customer.id,
          type: "credit_given", amountPaise: 10000, source: "text", idempotencyKey: "route-test-key-1",
        }),
      )
    ).json();
    expect(written.ok).toBe(true);
    expect(written.balancePaise).toBe(10000);

    const before = await (await summary.GET(new Request("http://localhost/api/summary"))).json();
    expect(before.isDemoShop).toBe(false);
    expect(before.summary.totalOutstandingPaise).toBe(10000);

    const wrong = await erase.POST(post("/api/shop/erase", { confirmed: true, phrase: "nahi" }));
    expect(wrong.status).toBe(400);

    const ok = await (await erase.POST(post("/api/shop/erase", { confirmed: true, phrase: ERASE_PHRASE }))).json();
    expect(ok.erased).toMatchObject({ customers: 1, entries: 1 });

    const after = await (await summary.GET(new Request("http://localhost/api/summary"))).json();
    expect(after.summary.totalOutstandingPaise).toBe(0);
    expect(after.summary.customerCount).toBe(0);
  });

  it("refuses to start with a database file but no PROPOSAL_SECRET", async () => {
    delete process.env.PROPOSAL_SECRET;
    const { getContext } = await import("@/server/context");
    expect(() => getContext()).toThrow(/PROPOSAL_SECRET/);
  });

  it("keeps the debug and reset routes closed on a real shop", async () => {
    const debug = await import("@/app/api/debug/route");
    const reset = await import("@/app/api/demo/reset/route");
    expect((await debug.GET(new Request("http://localhost/api/debug"))).status).toBe(403);
    expect((await reset.POST(new Request("http://localhost/api/demo/reset", { method: "POST" }))).status).toBe(403);
  });
});
