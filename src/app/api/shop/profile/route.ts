import { requireFreshOwner } from "@/server/owner-confirmation";
import { z } from "zod";
import { getContext } from "@/server/context";
import { HttpError, rateLimit, readJson, route } from "@/server/http";
export const runtime = "nodejs";
const ShopProfileBody = z.object({ name: z.string().trim().min(1).max(80), upiVpa: z.string().trim().min(3).max(80).regex(/^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+$/), confirmed: z.literal(true), passcode: z.string().max(128).optional() });
export const GET = route("shop.profile", async (req) => {
  rateLimit(req, "profile", 120); const { store, shopId } = getContext(); const shop = await store.getShop(shopId);
  if (!shop) throw new HttpError(404, "not_found", "Shop not found", "Dukaan dobara kholo.");
  return { shop: { name: shop.name, upiVpa: shop.upiVpa, isDemo: shop.isDemo } };
});
export const PATCH = route("shop.profile.update", async (req, { session }) => {
  rateLimit(req, "profile", 30); const { store, shopId } = getContext(); const body = ShopProfileBody.parse(await readJson(req));
  if (getContext().authRequired) await requireFreshOwner(session, body.passcode);
  const shop = await store.updateShop(shopId, { name: body.name, upiVpa: body.upiVpa }, session?.authVersion);
  if (!shop) throw new HttpError(404, "not_found", "Shop not found", "Dukaan dobara kholo.");
  await store.appendAudit(shopId, "shop_profile_updated", {}, new Date().toISOString());
  return { shop: { name: shop.name, upiVpa: shop.upiVpa, isDemo: shop.isDemo } };
});
