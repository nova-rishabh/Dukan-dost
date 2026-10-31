import { adapterStatus } from "../src/lib/config";
import { loadEnv } from "./lib/util";

loadEnv();
const s = adapterStatus(process.env);
console.log("Dukaan Dost setup check");
console.log("-----------------------");
console.log(`Speech to text : ${s.stt === "elevenlabs" ? "ElevenLabs Scribe (key found)" : "LOCAL (canned sample transcripts; mic audio needs ELEVENLABS_API_KEY)"}`);
console.log(`Read-back voice: ${s.tts === "elevenlabs" ? "ElevenLabs TTS (key found)" : "LOCAL (silent)"}`);
console.log(`Interpreter    : ${s.llm === "gemini" ? "rules first, Gemini fallback (key found)" : "RULES ONLY (no GEMINI_API_KEY)"}`);
console.log(`Ledger store   : ${s.store === "supabase" ? "Supabase" : "LOCAL (JSON file in .data/)"}`);
console.log(`Demo mode tag  : ${s.demoMode ? "shown (at least one local adapter is active)" : "hidden (all real adapters)"}`);
console.log("");
if (s.missing.length) {
  console.log("Missing environment variables (names only):");
  for (const m of s.missing) console.log(`  - ${m}`);
} else console.log("All environment variables are set.");
console.log("");
console.log(s.demoMode ? "Local adapters are active. The app works end to end without keys." : "Real adapters are active. Run: pnpm verify:live");
