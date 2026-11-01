import { createHmac } from "node:crypto";
import { AuthError, normalizeMobile } from "@/lib/auth";
import { computeBalances, LedgerError } from "@/lib/ledger";
import type { LedgerStore } from "@/lib/store/types";
import type { ReminderDelivery } from "@/lib/types";
import { HttpError } from "./http";

interface SendBody { customerId: string; phone: string; text: string; payUrl: string; confirmed: boolean }
type SendResult = { id: string | null; simulated: boolean };

function existingResult(delivery: ReminderDelivery, fingerprint: string) {
  if (delivery.fingerprint !== fingerprint) throw new HttpError(409, "draft_already_used", "This draft was already used differently", "Yeh draft pehle use ho chuka hai. Dobara bhejne se pehle customer ka WhatsApp check karo.");
  if (delivery.status === "sent") return { sent: !delivery.simulated, simulated: delivery.simulated === true, replayed: true };
  throw new HttpError(409, "delivery_unknown", "Delivery is pending or unknown; refusing another send", "Message gaya ya nahi, pakka nahi hai. Customer ka WhatsApp check karo. Isi draft se dobara nahi bhejenge.");
}

/** A durable reservation happens before the network call. A crash/timeout never permits a blind resend. */
export async function sendConfirmedReminder(store: LedgerStore, body: SendBody, opts: { shopId: string; secret: string; appUrl: string; now: Date; send: (input: { to: string; text: string }) => Promise<SendResult> }) {
  if (body.confirmed !== true) throw new LedgerError("not_confirmed", "Send was not confirmed", "Bhejne se pehle pakka karo.");
  const to = normalizeMobile(body.phone);
  if (!to) throw new AuthError("bad_mobile", "Phone number is not valid", "Customer ka number desh code ke saath likho.");
  const url = new URL(body.payUrl);
  const token = url.pathname.split("/").filter(Boolean).pop() ?? "";
  const expectedUrl = new URL(`${opts.appUrl.replace(/\/$/, "")}/pay/${token}`);
  if (url.href !== expectedUrl.href || url.username || url.password) {
    throw new HttpError(400, "bad_request", "Pay link must use this app's origin and payment path", "Pehle Yaad dilao se is dukaan ka message banao, phir bhejo.");
  }
  const pay = await store.getPayToken(token);
  if (!pay || pay.shopId !== opts.shopId || pay.customerId !== body.customerId || !body.text.includes(body.payUrl)) {
    throw new HttpError(400, "bad_request", "Message does not match a pay link for this customer", "Pehle Yaad dilao se message banao, phir bhejo.");
  }
  const fingerprint = createHmac("sha256", opts.secret).update(JSON.stringify({ to, text: body.text, payUrl: body.payUrl })).digest("hex");
  const existing = await store.getReminderDelivery(opts.shopId, token);
  if (existing) return existingResult(existing, fingerprint);
  if (new Date(pay.expiresAt).getTime() <= opts.now.getTime()) throw new HttpError(409, "draft_expired", "The reminder draft expired", "Draft purana ho gaya. Naya message banao aur phir pakka karo.");
  const [customers, entries] = await Promise.all([store.listCustomers(opts.shopId), store.listEntries(opts.shopId)]);
  const customer = customers.find((c) => c.id === body.customerId);
  const balance = customer ? computeBalances([customer], entries).get(customer.id) ?? 0 : 0;
  if (balance <= 0 || balance !== pay.amountPaise) throw new HttpError(409, "draft_stale", "Customer balance changed after preview", "Khata badal gaya. Naya message banao aur rakam dekh kar phir pakka karo.");
  const reservation = await store.claimReminderDelivery({ shopId: opts.shopId, token, fingerprint, status: "pending", createdAt: opts.now.toISOString() });
  if (!reservation.claimed) return existingResult(reservation.delivery, fingerprint);
  try {
    const sent = await opts.send({ to, text: body.text });
    await store.finishReminderDelivery(opts.shopId, token, { status: "sent", messageId: sent.id ?? undefined, simulated: sent.simulated });
    await store.appendAudit(opts.shopId, "reminder_sent", { customerId: body.customerId, amountPaise: pay.amountPaise, messageId: sent.id, simulated: sent.simulated }, opts.now.toISOString());
    return { sent: !sent.simulated, simulated: sent.simulated, replayed: false };
  } catch {
    // Even a provider error can follow an accepted send. Retain the reservation across retries/restarts.
    await store.finishReminderDelivery(opts.shopId, token, { status: "unknown" });
    throw new HttpError(409, "delivery_unknown", "Could not confirm message delivery", "Message gaya ya nahi, pakka nahi hai. Customer ka WhatsApp check karo. Isi draft se dobara nahi bhejenge.");
  }
}
