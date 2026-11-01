import { AuthError, loginWithPasscode } from "@/lib/auth";
import { LoginBody } from "@/lib/schemas";
import { sessionCookie } from "@/server/auth";
import { getContext } from "@/server/context";
import { clientIp, HttpError, rateLimit, readJson, route } from "@/server/http";

export const runtime = "nodejs";

export const POST = route(
  "auth.login",
  async (req) => {
    rateLimit(req, "login", 30);
    const ctx = getContext();
    if (!ctx.authRequired) throw new HttpError(404, "not_found", "No login in demo mode", "Yeh demo dukaan hai, login nahi chahiye.");
    const body = LoginBody.parse(await readJson(req));
    if (!(await ctx.store.hasOwners())) throw new AuthError("setup_required", "The shop is not set up yet", "Pehle dukaan set karo.", 401);
    const target = await ctx.store.getOwnerByMobile(body.mobile);
    const owner = await loginWithPasscode(ctx.store, ctx.loginLimiter, { shopId: target?.shopId ?? "missing-owner", mobile: body.mobile, passcode: body.passcode, now: new Date(), ip: clientIp(req) });
    return Response.json({ ok: true, owner: { name: owner.name } }, { headers: { "set-cookie": sessionCookie(req, owner, ctx, "passcode") } });
  },
  { public: true },
);
