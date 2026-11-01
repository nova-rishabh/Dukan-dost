import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { GET as meGet } from "@/app/api/auth/me/route";
import { POST as loginPost } from "@/app/api/auth/login/route";
import { POST as logoutPost } from "@/app/api/auth/logout/route";
import { POST as passcodePost } from "@/app/api/auth/passcode/route";
import { POST as setupPost } from "@/app/api/auth/setup/route";
import { GET as captchaGet } from "@/app/api/auth/wa/captcha/route";
import { POST as waSendPost } from "@/app/api/auth/wa/send/route";
import { POST as waVerifyPost } from "@/app/api/auth/wa/verify/route";
import { POST as customersPost } from "@/app/api/customers/route";
import { POST as entriesPost } from "@/app/api/entries/route";
import { POST as interpretPost } from "@/app/api/interpret/route";
import { POST as remindPost } from "@/app/api/remind/route";
import { POST as sendPost } from "@/app/api/remind/send/route";
import { GET as summaryGet } from "@/app/api/summary/route";
import { GET as waStatusGet } from "@/app/api/wa/status/route";
import { resetRateLimits } from "@/server/http";
import { startTestDaemon } from "../helpers/waDaemon";

const TEN = ["70000", "00001"].join("");
const OWNER = `+91${TEN}`;
const CUSTOMER_PHONE = `+91${["70000", "00077"].join("")}`;
const PASS = "kirana-khata-2026";
const SETUP = "setup-code-for-tests";
const g = globalThis as unknown as { __dukaan?: unknown };
const saved = { ...process.env };

let daemon: Awaited<ReturnType<typeof startTestDaemon>>;
beforeAll(async () => {
  daemon = await startTestDaemon();
});
afterAll(() => {
  daemon.close();
  process.env = { ...saved };
});
beforeEach(() => {
  g.__dukaan = undefined;
  resetRateLimits();
  daemon.sent.length = 0;
  Object.assign(process.env, {
    DUKAAN_DB_FILE: ":memory:",
    PROPOSAL_SECRET: "route-test-secret-route-test-secret",
    SETUP_CODE: SETUP,
    WA_SERVICE_URL: daemon.cfg.baseUrl,
    WA_APP_KEY: daemon.cfg.appKey,
    WA_APP_SECRET: daemon.cfg.appSecret,
    NEXT_PUBLIC_APP_URL: "http://localhost:3000",
  });
});

const json = (url: string, body: unknown, cookie?: string) =>
  new Request(`http://localhost${url}`, { method: "POST", headers: { "content-type": "application/json", ...(cookie ? { cookie } : {}) }, body: JSON.stringify(body) });
const get = (url: string, cookie?: string) => new Request(`http://localhost${url}`, { headers: cookie ? { cookie } : {} });
const cookieOf = (res: Response) => (res.headers.get("set-cookie") ?? "").split(";")[0];

const SETUP_BODY = { setupCode: SETUP, shopName: "Meri Dukaan", name: "Ramesh", mobile: TEN, passcode: PASS };
async function setupShop() {
  const res = await setupPost(json("/api/auth/setup", SETUP_BODY));
  expect(res.status).toBe(200);
  return cookieOf(res);
}

describe("first-run setup", () => {
  it("is needed first, and the app refuses everything else until it is done", async () => {
    const me = await (await meGet(get("/api/auth/me"))).json();
    expect(me).toMatchObject({ authRequired: true, setupNeeded: true, loggedIn: false, waLogin: true });
    const r = await summaryGet(get("/api/summary"));
    expect(r.status).toBe(401);
    expect((await r.json()).error.code).toBe("setup_required");
  });

  it("needs the setup code, locks after repeated wrong codes, and refuses weak passcodes", async () => {
    const wrong = await setupPost(json("/api/auth/setup", { ...SETUP_BODY, setupCode: "nope" }));
    expect(wrong.status).toBe(403);
    expect((await meGet(get("/api/auth/me")).then((r) => r.json())).setupNeeded).toBe(true);
    for (let i = 0; i < 4; i++) await setupPost(json("/api/auth/setup", { ...SETUP_BODY, setupCode: `nope${i}` }));
    expect((await setupPost(json("/api/auth/setup", SETUP_BODY))).status).toBe(429);
    g.__dukaan = undefined;
    resetRateLimits();
    expect((await setupPost(json("/api/auth/setup", { ...SETUP_BODY, passcode: "short" }))).status).toBe(400);
  });

  it("creates the owner once, signs them in with an HttpOnly cookie, and refuses a second setup", async () => {
    const res = await setupPost(json("/api/auth/setup", SETUP_BODY));
    expect(res.status).toBe(200);
    const raw = res.headers.get("set-cookie") ?? "";
    expect(raw).toMatch(/^dd_session=/);
    expect(raw).toContain("HttpOnly");
    expect(raw).toContain("SameSite=Lax");
    const again = await setupPost(json("/api/auth/setup", { ...SETUP_BODY, name: "Mallory" }));
    expect(again.status).toBe(409);
  });
});

describe("protection", () => {
  it("lets the owner in with the cookie and keeps everyone else out", async () => {
    const cookie = await setupShop();
    expect((await summaryGet(get("/api/summary", cookie))).status).toBe(200);
    const anon = await summaryGet(get("/api/summary"));
    expect(anon.status).toBe(401);
    expect((await anon.json()).error.code).toBe("auth_required");
    expect((await summaryGet(get("/api/summary", `${cookie.slice(0, -4)}AAAA`))).status).toBe(401);
    expect((await customersPost(json("/api/customers", { name: "Raju" }))).status).toBe(401);
    expect((await waStatusGet(get("/api/wa/status"))).status).toBe(401);
    const me = await (await meGet(get("/api/auth/me", cookie))).json();
    expect(me).toMatchObject({ loggedIn: true, setupNeeded: false, owner: { name: "Ramesh" }, isDemoShop: false });
  });

  it("logout clears the cookie", async () => {
    const res = await logoutPost(json("/api/auth/logout", {}));
    expect(res.headers.get("set-cookie")).toContain("Max-Age=0");
  });
});

describe("passcode login", () => {
  it("accepts the right passcode, gives one generic error for anything wrong, and locks after five", async () => {
    await setupShop();
    const ok = await loginPost(json("/api/auth/login", { mobile: TEN, passcode: PASS }));
    expect(ok.status).toBe(200);
    expect(cookieOf(ok)).toMatch(/^dd_session=/);
    const wrong = await loginPost(json("/api/auth/login", { mobile: TEN, passcode: "wrong-passcode-1" }));
    const stranger = await loginPost(json("/api/auth/login", { mobile: `+91${["70000", "00002"].join("")}`, passcode: PASS }));
    expect(wrong.status).toBe(401);
    expect((await wrong.json()).error.message).toBe((await stranger.json()).error.message);
    for (let i = 0; i < 4; i++) await loginPost(json("/api/auth/login", { mobile: TEN, passcode: `wrong-passcode-${i}` }));
    const locked = await loginPost(json("/api/auth/login", { mobile: TEN, passcode: PASS }));
    expect(locked.status).toBe(429);
  });

  it("changes the passcode only with the current one", async () => {
    const cookie = await setupShop();
    expect((await passcodePost(json("/api/auth/passcode", { current: "wrong-passcode-1", next: "brand-new-passcode-9" }, cookie))).status).toBe(401);
    expect((await passcodePost(json("/api/auth/passcode", { current: PASS, next: "brand-new-passcode-9" }, cookie))).status).toBe(200);
    expect((await loginPost(json("/api/auth/login", { mobile: TEN, passcode: PASS }))).status).toBe(401);
    expect((await loginPost(json("/api/auth/login", { mobile: TEN, passcode: "brand-new-passcode-9" }))).status).toBe(200);
  });
});

describe("WhatsApp code login (real daemon code)", () => {
  async function codeFlow(mobile: string) {
    const cap = await (await captchaGet(get("/api/auth/wa/captcha"))).json();
    expect(cap.svg).toContain("<svg");
    const sent = await waSendPost(json("/api/auth/wa/send", { mobile, captchaId: cap.captchaId, captchaCode: daemon.solve(cap.captchaId) }));
    return sent;
  }

  it("logs the owner in with the code and lets them set a new passcode without the old one", async () => {
    await setupShop();
    await new Promise((r) => setTimeout(r, 1100));
    const sent = await codeFlow(TEN);
    expect(sent.status).toBe(200);
    expect(daemon.sent[0].to).toBe(OWNER);
    const verify = await waVerifyPost(json("/api/auth/wa/verify", { mobile: TEN, code: daemon.lastCode() }));
    expect(verify.status).toBe(200);
    const cookie = cookieOf(verify);
    expect((await summaryGet(get("/api/summary", cookie))).status).toBe(200);
    expect((await passcodePost(json("/api/auth/passcode", { next: "brand-new-passcode-9" }, cookie))).status).toBe(200);
    expect((await loginPost(json("/api/auth/login", { mobile: TEN, passcode: "brand-new-passcode-9" }))).status).toBe(200);
  });

  it("a passcode session cannot skip the current passcode", async () => {
    const cookie = await setupShop();
    expect((await passcodePost(json("/api/auth/passcode", { next: "brand-new-passcode-9" }, cookie))).status).toBe(401);
  });

  it("sends nothing for a number that is not the owner, and refuses a wrong code", async () => {
    await setupShop();
    await new Promise((r) => setTimeout(r, 1100));
    expect((await codeFlow(`+91${["70000", "00002"].join("")}`)).status).toBe(200);
    expect(daemon.sent).toHaveLength(0);
    expect((await waVerifyPost(json("/api/auth/wa/verify", { mobile: TEN, code: "123456" }))).status).toBe(401);
  });
});

describe("reminders go out only when the owner sends them", () => {
  async function customerWithBalance(cookie: string) {
    const made = await (await customersPost(json("/api/customers", { name: "Raju" }, cookie))).json();
    const prop = await (await interpretPost(json("/api/interpret", { text: "Raju ko 250 udhaar diye", source: "text" }, cookie))).json();
    const w = await entriesPost(
      json("/api/entries", { proposalToken: prop.proposal.token, intentIndex: 0, confirmed: true, resolutions: [], customerId: made.customer.id, type: "credit_given", amountPaise: 25000, source: "text", idempotencyKey: "route-send-key-1" }, cookie),
    );
    expect(w.status).toBe(200);
    const draft = await (await remindPost(json("/api/remind", { customerId: made.customer.id }, cookie))).json();
    return { id: made.customer.id as string, draft };
  }

  it("sends the owner's confirmed text through the paired phone and records it without the number", async () => {
    const cookie = await setupShop();
    const { id, draft } = await customerWithBalance(cookie);
    const res = await sendPost(json("/api/remind/send", { confirmed: true, customerId: id, phone: CUSTOMER_PHONE, text: draft.text, payUrl: draft.payUrl }, cookie));
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ sent: true, simulated: false });
    expect(daemon.sent).toHaveLength(1);
    expect(daemon.sent[0]).toEqual({ to: CUSTOMER_PHONE, text: draft.text });
    expect(draft.text).toContain("₹250");
  });

  it("refuses without confirmation, without login, for another customer, or with text that has no pay link", async () => {
    const cookie = await setupShop();
    const { id, draft } = await customerWithBalance(cookie);
    const base = { confirmed: true, customerId: id, phone: CUSTOMER_PHONE, text: draft.text, payUrl: draft.payUrl };
    expect((await sendPost(json("/api/remind/send", { ...base, confirmed: false }, cookie))).status).toBe(400);
    expect((await sendPost(json("/api/remind/send", base))).status).toBe(401);
    expect((await sendPost(json("/api/remind/send", { ...base, customerId: "someone-else" }, cookie))).status).toBe(400);
    expect((await sendPost(json("/api/remind/send", { ...base, text: "Free recharge, click here" }, cookie))).status).toBe(400);
    expect((await sendPost(json("/api/remind/send", { ...base, phone: "abc" }, cookie))).status).toBe(400);
    expect(daemon.sent).toHaveLength(0);
  });

  it("reports WhatsApp status to the owner", async () => {
    const cookie = await setupShop();
    const st = await (await waStatusGet(get("/api/wa/status", cookie))).json();
    expect(st).toMatchObject({ configured: true, reachable: true, whatsapp: "CONNECTED" });
  });
});
