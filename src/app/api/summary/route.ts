import { getSummary } from "@/lib/ledger";
import { getContext } from "@/server/context";
import { rateLimit, route } from "@/server/http";

export const runtime = "nodejs";

export const GET = route("summary", async (req) => {
  rateLimit(req, "summary", 240);
  const ctx = getContext();
  const shop = await ctx.store.getShop(ctx.shopId);
  return { summary: await getSummary(ctx.store, ctx.shopId), shopName: shop?.name ?? "Dukaan", demoMode: ctx.status.demoMode, isDemoShop: shop?.isDemo ?? true };
});
