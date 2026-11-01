import { getContext } from "@/server/context";

export const runtime = "nodejs";
/** Readiness probes perform a storage read, expose no business data and never depend on a visitor cookie. */
export async function GET() {
  try {
    const ctx = getContext();
    await ctx.store.hasOwners();
    return Response.json({ ready: true, storage: ctx.store.kind }, { headers: { "cache-control": "no-store" } });
  } catch {
    return Response.json({ ready: false }, { status: 503, headers: { "cache-control": "no-store" } });
  }
}
