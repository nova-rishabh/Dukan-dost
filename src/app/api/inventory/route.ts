import { ProductBody } from "@/lib/operationSchemas";
import { getContext } from "@/server/context";
import { rateLimit, readJson, route } from "@/server/http";
export const runtime = "nodejs";
export const GET = route("inventory.list", async (req) => {
  rateLimit(req, "inventory", 240); const { store, shopId } = getContext();
  return { products: await store.listProducts(shopId) };
});
export const POST = route("inventory.create", async (req) => {
  rateLimit(req, "inventory", 60); const { store, shopId } = getContext(); const body = ProductBody.parse(await readJson(req));
  const product = await store.createProduct({ shopId, name: body.name, unit: body.unit, lowThresholdMinor: body.lowThresholdMinor, onHandMinor: null });
  await store.appendAudit(shopId, "product_created", { productId: product.id }, new Date().toISOString());
  return { product };
});
