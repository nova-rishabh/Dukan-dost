import { spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { ROOT } from "./lib/util";

/** Runs every gate in order. Prints VERIFY-PASS only if all of them exit 0. */
const steps: Array<[string, string[]]> = [
  ["typecheck", ["run", "typecheck"]],
  ["lint", ["run", "lint"]],
  ["test (unit + 20 fixtures)", ["run", "test"]],
  ["build", ["run", "build"]],
  ["test:e2e (scripts + axe)", ["run", "test:e2e"]],
  ["check:slop", ["run", "check:slop"]],
  ["check:secrets", ["run", "check:secrets"]],
  ["verify:assets", ["run", "verify:assets"]],
];

mkdirSync(path.join(ROOT, ".goal"), { recursive: true });
const failed: string[] = [];
for (const [name, args] of steps) {
  const started = Date.now();
  const r = spawnSync("pnpm", args, { cwd: ROOT, encoding: "utf8", shell: true, maxBuffer: 64 * 1024 * 1024 });
  const log = `${r.stdout ?? ""}\n${r.stderr ?? ""}`;
  writeFileSync(path.join(ROOT, ".goal", `verify-${name.split(" ")[0].replace(/[^a-z0-9]/gi, "_")}.log`), log);
  const ok = r.status === 0;
  const tail = log.trim().split(/\r?\n/).filter(Boolean).slice(-3).join(" | ");
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}  (${((Date.now() - started) / 1000).toFixed(1)}s)  ${ok ? "" : tail}`);
  if (!ok) failed.push(name);
}

if (failed.length) {
  console.log(`VERIFY-FAIL: ${failed.join(", ")}`);
  process.exit(1);
}
console.log("VERIFY-PASS");
