import { createHash, randomBytes, randomUUID } from "node:crypto";
import { z } from "zod";
import { AuthError, hashPasscode, isWeakPasscode, normalizeMobile } from "@/lib/auth";
import type { RegistrationChallenge } from "@/lib/types";
import { waResultVerify, waSendOtp, waVerifyOtp } from "@/lib/waService";
import { sessionCookie } from "./auth";
import { getContext } from "./context";
import { clientIp, HttpError, rateLimit, readJson } from "./http";

const COOKIE = "dd_registration";
const TTL = 10 * 60_000;
const hash = (value: string) => createHash("sha256").update(value).digest("hex");
const secure = (req: Request) => new URL(req.url).protocol === "https:" || req.headers.get("x-forwarded-proto") === "https";
const cookie = (req: Request, value: string) => `${COOKIE}=${value}; Path=/api/auth/register; HttpOnly; SameSite=Lax; Max-Age=${TTL / 1000}${secure(req) ? "; Secure" : ""}`;
const invalid = () => new HttpError(401, "invalid_registration", "Verification expired or unavailable", "Verify your WhatsApp number again.");

async function proof(req: Request): Promise<RegistrationChallenge> {
  await getContext().store.pruneRegistrations(new Date().toISOString());
  const value = (req.headers.get("cookie") ?? "").split(";").map((s) => s.trim()).find((s) => s.startsWith(`${COOKIE}=`))?.slice(COOKIE.length + 1);
  const [id, secret] = (value ?? "").split(".");
  if (!id || !secret || secret.length !== 43) throw invalid();
  const row = await getContext().store.getRegistration(id);
  if (!row || row.browserHash !== hash(secret) || Date.parse(row.expiresAt) <= Date.now()) throw invalid();
  return row;
}

function requireWhatsApp() {
  const ctx = getContext();
  if (!ctx.authRequired || !ctx.wa) throw new AuthError("wa_unavailable", "WhatsApp verification is unavailable", "Please try again when WhatsApp is connected.", 503);
  return { ...ctx, wa: ctx.wa };
}

export async function startRegistration(req: Request) {
  rateLimit(req, "register-start", 10, 15 * 60_000);
  const ctx = requireWhatsApp();
  await ctx.store.pruneRegistrations(new Date().toISOString());
  const body = z.object({ mobile: z.string().max(30), purpose: z.enum(["signup", "recovery"]), captchaId: z.string().min(1).max(200), captchaCode: z.string().min(1).max(20) }).parse(await readJson(req));
  const mobile = normalizeMobile(body.mobile);
  if (!mobile) throw new AuthError("bad_mobile", "Mobile number is not valid", "Enter your WhatsApp number.");
  const key = `registration:${hash(mobile)}`;
  const now = new Date();
  if (ctx.loginLimiter.count(key, now) >= 5) throw new AuthError("rate_limited", "Too many verification requests", "Wait 15 minutes before requesting another code.", 429);
  ctx.loginLimiter.fail(key, now);
  const secret = randomBytes(32).toString("base64url");
  const challenge: RegistrationChallenge = { id: randomUUID(), browserHash: hash(secret), mobile, purpose: body.purpose, state: "requested", expiresAt: new Date(now.getTime() + TTL).toISOString() };
  await ctx.store.createRegistration(challenge);
  try {
    // Sending for both purposes has the same public response, whether an account exists or not.
    await waSendOtp(ctx.wa, { mobile, captchaId: body.captchaId, captchaCode: body.captchaCode, name: "Shop owner", email: "owner@dukaan-dost.invalid", ip: clientIp(req) });
  } catch (error) {
    await ctx.store.transitionRegistration(challenge.id, challenge.browserHash, "requested", "failed");
    throw error;
  }
  return Response.json({ ok: true, state: "requested", purpose: body.purpose }, { headers: { "set-cookie": cookie(req, `${challenge.id}.${secret}`), "cache-control": "no-store" } });
}

export async function registrationStatus(req: Request) {
  const row = await proof(req);
  return { state: row.state, purpose: row.purpose };
}

export async function verifyRegistration(req: Request) {
  rateLimit(req, "register-verify", 20);
  const ctx = requireWhatsApp();
  const row = await proof(req);
  const body = z.object({ code: z.string().regex(/^\d{6}$/) }).parse(await readJson(req));
  if (row.state === "verified" || row.state === "completed") return { state: row.state, purpose: row.purpose };
  if ((row.verifyAttempts ?? 0) >= 5) throw new HttpError(429, "verification_locked", "Too many incorrect verification attempts", "Request a new verification code.");
  if (!(await ctx.store.transitionRegistration(row.id, row.browserHash, "requested", "verifying"))) throw new HttpError(409, "verification_in_progress", "Verification is already in progress", "Check verification status, or request a new code.");
  try {
    const token = await waVerifyOtp(ctx.wa, { mobile: row.mobile, code: body.code });
    const result = await waResultVerify(ctx.wa, token);
    if (normalizeMobile(result.mobile) !== row.mobile) {
      await ctx.store.transitionRegistration(row.id, row.browserHash, "verifying", "failed");
      throw invalid();
    }
    if (Date.parse(row.expiresAt) <= Date.now() || !(await ctx.store.transitionRegistration(row.id, row.browserHash, "verifying", "verified"))) throw invalid();
    return { state: "verified", purpose: row.purpose };
  } catch (error) {
    await ctx.store.transitionRegistration(row.id, row.browserHash, "verifying", "requested");
    throw error;
  }
}

export async function completeRegistration(req: Request) {
  rateLimit(req, "register-complete", 15);
  const ctx = requireWhatsApp();
  const row = await proof(req);
  const body = z.object({ confirmed: z.literal(true), name: z.string().trim().min(1).max(60).optional(), shopName: z.string().trim().min(1).max(80).optional(), upiVpa: z.string().trim().max(100).regex(/^(?:[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+)?$/).optional(), passcode: z.string().max(128).optional() }).parse(await readJson(req));
  if (body.passcode !== undefined && isWeakPasscode(body.passcode)) throw new AuthError("weak_passcode", "Passcode is too weak", "Use at least 8 characters and avoid common passcodes.");
  if (row.purpose === "recovery" && !body.passcode) throw new HttpError(400, "passcode_required", "Enter a new passcode", "Choose a new passcode to recover your account.");
  const existing = await ctx.store.getOwnerByMobile(row.mobile);
  if (row.purpose === "signup" && !existing && (!body.name || !body.shopName)) throw new HttpError(400, "profile_required", "Name and shop name are required", "Enter your name and shop name.");
  const shopId = randomUUID();
  const now = new Date().toISOString();
  const passcodeHash = body.passcode ? await hashPasscode(body.passcode) : "otp-only";
  try {
    const result = await ctx.store.completeRegistration({ id: row.id, browserHash: row.browserHash, now, shop: { id: shopId, name: body.shopName ?? "", upiVpa: body.upiVpa ?? "", isDemo: false }, owner: { shopId, name: body.name ?? "", mobile: row.mobile, passcodeHash, authVersion: 0, createdAt: now }, nextPasscodeHash: body.passcode ? passcodeHash : undefined });
    return Response.json({ ok: true, created: result.created, state: "completed" }, { headers: { "set-cookie": sessionCookie(req, result.owner, ctx, "otp"), "cache-control": "no-store" } });
  } catch (error) {
    if (error instanceof Error && ["invalid_registration", "stale_registration", "owner_not_found", "duplicate_mobile"].includes(error.message)) throw invalid();
    throw error;
  }
}
