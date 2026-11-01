"use client";

import { useCopy, useLocale } from "./LocaleProvider";

import { useRef, useState } from "react";
import { api, ApiError } from "@/lib/client/api";
import { ERASE_PHRASE } from "@/lib/erase-phrase";
import Link from "next/link";

/** Retention note plus delete-my-data. The shared demo shop shows the note and points to reset instead. */
export function DataPanel({ isDemoShop, onErased }: { isDemoShop: boolean; onErased: () => void }) {
  const L = useCopy();
  const { locale, hint } = useLocale();
  const ref = useRef<HTMLDialogElement>(null);
  const [phrase, setPhrase] = useState("");
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const matches = phrase.trim().toLowerCase() === ERASE_PHRASE;

  async function erase() {
    if (!matches || busy) return;
    setBusy(true);
    setError(null);
    try {
      await api.eraseMyData(phrase, passcode || undefined);
      ref.current?.close();
      setPhrase("");
      setPasscode("");
      setDone(true);
      onErased();
    } catch (e) {
      setError(locale === "en" ? hint(e, "eraseFailed") : e instanceof ApiError ? e.hint : "Data nahi hata. Dobara try karo.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section aria-labelledby="data-title" className="sticker p-4" data-testid="data-panel">
      <h2 id="data-title" className="text-xl">
        {L("My data", "Mera data")}
      </h2>
      <p className="mt-2" data-testid="retention-note">
        {L("Audio is never stored. Confirmed entry text stays with the entry until you erase your data. Unconfirmed text is removed after 30 days.", "Awaaz kabhi save nahi hoti. Likhe hue sentence entry ke saath rehte hain jab tak aap data nahi hatate. Jo sentence aapne Likh do nahi kiya, woh 30 din baad apne aap hat jaata hai.")}
      </p>
      {isDemoShop ? (
        <p className="mt-2 text-base">{L("This demo shop uses fictional names. Use Reset shop on the Sample shop page to restore its data.", "Yeh demo dukaan hai, sab naam kalpanik hain. Data hatane ki jagah Sample dukaan page par Dukaan reset karo use karo.")}</p>
      ) : (
        <div className="mt-3">
          <button type="button" className="btn" onClick={() => ref.current?.showModal()} data-testid="erase-open">
            {L("Erase my data", "Mera data hatao")}
          </button>
          {done ? (
            <p className="mt-2 font-semibold" role="status">
              {L("Data erased.", "Data hata diya.")}
            </p>
          ) : null}
        </div>
      )}

      <dialog ref={ref} className="sticker m-auto w-[min(92vw,520px)] p-5" aria-labelledby="erase-title" onClose={() => { setPhrase(""); setPasscode(""); }}>
        <h2 id="erase-title" className="text-[28px]">
          {L("Erase all shop data?", "Pura data hata doon?")}
        </h2>
        <p className="mt-3">{L("All customers, entries, recorded sentences, pay links and notes for this shop will be permanently erased. This cannot be undone.", "Is dukaan ke sab customer, entry, likhe hue sentence, pay link aur note hamesha ke liye hat jaayenge. Yeh wapas nahi aata.")}</p>
        <label className="mt-3 block font-semibold" htmlFor="erase-phrase">
          {L("To confirm, type", "Pakka karne ke liye likho")}: {ERASE_PHRASE}
        </label>
        <input id="erase-phrase" className="input mt-1" value={phrase} onChange={(e) => setPhrase(e.target.value)} autoComplete="off" data-testid="erase-phrase" />
        <label className="mt-3 block font-semibold" htmlFor="erase-password">{L("Current password", "Abhi ka password")}</label>
        <input id="erase-password" className="input mt-1" type="password" autoComplete="current-password" maxLength={128} value={passcode} onChange={(e) => setPasscode(e.target.value)} data-testid="erase-password" />
        <p className="mt-2 text-base">{L("Confirm your password, or leave it blank if you signed in with a WhatsApp code within the last 15 minutes.", "Password do, ya pichhle 15 minute mein WhatsApp code se login kiya ho toh khali chhodo.")}</p>
        <Link className="underline" href="/login?reauth=1">{L("Sign in again with WhatsApp", "WhatsApp se dobara login karo")}</Link>
        {error ? (
          <p className="mt-2 font-semibold" role="alert">
            {error}
          </p>
        ) : null}
        <div className="mt-4 flex flex-wrap gap-3">
          <button type="button" className="btn" autoFocus onClick={() => ref.current?.close()}>
            {L("Cancel", "Rehne do")}
          </button>
          <button type="button" className="btn btn-danger" disabled={!matches || busy} onClick={erase} data-testid="erase-confirm">
            {L("Erase everything", "Sab hata do")}
          </button>
        </div>
      </dialog>
    </section>
  );
}
