import { getSummary } from "@/lib/ledger";
import { getContext } from "@/server/context";
import { HttpError, rateLimit, route } from "@/server/http";

export const runtime = "nodejs";

export const POST = route("stock.resolve", async (req, { params }) => {
  rateLimit(req, "stock", 120);
  const ctx = getContext();
  const flag = await ctx.store.resolveStockFlag(ctx.shopId, params.id, new Date().toISOString());
  if (!flag) throw new HttpError(404, "not_found", "Stock note not found", "Yeh note nahi mila.");
  return { summary: await getSummary(ctx.store, ctx.shopId) };
});
