/**
 * Hindi voice-over for the ad, made with ElevenLabs text-to-speech (stock professional voices only, no cloning).
 * Each line is generated, loudness-matched with ffmpeg, timed with ffprobe, and transcribed back with Scribe
 * so a wrong or garbled read is caught without anyone having to listen. Results: deliverables/ad/assets/vo/VO.json.
 * Costs a few hundred characters of TTS and a few seconds of Scribe per run. Needs ELEVENLABS_API_KEY.
 * Run: pnpm ad:vo            (generate all lines)    pnpm ad:vo -- --only vo-6-close    (one line)
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { ELEVENLABS_STT_MODEL_ID, ELEVENLABS_TTS_MODEL_ID } from "../src/lib/config";
import { loadEnv, ROOT } from "./lib/util";

loadEnv();
const key = process.env.ELEVENLABS_API_KEY;
if (!key) {
  console.log("ad:vo: ELEVENLABS_API_KEY is not set, so no voice-over was generated. The ad renders without it (nothing is broken).");
  process.exit(0);
}

// Professional stock voices listed by `tsx scripts/ad-voices.ts`. Cloned voices on the account are deliberately not used.
const NARRATOR = { id: "KSsyodh37PbfWy29kPtx", name: "Kishan" };
const SHOPKEEPER = { id: "zT03pEAEi0VHKciJODfn", name: "Raju" };

interface Line {
  file: string;
  voice: { id: string; name: string };
  /** second of the ad where the line should start */
  start: number;
  text: string;
  /** the words Scribe should hear (loose check), in Devanagari */
  expect: string[];
}

const LINES: Line[] = [
  { file: "vo-1-hands", voice: NARRATOR, start: 0.15, text: "हाथ भरे हैं… और खाता दूर।", expect: ["हाथ", "खाता"] },
  { file: "vo-2-says", voice: SHOPKEEPER, start: 2.7, text: "शर्मा जी ने पाँच सौ उधार लिए।", expect: ["शर्मा", "सौ", "उधार"] },
  { file: "vo-3a-bolo", voice: NARRATOR, start: 4.6, text: "बोलो, या टाइप करो।", expect: ["बोलो", "टाइप"] },
  { file: "vo-3b-parchi", voice: NARRATOR, start: 6.25, text: "पहले पर्ची दिखती है।", expect: ["पर्ची", "दिखती"] },
  { file: "vo-4-likhdo", voice: NARRATOR, start: 8.2, text: "आप लिख दो दबाओ, तब लिखता है।", expect: ["लिख", "दबाओ"] },
  { file: "vo-5-remind", voice: NARRATOR, start: 10.25, text: "बाक़ी रक़म अपडेट। याद दिलाओ, सेंड आप दबाओ।", expect: ["याद", "सेंड", "दबाओ"] },
  { file: "vo-6-close", voice: NARRATOR, start: 15.5, text: "बोलो, लिखो मत। दुकान दोस्त।", expect: ["बोलो", "दोस्त"] },
];

const only = process.argv.includes("--only") ? process.argv[process.argv.indexOf("--only") + 1] : null;
const dir = path.join(ROOT, "deliverables", "ad", "assets", "vo");
mkdirSync(dir, { recursive: true });
const metaPath = path.join(dir, "VO.json");
const prior: Record<string, unknown> = existsSync(metaPath) ? Object.fromEntries((JSON.parse(readFileSync(metaPath, "utf8")) as Array<{ file: string }>).map((m) => [m.file, m])) : {};

async function tts(line: Line): Promise<Buffer> {
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(line.voice.id)}?output_format=mp3_44100_128`, {
    method: "POST",
    headers: { "xi-api-key": key!, "content-type": "application/json" },
    body: JSON.stringify({
      text: line.text,
      model_id: ELEVENLABS_TTS_MODEL_ID,
      language_code: "hi",
      voice_settings: { stability: 0.5, similarity_boost: 0.75, style: 0.25, use_speaker_boost: true },
    }),
  });
  if (!res.ok) throw new Error(`TTS ${line.file} failed: HTTP ${res.status} ${(await res.text()).slice(0, 160).replace(/\s+/g, " ")}`);
  return Buffer.from(await res.arrayBuffer());
}

async function scribe(file: string): Promise<string> {
  const form = new FormData();
  form.append("model_id", ELEVENLABS_STT_MODEL_ID);
  form.append("language_code", "hin");
  form.append("file", new Blob([readFileSync(file)], { type: "audio/mpeg" }), path.basename(file));
  const res = await fetch("https://api.elevenlabs.io/v1/speech-to-text", { method: "POST", headers: { "xi-api-key": key! }, body: form });
  if (!res.ok) return `(scribe failed: HTTP ${res.status})`;
  return ((await res.json()) as { text?: string }).text?.trim() ?? "";
}

const probe = (f: string) => Number(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", f], { encoding: "utf8" }).trim());

const results: Array<Record<string, unknown>> = [];
for (const line of LINES) {
  if (only && line.file !== only) {
    if (prior[line.file]) results.push(prior[line.file] as Record<string, unknown>);
    continue;
  }
  const raw = path.join(dir, `${line.file}.raw.mp3`);
  const out = path.join(dir, `${line.file}.mp3`);
  writeFileSync(raw, await tts(line));
  // match every line to the same loudness, trim leading and trailing silence, keep a short natural tail
  execFileSync("ffmpeg", ["-v", "error", "-y", "-i", raw, "-af", "silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.05,areverse,silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.1,areverse,loudnorm=I=-16:TP=-1.5:LRA=7", "-ar", "44100", "-b:a", "192k", out]);
  const heard = await scribe(out);
  const missing = line.expect.filter((w) => !heard.includes(w));
  const duration = probe(out);
  results.push({ file: line.file, voice: line.voice.name, start: line.start, end: Number((line.start + duration).toFixed(2)), duration: Number(duration.toFixed(2)), text: line.text, heard, missingWords: missing });
  console.log(`${missing.length ? "CHECK" : "ok   "} ${line.file} (${line.voice.name}) ${line.start}s to ${(line.start + duration).toFixed(2)}s | heard: ${heard}${missing.length ? ` | not heard: ${missing.join(", ")}` : ""}`);
}
writeFileSync(metaPath, JSON.stringify(results, null, 2));
console.log(`wrote ${path.relative(ROOT, metaPath)}`);
