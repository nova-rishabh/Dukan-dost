import { createHmac, randomBytes, scrypt as scryptCb, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import type { LedgerStore } from "./store/types";

const scrypt = promisify(scryptCb) as (pw: string, salt: Buffer, len: number, opts: { N: number; r: number; p: number }) => Promise<Buffer>;

export type AuthErrorCode =
  | "already_set_up"
  | "weak_passcode"
  | "bad_mobile"
  | "bad_request"
  | "bad_credentials"
  | "locked"
  | "wa_unavailable"
  | "wa_failed"
  | "captcha_failed"
  | "bad_code"
  | "rate_limited"
  | "auth_required"
  | "setup_required";

export class AuthError extends Error {
  constructor(
    public code: AuthErrorCode,
    message: string,
    public hint: string,
    public status = 400,
  ) {
    super(message);
  }
}

export interface OwnerPublic {
  shopId: string;
  name: string;
  mobile: string;
  authVersion: number;
}

/* ---------------------------------------------------------------- mobile numbers */

/** E.164 with a +91 default for plain ten-digit numbers. Returns null for anything implausible. */
export function normalizeMobile(input: string, defaultCountry = "91"): string | null {
  const raw = (input ?? "").trim();
  if (!raw || /[^\d+\s().-]/.test(raw)) return null;
  const hasPlus = raw.startsWith("+");
  if ((raw.match(/\+/g) ?? []).length > (hasPlus ? 1 : 0)) return null;
  let digits = raw.replace(/\D/g, "");
  if (!hasPlus && digits.startsWith("00")) digits = digits.slice(2);
  if (!hasPlus && digits.length === 10) digits = defaultCountry + digits;
  if (digits.length < 8 || digits.length > 15 || digits.startsWith("0")) return null;
  return `+${digits}`;
}

/* ---------------------------------------------------------------- passcodes */

const SCRYPT = { N: 16384, r: 8, p: 1 } as const;
export const PASSCODE_MIN = 8;
const COMMON = new Set(["password", "passcode", "qwertyui", "12345678", "123456789", "1234567890", "iloveyou", "11111111", "00000000"]);

export function isWeakPasscode(p: string): boolean {
  if (typeof p !== "string" || p.length < PASSCODE_MIN || p.length > 128) return true;
  if (COMMON.has(p.toLowerCase())) return true;
  if (/^(.)\1+$/.test(p)) return true;
  if (/^\d+$/.test(p) && p.length < 10) return true;
  return false;
}

export async function hashPasscode(passcode: string): Promise<string> {
  const salt = randomBytes(16);
  const hash = await scrypt(passcode, salt, 64, SCRYPT);
  return ["scrypt", SCRYPT.N, SCRYPT.r, SCRYPT.p, salt.toString("base64"), hash.toString("base64")].join("$");
}

export async function verifyPasscode(passcode: string, stored: string): Promise<boolean> {
  const [alg, n, r, p, saltB64, hashB64] = (stored ?? "").split("$");
  if (alg !== "scrypt" || !n || !r || !p || !saltB64 || !hashB64) return false;
  try {
    const expected = Buffer.from(hashB64, "base64");
    const got = await scrypt(passcode, Buffer.from(saltB64, "base64"), expected.length, { N: Number(n), r: Number(r), p: Number(p) });
    return got.length === expected.length && timingSafeEqual(got, expected);
  } catch {
    return false;
  }
}

/* ---------------------------------------------------------------- session tokens */

export const SESSION_TTL_MS = 7 * 24 * 3600_000;
export type LoginMethod = "passcode" | "otp";

export interface SessionPayload {
  mobile: string;
  shopId: string;
  authVersion: number;
  method?: LoginMethod;
  iat?: number;
}
interface SessionOpts {
  now: Date;
  secret: string;
}

const b64 = (b: Buffer | string) => Buffer.from(b).toString("base64url");
const sessionMac = (body: string, secret: string) => createHmac("sha256", `session:${secret}`).update(body).digest();

/** Signed cookie tied to the owner's persistent credential version; old versions cannot authenticate. */
export function signSession(p: SessionPayload, o: SessionOpts): string {
  const body = b64(JSON.stringify({ v: 2, m: p.mobile, s: p.shopId, av: p.authVersion, a: p.method ?? "passcode", iat: o.now.getTime(), exp: o.now.getTime() + SESSION_TTL_MS }));
  return `${body}.${b64(sessionMac(body, o.secret))}`;
}

export function verifySession(token: string, o: SessionOpts): (SessionPayload & { iat: number }) | null {
  const parts = (token ?? "").split(".");
  if (parts.length !== 2 || !parts[0] || !parts[1]) return null;
  try {
    const expected = sessionMac(parts[0], o.secret);
    const given = Buffer.from(parts[1], "base64url");
    if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null;
    const d = JSON.parse(Buffer.from(parts[0], "base64url").toString("utf8")) as { v: number; m: string; s: string; av: number; a: LoginMethod; iat: number; exp: number };
    if (d.v !== 2 || !Number.isSafeInteger(d.av) || d.av < 0 || typeof d.m !== "string" || typeof d.s !== "string" || !["passcode", "otp"].includes(d.a) || !Number.isFinite(d.iat) || typeof d.exp !== "number" || !Number.isFinite(d.exp) || o.now.getTime() >= d.exp || d.iat > o.now.getTime() + 60_000) return null;
    return { mobile: d.m, shopId: d.s, authVersion: d.av, method: d.a, iat: d.iat };
  } catch {
    return null;
  }
}

/* ---------------------------------------------------------------- failure counting */

/** Counts failures per key inside a rolling window. In memory: a restart clears it, which is fine for lockouts. */
export class AttemptLimiter {
  private hits = new Map<string, number[]>();
  constructor(
    public readonly max: number,
    private windowMs: number,
  ) {}

  count(key: string, now: Date): number {
    const t = now.getTime();
    const fresh = (this.hits.get(key) ?? []).filter((x) => t - x < this.windowMs);
    if (fresh.length) this.hits.set(key, fresh);
    else this.hits.delete(key);
    return fresh.length;
  }

  fail(key: string, now: Date) {
    this.count(key, now);
    this.hits.set(key, [...(this.hits.get(key) ?? []), now.getTime()]);
    if (this.hits.size > 5000) this.hits.clear();
  }

  reset(key: string) {
    this.hits.delete(key);
  }
}

/* ---------------------------------------------------------------- the service */

const GENERIC_LOGIN_ERROR = () => new AuthError("bad_credentials", "Mobile ya passcode galat hai", "Mobile aur passcode dobara check karo.", 401);

let dummyHash: Promise<string> | null = null;

export async function setupOwner(
  store: LedgerStore,
  input: { shopId: string; shopName: string; upiVpa: string; name: string; mobile: string; passcode: string; now: Date },
): Promise<OwnerPublic> {
  const mobile = normalizeMobile(input.mobile);
  if (!mobile) throw new AuthError("bad_mobile", "Mobile number is not valid", "Mobile number saaf likho, jaise 10 ank.");
  const name = input.name.trim().slice(0, 60);
  const shopName = input.shopName.trim().slice(0, 80);
  if (!name || !shopName) throw new AuthError("bad_request", "Name and shop name are required", "Apna naam aur dukaan ka naam likho.");
  if (isWeakPasscode(input.passcode)) throw new AuthError("weak_passcode", "Passcode is too weak", "Passcode kam se kam 8 akshar ka rakho, aur sirf ank nahi.");
  if (await store.getOwner(input.shopId)) throw new AuthError("already_set_up", "This shop already has an owner", "Dukaan pehle se set hai. Login karo.", 409);
  await store.createShop({ id: input.shopId, name: shopName, upiVpa: input.upiVpa.trim(), isDemo: false });
  try {
    await store.createOwner({ shopId: input.shopId, name, mobile, passcodeHash: await hashPasscode(input.passcode), authVersion: 0, createdAt: input.now.toISOString() });
  } catch {
    throw new AuthError("already_set_up", "This shop already has an owner", "Dukaan pehle se set hai. Login karo.", 409);
  }
  return { shopId: input.shopId, name, mobile, authVersion: 0 };
}

export async function loginWithPasscode(
  store: LedgerStore,
  limiter: AttemptLimiter,
  input: { shopId: string; mobile: string; passcode: string; now: Date; ip: string },
): Promise<OwnerPublic> {
  const mobile = normalizeMobile(input.mobile);
  const mKey = `m:${mobile ?? input.mobile}`;
  const iKey = `ip:${input.ip}`;
  if (limiter.count(mKey, input.now) >= limiter.max || limiter.count(iKey, input.now) >= limiter.max * 4) {
    throw new AuthError("locked", "Too many wrong attempts", "Bahut galat koshish. 15 minute baad dobara try karo.", 429);
  }
  const owner = await store.getOwner(input.shopId);
  dummyHash ??= hashPasscode("dummy-passcode-for-timing");
  // verify against a dummy hash when there is no match, so timing does not reveal which numbers exist
  const ok = await verifyPasscode(input.passcode ?? "", owner && mobile === owner.mobile ? owner.passcodeHash : await dummyHash);
  if (!owner || !mobile || mobile !== owner.mobile || !ok) {
    limiter.fail(mKey, input.now);
    limiter.fail(iKey, input.now);
    throw GENERIC_LOGIN_ERROR();
  }
  limiter.reset(mKey);
  limiter.reset(iKey);
  return { shopId: owner.shopId, name: owner.name, mobile: owner.mobile, authVersion: owner.authVersion };
}

export async function changePasscode(store: LedgerStore, input: { shopId: string; current?: string; next: string; skipCurrent?: boolean }) {
  const owner = await store.getOwner(input.shopId);
  if (!owner) throw new AuthError("setup_required", "No owner yet", "Pehle dukaan set karo.", 401);
  if (!input.skipCurrent && !(await verifyPasscode(input.current ?? "", owner.passcodeHash))) throw GENERIC_LOGIN_ERROR();
  if (isWeakPasscode(input.next)) throw new AuthError("weak_passcode", "Passcode is too weak", "Passcode kam se kam 8 akshar ka rakho, aur sirf ank nahi.");
  await store.setPasscodeHash(input.shopId, await hashPasscode(input.next));
}
