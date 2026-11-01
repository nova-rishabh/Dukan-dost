import { z } from "zod";
import { getContext } from "@/server/context";
import { clearedCookie } from "@/server/auth";
import { rateLimit, readJson, route } from "@/server/http";
import { requireFreshOwner } from "@/server/owner-confirmation";
export const runtime = "nodejs";
export const POST = route("shop.close", async (req, { session }) => {
  rateLimit(req, "close-account", 5);
  const body = z.object({ confirmed: z.literal(true), phrase: z.literal("close my shop"), passcode: z.string().max(128).optional() }).parse(await readJson(req, 1000));
  const ctx = getContext(); const owner = await requireFreshOwner(session, body.passcode);
  await ctx.store.closeShop(owner.shopId,owner.authVersion);
  return Response.json({ ok: true, closed: true }, { headers: { "cache-control": "no-store", "set-cookie": clearedCookie(req) } });
});
