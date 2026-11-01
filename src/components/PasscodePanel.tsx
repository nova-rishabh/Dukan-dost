"use client";

import { useState } from "react";
import { api, ApiError } from "@/lib/client/api";

/** Change the passcode. After a WhatsApp-code login (forgotten passcode) the current one is not asked. */
export function PasscodePanel() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    setNote(null);
    try {
      await api.changePasscode(next, current || undefined);
      setCurrent("");
      setNext("");
      setNote({ ok: true, text: "Passcode badal diya." });
    } catch (e) {
      setNote({ ok: false, text: e instanceof ApiError ? e.hint : "Passcode nahi badla. Dobara try karo." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <section aria-labelledby="pass-title" className="sticker p-4" data-testid="passcode-panel">
      <h2 id="pass-title" className="text-xl">
        Passcode badlo
      </h2>
      <form
        className="mt-2 grid gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
      >
        <label className="font-semibold" htmlFor="pc-current">
          Abhi ka passcode
        </label>
        <input id="pc-current" className="input" type="password" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} />
        <label className="font-semibold" htmlFor="pc-next">
          Naya passcode (kam se kam 8 akshar)
        </label>
        <input id="pc-next" className="input" type="password" autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} />
        <button type="submit" className="btn w-fit" disabled={busy || !next}>
          Badlo
        </button>
        {note ? (
          <p className="font-semibold" role={note.ok ? "status" : "alert"}>
            {note.text}
          </p>
        ) : null}
      </form>
    </section>
  );
}
