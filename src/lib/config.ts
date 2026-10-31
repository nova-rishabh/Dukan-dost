/**
 * One place for vendor ids and adapter selection (ADR-018, ADR-019).
 * Ids marked VERIFY are checked against the vendor docs in docs/14_API_FACTS.md and by `pnpm verify:live`.
 */
export const GEMINI_MODEL_ID = "gemini-3.8-flash"; // VERIFY: https://ai.google.dev/gemini-api/docs/models
export const ELEVENLABS_STT_MODEL_ID = "scribe_v2"; // VERIFY: https://elevenlabs.io/docs/api-reference/speech-to-text/convert
export const ELEVENLABS_TTS_MODEL_ID = "eleven_multilingual_v2"; // VERIFY: https://elevenlabs.io/docs/api-reference/text-to-speech/convert

export const ENV_NAMES = [
  "ELEVENLABS_API_KEY",
  "GEMINI_API_KEY",
  "SUPABASE_URL",
  "SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "PROPOSAL_SECRET",
  "NEXT_PUBLIC_APP_URL",
  "DEMO_SHOP_ID",
  "DEMO_UPI_VPA",
] as const;

type Env = Record<string, string | undefined>;
const has = (env: Env, k: string) => !!env[k] && env[k]!.trim().length > 0;

export interface AdapterStatus {
  stt: "elevenlabs" | "local";
  tts: "elevenlabs" | "local";
  llm: "gemini" | "rules-only";
  store: "supabase" | "local";
  demoMode: boolean;
  missing: string[];
}

export function adapterStatus(env: Env): AdapterStatus {
  const stt = has(env, "ELEVENLABS_API_KEY") ? "elevenlabs" : "local";
  const llm = has(env, "GEMINI_API_KEY") ? "gemini" : "rules-only";
  const store = has(env, "SUPABASE_URL") && has(env, "SUPABASE_SERVICE_ROLE_KEY") ? "supabase" : "local";
  return {
    stt,
    tts: stt,
    llm,
    store,
    demoMode: stt === "local" || llm === "rules-only" || store === "local",
    missing: ENV_NAMES.filter((n) => !has(env, n)),
  };
}
