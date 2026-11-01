import { getContext } from "@/server/context";
import { rateLimit, route } from "@/server/http";
export const runtime = "nodejs";
export const GET = route("shop.export", async (req) => {
  rateLimit(req, "shop-export", 10);
  const ctx = getContext(); const snapshot = await ctx.store.exportBusiness(ctx.shopId);
  return new Response(JSON.stringify(snapshot, null, 2), { headers: { "content-type": "application/json; charset=utf-8", "content-disposition": 'attachment; filename="dukaan-dost-business-v1.json"', "cache-control": "no-store" } });
});
