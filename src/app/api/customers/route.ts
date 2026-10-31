import { computeBalances } from "@/lib/ledger";
import { resolveCustomer } from "@/lib/resolve";
import { CustomerBody } from "@/lib/schemas";
import { hasDevanagari, transliterate } from "@/lib/text";
import { getContext } from "@/server/context";
import { rateLimit, readJson, route } from "@/server/http";

export const runtime = "nodejs";

export const GET = route("customers.list", async (req) => {
  rateLimit(req, "customers", 240);
  const ctx = getContext();
  const q = new URL(req.url).searchParams.get("q")?.trim().slice(0, 60);
  const [customers, entries] = await Promise.all([ctx.store.listCustomers(ctx.shopId), ctx.store.listEntries(ctx.shopId)]);
  const balances = computeBalances(customers, entries);
  const ids = q ? new Set(resolveCustomerIds(q, customers)) : null;
  const list = customers
    .filter((c) => !ids || ids.has(c.id))
    .map((c) => ({ id: c.id, name: c.name, area: c.area, balancePaise: balances.get(c.id) ?? 0 }))
    .sort((a, b) => b.balancePaise - a.balancePaise || a.name.localeCompare(b.name));
  return { customers: list };
});

function resolveCustomerIds(q: string, customers: Parameters<typeof resolveCustomer>[1]) {
  const r = resolveCustomer(q, customers);
  return r.candidates.map((c) => c.customerId);
}

export const POST = route("customers.create", async (req) => {
  rateLimit(req, "customers", 60);
  const ctx = getContext();
  const body = CustomerBody.parse(await readJson(req));
  const customers = await ctx.store.listCustomers(ctx.shopId);
  const found = resolveCustomer(body.name, customers);
  if (found.decision === "exact") {
    const c = customers.find((x) => x.id === found.candidates[0].customerId)!;
    return { customer: { id: c.id, name: c.name, area: c.area }, created: false };
  }
  const roman = (hasDevanagari(body.name) ? transliterate(body.name) : body.name).toLowerCase();
  const customer = await ctx.store.createCustomer({
    shopId: ctx.shopId,
    name: body.name,
    area: body.area,
    nameRoman: roman,
    nameDevanagari: hasDevanagari(body.name) ? body.name : undefined,
    aliases: [],
  });
  await ctx.store.appendAudit(ctx.shopId, "customer_created", { customerId: customer.id }, new Date().toISOString());
  return { customer: { id: customer.id, name: customer.name, area: customer.area }, created: true };
});
