import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "node:crypto";
import { existsSync, linkSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { backup, DatabaseSync } from "node:sqlite";

const FORMAT = "dukaan-encrypted-backup";
/** Publish a complete file exclusively, on the destination filesystem, without a partial target. */
function publish(destination: string, data: string | Buffer) {
  const dir = mkdtempSync(path.join(path.dirname(path.resolve(destination)), ".dukaan-publish-"));
  try {
    const file = path.join(dir, "payload");
    writeFileSync(file, data, { mode: 0o600, flag: "wx" });
    linkSync(file, destination); // fails if destination exists; never replaces a file
  } finally { rmSync(dir, { recursive: true, force: true }); }
}
function key(passphrase: string, salt: Buffer) {
  if (passphrase.length < 16) throw new Error("Backup passphrase must contain at least 16 characters.");
  return scryptSync(passphrase, salt, 32);
}

function validate(file: string) {
  const db = new DatabaseSync(file, { readOnly: true });
  try {
    const check = db.prepare("PRAGMA integrity_check").get();
    if (check?.integrity_check !== "ok") throw new Error("Database integrity check failed.");
    if (db.prepare("PRAGMA foreign_key_check").all().length) throw new Error("Database relationships are inconsistent.");
    for (const table of ["shops", "customers", "entries", "owners", "stock_flags", "pay_tokens", "audit_events"]) {
      if (!db.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?").get(table)) throw new Error("Not a complete Dukaan Dost database.");
    }
  } finally { db.close(); }
}

/** Operator-only snapshot: SQLite backup includes committed WAL data. No source writes or overwrite. */
export async function createEncryptedBackup(source: string, destination: string, passphrase: string) {
  if (existsSync(destination)) throw new Error("Destination already exists; choose a new backup file.");
  const salt = randomBytes(16);
  const derived = key(passphrase, salt);
  const dir = mkdtempSync(path.join(tmpdir(), "dukaan-backup-"));
  const snapshot = path.join(dir, "snapshot.sqlite");
  try {
    const db = new DatabaseSync(source, { readOnly: true });
    try { await backup(db, snapshot); } finally { db.close(); }
    validate(snapshot);
    const iv = randomBytes(12);
    const cipher = createCipheriv("aes-256-gcm", derived, iv);
    cipher.setAAD(Buffer.from(`${FORMAT}:1`));
    const data = Buffer.concat([cipher.update(readFileSync(snapshot)), cipher.final()]);
    publish(destination, JSON.stringify({ format: FORMAT, version: 1, createdAt: new Date().toISOString(), salt: salt.toString("base64"), iv: iv.toString("base64"), tag: cipher.getAuthTag().toString("base64"), data: data.toString("base64") }));
  } finally {
    derived.fill(0);
    rmSync(dir, { recursive: true, force: true });
  }
}

/** Restore to a NEW file only; never replaces a running ledger. Authentication precedes all output. */
export function restoreEncryptedBackup(source: string, destination: string, passphrase: string) {
  if (existsSync(destination)) throw new Error("Destination already exists; restore to a new database file.");
  const envelope = JSON.parse(readFileSync(source, "utf8"));
  if (envelope.format !== FORMAT || envelope.version !== 1 || ![envelope.salt, envelope.iv, envelope.tag, envelope.data].every((v) => typeof v === "string")) throw new Error("Unsupported backup format.");
  const salt = Buffer.from(envelope.salt, "base64");
  const iv = Buffer.from(envelope.iv, "base64");
  const tag = Buffer.from(envelope.tag, "base64");
  if (salt.length !== 16 || iv.length !== 12 || tag.length !== 16) throw new Error("Invalid backup envelope.");
  const derived = key(passphrase, salt);
  const dir = mkdtempSync(path.join(tmpdir(), "dukaan-restore-"));
  try {
    const decipher = createDecipheriv("aes-256-gcm", derived, iv);
    decipher.setAAD(Buffer.from(`${FORMAT}:1`));
    decipher.setAuthTag(tag);
    const data = Buffer.concat([decipher.update(Buffer.from(envelope.data, "base64")), decipher.final()]);
    const candidate = path.join(dir, "candidate.sqlite");
    writeFileSync(candidate, data, { mode: 0o600 });
    validate(candidate);
    publish(destination, data);
    data.fill(0);
  } finally {
    derived.fill(0);
    rmSync(dir, { recursive: true, force: true });
  }
}
