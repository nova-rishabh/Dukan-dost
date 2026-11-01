import { computeBalances } from "@/lib/ledger";
import { inPeriod } from "@/lib/reporting";
import { getContext } from "@/server/context";
import { route } from "@/server/http";
import { requestPeriod } from "@/server/reporting";

export const runtime = "nodejs";
export const GET = route("dashboard", async (req) => {
  const ctx = getContext();
  const period = requestPeriod(req);
  const [shop, customers, entries, products, flags] = await Promise.all([
    ctx.store.getShop(ctx.shopId), ctx.store.listCustomers(ctx.shopId), ctx.store.listEntries(ctx.shopId), ctx.store.listProducts(ctx.shopId), ctx.store.listStockFlags(ctx.shopId),
  ]);
  const balances = computeBalances(customers, entries);
  const live = entries.filter((e) => !e.voidedAt && inPeriod(e, period));
  return {
    shopName: shop?.name,
    outstandingPaise: [...balances.values()].reduce((n, b) => n + Math.max(0, b), 0),
    advancesPaise: [...balances.values()].reduce((n, b) => n + Math.max(0, -b), 0),
    creditPaise: live.filter((e) => e.type === "credit_given").reduce((n, e) => n + e.amountPaise, 0),
    receivedPaise: live.filter((e) => e.type === "payment_received").reduce((n, e) => n + e.amountPaise, 0),
    entryCount: live.length,
    customers: customers.map((c) => ({ id: c.id, name: c.name, balancePaise: balances.get(c.id) ?? 0 })).sort((a, b) => b.balancePaise - a.balancePaise).slice(0, 10),
    lowStock: products.filter((p) => !p.archivedAt && p.onHandMinor !== null && p.onHandMinor <= p.lowThresholdMinor),
    unknownStockCount: products.filter((p) => !p.archivedAt && p.onHandMinor === null).length,
    stockNoteCount: flags.filter((f) => !f.resolvedAt).length,
    recent: [...live].sort((a, b) => b.confirmedAt.localeCompare(a.confirmedAt)).slice(0, 10).map((e) => ({ id: e.id, customerId: e.customerId, name: customers.find((c) => c.id === e.customerId)?.name ?? "", type: e.type, amountPaise: e.amountPaise, confirmedAt: e.confirmedAt })),
  };
});
