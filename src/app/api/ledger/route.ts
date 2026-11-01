import { inPeriod, entryDelta } from "@/lib/reporting";
import { getContext } from "@/server/context";
import { HttpError, route } from "@/server/http";
import { requestPeriod } from "@/server/reporting";

export const runtime = "nodejs";
export const GET = route("ledger.list", async (req) => {
  const period = requestPeriod(req);
  const query = new URL(req.url).searchParams;
  const type = query.get("type") || "all";
  const offset = Number(query.get("offset") || "0");
  const limit = Number(query.get("limit") || "50");
  if (!["all", "credit_given", "payment_received", "voided"].includes(type) || !Number.isSafeInteger(offset) || offset < 0 || offset > 1_000_000 || !Number.isSafeInteger(limit) || limit < 1 || limit > 100) throw new HttpError(400, "bad_request", "Invalid ledger filters", "Filters check karo.");
  const ctx = getContext();
  const [customers, entries] = await Promise.all([ctx.store.listCustomers(ctx.shopId), ctx.store.listEntries(ctx.shopId)]);
  const customerId = query.get("customer");
  const people = new Map(customers.map((c) => [c.id, c]));
  if (customerId && !people.has(customerId)) throw new HttpError(404, "not_found", "Customer not found", "Customer chuno.");
  const balances = new Map<string, number>();
  const rows = [...entries].sort((a, b) => a.confirmedAt.localeCompare(b.confirmedAt) || a.id.localeCompare(b.id)).map((e) => {
    const balance = (balances.get(e.customerId) ?? 0) + entryDelta(e);
    balances.set(e.customerId, balance);
    return { ...e, shopId: undefined, idempotencyKey: undefined, name: people.get(e.customerId)?.name, area: people.get(e.customerId)?.area, balancePaise: balance };
  }).filter((e) => inPeriod(e, period) && (!customerId || e.customerId === customerId) && (type === "all" || (type === "voided" ? !!e.voidedAt : e.type === type)));
  rows.reverse();
  return { rows: rows.slice(offset, offset + limit), offset, limit, total: rows.length, nextOffset: offset + limit < rows.length ? offset + limit : null, generatedAt: new Date().toISOString() };
});
