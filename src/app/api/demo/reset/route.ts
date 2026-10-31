import { getContext } from "@/server/context";
import { HttpError, rateLimit, route } from "@/server/http";

export const runtime = "nodejs";

/** Demo only: puts the fictional shop back to its seeded state. Refused for a real (non-demo) shop. */
export const POST = route("demo.reset", async (req) => {
  rateLimit(req, "reset", 30);
  const ctx = getContext();
  const shop = await ctx.store.getShop(ctx.shopId);
  if (!shop?.isDemo || ctx.store.kind !== "local") throw new HttpError(403, "not_demo", "Reset is only for the local demo shop", "Yeh sirf demo dukaan ke liye hai.");
  await ctx.store.reset();
  return { reset: true };
});
