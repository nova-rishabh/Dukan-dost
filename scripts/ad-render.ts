/** Renders the HyperFrames ad in deliverables/ad to deliverables/ad/out/dukaan-dost-ad-vertical.mp4. */
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, statSync } from "node:fs";
import path from "node:path";
import { ROOT } from "./lib/util";

const AD = path.join(ROOT, "deliverables", "ad");
const out = path.join(AD, "out", "dukaan-dost-ad-vertical.mp4");
mkdirSync(path.dirname(out), { recursive: true });
const quality = process.argv.includes("--draft") ? "draft" : "delivery";
const npx = process.platform === "win32" ? "npx.cmd" : "npx";
const r = spawnSync(npx, ["--yes", "hyperframes@0.8.223", "render", "--quality", quality, "--output", out], { cwd: AD, stdio: "inherit", shell: process.platform === "win32" });
if (r.status !== 0 || !existsSync(out)) {
  console.error("Render failed. Run `npx hyperframes check --json` in deliverables/ad first.");
  process.exit(r.status ?? 1);
}
console.log(`Rendered ${out} (${(statSync(out).size / 1e6).toFixed(1)} MB)`);
