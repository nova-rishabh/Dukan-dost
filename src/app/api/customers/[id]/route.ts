import { computeBalances } from "@/lib/ledger";
import { getContext } from "@/server/context";
import { HttpError, rateLimit, readJson, route } from "@/server/http";
import { CustomerManageBody } from "@/lib/operationSchemas";
import { hasDevanagari, transliterate } from "@/lib/text";

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

export const PATCH = route("customers.update", async (req, { params }) => {
  rateLimit(req, "customers", 60); const { store, shopId } = getContext();
  const body = CustomerManageBody.parse(await readJson(req));
  const customers = await store.listCustomers(shopId);
  const existing = customers.find((c) => c.id === params.id);
  if (!existing) throw new HttpError(404, "not_found", "Customer not found", "Customer list se chuno.");
  if (body.name !== existing.name && customers.some((c) => c.id !== params.id && c.name.trim().toLocaleLowerCase() === body.name.toLocaleLowerCase()) && !body.separate) throw new HttpError(409, "same_name", "Confirm these are different people before using the same name.", "Alag vyakti ho to alag khata chuno.");
  const customer = await store.updateCustomer(shopId, params.id, {
    name: body.name, area: body.area || undefined,
    nameRoman: (hasDevanagari(body.name) ? transliterate(body.name) : body.name).toLowerCase(),
    nameDevanagari: hasDevanagari(body.name) ? body.name : undefined,
    ...(body.phoneE164 !== undefined ? { phoneE164: body.phoneE164 || undefined } : {}),
    ...(body.archived !== undefined ? { archivedAt: body.archived ? existing.archivedAt ?? new Date().toISOString() : undefined } : {}),
  });
  await store.appendAudit(shopId, "customer_updated", { customerId: params.id, archived: body.archived }, new Date().toISOString());
  return { customer: customer && { id: customer.id, name: customer.name, area: customer.area, archivedAt: customer.archivedAt } };
});
