import { changePasscode } from "@/lib/auth";
import { PasscodeBody } from "@/lib/schemas";
import { clearedCookie } from "@/server/auth";
import { getContext } from "@/server/context";
import { rateLimit, readJson, route } from "@/server/http";

export const runtime = "nodejs";
const FRESH_OTP_MS = 15 * 60_000;

/** Change the passcode. Someone who just logged in with a WhatsApp code (a forgotten passcode) may skip the current one. */
export const POST = route("auth.passcode", async (req, { session }) => {
  rateLimit(req, "passcode", 10);
  const ctx = getContext();
  const body = PasscodeBody.parse(await readJson(req));
  const fresh = session?.method === "otp" && Date.now() - (session.iat ?? 0) < FRESH_OTP_MS;
  await changePasscode(ctx.store, { shopId: ctx.shopId, current: body.current, next: body.next, skipCurrent: fresh });
  return Response.json({ ok: true, changed: true }, { headers: { "set-cookie": clearedCookie(req) } });
});
