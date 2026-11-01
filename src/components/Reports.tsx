"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { call } from "@/lib/client/api";
import { formatINR } from "@/lib/money";
import type { Entry, Product } from "@/lib/types";
import { useLocale } from "./LocaleProvider";
import { Munshi } from "./Munshi";

interface Dashboard {
  shopName: string; outstandingPaise: number; advancesPaise: number; creditPaise: number; receivedPaise: number; entryCount: number;
  customers: { id: string; name: string; balancePaise: number }[];
  lowStock: Product[]; unknownStockCount: number; stockNoteCount: number;
  recent: { id: string; customerId: string; name: string; type: Entry["type"]; amountPaise: number; confirmedAt: string }[];
}
interface Statement {
  shopName: string; customer: { id: string; name: string; area?: string }; openingPaise: number; closingPaise: number; currentPaise: number;
  rows: (Entry & { runningPaise: number })[];
}

export function Reports({ customerId }: { customerId?: string }) {
  const { locale, hint } = useLocale();
  const en = locale === "en";
  const copy = (english: string, hindi: string) => en ? english : hindi;
  const requestVersion = useRef(0);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [query, setQuery] = useState("");
  const [data, setData] = useState<Dashboard | Statement | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const endpoint = customerId ? `/api/customers/${encodeURIComponent(customerId)}/statement` : "/api/dashboard";
  const load = useCallback(async () => {
    const version = ++requestVersion.current;
    setBusy(true); setError(null); setData(null);
    try { const result = await call<Dashboard | Statement>(`${endpoint}?${query}`); if (version === requestVersion.current) setData(result); }
    catch (e) { if (version === requestVersion.current) setError(hint(e, "requestFailed")); }
    finally { if (version === requestVersion.current) setBusy(false); }
  }, [endpoint, query, hint]);
  useEffect(() => { void load(); return () => { requestVersion.current++; }; }, [load]);
  const statement = customerId && data && "rows" in data ? data : null;
  const dashboard = !customerId && data && "recent" in data ? data : null;
  const date = (at: string) => new Intl.DateTimeFormat(en ? "en-IN" : "hi-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" }).format(new Date(at));
  const balance = (n: number) => `${formatINR(Math.abs(n))} · ${n < 0 ? copy("Customer advance", "Customer ka advance") : n > 0 ? copy("Customer owes", "Customer se lena hai") : copy("Settled", "Hisaab barabar")}`;
  return <div className="report mx-auto grid max-w-5xl gap-5 px-4 pb-12 md:px-8">
    <div className="flex items-center gap-4"><Munshi pose={data ? "welcome" : "empty"} /><div><h1 className="text-4xl">{customerId ? copy("Customer statement", "Customer ka hisaab") : copy("Shop dashboard", "Dukaan ka dashboard")}</h1><p className="text-xl">{data?.shopName}</p></div></div>
    <form className="sticker grid gap-3 p-4 print:hidden sm:grid-cols-3" onSubmit={(e) => { e.preventDefault(); if (from && to && from > to) { setError(copy("End date must follow start date.", "Aakhri tareekh pehli ke baad honi chahiye.")); return; } setQuery(new URLSearchParams({ ...(from ? { from } : {}), ...(to ? { to } : {}) }).toString()); }}>
      <label>{copy("From recorded date", "Is tareekh se")}<input className="input w-full" type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></label>
      <label>{copy("To recorded date", "Is tareekh tak")}<input className="input w-full" type="date" value={to} onChange={(e) => setTo(e.target.value)} /></label>
      <button className="btn self-end" disabled={busy}>{copy("Apply dates", "Tareekh lagao")}</button>
    </form>
    <p>{copy("All dates use India time (IST). Blank dates include all records. Voided entries do not affect balances.", "Tareekh India time (IST) mein hai. Khali tareekh mein saare records hain. Radd entries balance mein nahi judti.")}</p>
    <p>{copy("Applied period", "Laga hua samay")}: {new URLSearchParams(query).get("from") || copy("Beginning", "Shuru se")} — {new URLSearchParams(query).get("to") || copy("Present", "Ab tak")}</p>
    {busy ? <p role="status" aria-busy="true">{copy("Loading records…", "Hisaab aa raha hai…")}</p> : null}
    {error ? <div role="alert"><p>{error}</p><button className="btn" onClick={() => void load()}>{copy("Retry", "Dobara kholo")}</button></div> : null}
    {dashboard ? <>
      <section aria-label={copy("Balances and activity", "Balance aur entries")} className="grid gap-4 sm:grid-cols-2">
        {[[copy("Outstanding now", "Abhi lena hai"), dashboard.outstandingPaise], [copy("Customer advances now", "Abhi customer ka advance"), dashboard.advancesPaise], [copy("Credit recorded in period", "Is samay diya udhaar"), dashboard.creditPaise], [copy("Payments recorded in period", "Is samay mili rakam"), dashboard.receivedPaise]].map(([label, n]) => <div className="sticker p-4" key={label}><p>{label}</p><p className="text-3xl font-semibold">{formatINR(n as number)}</p></div>)}
      </section>
      <p>{copy("Confirmed entries in period", "Is samay pakki entries")}: {dashboard.entryCount}. {copy("These are ledger totals; sales and profit are not tracked.", "Yeh bahi ka hisaab hai; bikri aur munafa track nahi hota.")}</p>
      <section className="sticker grid gap-3 p-4"><h2 className="text-2xl">{copy("Largest current balances", "Abhi ke bade balances")}</h2>{dashboard.customers.length ? dashboard.customers.map((c) => <Link className="flex flex-wrap justify-between gap-2 underline" key={c.id} href={`/shop/${c.id}`}>{c.name}<span>{balance(c.balancePaise)}</span></Link>) : <p>{copy("Add your first customer to begin.", "Shuru karne ke liye pehla customer jodo.")}</p>}</section>
      <section className="sticker grid gap-2 p-4"><h2 className="text-2xl">{copy("Stock attention", "Stock par dhyan")}</h2><p>{copy("Products at or below threshold", "Kam stock wale products")}: {dashboard.lowStock.length}</p><p>{copy("Products without an opening count", "Bina shuruati ginti wale products")}: {dashboard.unknownStockCount}</p><p>{copy("Unresolved low-stock notes", "Baaki kam-stock notes")}: {dashboard.stockNoteCount}</p><Link className="underline" href="/shop/inventory">{copy("Review inventory", "Stock dekho")}</Link></section>
      <section className="sticker grid gap-3 p-4"><h2 className="text-2xl">{copy("Recent recorded activity", "Haal ki entries")}</h2>{dashboard.recent.length ? dashboard.recent.map((e) => <Link key={e.id} className="border-b-2 pb-2" href={`/shop/${e.customerId}`}><span className="font-semibold">{e.name} · {formatINR(e.amountPaise)}</span><p>{e.type === "credit_given" ? copy("Credit given", "Udhaar diya") : copy("Payment received", "Rakam mili")} · {date(e.confirmedAt)}</p></Link>) : <p>{copy("No confirmed entries in this period.", "Is samay koi pakki entry nahi hai.")}</p>}</section>
    </> : null}
    {statement ? <>
      <h2 className="text-3xl">{statement.customer.name}{statement.customer.area ? ` · ${statement.customer.area}` : ""}</h2>
      <div className="flex flex-wrap gap-3 print:hidden"><button className="btn" onClick={() => window.print()}>{copy("Print / Save PDF", "Print / PDF banao")}</button><a className="btn" href={`${endpoint}?${query}${query ? "&" : ""}format=csv`}>{copy("Download CSV", "CSV nikalo")}</a></div>
      <p>{copy("Opening balance", "Shuru ka balance")}: {balance(statement.openingPaise)}</p>
      <div className="overflow-x-auto"><table className="w-full border-collapse text-left"><caption className="text-left">{copy("Statement by recorded date", "Likhne ki tareekh ke hisaab se")}</caption><thead><tr>{[copy("Recorded at", "Kab likha"), copy("Entry", "Entry"), copy("Amount", "Rakam"), copy("Running balance", "Balance")].map((s) => <th className="border-2 p-2" scope="col" key={s}>{s}</th>)}</tr></thead><tbody>{statement.rows.map((e) => <tr key={e.id}><td className="border-2 p-2">{date(e.confirmedAt)}</td><td className="border-2 p-2">{e.type === "credit_given" ? copy("Credit given", "Udhaar diya") : copy("Payment received", "Rakam mili")}{e.voidedAt ? <p>{copy("Voided", "Radd")}: {e.voidReason}</p> : null}<p>{e.note ?? e.sourceText}</p></td><td className="border-2 p-2">{formatINR(e.amountPaise)}</td><td className="border-2 p-2">{balance(e.runningPaise)}</td></tr>)}</tbody></table></div>
      {!statement.rows.length ? <p>{copy("No entries in this period.", "Is samay koi entry nahi hai.")}</p> : null}
      <p className="text-xl font-semibold">{copy("Period closing balance", "Is samay ke aakhir ka balance")}: {balance(statement.closingPaise)}</p><p>{copy("Current balance", "Abhi ka balance")}: {balance(statement.currentPaise)}</p>
    </> : null}
    <style>{`@media print { body { background: white !important; } header, footer, body > a, .report nav, .report form { display: none !important; } .report { max-width: none; padding: 0; } .report img { display: none; } .report table { font-size: 11px; } .report tr { break-inside: avoid; } }`}</style>
  </div>;
}
