"use client";

import { useEffect, useState } from "react";
import { api, type WaStatus } from "@/lib/client/api";

const LABEL: Record<string, string> = {
  CONNECTED: "WhatsApp jura hua hai",
  QR_READY: "Jodne ke liye QR scan karo",
  CONNECTING: "Jud raha hai…",
  DISCONNECTED: "WhatsApp jura nahi hai",
};

/** Shows whether the WhatsApp service is up and a phone is paired. Pairing itself happens on the service's own page. */
export function WaPanel() {
  const [s, setS] = useState<WaStatus | null>(null);
  useEffect(() => {
    let alive = true;
    const load = () =>
      api
        .waStatus()
        .then((r) => alive && setS(r))
        .catch(() => alive && setS(null));
    void load();
    const t = setInterval(load, 15_000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, []);

  if (!s || !s.configured) return null;
  const connected = s.reachable && s.whatsapp === "CONNECTED";
  return (
    <section aria-labelledby="wa-title" className="sticker p-4" data-testid="wa-panel">
      <h2 id="wa-title" className="text-xl">
        WhatsApp
      </h2>
      <p className="mt-2">
        <span className={`ribbon ${connected ? "ribbon-received" : "bg-safed"}`} data-testid="wa-status">
          {s.reachable ? (LABEL[s.whatsapp] ?? s.whatsapp) : "WhatsApp service band hai"}
        </span>
      </p>
      <p className="mt-2 text-base">Login code aur reminder isi se jaate hain. Reminder tabhi jaata hai jab aap “WhatsApp se bhejo” dabate ho.</p>
      {!connected && s.adminUrl ? (
        <a className="btn mt-3 w-fit no-underline" href={s.adminUrl} target="_blank" rel="noopener noreferrer">
          Jodne ke liye kholo
        </a>
      ) : null}
      <p className="mt-3 text-base">Yeh tareeka abhi sirf testing ke liye hai. Alag number use karo, kyunki WhatsApp number ban kar sakta hai.</p>
    </section>
  );
}
