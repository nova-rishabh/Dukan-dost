"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { call } from "@/lib/client/api";
import { useLocale } from "./LocaleProvider";

export function ShopProfile() {
  const { locale, hint } = useLocale(); const c = (en: string, hi: string) => locale === "en" ? en : hi;
  const [name, setName] = useState(""); const [vpa, setVpa] = useState(""); const [loaded, setLoaded] = useState(false);
  const [passcode, setPasscode] = useState(""); const [demo, setDemo] = useState(true);
  const [review, setReview] = useState(false); const [busy, setBusy] = useState(false); const [error, setError] = useState(""); const [saved, setSaved] = useState(false);
  async function load() { try { const { shop } = await call<{ shop: { name: string; upiVpa: string; isDemo: boolean } }>("/api/shop/profile"); setName(shop.name); setVpa(shop.upiVpa); setDemo(shop.isDemo); setLoaded(true); setError(""); } catch (e) { setError(hint(e, "requestFailed")); } }
  useEffect(() => { void load(); }, []);
  async function save() { setBusy(true); setError(""); try { await call("/api/shop/profile", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ name: name.trim(), upiVpa: vpa.trim(), passcode: passcode || undefined, confirmed: true }) }); setReview(false); setPasscode(""); setSaved(true); } catch (e) { setError(hint(e, "requestFailed")); } finally { setBusy(false); } }
  return <section className="sticker grid gap-3 p-5" aria-labelledby="shop-profile-title"><h2 className="text-2xl" id="shop-profile-title">{c("Shop name and UPI", "Dukaan ka naam aur UPI")}</h2><p>{c("Payment links show this shop name and send customers to this UPI ID. Check the ID belongs to your shop before confirming.", "Payment link mein yahi dukaan aur UPI ID hogi. Confirm karne se pehle check karo ki ID aapki dukaan ki hai.")}</p>
    {error && <div role="alert"><p>{error}</p><button className="btn" onClick={() => void load()}>{c("Reload details", "Details dobara kholo")}</button></div>}
    {saved && <p role="status">{c("Shop details saved.", "Dukaan ki details save hui.")}</p>}
    {!loaded && !error ? <p role="status">{c("Loading details…", "Details khul rahi hain…")}</p> : !loaded ? null : review ? <div className="grid gap-3"><h3 className="text-xl">{c("Review shop details", "Dukaan ki details check karo")}</h3><p>{name}</p><p className="break-all">{vpa}</p><p>{c("UPI ID format checked. Ownership is not verified by the app.", "UPI ID ka format check hua. App ne ID ki ownership verify nahi ki.")}</p>{!demo && <><label>{c("Current password (or sign in again with WhatsApp)", "Abhi ka password (ya WhatsApp se dobara login)")}<input type="password" autoComplete="current-password" className="input w-full" value={passcode} onChange={(e) => setPasscode(e.target.value)} /></label><Link className="underline" href="/login?reauth=1">{c("Verify with WhatsApp again", "WhatsApp se dobara verify karo")}</Link></>}<button className="btn btn-primary" disabled={busy} onClick={() => void save()}>{c("Confirm shop details", "Dukaan ki details confirm karo")}</button><button className="btn" disabled={busy} onClick={() => setReview(false)}>{c("Go back", "Wapas")}</button></div> : <form className="grid gap-3" onSubmit={(e) => { e.preventDefault(); setSaved(false); setReview(true); }}><label>{c("Shop name", "Dukaan ka naam")}<input className="input w-full" required maxLength={80} value={name} onChange={(e) => setName(e.target.value)} /></label><label>{c("Shop UPI ID", "Dukaan ki UPI ID")}<input className="input w-full" autoComplete="off" required maxLength={80} pattern="[a-zA-Z0-9._\-]+@[a-zA-Z0-9.\-]+" value={vpa} onChange={(e) => setVpa(e.target.value)} /></label><button className="btn btn-primary">{c("Review shop details", "Dukaan ki details check karo")}</button></form>}
  </section>;
}
