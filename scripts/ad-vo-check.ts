/** Transcribes the finished ad's audio track with Scribe (word timings) so the voice-over can be checked without listening. */
import { readFileSync } from "node:fs";
import { ELEVENLABS_STT_MODEL_ID } from "../src/lib/config";
import { loadEnv } from "./lib/util";

loadEnv();
const key = process.env.ELEVENLABS_API_KEY;
const file = process.argv[2];
if (!key || !file) {
  console.log("usage: pnpm exec tsx scripts/ad-vo-check.ts <audio file>   (needs ELEVENLABS_API_KEY)");
  process.exit(1);
}
const form = new FormData();
form.append("model_id", ELEVENLABS_STT_MODEL_ID);
form.append("language_code", "hin");
form.append("file", new Blob([readFileSync(file)], { type: "audio/mpeg" }), "ad.mp3");
const res = await fetch("https://api.elevenlabs.io/v1/speech-to-text", { method: "POST", headers: { "xi-api-key": key }, body: form });
if (!res.ok) {
  console.log(`scribe failed: HTTP ${res.status}`);
  process.exit(1);
}
const j = (await res.json()) as { text?: string; words?: Array<{ text: string; start: number; end: number; type?: string }> };
console.log("TEXT:", j.text);
const words = (j.words ?? []).filter((w) => w.type !== "spacing");
let line = "";
let t0 = 0;
words.forEach((w, i) => {
  if (!line) t0 = w.start;
  line += `${w.text} `;
  const next = words[i + 1];
  if (!next || next.start - w.end > 0.6) {
    console.log(`${t0.toFixed(2)}s-${w.end.toFixed(2)}s  ${line.trim()}`);
    line = "";
  }
});
