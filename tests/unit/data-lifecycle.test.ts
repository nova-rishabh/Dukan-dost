import { afterEach, describe, expect, it } from "vitest";
import { LocalStore } from "@/lib/store/local";
import { SqliteStore } from "@/lib/store/sqlite";
import { snapshotDigest, validateSnapshot } from "@/lib/shop-transfer";
import type { LedgerStore } from "@/lib/store/types";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
const dirs: string[] = []; const opened: SqliteStore[] = [];
afterEach(() => { for (const db of opened.splice(0)) db.close(); for (const dir of dirs.splice(0)) rmSync(dir,{recursive:true,force:true}); });
for (const kind of ["local", "sqlite"] as const) describe(kind, () => {
  async function setup() { const store: LedgerStore = kind === "local" ? new LocalStore({ file: null }) : new SqliteStore(":memory:"); if (store instanceof SqliteStore) opened.push(store); for (const id of ["source","target","other"]) { await store.createShop({id,name:id,upiVpa:"sample@invalid",isDemo:false}); await store.createOwner({shopId:id,name:"Fictional owner",mobile:`+91${["70000",id === "source" ? "01001" : id === "target" ? "01002" : "01003"].join("")}`,passcodeHash:"never-export-me",authVersion:0,createdAt:new Date().toISOString()}); } return store; }
  it("exports no credentials or phone, imports with remapped IDs once, and preserves other shops", async () => {
    const store = await setup();
    const c = await store.createCustomer({shopId:"source",name:"Fictional customer",nameRoman:"fictional customer",aliases:["Counter name"],phoneE164:`+91${["70000","01077"].join("")}`});
    await store.insertEntry({shopId:"source",customerId:c.id,type:"credit_given",amountPaise:1050,sourceText:"Confirmed credit",source:"text",idempotencyKey:"test-source-entry",confirmedAt:new Date().toISOString()});
    const p = await store.createProduct({shopId:"source",name:"Rice",unit:"kg",lowThresholdMinor:100,onHandMinor:null});
    await store.applyMovement({shopId:"source",productId:p.id,kind:"opening",quantityMinor:1505,reason:"Counted",idempotencyKey:"opening-source-stock",expectedVersion:0,createdAt:new Date().toISOString()});
    const snapshot = await store.exportBusiness("source"); const json = JSON.stringify(snapshot);
    expect(json).not.toContain("never-export-me"); expect(json).not.toContain("phoneE164"); expect(json).not.toContain("shopId"); expect(json).not.toContain("idempotencyKey");
    const fingerprint = snapshotDigest(await store.exportBusiness("target"));
    expect(await store.importBusiness("target", snapshot, fingerprint)).toMatchObject({created:true,customers:1,entries:1,products:1});
    expect(await store.importBusiness("target", snapshot, fingerprint)).toMatchObject({created:false});
    const [customer] = await store.listCustomers("target"); expect(customer.id).not.toBe(c.id); expect(customer.aliases).toEqual(["Counter name"]); expect(customer.phoneE164).toBeUndefined();
    expect((await store.listEntries("target"))[0]).toMatchObject({customerId:customer.id,amountPaise:1050});
    expect((await store.listProducts("target"))[0].onHandMinor).toBe(1505);
    expect(await store.listCustomers("other")).toHaveLength(0);
  });
  it("rejects malformed references and stale preview without partial mutation", async () => {
    const store = await setup(); const snapshot = await store.exportBusiness("source");
    const c = await store.createCustomer({shopId:"target",name:"New record",nameRoman:"new record",aliases:[]});
    expect(c).toBeTruthy();
    await expect(store.importBusiness("target",snapshot,"stale")).rejects.toThrow("import_conflict");
    expect(await store.listCustomers("target")).toHaveLength(1);
    expect(() => validateSnapshot({...snapshot,entries:[{id:"invalid",customerId:"missing",type:"credit_given",amountPaise:100,sourceText:"record",source:"text",confirmedAt:new Date().toISOString()}]})).toThrow();
    expect(() => validateSnapshot({...snapshot,passcodeHash:"injected"})).toThrow();
  });
  it("scopes account closure and removes old tokens and proofs", async () => {
    const store = await setup(); const c = await store.createCustomer({shopId:"source",name:"Fictional",nameRoman:"fictional",aliases:[]});
    await store.savePayToken({shopId:"source",customerId:c.id,token:"private-token",amountPaise:100,expiresAt:new Date(Date.now()+60000).toISOString()});
    const owner = await store.getOwner("source"); await store.createRegistration({id:"pending-proof",mobile:owner!.mobile,browserHash:"hidden",purpose:"recovery",state:"requested",expiresAt:new Date(Date.now()+60000).toISOString()});
    await store.closeShop("source",0);
    expect(await store.getOwner("source")).toBeNull(); expect(await store.getShop("source")).toBeNull(); expect(await store.getPayToken("private-token")).toBeNull(); expect(await store.getRegistration("pending-proof")).toBeNull(); expect(await store.getOwner("other")).toBeTruthy();
  });
  it("refuses stale erasure after credential revocation without changing records", async () => {
    const store = await setup();
    const before = await store.listCustomers("source");
    await store.revokeOwnerSessions("source");
    await expect(store.eraseShop("source", 0)).rejects.toThrow("stale_owner");
    expect(await store.listCustomers("source")).toEqual(before);
    await store.eraseShop("source", 1);
    expect(await store.listCustomers("source")).toHaveLength(0);
    expect(await store.getOwner("source")).toBeTruthy();
    expect(await store.getOwner("other")).toBeTruthy();
  });
  it("limits atomically and releases a bucket at the window boundary", async () => {
    const store = await setup(); const results = await Promise.all(Array.from({length:7}, () => store.consumeRateLimit("hashed-key",3,60000,100000)));
    expect(results.filter((r) => r.allowed)).toHaveLength(3); expect(results[3].retryAfterMs).toBe(60000); expect((await store.consumeRateLimit("hashed-key",3,60000,160000)).allowed).toBe(true);
  });
});
it("SQLite abuse buckets survive a connection restart", async () => { const dir=mkdtempSync(path.join(tmpdir(),"dukaan-limits-"));dirs.push(dir);const file=path.join(dir,"db.sqlite");const first=new SqliteStore(file);expect((await first.consumeRateLimit("hashed-key",1,60000,100000)).allowed).toBe(true);first.close();const second=new SqliteStore(file);opened.push(second);expect((await second.consumeRateLimit("hashed-key",1,60000,100001)).allowed).toBe(false); });
