import { createEncryptedBackup, restoreEncryptedBackup } from "../src/lib/store/backup";
import { loadEnv } from "./lib/util";

loadEnv();
const [action, source, destination] = process.argv.slice(2);
if (!["create", "restore"].includes(action) || !source || !destination) {
  console.error("Usage: pnpm db:backup create|restore <source-file> <new-destination-file>");
  process.exit(1);
}
const passphrase = process.env.DUKAAN_BACKUP_PASSPHRASE;
if (!passphrase) {
  console.error("Set DUKAAN_BACKUP_PASSPHRASE in the operator environment; do not pass it on the command line.");
  process.exit(1);
}
try {
  if (action === "create") await createEncryptedBackup(source, destination, passphrase);
  else restoreEncryptedBackup(source, destination, passphrase);
  console.log(action === "create" ? "Encrypted backup created. Copy it to protected off-host storage." : "Restore validated into a new file. Before serving it, rotate PROPOSAL_SECRET to invalidate historical sessions and proposals. Follow docs/20_OPERATIONS.md.");
} catch {
  // Provider/SQLite errors may include paths or data: keep CLI output private by default.
  console.error("Backup operation failed. Check source, destination, passphrase and disk access. Existing files were not replaced.");
  process.exit(1);
}
