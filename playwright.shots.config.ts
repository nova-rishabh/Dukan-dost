import { defineConfig } from "@playwright/test";

const PORT = 3101;

export default defineConfig({
  testDir: "tests/shots",
  workers: 1,
  reporter: [["list"]],
  use: { baseURL: `http://localhost:${PORT}` },
  webServer: {
    command: `pnpm exec next start -p ${PORT}`,
    port: PORT,
    reuseExistingServer: false,
    timeout: 120000,
    env: { DUKAAN_DATA_FILE: ".data/shots-ledger.json", DEMO_RESET_ON_BOOT: "1", NEXT_PUBLIC_APP_URL: `http://localhost:${PORT}` },
  },
});
