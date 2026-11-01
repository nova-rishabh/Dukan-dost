import { verifyPasscode, type SessionPayload } from "@/lib/auth";
import { HttpError } from "./http";
import { getContext } from "./context";
export async function requireFreshOwner(session: SessionPayload | null, passcode?: string) {
  const ctx = getContext();
  const owner = await ctx.store.getOwner(ctx.shopId);
  if (!ctx.authRequired || !session || !owner || owner.authVersion !== session.authVersion) throw new HttpError(401, "reauth_required", "Sign in to your own shop", "Sign in with WhatsApp or your password again.");
  const fresh = session.method === "otp" && Date.now() - (session.iat ?? 0) < 15 * 60_000;
  if (!fresh && !(await verifyPasscode(passcode ?? "", owner.passcodeHash))) throw new HttpError(403, "reauth_required", "Confirm your current password or sign in with a fresh WhatsApp code", "Confirm your password, or sign in again using WhatsApp.");
  return owner;
}
