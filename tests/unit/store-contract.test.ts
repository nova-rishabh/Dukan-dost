import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import { SEED_CUSTOMERS, SEED_SHOP_ID } from "@/lib/seed";
import { LocalStore } from "@/lib/store/local";
import { SqliteStore } from "@/lib/store/sqlite";
import type { LedgerStore } from "@/lib/store/types";

const dir = mkdtempSync(path.join(tmpdir(), "dukaan-store-"));
afterAll(() => rmSync(dir, { recursive: true, force: true }));

const makers: Array<[string, () => LedgerStore]> = [
  ["LocalStore (memory)", () => new LocalStore({ file: null })],
  ["SqliteStore (memory)", () => new SqliteStore(":memory:")],
];

const NOW = "2026-11-01T10:00:00.000Z";
const entry = (key: string, over: Record<string, unknown> = {}) => ({
  shopId: SEED_SHOP_ID,
  customerId: SEED_CUSTOMERS[0].id,
  type: "credit_given" as const,
  amountPaise: 50000,
  sourceText: "Amit Sharma ne 500 udhaar liye",
  source: "text" as const,
  idempotencyKey: key,
  confirmedAt: NOW,
  ...over,
});

for (const [name, make] of makers) {
  describe(`store contract: ${name}`, () => {
    it("starts with the fictional demo shop, 8 customers and 11 entries", async () => {
      const s = make();
      expect((await s.getShop(SEED_SHOP_ID))?.isDemo).toBe(true);
      expect(await s.listCustomers(SEED_SHOP_ID)).toHaveLength(8);
      expect(await s.listEntries(SEED_SHOP_ID)).toHaveLength(11);
    });

    it("keeps aliases and Devanagari names intact", async () => {
      const s = make();
      const banerjee = (await s.listCustomers(SEED_SHOP_ID)).find((c) => c.name === "Tapan Banerjee")!;
      expect(banerjee.aliases).toEqual(["banerjee babu", "mrs banerjee"]);
      expect(banerjee.nameDevanagari).toBe("तपन बनर्जी");
    });

    it("inserts an entry once per idempotency key and returns the original on repeat", async () => {
      const s = make();
      const a = await s.insertEntry(entry("same-key-1"));
      const b = await s.insertEntry(entry("same-key-1", { amountPaise: 99900 }));
      expect(a.created).toBe(true);
      expect(b.created).toBe(false);
      expect(b.entry.id).toBe(a.entry.id);
      expect(b.entry.amountPaise).toBe(50000);
      expect(await s.listEntries(SEED_SHOP_ID)).toHaveLength(12);
    });

    it("stores money as whole paise and refuses zero or negative amounts", async () => {
      const s = make();
      const a = await s.insertEntry(entry("paise-1", { amountPaise: 12345600 }));
      expect(a.entry.amountPaise).toBe(12345600);
      expect(Number.isInteger(a.entry.amountPaise)).toBe(true);
      await expect(s.insertEntry(entry("bad-1", { amountPaise: 0 }))).rejects.toThrow();
      await expect(s.insertEntry(entry("bad-2", { amountPaise: -100 }))).rejects.toThrow();
    });

    it("voids an entry with a reason and keeps the row", async () => {
      const s = make();
      const { entry: e } = await s.insertEntry(entry("void-1"));
      const v = await s.voidEntry(SEED_SHOP_ID, e.id, "galat likha", NOW);
      expect(v?.voidedAt).toBe(NOW);
      expect(v?.voidReason).toBe("galat likha");
      const again = await s.voidEntry(SEED_SHOP_ID, e.id, "dusri baar", "2026-11-02T00:00:00.000Z");
      expect(again?.voidReason).toBe("galat likha");
      expect((await s.listEntries(SEED_SHOP_ID)).find((x) => x.id === e.id)).toBeTruthy();
      expect(await s.voidEntry(SEED_SHOP_ID, "no-such-id", "x", NOW)).toBeNull();
    });

    it("adds and resolves stock flags", async () => {
      const s = make();
      const f = await s.addStockFlag({ shopId: SEED_SHOP_ID, itemName: "atta", level: "low", sourceText: "atta kam hai", createdAt: NOW });
      expect((await s.listStockFlags(SEED_SHOP_ID)).map((x) => x.itemName)).toEqual(["atta"]);
      const r = await s.resolveStockFlag(SEED_SHOP_ID, f.id, NOW);
      expect(r?.resolvedAt).toBe(NOW);
      expect(await s.resolveStockFlag(SEED_SHOP_ID, "nope", NOW)).toBeNull();
    });

    it("saves and reads pay tokens", async () => {
      const s = make();
      await s.savePayToken({ token: "tok-abcdefghijklmnopqrstuv", shopId: SEED_SHOP_ID, customerId: SEED_CUSTOMERS[0].id, amountPaise: 120000, expiresAt: "2026-11-08T10:00:00.000Z" });
      expect((await s.getPayToken("tok-abcdefghijklmnopqrstuv"))?.amountPaise).toBe(120000);
      expect(await s.getPayToken("missing")).toBeNull();
    });

    it("creates customers", async () => {
      const s = make();
      const c = await s.createCustomer({ shopId: SEED_SHOP_ID, name: "Raju", nameRoman: "raju", aliases: [] });
      expect((await s.listCustomers(SEED_SHOP_ID)).some((x) => x.id === c.id)).toBe(true);
    });

    it("lists audit events newest first", async () => {
      const s = make();
      await s.appendAudit(SEED_SHOP_ID, "proposal_shown", { n: 1 }, "2026-11-01T10:00:00.000Z");
      await s.appendAudit(SEED_SHOP_ID, "entry_confirmed", { n: 2 }, "2026-11-01T10:00:05.000Z");
      const a = await s.listAudit(SEED_SHOP_ID, 10);
      expect(a.map((x) => x.kind)).toEqual(["entry_confirmed", "proposal_shown"]);
      expect(a[0].payload).toEqual({ n: 2 });
    });

    it("drops unconfirmed sentences from the audit log after 30 days but keeps confirmed events", async () => {
      const s = make();
      await s.appendAudit(SEED_SHOP_ID, "proposal_shown", { sourceText: "old sentence" }, "2026-09-01T10:00:00.000Z");
      await s.appendAudit(SEED_SHOP_ID, "entry_confirmed", { sourceText: "old entry" }, "2026-09-01T10:00:01.000Z");
      await s.appendAudit(SEED_SHOP_ID, "proposal_shown", { sourceText: "new sentence" }, "2026-11-01T10:00:00.000Z");
      const kinds = (await s.listAudit(SEED_SHOP_ID, 20)).map((x) => JSON.stringify(x.payload));
      expect(kinds.some((k) => k.includes("old sentence"))).toBe(false);
      expect(kinds.some((k) => k.includes("old entry"))).toBe(true);
      expect(kinds.some((k) => k.includes("new sentence"))).toBe(true);
    });

    it("erases every row of a shop on request and keeps the shop itself", async () => {
      const s = make();
      await s.addStockFlag({ shopId: SEED_SHOP_ID, itemName: "chini", level: "low", createdAt: NOW });
      await s.appendAudit(SEED_SHOP_ID, "proposal_shown", { sourceText: "x" }, NOW);
      const gone = await s.eraseShop(SEED_SHOP_ID);
      expect(gone.entries).toBe(11);
      expect(gone.customers).toBe(8);
      expect(await s.listCustomers(SEED_SHOP_ID)).toEqual([]);
      expect(await s.listEntries(SEED_SHOP_ID)).toEqual([]);
      expect(await s.listStockFlags(SEED_SHOP_ID)).toEqual([]);
      expect(await s.listAudit(SEED_SHOP_ID, 10)).toEqual([]);
      expect(await s.getShop(SEED_SHOP_ID)).not.toBeNull();
    });

    it("creates a shop, one owner, and updates the passcode hash", async () => {
      const s = make();
      const id = "00000000-0000-4000-8000-0000000000aa";
      await s.createShop({ id, name: "Naya", upiVpa: "x@y", isDemo: false });
      await s.createShop({ id, name: "Dusra naam", upiVpa: "x@y", isDemo: false });
      expect((await s.getShop(id))?.name).toBe("Naya");
      expect(await s.getOwner(id)).toBeNull();
      await s.createOwner({ shopId: id, name: "Ramesh", mobile: "+15550000001", passcodeHash: "h1", createdAt: NOW });
      expect(await s.getOwner(id)).toMatchObject({ name: "Ramesh", mobile: "+15550000001", passcodeHash: "h1" });
      await expect(s.createOwner({ shopId: id, name: "Mallory", mobile: "+15550000002", passcodeHash: "h2", createdAt: NOW })).rejects.toThrow();
      await s.setPasscodeHash(id, "h3");
      expect((await s.getOwner(id))?.passcodeHash).toBe("h3");
    });

    it("erasing business data keeps the owner login", async () => {
      const s = make();
      await s.createOwner({ shopId: SEED_SHOP_ID, name: "Ramesh", mobile: "+15550000001", passcodeHash: "h1", createdAt: NOW });
      await s.eraseShop(SEED_SHOP_ID);
      expect(await s.getOwner(SEED_SHOP_ID)).not.toBeNull();
    });

    it("reset puts the seeded demo shop back", async () => {
      const s = make();
      await s.eraseShop(SEED_SHOP_ID);
      await s.reset();
      expect(await s.listCustomers(SEED_SHOP_ID)).toHaveLength(8);
      expect(await s.listEntries(SEED_SHOP_ID)).toHaveLength(11);
    });
  });
}

describe("SqliteStore on disk", () => {
  it("keeps data after the file is closed and reopened", async () => {
    const file = path.join(dir, "ledger.sqlite");
    const a = new SqliteStore(file);
    await a.insertEntry(entry("persist-1"));
    a.close();
    const b = new SqliteStore(file);
    const rows = await b.listEntries(SEED_SHOP_ID);
    expect(rows).toHaveLength(12);
    expect(rows.some((r) => r.idempotencyKey === "persist-1")).toBe(true);
    // a reopen must not re-seed on top of existing data
    expect(await b.listCustomers(SEED_SHOP_ID)).toHaveLength(8);
    b.close();
  });

  it("can start empty for a real shop (no demo seed)", async () => {
    const s = new SqliteStore(path.join(dir, "empty.sqlite"), { seedDemo: false });
    expect(await s.listCustomers(SEED_SHOP_ID)).toEqual([]);
    expect(await s.getShop(SEED_SHOP_ID)).toBeNull();
    s.close();
  });

  it("can start as an empty real shop: the shop row exists, is not a demo, and holds no data", async () => {
    const s = new SqliteStore(path.join(dir, "real.sqlite"), { seedDemo: false, shop: { id: SEED_SHOP_ID, name: "Meri Dukaan", upiVpa: "owner@bank" } });
    const shop = await s.getShop(SEED_SHOP_ID);
    expect(shop).toMatchObject({ name: "Meri Dukaan", isDemo: false, upiVpa: "owner@bank" });
    expect(await s.listCustomers(SEED_SHOP_ID)).toEqual([]);
    expect(await s.listEntries(SEED_SHOP_ID)).toEqual([]);
    s.close();
  });
});
