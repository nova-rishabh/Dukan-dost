import { randomUUID } from "node:crypto";
import { ZodError } from "zod";
import { AuthError, type SessionPayload } from "@/lib/auth";
import { LedgerError } from "@/lib/ledger";
import { ProviderError } from "@/lib/providers/types";
import { requireOwner, readSession } from "./auth";
import { getContext, withContext } from "./context";

export class HttpError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public hint: string,
  ) {
    super(message);
  }
}

const windows = new Map<string, number[]>();
const MAX_KEYS = 5000;

/**
 * Per-IP sliding window plus a per-route global ceiling (so spoofed addresses cannot buy unlimited calls).
 * The client address is trusted only behind Vercel, which overwrites x-forwarded-for; anywhere else every
 * caller shares one bucket. Demo-grade: per process, so a shared store replaces it for real traffic.
 */
export function clientIp(req: Request): string {
  if (process.env.VERCEL) return (req.headers.get("x-forwarded-for") ?? "unknown").split(",")[0].trim() || "unknown";
  return "local";
}

function hit(key: string, limit: number, windowMs: number, now: number) {
  const hits = (windows.get(key) ?? []).filter((t) => now - t < windowMs);
  if (hits.length >= limit) {
    windows.set(key, hits);
    throw new HttpError(429, "rate_limited", "Too many requests", "Thodi der ruko, phir try karo.");
  }
  hits.push(now);
  windows.set(key, hits);
}

/** Test helper: forget all counted requests. */
export function resetRateLimits() {
  windows.clear();
}

export function rateLimit(req: Request, bucket: string, limit: number, windowMs = 60_000) {
  const now = Date.now();
  if (windows.size > MAX_KEYS) {
    for (const [k, v] of windows) if (!v.some((t) => now - t < windowMs)) windows.delete(k);
    if (windows.size > MAX_KEYS) windows.clear();
  }
  hit(`${bucket}:${clientIp(req)}`, limit, windowMs, now);
  hit(`${bucket}:*`, limit * 20, windowMs, now);
}

function checkLength(req: Request, maxBytes: number) {
  const len = Number(req.headers.get("content-length") ?? "0");
  if (len > maxBytes) throw new HttpError(413, "too_large", "Request too large", "Chhota sentence bolo ya likho.");
}

export async function readJson(req: Request, maxBytes = 16_000): Promise<unknown> {
  checkLength(req, maxBytes);
  if (!(req.headers.get("content-type") ?? "").toLowerCase().includes("application/json")) {
    throw new HttpError(415, "bad_content_type", "Expected application/json", "Dobara try karo.");
  }
  const text = await req.text();
  if (new TextEncoder().encode(text).length > maxBytes) throw new HttpError(413, "too_large", "Request too large", "Chhota sentence bolo ya likho.");
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    throw new HttpError(400, "bad_json", "Body is not valid JSON", "Dobara try karo.");
  }
}

export function assertAudioLength(req: Request, maxBytes: number) {
  checkLength(req, maxBytes);
}

/** A browser on another site cannot make a state-changing call: an Origin header must match our own host. */
function assertSameOrigin(req: Request) {
  if (req.method === "GET" || req.method === "HEAD") return;
  const origin = req.headers.get("origin");
  if (!origin) return; // non-browser clients (curl, tests) send none
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  const same = (() => {
    try {
      return new URL(origin).host === host;
    } catch {
      return false;
    }
  })();
  if (!same) throw new HttpError(403, "bad_origin", "Cross-site request refused", "Yeh request is site se nahi aayi.");
}

type Handler = (req: Request, ctx: { requestId: string; params: Record<string, string>; session: SessionPayload | null }) => Promise<Response | Record<string, unknown>>;

/** Wraps a route: request id, stage timing log, typed errors with a recovery hint. */
export function route(name: string, handler: Handler, opts: { public?: boolean } = {}) {
  return async (req: Request, routeCtx?: { params?: Promise<Record<string, string>> }): Promise<Response> => {
    const requestId = randomUUID().slice(0, 8);
    const started = Date.now();
    let status = 200;
    try {
      assertSameOrigin(req);
      // a real shop needs the owner's login on every route except the ones marked public
      const base = getContext();
      const session = opts.public ? await readSession(req, base) : await requireOwner(req, base);
      const shop = session ? await base.store.getShop(session.shopId) : null;
      const ctx = session ? { ...base, shopId: session.shopId, upiVpa: shop?.upiVpa ?? "" } : base;
      const params = (await routeCtx?.params) ?? {};
      const out = await withContext(ctx, () => handler(req, { requestId, params, session }));
      if (out instanceof Response) {
        status = out.status;
        out.headers.set("x-request-id", requestId);
        return out;
      }
      return Response.json({ ok: true, requestId, ...out }, { headers: { "x-request-id": requestId, "cache-control": "no-store" } });
    } catch (err) {
      let code = "internal";
      let message = "Something went wrong";
      let hint = "Thodi der baad try karo.";
      status = 500;
      if (err instanceof HttpError) ({ status, code, message, hint } = err);
      else if (err instanceof LedgerError) {
        status = err.code === "not_found" ? 404 : err.code === "already_voided" ? 409 : 400;
        code = err.code;
        message = err.message;
        hint = err.hint;
      } else if (err instanceof AuthError) {
        status = err.status;
        code = err.code;
        message = err.message;
        hint = err.hint;
      } else if (err instanceof ProviderError) {
        status = err.status;
        code = `${err.provider}_error`;
        message = err.message;
        hint = err.hint;
      } else if (err instanceof ZodError) {
        status = 400;
        code = "bad_request";
        message = err.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
        hint = "Request check karo.";
      } else {
        console.error(JSON.stringify({ rid: requestId, route: name, error: err instanceof Error ? err.message : String(err) }));
      }
      return Response.json({ ok: false, requestId, error: { code, message, hint } }, { status, headers: { "x-request-id": requestId } });
    } finally {
      console.log(JSON.stringify({ rid: requestId, route: name, status, ms: Date.now() - started }));
    }
  };
}
