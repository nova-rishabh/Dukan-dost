import { eraseShopData } from "@/lib/ledger";
import { EraseBody } from "@/lib/schemas";
import { getContext } from "@/server/context";
import { HttpError, rateLimit, readJson, route } from "@/server/http";
import { requireFreshOwner } from "@/server/owner-confirmation";

export const runtime = "nodejs";

/** Delete-my-data for a real (non-demo) shop. Irreversible, so it needs the typed phrase. */
export const POST = route("shop.erase", async (req, { session }) => {
  rateLimit(req, "erase", 10);
  const ctx = getContext();
  const body = EraseBody.parse(await readJson(req, 500));
  const owner = await requireFreshOwner(session, body.passcode);
  let counts;
  try { counts = await eraseShopData(ctx.store, { shopId: ctx.shopId, confirmed: body.confirmed, phrase: body.phrase, expectedAuthVersion: owner.authVersion }); }
  catch (error) {
    if (error instanceof Error && error.message === "stale_owner") throw new HttpError(409, "reauth_required", "Your account changed before erasure", "Sign in again and review before erasing.");
    throw error;
  }
  console.log(JSON.stringify({ route: "shop.erase", erased: counts }));
  return { erased: counts };
});
