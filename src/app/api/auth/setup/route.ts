import { timingSafeEqual } from "node:crypto";
import { AuthError, setupOwner } from "@/lib/auth";
import { SetupBody } from "@/lib/schemas";
import { sessionCookie } from "@/server/auth";
import { getContext } from "@/server/context";
import { clientIp, HttpError, rateLimit, readJson, route } from "@/server/http";

export const runtime = "nodejs";

const same = (a: string, b: string) => {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
};

/** First run only: creates the shop and its one owner, then signs the owner in. Needs the setup code. */
export const POST = route(
  "auth.setup",
  async (req) => {
    rateLimit(req, "setup", 10);
    const ctx = getContext();
    if (!ctx.authRequired) throw new HttpError(404, "not_found", "No setup in demo mode", "Yeh demo dukaan hai, set karne ki zaroorat nahi.");
    const body = SetupBody.parse(await readJson(req));
    const key = `setup:${clientIp(req)}`;
    const now = new Date();
    if (ctx.loginLimiter.count(key, now) >= ctx.loginLimiter.max) throw new AuthError("locked", "Too many wrong setup codes", "Bahut galat koshish. 15 minute baad try karo.", 429);
    if (!same(body.setupCode.trim(), ctx.setupCode)) {
      ctx.loginLimiter.fail(key, now);
      throw new AuthError("bad_credentials", "Setup code is wrong", "Setup code galat hai. Woh .data/setup-code.txt mein hai.", 403);
    }
    const owner = await setupOwner(ctx.store, {
      shopId: ctx.shopId,
      shopName: body.shopName,
      upiVpa: body.upiVpa || ctx.upiVpa,
      name: body.name,
      mobile: body.mobile,
      passcode: body.passcode,
      now,
    });
    ctx.loginLimiter.reset(key);
    return Response.json({ ok: true, owner: { name: owner.name } }, { headers: { "set-cookie": sessionCookie(req, owner, ctx, "passcode") } });
  },
  { public: true },
);
