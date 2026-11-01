"use client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { api, call, type CustomerListItem, type LedgerRow } from "@/lib/client/api";
import { formatINR } from "@/lib/money";
import { useLocale } from "./LocaleProvider";
interface Page { rows: (LedgerRow & { customerId: string; name: string; area?: string; balancePaise: number })[]; total: number; nextOffset: number | null; generatedAt: string }
export function LedgerExplorer() {
  const { locale, hint } = useLocale(); const c = (en: string, hi: string) => locale === "en" ? en : hi;
  const [customers, setCustomers] = useState<CustomerListItem[]>([]); const [customer, setCustomer] = useState(""); const [type, setType] = useState("all"); const [from, setFrom] = useState(""); const [to, setTo] = useState("");
  const [query, setQuery] = useState(""); const [offset, setOffset] = useState(0); const [data, setData] = useState<Page | null>(null); const [error, setError] = useState<string | null>(null);
  const loadPeople = useCallback(() => { void api.customers().then((r) => setCustomers(r.customers)).catch((e) => setError(hint(e, "requestFailed"))); }, [hint]);
  useEffect(() => { loadPeople(); }, [loadPeople]);
  useEffect(() => {
    let active = true; setData(null); setError(null);
    void call<Page>(`/api/ledger?${query}&offset=${offset}&limit=50`).then((r) => { if (active) setData(r); }).catch((e) => { if (active) setError(hint(e, "requestFailed")); });
    return () => { active = false; };
  }, [query, offset, hint]);
  return <div className="mx-auto grid max-w-4xl gap-4 px-4 pb-12"><h1 className="text-4xl">{c("Browse entries", "Entries dekho")}</h1>
    <p>{c("Filter by recorded date in India time. Balances include all non-void entries up to each row, even if other entry types are hidden.", "India time ki likhne ki tareekh se chuno. Har row ka balance us waqt tak ki saari pakki entries ka hai, chhupi hui types bhi.")}</p>
    <form className="sticker grid gap-3 p-4 sm:grid-cols-2" onSubmit={(e) => { e.preventDefault(); setOffset(0); setQuery(new URLSearchParams({ customer, type, from, to }).toString()); }}>
      <label>{c("Customer", "Customer")}<select className="input w-full" value={customer} onChange={(e) => setCustomer(e.target.value)}><option value="">{c("All customers", "Sab customer")}</option>{customers.map((p) => <option value={p.id} key={p.id}>{p.name} · {p.area || p.id.slice(-6)}</option>)}</select></label>
      <label>{c("Entry type", "Entry ka prakar")}<select className="input w-full" value={type} onChange={(e) => setType(e.target.value)}><option value="all">{c("All entries", "Saari entries")}</option><option value="credit_given">{c("Credit given", "Udhaar diya")}</option><option value="payment_received">{c("Payment received", "Paise mile")}</option><option value="voided">{c("Voided entries", "Radd entries")}</option></select></label>
      <label>{c("From date", "Is tareekh se")}<input className="input w-full" type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></label><label>{c("To date", "Is tareekh tak")}<input className="input w-full" type="date" value={to} onChange={(e) => setTo(e.target.value)} /></label>
      <button className="btn btn-primary">{c("Apply filters", "Filters lagao")}</button><button className="btn" type="button" onClick={() => { setCustomer(""); setType("all"); setFrom(""); setTo(""); setOffset(0); setQuery(""); }}>{c("Clear filters", "Filters hatao")}</button>
    </form>
    {error ? <div role="alert"><p>{error}</p><button className="btn" onClick={() => { setQuery(new URLSearchParams({ customer, type, from, to, refresh: String(Date.now()) }).toString()); loadPeople(); }}>{c("Retry", "Dobara")}</button></div> : data ? <>
      <p role="status">{c("Entries found", "Entries mili")}: {data.total}. {c("Showing", "Dikha rahe hain")} {data.total ? offset + 1 : 0}–{Math.min(offset + 50, data.total)}.</p>
      {data.rows.map((r) => <article className="sticker grid gap-2 p-4" key={r.id}><Link className="text-2xl underline" href={`/shop/${r.customerId}`}>{r.name}{r.area ? ` · ${r.area}` : ""}</Link><p className="text-xl font-semibold">{r.type === "credit_given" ? c("Credit given", "Udhaar diya") : c("Payment received", "Paise mile")}: {formatINR(r.amountPaise)}</p><p>{new Intl.DateTimeFormat(locale === "en" ? "en-IN" : "hi-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" }).format(new Date(r.confirmedAt))}</p><p>{c("Customer balance after entry", "Entry ke baad customer ka balance")}: {formatINR(r.balancePaise)} {r.balancePaise < 0 ? c("(advance)", "(advance)") : ""}</p><details><summary className="min-h-12 cursor-pointer underline">{c("Entry details", "Entry ki details")}</summary><p>{c("Original evidence", "Asli baat")}: {r.sourceText}</p><p>{c("Source", "Zariya")}: {r.source === "voice" ? c("Voice", "Awaaz") : r.source === "sample" ? c("Sample clip", "Sample clip") : c("Typed", "Likha hua")}</p>{r.note ? <p>{c("Note", "Note")}: {r.note}</p> : null}{r.voidedAt ? <p>{c("Voided", "Radd")}: {r.voidReason} · {r.voidedAt}</p> : null}<p className="break-all">{c("Record ID", "Record ID")}: {r.id}</p></details></article>)}
      {!data.rows.length ? <p>{c("No entries match these filters.", "In filters mein koi entry nahi.")}</p> : null}
      <div className="flex flex-wrap gap-3"><button className="btn" disabled={offset === 0} onClick={() => setOffset(Math.max(0, offset - 50))}>{c("Previous page", "Pichhla panna")}</button><button className="btn" disabled={data.nextOffset === null} onClick={() => setOffset(data.nextOffset!)}>{c("Next page", "Agla panna")}</button></div>
      <p className="text-base">{c("Refreshed", "Abhi khula")}: {new Date(data.generatedAt).toLocaleTimeString(locale === "en" ? "en-IN" : "hi-IN")}</p>
    </> : <p role="status" aria-busy="true">{c("Loading entries…", "Entries aa rahi hain…")}</p>}
  </div>;
}
