import { clearDraft } from "./drafts";
import type { Proposal, StockFlag } from "../types";

export interface ApiFailure {
  code: string;
  message: string;
  hint: string;
}

export class ApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public hint: string,
    public status: number,
  ) {
    super(message);
  }
}

/** One deadline includes headers and body consumption. Requests are never retried here. */
export const CLIENT_REQUEST_TIMEOUT_MS = 30_000;

async function request<T>(url: string, init: RequestInit | undefined, read: (response: Response) => Promise<T>): Promise<T> {
  const controller = new AbortController();
  let timedOut = false;
  const cancel = () => controller.abort();
  const signal = init?.signal;
  if (signal?.aborted) controller.abort();
  else signal?.addEventListener("abort", cancel, { once: true });
  let timer: ReturnType<typeof setTimeout> | undefined;
  const deadline = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      timedOut = true;
      controller.abort();
      reject(new Error("Request deadline exceeded"));
    }, CLIENT_REQUEST_TIMEOUT_MS);
  });
  try {
    return await Promise.race([fetch(url, { ...init, signal: controller.signal }).then(read), deadline]);
  } catch (error) {
    if (error instanceof ApiError) throw error;
    const write = init?.method !== undefined && !["GET", "HEAD"].includes(init.method.toUpperCase());
    const code = timedOut ? "timeout" : controller.signal.aborted ? "aborted" : "network";
    throw new ApiError(code, timedOut ? "Request timed out" : "Request interrupted", write
      ? "Jawab nahi mila. Kaam hua ho sakta hai. Dobara dabane se pehle khata ya status check karo."
      : timedOut ? "Jawab der se aa raha hai. Dobara kholo." : "Net nahi hai. Connection check karke dobara kholo.", 0);
  } finally {
    if (timer) clearTimeout(timer);
    signal?.removeEventListener("abort", cancel);
  }
}

export async function call<T>(url: string, init?: RequestInit): Promise<T> {
  return request(url, init, async (res) => {
    const json = (await res.json().catch(() => null)) as ({ ok: boolean; error?: ApiFailure } & Record<string, unknown>) | null;
    if (!res.ok || !json || json.ok === false) {
      const e = json?.error;
      if (res.status === 401 && typeof window !== "undefined" && (e?.code === "auth_required" || e?.code === "setup_required")) {
        const target = e.code === "setup_required" ? "/setup" : "/login";
        if (window.location.pathname !== target) window.location.assign(target);
      }
      throw new ApiError(e?.code ?? "unknown", e?.message ?? "Request failed", e?.hint ?? "Thodi der baad try karo.", res.status);
    }
    if (init?.method && ["POST", "DELETE"].includes(init.method) && ["/api/auth/login", "/api/auth/logout", "/api/auth/logout-all", "/api/auth/setup", "/api/auth/wa/verify", "/api/auth/register/complete", "/api/auth/passcode", "/api/shop/erase", "/api/shop/close", "/api/demo/start", "/api/demo/exit"].includes(url)) clearDraft();
    return json as unknown as T;
  });
}

export const post = <T>(url: string, body: unknown) =>
  call<T>(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });

export interface Summary {
  totalOutstandingPaise: number;
  customerCount: number;
  topDebtors: Array<{ customerId: string; name: string; balancePaise: number }>;
  lowStock: StockFlag[];
}

export interface CustomerListItem {
  archivedAt?: string;
  id: string;
  name: string;
  area?: string;
  balancePaise: number;
}

export interface LedgerRow {
  note?: string;
  source?: "voice" | "text" | "sample";
  id: string;
  type: "credit_given" | "payment_received";
  amountPaise: number;
  sourceText: string;
  confirmedAt: string;
  voidedAt?: string;
  voidReason?: string;
}

export interface Me {
  authRequired: boolean;
  setupNeeded: boolean;
  publicSignup?: boolean;
  visitorDemo?: boolean;
  loggedIn: boolean;
  owner: { name: string } | null;
  waLogin: boolean;
  isDemoShop: boolean;
  shopName: string | null;
}

export interface WaStatus {
  configured: boolean;
  reachable: boolean;
  whatsapp: string;
  adminUrl: string | null;
}

export const api = {
  me: () => call<Me>("/api/auth/me"),
  setup: (body: { setupCode: string; shopName: string; name: string; mobile: string; passcode: string; upiVpa?: string }) => post<{ owner: { name: string } }>("/api/auth/setup", body),
  login: (mobile: string, passcode: string) => post<{ owner: { name: string } }>("/api/auth/login", { mobile, passcode }),
  logout: () => post<Record<string, never>>("/api/auth/logout", {}),
  logoutAll: () => post<{ revoked: boolean }>("/api/auth/logout-all", { confirmed: true }),
  changePasscode: (next: string, current?: string) => post<{ changed: boolean }>("/api/auth/passcode", { current, next }),
  waCaptcha: () => call<{ captchaId: string; svg: string }>("/api/auth/wa/captcha"),
  waSend: (mobile: string, captchaId: string, captchaCode: string) => post<{ sent: boolean }>("/api/auth/wa/send", { mobile, captchaId, captchaCode }),
  waVerify: (mobile: string, code: string) => post<{ owner: { name: string } }>("/api/auth/wa/verify", { mobile, code }),
  waStatus: () => call<WaStatus>("/api/wa/status"),
  sendReminder: (body: { customerId: string; phone: string; text: string; payUrl: string }) =>
    post<{ sent: boolean; simulated: boolean }>("/api/remind/send", { ...body, confirmed: true }),
  status: () => call<{ adapters: { stt: string; tts: string; llm: string; store: string }; demoMode: boolean; isDemoShop: boolean }>("/api/status"),
  summary: () => call<{ summary: Summary; shopName: string; demoMode: boolean; isDemoShop: boolean }>("/api/summary"),
  customers: () => call<{ customers: CustomerListItem[] }>("/api/customers"),
  customer: (id: string) =>
    call<{ customer: { id: string; name: string; area?: string }; entries: LedgerRow[]; balancePaise: number }>(`/api/customers/${id}`),
  createCustomer: (name: string) => post<{ customer: { id: string; name: string }; created: boolean }>("/api/customers", { name }),
  transcribeSample: (sampleId: string) => post<{ text: string; language: string; engine: string }>("/api/transcribe", { sampleId }),
  transcribeAudio: (data: Blob, mime: string) =>
    call<{ text: string; language?: string; engine: string }>("/api/transcribe", { method: "POST", headers: { "content-type": mime }, body: data }),
  interpret: (text: string, source: "voice" | "text" | "sample") =>
    post<{ proposal: Proposal; demoMode: boolean; interpretMs: number }>("/api/interpret", { text, source }),
  createEntry: (body: Record<string, unknown>) =>
    post<{ entryId: string; created: boolean; balancePaise: number; summary: Summary }>("/api/entries", body),
  voidEntry: (id: string, reason: string, proposal?: { token: string; index: number }) =>
    post<{ summary: Summary }>(`/api/entries/${id}/void`, { reason, confirmed: true, proposalToken: proposal?.token, intentIndex: proposal?.index }),
  createStock: (body: Record<string, unknown>) => post<{ flag: StockFlag; created: boolean; summary: Summary }>("/api/stock", body),
  resolveStock: (id: string) => post<{ summary: Summary }>(`/api/stock/${id}/resolve`, {}),
  remind: (customerId: string, locale?: "en" | "hi-Latn") => post<{ text: string; waUrl: string; payUrl: string; amountPaise: number }>("/api/remind", { customerId, locale }),
  poster: (text: string, validUntil?: string) =>
    post<{ poster: import("../poster").PosterSpec }>("/api/poster", { text, validUntil }),
  eraseMyData: (phrase: string, passcode?: string) => post<{ erased: Record<string, number> }>("/api/shop/erase", { confirmed: true, phrase, passcode }),
  resetDemo: () => post<{ reset: boolean }>("/api/demo/reset", {}),
  debug: () => call<{ events: Array<{ id: number; createdAt: string; payload: Record<string, unknown> }> }>("/api/debug"),
  async speak(text: string): Promise<Blob | null> {
    return request("/api/speak", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ text }) }, async (res) => {
      if (!res.ok || !(res.headers.get("content-type") ?? "").startsWith("audio/")) return null;
      return res.blob();
    });
  },
};
