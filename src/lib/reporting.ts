import type { Entry } from "./types";

/** Ledger dates are the dates recorded, in the shop's India time zone. */
export function reportingPeriod(from?: string | null, to?: string | null) {
  function boundary(value: string | null | undefined): number | undefined {
    if (!value) return undefined;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error("invalid_period");
    const utc = Date.parse(`${value}T00:00:00.000Z`);
    if (!Number.isFinite(utc) || new Date(utc).toISOString().slice(0, 10) !== value) throw new Error("invalid_period");
    return utc - 330 * 60_000;
  }
  const start = boundary(from);
  const end = boundary(to);
  if (start !== undefined && end !== undefined && start > end) throw new Error("invalid_period");
  return { start, end: end === undefined ? undefined : end + 86_400_000 };
}

export type Period = ReturnType<typeof reportingPeriod>;
export const entryDelta = (entry: Entry) => entry.voidedAt ? 0 : entry.type === "credit_given" ? entry.amountPaise : -entry.amountPaise;
export const inPeriod = (entry: Entry, period: Period) => {
  const at = Date.parse(entry.confirmedAt);
  return (period.start === undefined || at >= period.start) && (period.end === undefined || at < period.end);
};

export function statement(entries: Entry[], period: Period) {
  const sorted = [...entries].sort((a, b) => a.confirmedAt.localeCompare(b.confirmedAt) || a.id.localeCompare(b.id));
  const openingPaise = sorted.filter((e) => period.start !== undefined && Date.parse(e.confirmedAt) < period.start).reduce((n, e) => n + entryDelta(e), 0);
  let running = openingPaise;
  const rows = sorted.filter((e) => inPeriod(e, period)).map((e) => {
    running += entryDelta(e);
    return { ...e, runningPaise: running };
  });
  return { openingPaise, closingPaise: running, currentPaise: sorted.reduce((n, e) => n + entryDelta(e), 0), rows };
}

/** Neutralize spreadsheet formulas in user supplied text, then quote every field. */
export function csvCell(value: string | number) {
  const text = String(value);
  const safe = typeof value === "string" && /^[\s]*[=+@\-\t\r]/.test(text) ? `'${text}` : text;
  return `"${safe.replaceAll('"', '""')}"`;
}
