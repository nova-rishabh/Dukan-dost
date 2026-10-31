"use client";

import { useState } from "react";
import { api, type LedgerRow } from "@/lib/client/api";
import { formatINR } from "@/lib/money";
import { CountUp } from "./CountUp";

const fmtDate = (iso: string) => new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: "Asia/Kolkata" });

/** The ledger page: cloth edge, two columns, entries in handwriting, running balance in the footer. */
export function BahiPage({ rows, balancePaise, onChanged }: { rows: LedgerRow[]; balancePaise: number; onChanged: () => void }) {
  const [asking, setAsking] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function hata(id: string) {
    setError(null);
    try {
      await api.voidEntry(id, "owner ne hataya");
      setAsking(null);
      onChanged();
    } catch {
      setError("Entry nahi hati. Dobara try karo.");
    }
  }

  return (
    <section className="bahi" aria-label="Khata page" data-testid="bahi">
      <div className="bahi-cloth" aria-hidden="true" />
      <div className="bahi-body">
        <div className="bahi-row font-semibold">
          <span>Udhaar diya</span>
          <span>Paise mile</span>
        </div>
        {rows.length === 0 ? <p className="hand py-4">Abhi koi entry nahi. Bolo aur likhwao.</p> : null}
        {rows.map((r) => (
          <div key={r.id} className={`bahi-row ${r.voidedAt ? "voided" : ""}`} data-testid={r.voidedAt ? "entry-voided" : "entry"}>
            {r.type === "credit_given" ? <Cell r={r} asking={asking} setAsking={setAsking} hata={hata} /> : <span />}
            {r.type === "payment_received" ? <Cell r={r} asking={asking} setAsking={setAsking} hata={hata} /> : <span />}
          </div>
        ))}
        {error ? (
          <p className="mt-2 font-semibold" role="alert">
            {error}
          </p>
        ) : null}
        <div className="mt-4 flex flex-wrap items-baseline justify-between gap-2 border-t-2 border-syahi pt-3">
          <span className="font-semibold">{balancePaise < 0 ? "Advance" : "Abhi baaki"}</span>
          <CountUp paise={Math.abs(balancePaise)} className="text-[32px]" />
        </div>
      </div>
    </section>
  );
}

function Cell({ r, asking, setAsking, hata }: { r: LedgerRow; asking: string | null; setAsking: (id: string | null) => void; hata: (id: string) => void }) {
  return (
    <span className="hand block">
      <span className="money">{formatINR(r.amountPaise)}</span> <span className="text-base">{fmtDate(r.confirmedAt)}</span>
      {r.voidedAt ? <span className="block text-base no-underline" style={{ textDecoration: "none" }}>Hata diya: {r.voidReason}</span> : null}
      {!r.voidedAt ? (
        asking === r.id ? (
          <span className="mt-1 flex gap-2">
            <button type="button" className="chip" onClick={() => hata(r.id)}>
              Haan, hata do
            </button>
            <button type="button" className="chip" onClick={() => setAsking(null)}>
              Nahi
            </button>
          </span>
        ) : (
          <button type="button" className="mt-1 block min-h-[48px] text-base underline" onClick={() => setAsking(r.id)} aria-label={`Hata do: ${formatINR(r.amountPaise)}`}>
            Hata do
          </button>
        )
      ) : null}
    </span>
  );
}
