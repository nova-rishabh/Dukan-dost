import { randomBytes } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

export function makeSetupCode(env: Record<string, string | undefined>, authRequired: boolean): string {
  if (env.SETUP_CODE?.trim()) return env.SETUP_CODE.trim();
  const code = randomBytes(5).toString("hex");
  if (authRequired) {
    const file = path.resolve(path.dirname(env.DUKAAN_DB_FILE || ".data/ledger.sqlite"), "setup-code.txt");
    mkdirSync(path.dirname(file), { recursive: true });
    if (existsSync(file)) {
      const existing = readFileSync(file, "utf8").trim();
      if (!/^[a-f0-9]{10}$/.test(existing)) throw new Error("Invalid persisted setup code; configure SETUP_CODE explicitly.");
      return existing;
    }
    try { writeFileSync(file, `${code}\n`, { flag: "wx", mode: 0o600 }); }
    catch (error) {
      // A concurrent worker may have created the same bootstrap credential first.
      if ((error as NodeJS.ErrnoException).code === "EEXIST") {
        const existing = readFileSync(file, "utf8").trim();
        if (/^[a-f0-9]{10}$/.test(existing)) return existing;
      }
      throw new Error("Cannot persist setup credential. Configure SETUP_CODE or a writable database directory.", { cause: error });
    }
  }
  return code;
}
