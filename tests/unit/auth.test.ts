import { describe, expect, it } from "vitest";
import {
  AuthError,
  AttemptLimiter,
  changePasscode,
  hashPasscode,
  loginWithPasscode,
  normalizeMobile,
  setupOwner,
  signSession,
  verifyPasscode,
  verifySession,
} from "@/lib/auth";
import { SqliteStore } from "@/lib/store/sqlite";

// Fictional numbers, built from parts so no phone-like literal sits in the repo.
const TEN = ["70000", "00001"].join("");
const OWNER = `+91${TEN}`;
const OTHER = `+91${["70000", "00002"].join("")}`;
const SECRET = "auth-test-secret-auth-test-secret";
const SHOP = "00000000-0000-4000-8000-000000000001";
const NOW = new Date("2026-11-01T10:00:00Z");
const later = (ms: number) => new Date(NOW.getTime() + ms);

describe("mobile numbers", () => {
  it("normalises to E.164 and assumes +91 for ten digits", () => {
    expect(normalizeMobile(TEN)).toBe(OWNER);
    expect(normalizeMobile(`${TEN.slice(0, 5)} ${TEN.slice(5)}`)).toBe(OWNER);
    expect(normalizeMobile(`+91 ${TEN.slice(0, 5)}-${TEN.slice(5)}`)).toBe(OWNER);
    expect(normalizeMobile(`91${TEN}`)).toBe(OWNER);
    expect(normalizeMobile("+14155550100")).toBe("+14155550100");
  });
  it("rejects anything that is not a plausible number", () => {
    for (const bad of ["", "abc", "123", "+0", "12345678901234567890", "++91"]) expect(normalizeMobile(bad)).toBeNull();
  });
});

describe("passcodes", () => {
  it("hashes with a fresh salt and verifies only the right passcode", async () => {
    const a = await hashPasscode("kirana-khata-2026");
    const b = await hashPasscode("kirana-khata-2026");
    expect(a).not.toBe(b);
    expect(a.startsWith("scrypt$")).toBe(true);
    expect(await verifyPasscode("kirana-khata-2026", a)).toBe(true);
    expect(await verifyPasscode("kirana-khata-2027", a)).toBe(false);
    expect(await verifyPasscode("anything", "not-a-hash")).toBe(false);
    expect(a).not.toContain("kirana-khata-2026");
  });
});

describe("session tokens", () => {
  const payload = { mobile: OWNER, shopId: SHOP };
  it("round-trips and carries the owner and shop", () => {
    const t = signSession(payload, { now: NOW, secret: SECRET });
    expect(verifySession(t, { now: later(60_000), secret: SECRET })).toMatchObject(payload);
  });
  it("rejects a tampered, expired or foreign-secret token", () => {
    const t = signSession(payload, { now: NOW, secret: SECRET });
    expect(verifySession(`${t.slice(0, -3)}AAA`, { now: NOW, secret: SECRET })).toBeNull();
    expect(verifySession(t, { now: later(8 * 24 * 3600_000), secret: SECRET })).toBeNull();
    expect(verifySession(t, { now: NOW, secret: "another-secret-another-secret-xx" })).toBeNull();
    expect(verifySession("", { now: NOW, secret: SECRET })).toBeNull();
    expect(verifySession("a.b.c", { now: NOW, secret: SECRET })).toBeNull();
  });
});

async function freshStore() {
  const s = new SqliteStore(":memory:", { seedDemo: false });
  return s;
}
describe("owner setup", () => {
  it("creates the shop and the single owner, then refuses a second setup", async () => {
    const s = await freshStore();
    const owner = await setupOwner(s, { shopId: SHOP, shopName: "Meri Dukaan", upiVpa: "owner@bank", name: "Ramesh", mobile: TEN, passcode: "kirana-khata-2026", now: NOW });
    expect(owner.mobile).toBe(OWNER);
    expect((await s.getShop(SHOP))?.isDemo).toBe(false);
    expect((await s.getOwner(SHOP))?.passcodeHash).not.toContain("kirana");
    await expect(setupOwner(s, { shopId: SHOP, shopName: "X", upiVpa: "", name: "Mallory", mobile: `+91${["70000", "00009"].join("")}`, passcode: "another-passcode-1", now: NOW })).rejects.toMatchObject({ code: "already_set_up" });
  });
  it("refuses weak passcodes, bad numbers and empty names", async () => {
    const s = await freshStore();
    const base = { shopId: SHOP, shopName: "Meri Dukaan", upiVpa: "", name: "Ramesh", mobile: TEN, passcode: "kirana-khata-2026", now: NOW };
    await expect(setupOwner(s, { ...base, passcode: "short" })).rejects.toMatchObject({ code: "weak_passcode" });
    await expect(setupOwner(s, { ...base, passcode: "12345678" })).rejects.toMatchObject({ code: "weak_passcode" });
    await expect(setupOwner(s, { ...base, mobile: "123" })).rejects.toMatchObject({ code: "bad_mobile" });
    await expect(setupOwner(s, { ...base, name: "  " })).rejects.toMatchObject({ code: "bad_request" });
    expect(await s.getOwner(SHOP)).toBeNull();
  });
});

describe("passcode login", () => {
  async function ready() {
    const s = await freshStore();
    await setupOwner(s, { shopId: SHOP, shopName: "Meri Dukaan", upiVpa: "", name: "Ramesh", mobile: TEN, passcode: "kirana-khata-2026", now: NOW });
    return s;
  }
  it("accepts the right passcode and gives the same error for a wrong passcode and an unknown number", async () => {
    const s = await ready();
    const limiter = new AttemptLimiter(5, 15 * 60_000);
    const ok = await loginWithPasscode(s, limiter, { shopId: SHOP, mobile: TEN, passcode: "kirana-khata-2026", now: NOW, ip: "local" });
    expect(ok.mobile).toBe(OWNER);
    const wrong = await loginWithPasscode(s, limiter, { shopId: SHOP, mobile: TEN, passcode: "wrong-passcode-1", now: NOW, ip: "local" }).catch((e) => e);
    const unknown = await loginWithPasscode(s, limiter, { shopId: SHOP, mobile: OTHER, passcode: "kirana-khata-2026", now: NOW, ip: "local" }).catch((e) => e);
    expect(wrong).toBeInstanceOf(AuthError);
    expect(wrong.code).toBe("bad_credentials");
    expect(unknown.code).toBe("bad_credentials");
    expect(unknown.message).toBe(wrong.message);
  });
  it("locks after five failures, even for the right passcode, until the window passes", async () => {
    const s = await ready();
    const limiter = new AttemptLimiter(5, 15 * 60_000);
    for (let i = 0; i < 5; i++) await loginWithPasscode(s, limiter, { shopId: SHOP, mobile: TEN, passcode: `wrong-passcode-${i}`, now: NOW, ip: "local" }).catch(() => undefined);
    await expect(loginWithPasscode(s, limiter, { shopId: SHOP, mobile: TEN, passcode: "kirana-khata-2026", now: later(60_000), ip: "local" })).rejects.toMatchObject({ code: "locked" });
    const ok = await loginWithPasscode(s, limiter, { shopId: SHOP, mobile: TEN, passcode: "kirana-khata-2026", now: later(16 * 60_000), ip: "local" });
    expect(ok.mobile).toBe(OWNER);
  });
  it("a successful login clears the failure count", async () => {
    const s = await ready();
    const limiter = new AttemptLimiter(3, 15 * 60_000);
    for (let i = 0; i < 2; i++) await loginWithPasscode(s, limiter, { shopId: SHOP, mobile: TEN, passcode: `wrong-passcode-${i}`, now: NOW, ip: "local" }).catch(() => undefined);
    await loginWithPasscode(s, limiter, { shopId: SHOP, mobile: TEN, passcode: "kirana-khata-2026", now: NOW, ip: "local" });
    for (let i = 0; i < 2; i++) await loginWithPasscode(s, limiter, { shopId: SHOP, mobile: TEN, passcode: `wrong-passcode-${i}`, now: NOW, ip: "local" }).catch(() => undefined);
    const ok = await loginWithPasscode(s, limiter, { shopId: SHOP, mobile: TEN, passcode: "kirana-khata-2026", now: NOW, ip: "local" });
    expect(ok.mobile).toBe(OWNER);
  });
  it("changes the passcode only when the current one is right", async () => {
    const s = await ready();
    await expect(changePasscode(s, { shopId: SHOP, current: "wrong-passcode-1", next: "brand-new-passcode-9" })).rejects.toMatchObject({ code: "bad_credentials" });
    await expect(changePasscode(s, { shopId: SHOP, current: "kirana-khata-2026", next: "short" })).rejects.toMatchObject({ code: "weak_passcode" });
    await changePasscode(s, { shopId: SHOP, current: "kirana-khata-2026", next: "brand-new-passcode-9" });
    const limiter = new AttemptLimiter(5, 60_000);
    await expect(loginWithPasscode(s, limiter, { shopId: SHOP, mobile: TEN, passcode: "kirana-khata-2026", now: NOW, ip: "x" })).rejects.toMatchObject({ code: "bad_credentials" });
    expect((await loginWithPasscode(s, limiter, { shopId: SHOP, mobile: TEN, passcode: "brand-new-passcode-9", now: NOW, ip: "x" })).mobile).toBe(OWNER);
  });
});
