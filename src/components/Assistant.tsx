"use client";

import { useCopy, useLocale } from "./LocaleProvider";

import { useCallback, useEffect, useRef, useState } from "react";
import { api, ApiError } from "@/lib/client/api";
import { interpretText } from "@/lib/interpret";
import { formatINR } from "@/lib/money";
import { SAMPLE_CLIPS, sampleById, sampleDescription } from "@/lib/samples";
import { SEED_CUSTOMERS, SEED_SHOP_ID } from "@/lib/seed";
import type { EntrySource, Proposal } from "@/lib/types";
import { BoloButton, type BoloState } from "./BoloButton";
import { Parchi, type WrittenInfo } from "./Parchi";
import { SampleClips } from "./SampleClips";
import { Toast } from "./Toast";
import { TypeBox } from "./TypeBox";

type Variant = "hero" | "shop" | "try";

interface Props {
  variant: Variant;
  /** landing hero: show this sentence's real interpretation once, with the stamp, without writing */
  previewText?: string;
  showSamples?: boolean;
  onChange?: (info: WrittenInfo) => void;
}

export function Assistant({ variant, previewText, showSamples, onChange }: Props) {
  const L = useCopy();
  const { locale, hint } = useLocale();
  const [bolo, setBolo] = useState<BoloState>("idle");
  const [busy, setBusy] = useState(false);
  const [heard, setHeard] = useState<string | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const [proposal, setProposal] = useState<(Proposal & { source: EntrySource; preview?: boolean }) | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [status, setStatus] = useState("");
  const run = useRef(0);
  const playback = useRef<{ audio: HTMLAudioElement; url: string } | null>(null);
  const speechRun = useRef(0);

  const stopSpeech = useCallback(() => {
    speechRun.current++;
    if (playback.current) {
      playback.current.audio.pause();
      URL.revokeObjectURL(playback.current.url);
      playback.current = null;
    }
  }, []);
  useEffect(() => () => { run.current++; stopSpeech(); }, [stopSpeech]);

  // Landing hero: the real interpreter, in the browser, on one sentence. Nothing is written.
  useEffect(() => {
    if (!previewText) return;
    let alive = true;
    interpretText(previewText, { shopId: SEED_SHOP_ID, customers: SEED_CUSTOMERS, llm: null, now: new Date(), recentEntries: [] }).then((p) => {
      if (alive) {
        setHeard(previewText);
        setProposal({ ...p, token: "preview", source: "text", preview: true });
      }
    });
    return () => {
      alive = false;
    };
  }, [previewText]);

  const speakAnswers = useCallback(async (p: Proposal) => {
    const current = speechRun.current;
    for (const i of p.intents) {
      if (i.kind === "query_balance" && i.balancePaise !== undefined) {
        const name = i.candidates?.[0]?.name ?? i.customer ?? "Customer";
        const text = i.balancePaise > 0 ? L(`${name}, ${formatINR(i.balancePaise)} outstanding.`, `${name}, ${formatINR(i.balancePaise)} baaki hai.`) : i.balancePaise < 0 ? L(`${name}, ${formatINR(-i.balancePaise)} advance.`, `${name}, ${formatINR(-i.balancePaise)} advance hai.`) : L(`${name}, nothing outstanding.`, `${name}, kuch baaki nahi hai.`);
        try {
          const blob = await api.speak(text);
          if (blob && current === speechRun.current) {
            // Only one answer may play at a time; release its URL on every exit path.
            if (playback.current) {
              playback.current.audio.pause();
              URL.revokeObjectURL(playback.current.url);
            }
            const url = URL.createObjectURL(blob);
            const audio = new Audio(url);
            playback.current = { audio, url };
            const release = () => {
              URL.revokeObjectURL(url);
              if (playback.current?.audio === audio) playback.current = null;
            };
            audio.onended = release;
            audio.onerror = release;
            try { await audio.play(); } catch { release(); }
          }
        } catch {
          // read-back is optional; the answer is already on screen as text
        }
      }
    }
  }, [L]);

  const submitText = useCallback(
    async (text: string, source: EntrySource) => {
      stopSpeech();
      const id = ++run.current;
      setBusy(true);
      setProblem(null);
      setHeard(text);
      setStatus(L("Understanding…", "Samajh raha hoon…"));
      try {
        const r = await api.interpret(text, source);
        if (id !== run.current) return;
        setProposal({ ...r.proposal, source });
        setStatus(L("Review the card, then press Record entry.", "Dekho aur Likh do dabao."));
        void speakAnswers(r.proposal);
      } catch (e) {
        if (id !== run.current) return;
        setProposal(null);
        setProblem(locale === "en" ? hint(e, "inputFailed") : e instanceof ApiError ? e.hint : "Samajh nahi aaya. Dobara bolo ya likho.");
        setStatus("");
      } finally {
        if (id === run.current) {
          setBusy(false);
          setBolo("idle");
        }
      }
    },
    [speakAnswers, stopSpeech, L, locale, hint],
  );

  async function onAudio(blob: Blob, mime: string) {
    setProblem(null);
    setStatus(L("Listening…", "Sun raha hoon…"));
    try {
      const t = await api.transcribeAudio(blob, mime);
      await submitText(t.text, "voice");
    } catch (e) {
      setProposal(null);
      setProblem(locale === "en" ? hint(e, "inputFailed") : e instanceof ApiError ? e.hint : "Samajh nahi aaya. Dobara bolo ya likho.");
      setStatus("");
      setBolo("error");
    }
  }

  async function onSample(id: string) {
    const clip = sampleById(id);
    if (!clip) return;
    setBusy(true);
    setProblem(null);
    void new Audio(clip.audioPath).play().catch(() => undefined);
    try {
      const t = await api.transcribeSample(id);
      await submitText(t.text, "sample");
    } catch (e) {
      setBusy(false);
      setProblem(locale === "en" ? hint(e, "inputFailed") : e instanceof ApiError ? e.hint : "Sample nahi chala. Likh kar try karo.");
    }
  }

  function written(info: WrittenInfo) {
    setToast(info.message);
    onChange?.(info);
  }

  const sticky = variant === "shop";
  const heroClips = SAMPLE_CLIPS.slice(0, 2);

  return (
    <div className="grid gap-4">
      <p className="sr-only" role="status" aria-live="polite">
        {status}
      </p>

      {heard || problem || proposal ? (
        <div className="grid gap-3" data-testid="result">
          {heard ? (
            <p className="hand" data-testid="heard">
              {L("I heard", "Maine suna")}: “{heard}”
            </p>
          ) : null}
          {problem ? (
            <p className="rounded-lg border-2 border-syahi bg-safed p-3 font-semibold" role="alert" data-testid="problem">
              {problem}
            </p>
          ) : null}
          {proposal?.intents.map((intent, idx) => (
            <Parchi
              key={`${proposal.token}-${idx}`}
              intent={intent}
              index={idx}
              token={proposal.token ?? ""}
              sourceText={proposal.sourceText}
              source={proposal.source}
              preview={proposal.preview}
              onWritten={written}
            />
          ))}
          {proposal?.preview ? <p className="text-base">{L("This is a preview. Nothing was recorded. Try it below.", "Yeh dikhawa hai, kuch likha nahi gaya. Neeche khud try karo.")}</p> : null}
        </div>
      ) : null}

      <div
        className={sticky ? "fixed inset-x-0 bottom-0 z-10 mx-auto grid max-w-5xl gap-3 border-t-2 border-syahi bg-haldi px-4 pb-4 pt-3 md:px-8" : "grid gap-3"}
        data-testid="controls"
      >
        <div className="flex items-center gap-3">
          <BoloButton state={bolo} onState={setBolo} onAudio={onAudio} onProblem={(m) => setProblem(m)} />
          <TypeBox onSubmit={(t) => void submitText(t, "text")} disabled={busy} />
        </div>
        {variant === "hero" ? (
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold">Try:</span>
            {heroClips.map((c) => (
              <button key={c.id} type="button" className="btn" disabled={busy} onClick={() => void onSample(c.id)}>
                {sampleDescription(c, locale === "en").label}
              </button>
            ))}
          </div>
        ) : null}
        {showSamples && !sticky ? <SampleClips onPick={(id) => void onSample(id)} disabled={busy} showNotes={variant === "try"} /> : null}
      </div>
      {showSamples && sticky ? <SampleClips onPick={(id) => void onSample(id)} disabled={busy} /> : null}

      <Toast message={toast} onGone={() => setToast(null)} />
    </div>
  );
}
