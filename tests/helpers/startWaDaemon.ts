import { startTestDaemon } from "./waDaemon";

/** Started by Playwright for the browser tests: the real daemon code on a fixed port, with /__test/* helpers. */
const port = Number(process.env.WA_TEST_PORT ?? 3201);
const d = await startTestDaemon({ port, expose: true, appKey: "e2e_app", appSecret: "e2e_secret_value_for_tests_only_0123456789" });
console.log(`test WhatsApp daemon on http://127.0.0.1:${port}`);
process.on("SIGTERM", () => {
  d.close();
  process.exit(0);
});
