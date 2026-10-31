import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { createElevenLabsTts } from "../src/lib/providers/elevenlabs";
import { SAMPLE_CLIPS } from "../src/lib/samples";
import { loadEnv, ROOT } from "./lib/util";

loadEnv();
const key = process.env.ELEVENLABS_API_KEY;
if (!key) {
  console.log("samples:generate needs ELEVENLABS_API_KEY (see SETUP_FOR_RISHABH.md step 2). Nothing was generated.");
  process.exit(1);
}

// Spoken Hindi version of each clip. These are AI voices and are labelled "dramatisation" in the app.
const tts = createElevenLabsTts(key);
const dir = path.join(ROOT, "public", "samples");
mkdirSync(dir, { recursive: true });
for (const clip of SAMPLE_CLIPS) {
  const audio = await tts.speak(clip.transcript);
  if (!audio) throw new Error("TTS returned nothing");
  writeFileSync(path.join(dir, `${clip.id}.mp3`), Buffer.from(audio.data));
  console.log(`wrote public/samples/${clip.id}.mp3`);
}
console.log("Done. Mix shop noise into the 'shor' clip with ffmpeg if you want a truly noisy one (see docs/06_TEST_PLAN.md section 4).");
