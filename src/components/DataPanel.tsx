"use client";

import { useRef, useState } from "react";
import { api, ApiError } from "@/lib/client/api";
import { ERASE_PHRASE } from "@/lib/erase-phrase";

/** Retention note plus delete-my-data. The shared demo shop shows the note and points to reset instead. */
export function DataPanel({ isDemoShop, onErased }: { isDemoShop: boolean; onErased: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const [phrase, setPhrase] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const matches = phrase.trim().toLowerCase() === ERASE_PHRASE;

  async function erase() {
    if (!matches || busy) return;
    setBusy(true);
    setError(null);
    try {
      await api.eraseMyData(phrase);
      ref.current?.close();
      setPhrase("");
      setDone(true);
      onErased();
    } catch (e) {
      setError(e instanceof ApiError ? e.hint : "Data nahi hata. Dobara try karo.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section aria-labelledby="data-title" className="sticker p-4" data-testid="data-panel">
      <h2 id="data-title" className="text-xl">
        Mera data
      </h2>
      <p className="mt-2" data-testid="retention-note">
        Awaaz kabhi save nahi hoti. Likhe hue sentence entry ke saath rehte hain jab tak aap data nahi hatate. Jo sentence aapne Likh do nahi kiya, woh 30 din baad apne aap hat jaata hai.
      </p>
      {isDemoShop ? (
        <p className="mt-2 text-base">Yeh demo dukaan hai, sab naam kalpanik hain. Data hatane ki jagah Sample dukaan page par Dukaan reset karo use karo.</p>
      ) : (
        <div className="mt-3">
          <button type="button" className="btn" onClick={() => ref.current?.showModal()} data-testid="erase-open">
            Mera data hatao
          </button>
          {done ? (
            <p className="mt-2 font-semibold" role="status">
              Data hata diya.
            </p>
          ) : null}
        </div>
      )}

      <dialog ref={ref} className="sticker m-auto w-[min(92vw,520px)] p-5" aria-labelledby="erase-title" onClose={() => setPhrase("")}>
        <h2 id="erase-title" className="text-[28px]">
          Pura data hata doon?
        </h2>
        <p className="mt-3">Is dukaan ke sab customer, entry, likhe hue sentence, pay link aur note hamesha ke liye hat jaayenge. Yeh wapas nahi aata.</p>
        <label className="mt-3 block font-semibold" htmlFor="erase-phrase">
          Pakka karne ke liye likho: {ERASE_PHRASE}
        </label>
        <input id="erase-phrase" className="input mt-1" value={phrase} onChange={(e) => setPhrase(e.target.value)} autoComplete="off" data-testid="erase-phrase" />
        {error ? (
          <p className="mt-2 font-semibold" role="alert">
            {error}
          </p>
        ) : null}
        <div className="mt-4 flex flex-wrap gap-3">
          <button type="button" className="btn" autoFocus onClick={() => ref.current?.close()}>
            Rehne do
          </button>
          <button type="button" className="btn btn-danger" disabled={!matches || busy} onClick={erase} data-testid="erase-confirm">
            Sab hata do
          </button>
        </div>
      </dialog>
    </section>
  );
}
