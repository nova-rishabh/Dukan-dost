import { adapterStatus } from "../src/lib/config";
import { interpretText } from "../src/lib/interpret";
import { createElevenLabsStt, createElevenLabsTts } from "../src/lib/providers/elevenlabs";
import { createGeminiLlm } from "../src/lib/providers/gemini";
import { SEED_CUSTOMERS, SEED_SHOP_ID } from "../src/lib/seed";
import { loadEnv } from "./lib/util";

loadEnv();
const env = process.env;
const status = adapterStatus(env);
let failures = 0;
const ctx = { shopId: SEED_SHOP_ID, customers: SEED_CUSTOMERS, now: new Date(), recentEntries: [] };

async function step(name: string, fn: () => Promise<string>) {
  try {
    console.log(`PASS ${name}: ${await fn()}`);
  } catch (e) {
    failures++;
    console.log(`FAIL ${name}: ${e instanceof Error ? e.message : String(e)}`);
  }
}

if (status.missing.length === adapterStatus({}).missing.length) {
  console.log("verify:live skipped: no keys found. Add keys to .env.local (see SETUP_FOR_RISHABH.md), then run it again.");
  process.exit(0);
}

if (status.stt === "elevenlabs") {
  const key = env.ELEVENLABS_API_KEY!;
  await step("ElevenLabs TTS then Scribe round trip", async () => {
    const audio = await createElevenLabsTts(key).speak("Gupta ji ne paanch sau rupaye udhaar liye");
    if (!audio) throw new Error("no audio");
    const heard = await createElevenLabsStt(key).transcribe(audio);
    const p = await interpretText(heard.text, { ...ctx, llm: null });
    const i = p.intents[0];
    if (i.amountRupees !== 500) throw new Error(`heard "${heard.text}", read amount ${i.amountRupees}`);
    return `heard "${heard.text}" -> ${i.kind} ${i.amountRupees}`;
  });
} else console.log("SKIP ElevenLabs: ELEVENLABS_API_KEY missing");

if (status.llm === "gemini") {
  await step("Gemini structured output", async () => {
    const out = await createGeminiLlm(env.GEMINI_API_KEY!).interpret("Gupta ji ne paanch sau rupaye wapas kar diye", { customerNames: SEED_CUSTOMERS.map((c) => c.name) });
    const first = out[0];
    if (first?.kind !== "payment_received" || first.amountRupees !== 500) throw new Error(`unexpected: ${JSON.stringify(out)}`);
    return JSON.stringify(first);
  });
} else console.log("SKIP Gemini: GEMINI_API_KEY missing");

process.exit(failures ? 1 : 0);
