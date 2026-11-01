import { existsSync, readFileSync } from "node:fs";
import { projectFiles } from "./lib/util";

/** Fails on key-like strings, tracked env files and phone-number patterns. */
const files = projectFiles().filter((f) => existsSync(f));
const BINARY = /\.(png|jpe?g|gif|webp|mp3|mp4|wav|ogg|woff2?|pdf|ico|zip|lock)$/i;
const SKIP = /(^|\/)(pnpm-lock\.yaml|package-lock\.json)$|(^|\/)\.hyperframes\//; // generated render state holds hashes in file paths

const KEY_PATTERNS: Array<[string, RegExp]> = [
  ["Google API key", /AIza[0-9A-Za-z_-]{35}/],
  ["ElevenLabs-style key", /\bsk_[a-f0-9]{24,}\b/],
  ["JWT-like key", /eyJ[A-Za-z0-9_-]{15,}\.[A-Za-z0-9_-]{15,}\.[A-Za-z0-9_-]{10,}/],
  ["private key block", /-----BEGIN [A-Z ]*PRIVATE KEY-----/],
  ["assigned secret", /\b(api[_-]?key|secret|service[_-]?role[_-]?key|access[_-]?token)\b\s*[:=]\s*["'][A-Za-z0-9_\-/+]{24,}["']/i],
];
const PHONE = /(?<![\d.])(?:\+?91[\s-]?)?[6-9]\d{4}[\s-]?\d{5}(?![\d])/;

const problems: string[] = [];
for (const f of files) {
  if (/(^|\/)\.env(\.|$)/.test(f) && !f.endsWith(".env.example")) problems.push(`${f}: env file is not ignored by git`);
  if (BINARY.test(f) || SKIP.test(f)) continue;
  const lines = readFileSync(f, "utf8").split(/\r?\n/);
  lines.forEach((line, i) => {
    for (const [name, re] of KEY_PATTERNS) if (re.test(line)) problems.push(`${f}:${i + 1}: ${name}`);
    if (PHONE.test(line)) problems.push(`${f}:${i + 1}: phone-number pattern`);
  });
}

console.log(`check:secrets scanned ${files.length} files`);
if (problems.length) {
  for (const p of problems) console.log(`SECRET ${p}`);
  console.log(`check:secrets FAIL (${problems.length})`);
  process.exit(1);
}
console.log("check:secrets PASS");
