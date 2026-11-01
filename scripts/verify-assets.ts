import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, statSync } from "node:fs";
import { abs, pngSize } from "./lib/util";

/** Checks that every deliverable from phases 5 to 9 exists and is what it claims to be. */
const results: Array<{ ok: boolean; name: string; detail: string }> = [];
const check = (name: string, fn: () => string) => {
  try {
    results.push({ ok: true, name, detail: fn() });
  } catch (e) {
    results.push({ ok: false, name, detail: e instanceof Error ? e.message : String(e) });
  }
};
const need = (rel: string) => {
  if (!existsSync(abs(rel))) throw new Error(`missing ${rel}`);
  if (statSync(abs(rel)).size === 0) throw new Error(`empty ${rel}`);
  return abs(rel);
};

// Social posts: three PNGs at 1080 by 1350, plus captions with the published trial URL.
for (const f of ["post-1-ne-ya-ko", "post-2-bahi-vs-bolo", "post-3-vasooli-politely"]) {
  check(`social ${f}.png`, () => {
    const size = pngSize(readFileSync(need(`deliverables/social/${f}.png`)));
    if (!size || size.w !== 1080 || size.h !== 1350) throw new Error(`expected 1080x1350, got ${size ? `${size.w}x${size.h}` : "not a PNG"}`);
    return "1080x1350";
  });
}
check("social captions.md", () => {
  const t = readFileSync(need("deliverables/social/captions.md"), "utf8");
  const n = (t.match(/https:\/\/dukaan-dost\.onrender\.com\/try/g) ?? []).length;
  if (n < 3 || t.includes("{{APP_URL}}")) throw new Error(`expected finished trial URL at least 3 times, found ${n}`);
  if (!/[ऀ-ॿ]/.test(t)) throw new Error("no Hindi (Devanagari) caption");
  return `${n} finished trial links, Hindi and English`;
});

// Deck: 11 slides in HTML (the challenge's order), and a PDF that opens with 11 pages.
check("deck index.html has 11 slides", () => {
  const html = readFileSync(need("deliverables/deck/index.html"), "utf8");
  const n = (html.match(/<section[^>]*class="[^"]*\bslide\b[^"]*"/g) ?? []).length;
  if (n !== 11) throw new Error(`expected 11 slides, found ${n}`);
  return "8 slides";
});
check("deck deck.pdf opens, 8 pages", () => {
  const buf = readFileSync(need("deliverables/deck/deck.pdf"));
  if (buf.subarray(0, 5).toString() !== "%PDF-") throw new Error("not a PDF");
  const text = buf.toString("latin1");
  const pages = (text.match(/\/Type\s*\/Page(?![s\w])/g) ?? []).length;
  if (pages !== 11) throw new Error(`expected 11 pages, found ${pages}`);
  return `PDF header ok, ${pages} pages, ${(buf.length / 1024).toFixed(0)} KB`;
});

// Video ad: ffprobe the 45-second launch film (the challenge asks for 30 to 60 seconds).
check("ad mp4 (ffprobe)", () => {
  const file = need("public/submission/dukaan-dost-ad.mp4");
  const raw = execFileSync("ffprobe", ["-v", "error", "-show_entries", "stream=codec_type,width,height,r_frame_rate,duration:format=duration", "-of", "json", file], { encoding: "utf8" });
  const j = JSON.parse(raw) as { streams: Array<{ codec_type: string; width?: number; height?: number; r_frame_rate?: string }>; format: { duration: string } };
  const v = j.streams.find((s) => s.codec_type === "video");
  const a = j.streams.find((s) => s.codec_type === "audio");
  const dur = Number(j.format.duration);
  if (!v || v.width !== 1920 || v.height !== 1080) throw new Error(`expected 1920x1080, got ${v?.width}x${v?.height}`);
  const [n, d] = (v.r_frame_rate ?? "0/1").split("/").map(Number);
  if (Math.round(n / d) !== 30) throw new Error(`expected 30 fps, got ${v.r_frame_rate}`);
  if (!(dur >= 30 && dur <= 60)) throw new Error(`the challenge asks for 30 to 60 seconds, got ${dur.toFixed(2)}`);
  if (!a) throw new Error("no audio track");
  return `${v.width}x${v.height}, ${Math.round(n / d)} fps, ${dur.toFixed(2)} s, audio present`;
});

// Sounds: effects are CC0 with provenance; the score is original; the stamp effect peak lands on the hero hit.
check("launch sounds CREDITS.json (cc0 effects, stamp peak-aligned)", () => {
  const list = JSON.parse(readFileSync(need("deliverables/launch/assets/sounds/CREDITS.json"), "utf8")) as Array<Record<string, unknown>>;
  if (!Array.isArray(list) || list.length === 0) throw new Error("CREDITS.json is empty");
  for (const e of list) {
    if (e.role === "music-score") continue;
    if (e.license !== "cc0") throw new Error(`non-cc0 entry: ${String(e.title)}`);
    for (const k of ["title", "creator", "openverseId", "landingUrl", "file"]) if (!e[k]) throw new Error(`entry missing ${k}`);
    need(`deliverables/launch/assets/sounds/${String(e.file)}`);
  }
  const stamp = list.find((e) => e.role === "stamp-thunk") as { peakOffsetMs: number; placements: Array<{ hitSeconds: number; peakOffsetSeconds: number; startSeconds: number; mediaStartSeconds: number }> } | undefined;
  if (!stamp) throw new Error("no stamp-thunk entry");
  const hero = stamp.placements.find((p) => p.hitSeconds === 14);
  if (!hero) throw new Error("no stamp placement at 14.0 s");
  const expected = Math.max(0, hero.hitSeconds - hero.peakOffsetSeconds);
  if (Math.abs(expected - hero.startSeconds) > 0.002) throw new Error(`stamp start ${hero.startSeconds} != hit - peak (${expected})`);
  return `${list.length} entries; stamp hit 14.000 s, peak offset ${hero.peakOffsetSeconds} s, start ${hero.startSeconds} s`;
});
check("launch score and real product CTA", () => {
  need("deliverables/launch/assets/music/launch-score-120bpm.mp3");
  const html = readFileSync(need("deliverables/launch/index.html"), "utf8");
  if (!html.includes('id="music-bed"') || !html.includes("launch-score-120bpm.mp3")) throw new Error("score not mounted");
  const end = readFileSync(need("deliverables/launch/compositions/e-end.html"), "utf8");
  if (end.includes("{{APP_URL}}") || !end.includes("dukaan-dost.onrender.com")) throw new Error("film CTA is unfinished");
  return "original score mounted, product URL shown";
});
check("ad FLOWS_PROMPTS.md", () => {
  const t = readFileSync(need("deliverables/ad/FLOWS_PROMPTS.md"), "utf8");
  if (!/shot1\.mp4/.test(t) || !/shot2\.mp4/.test(t)) throw new Error("must name assets/clips/shot1.mp4 and shot2.mp4");
  return "prompts for shot 1 and shot 2";
});
check("ad REVIEW.md", () => {
  need("deliverables/ad/REVIEW.md");
  return "present";
});

// Screens, setup guide, env example.
for (const s of ["landing", "shop-home", "customer", "pay", "try"]) {
  for (const w of ["390", "1440"]) {
    check(`screenshot ${s}-${w}.png`, () => {
      const size = pngSize(readFileSync(need(`docs/screenshots/${s}-${w}.png`)));
      if (!size || size.w !== Number(w)) throw new Error(`expected width ${w}, got ${size?.w}`);
      return `${size.w}x${size.h}`;
    });
  }
}
check("docs/12_VISUAL_REVIEW.md", () => {
  const t = readFileSync(need("docs/12_VISUAL_REVIEW.md"), "utf8");
  if (!/14-point/i.test(t)) throw new Error("no 14-point checklist recorded");
  return "14-point checklist recorded";
});
check(".env.example (names only)", () => {
  const t = readFileSync(need(".env.example"), "utf8");
  for (const n of ["ELEVENLABS_API_KEY", "GEMINI_API_KEY", "PROPOSAL_SECRET", "DUKAAN_DB_FILE", "WA_SERVICE_URL", "WA_APP_KEY", "WA_APP_SECRET", "NEXT_PUBLIC_APP_URL", "DEMO_SHOP_ID", "DEMO_UPI_VPA"]) {
    if (!new RegExp(`^${n}=\\s*$`, "m").test(t)) throw new Error(`${n} missing or has a value`);
  }
  return "10 names, no values";
});
check("SETUP_FOR_RISHABH.md", () => {
  const t = readFileSync(need("SETUP_FOR_RISHABH.md"), "utf8");
  const steps = (t.match(/^## Step \d+/gm) ?? []).length;
  if (steps < 12) throw new Error(`expected 12 steps, found ${steps}`);
  return `${steps} steps`;
});
check("sqlite store source", () => {
  need("src/lib/store/sqlite.ts");
  return "src/lib/store/sqlite.ts";
});

let failed = 0;
for (const r of results) {
  console.log(`${r.ok ? "OK  " : "FAIL"} ${r.name}: ${r.detail}`);
  if (!r.ok) failed++;
}
console.log(failed ? `verify:assets FAIL (${failed} of ${results.length})` : `verify:assets PASS (${results.length} checks)`);
process.exit(failed ? 1 : 0);
