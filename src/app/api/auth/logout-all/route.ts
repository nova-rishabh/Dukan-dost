import { clearedCookie } from "@/server/auth";
import { getContext } from "@/server/context";
import { HttpError, rateLimit, readJson, route } from "@/server/http";

export const runtime = "nodejs";

/** Explicit owner action: revoke the persistent session version on every device, including this one. */
export const POST = route("auth.logout-all", async (req) => {
  rateLimit(req, "logout-all", 10);
  const body = await readJson(req) as { confirmed?: boolean } | null;
  if (body?.confirmed !== true) throw new HttpError(400, "confirmation_required", "Confirmation required", "Sab device se logout karne ke liye pakka karo.");
  const ctx = getContext();
  if (!ctx.authRequired) throw new HttpError(404, "not_found", "No sessions in demo mode", "Yeh demo dukaan hai.");
  await ctx.store.revokeOwnerSessions(ctx.shopId);
  return Response.json({ ok: true, revoked: true }, { headers: { "set-cookie": clearedCookie(req) } });
});
