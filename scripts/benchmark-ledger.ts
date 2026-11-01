import { mkdirSync, writeFileSync } from "node:fs";
import { performance } from "node:perf_hooks";
import { SqliteStore } from "../src/lib/store/sqlite";
import { getSummary } from "../src/lib/ledger";
import { statement, reportingPeriod } from "../src/lib/reporting";

/** Reproducible synthetic volume check; never loads .env or the operator's database. */
const store = new SqliteStore(":memory:", { seedDemo: false });
try {
  const shopId = "synthetic-benchmark";
  await store.createShop({ id: shopId, name: "Fictional benchmark", isDemo: true, upiVpa: "sample@invalid" });
  const people: Array<{ id: string }> = [];
  for (let i = 0; i < 1000; i++) people.push(await store.createCustomer({ shopId, name: `Fictional ${i}`, nameRoman: `fictional ${i}`, aliases: [] }));
  for (let i = 0; i < 20000; i++) await store.insertEntry({ shopId, customerId: people[i % people.length].id, type: i % 3 === 0 ? "payment_received" : "credit_given", amountPaise: 10000 + i % 100, source: "text", sourceText: "Synthetic confirmed entry", idempotencyKey: `synthetic-${i}`, confirmedAt: new Date(Date.UTC(2026, 0, 1) + i * 60000).toISOString() });
  const timings: number[] = [];
  for (let i = 0; i < 20; i++) { const start = performance.now(); await getSummary(store, shopId); timings.push(performance.now() - start); }
  const entries = await store.listEntries(shopId);
  const started = performance.now();
  const report = statement(entries.filter((e) => e.customerId === people[0].id), reportingPeriod("2026-01-01", "2026-01-31"));
  const statementMs = performance.now() - started;
  const sorted = [...timings].sort((a, b) => a - b);
  const result = { environment: "local synthetic in-memory SQLite; no network/production capacity claim", customers: 1000, entries: entries.length, summaryRuns: timings.length, summaryP50Ms: sorted[9], summaryP95Ms: sorted[18], summaryMaxMs: sorted[19], statementMs, statementRows: report.rows.length };
  mkdirSync(".goal", { recursive: true }); writeFileSync(".goal/benchmark-ledger.json", JSON.stringify(result, null, 2));
  console.log(JSON.stringify(result, null, 2));
} finally { store.close(); }
