import { createHmac } from "node:crypto";
import { isIP } from "node:net";
import { getContext } from "./context";
import { HttpError } from "./http";

/** Trust only a configured proxy chain; arbitrary forwarded headers buy no extra quota. */
export function trustedAddress(req: Request): string {
  const hops = Number(process.env.TRUST_PROXY_HOPS ?? "0");
  const forwarded = (req.headers.get("x-forwarded-for") ?? "").split(",").map((part) => part.trim());
  if (Number.isInteger(hops) && hops >= 1 && hops <= 5 && forwarded.length >= hops) {
    const candidate = forwarded[forwarded.length - hops];
    if (isIP(candidate)) return candidate;
  }
  return "shared-untrusted-proxy";
}

/** Atomic persistent ceilings across workers sharing the database. Keys contain no cleartext identities. */
export async function durableRateLimit(req: Request, bucket: string, options: { identity?: string; identityLimit?: number; windowMs?: number; total?: number } = {}) {
  const ctx = getContext();
  const now = Date.now();
  const windowMs = options.windowMs ?? 15 * 60_000;
  const key = (value: string) => createHmac("sha256", ctx.secret).update(`abuse:${bucket}:${value}`).digest("hex");
  const identity = options.identity;
  const address = trustedAddress(req);
  const checks: [string, number][] = [["global", options.total ?? 1000], [`ip:${address}`, address === "shared-untrusted-proxy" ? 200 : 30]];
  if (identity) checks.push([`identity:${identity}`, options.identityLimit ?? 5]);
  for (const [value, limit] of checks) {
    const result = await ctx.store.consumeRateLimit(key(value), limit, windowMs, now);
    if (!result.allowed) throw new HttpError(429, "rate_limited", "Too many requests", `Please wait ${Math.max(1, Math.ceil(result.retryAfterMs / 1000))} seconds before trying again.`);
  }
}
