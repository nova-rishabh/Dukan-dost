import { afterEach, describe, expect, it } from "vitest";
import { LocalStore } from "@/lib/store/local";
import { SqliteStore } from "@/lib/store/sqlite";
import type { RegistrationChallenge } from "@/lib/types";
import type { LedgerStore } from "@/lib/store/types";

const at = "2026-11-01T10:00:00.000Z";
const phone = (suffix: string) => `+91${["70000", suffix].join("")}`;
const opened: SqliteStore[] = [];
afterEach(() => { for (const store of opened.splice(0)) store.close(); });
describe.each(["local", "sqlite"])("%s mobile change storage boundaries", (kind) => {
  async function setup(): Promise<LedgerStore> {
    const store = kind === "local" ? new LocalStore({ file: null }) : new SqliteStore(":memory:", { seedDemo: false });
    if (store instanceof SqliteStore) opened.push(store);
    for (const [shopId, mobile] of [["a", phone("01301")], ["b", phone("01302")]]) await store.createRegisteredShop({ id: shopId, name: `Fictional ${shopId}`, upiVpa: "sample@invalid", isDemo: false }, { shopId, name: "Fictional owner", mobile, passcodeHash: "otp-only", authVersion: 0, createdAt: at });
    return store;
  }
  const challenge = (id: string, patch: Partial<RegistrationChallenge> = {}): RegistrationChallenge => ({ id, browserHash: "owner-browser-hash", mobile: phone("01303"), purpose: "mobile_change", ownerShopId: "a", ownerAuthVersion: 0, providerVerified: true, state: "verified", expiresAt: "2026-11-01T10:10:00.000Z", ...patch });
  const completion = (id: string) => ({ id, browserHash: "owner-browser-hash", shopId: "a", expectedAuthVersion: 0, now: at });

  it("rejects wrong purpose, browser, owner, version, expiry and unverified provider without modifying the owner", async () => {
    const store = await setup();
    for (const [i, patch] of [{ purpose: "signup" as const }, { browserHash: "different-browser" }, { ownerShopId: "b" }, { ownerAuthVersion: 1 }, { expiresAt: at }, { providerVerified: false }].entries()) {
      const id = `reject-${i}`; await store.createRegistration(challenge(id, patch));
      await expect(store.completeMobileChange(completion(id))).rejects.toThrow("invalid_mobile_change");
    }
    expect((await store.getOwner("a"))?.mobile).toBe(phone("01301"));
    expect((await store.getOwner("b"))?.mobile).toBe(phone("01302"));
  });
  it("rejects a number already assigned to another shop and a mobile proof used for public registration", async () => {
    const store = await setup();
    await store.createRegistration(challenge("existing", { mobile: phone("01302") }));
    await expect(store.completeMobileChange(completion("existing"))).rejects.toThrow("mobile_unavailable");
    await store.createRegistration(challenge("cross-purpose"));
    await expect(store.completeRegistration({ id: "cross-purpose", browserHash: "owner-browser-hash", now: at })).rejects.toThrow("invalid_registration");
    expect((await store.getOwner("a"))?.authVersion).toBe(0);
  });
  it("invalidates replay and stale closure after a confirmed number change, preserving the other shop", async () => {
    const store = await setup(); await store.createRegistration(challenge("success"));
    expect(await store.completeMobileChange(completion("success"))).toMatchObject({ mobile: phone("01303"), authVersion: 1 });
    await expect(store.completeMobileChange(completion("success"))).rejects.toThrow("invalid_mobile_change");
    await expect(store.closeShop("a", 0)).rejects.toThrow("stale_owner");
    expect(await store.getOwner("a")).toBeTruthy();
    expect((await store.getOwner("b"))?.mobile).toBe(phone("01302"));
  });
});
