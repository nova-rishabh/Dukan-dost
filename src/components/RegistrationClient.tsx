"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { api, call, post } from "@/lib/client/api";
import { useLocale } from "./LocaleProvider";
import { Munshi } from "./Munshi";

export function RegistrationClient({ purpose }: { purpose: "signup" | "recovery" }) {
  const { locale, hint } = useLocale();
  const en = locale === "en";
  const copy = (a: string, b: string) => en ? a : b;
  const [state, setState] = useState("loading");
  const [mobile, setMobile] = useState("");
  const [captcha, setCaptcha] = useState<{ captchaId: string; svg: string } | null>(null);
  const [captchaLoading, setCaptchaLoading] = useState(true);
  const captchaPending = useRef(false);
  const [captchaCode, setCaptchaCode] = useState("");
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [shopName, setShopName] = useState("");
  const [passcode, setPasscode] = useState("");
  const [repeat, setRepeat] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const loadCaptcha = useCallback(async () => {
    if (captchaPending.current) return;
    captchaPending.current = true;
    setCaptchaLoading(true);
    setCaptcha(null); setCaptchaCode("");
    try { setCaptcha(await api.waCaptcha()); }
    catch (e) { setError(hint(e, "captchaFailed")); }
    finally { captchaPending.current = false; setCaptchaLoading(false); }
  }, [hint]);
  const status = useCallback(async () => {
    try {
      const result = await call<{ state: string; purpose: string }>("/api/auth/register/status");
      setState(result.purpose === purpose ? result.state : "details");
    } catch { setState("details"); }
  }, [purpose]);
  useEffect(() => { void status(); }, [status]);
  useEffect(() => { if (state === "details") void loadCaptcha(); }, [state, loadCaptcha]);
  async function run(fn: () => Promise<void>) {
    setBusy(true); setError(null);
    try { await fn(); }
    catch (e) { setError(hint(e, "requestFailed")); }
    finally { setBusy(false); }
  }
  const verified = state === "verified" || state === "completed";
  return <div className="mx-auto grid max-w-xl gap-4 px-4 pb-12">
    <div className="flex items-center gap-3"><Munshi /><h1 className="text-4xl">{purpose === "signup" ? copy("Open your shop", "Apni dukaan kholo") : copy("Recover your account", "Account wapas kholo")}</h1></div>
    <p>{copy("Verify your WhatsApp number. Each shop keeps its own private records.", "Apna WhatsApp number verify karo. Har dukaan ka hisaab alag rehta hai.")}</p>
    {purpose === "recovery" ? <p>{copy("Use your registered WhatsApp number. If you lost that number, this recovery flow cannot verify you.", "Wahi registered WhatsApp number chahiye. Number kho gaya ho toh yahan se verification nahi hoga.")}</p> : <p>{copy("No setup code or password is needed to create a shop. An already registered number opens its existing shop.", "Dukaan banane ke liye setup code ya password nahi chahiye. Registered number se purani dukaan khulegi.")}</p>}
    {state === "loading" ? <p role="status">{copy("Checking verification…", "Verification dekh rahe hain…")}</p> : verified ? <form className="sticker grid gap-3 p-4" onSubmit={(e) => { e.preventDefault(); void run(async () => {
      if (passcode !== repeat) { setError(copy("Passwords do not match.", "Passwords ek jaise nahi hain.")); return; }
      await post("/api/auth/register/complete", { ...(purpose === "signup" ? { name, shopName } : {}), ...(passcode ? { passcode } : {}), confirmed });
      window.location.assign("/shop");
    }); }}>
      <p role="status" className="font-semibold">{copy("WhatsApp verified. Review before continuing.", "WhatsApp verify ho gaya. Aage badhne se pehle dekho.")}</p>
      {purpose === "signup" ? <><label>{copy("Your name", "Aapka naam")}<input className="input w-full" required maxLength={80} autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} /></label><label>{copy("Shop name", "Dukaan ka naam")}<input className="input w-full" required maxLength={100} value={shopName} onChange={(e) => setShopName(e.target.value)} /></label></> : null}
      <label>{purpose === "signup" ? copy("Password (optional)", "Password (zaroori nahi)") : copy("New password", "Naya password")}<input className="input w-full" type="password" required={purpose === "recovery"} minLength={8} maxLength={128} autoComplete="new-password" value={passcode} onChange={(e) => setPasscode(e.target.value)} /></label>
      <p>{copy("If you set a password, use at least 8 characters with letters and numbers.", "Password rakho toh kam se kam 8 akshar, letters aur numbers rakho.")}</p>
      {passcode ? <label>{copy("Repeat password", "Password dobara")}<input className="input w-full" type="password" required autoComplete="new-password" value={repeat} onChange={(e) => setRepeat(e.target.value)} /></label> : null}
      <label className="flex gap-3"><input className="h-6 w-6 shrink-0" type="checkbox" required checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} />{purpose === "signup" ? copy("I confirm these details and want to open my shop.", "Details sahi hain, meri dukaan kholo.") : copy("Replace my password and sign out my other sessions.", "Password badlo aur doosre sessions band karo.")}</label>
      <button className="btn btn-primary" disabled={busy || !confirmed}>{purpose === "signup" ? copy("Confirm and open shop", "Pakki karke dukaan kholo") : copy("Confirm recovery", "Recovery pakki karo")}</button>
    </form> : state === "requested" || state === "verifying" ? <form className="sticker grid gap-3 p-4" onSubmit={(e) => { e.preventDefault(); void run(async () => { const result = await post<{ state: string }>("/api/auth/register/verify", { code }); setState(result.state); }); }}>
      <label>{copy("WhatsApp verification code", "WhatsApp ka verification code")}<input className="input w-full" inputMode="numeric" autoComplete="one-time-code" maxLength={6} pattern="[0-9]{6}" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} /></label>
      <button className="btn btn-primary" disabled={busy || code.length !== 6 || state === "verifying"}>{copy("Verify code", "Code verify karo")}</button>
      <button className="btn" type="button" disabled={busy} onClick={() => void status()}>{copy("Check verification status", "Verification status dekho")}</button>
      <button className="chip" type="button" disabled={busy} onClick={() => { setState("details"); setCode(""); setError(null); }}>{copy("Request a new code", "Naya code maango")}</button>
    </form> : <form className="sticker grid gap-3 p-4" onSubmit={(e) => { e.preventDefault(); void run(async () => {
      if (!captcha) return;
      try { const result = await post<{ state: string }>("/api/auth/register/start", { purpose, mobile, captchaId: captcha.captchaId, captchaCode }); setState(result.state); }
      catch (e) { void loadCaptcha(); throw e; }
    }); }}>
      <label>{copy("WhatsApp number", "WhatsApp number")}<input className="input w-full" type="tel" autoComplete="tel" required value={mobile} onChange={(e) => setMobile(e.target.value)} /></label>
      <div className="flex flex-wrap items-center gap-3">{captcha ? <img src={`data:image/svg+xml;utf8,${encodeURIComponent(captcha.svg)}`} alt={copy("Verification image", "Verification tasveer")} width={180} height={60} /> : captchaLoading ? <p role="status" aria-busy="true">{copy("Loading verification image…", "Verification tasveer aa rahi hai…")}</p> : <p>{copy("Verification image unavailable", "Verification tasveer nahi mili")}</p>}<button className="chip" type="button" disabled={busy || captchaLoading} onClick={() => void loadCaptcha()}>{copy("New image", "Nayi tasveer")}</button></div>
      <label>{copy("Characters in image", "Tasveer ke akshar")}<input className="input w-full" autoComplete="off" required maxLength={8} value={captchaCode} onChange={(e) => setCaptchaCode(e.target.value)} /></label>
      <button className="btn btn-primary" disabled={busy || !captcha || !captchaCode.trim()}>{copy("Send WhatsApp code", "WhatsApp code bhejo")}</button>
    </form>}
    {busy ? <p role="status" aria-busy="true">{copy("Please wait…", "Thoda ruko…")}</p> : null}
    {error ? <div role="alert"><p>{error}</p><button type="button" className="chip" onClick={() => void status()}>{copy("Check status before retrying", "Dobara karne se pehle status dekho")}</button></div> : null}
    <div className="flex flex-wrap gap-3"><Link className="underline" href="/login">{copy("Sign in", "Login karo")}</Link><Link className="underline" href={purpose === "signup" ? "/recover" : "/signup"}>{purpose === "signup" ? copy("Recover account", "Account wapas kholo") : copy("Create a shop", "Dukaan banao")}</Link></div>
  </div>;
}
