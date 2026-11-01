import { AuthError } from "@/lib/auth";
import { WaVerifyBody } from "@/lib/schemas";
import { confirmWaCode } from "@/lib/waAuth";
import { sessionCookie } from "@/server/auth";
import { getContext } from "@/server/context";
import { rateLimit, readJson, route } from "@/server/http";

export const runtime = "nodejs";

export const POST = route(
  "auth.wa.verify",
  async (req) => {
    rateLimit(req, "waverify", 20);
    const ctx = getContext();
    if (!ctx.authRequired || !ctx.wa) throw new AuthError("wa_unavailable", "WhatsApp login is not configured", "WhatsApp login chalu nahi hai. Passcode se login karo.", 503);
    const body = WaVerifyBody.parse(await readJson(req));
    const target = await ctx.store.getOwnerByMobile(body.mobile);
    const owner = await confirmWaCode(ctx.store, ctx.wa, { shopId: target?.shopId ?? "missing-owner", mobile: body.mobile, code: body.code });
    return Response.json({ ok: true, owner: { name: owner.name } }, { headers: { "set-cookie": sessionCookie(req, owner, ctx, "otp") } });
  },
  { public: true },
);
