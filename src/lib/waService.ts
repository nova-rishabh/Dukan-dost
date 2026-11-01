import { AuthError } from "./auth";

/**
 * Client for the WA-USERAUTH daemon in services/wa-userauth: a separate local process that holds the
 * paired WhatsApp device, checks the CAPTCHA, rate-limits and issues one-time codes, and sends texts.
 * It listens on 127.0.0.1 only. Secrets never appear in thrown messages.
 */
export interface WaConfig {
  baseUrl: string;
  appKey: string;
  appSecret: string;
}

export function waConfigFromEnv(env: Record<string, string | undefined>): WaConfig | null {
  const baseUrl = env.WA_SERVICE_URL?.trim().replace(/\/$/, "");
  const appKey = env.WA_APP_KEY?.trim();
  const appSecret = env.WA_APP_SECRET?.trim();
  return baseUrl && appKey && appSecret ? { baseUrl, appKey, appSecret } : null;
}

const TIMEOUT_MS = 10_000;

interface Reply {
  status: number;
  body: Record<string, unknown>;
}

async function call(cfg: WaConfig, path: string, init?: { method?: string; body?: unknown; ip?: string }): Promise<Reply> {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${cfg.baseUrl}${path}`, {
      method: init?.method ?? (init?.body ? "POST" : "GET"),
      headers: { "content-type": "application/json", ...(init?.ip ? { "x-forwarded-for": init.ip } : {}) },
      body: init?.body ? JSON.stringify(init.body) : undefined,
      signal: ctl.signal,
    });
    const body = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    return { status: res.status, body };
  } catch {
    throw new AuthError("wa_unavailable", "WhatsApp service is not reachable", "WhatsApp service chalu nahi hai. Passcode se login karo.", 503);
  } finally {
    clearTimeout(timer);
  }
}

const msg = (r: Reply, fallback: string) => (typeof r.body.error === "string" ? r.body.error : fallback);

export async function waHealth(cfg: WaConfig): Promise<{ reachable: boolean; whatsapp: string }> {
  try {
    const r = await call(cfg, "/health");
    return { reachable: r.status === 200, whatsapp: typeof r.body.whatsapp === "string" ? r.body.whatsapp : "UNKNOWN" };
  } catch {
    return { reachable: false, whatsapp: "UNREACHABLE" };
  }
}

export async function waCaptcha(cfg: WaConfig): Promise<{ captchaId: string; svg: string }> {
  const r = await call(cfg, "/api/v1/auth/captcha/new");
  if (r.status !== 200 || typeof r.body.captchaId !== "string" || typeof r.body.svg !== "string") {
    throw new AuthError("wa_failed", "Could not get a CAPTCHA", "Photo wala code nahi aaya. Dobara try karo.", 502);
  }
  return { captchaId: r.body.captchaId, svg: r.body.svg };
}

export async function waSendOtp(cfg: WaConfig, input: { mobile: string; captchaId: string; captchaCode: string; name: string; email: string; ip: string }) {
  const r = await call(cfg, "/api/v1/auth/otp/send", {
    ip: input.ip,
    body: { mobile: input.mobile, captchaId: input.captchaId, captchaCode: input.captchaCode, name: input.name, email: input.email, appKey: cfg.appKey },
  });
  if (r.status === 200) return;
  if (r.status === 403) throw new AuthError("captcha_failed", msg(r, "CAPTCHA failed"), "Photo ke akshar galat hain. Naya photo lo aur dobara likho.", 400);
  if (r.status === 429) throw new AuthError("rate_limited", msg(r, "Too many codes"), "Bahut code mange. Thodi der baad try karo.", 429);
  if (r.status === 503) throw new AuthError("wa_unavailable", msg(r, "WhatsApp is not paired"), "WhatsApp abhi jura nahi hai. Passcode se login karo.", 503);
  throw new AuthError("wa_failed", msg(r, "Code could not be sent"), "Code nahi ja paya. Passcode se login karo.", 502);
}

export async function waVerifyOtp(cfg: WaConfig, input: { mobile: string; code: string }): Promise<string> {
  const r = await call(cfg, "/api/v1/auth/otp/verify", { body: { mobile: input.mobile, otp: input.code, appKey: cfg.appKey } });
  if (r.status === 200 && typeof r.body.authToken === "string") return r.body.authToken;
  throw new AuthError("bad_code", msg(r, "Code is wrong or expired"), "Code galat ya purana hai. Naya code mangao.", 401);
}

/** Authoritative server-to-server check of the single-use token (the daemon consumes it). */
export async function waResultVerify(cfg: WaConfig, authToken: string): Promise<{ name: string; mobile: string; email: string }> {
  const r = await call(cfg, "/api/v1/auth/result/verify", { body: { authToken, appKey: cfg.appKey, appSecret: cfg.appSecret } });
  const user = r.body.user as { name?: string; mobile?: string; email?: string } | undefined;
  if (r.status === 200 && r.body.valid === true && user?.mobile) return { name: user.name ?? "", mobile: user.mobile, email: user.email ?? "" };
  throw new AuthError("bad_code", "Login token was refused", "Login poora nahi hua. Dobara try karo.", 401);
}

/** Sends one text through the paired device. `simulated` means nothing left the machine. */
export async function waSendMessage(cfg: WaConfig, input: { to: string; text: string }): Promise<{ id: string | null; simulated: boolean }> {
  const r = await call(cfg, "/api/v1/messages/send", { body: { appKey: cfg.appKey, appSecret: cfg.appSecret, to: input.to, text: input.text } });
  if (r.status === 200) return { id: typeof r.body.id === "string" ? r.body.id : null, simulated: r.body.simulated === true };
  if (r.status === 429) throw new AuthError("rate_limited", msg(r, "Too many messages"), "Bahut message bheje. Ek minute ruko.", 429);
  if (r.status === 503) throw new AuthError("wa_unavailable", msg(r, "WhatsApp is not paired"), "WhatsApp abhi jura nahi hai. WhatsApp kholo se bhejo ya pehle jodo.", 503);
  throw new AuthError("wa_failed", msg(r, "Message could not be sent"), "Message nahi ja paya. WhatsApp kholo se bhejo.", 502);
}
