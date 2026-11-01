import { AuthError } from "@/lib/auth";
import { SendReminderBody } from "@/lib/schemas";
import { waSendMessage } from "@/lib/waService";
import { appUrl, getContext } from "@/server/context";
import { rateLimit, readJson, route } from "@/server/http";
import { sendConfirmedReminder } from "@/server/sendReminder";

export const runtime = "nodejs";

/**
 * Sends one reminder through the paired WhatsApp device. It runs only when the signed-in owner taps
 * "WhatsApp se bhejo" and confirms; nothing here is scheduled or automatic. The text must contain a
 * pay link that this server issued for this customer, so the route cannot send anything else.
 */
export const POST = route("remind.send", async (req) => {
  rateLimit(req, "remindsend", 10);
  const ctx = getContext();
  if (!ctx.authRequired || !ctx.wa) throw new AuthError("wa_unavailable", "Sending is not configured", "WhatsApp bhejna chalu nahi hai. WhatsApp kholo se bhejo.", 503);
  const body = SendReminderBody.parse(await readJson(req));
  return sendConfirmedReminder(ctx.store, body, { shopId: ctx.shopId, secret: ctx.secret, appUrl: await appUrl(req), now: new Date(), send: (input) => waSendMessage(ctx.wa!, input) });
});
