import { AuthError, signSession, verifySession, SESSION_TTL_MS, type LoginMethod, type OwnerPublic, type SessionPayload } from "@/lib/auth";
import type { AppContext } from "./context";

export const SESSION_COOKIE = "dd_session";

function cookieValue(header: string | null, name: string): string | null {
  for (const part of (header ?? "").split(";")) {
    const i = part.indexOf("=");
    if (i > 0 && part.slice(0, i).trim() === name) return part.slice(i + 1).trim();
  }
  return null;
}

const isHttps = (req: Request) => new URL(req.url).protocol === "https:" || req.headers.get("x-forwarded-proto") === "https";

export function sessionCookie(req: Request, owner: OwnerPublic, ctx: AppContext, method: LoginMethod): string {
  const token = signSession({ mobile: owner.mobile, shopId: owner.shopId, authVersion: owner.authVersion, method }, { now: new Date(), secret: ctx.secret });
  return `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${Math.floor(SESSION_TTL_MS / 1000)}${isHttps(req) ? "; Secure" : ""}`;
}

export function clearedCookie(req: Request): string {
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${isHttps(req) ? "; Secure" : ""}`;
}

/** The signed-in owner, or null. A cookie only counts if its mobile is still the shop's owner. */
export async function readSession(req: Request, ctx: AppContext): Promise<(SessionPayload & { iat: number }) | null> {
  if (!ctx.authRequired) return null;
  const token = cookieValue(req.headers.get("cookie"), SESSION_COOKIE);
  if (!token) return null;
  const s = verifySession(token, { now: new Date(), secret: ctx.secret });
  if (!s) return null;
  const owner = await ctx.store.getOwner(s.shopId);
  return owner && owner.mobile === s.mobile && owner.authVersion === s.authVersion ? s : null;
}

/** Throws unless this is the demo (no login) or a valid owner session. */
export async function requireOwner(req: Request, ctx: AppContext): Promise<(SessionPayload & { iat: number }) | null> {
  if (!ctx.authRequired) return null;
  const s = await readSession(req, ctx);
  if (s) return s;
  if (!(await ctx.store.hasOwners())) throw new AuthError("setup_required", "The shop is not set up yet", "Pehle dukaan set karo.", 401);
  if (!s) throw new AuthError("auth_required", "Login required", "Pehle login karo.", 401);
  return s;
}
