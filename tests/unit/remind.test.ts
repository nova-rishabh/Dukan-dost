import { describe, expect, it } from "vitest";
import { buildReminderText, buildWaUrl } from "@/lib/remind";
import { buildUpiUri } from "@/lib/upi";
import { createPayToken, readPayToken } from "@/lib/pay";
import { LocalStore } from "@/lib/store/local";
import { SEED_SHOP_ID, SEED_CUSTOMERS } from "@/lib/seed";

describe("reminder text", () => {
  it("uses the Hinglish template with exact name and amount", () => {
    const t = buildReminderText({ customerName: "Amit Sharma", shopName: "Shree Ganesh Kirana", amountPaise: 120000, payUrl: "https://x.test/pay/abc" });
    expect(t).toBe("Namaste Amit Sharma ji, Shree Ganesh Kirana se. Aapka ₹1,200 baaki hai. Jab suvidha ho yahan se de dijiye: https://x.test/pay/abc. Dhanyavaad.");
  });
  it("does not double the honorific", () => {
    const t = buildReminderText({ customerName: "Gupta ji", shopName: "S", amountPaise: 50000, payUrl: "u" });
    expect(t.startsWith("Namaste Gupta ji, S se.")).toBe(true);
  });
});

describe("wa.me url", () => {
  it("round-trips Devanagari, spaces and ₹ through the encoding", () => {
    const text = "नमस्ते शर्मा जी, aapka ₹500 baaki hai. https://x.test/pay/a?b=1&c=2";
    const url = buildWaUrl({ text });
    expect(url.startsWith("https://wa.me/?text=")).toBe(true);
    expect(decodeURIComponent(url.split("?text=")[1])).toBe(text);
  });
  it("keeps only digits of a phone number", () => {
    const url = buildWaUrl({ text: "hi", phone: "+00 00000 00000" });
    expect(url.startsWith("https://wa.me/" + "0".repeat(12) + "?text=")).toBe(true);
  });
});

describe("upi uri", () => {
  it("formats amount with 2 decimals and encodes pn and tn", () => {
    const uri = buildUpiUri({ vpa: "demoshop@upi", shopName: "Shree Ganesh Kirana", amountPaise: 120050, note: "Udhaar jama & baaki" });
    const q = new URL(uri.replace("upi://pay", "https://x.test/pay")).searchParams;
    expect(uri.startsWith("upi://pay?")).toBe(true);
    expect(q.get("pa")).toBe("demoshop@upi");
    expect(q.get("pn")).toBe("Shree Ganesh Kirana");
    expect(q.get("am")).toBe("1200.50");
    expect(q.get("cu")).toBe("INR");
    expect(q.get("tn")).toBe("Udhaar jama & baaki");
    expect(uri).toContain("pn=Shree%20Ganesh%20Kirana");
  });
  it("prints whole rupees with .00", () => {
    expect(buildUpiUri({ vpa: "a@b", shopName: "S", amountPaise: 50000, note: "n" })).toContain("am=500.00");
  });
});

describe("pay tokens", () => {
  const NOW = new Date("2026-11-01T10:00:00Z");
  it("issues unguessable tokens that expose name and amount only", async () => {
    const store = new LocalStore({ file: null });
    const t = await createPayToken(store, { shopId: SEED_SHOP_ID, customerId: SEED_CUSTOMERS[0].id, amountPaise: 120000, now: NOW });
    expect(t.token.length).toBeGreaterThanOrEqual(22);
    const view = await readPayToken(store, t.token, NOW);
    expect(view.status).toBe("ok");
    if (view.status === "ok") {
      expect(Object.keys(view).sort()).toEqual(["amountPaise", "customerName", "isDemo", "shopName", "status", "upiUri"].sort());
      expect(view.amountPaise).toBe(120000);
      expect(view.upiUri).toContain("am=1200.00");
    }
  });
  it("reports an invalid and an expired token clearly", async () => {
    const store = new LocalStore({ file: null });
    expect((await readPayToken(store, "nope-nope-nope-nope-nope", NOW)).status).toBe("invalid");
    const t = await createPayToken(store, { shopId: SEED_SHOP_ID, customerId: SEED_CUSTOMERS[0].id, amountPaise: 100, now: NOW });
    expect((await readPayToken(store, t.token, new Date(NOW.getTime() + 8 * 24 * 3600_000))).status).toBe("expired");
  });
});

describe("pay link follows the live balance", () => {
  const NOW = new Date("2026-11-01T10:00:00Z");
  it("never asks for more than is owed now, and says settled when nothing is owed", async () => {
    const store = new LocalStore({ file: null });
    const amit = SEED_CUSTOMERS[0].id; // owes 1,200 in the seed
    const t = await createPayToken(store, { shopId: SEED_SHOP_ID, customerId: amit, amountPaise: 500000, now: NOW });
    const v = await readPayToken(store, t.token, NOW);
    expect(v.status === "ok" && v.amountPaise).toBe(120000);
    await store.insertEntry({ shopId: SEED_SHOP_ID, customerId: amit, type: "payment_received", amountPaise: 120000, sourceText: "cash", source: "text", idempotencyKey: "cash-paid-1", confirmedAt: NOW.toISOString() });
    expect((await readPayToken(store, t.token, NOW)).status).toBe("settled");
  });
});
