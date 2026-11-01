import { describe, expect, it } from "vitest";
import { LocalStore } from "@/lib/store/local";
import { SqliteStore } from "@/lib/store/sqlite";
import type { LedgerStore } from "@/lib/store/types";
import type { OwnerRecord, Shop } from "@/lib/types";

const mobile = ["70000", "00002"].join("");
const now = "2026-11-01T10:00:00.000Z";
const shop = (id: string): Shop => ({ id, name: id, upiVpa: "", isDemo: false });
const owner = (id: string): OwnerRecord => ({ shopId: id, name: "Fictional owner", mobile, passcodeHash: "hash", authVersion: 0, createdAt: now });
for (const [name, make] of [["local", () => new LocalStore({ file: null })], ["sqlite", () => new SqliteStore(":memory:")]] as const) {
  describe(name, () => {
    it("purges expired verification identities and revokes pending proofs when a shop erases data", async () => {
      const store = make();
      await store.createRegisteredShop(shop("a"), owner("a"));
      const challenge = { browserHash: "browser", mobile, purpose: "recovery" as const, state: "requested" as const, expiresAt: "2026-11-01T10:10:00.000Z" };
      await store.createRegistration({ ...challenge, id: "expired", expiresAt: now });
      await store.createRegistration({ ...challenge, id: "pending" });
      await store.createRegistration({ ...challenge, id: "other", mobile: ["70000", "00003"].join("") });
      await store.pruneRegistrations(now);
      expect(await store.getRegistration("expired")).toBeNull();
      expect(await store.getRegistration("pending")).not.toBeNull();
      await store.eraseShop("a");
      expect(await store.getRegistration("pending")).toBeNull();
      expect(await store.getRegistration("other")).not.toBeNull();
      expect(await store.getOwner("a")).not.toBeNull();
    });
    it("registers a normalized mobile once atomically and preserves the first shop", async () => {
      const store: LedgerStore = make();
      const result = await Promise.allSettled([store.createRegisteredShop(shop("a"), owner("a")), store.createRegisteredShop(shop("b"), { ...owner("b"), mobile: `+91${mobile}` })]);
      expect(result.filter((r) => r.status === "fulfilled")).toHaveLength(1);
      expect(await store.getShop("b")).toBeNull();
      expect((await store.getOwnerByMobile(mobile))?.shopId).toBe("a");
      expect(await store.hasOwners()).toBe(true);
    });
    it("binds verification to the browser and completes/replays once; recovery invalidates replay", async () => {
      const store = make();
      const proof = { id: "proof", browserHash: "browser", mobile, purpose: "signup" as const, state: "requested" as const, expiresAt: "2026-11-01T10:10:00.000Z" };
      await store.createRegistration(proof);
      expect(await store.transitionRegistration("proof", "wrong", "requested", "verifying")).toBe(false);
      await expect(store.completeRegistration({ id: "proof", browserHash: "browser", now, shop: shop("a"), owner: owner("a") })).rejects.toThrow("invalid_registration");
      expect(await store.transitionRegistration("proof", "browser", "requested", "verifying")).toBe(true);
      expect(await store.transitionRegistration("proof", "browser", "verifying", "verified")).toBe(true);
      expect((await store.completeRegistration({ id: "proof", browserHash: "browser", now, shop: shop("a"), owner: owner("a") })).created).toBe(true);
      expect((await store.completeRegistration({ id: "proof", browserHash: "browser", now })).created).toBe(false);
      await store.setPasscodeHash("a", "new");
      await expect(store.completeRegistration({ id: "proof", browserHash: "browser", now })).rejects.toThrow("stale_registration");
    });
    it("isolates customers and inventory; concurrent stock changes cannot oversell", async () => {
      const store = make();
      await store.createShop(shop("a")); await store.createShop(shop("b"));
      const customer = await store.createCustomer({ shopId: "a", name: "Fictional", nameRoman: "Fictional", aliases: [] });
      expect(await store.updateCustomer("b", customer.id, { name: "Wrong" })).toBeNull();
      await store.updateCustomer("a", customer.id, { archivedAt: now });
      expect((await store.listCustomers("a"))[0].archivedAt).toBe(now);
      const product = await store.createProduct({ shopId: "a", name: "Rice", unit: "kg", onHandMinor: null, lowThresholdMinor: 1000 });
      const input = { shopId: "a", productId: product.id, kind: "opening" as const, quantityMinor: 2000, reason: "Counted", expectedVersion: 0, idempotencyKey: "opening", createdAt: now };
      await store.applyMovement(input);
      expect((await store.applyMovement(input)).created).toBe(false);
      const out = { ...input, kind: "out" as const, expectedVersion: 1, quantityMinor: 1500, idempotencyKey: "out" };
      const attempts = await Promise.allSettled([store.applyMovement(out), store.applyMovement({ ...out, idempotencyKey: "out2" })]);
      expect(attempts.filter((r) => r.status === "fulfilled")).toHaveLength(1);
      expect((await store.listProducts("a"))[0].onHandMinor).toBe(500);
      await expect(store.applyMovement({ ...out, expectedVersion: 2, quantityMinor: 501, idempotencyKey: "negative" })).rejects.toThrow("negative_stock");
      expect(await store.listProducts("b")).toEqual([]);
      const movement = (await store.listMovements("a"))[1];
      await store.applyMovement({ ...out, kind: "reversal", quantityMinor: 0, expectedVersion: 2, idempotencyKey: "reverse", reversalOf: movement.id });
      await expect(store.applyMovement({ ...out, kind: "reversal", quantityMinor: 0, expectedVersion: 3, idempotencyKey: "reverse2", reversalOf: movement.id })).rejects.toThrow("already_reversed");
      expect((await store.listProducts("a"))[0].onHandMinor).toBe(2000);
      await store.eraseShop("a");
      expect(await store.listProducts("a")).toEqual([]);
      expect(await store.listMovements("a")).toEqual([]);
    });
  });
}
