import { getContext } from "@/server/context";
import { HttpError, rateLimit, route } from "@/server/http";

export const runtime = "nodejs";

/** Hidden rehearsal aid (TRD section 13): last 10 proposals with timings. Demo shop only. */
export const GET = route("debug", async (req) => {
  rateLimit(req, "debug", 60);
  const ctx = getContext();
  const shop = await ctx.store.getShop(ctx.shopId);
  if (!shop?.isDemo) throw new HttpError(403, "not_demo", "Debug is demo only", "Yeh sirf demo dukaan ke liye hai.");
  const events = (await ctx.store.listAudit(ctx.shopId, 200)).filter((e) => e.kind === "proposal_shown").slice(0, 10);
  return { events };
});
