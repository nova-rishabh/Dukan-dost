/**
 * Optional Hindi voice-over line for the ad, generated with ElevenLabs TTS when ELEVENLABS_API_KEY exists.
 * Uses a stock voice (ELEVENLABS_VOICE_ID or the first Hindi voice). No voice cloning. The ad renders fine without it.
 * Output: deliverables/ad/assets/vo/*.mp3. To use it, add an <audio id="vo" src="assets/vo/vo-closing.mp3" data-start="24.6"
 * data-duration="2.5"> to deliverables/ad/index.html.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { createElevenLabsTts } from "../src/lib/providers/elevenlabs";
import { loadEnv, ROOT } from "./lib/util";

loadEnv();
const key = process.env.ELEVENLABS_API_KEY;
if (!key) {
  console.log("ad:vo: ELEVENLABS_API_KEY is not set, so no voice-over was generated. The ad renders without it (nothing is broken).");
  process.exit(0);
}

const LINES: Array<{ file: string; text: string }> = [{ file: "vo-closing.mp3", text: "बोलो, लिखो मत। दुकान दोस्त।" }];
const dir = path.join(ROOT, "deliverables", "ad", "assets", "vo");
mkdirSync(dir, { recursive: true });
const tts = createElevenLabsTts(key);
for (const l of LINES) {
  const audio = await tts.speak(l.text);
  if (!audio) throw new Error("TTS returned nothing");
  writeFileSync(path.join(dir, l.file), Buffer.from(audio.data));
  console.log(`wrote deliverables/ad/assets/vo/${l.file}`);
}
