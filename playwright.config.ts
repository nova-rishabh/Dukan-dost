import { defineConfig, devices } from "@playwright/test";

const PORT = 3100;
const REAL_PORT = 3102;

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
      env: { DUKAAN_DATA_FILE: ".data/e2e-ledger.json", DEMO_RESET_ON_BOOT: "1", NEXT_PUBLIC_APP_URL: `http://localhost:${PORT}` },
    },
    {
      // a real (non-demo) empty shop on a SQLite database, held in memory so each run starts clean
      command: `pnpm exec next start -p ${REAL_PORT}`,
      port: REAL_PORT,
      reuseExistingServer: false,
      timeout: 120000,
      env: {
        DUKAAN_DB_FILE: ":memory:",
        DUKAAN_SHOP_NAME: "Test Dukaan",
        PROPOSAL_SECRET: "e2e-real-shop-secret-e2e-real-shop-secret",
        NEXT_PUBLIC_APP_URL: `http://localhost:${REAL_PORT}`,
      },
    },
  ],
});
