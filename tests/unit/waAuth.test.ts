import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { AuthError, setupOwner } from "@/lib/auth";
import { SqliteStore } from "@/lib/store/sqlite";
import { confirmWaCode, requestWaCode } from "@/lib/waAuth";
import { waCaptcha, waConfigFromEnv, waHealth, waSendMessage } from "@/lib/waService";
import { startTestDaemon } from "../helpers/waDaemon";

const TEN = ["70000", "00001"].join("");
const OWNER = `+91${TEN}`;
const STRANGER = `+91${["70000", "00002"].join("")}`;
const SHOP = "00000000-0000-4000-8000-000000000001";
const NOW = new Date("2026-11-01T10:00:00Z");

let daemon: Awaited<ReturnType<typeof startTestDaemon>>;
beforeAll(async () => {
  daemon = await startTestDaemon();
});
afterAll(() => daemon.close());

async function shop() {
  const s = new SqliteStore(":memory:", { seedDemo: false });
  await setupOwner(s, { shopId: SHOP, shopName: "Meri Dukaan", upiVpa: "", name: "Ramesh", mobile: TEN, passcode: "kirana-khata-2026", now: NOW });
  return s;
}
async function solved() {
  const c = await waCaptcha(daemon.cfg);
  return { captchaId: c.captchaId, captchaCode: daemon.solve(c.captchaId) };
}

describe("WhatsApp code login through the real daemon code", () => {
  beforeEach(async () => {
    daemon.sent.length = 0;
    // the daemon enforces a minimum gap between codes to the same number (the test harness sets 1 second)
    await new Promise((r) => setTimeout(r, 1100));
  });

  it("reports the daemon's health and WhatsApp status", async () => {
    expect(await waHealth(daemon.cfg)).toEqual({ reachable: true, whatsapp: "CONNECTED" });
    expect(await waHealth({ ...daemon.cfg, baseUrl: "http://127.0.0.1:1" })).toEqual({ reachable: false, whatsapp: "UNREACHABLE" });
  });

  it("sends a code to the owner, and the code logs them in exactly once", async () => {
    const s = await shop();
    const cap = await solved();
    expect(await requestWaCode(s, daemon.cfg, { shopId: SHOP, mobile: TEN, ...cap, ip: "203.0.113.5" })).toEqual({ sent: true });
    expect(daemon.sent).toHaveLength(1);
    expect(daemon.sent[0].to).toBe(OWNER);
    const code = daemon.lastCode()!;
    expect(code).toMatch(/^\d{6}$/);
    const owner = await confirmWaCode(s, daemon.cfg, { shopId: SHOP, mobile: TEN, code });
    expect(owner).toEqual({ shopId: SHOP, name: "Ramesh", mobile: OWNER });
    await expect(confirmWaCode(s, daemon.cfg, { shopId: SHOP, mobile: TEN, code })).rejects.toMatchObject({ code: "bad_code" });
  });

  it("sends nothing to a number that is not the owner, and answers the same", async () => {
    const s = await shop();
    const cap = await solved();
    expect(await requestWaCode(s, daemon.cfg, { shopId: SHOP, mobile: STRANGER, ...cap, ip: "203.0.113.6" })).toEqual({ sent: true });
    expect(daemon.sent).toHaveLength(0);
    await expect(confirmWaCode(s, daemon.cfg, { shopId: SHOP, mobile: STRANGER, code: "123456" })).rejects.toMatchObject({ code: "bad_code" });
  });

  it("refuses a wrong CAPTCHA before any code is sent", async () => {
    const s = await shop();
    const c = await waCaptcha(daemon.cfg);
    const wrong = daemon.solve(c.captchaId) === "AAAAA" ? "BBBBB" : "AAAAA";
    await expect(requestWaCode(s, daemon.cfg, { shopId: SHOP, mobile: TEN, captchaId: c.captchaId, captchaCode: wrong, ip: "203.0.113.7" })).rejects.toMatchObject({ code: "captcha_failed" });
    expect(daemon.sent).toHaveLength(0);
  });

  it("refuses a wrong code", async () => {
    const s = await shop();
    await requestWaCode(s, daemon.cfg, { shopId: SHOP, mobile: TEN, ...(await solved()), ip: "203.0.113.8" });
    const real = daemon.lastCode()!;
    const wrong = real === "000000" ? "111111" : "000000";
    await expect(confirmWaCode(s, daemon.cfg, { shopId: SHOP, mobile: TEN, code: wrong })).rejects.toBeInstanceOf(AuthError);
  });

  it("rejects non-digit codes without calling the daemon", async () => {
    const s = await shop();
    await expect(confirmWaCode(s, daemon.cfg, { shopId: SHOP, mobile: TEN, code: "abcdef" })).rejects.toMatchObject({ code: "bad_code" });
  });
});

describe("sending a message through the daemon", () => {
  it("delivers text to the paired device and reports whether it was simulated", async () => {
    daemon.sent.length = 0;
    const r = await waSendMessage(daemon.cfg, { to: OWNER, text: "Namaste Gupta ji" });
    expect(r).toEqual({ id: "test-1", simulated: false });
    expect(daemon.sent[0]).toEqual({ to: OWNER, text: "Namaste Gupta ji" });
  });

  it("refuses wrong app credentials and sends nothing", async () => {
    daemon.sent.length = 0;
    await expect(waSendMessage({ ...daemon.cfg, appSecret: "not-the-secret" }, { to: OWNER, text: "x" })).rejects.toBeInstanceOf(AuthError);
    expect(daemon.sent).toHaveLength(0);
  });

  it("says so plainly when the daemon is down or WhatsApp is not paired", async () => {
    await expect(waSendMessage({ ...daemon.cfg, baseUrl: "http://127.0.0.1:1" }, { to: OWNER, text: "x" })).rejects.toMatchObject({ code: "wa_unavailable" });
    const unpaired = await startTestDaemon({ connected: false });
    await expect(waSendMessage(unpaired.cfg, { to: OWNER, text: "x" })).rejects.toMatchObject({ code: "wa_unavailable" });
    unpaired.close();
  });
});

describe("daemon configuration", () => {
  it("is only on when the url, key and secret are all present", () => {
    expect(waConfigFromEnv({})).toBeNull();
    expect(waConfigFromEnv({ WA_SERVICE_URL: "http://127.0.0.1:3001/", WA_APP_KEY: "k" })).toBeNull();
    expect(waConfigFromEnv({ WA_SERVICE_URL: "http://127.0.0.1:3001/", WA_APP_KEY: "k", WA_APP_SECRET: "s" })).toEqual({ baseUrl: "http://127.0.0.1:3001", appKey: "k", appSecret: "s" });
  });
});
