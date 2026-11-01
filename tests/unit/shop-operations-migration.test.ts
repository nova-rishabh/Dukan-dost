import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterAll, expect, it } from "vitest";
import { LocalStore } from "@/lib/store/local";
import { SqliteStore } from "@/lib/store/sqlite";

const dir = mkdtempSync(path.join(tmpdir(), "dukaan-operations-migration-"));
afterAll(() => rmSync(dir, { recursive: true, force: true }));
const mobile = ["70000", "00201"].join("");
it("persists verification attempts, proofs, customer archives and movement history across SQLite reopen", async () => {
  const file = path.join(dir, "reopen.sqlite");
  let store = new SqliteStore(file);
  await store.createShop({ id: "a", name: "Fictional", upiVpa: "", isDemo: false });
  await store.createRegistration({ id: "proof", browserHash: "hash", mobile, purpose: "signup", state: "requested", expiresAt: "2099-01-01T00:00:00.000Z" });
  for (let i = 0; i < 5; i++) {
    expect(await store.transitionRegistration("proof", "hash", "requested", "verifying")).toBe(true);
    await store.transitionRegistration("proof", "hash", "verifying", "requested");
  }
  const product = await store.createProduct({ shopId: "a", name: "Rice", unit: "kg", onHandMinor: null, lowThresholdMinor: 500 });
  await store.applyMovement({ shopId: "a", productId: product.id, kind: "opening", quantityMinor: 1000, reason: "Counted", expectedVersion: 0, idempotencyKey: "count", createdAt: "2026-11-01T10:00:00.000Z" });
  const customer = await store.createCustomer({ shopId: "a", name: "Fictional", nameRoman: "Fictional", aliases: [] });
  await store.updateCustomer("a", customer.id, { archivedAt: "2026-11-01T10:00:00.000Z" });
  store.close(); store = new SqliteStore(file);
  expect((await store.getRegistration("proof"))?.verifyAttempts).toBe(5);
  expect(await store.transitionRegistration("proof", "hash", "requested", "verifying")).toBe(false);
  expect((await store.listProducts("a"))[0].onHandMinor).toBe(1000);
  expect(await store.listMovements("a")).toHaveLength(1);
  expect((await store.listCustomers("a"))[0].archivedAt).toBeTruthy();
  store.close();
});

it("fails safely for legacy duplicate identities in local JSON without merging either account", () => {
  const file = path.join(dir, "duplicate.json");
  writeFileSync(file, JSON.stringify({ shops: [], customers: [], entries: [], stock: [], tokens: [], audit: [], nextAuditId: 1, owners: [
    { shopId: "a", name: "A", mobile, passcodeHash: "first", authVersion: 0, createdAt: "2026-11-01" },
    { shopId: "b", name: "B", mobile: `+91${mobile}`, passcodeHash: "second", authVersion: 0, createdAt: "2026-11-01" },
  ] }));
  expect(() => new LocalStore({ file })).toThrow("duplicate_mobile");
});

it("normalizes a legacy owner and adds new tables without changing their credentials", async () => {
  const file = path.join(dir, "legacy.sqlite");
  const sqlite = process.getBuiltinModule("node:sqlite")!;
  const db = new sqlite.DatabaseSync(file);
  db.exec("create table shops(id text primary key,name text not null,upi_vpa text,is_demo integer default 0); create table owners(shop_id text primary key,name text,mobile text,passcode_hash text,created_at text)");
  db.prepare("insert into shops values ('a','Fictional','',0)").run();
  db.prepare("insert into owners values ('a','Owner',?,'legacy-hash','2026-11-01')").run(mobile);
  db.close();
  const store = new SqliteStore(file);
  expect(await store.getOwnerByMobile(`+91${mobile}`)).toMatchObject({ shopId: "a", mobile: `+91${mobile}`, passcodeHash: "legacy-hash", authVersion: 0 });
  expect(await store.listProducts("a")).toEqual([]);
  store.close();
});

it("refuses duplicate legacy SQLite mobiles and leaves both owners untouched", () => {
  const file = path.join(dir, "duplicate.sqlite");
  const sqlite = process.getBuiltinModule("node:sqlite")!;
  const db = new sqlite.DatabaseSync(file);
  db.exec("create table shops(id text primary key,name text not null,upi_vpa text,is_demo integer default 0); create table owners(shop_id text primary key,name text,mobile text,passcode_hash text,created_at text)");
  for (const [id, phone] of [["a", mobile], ["b", `+91${mobile}`]]) {
    db.prepare("insert into shops values (?, 'Fictional','',0)").run(id);
    db.prepare("insert into owners values (?,'Owner',?,'legacy-hash','2026-11-01')").run(id, phone);
  }
  db.close();
  expect(() => new SqliteStore(file)).toThrow("duplicate_mobile");
  const check = new sqlite.DatabaseSync(file);
  expect((check.prepare("select count(*) as n from owners").get() as { n: number }).n).toBe(2);
  check.close();
});
