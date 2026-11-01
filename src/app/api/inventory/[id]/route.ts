import { z } from "zod";
import { getContext } from "@/server/context";
import { HttpError, rateLimit, readJson, route } from "@/server/http";
export const runtime = "nodejs";
const Body = z.object({ name: z.string().trim().min(1).max(80), lowThresholdMinor: z.number().int().min(0).max(Number.MAX_SAFE_INTEGER), expectedVersion: z.number().int().min(0), archived: z.boolean().optional(), confirmed: z.literal(true) });
export const PATCH = route("inventory.update", async (req, { params }) => {
  rateLimit(req, "inventory", 60); const { store, shopId } = getContext(); const body = Body.parse(await readJson(req));
  try {
    const product = await store.updateProduct(shopId, params.id, { name: body.name, lowThresholdMinor: body.lowThresholdMinor, ...(body.archived === undefined ? {} : { archivedAt: body.archived ? new Date().toISOString() : undefined }) }, body.expectedVersion);
    if (!product) throw new Error("Product not found");
    return { product };
  } catch { throw new HttpError(409, "inventory_conflict", "Item changed or does not exist. Reload before editing.", "Item dobara kholo, phir badlo."); }
});
