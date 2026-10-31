import { spawnSync } from "node:child_process";
import { rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";

const root = path.resolve(import.meta.dirname, "..", "..");
const probes: string[] = [];

function plant(rel: string, body: string) {
  const p = path.join(root, rel);
  writeFileSync(p, body);
  probes.push(p);
}
function run(script: string) {
  return spawnSync("pnpm", ["exec", "tsx", script], { cwd: root, encoding: "utf8", shell: true });
}
afterEach(() => {
  for (const p of probes.splice(0)) rmSync(p, { force: true });
});

describe("quality gates can actually fail", () => {
  const bad: Array<[string, string]> = [
    ["gradient", "a { background: linear-gradient(red, blue); }"],
    ["glass", "a { backdrop-filter: blur(4px); }"],
    ["Inter as primary font", "a { font-family: Inter, sans-serif; }"],
    ["all caps", "a { text-transform: uppercase; }"],
    ["colour outside the token set", "a { color: #123456; }"],
    ["arrow character", `a::after { content: "Go →"; }`],
  ];
  for (const [name, css] of bad) {
    it(`check:slop rejects ${name}`, () => {
      plant("src/__slop_probe.css", css);
      const r = run("scripts/check-slop.ts");
      expect(r.status).toBe(1);
      expect(r.stdout).toContain("__slop_probe.css");
    });
  }
  it("check:secrets rejects a key-like string and a phone-like number", () => {
    plant("src/__secret_probe.ts", `export const a = "${"AIza" + "b".repeat(35)}";\nexport const p = "${"98765" + "43210"}";\n`);
    const r = run("scripts/check-secrets.ts");
    expect(r.status).toBe(1);
    expect(r.stdout).toContain("Google API key");
    expect(r.stdout).toContain("phone-number pattern");
  });
});
