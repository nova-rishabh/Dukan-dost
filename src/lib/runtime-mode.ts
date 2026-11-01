/** Explicit production intent prevents a missing DB setting silently opening the demo. */
export function validateRuntimeMode(env: Record<string, string | undefined>) {
  const mode = env.DUKAAN_MODE;
  if (mode && mode !== "shop" && mode !== "demo") throw new Error("DUKAAN_MODE must be shop or demo.");
  if (mode === "demo" && env.DUKAAN_DB_FILE?.trim()) throw new Error("Demo mode must not open a real shop database.");
  if ((mode === "shop" || (env.NODE_ENV === "production" && mode !== "demo")) && (!env.DUKAAN_DB_FILE?.trim() || env.DUKAAN_DB_FILE === ":memory:")) {
    // The explicit in-memory override belongs only to isolated test servers.
    if (!(env.DUKAAN_TEST_MEMORY === "1" && env.DUKAAN_DB_FILE === ":memory:")) throw new Error("A durable DUKAAN_DB_FILE is required for a shop. Use DUKAAN_MODE=demo only for fictional data.");
  }
}
