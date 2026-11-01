import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { AttemptLimiter } from "@/lib/auth";
import { localStt, localTts } from "@/lib/providers/local";
import { SEED_SHOP_ID } from "@/lib/seed";
import { LocalStore } from "@/lib/store/local";
import type { AppContext } from "./context";

export const DEMO_COOKIE = "dd_demo";
export const DEMO_TTL_MS = 30 * 60_000;
const MAX_VISITORS = 100;
type Workspace = { context: AppContext; expiresAt: number };
const globalWorkspaces = globalThis as unknown as { __dukaanDemos?: Map<string, Workspace> };
const workspaces = () => globalWorkspaces.__dukaanDemos ??= new Map();
const signature = (payload: string, secret: string) => createHmac("sha256", secret).update(`demo:${payload}`).digest("base64url");
const secure = (req: Request) => new URL(req.url).protocol === "https:" || req.headers.get("x-forwarded-proto") === "https";
export function demoCookie(req: Request, token: string) { return `${DEMO_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${DEMO_TTL_MS / 1000}${secure(req) ? "; Secure" : ""}`; }
export function clearedDemoCookie(req: Request) { return `${DEMO_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure(req) ? "; Secure" : ""}`; }

function prune(now: number) { for (const [id, workspace] of workspaces()) if (workspace.expiresAt <= now) workspaces().delete(id); }
function tokenFrom(header: string | null) { return (header ?? "").split(";").map((s) => s.trim()).find((s) => s.startsWith(`${DEMO_COOKIE}=`))?.slice(DEMO_COOKIE.length + 1); }
function identity(base: AppContext, header: string | null, now: number) {
  const token = tokenFrom(header);
  if (!token || token.length > 200) return null;
  const [id, expires, signed, extra] = token.split(".");
  if (extra || !id || !/^\d+$/.test(expires ?? "") || !signed || Number(expires) <= now) return null;
  const expected = signature(`${id}.${expires}`, base.secret);
  const a = Buffer.from(signed); const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  return { id, token };
}

/** No owner cookie or client-supplied shop id can turn a demo into an authorized real shop. */
export function demoContext(base: AppContext, cookieHeader: string | null, now = Date.now()): AppContext | null {
  prune(now);
  const proof = identity(base, cookieHeader, now);
  if (!proof) return null;
  return workspaces().get(proof.id)?.context ?? null;
}

export function startDemo(base: AppContext, cookieHeader: string | null, now = Date.now()) {
  prune(now);
  const prior = identity(base, cookieHeader, now);
  if (prior && workspaces().has(prior.id)) return { token: prior.token, context: workspaces().get(prior.id)!.context };
  if (workspaces().size >= MAX_VISITORS) throw new Error("demo_capacity");
  const id = randomBytes(24).toString("base64url");
  const expiresAt = now + DEMO_TTL_MS;
  const payload = `${id}.${expiresAt}`;
  const context: AppContext = {
    ...base,
    visitorDemo: true,
    secret: createHmac("sha256", base.secret).update(`demo-workspace:${id}`).digest("base64url"),
    store: new LocalStore({ file: null }), shopId: SEED_SHOP_ID, upiVpa: "demo.shop@invalid", authRequired: false,
    stt: localStt, tts: localTts, llm: null, wa: null, setupCode: "", loginLimiter: new AttemptLimiter(5, 15 * 60_000),
    status: { stt: "local", tts: "local", llm: "rules-only", store: "local", wa: "none", demoMode: true, missing: [] },
  };
  workspaces().set(id, { context, expiresAt });
  return { token: `${payload}.${signature(payload, base.secret)}`, context };
}

export function exitDemo(base: AppContext, cookieHeader: string | null, now = Date.now()) {
  const proof = identity(base, cookieHeader, now);
  if (proof) workspaces().delete(proof.id);
}
