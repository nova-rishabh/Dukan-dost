import { createHmac } from "node:crypto";
import { getContext } from "@/server/context";
import { route } from "@/server/http";

export const runtime = "nodejs";
/** An opaque draft namespace. A new account/session version cannot restore another owner's draft. */
export const GET = route("draft.scope", async (_req, { session }) => {
  const ctx = getContext();
  if (ctx.authRequired && !session) return { scope: null };
  const scope = createHmac("sha256", ctx.secret).update(`typed-draft:${ctx.shopId}:${session?.authVersion ?? 0}`).digest("hex");
  return { scope };
}, { public: true });
