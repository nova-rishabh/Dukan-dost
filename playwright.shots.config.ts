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
    env: {
      // never pick up the owner's real .env
      ELEVENLABS_API_KEY: "", GEMINI_API_KEY: "", DUKAAN_DB_FILE: "", PROPOSAL_SECRET: "", WA_SERVICE_URL: "", WA_APP_KEY: "", WA_APP_SECRET: "", DEMO_UPI_VPA: "", DEMO_SHOP_ID: "",
      DUKAAN_DATA_FILE: ".data/shots-ledger.json", DEMO_RESET_ON_BOOT: "1", NEXT_PUBLIC_APP_URL: `http://localhost:${PORT}`,
    },
  },
});
