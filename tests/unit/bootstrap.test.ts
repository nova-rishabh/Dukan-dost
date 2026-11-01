import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { expect, it } from "vitest";
import { makeSetupCode } from "@/server/bootstrap";

it("retains a generated setup credential beside the durable database across restarts", () => {
  const dir = mkdtempSync(path.join(tmpdir(), "dukaan-bootstrap-"));
  try {
    const env = { DUKAAN_DB_FILE: path.join(dir, "shop.sqlite") };
    const first = makeSetupCode(env, true);
    expect(makeSetupCode(env, true)).toBe(first);
    expect(readFileSync(path.join(dir, "setup-code.txt"), "utf8").trim()).toBe(first);
    writeFileSync(path.join(dir, "setup-code.txt"), "corrupted");
    expect(() => makeSetupCode(env, true)).toThrow("Invalid persisted");
    expect(makeSetupCode({ ...env, SETUP_CODE: "operator-managed-bootstrap" }, true)).toBe("operator-managed-bootstrap");
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
