import { AuthError } from "@/lib/auth";
import { waCaptcha } from "@/lib/waService";
import { getContext } from "@/server/context";
import { rateLimit, route } from "@/server/http";

export const runtime = "nodejs";

/** The daemon's picture CAPTCHA, required before it will send a code. */
export const GET = route(
  "auth.wa.captcha",
  async (req) => {
    rateLimit(req, "wacaptcha", 30);
    const ctx = getContext();
    if (!ctx.authRequired || !ctx.wa) throw new AuthError("wa_unavailable", "WhatsApp login is not configured", "WhatsApp login chalu nahi hai. Passcode se login karo.", 503);
    return await waCaptcha(ctx.wa);
  },
  { public: true },
);
