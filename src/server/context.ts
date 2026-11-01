import { AsyncLocalStorage } from "node:async_hooks";
import { makeSetupCode } from "./bootstrap";
import { validateRuntimeMode } from "@/lib/runtime-mode";
import { AttemptLimiter } from "@/lib/auth";
import { adapterStatus, type AdapterStatus } from "@/lib/config";
import { createElevenLabsStt, createElevenLabsTts } from "@/lib/providers/elevenlabs";
import { createGeminiLlm } from "@/lib/providers/gemini";
import { localStt, localTts } from "@/lib/providers/local";
import type { SttProvider, TtsProvider } from "@/lib/providers/types";
import { SEED_SHOP_ID } from "@/lib/seed";
import { LocalStore } from "@/lib/store/local";
import { SqliteStore } from "@/lib/store/sqlite";
import type { LedgerStore } from "@/lib/store/types";
import type { LlmProvider } from "@/lib/types";
import { waConfigFromEnv, type WaConfig } from "@/lib/waService";

export interface AppContext {
  store: LedgerStore;
  stt: SttProvider;
  tts: TtsProvider;
  llm: LlmProvider | null;
  shopId: string;
  secret: string;
  status: AdapterStatus;
  upiVpa: string;
  /** true for a real shop (database file): every route needs the owner's login, except the public ones */
  authRequired: boolean;
  /** the WhatsApp daemon, when configured; sending and login codes need it */
  wa: WaConfig | null;
  /** first-run setup needs this code, so a stranger who reaches the URL first cannot claim the shop */
  setupCode: string;
  loginLimiter: AttemptLimiter;
}

const g = globalThis as unknown as { __dukaan?: AppContext };


function build(): AppContext {
  const env = process.env;
  validateRuntimeMode(env);
  const status = adapterStatus(env);
  const shopId = env.DEMO_SHOP_ID || SEED_SHOP_ID;
  const upiVpa = env.DEMO_UPI_VPA || "demo.shop@invalid";
  const authRequired = status.store === "sqlite";

  // A database file means real data, which needs a real signing secret.
  // The keyless demo shop may use a fixed one (its tokens guard nothing private).
  if (authRequired && (!env.PROPOSAL_SECRET || env.PROPOSAL_SECRET.length < 24)) {
    throw new Error("PROPOSAL_SECRET (at least 24 characters) is required when DUKAAN_DB_FILE is set.");
  }

  let store: LedgerStore;
  if (authRequired) {
    // no demo data: the shop and its owner are created at first-run setup
    store = new SqliteStore(env.DUKAAN_DB_FILE!, { seedDemo: false });
  } else {
    store = new LocalStore({ file: env.DUKAAN_MEMORY_ONLY === "1" ? null : (env.DUKAAN_DATA_FILE ?? ".data/ledger.json") });
    if (env.DEMO_RESET_ON_BOOT === "1") void store.reset();
  }

  return {
    store,
    stt: status.stt === "elevenlabs" ? createElevenLabsStt(env.ELEVENLABS_API_KEY!) : localStt,
    tts: status.tts === "elevenlabs" ? createElevenLabsTts(env.ELEVENLABS_API_KEY!) : localTts,
    llm: status.llm === "gemini" ? createGeminiLlm(env.GEMINI_API_KEY!) : null,
    shopId,
    secret: env.PROPOSAL_SECRET || "dukaan-dost-local-demo-secret",
    status,
    upiVpa,
    authRequired,
    wa: waConfigFromEnv(env),
    setupCode: makeSetupCode(env, authRequired),
    loginLimiter: new AttemptLimiter(5, 15 * 60_000),
  };
}

const requestContext = new AsyncLocalStorage<AppContext>();

export function withContext<T>(ctx: AppContext, run: () => T): T { return requestContext.run(ctx, run); }

export function getContext(): AppContext {
  const scoped = requestContext.getStore();
  if (scoped) return scoped;
  if (!g.__dukaan) g.__dukaan = build();
  return g.__dukaan;
}

/** Public base URL for links the owner shares (pay pages). */
export async function appUrl(req: Request): Promise<string> {
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL;
  if (fromEnv) return fromEnv.replace(/\/$/, "");
  return new URL(req.url).origin;
}
