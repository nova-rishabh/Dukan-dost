/** Lists Hindi-capable ElevenLabs voices (names, ids, labels) so one can be chosen for the ad voice-over. Prints no key. */
import { loadEnv } from "./lib/util";

loadEnv();
const key = process.env.ELEVENLABS_API_KEY;
if (!key) {
  console.log("ELEVENLABS_API_KEY is not set.");
  process.exit(1);
}
const res = await fetch("https://api.elevenlabs.io/v2/voices?language=hi&page_size=50", { headers: { "xi-api-key": key } });
if (!res.ok) {
  console.log(`voice list failed: HTTP ${res.status}`);
  process.exit(1);
}
const json = (await res.json()) as { voices?: Array<{ voice_id: string; name: string; category?: string; labels?: Record<string, string>; description?: string; verified_languages?: Array<{ language: string; model_id: string }> }> };
for (const v of json.voices ?? []) {
  const l = v.labels ?? {};
  console.log([v.voice_id, v.name, v.category ?? "", l.gender ?? "", l.age ?? "", l.accent ?? "", l.descriptive ?? l.description ?? "", (v.verified_languages ?? []).map((x) => `${x.language}/${x.model_id}`).join(",")].join(" | "));
}
console.log(`${json.voices?.length ?? 0} voices`);
