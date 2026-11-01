"use client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { api, call } from "@/lib/client/api";
import { useCopy } from "./LocaleProvider";
import { Munshi } from "./Munshi";

interface StartState { customers: number; entries: number; products: number; uncounted: number; upi: boolean; demo: boolean }
export function GettingStarted() {
  const L = useCopy();
  const [state, setState] = useState<StartState | null>(null);
  const [failed, setFailed] = useState(false);
  const [busy, setBusy] = useState(false);
  const load = useCallback(async () => {
    setBusy(true); setFailed(false);
    try {
      const [summary, stock, profile, metrics] = await Promise.all([
        api.summary(), call<{ products: { onHandMinor: number | null }[] }>("/api/inventory"), call<{ shop: { upiVpa: string; isDemo: boolean } }>("/api/shop/profile"), call<{ entryCount: number }>("/api/dashboard"),
      ]);
      setState({ customers: summary.summary.customerCount, entries: metrics.entryCount, products: stock.products.length, uncounted: stock.products.filter((p) => p.onHandMinor === null).length, upi: /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+$/.test(profile.shop.upiVpa), demo: profile.shop.isDemo });
    } catch { setFailed(true); }
    finally { setBusy(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);
  const step = (title: string, detail: string, href: string, action: string, done: boolean) => <li className="sticker grid gap-2 p-4" key={href}><div className="flex flex-wrap justify-between gap-2"><h2 className="text-2xl">{title}</h2><span className="font-semibold">{done ? L("Ready", "Taiyaar") : L("Next step", "Agla kadam")}</span></div><p>{detail}</p><Link className="btn w-fit" href={href}>{action}</Link></li>;
  return <div className="mx-auto grid max-w-3xl gap-5 px-4 py-6 md:px-8">
    
    <div className="flex items-center gap-4"><Munshi /><div><h1 className="text-4xl">{L("Start with one real task", "Ek kaam se shuru karo")}</h1><p>{L("A short guide to setting up your shop. You can skip this and return anytime.", "Dukaan taiyaar karne ki chhoti madad. Abhi chhodkar kabhi bhi wapas aa sakte ho.")}</p></div></div>
    <Link className="underline w-fit" href="/shop">{L("Skip guide and open ledger", "Guide chhodo, khata kholo")}</Link>
    {failed ? <div role="alert" className="sticker p-4"><p>{L("The checklist could not refresh. Its progress is not confirmed. Reconnect and try again.", "Checklist nahi khuli. Progress pakki nahi hai. Net jodkar dobara kholo.")}</p><button className="btn" onClick={() => void load()} disabled={busy}>{L("Reload checklist", "Checklist dobara kholo")}</button></div> : busy && !state ? <p aria-busy="true" role="status">{L("Checking your shop…", "Dukaan dekh rahe hain…")}</p> : null}
    {state ? <>
      <p>{state.demo ? L("This fictional shop already has examples. Changes here do not affect a real shop.", "Is sample dukaan mein pehle se misaal hain. Yahan ke badlav asli dukaan ko nahi chhoote.") : L("Progress below comes from your current shop records. A ready label never verifies bank payment or UPI ownership.", "Neeche ki progress abhi ke hisaab se hai. Taiyaar ka matlab bank payment ya UPI ownership verify hona nahi hai.")}</p>
      <ol className="grid list-none gap-4 p-0">
        {step(L("1. Add a customer", "1. Customer jodo"), L(`${state.customers} customers saved. Use an area or identifying note to separate people with the same name.`, `${state.customers} customers hain. Ek naam ke alag logon ke liye area ya pehchaan do.`), "/shop/customers", L("Manage customers", "Customers sambhalo"), state.customers > 0)}
        {step(L("2. Record and confirm one entry", "2. Ek entry likho aur pakki karo"), L(`${state.entries} confirmed entries. Speak or type, review the amount in digits and words, then confirm the direction.`, `${state.entries} pakki entries hain. Bolo ya likho, rakam ank aur shabdon mein dekho, phir disha pakki karo.`), "/shop", L("Open ledger", "Khata kholo"), state.entries > 0)}
        {step(L("3. Count your stock", "3. Stock gino"), L(`${state.products} measured items; ${state.uncounted} still need an opening count. A low-stock note never invents a quantity.`, `${state.products} measured items hain; ${state.uncounted} ki shuruati ginti baaki hai. Kam-stock note apne aap quantity nahi banata.`), "/shop/inventory", L("Count inventory", "Stock gino"), state.products > 0 && state.uncounted === 0)}
        {step(L("4. Check your payment destination", "4. Payment ki jagah check karo"), L("Review your shop name and UPI ID in Settings before making a payment link. This is optional until you want payment links.", "Payment link banane se pehle Settings mein dukaan aur UPI ID check karo. Link chahiye tab yeh zaroori hai."), "/shop/settings", L("Review shop settings", "Dukaan ki settings dekho"), state.upi)}
      </ol>
      <section className="sticker grid gap-3 p-4"><h2 className="text-2xl">{L("Keep it safe", "Hisaab sambhalkar")}</h2><p>{L("An unanswered request may already have completed. Check records before retrying. No reminder is sent automatically. A payment link is not proof of payment.", "Jawab na milne par kaam hua ho sakta hai. Dobara karne se pehle hisaab dekho. Yaad dilane ka message apne aap nahi jaata. Payment link payment ka saboot nahi hai.")}</p><Link className="underline" href="/shop/help">{L("Read help and examples", "Madad aur misaal dekho")}</Link></section>
      <button className="btn w-fit" disabled={busy} onClick={() => void load()}>{L("Refresh progress", "Progress dobara dekho")}</button>
    </> : null}
    <section className="sticker grid gap-2 p-4"><h2 className="text-2xl">{L("Use it like an app", "App ki tarah kholo")}</h2><p>{L("Use your browser menu to Install app or Add to Home Screen. Supported browsers may also show an Install button here. Offline help is available after your first online visit; the private ledger still needs a connection.", "Browser menu mein Install app ya Add to Home Screen chuno. Kuch browsers mein Install button bhi milega. Pehli online visit ke baad offline madad milegi; private khate ke liye net chahiye.")}</p></section>
  </div>;
}
