import { interpretText } from "@/lib/interpret";
import { computeBalances, getLastEntry } from "@/lib/ledger";
import { signProposal } from "@/lib/proposal";
import { InterpretBody } from "@/lib/schemas";
import { getContext } from "@/server/context";
import { rateLimit, readJson, route } from "@/server/http";

export const runtime = "nodejs";

export const POST = route("interpret", async (req) => {
  rateLimit(req, "interpret", 120);
  const started = Date.now();
  const ctx = getContext();
  const body = InterpretBody.parse(await readJson(req));
  const now = new Date();
  const [customers, entries, lastEntry] = await Promise.all([
    ctx.store.listCustomers(ctx.shopId),
    ctx.store.listEntries(ctx.shopId),
    getLastEntry(ctx.store, ctx.shopId),
  ]);
  const recentEntries = entries.filter((e) => !e.voidedAt && now.getTime() - new Date(e.confirmedAt).getTime() <= 120_000);
  const proposal = await interpretText(body.text, { shopId: ctx.shopId, customers, llm: ctx.llm, now, recentEntries, lastEntry });
  const balances = computeBalances(customers, entries);
  for (const i of proposal.intents) {
    if (i.kind === "query_balance" && i.resolvedCustomerId) i.balancePaise = balances.get(i.resolvedCustomerId) ?? 0;
  }
  proposal.token = signProposal(proposal, { shopId: ctx.shopId, now, secret: ctx.secret });
  const interpretMs = Date.now() - started;
  await ctx.store.appendAudit(
    ctx.shopId,
    "proposal_shown",
    { sourceText: proposal.sourceText, engine: proposal.engine, interpretMs, intents: proposal.intents.map((i) => ({ kind: i.kind, clarifications: i.clarifications, writable: i.writable })) },
    now.toISOString(),
  );
  return { proposal, source: body.source, demoMode: ctx.status.demoMode, interpretMs };
});
