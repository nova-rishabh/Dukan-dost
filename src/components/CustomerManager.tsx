"use client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useLocale } from "./LocaleProvider";
import { Munshi } from "./Munshi";
import { operations, type ManagedCustomer, type CustomerChange } from "@/lib/client/operations";

export function CustomerManager() {
  const { locale } = useLocale(); const c = (en: string, hi: string) => locale === "en" ? en : hi;
  const [customers, setCustomers] = useState<ManagedCustomer[]>([]); const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(""); const [message, setMessage] = useState(""); const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState<ManagedCustomer>(); const [name, setName] = useState(""); const [area, setArea] = useState("");
  const [phone, setPhone] = useState(""); const [consent, setConsent] = useState(false); const [separate, setSeparate] = useState(false);
  const [removePhone, setRemovePhone] = useState(false); const [review, setReview] = useState<CustomerChange>();
  const load = useCallback(async () => { try { setCustomers((await operations.customers()).customers); setLoaded(true); } catch { setError("load"); } }, []);
  useEffect(() => { void load(); }, [load]);
  const reset = () => { setEditing(undefined); setName(""); setArea(""); setPhone(""); setConsent(false); setSeparate(false); setRemovePhone(false); setReview(undefined); };
  const matches = customers.filter((x) => x.id !== editing?.id && x.name.trim().toLocaleLowerCase() === name.trim().toLocaleLowerCase());
  async function save() {
    if (!review) return; setBusy(true); setError("");
    try { await operations.saveCustomer(editing?.id, review); reset(); setMessage("saved"); await load(); } catch { setError("save"); } finally { setBusy(false); }
  }
  return <div className="mx-auto grid max-w-3xl gap-5 px-4 py-6">
    <Link href="/shop" className="btn w-fit">{c("Back to ledger", "Khata par wapas")}</Link>
    <header className="flex items-center gap-4"><Munshi /><div><h1 className="text-[40px]">{c("Your customers", "Aapke customers")}</h1><p>{c("Keep each person's ledger separate. Archived ledgers stay available.", "Har vyakti ka alag khata. Archive karne par purana hisaab rahega.")}</p></div></header>
    {error && <div role="alert" className="sticker p-4">{c(error === "load" ? "Customers could not load." : "The save was not confirmed. It may have completed. Reload customers and check before trying again.", "Customers nahi khule ya save ka jawab nahi mila. Save hua ho sakta hai. Dobara karne se pehle list check karo.")}<button className="btn ml-2" onClick={() => { setError(""); void load(); }}>{c("Reload", "Dobara kholo")}</button></div>}
    {message && <p role="status">{c("Customer saved.", "Customer save hua.")}</p>}
    <section className="sticker grid gap-3 p-5" aria-labelledby="customer-form-title"><h2 id="customer-form-title" className="text-2xl">{editing ? c("Edit customer", "Customer badlo") : c("Add customer", "Customer jodo")}</h2>
      {!review ? <form className="grid gap-3" onSubmit={(e) => { e.preventDefault(); setReview({ name: name.trim(), area: area.trim(), ...(phone || removePhone ? { phoneE164: removePhone ? "" : phone.trim(), phoneConsent: consent } : {}), separate, confirmed: true }); }}>
        <label>{c("Name", "Naam")}<input required maxLength={60} className="input w-full" value={name} onChange={(e) => { setName(e.target.value); setSeparate(false); }} /></label>
        <label>{c("Area or identifying note", "Area ya pehchaan")}<input maxLength={40} className="input w-full" value={area} onChange={(e) => setArea(e.target.value)} /></label>
        {matches.length > 0 && <div className="border-2 p-3"><p>{c("This name already exists:", "Is naam ke customers hain:")} {matches.map((x) => `${x.name} (${x.area || x.id.slice(-6)})`).join(", ")}</p><label className="flex min-h-12 items-center gap-2"><input type="checkbox" checked={separate} onChange={(e) => setSeparate(e.target.checked)} required />{c("These are different people. Keep separate ledgers.", "Yeh alag log hain. Alag khata banao.")}</label></div>}
        <label>{c("Optional phone, including country code", "Phone optional hai, country code ke saath")}<input type="tel" autoComplete="off" placeholder="+…" maxLength={16} pattern="\+[1-9][0-9]{7,14}" className="input w-full" value={phone} disabled={removePhone} onChange={(e) => setPhone(e.target.value)} /></label>
        {editing?.phoneMasked && <><p>{c("Saved phone:", "Saved phone:")} {editing.phoneMasked}</p><label className="flex min-h-12 items-center gap-2"><input type="checkbox" checked={removePhone} onChange={(e) => setRemovePhone(e.target.checked)} />{c("Remove saved phone", "Saved phone hatao")}</label></>}
        {phone && !removePhone && <label className="flex min-h-12 items-center gap-2"><input required type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />{c("The customer agreed to storing this phone for shop communication.", "Customer ne dukaan ke liye phone save karne ki ijazat di hai.")}</label>}
        <button className="btn btn-primary" type="submit">{c("Review customer", "Customer check karo")}</button>{editing && <button className="btn" type="button" onClick={reset}>{c("Cancel edit", "Badlav chhodo")}</button>}
      </form> : <div className="grid gap-3" aria-label={c("Review customer", "Customer check karo")}><p>{review.archived === undefined ? c("Save these customer details?", "Yeh details save karein?") : review.archived ? c("Archive this customer? The ledger remains available.", "Customer archive karein? Hisaab rahega.") : c("Restore this customer?", "Customer wapas laayein?")}</p><strong>{review.name}</strong><p>{review.area}</p>{review.phoneE164 !== undefined && <p>{review.phoneE164 ? `${c("Phone ending", "Phone ke aakhri ank")} ${review.phoneE164.slice(-4)}` : c("Remove saved phone", "Saved phone hatao")}</p>}<button className="btn btn-primary" disabled={busy} onClick={() => void save()}>{c("Confirm customer", "Customer confirm karo")}</button><button className="btn" disabled={busy} onClick={() => setReview(undefined)}>{c("Go back", "Wapas")}</button></div>}
    </section>
    <section aria-label={c("Customer list", "Customer list")} className="grid gap-3">{!loaded ? <p role="status">{c("Loading customers…", "Customers khul rahe hain…")}</p> : customers.map((x) => <article key={x.id} className="sticker grid gap-2 p-4"><Link className="text-2xl underline" href={`/shop/${x.id}`}>{x.name}</Link><p>{x.area || c("No area saved", "Area nahi diya")} · {c("Ledger", "Khata")} {x.id.slice(-6)}{x.archivedAt ? ` · ${c("Archived", "Archived")}` : ""}</p>{x.phoneMasked && <p>{x.phoneMasked}</p>}<div className="flex flex-wrap gap-2"><button className="btn" disabled={busy || !!review} onClick={() => { reset(); setEditing(x); setName(x.name); setArea(x.area || ""); setMessage(""); }}>{c("Edit details", "Details badlo")}</button><button className="btn" disabled={busy || !!review} onClick={() => { setEditing(x); setReview({ name: x.name, area: x.area || "", archived: !x.archivedAt, confirmed: true }); }}>{x.archivedAt ? c("Restore", "Wapas lao") : c("Archive", "Archive karo")}</button></div></article>)}</section>
  </div>;
}
