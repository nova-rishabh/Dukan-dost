import { AuthError } from "@/lib/auth";
import { WaSendBody } from "@/lib/schemas";
import { requestWaCode } from "@/lib/waAuth";
import { getContext } from "@/server/context";
import { clientIp, rateLimit, readJson, route } from "@/server/http";

export const runtime = "nodejs";

/** Asks the daemon to WhatsApp a login code to the owner. Any other number gets the same answer and no message. */
export const POST = route(
  "auth.wa.send",
  async (req) => {
    rateLimit(req, "wasend", 10);
    const ctx = getContext();
    if (!ctx.authRequired || !ctx.wa) throw new AuthError("wa_unavailable", "WhatsApp login is not configured", "WhatsApp login chalu nahi hai. Passcode se login karo.", 503);
    if (!(await ctx.store.hasOwners())) throw new AuthError("setup_required", "The shop is not set up yet", "Pehle dukaan set karo.", 401);
    const body = WaSendBody.parse(await readJson(req));
    const target = await ctx.store.getOwnerByMobile(body.mobile);
    return await requestWaCode(ctx.store, ctx.wa, { shopId: target?.shopId ?? "missing-owner", mobile: body.mobile, captchaId: body.captchaId, captchaCode: body.captchaCode, ip: clientIp(req) });
  },
  { public: true },
);
