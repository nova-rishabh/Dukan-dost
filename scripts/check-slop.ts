import { existsSync } from "node:fs";
import { projectFiles, read } from "./lib/util";

/**
 * Design-slop gate (03_DESIGN_SYSTEM sections 2 to 4 and 14). Fails on the things the owner banned.
 * Add an exception only in ALLOWED, with a reason.
 */
const ALLOWED: Array<{ file: RegExp; rule: string; reason: string }> = [
  // none needed today; keep the list explicit so every exception is reviewed
];

const SCAN = /^(src\/.*\.(css|ts|tsx)|deliverables\/(social|deck)\/.*\.(html|css))$/;
const files = projectFiles().filter((f) => SCAN.test(f) && existsSync(f));

const tokenSet = new Set<string>();
for (const m of read("src/app/globals.css").matchAll(/--[a-z-]+:\s*(#[0-9A-Fa-f]{6})\s*;/g)) tokenSet.add(m[1].toUpperCase());

interface Hit {
  file: string;
  line: number;
  rule: string;
  text: string;
}
const hits: Hit[] = [];

const BANNED_FONT = /^(inter|roboto|arial|system-ui|-apple-system|helvetica)$/i;

function check(file: string) {
  const src = read(file);
  const lines = src.split(/\r?\n/);
  const isCss = file.endsWith(".css") || file.endsWith(".html");
  lines.forEach((text, i) => {
    const add = (rule: string) => {
      if (!ALLOWED.some((a) => a.file.test(file) && a.rule === rule)) hits.push({ file, line: i + 1, rule, text: text.trim().slice(0, 120) });
    };
    for (const m of text.matchAll(/font-?family\s*[:=]\s*["'`]?([^;"'`,}]+)/gi)) {
      if (BANNED_FONT.test(m[1].trim())) add("banned primary font");
    }
    if (/font-\[(Inter|Roboto|Arial)/i.test(text)) add("banned primary font");
    if (/backdrop-filter|backdrop-blur/i.test(text)) add("backdrop-filter");
    if (/(linear|radial|conic)-gradient/i.test(text)) add("gradient");
    if (/(?<![\w-])(uppercase|tracking-widest|tracking-wider)(?![\w-])/.test(text) || /text-transform\s*:\s*uppercase/i.test(text)) add("all-caps text");
    if (text.includes("→")) add("arrow character in UI string");
    for (const m of text.matchAll(/#[0-9A-Fa-f]{6}(?![0-9A-Fa-f])/g)) {
      if (!tokenSet.has(m[0].toUpperCase())) add(`hex colour outside the token set (${m[0]})`);
    }
    if (isCss) for (const m of text.matchAll(/(?<![\w&])#[0-9A-Fa-f]{3}(?![0-9A-Za-z-])(?=\s*[;,)}])/g)) add(`short hex colour (${m[0]})`);
  });
  if (/@keyframes|animation\s*:|transition\s*:/.test(src) && !/prefers-reduced-motion/.test(src) && file.endsWith(".css")) {
    hits.push({ file, line: 1, rule: "motion without prefers-reduced-motion handling", text: "" });
  }
}

files.forEach(check);

const global = read("src/app/globals.css");
if (!/prefers-reduced-motion:\s*reduce/.test(global)) hits.push({ file: "src/app/globals.css", line: 1, rule: "missing prefers-reduced-motion handling", text: "" });

console.log(`check:slop scanned ${files.length} files, ${tokenSet.size} palette tokens, ${ALLOWED.length} allowed exceptions`);
if (hits.length) {
  for (const h of hits) console.log(`SLOP ${h.file}:${h.line} [${h.rule}] ${h.text}`);
  console.log(`check:slop FAIL (${hits.length} hits)`);
  process.exit(1);
}
console.log("check:slop PASS");
