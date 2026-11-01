import { computeBalances } from "@/lib/ledger";
import { createPayToken } from "@/lib/pay";
import { buildReminderText, buildWaUrl } from "@/lib/remind";
import { RemindBody } from "@/lib/schemas";
import { appUrl, getContext } from "@/server/context";
import { HttpError, rateLimit, readJson, route } from "@/server/http";

export const runtime = "nodejs";

/** Builds a draft. Nothing is sent: the owner opens WhatsApp with the text ready and presses Send. */
export const POST = route("remind", async (req) => {
  rateLimit(req, "remind", 60);
  const ctx = getContext();
  const body = RemindBody.parse(await readJson(req));
  const now = new Date();
  const [shop, customers, entries] = await Promise.all([ctx.store.getShop(ctx.shopId), ctx.store.listCustomers(ctx.shopId), ctx.store.listEntries(ctx.shopId)]);
  const customer = customers.find((c) => c.id === body.customerId);
  if (!customer || !shop) throw new HttpError(404, "not_found", "Customer not found", "Customer chuno.");
  if (!shop.isDemo && !/^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+$/.test(shop.upiVpa)) throw new HttpError(409, "upi_required", "Configure your shop UPI ID in Settings before creating a payment link", "Settings mein dukaan ki UPI ID set karo.");
  const balance = computeBalances([customer], entries).get(customer.id) ?? 0;
  if (balance <= 0) throw new HttpError(409, "nothing_due", "No balance due", "Is customer ka kuch baaki nahi hai.");
  const token = await createPayToken(ctx.store, { shopId: ctx.shopId, customerId: customer.id, amountPaise: balance, now });
  const payUrl = `${await appUrl(req)}/pay/${token.token}`;
  const text = buildReminderText({ customerName: customer.name, shopName: shop.name, amountPaise: balance, payUrl, locale: body.locale });
  await ctx.store.appendAudit(ctx.shopId, "reminder_opened", { customerId: customer.id, amountPaise: balance }, now.toISOString());
  return { text, waUrl: buildWaUrl({ text }), payUrl, amountPaise: balance, expiresAt: token.expiresAt };
});
