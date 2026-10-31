import { createStockFlag, getSummary } from "@/lib/ledger";
import { StockBody } from "@/lib/schemas";
import { getContext } from "@/server/context";
import { rateLimit, readJson, route } from "@/server/http";

export const runtime = "nodejs";

export const POST = route("stock.create", async (req) => {
  rateLimit(req, "stock", 120);
  const ctx = getContext();
  const body = StockBody.parse(await readJson(req));
  const result = await createStockFlag(ctx.store, { ...body, shopId: ctx.shopId }, { now: new Date(), secret: ctx.secret });
  return { flag: result.flag, created: result.created, summary: await getSummary(ctx.store, ctx.shopId) };
});
