import { adapterStatus, type AdapterStatus } from "@/lib/config";
import { createElevenLabsStt, createElevenLabsTts } from "@/lib/providers/elevenlabs";
import { createGeminiLlm } from "@/lib/providers/gemini";
import { localStt, localTts } from "@/lib/providers/local";
import type { SttProvider, TtsProvider } from "@/lib/providers/types";
import { SEED_SHOP_ID } from "@/lib/seed";
import { LocalStore } from "@/lib/store/local";
import { SupabaseStore } from "@/lib/store/supabase";
import type { LedgerStore } from "@/lib/store/types";
import type { LlmProvider } from "@/lib/types";

export interface AppContext {
  store: LedgerStore;
  stt: SttProvider;
  tts: TtsProvider;
  llm: LlmProvider | null;
  shopId: string;
  secret: string;
  status: AdapterStatus;
  upiVpa: string;
}

const g = globalThis as unknown as { __dukaan?: AppContext };

function build(): AppContext {
  const env = process.env;
  const status = adapterStatus(env);
  const store: LedgerStore =
    status.store === "supabase"
      ? new SupabaseStore(env.SUPABASE_URL!, env.SUPABASE_SERVICE_ROLE_KEY!)
      : new LocalStore({ file: env.DUKAAN_MEMORY_ONLY === "1" ? null : (env.DUKAAN_DATA_FILE ?? ".data/ledger.json") });
  if (env.DEMO_RESET_ON_BOOT === "1" && store.kind === "local") void store.reset();
  // Real data needs a real signing secret. The keyless demo shop may use a fixed one (its tokens guard nothing private).
  if (status.store === "supabase" && !env.PROPOSAL_SECRET) {
    throw new Error("PROPOSAL_SECRET is required when Supabase is active. Set a long random string.");
  }
  const secret = env.PROPOSAL_SECRET || "dukaan-dost-local-demo-secret";
  return {
    store,
    stt: status.stt === "elevenlabs" ? createElevenLabsStt(env.ELEVENLABS_API_KEY!) : localStt,
    tts: status.tts === "elevenlabs" ? createElevenLabsTts(env.ELEVENLABS_API_KEY!) : localTts,
    llm: status.llm === "gemini" ? createGeminiLlm(env.GEMINI_API_KEY!) : null,
    shopId: env.DEMO_SHOP_ID || SEED_SHOP_ID,
    secret,
    status,
    upiVpa: env.DEMO_UPI_VPA || "demo.shop@invalid",
  };
}

export function getContext(): AppContext {
  if (!g.__dukaan) g.__dukaan = build();
  return g.__dukaan;
}

/** Public base URL for links the owner shares (pay pages). */
export async function appUrl(req: Request): Promise<string> {
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL;
  if (fromEnv) return fromEnv.replace(/\/$/, "");
  return new URL(req.url).origin;
}
