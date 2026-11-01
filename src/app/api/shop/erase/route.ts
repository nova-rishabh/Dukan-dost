import { eraseShopData } from "@/lib/ledger";
import { EraseBody } from "@/lib/schemas";
import { getContext } from "@/server/context";
import { rateLimit, readJson, route } from "@/server/http";

export const runtime = "nodejs";

/** Delete-my-data for a real (non-demo) shop. Irreversible, so it needs the typed phrase. */
export const POST = route("shop.erase", async (req) => {
  rateLimit(req, "erase", 10);
  const ctx = getContext();
  const body = EraseBody.parse(await readJson(req, 500));
  const counts = await eraseShopData(ctx.store, { shopId: ctx.shopId, confirmed: body.confirmed, phrase: body.phrase });
  console.log(JSON.stringify({ route: "shop.erase", erased: counts }));
  return { erased: counts };
});
