"use client";

import { useState } from "react";
import Link from "next/link";
import { useLocale } from "./LocaleProvider";
import { api } from "@/lib/client/api";

/** Change the passcode. After a WhatsApp-code login (forgotten passcode) the current one is not asked. */
export function PasscodePanel() {
  const { t, hint } = useLocale();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [askingLogout, setAskingLogout] = useState(false);
  const [signedOut, setSignedOut] = useState(false);

  async function submit() {
    setBusy(true);
    setNote(null);
    try {
      await api.changePasscode(next, current || undefined);
      setCurrent("");
      setNext("");
      setSignedOut(true);
      setNote({ ok: true, text: t("passwordChanged") });
    } catch (e) {
      setNote({ ok: false, text: hint(e, "passwordFailed") });
    } finally {
      setBusy(false);
    }
  }

  async function logoutAll() {
    setBusy(true);
    setNote(null);
    try {
      await api.logoutAll();
      setSignedOut(true);
      setAskingLogout(false);
      setNote({ ok: true, text: t("allSignedOut") });
    } catch (e) {
      setNote({ ok: false, text: hint(e, "logoutFailed") });
    } finally { setBusy(false); }
  }

  return (
    <section aria-labelledby="pass-title" className="sticker p-4" data-testid="passcode-panel">
      <h2 id="pass-title" className="text-xl">
        {t("changePassword")}
      </h2>
      {signedOut ? <Link href="/login" className="btn mt-3">{t("signIn")}</Link> : <form
        className="mt-2 grid gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
      >
        <label className="font-semibold" htmlFor="pc-current">
          {t("currentPassword")}
        </label>
        <input id="pc-current" className="input" type="password" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} />
        <label className="font-semibold" htmlFor="pc-next">
          {t("nextPassword")}
        </label>
        <input id="pc-next" className="input" type="password" autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} />
        <button type="submit" className="btn w-fit" disabled={busy || !next}>
          {t("change")}
        </button>
      </form>}
      {!signedOut ? <div className="mt-4 border-t-2 border-syahi pt-4">
        <p>{t("lostPhone")}</p>
        {askingLogout ? <div className="mt-3 flex flex-wrap gap-3">
          <button type="button" className="btn" disabled={busy} onClick={() => void logoutAll()} data-testid="logout-all-confirm">{t("confirmLogoutAll")}</button>
          <button type="button" className="btn" disabled={busy} onClick={() => setAskingLogout(false)}>{t("cancel")}</button>
        </div> : <button type="button" className="btn mt-3" disabled={busy} onClick={() => setAskingLogout(true)} data-testid="logout-all">{t("logoutAll")}</button>}
      </div> : null}
      {note ? (
          <p className="font-semibold" role={note.ok ? "status" : "alert"}>
            {note.text}
          </p>
        ) : null}
    </section>
  );
}
