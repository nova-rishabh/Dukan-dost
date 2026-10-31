/**
 * Aligns CC0 sound effects to the picture for the Dukaan Dost ad.
 *
 *   pnpm ad:sync-sounds            read deliverables/ad/assets/sounds/CREDITS.json, decode every file with ffmpeg,
 *                                  find the loudest sample, compute startMs = hitTimeMs - peakOffsetMs (trimming the
 *                                  head with mediaStartMs when that would be negative), write the numbers back and
 *                                  rewrite the <audio> block in deliverables/ad/index.html.
 *   pnpm ad:sync-sounds --search   list CC0 candidates per role from the Openverse API (no download, no writes).
 *
 * Downloaded audio is untrusted data: it is only ever decoded by ffmpeg, never executed.
 */
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { ROOT } from "./lib/util";

const AD = path.join(ROOT, "deliverables", "ad");
const SOUNDS = path.join(AD, "assets", "sounds");
const CREDITS = path.join(SOUNDS, "CREDITS.json");
const PLAN = path.join(SOUNDS, "PLAN.json");
const INDEX = path.join(AD, "index.html");
const RATE = 44100;
const FPS = 30;
const TARGET_PEAK = 0.8; // of full scale, before each role's gain

interface Credit {
  role: string;
  title: string;
  creator: string;
  openverseId: string;
  landingUrl: string;
  license: "cc0";
  file: string;
  hitTimeMs?: number;
  peakOffsetMs?: number;
  startMs?: number;
  mediaStartMs?: number;
  /** relative loudness after peak normalisation (1 = target peak); the written data-volume = gain x normalisation */
  gain?: number;
  volume?: number;
}
interface PlanItem {
  role: string;
  query: string;
  hitTimeMs: number;
  note?: string;
}

const readJson = <T>(p: string, fallback: T): T => (existsSync(p) ? (JSON.parse(readFileSync(p, "utf8")) as T) : fallback);

/** Mono 16-bit PCM at 44.1 kHz, decoded by ffmpeg. */
function decode(file: string): Int16Array {
  const buf = execFileSync("ffmpeg", ["-v", "error", "-i", file, "-ac", "1", "-ar", String(RATE), "-f", "s16le", "-"], { maxBuffer: 256 * 1024 * 1024 });
  return new Int16Array(buf.buffer, buf.byteOffset, Math.floor(buf.byteLength / 2));
}

function peakOf(pcm: Int16Array): { index: number; amp: number } {
  let index = 0;
  let amp = 0;
  for (let i = 0; i < pcm.length; i++) {
    const a = Math.abs(pcm[i]);
    if (a > amp) {
      amp = a;
      index = i;
    }
  }
  return { index, amp };
}

async function search() {
  const plan = readJson<PlanItem[]>(PLAN, []);
  for (const item of plan) {
    const url = `https://api.openverse.org/v1/audio/?q=${encodeURIComponent(item.query)}&license=cc0&page_size=20`;
    let done = false;
    for (let attempt = 1; attempt <= 3 && !done; attempt++) {
      try {
        const res = await fetch(url, { signal: AbortSignal.timeout(45000) });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = (await res.json()) as { results: Array<{ id: string; title: string; creator?: string; license: string; url: string; foreign_landing_url: string; duration?: number; filetype?: string }> };
        const ok = json.results.filter((r) => r.license === "cc0" && (r.duration ?? 0) <= 4000 && r.url);
        console.log(`\n${item.role} ("${item.query}"): ${ok.length} CC0 candidates up to 4 s`);
        for (const r of ok.slice(0, 6)) console.log(`  ${r.id}  ${r.duration ?? "?"} ms  ${r.filetype ?? ""}  ${r.title}  by ${r.creator ?? "unknown"}\n    ${r.url}\n    ${r.foreign_landing_url}`);
        done = true;
      } catch (e) {
        console.log(`${item.role}: attempt ${attempt} failed (${(e as Error).message})`);
        await new Promise((r) => setTimeout(r, 4000 * attempt));
      }
    }
    if (!done) console.log(`${item.role}: Openverse unreachable after 3 tries, see .goal/BLOCKERS-openverse.md`);
  }
}

function sync() {
  const credits = readJson<Credit[]>(CREDITS, []);
  const plan = readJson<PlanItem[]>(PLAN, []);
  const lines: string[] = [];
  if (credits.length === 0) {
    console.log("CREDITS.json has no entries (no CC0 sound could be downloaded). The ad renders with a silent audio track only.");
  }
  credits.forEach((c, i) => {
    if (c.license !== "cc0") throw new Error(`${c.role}: license is "${c.license}", only "cc0" is allowed`);
    const file = path.join(SOUNDS, c.file);
    if (!existsSync(file)) throw new Error(`${c.role}: ${c.file} is missing`);
    const hit = c.hitTimeMs ?? plan.find((p) => p.role === c.role)?.hitTimeMs;
    if (hit === undefined) throw new Error(`${c.role}: no hitTimeMs in CREDITS.json or PLAN.json`);
    const pcm = decode(file);
    const { index, amp } = peakOf(pcm);
    const peakOffsetMs = Math.round((index / RATE) * 1000);
    const wanted = hit - peakOffsetMs;
    c.hitTimeMs = hit;
    c.peakOffsetMs = peakOffsetMs;
    c.startMs = Math.max(0, wanted);
    c.mediaStartMs = Math.max(0, -wanted);
    c.volume = +Math.min(3.98, (TARGET_PEAK / Math.max(amp / 32768, 0.01)) * (c.gain ?? 1)).toFixed(2);
    const durMs = Math.round((pcm.length / RATE) * 1000) - c.mediaStartMs;
    const frame = (hit / 1000) * FPS;
    console.log(`${c.role.padEnd(22)} hit ${hit} ms (frame ${frame.toFixed(1)})  peak at ${peakOffsetMs} ms (amp ${(amp / 32768).toFixed(2)}) volume ${c.volume}  start ${c.startMs} ms  mediaStart ${c.mediaStartMs} ms`);
    lines.push(
      `      <audio id="sfx-${c.role}" src="assets/sounds/${c.file}" data-start="${(c.startMs / 1000).toFixed(3)}" data-duration="${(durMs / 1000).toFixed(3)}" data-media-start="${(c.mediaStartMs / 1000).toFixed(3)}" data-track-index="${10 + i}" data-volume="${c.volume}"></audio>`,
    );
  });
  writeFileSync(CREDITS, JSON.stringify(credits, null, 2) + "\n");
  const html = readFileSync(INDEX, "utf8");
  const block = lines.length ? `\n${lines.join("\n")}\n      ` : "\n      ";
  const next = html.replace(/(<!-- SFX:BEGIN[^>]*-->)[\s\S]*?(<!-- SFX:END -->)/, (_m, a: string, b: string) => `${a}${block}${b}`);
  if (next === html && lines.length) throw new Error("SFX markers not found in deliverables/ad/index.html");
  writeFileSync(INDEX, next);
  console.log(`\nWrote ${credits.length} entries to CREDITS.json and the SFX block of index.html.`);
}

if (process.argv.includes("--search")) await search();
else sync();
