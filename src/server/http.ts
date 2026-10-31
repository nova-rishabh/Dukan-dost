import { randomUUID } from "node:crypto";
import { ZodError } from "zod";
import { LedgerError } from "@/lib/ledger";
import { ProviderError } from "@/lib/providers/types";

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

/** Per-IP sliding window. Demo-grade; a shared limiter replaces it once the app is deployed with real users. */
export function rateLimit(req: Request, bucket: string, limit: number, windowMs = 60_000) {
  const ip = (req.headers.get("x-forwarded-for") ?? "local").split(",")[0].trim() || "local";
  const key = `${bucket}:${ip}`;
  const now = Date.now();
  const hits = (windows.get(key) ?? []).filter((t) => now - t < windowMs);
  if (hits.length >= limit) {
    windows.set(key, hits);
    throw new HttpError(429, "rate_limited", "Too many requests", "Thodi der ruko, phir try karo.");
  }
  hits.push(now);
  windows.set(key, hits);
}

export async function readJson(req: Request, maxBytes = 16_000): Promise<unknown> {
  const text = await req.text();
  if (new TextEncoder().encode(text).length > maxBytes) throw new HttpError(413, "too_large", "Request too large", "Chhota sentence bolo ya likho.");
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    throw new HttpError(400, "bad_json", "Body is not valid JSON", "Dobara try karo.");
  }
}

type Handler = (req: Request, ctx: { requestId: string; params: Record<string, string> }) => Promise<Response | Record<string, unknown>>;

/** Wraps a route: request id, stage timing log, typed errors with a recovery hint. */
export function route(name: string, handler: Handler) {
  return async (req: Request, routeCtx?: { params?: Promise<Record<string, string>> }): Promise<Response> => {
    const requestId = randomUUID().slice(0, 8);
    const started = Date.now();
    let status = 200;
    try {
      const params = (await routeCtx?.params) ?? {};
      const out = await handler(req, { requestId, params });
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
