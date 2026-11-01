import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import { changePasscode, setupOwner, signSession } from "@/lib/auth";
import { LocalStore } from "@/lib/store/local";
import { SqliteStore } from "@/lib/store/sqlite";
import type { LedgerStore } from "@/lib/store/types";
import { readSession, sessionCookie } from "@/server/auth";
import type { AppContext } from "@/server/context";

const SHOP = "00000000-0000-4000-8000-000000000001";
const MOBILE = `+91${["70000", "00001"].join("")}`;
const secret = "fictional signing material for isolated tests";
const dir = mkdtempSync(path.join(tmpdir(), "dukaan-revocation-"));
afterAll(() => rmSync(dir, { recursive: true, force: true }));

const context = (store: LedgerStore) => ({ store, authRequired: true, shopId: SHOP, secret }) as AppContext;
const request = (cookie: string) => new Request("https://shop.example/api/summary", { headers: { cookie } });

for (const [name, make] of [
  ["local", () => new LocalStore({ file: null })],
  ["sqlite", () => new SqliteStore(":memory:", { seedDemo: false })],
] as const) {
  describe(`persistent session revocation: ${name}`, () => {
    it("rejects old passcode and OTP sessions after a password change or recovery reset", async () => {
      const store = make();
      const ctx = context(store);
      const owner = await setupOwner(store, { shopId: SHOP, shopName: "Test", upiVpa: "", name: "Owner", mobile: MOBILE, passcode: "old-passcode-test", now: new Date() });
      const a = sessionCookie(request(""), owner, ctx, "passcode");
      const b = sessionCookie(request(""), owner, ctx, "otp");
      expect(await readSession(request(a), ctx)).not.toBeNull();
      expect(await readSession(request(b), ctx)).not.toBeNull();
      // Failed changes never revoke valid sessions.
      await expect(changePasscode(store, { shopId: SHOP, current: "wrong", next: "new-passcode-test" })).rejects.toMatchObject({ code: "bad_credentials" });
      expect(await readSession(request(a), ctx)).not.toBeNull();
      await changePasscode(store, { shopId: SHOP, current: "old-passcode-test", next: "new-passcode-test" });
      expect(await readSession(request(a), ctx)).toBeNull();
      expect(await readSession(request(b), ctx)).toBeNull();
      const currentOwner = (await store.getOwner(SHOP))!;
      const c = sessionCookie(request(""), currentOwner, ctx, "otp");
      expect(await readSession(request(c), ctx)).not.toBeNull();
      await changePasscode(store, { shopId: SHOP, next: "recovered-passcode-test", skipCurrent: true });
      expect(await readSession(request(c), ctx)).toBeNull();
      if (store instanceof SqliteStore) store.close();
    });

    it("revokes all device sessions and fails closed for missing token versions", async () => {
      const store = make();
      const ctx = context(store);
      const owner = await setupOwner(store, { shopId: SHOP, shopName: "Test", upiVpa: "", name: "Owner", mobile: MOBILE, passcode: "old-passcode-test", now: new Date() });
      const cookie = sessionCookie(request(""), owner, ctx, "passcode");
      await store.revokeOwnerSessions(SHOP);
      expect(await readSession(request(cookie), ctx)).toBeNull();
      const fresh = sessionCookie(request(""), (await store.getOwner(SHOP))!, ctx, "passcode");
      expect(await readSession(request(fresh), ctx)).not.toBeNull();
      const invalid = signSession({ mobile: MOBILE, shopId: SHOP, authVersion: undefined as unknown as number }, { now: new Date(), secret });
      expect(await readSession(request(`dd_session=${invalid}`), ctx)).toBeNull();
      if (store instanceof SqliteStore) store.close();
    });
  });
}

it("migrates legacy owner rows and preserves revocation through SQLite reopen", async () => {
  const file = path.join(dir, "legacy.sqlite");
  const { DatabaseSync } = process.getBuiltinModule("node:sqlite")!;
  const legacy = new DatabaseSync(file);
  legacy.exec("create table owners (shop_id text primary key, name text not null, mobile text not null, passcode_hash text not null, created_at text not null)");
  legacy.prepare("insert into owners values (?, ?, ?, ?, ?)").run(SHOP, "Owner", MOBILE, "legacy-hash", new Date().toISOString());
  legacy.close();
  const migrated = new SqliteStore(file, { seedDemo: false });
  expect(await migrated.getOwner(SHOP)).toMatchObject({ authVersion: 0, passcodeHash: "legacy-hash" });
  await migrated.revokeOwnerSessions(SHOP);
  migrated.close();
  const reopened = new SqliteStore(file, { seedDemo: false });
  expect(await reopened.getOwner(SHOP)).toMatchObject({ authVersion: 1, passcodeHash: "legacy-hash" });
  reopened.close();
});
