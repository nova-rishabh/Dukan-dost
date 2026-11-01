import { AuthError, normalizeMobile } from "@/lib/auth";
import { LedgerError } from "@/lib/ledger";
import { SendReminderBody } from "@/lib/schemas";
import { waSendMessage } from "@/lib/waService";
import { getContext } from "@/server/context";
import { HttpError, rateLimit, readJson, route } from "@/server/http";

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
  if (body.confirmed !== true) throw new LedgerError("not_confirmed", "Send was not confirmed", "Bhejne se pehle pakka karo.");
  const to = normalizeMobile(body.phone);
  if (!to) throw new AuthError("bad_mobile", "Phone number is not valid", "Customer ka number desh code ke saath likho.");
  const token = new URL(body.payUrl).pathname.split("/").filter(Boolean).pop() ?? "";
  const pay = await ctx.store.getPayToken(token);
  if (!pay || pay.shopId !== ctx.shopId || pay.customerId !== body.customerId || !body.text.includes(body.payUrl)) {
    throw new HttpError(400, "bad_request", "Message does not match a pay link for this customer", "Pehle Yaad dilao se message banao, phir bhejo.");
  }
  const sent = await waSendMessage(ctx.wa, { to, text: body.text });
  await ctx.store.appendAudit(ctx.shopId, "reminder_sent", { customerId: body.customerId, amountPaise: pay.amountPaise, messageId: sent.id, simulated: sent.simulated }, new Date().toISOString());
  return { sent: !sent.simulated, simulated: sent.simulated };
});
