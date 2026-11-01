import { getContext } from "@/server/context";
import { rateLimit, route } from "@/server/http";
export const runtime = "nodejs";
export const GET = route("shop.activity", async (req) => {
  rateLimit(req, "activity", 120); const ctx = getContext();
  const [events, deliveries, customers] = await Promise.all([ctx.store.listAudit(ctx.shopId, 100), ctx.store.listReminderHistory(ctx.shopId, 100), ctx.store.listCustomers(ctx.shopId)]);
  return { events: events.map((e) => ({ id: e.id, kind: e.kind, createdAt: e.createdAt })), reminders: deliveries.map((r) => ({ ...r, customerName: customers.find((c) => c.id === r.customerId)?.name ?? "" })) };
});
