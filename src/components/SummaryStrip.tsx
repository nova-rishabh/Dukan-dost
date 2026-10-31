"use client";

import { api, type Summary } from "@/lib/client/api";
import { formatINR } from "@/lib/money";
import { CountUp } from "./CountUp";

export function SummaryStrip({ summary, onChanged }: { summary: Summary; onChanged: () => void }) {
  return (
    <section aria-label="Aaj ka hisaab" className="grid gap-3 md:grid-cols-3" data-testid="summary">
      <div className="sticker bg-sindoor p-4" style={{ background: "var(--sindoor)" }}>
        <h2 className="text-xl">Total udhaar</h2>
        <CountUp paise={summary.totalOutstandingPaise} className="text-[44px] leading-tight" />
        <p className="text-base">{summary.customerCount} customer</p>
      </div>
      <div className="sticker p-4">
        <h2 className="text-xl">Sabse jyada baaki</h2>
        {summary.topDebtors.length === 0 ? (
          <p>Kisi ka baaki nahi.</p>
        ) : (
          <ol className="mt-1 grid gap-1">
            {summary.topDebtors.map((d) => (
              <li key={d.customerId} className="flex justify-between gap-2">
                <span className="font-semibold">{d.name}</span>
                <span className="money">{formatINR(d.balancePaise)}</span>
              </li>
            ))}
          </ol>
        )}
      </div>
      <div className="sticker p-4" style={{ background: "var(--bahi-page)" }}>
        <h2 className="text-xl">Kam hai</h2>
        {summary.lowStock.length === 0 ? (
          <p>Abhi koi cheez kam nahi.</p>
        ) : (
          <ul className="mt-1 grid gap-2" data-testid="low-stock">
            {summary.lowStock.map((f) => (
              <li key={f.id} className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-semibold">
                  {f.itemName} <span className="ribbon bg-safed text-base">Kam hai</span>
                </span>
                <button
                  type="button"
                  className="btn"
                  onClick={async () => {
                    await api.resolveStock(f.id);
                    onChanged();
                  }}
                >
                  Mangwa liya
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
