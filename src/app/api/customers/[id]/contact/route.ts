import { getContext } from "@/server/context";
import { HttpError, route } from "@/server/http";
export const runtime = "nodejs";
/** Owner-only communication detail; lists/exports/activity never expose the saved number. */
export const GET = route("customers.contact", async (_req, { params }) => {
  const ctx = getContext();
  const customer = (await ctx.store.listCustomers(ctx.shopId)).find((c) => c.id === params.id);
  if (!customer) throw new HttpError(404, "not_found", "Customer not found", "Customer chuno.");
  return { phone: customer.phoneE164 ?? null };
});
