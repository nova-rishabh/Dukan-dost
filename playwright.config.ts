import { defineConfig, devices } from "@playwright/test";

const PORT = 3100;

export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [["list"]],
  use: { baseURL: `http://localhost:${PORT}`, ...devices["Pixel 7"] },
  webServer: {
    command: `pnpm exec next start -p ${PORT}`,
    port: PORT,
    reuseExistingServer: false,
    timeout: 120000,
    env: { DUKAAN_DATA_FILE: ".data/e2e-ledger.json", DEMO_RESET_ON_BOOT: "1", NEXT_PUBLIC_APP_URL: `http://localhost:${PORT}` },
  },
});
