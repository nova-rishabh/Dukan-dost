import { MovementBody } from "@/lib/operationSchemas";
import { getContext } from "@/server/context";
import { HttpError, rateLimit, readJson, route } from "@/server/http";
export const runtime = "nodejs";
export const GET = route("inventory.history", async (req, { params }) => {
  rateLimit(req, "inventory", 240); const { store, shopId } = getContext();
  if (!(await store.listProducts(shopId)).some((p) => p.id === params.id)) throw new HttpError(404, "not_found", "Product not found", "Item list se chuno.");
  return { movements: await store.listMovements(shopId, params.id) };
});
export const POST = route("inventory.move", async (req, { params }) => {
  rateLimit(req, "inventory", 60); const { store, shopId } = getContext(); const body = MovementBody.parse(await readJson(req));
  try {
    return await store.applyMovement({ ...body, shopId, productId: params.id, createdAt: new Date().toISOString() });
  } catch (error) {
    throw new HttpError(409, "inventory_conflict", error instanceof Error ? error.message : "Stock could not be updated", "Stock dobara kholo, phir check karke confirm karo.");
  }
});
