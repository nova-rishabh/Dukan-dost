"use client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { api, post, type CustomerListItem } from "@/lib/client/api";
import { formatINR } from "@/lib/money";
import { useLocale } from "./LocaleProvider";
import { Munshi } from "./Munshi";

interface Preview { token: string; customer: { id: string; name: string; area?: string }; type: "credit_given" | "payment_received"; amountPaise: number; words: { en: string; hi: string }; note: string; secondRequired: boolean }
export function ManualEntry() {
  const { locale, hint } = useLocale();
  const c = (en: string, hi: string) => locale === "en" ? en : hi;
  const [customers, setCustomers] = useState<CustomerListItem[] | null>(null);
  const [customerId, setCustomerId] = useState(""); const [type, setType] = useState<Preview["type"]>("credit_given");
  const [amount, setAmount] = useState(""); const [note, setNote] = useState(""); const [preview, setPreview] = useState<Preview | null>(null);
  const [busy, setBusy] = useState(false); const [error, setError] = useState<string | null>(null); const [saved, setSaved] = useState<string | null>(null);
  const [second, setSecond] = useState(false); const [duplicate, setDuplicate] = useState(false);
  const load = useCallback(() => api.customers().then((r) => setCustomers(r.customers.filter((x) => !x.archivedAt))).catch((e) => setError(hint(e, "requestFailed"))), [hint]);
  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    const person = query.get("customer"); const value = query.get("amount");
    if (person && person.length <= 64) setCustomerId(person);
    if (query.get("type") === "payment_received") setType("payment_received");
    if (value && /^[0-9]+(?:[.][0-9]{1,2})?$/.test(value) && value.length <= 9) setAmount(value);
  }, []);
  async function prepare() {
    setBusy(true); setError(null); setSaved(null); setSecond(false); setDuplicate(false);
    try { setPreview(await post<Preview>("/api/entries/prepare", { customerId, type, amount, note })); }
    catch (e) { setError(hint(e, "requestFailed")); }
    finally { setBusy(false); }
  }
  async function record() {
    if (!preview) return;
    setBusy(true); setError(null);
    try {
      await api.createEntry({ proposalToken: preview.token, intentIndex: 0, customerId: preview.customer.id, type: preview.type, amountPaise: preview.amountPaise, note: preview.note, confirmed: true, secondConfirmed: second, allowDuplicate: duplicate, source: "text", resolutions: [], idempotencyKey: crypto.randomUUID() });
      setSaved(preview.customer.id); setPreview(null); setAmount(""); setNote("");
    } catch (e) { setError(hint(e, "requestFailed")); }
    finally { setBusy(false); }
  }
  return <div className="mx-auto grid max-w-xl gap-4 px-4 pb-12">
    <div className="flex items-center gap-3"><Munshi /><div><h1 className="text-4xl">{c("Write an exact entry", "Sahi rakam likho")}</h1><p>{c("Use this form for amounts with paise. Review before recording.", "Paise wali rakam yahan likho. Likhne se pehle check karo.")}</p></div></div>
    <Link className="chip w-fit" href="/shop">{c("Back to ledger", "Khata kholo")}</Link>
    {error ? <p className="sticker p-3" role="alert">{error}</p> : null}
    {saved ? <div className="sticker grid gap-3 bg-pista p-4" role="status"><p>{c("Entry recorded.", "Entry likh li.")}</p><Link className="underline" href={`/shop/${saved}`}>{c("View customer ledger", "Customer ka khata dekho")}</Link></div> : null}
    {preview ? <section className="sticker grid gap-3 p-4" aria-label={c("Review entry", "Entry check karo")}>
      <h2 className="text-3xl">{preview.customer.name}</h2><p>{preview.customer.area}</p>
      <p className="text-2xl font-semibold">{preview.type === "credit_given" ? c("Credit given — customer owes the shop", "Udhaar diya — customer se lena hai") : c("Payment received — customer paid the shop", "Paise mile — customer ne dukaan ko diye")}</p>
      <p className="text-4xl">{formatINR(preview.amountPaise)}</p><p lang={locale === "en" ? "en" : "hi"}>{locale === "en" ? preview.words.en : preview.words.hi}</p><p>{preview.note}</p>
      {preview.secondRequired ? <label className="flex gap-2"><input type="checkbox" checked={second} onChange={(e) => setSecond(e.target.checked)} />{c("I checked this large amount again.", "Badi rakam dobara check kar li.")}</label> : null}
      <label className="flex gap-2"><input type="checkbox" checked={duplicate} onChange={(e) => setDuplicate(e.target.checked)} />{c("If an identical entry was just recorded, I confirm this is another transaction.", "Abhi aisi entry likhi ho toh yeh alag len-den hai, maine check kiya.")}</label>
      <button className="btn btn-primary" disabled={busy || (preview.secondRequired && !second)} onClick={() => void record()}>{c("Confirm and record entry", "Pakki karke likh do")}</button><button className="btn" disabled={busy} onClick={() => setPreview(null)}>{c("Edit details", "Details badlo")}</button>
    </section> : customers ? customers.length ? <form className="sticker grid gap-3 p-4" onSubmit={(e) => { e.preventDefault(); void prepare(); }}>
      <label>{c("Customer", "Customer")}<select required className="input w-full" value={customerId} onChange={(e) => setCustomerId(e.target.value)}><option value="">{c("Choose customer", "Customer chuno")}</option>{customers.map((x) => <option key={x.id} value={x.id}>{x.name}{x.area ? ` · ${x.area}` : ""} · {x.id.slice(-6)}</option>)}</select></label>
      <label>{c("Money direction", "Rakam kis taraf")}<select className="input w-full" value={type} onChange={(e) => setType(e.target.value as Preview["type"])}><option value="credit_given">{c("Credit given", "Udhaar diya")}</option><option value="payment_received">{c("Payment received", "Paise mile")}</option></select></label>
      <label>{c("Amount in rupees", "Rakam rupaye mein")}<input required inputMode="decimal" className="input w-full" value={amount} maxLength={9} pattern="[0-9]+([.][0-9]{1,2})?" placeholder="125.50" onChange={(e) => setAmount(e.target.value)} /></label>
      <label>{c("Note (optional)", "Note (zaroori nahi)")}<input className="input w-full" maxLength={140} value={note} onChange={(e) => setNote(e.target.value)} /></label>
      <button className="btn btn-primary" disabled={busy}>{c("Review entry", "Entry check karo")}</button>
    </form> : <p>{c("Add a customer first.", "Pehle customer jodo.")} <Link className="underline" href="/shop/customers">{c("Manage customers", "Customer jodo")}</Link></p> : <div><p role="status">{c("Loading customers…", "Customer aa rahe hain…")}</p>{error ? <button className="btn" onClick={() => void load()}>{c("Retry", "Dobara")}</button> : null}</div>}
  </div>;
}
