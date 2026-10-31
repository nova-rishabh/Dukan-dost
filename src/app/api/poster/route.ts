import { buildPoster } from "@/lib/poster";
import { PosterBody } from "@/lib/schemas";
import { getContext } from "@/server/context";
import { HttpError, rateLimit, readJson, route } from "@/server/http";

export const runtime = "nodejs";

/** Returns the poster spec. The PNG is drawn in the browser from fixed templates; no model draws text. */
export const POST = route("poster", async (req) => {
  rateLimit(req, "poster", 60);
  const ctx = getContext();
  const body = PosterBody.parse(await readJson(req));
  const shop = await ctx.store.getShop(ctx.shopId);
  const poster = buildPoster({ shopName: shop?.name ?? "Dukaan", text: body.text, validUntil: body.validUntil });
  if (!poster) throw new HttpError(422, "no_items", "No item and price found", "Aise bolo: aata 40 rupaye kilo, chini 45 kilo.");
  return { poster };
});
