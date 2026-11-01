import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";
import { computeBalances } from "@/lib/ledger";
import { createPayToken } from "@/lib/pay";
import { SEED_CUSTOMERS, SEED_SHOP_ID } from "@/lib/seed";
import { LocalStore } from "@/lib/store/local";
import { SqliteStore } from "@/lib/store/sqlite";
import type { LedgerStore } from "@/lib/store/types";
import { sendConfirmedReminder } from "@/server/sendReminder";

const NOW = new Date("2026-11-01T10:00:00.000Z");
const secret = "fictional signing material for isolated tests";

async function draft(store: LedgerStore) {
  const customer = SEED_CUSTOMERS[0];
  const amountPaise = computeBalances([customer], await store.listEntries(SEED_SHOP_ID)).get(customer.id)!;
  const pay = await createPayToken(store, { shopId: SEED_SHOP_ID, customerId: customer.id, amountPaise, now: NOW });
  const payUrl = `https://shop.invalid/pay/${pay.token}`;
  const body = { customerId: customer.id, phone: `+91${["70000", "00077"].join("")}`, text: `Test reminder ${payUrl}`, payUrl, confirmed: true };
  const send = vi.fn(async () => ({ id: "fake-message", simulated: false }));
  return { body, pay, send, opts: { shopId: SEED_SHOP_ID, secret, appUrl: "https://shop.invalid", now: NOW, send } };
}

for (const [name, make] of [
  ["memory", () => new LocalStore({ file: null })],
  ["sqlite", () => new SqliteStore(":memory:")],
] as const) {
  describe(`reminder delivery (${name})`, () => {
    it("replays the known result without sending again", async () => {
      const store = make(); const d = await draft(store);
      expect(await sendConfirmedReminder(store, d.body, d.opts)).toMatchObject({ sent: true, replayed: false });
      expect(await sendConfirmedReminder(store, d.body, d.opts)).toMatchObject({ sent: true, replayed: true });
      expect(d.send).toHaveBeenCalledTimes(1);
    });

    it("reserves concurrently before any network send", async () => {
      const store = make(); const d = await draft(store);
      const result = await Promise.allSettled([sendConfirmedReminder(store, d.body, d.opts), sendConfirmedReminder(store, d.body, d.opts)]);
      expect(result.some((r) => r.status === "fulfilled")).toBe(true);
      expect(d.send).toHaveBeenCalledTimes(1);
    });

    it("keeps uncertain delivery reserved and refuses retries", async () => {
      const store = make(); const d = await draft(store);
      d.send.mockRejectedValueOnce(new Error("response lost after provider acceptance"));
      await expect(sendConfirmedReminder(store, d.body, d.opts)).rejects.toMatchObject({ code: "delivery_unknown" });
      await expect(sendConfirmedReminder(store, d.body, d.opts)).rejects.toMatchObject({ code: "delivery_unknown" });
      expect((await store.getReminderDelivery(SEED_SHOP_ID, d.pay.token))?.status).toBe("unknown");
      expect(d.send).toHaveBeenCalledTimes(1);
    });

    it("rejects an expired draft before the provider is called", async () => {
      const store = make(); const d = await draft(store);
      await expect(sendConfirmedReminder(store, d.body, { ...d.opts, now: new Date(d.pay.expiresAt) })).rejects.toMatchObject({ code: "draft_expired" });
      expect(d.send).not.toHaveBeenCalled();
    });

    it("rejects a changed or settled balance before sending", async () => {
      const store = make(); const d = await draft(store);
      await store.insertEntry({ shopId: SEED_SHOP_ID, customerId: d.body.customerId, type: "payment_received", amountPaise: 100, sourceText: "fictional payment", source: "text", idempotencyKey: "test-stale-reminder", confirmedAt: NOW.toISOString() });
      await expect(sendConfirmedReminder(store, d.body, d.opts)).rejects.toMatchObject({ code: "draft_stale" });
      expect(d.send).not.toHaveBeenCalled();
    });

    it("does not reuse a reviewed draft for another recipient or message", async () => {
      const store = make(); const d = await draft(store);
      await sendConfirmedReminder(store, d.body, d.opts);
      await expect(sendConfirmedReminder(store, { ...d.body, text: `Changed ${d.body.text}` }, d.opts)).rejects.toMatchObject({ code: "draft_already_used" });
      expect(d.send).toHaveBeenCalledTimes(1);
    });

    it("requires owner confirmation and token ownership", async () => {
      const store = make(); const d = await draft(store);
      await expect(sendConfirmedReminder(store, { ...d.body, confirmed: false }, d.opts)).rejects.toMatchObject({ code: "not_confirmed" });
      await expect(sendConfirmedReminder(store, d.body, { ...d.opts, shopId: "another-shop" })).rejects.toMatchObject({ code: "bad_request" });
      expect(d.send).not.toHaveBeenCalled();
    });

    it("rejects a real token embedded in another origin or path", async () => {
      const store = make(); const d = await draft(store);
      for (const payUrl of [`https://other.invalid/pay/${d.pay.token}`, `https://shop.invalid/other/${d.pay.token}`, `${d.body.payUrl}?redirect=elsewhere`]) {
        await expect(sendConfirmedReminder(store, { ...d.body, payUrl, text: `Test ${payUrl}` }, d.opts)).rejects.toMatchObject({ code: "bad_request" });
      }
      expect(d.send).not.toHaveBeenCalled();
    });
  });
}

it("persists delivery reservations across SQLite reopen", async () => {
  const dir = mkdtempSync(path.join(tmpdir(), "dukaan-delivery-"));
  const file = path.join(dir, "ledger.sqlite");
  let store = new SqliteStore(file);
  try {
    const d = await draft(store);
    await store.claimReminderDelivery({ shopId: SEED_SHOP_ID, token: d.pay.token, fingerprint: "reserved", status: "pending", createdAt: NOW.toISOString() });
    store.close(); store = new SqliteStore(file);
    expect((await store.claimReminderDelivery({ shopId: SEED_SHOP_ID, token: d.pay.token, fingerprint: "different", status: "pending", createdAt: NOW.toISOString() })).claimed).toBe(false);
    expect((await store.getReminderDelivery(SEED_SHOP_ID, d.pay.token))?.fingerprint).toBe("reserved");
  } finally { store.close(); rmSync(dir, { recursive: true, force: true }); }
});
