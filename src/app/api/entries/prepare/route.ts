import { z } from "zod";
import { parseRupeeText, paiseInWords } from "@/lib/exact-money";
import { formatINR } from "@/lib/money";
import { signManualEntry } from "@/lib/proposal";
import { getContext } from "@/server/context";
import { HttpError, rateLimit, readJson, route } from "@/server/http";

export const runtime = "nodejs";
export const POST = route("entries.prepare", async (req) => {
  rateLimit(req, "entries-prepare", 120);
  const body = z.object({ customerId: z.string().min(1).max(64), type: z.enum(["credit_given", "payment_received"]), amount: z.string().max(12), note: z.string().trim().max(140).default("") }).parse(await readJson(req));
  const ctx = getContext();
  const customer = (await ctx.store.listCustomers(ctx.shopId)).find((c) => c.id === body.customerId);
  if (!customer || customer.archivedAt) throw new HttpError(404, "not_found", "Choose an active customer", "Chalu customer chuno.");
  let amountPaise: number;
  try { amountPaise = parseRupeeText(body.amount); }
  catch { throw new HttpError(400, "invalid_amount", "Enter a positive amount with at most two decimal places, up to ₹1,00,000.", "Sahi rakam likho, paise ke do ank tak."); }
  const sourceText = `Manual entry: ${customer.name}; ${body.type === "credit_given" ? "credit given" : "payment received"}; ${formatINR(amountPaise)}${body.note ? `; ${body.note}` : ""}`;
  const token = signManualEntry({ customerId: customer.id, type: body.type, amountPaise, sourceText }, { shopId: ctx.shopId, now: new Date(), secret: ctx.secret });
  return { token, customer: { id: customer.id, name: customer.name, area: customer.area }, type: body.type, amountPaise, words: paiseInWords(amountPaise), note: body.note, secondRequired: amountPaise >= 500_000 };
});
