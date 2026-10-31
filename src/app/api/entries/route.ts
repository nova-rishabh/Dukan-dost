import { createEntry, getSummary } from "@/lib/ledger";
import { CreateEntryBody } from "@/lib/schemas";
import { getContext } from "@/server/context";
import { rateLimit, readJson, route } from "@/server/http";

export const runtime = "nodejs";

export const POST = route("entries.create", async (req) => {
  rateLimit(req, "entries", 120);
  const ctx = getContext();
  const body = CreateEntryBody.parse(await readJson(req));
  const result = await createEntry(ctx.store, { ...body, shopId: ctx.shopId }, { now: new Date(), secret: ctx.secret });
  const summary = await getSummary(ctx.store, ctx.shopId);
  return { entryId: result.entry.id, created: result.created, balancePaise: result.balancePaise, summary };
});
