"use client";

import { useEffect, useRef, useState } from "react";
import { api, ApiError } from "@/lib/client/api";
import { buildWaUrl } from "@/lib/remind";

/**
 * A draft, never a send. The owner edits the text, opens WhatsApp, and presses Send there.
 * The optional number is used only to build the link in this browser; it is not stored or logged.
 */
export function ReminderSheet({ customerId, customerName, onClose }: { customerId: string; customerName: string; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const [text, setText] = useState("");
  const [payUrl, setPayUrl] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [opened, setOpened] = useState(false);

  useEffect(() => {
    const d = ref.current;
    if (d && !d.open) d.showModal();
    api
      .remind(customerId)
      .then((r) => {
        setText(r.text);
        setPayUrl(r.payUrl);
      })
      .catch((e) => setError(e instanceof ApiError ? e.hint : "Reminder nahi bana. Dobara try karo."));
  }, [customerId]);

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
        {customerName} ko yaad dilao
      </h2>
      {error ? (
        <p className="mt-3 font-semibold" role="alert">
          {error}
        </p>
      ) : (
        <>
          <label className="mt-3 block font-semibold" htmlFor="remind-text">
            Yeh message jayega (badal sakte ho)
          </label>
          <textarea id="remind-text" className="input mt-1 min-h-[150px] rounded-2xl py-3" value={text} onChange={(e) => setText(e.target.value)} data-testid="remind-text" />
          <label className="mt-3 block font-semibold" htmlFor="remind-phone">
            WhatsApp number (zaroori nahi)
          </label>
          <input id="remind-phone" className="input mt-1" type="tel" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Desh code ke saath (91...). Save nahi hota" autoComplete="off" />
          <p className="mt-3 text-base">Pay link: {payUrl}</p>
          <p className="mt-1 text-base">Hum khud kuch nahi bhejte. WhatsApp khulega, Send aap dabaoge.</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <a
              className="btn btn-reminder no-underline"
              href={buildWaUrl({ text, phone })}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setOpened(true)}
              data-testid="wa-open"
            >
              WhatsApp kholo
            </a>
            <button type="button" className="btn" onClick={() => ref.current?.close()}>
              Band karo
            </button>
          </div>
          {opened ? <p className="mt-2 text-base">WhatsApp khul gaya. Send wahan se dabao.</p> : null}
        </>
      )}
    </dialog>
  );
}
