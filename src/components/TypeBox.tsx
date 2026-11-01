"use client";

import { useCopy } from "./LocaleProvider";

import { useEffect, useRef, useState } from "react";
import { call } from "@/lib/client/api";
import { clearDraft, readDraft, saveDraft } from "@/lib/client/drafts";

/** Typed fallback. Always visible under Bolo, and produces exactly the same card. */
export function TypeBox({ onSubmit, disabled, initial = "" }: { onSubmit: (text: string) => void; disabled?: boolean; initial?: string }) {
  const L = useCopy();
  const [text, setText] = useState(initial);
  const [scope, setScope] = useState<string | null>(null);
  const currentScope = useRef<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [consent, setConsent] = useState(false);
  const [offline, setOffline] = useState(false);
  useEffect(() => {
    let mounted = true;
    const refresh = async () => {
      setOffline(!navigator.onLine);
      if (!navigator.onLine) return;
      try {
        const result = await call<{ scope: string | null }>("/api/draft-scope");
        if (mounted) {
          if (currentScope.current && currentScope.current !== result.scope) { clearDraft(); setText(""); }
          currentScope.current = result.scope;
          setScope(result.scope); setSaved(result.scope ? readDraft(result.scope)?.text ?? null : null);
        }
      } catch { if (mounted) { setScope(null); setSaved(null); } }
    };
    const lost = () => setOffline(true);
    const reset = () => { try { sessionStorage.removeItem("dukaan-dost:typed-draft:v1"); } catch { /* browser can block storage */ } setSaved(null); setText(""); setScope(null); currentScope.current = null; setConsent(false); };
    const channel = "BroadcastChannel" in window ? new BroadcastChannel("dukaan-dost:auth-change") : null;
    if (channel) channel.onmessage = (event) => { if (event.data === "clear-draft") reset(); };
    void refresh(); window.addEventListener("online", refresh); window.addEventListener("offline", lost);
    window.addEventListener("focus", refresh); window.addEventListener("dukaan:drafts-clear", reset);
    return () => { mounted = false; window.removeEventListener("online", refresh); window.removeEventListener("offline", lost); window.removeEventListener("focus", refresh); window.removeEventListener("dukaan:drafts-clear", reset); channel?.close(); };
  }, []);
  async function restore() {
    try {
      const result = await call<{ scope: string | null }>("/api/draft-scope");
      if (!result.scope || result.scope !== currentScope.current) { clearDraft(); setSaved(null); setNote("account-changed"); return; }
      const draft = readDraft(result.scope);
      if (!draft) { setSaved(null); setNote("deleted"); return; }
      setText(draft.text); setNote("restored");
    } catch { setNote("restore-unavailable"); }
  }
  const submit = () => {
    const t = text.trim();
    if (!t || offline) return;
    onSubmit(t);
  };
  return (
    <div className="grid w-full gap-2">
    <form
      className="flex w-full gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      <label className="sr-only" htmlFor="typebox">
        {L("Type here", "Yahan likho")}
      </label>
      <input
        id="typebox"
        className="input"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={L("Type here", "Yahan likho")}
        maxLength={400}
        autoComplete="off"
        enterKeyHint="send"
      />
      <button type="submit" className="btn btn-primary" disabled={disabled || offline || !text.trim()}>
        {L("Write", "Likho")}
      </button>
    </form>
    <details className="text-base">
      <summary className="cursor-pointer py-2 underline">{L("Keep a typed draft in this tab", "Isi tab mein likha draft rakho")}</summary>
      <div className="grid gap-2 border-2 border-syahi bg-safed p-3">
        <p>{L("Optional. Only typed text is saved in this browser tab, for up to 24 hours. It can contain customer names. Avoid shared devices. Nothing is queued or sent automatically.", "Optional hai. Sirf likha text isi browser tab mein 24 ghante tak rahega. Ismein customer ka naam ho sakta hai. Shared device par mat rakho. Apne aap kuch nahi bhejenge.")}</p>
        <label className="flex min-h-12 items-center gap-2"><input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />{L("Save this draft on this device", "Yeh draft is device par rakho")}</label>
        <div className="flex flex-wrap gap-2"><button type="button" className="chip" disabled={!consent || !scope || !text.trim()} onClick={() => {
          if (!scope) return;
          try { saveDraft(scope, text); setSaved(text); setNote("saved"); } catch { setNote("unavailable"); }
        }}>{L("Save draft", "Draft rakho")}</button>
        {saved !== null ? <><button type="button" className="chip" disabled={offline} onClick={() => void restore()}>{L("Restore draft for review", "Draft wapas laakar check karo")}</button><button type="button" className="chip" onClick={() => { clearDraft(false); setSaved(null); setNote("deleted"); }}>{L("Delete saved draft", "Saved draft hatao")}</button></> : null}</div>
        {!scope ? <p>{L("Connect and sign in before saving or restoring a shop draft.", "Dukaan ka draft rakhne ya kholne se pehle net jodo aur login karo.")}</p> : null}
        {note ? <p role="status">{note === "saved" ? L("Draft saved in this tab. No ledger entry was recorded.", "Draft isi tab mein raha. Khate mein entry nahi likhi.") : note === "restored" ? L("Draft restored. Review it and create a fresh confirmation card when online.", "Draft wapas aa gaya. Net par nayi parchi banakar check karo.") : note === "deleted" ? L("Saved draft deleted.", "Saved draft hata diya.") : note === "account-changed" ? L("The account changed. The old draft was removed.", "Account badal gaya. Purana draft hata diya.") : note === "restore-unavailable" ? L("Connect and verify your account before restoring a draft.", "Draft wapas laane se pehle net aur account check karo.") : L("This browser could not save the draft.", "Is browser mein draft nahi rakh sake.")}</p> : null}
      </div>
    </details>
    </div>
  );
}
