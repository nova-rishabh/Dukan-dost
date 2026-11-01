"use client";

import { useCopy } from "./LocaleProvider";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api, post } from "@/lib/client/api";
import { Assistant } from "./Assistant";

export function TryClient({ needsWorkspace = false }: { needsWorkspace?: boolean }) {
  const L = useCopy();
  const [note, setNote] = useState<string | null>(null);
  const [ready, setReady] = useState(!needsWorkspace);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (needsWorkspace) void api.me().then((me) => setReady(me.isDemoShop)).catch(() => setReady(false));
  }, [needsWorkspace]);
  if (!ready) return <div className="sticker grid gap-4 p-5">
    <p>{L("Open a private fictional sample shop for this browser. Its records disappear after 30 minutes or a server restart. Your real shop stays separate. Please use fictional details only.", "Is browser ke liye alag kalpanik dukaan kholo. 30 minute ya server restart ke baad sample mit jayega. Asli dukaan alag rahegi. Sirf kalpanik details use karo.")}</p>
    <button className="btn btn-primary" disabled={busy} onClick={async () => {
      setBusy(true); setNote(null);
      try { await post("/api/demo/start", {}); window.location.reload(); }
      catch { setNote(L("The sample shop could not open. Please try again.", "Sample dukaan nahi khuli. Dobara try karo.")); }
      finally { setBusy(false); }
    }}>{L("Start private sample shop", "Alag sample dukaan kholo")}</button>
    {note ? <p role="alert">{note}</p> : null}
  </div>;
  return (
    <>
      <Assistant variant="try" showSamples />
      {needsWorkspace ? <p className="sticker p-3" role="note">{L("Fictional practice only. No real WhatsApp messages or payments are sent. This sample expires after 30 minutes.", "Sirf kalpanik practice. Asli WhatsApp message ya payment nahi bheja jayega. Sample 30 minute mein khatam hoga.")}</p> : null}
      <div className="btn-grid">
        <Link href="/shop" className="btn btn-primary">
          {L("View full ledger", "Poora khata dekho")}
        </Link>
        <button
          type="button"
          className="btn"
          onClick={async () => {
            try {
              await api.resetDemo();
              setNote(L("The sample shop has been reset.", "Dukaan shuru jaisi ho gayi."));
            } catch {
              setNote(L("The shop could not be reset.", "Reset nahi ho paya."));
            }
          }}
        >
          {L("Reset shop", "Dukaan reset karo")}
        </button>
        {note ? <span role="status">{note}</span> : null}
      </div>
    </>
  );
}
