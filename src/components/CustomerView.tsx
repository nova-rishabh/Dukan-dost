"use client";

import { useCopy, useLocale } from "./LocaleProvider";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { api, ApiError, type LedgerRow } from "@/lib/client/api";
import { formatINR } from "@/lib/money";
import type { Proposal } from "@/lib/types";
import { BahiPage } from "./BahiPage";
import { BalanceChip } from "./BalanceChip";
import { Parchi } from "./Parchi";
import { ReminderSheet } from "./ReminderSheet";
import { Munshi } from "./Munshi";
import { Toast } from "./Toast";

export function CustomerView({ id }: { id: string }) {
  const L = useCopy();
  const { locale, hint } = useLocale();
  const [data, setData] = useState<{ name: string; area?: string; rows: LedgerRow[]; balance: number } | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [missing, setMissing] = useState(false);
  const [sheet, setSheet] = useState(false);
  const [mark, setMark] = useState<Proposal | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const r = await api.customer(id);
      setLoadError(false);
      setMissing(false);
      setData({ name: r.customer.name, area: r.customer.area, rows: r.entries, balance: r.balancePaise });
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) setMissing(true);
      else setLoadError(true);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  /** L("Record payment", "Mile mark karo") goes through the same interpret and confirm path as a spoken entry. */
  async function markReceived() {
    if (!data || data.balance <= 0) return;
    setError(null);
    try {
      const r = await api.interpret(L(`${data.name} paid ${data.balance / 100} rupees`, `${data.name} ne ${data.balance / 100} diye`), "text");
      setMark(r.proposal);
    } catch (e) {
      setError(locale === "en" ? hint(e, "inputFailed") : e instanceof ApiError ? e.hint : "Dobara try karo.");
    }
  }

  if (missing)
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="text-[40px]">{L("Customer not found", "Customer nahi mila")}</h1>
        <Link href="/shop" className="btn mt-4">
          {L("Back to ledger", "Khata par wapas jao")}
        </Link>
      </div>
    );
  if (loadError) return <div className="mx-auto grid max-w-3xl gap-4 px-4 py-8" role="alert"><Munshi pose="retry" /><h1 className="text-[28px]">{L("The ledger could not open", "Khata nahi khula")}</h1><p>{L("Check your connection and try again.", "Connection check karke dobara try karo.")}</p><button className="btn w-fit" onClick={() => void load()}>{L("Try again", "Dobara kholo")}</button><Link href="/shop" className="btn w-fit">{L("All customers", "Sab customer")}</Link></div>;
  if (!data) return <p className="px-4 py-8" aria-busy="true">{L("Loading ledger…", "Khata khul raha hai…")}</p>;

  return (
    <div className="mx-auto grid max-w-3xl gap-5 px-4 py-4 md:px-8">
      <Link href="/shop" className="btn w-fit">
        {L("All customers", "Sab customer")}
      </Link>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-[40px] leading-tight">{data.name}</h1>
          {data.area ? <p>{data.area}</p> : null}
        </div>
        <BalanceChip paise={data.balance} />
      </div>

      <div className="flex flex-wrap gap-3">
        <Link href={`/shop/${id}/statement`} className="btn">{L("Statement", "Khata statement")}</Link>
        <button type="button" className="btn btn-reminder" onClick={() => setSheet(true)} disabled={data.balance <= 0}>
          {L("Send reminder", "Yaad dilao")}
        </button>
        <button type="button" className="btn" onClick={markReceived} disabled={data.balance <= 0} data-testid="mark-received">
          {L("Record payment", "Mile mark karo")}
        </button>
      </div>
      {data.balance > 0 ? null : <p>{L("There is no outstanding balance to remind this customer about.", "Abhi koi paisa baaki nahi, isliye yaad dilane ki zaroorat nahi.")}</p>}
      {error ? <p role="alert" className="font-semibold">{error}</p> : null}

      {mark ? (
        <div className="grid gap-3">
          <p className="hand">{L(`This will record ${formatINR(data.balance)} received. Review and press Record entry.`, `Isse ${formatINR(data.balance)} mile mark honge. Dekho aur Likh do dabao.`)}</p>
          {mark.intents.map((intent, i) => (
            <Parchi
              key={`${mark.token}-${i}`}
              intent={intent}
              index={i}
              token={mark.token ?? ""}
              sourceText={mark.sourceText}
              source="text"
              onWritten={(info) => {
                setToast(info.message);
                void load();
              }}
            />
          ))}
        </div>
      ) : null}

      <BahiPage rows={data.rows} balancePaise={data.balance} onChanged={load} />

      {sheet ? <ReminderSheet customerId={id} customerName={data.name} onClose={() => setSheet(false)} /> : null}
      <Toast message={toast} onGone={() => setToast(null)} />
    </div>
  );
}
