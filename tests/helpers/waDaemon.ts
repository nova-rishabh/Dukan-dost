import { mkdtempSync, rmSync } from "node:fs";
import type { AddressInfo } from "node:net";
import { tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import type { WaConfig } from "@/lib/waService";

/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Runs the REAL WA-USERAUTH daemon code (services/wa-userauth) in-process on an ephemeral port.
 * Only the WhatsApp socket is replaced by a stand-in that records messages, so no WhatsApp is touched.
 */
export async function startTestDaemon(opts: { connected?: boolean } = {}) {
  const src = path.resolve(import.meta.dirname, "..", "..", "services", "wa-userauth", "src");
  const load = (p: string): Promise<any> => import(/* @vite-ignore */ pathToFileURL(path.join(src, p)).href);
  const [{ createApp }, { UserStore }, { RateLimitStore }, { RateLimiter }, { TemplateStore }, { CaptchaVerifier }, { OtpChallengeManager }, { MessageTransport }, { AuthResultTokenManager }, { config }] =
    await Promise.all([
      load("server.js"),
      load("storage/userStore.js"),
      load("storage/rateLimitStore.js"),
      load("security/rateLimiter.js"),
      load("storage/templateStore.js"),
      load("security/captcha.js"),
      load("security/otp.js"),
      load("messaging/transport.js"),
      load("security/token.js"),
      load("config.js"),
    ]);

  const dir = mkdtempSync(path.join(tmpdir(), "wa-daemon-"));
  const userStore = new UserStore(path.join(dir, "users.json"));
  userStore.load();
  const rateLimitStore = new RateLimitStore(path.join(dir, "rate_limits.json"));
  rateLimitStore.load();
  const templateStore = new TemplateStore(path.join(dir, "template.json"));
  templateStore.load();

  const sent: Array<{ to: string; text: string }> = [];
  const adapter = {
    getStatus: () => (opts.connected === false ? "DISCONNECTED" : "CONNECTED"),
    getClientInfo: () => ({}),
    sendMessage: async (to: string, text: string) => {
      if (opts.connected === false) return { success: false, delivered: false, error: "WhatsApp device is not paired or connected.", status: "DISCONNECTED" };
      sent.push({ to, text });
      return { success: true, delivered: true, id: `test-${sent.length}` };
    },
  };
  const captchaVerifier = new CaptchaVerifier({ provider: "mock", nodeEnv: "production" });
  const [appKey, appSecret] = [...config.allowedApps.entries()][0] as [string, string];

  const app = createApp({
    userStore,
    rateLimitStore,
    rateLimiter: new RateLimiter(rateLimitStore, { minIntervalSeconds: 1 }),
    templateStore,
    captchaVerifier,
    challengeManager: new OtpChallengeManager(),
    messageTransport: new MessageTransport(adapter, templateStore),
    tokenManager: new AuthResultTokenManager(),
    adapter,
    maxPerMinute: 50,
  });
  const server: any = await new Promise((resolve) => {
    const s = app.listen(0, "127.0.0.1", () => resolve(s));
  });
  const cfg: WaConfig = { baseUrl: `http://127.0.0.1:${(server.address() as AddressInfo).port}`, appKey, appSecret };

  return {
    cfg,
    sent,
    /** the answer to a CAPTCHA the daemon just issued (only possible because the verifier runs in-process) */
    solve: (captchaId: string): string => captchaVerifier.alphanumericChallenges.get(captchaId).code as string,
    lastCode: (): string | null => {
      for (let i = sent.length - 1; i >= 0; i--) {
        const m = sent[i].text.match(/\b(\d{6})\b/);
        if (m) return m[1];
      }
      return null;
    },
    close: () => {
      server.close();
      rmSync(dir, { recursive: true, force: true });
    },
  };
}
