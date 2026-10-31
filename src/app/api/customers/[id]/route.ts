import { computeBalances } from "@/lib/ledger";
import { getContext } from "@/server/context";
import { HttpError, rateLimit, route } from "@/server/http";

export const runtime = "nodejs";

export const GET = route("customers.get", async (req, { params }) => {
  rateLimit(req, "customers", 240);
  const ctx = getContext();
  const [customers, entries] = await Promise.all([ctx.store.listCustomers(ctx.shopId), ctx.store.listEntries(ctx.shopId)]);
  const customer = customers.find((c) => c.id === params.id);
  if (!customer) throw new HttpError(404, "not_found", "Customer not found", "Customer list se chuno.");
  const mine = entries
    .filter((e) => e.customerId === customer.id)
    .sort((a, b) => new Date(a.confirmedAt).getTime() - new Date(b.confirmedAt).getTime());
  return {
    customer: { id: customer.id, name: customer.name, area: customer.area },
    entries: mine.map((e) => ({ id: e.id, type: e.type, amountPaise: e.amountPaise, sourceText: e.sourceText, confirmedAt: e.confirmedAt, voidedAt: e.voidedAt, voidReason: e.voidReason })),
    balancePaise: computeBalances([customer], entries).get(customer.id) ?? 0,
  };
});
