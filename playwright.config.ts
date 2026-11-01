import { defineConfig, devices } from "@playwright/test";

const PORT = 3100;
const REAL_PORT = 3102;
const WA_PORT = 3201;

/**
 * Test servers must not pick up the owner's real .env (Next loads it): blank every service variable so
 * the demo server stays a keyless demo and no test ever calls ElevenLabs, Gemini or a real WhatsApp.
 */
const HERMETIC = {
  DUKAAN_MODE: "demo",
  APP_PUBLIC_URL: "",
  ELEVENLABS_API_KEY: "",
  GEMINI_API_KEY: "",
  DUKAAN_DB_FILE: "",
  PROPOSAL_SECRET: "",
  SETUP_CODE: "",
  WA_SERVICE_URL: "",
  WA_APP_KEY: "",
  WA_APP_SECRET: "",
  DEMO_UPI_VPA: "",
  DEMO_SHOP_ID: "",
};

export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [["list"]],
  use: { baseURL: `http://localhost:${PORT}`, ...devices["Pixel 7"] },
  webServer: [
    {
      // the keyless demo shop
      command: `pnpm exec next start -p ${PORT}`,
      port: PORT,
      reuseExistingServer: false,
      timeout: 120000,
      env: { ...HERMETIC, DUKAAN_DATA_FILE: ".data/e2e-ledger.json", DEMO_RESET_ON_BOOT: "1", APP_PUBLIC_URL: `http://localhost:${PORT}`, NEXT_PUBLIC_APP_URL: `http://localhost:${PORT}` },
    },
    {
      // the real WA-USERAUTH daemon code with a recording stand-in for the WhatsApp socket
      command: "pnpm exec tsx tests/helpers/startWaDaemon.ts",
      port: WA_PORT,
      reuseExistingServer: false,
      timeout: 60000,
      env: { WA_TEST_PORT: String(WA_PORT) },
    },
    {
      // a real (non-demo) shop on an in-memory SQLite database: needs setup, then login
      command: `pnpm exec next start -p ${REAL_PORT}`,
      port: REAL_PORT,
      reuseExistingServer: false,
      timeout: 120000,
      env: {
        ...HERMETIC,
        DUKAAN_MODE: "shop",
        DUKAAN_TEST_MEMORY: "1",
        DUKAAN_DB_FILE: ":memory:",
        PROPOSAL_SECRET: "e2e-real-shop-secret-e2e-real-shop-secret",
        SETUP_CODE: "e2e-setup-code",
        WA_SERVICE_URL: `http://127.0.0.1:${WA_PORT}`,
        WA_APP_KEY: "e2e_app",
        WA_APP_SECRET: "e2e_secret_value_for_tests_only_0123456789",
        APP_PUBLIC_URL: `http://localhost:${REAL_PORT}`,
        NEXT_PUBLIC_APP_URL: `http://localhost:${REAL_PORT}`,
      },
    },
  ],
});
