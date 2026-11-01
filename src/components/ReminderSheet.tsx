"use client";

import { useCopy, useLocale } from "./LocaleProvider";

import { useCallback, useEffect, useRef, useState } from "react";
import { api, call, ApiError } from "@/lib/client/api";
import { buildWaUrl } from "@/lib/remind";

/**
 * A draft first. The owner edits the text, then either opens their own WhatsApp (wa.me) or, when the
 * WhatsApp service is paired, taps L("Send through WhatsApp", "WhatsApp se bhejo") and confirms. Nothing is sent automatically.
 * A consented saved number may prefill the recipient. Changes here are only for this one message.
 */
export function ReminderSheet({ customerId, customerName, onClose }: { customerId: string; customerName: string; onClose: () => void }) {
  const L = useCopy();
  const { locale, hint } = useLocale();
  const ref = useRef<HTMLDialogElement>(null);
  const [text, setText] = useState("");
  const [payUrl, setPayUrl] = useState("");
  const [phone, setPhone] = useState("");
  const phoneEdited = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const [canSend, setCanSend] = useState(false);
  const [adminUrl, setAdminUrl] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [opened, setOpened] = useState(false);
  const [locked, setLocked] = useState(false);
  const [stale, setStale] = useState(false);

  const loadDraft = useCallback(async () => {
    setBusy(true); setError(null); setConfirming(false);
    try {
      const draft = await api.remind(customerId, locale);
      setText(draft.text); setPayUrl(draft.payUrl); setStale(false);
    } catch (e) { setError(locale === "en" ? hint(e, "draftFailed") : e instanceof ApiError ? e.hint : "Reminder nahi bana. Dobara try karo."); }
    finally { setBusy(false); }
  }, [customerId, locale, hint]);

  useEffect(() => {
    const d = ref.current;
    if (d && !d.open) d.showModal();
    void loadDraft();
    let active = true;
    void call<{ phone: string | null }>(`/api/customers/${encodeURIComponent(customerId)}/contact`).then((r) => {
      if (active && !phoneEdited.current && r.phone) setPhone(r.phone);
    }).catch(() => { /* the owner can always type the recipient for this message */ });
    api
      .waStatus()
      .then((s) => {
        setCanSend(s.configured && s.reachable && s.whatsapp === "CONNECTED");
        setAdminUrl(s.configured && !(s.reachable && s.whatsapp === "CONNECTED") ? s.adminUrl : null);
      })
      .catch(() => setCanSend(false));
    return () => { active = false; };
  }, [customerId, loadDraft]);

  async function send() {
    if (busy || locked || stale) return;
    setBusy(true);
    setResult(null);
    setError(null);
    try {
      const r = await api.sendReminder({ customerId, phone, text, payUrl });
      if (typeof r.sent !== "boolean" || typeof r.simulated !== "boolean" || r.sent === r.simulated) throw new Error("Unrecognized delivery response");
      setLocked(true);
      setResult(r.sent ? L("Sent from your connected WhatsApp number.", "Bhej diya. Message aapke WhatsApp number se gaya.") : L("Test mode: no message was sent.", "Test mode hai: message abhi bheja nahi gaya."));
      setConfirming(false);
    } catch (e) {
      const uncertain = !(e instanceof ApiError) || e.status >= 500 || ["delivery_unknown", "draft_already_used", "network", "timeout", "aborted", "internal", "unknown"].includes(e.code);
      if (uncertain) setLocked(true);
      if (e instanceof ApiError && ["draft_stale", "draft_expired"].includes(e.code)) setStale(true);
      setError(uncertain ? L("Delivery is uncertain. Check the customer’s WhatsApp before sending again.", "Message gaya ya nahi, pakka nahi hai. Customer ka WhatsApp check karo. Dobara bhejne se pehle jaanch lo.") : locale === "en" ? hint(e, "reminderFailed") : e instanceof ApiError ? e.hint : "Message nahi ja paya.");
      setConfirming(false);
    } finally {
      setBusy(false);
    }
  }

  return (
    <dialog
      ref={ref}
      className="sticker m-auto w-[min(92vw,560px)] p-5"
      aria-labelledby="remind-title"
      onClose={onClose}
      onClick={(e) => {
        if (e.target === ref.current) ref.current?.close();
      }}
    >
      <h2 id="remind-title" className="text-[28px]">
        {L(`Remind ${customerName}`, `${customerName} ko yaad dilao`)}
      </h2>
      {error && !text ? (
        <p className="mt-3 font-semibold" role="alert">
          {error}
        </p>
      ) : (
        <>
          <label className="mt-3 block font-semibold" htmlFor="remind-text">
            {L("Review this message (you can edit it)", "Yeh message jayega (badal sakte ho)")}
          </label>
          <textarea id="remind-text" className="input mt-1 min-h-[150px] rounded-2xl py-3" disabled={busy || locked} value={text} onChange={(e) => { setText(e.target.value); setConfirming(false); }} data-testid="remind-text" />
          <label className="mt-3 block font-semibold" htmlFor="remind-phone">
            {L("Customer's WhatsApp number", "Customer ka WhatsApp number")}
          </label>
          <input id="remind-phone" className="input mt-1" type="tel" inputMode="tel" disabled={busy || locked} value={phone} onChange={(e) => { phoneEdited.current = true; setPhone(e.target.value); setConfirming(false); }} placeholder={L("Include country code, e.g. +91… Not saved here", "Desh code ke saath, jaise +91… Save nahi hota")} autoComplete="off" data-testid="remind-phone" />
          <p className="mt-3 text-base">Pay link: {payUrl}</p>

          {canSend ? (
            confirming ? (
              <div className="sticker mt-3 bg-haldi p-3" role="group" aria-label={L("Confirm before sending", "Bhejne se pehle pakka karo")}>
                <p className="font-semibold">{L(`Send this message to ${phone}?`, `Pakka bhejun? Yeh message ${phone} par jayega.`)}</p>
                <div className="mt-2 flex flex-wrap gap-3">
                  <button type="button" className="btn btn-reminder" onClick={send} disabled={busy || locked || stale} data-testid="remind-send-confirm">
                    {L("Yes, send", "Haan, bhejo")}
                  </button>
                  <button type="button" className="btn" onClick={() => setConfirming(false)} disabled={busy}>
                    {L("No", "Nahi")}
                  </button>
                </div>
              </div>
            ) : (
              <button type="button" className="btn btn-reminder mt-3" onClick={() => setConfirming(true)} disabled={busy || locked || stale || !phone.trim() || !text.trim()} data-testid="remind-send">
                {L("Send through WhatsApp", "WhatsApp se bhejo")}
              </button>
            )
          ) : adminUrl ? (
            <p className="mt-3 text-base">
              {L("WhatsApp is disconnected, so direct sending is unavailable.", "WhatsApp jura nahi hai, isliye seedha bhejna band hai.")}{" "}
              <a href={adminUrl} target="_blank" rel="noopener noreferrer" className="underline">
                {L("Open connection settings", "Jodne ke liye kholo")}
              </a>
              .
            </p>
          ) : null}

          {!locked ? <button type="button" className="btn mt-3" disabled={busy} onClick={() => void loadDraft()} data-testid="remind-refresh">{L("Create a fresh draft", "Naya message banao")}</button> : null}

          {result ? (
            <p className="mt-3 font-semibold" role="status" data-testid="remind-result">
              {result}
            </p>
          ) : null}
          {error ? (
            <p className="mt-3 font-semibold" role="alert">
              {error}
            </p>
          ) : null}

          <p className="mt-3 text-base">{L("Messages are sent only after you confirm Send through WhatsApp or press Send in your own WhatsApp.", "Hum khud kuch nahi bhejte. Ya to aap “WhatsApp se bhejo” dabate ho, ya apne WhatsApp mein khol kar Send dabate ho.")}</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <a className="btn no-underline" aria-disabled={busy || locked || stale} href={busy || locked || stale ? undefined : buildWaUrl({ text, phone })} target="_blank" rel="noopener noreferrer" onClick={() => setOpened(true)} data-testid="wa-open">
              {L("Open WhatsApp", "WhatsApp kholo")}
            </a>
            <button type="button" className="btn" onClick={() => ref.current?.close()}>
              {L("Close", "Band karo")}
            </button>
          </div>
          {opened ? <p className="mt-2 text-base">{L("WhatsApp opened. Press Send there.", "WhatsApp khul gaya. Send wahan se dabao.")}</p> : null}
        </>
      )}
    </dialog>
  );
}
