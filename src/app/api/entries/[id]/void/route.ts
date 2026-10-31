import { getSummary, voidEntry } from "@/lib/ledger";
import { VoidBody } from "@/lib/schemas";
import { getContext } from "@/server/context";
import { rateLimit, readJson, route } from "@/server/http";

export const runtime = "nodejs";

export const POST = route("entries.void", async (req, { params }) => {
  rateLimit(req, "entries", 120);
  const ctx = getContext();
  const body = VoidBody.parse(await readJson(req));
  await voidEntry(ctx.store, { shopId: ctx.shopId, entryId: params.id, reason: body.reason, confirmed: body.confirmed, proposalToken: body.proposalToken, intentIndex: body.intentIndex }, { now: new Date(), secret: ctx.secret });
  return { entryId: params.id, summary: await getSummary(ctx.store, ctx.shopId) };
});
