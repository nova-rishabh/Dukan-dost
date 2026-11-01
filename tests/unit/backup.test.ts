import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterAll, expect, it } from "vitest";
import { createEncryptedBackup, restoreEncryptedBackup } from "@/lib/store/backup";
import { SqliteStore } from "@/lib/store/sqlite";
import { SEED_SHOP_ID } from "@/lib/seed";

const dir = mkdtempSync(path.join(tmpdir(), "dukaan-backup-test-"));
const pass = "fictional backup test passphrase";
afterAll(() => rmSync(dir, { recursive: true, force: true }));

it("rehearses encrypted backup and restore of a live WAL database including voids and balances", async () => {
  const source = path.join(dir, "live.sqlite");
  const encrypted = path.join(dir, "snapshot.ddbackup");
  const target = path.join(dir, "restored.sqlite");
  const store = new SqliteStore(source);
  try {
    const entries = await store.listEntries(SEED_SHOP_ID);
    await store.voidEntry(SEED_SHOP_ID, entries[0].id, "test correction", "2026-11-01T10:00:00Z");
    await store.createOwner({ shopId: SEED_SHOP_ID, name: "Fictional owner", mobile: `+91${["70000", "00001"].join("")}`, passcodeHash: "fictional-hash", authVersion: 3, createdAt: "2026-11-01T10:00:00Z" });
    await store.savePayToken({ token: "backup-test-pay-token", shopId: SEED_SHOP_ID, customerId: entries[0].customerId, amountPaise: 100, expiresAt: "2026-11-08T10:00:00Z" });
    await store.claimReminderDelivery({ shopId: SEED_SHOP_ID, token: "backup-test-pay-token", fingerprint: "fictional-fingerprint", status: "unknown", createdAt: "2026-11-01T10:00:00Z" });
    await store.appendAudit(SEED_SHOP_ID, "backup_rehearsal", { synthetic: true }, "2026-11-01T10:00:00Z");
    await createEncryptedBackup(source, encrypted, pass);
    expect(readFileSync(encrypted, "utf8")).not.toContain("test correction");
    restoreEncryptedBackup(encrypted, target, pass);
    const restored = new SqliteStore(target);
    try {
      expect(await restored.listEntries(SEED_SHOP_ID)).toEqual(await store.listEntries(SEED_SHOP_ID));
      expect(await restored.listCustomers(SEED_SHOP_ID)).toEqual(await store.listCustomers(SEED_SHOP_ID));
      expect(await restored.listStockFlags(SEED_SHOP_ID)).toEqual(await store.listStockFlags(SEED_SHOP_ID));
      expect(await restored.listAudit(SEED_SHOP_ID, 100)).toEqual(await store.listAudit(SEED_SHOP_ID, 100));
      expect(await restored.getShop(SEED_SHOP_ID)).toEqual(await store.getShop(SEED_SHOP_ID));
      expect(await restored.getOwner(SEED_SHOP_ID)).toEqual(await store.getOwner(SEED_SHOP_ID));
      expect(await restored.getPayToken("backup-test-pay-token")).toEqual(await store.getPayToken("backup-test-pay-token"));
      expect(await restored.getReminderDelivery(SEED_SHOP_ID, "backup-test-pay-token")).toEqual(await store.getReminderDelivery(SEED_SHOP_ID, "backup-test-pay-token"));
    } finally { restored.close(); }
    expect(() => restoreEncryptedBackup(encrypted, source, pass)).toThrow("already exists");
    await expect(createEncryptedBackup(source, encrypted, pass)).rejects.toThrow("already exists");
  } finally { store.close(); }
});

it("rejects wrong password, tampering and truncated backups without creating a restore target", async () => {
  const source = path.join(dir, "reject.sqlite");
  const encrypted = path.join(dir, "reject.ddbackup");
  const target = path.join(dir, "must-not-exist.sqlite");
  const store = new SqliteStore(source);
  try { await createEncryptedBackup(source, encrypted, pass); } finally { store.close(); }
  expect(() => restoreEncryptedBackup(encrypted, target, "a different fictional passphrase")).toThrow();
  const envelope = JSON.parse(readFileSync(encrypted, "utf8"));
  const data = Buffer.from(envelope.data, "base64");
  data[0] ^= 1;
  envelope.data = data.toString("base64");
  writeFileSync(encrypted, JSON.stringify(envelope));
  expect(() => restoreEncryptedBackup(encrypted, target, pass)).toThrow();
  writeFileSync(encrypted, "truncated");
  expect(() => restoreEncryptedBackup(encrypted, target, pass)).toThrow();
  expect(existsSync(target)).toBe(false);
});
