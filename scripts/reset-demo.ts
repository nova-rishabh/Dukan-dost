import { LocalStore } from "../src/lib/store/local";
import { loadEnv } from "./lib/util";

loadEnv();
const file = process.env.DUKAAN_DATA_FILE ?? ".data/ledger.json";
await new LocalStore({ file }).reset();
console.log(`Demo shop reset to the seeded state (${file}).`);
