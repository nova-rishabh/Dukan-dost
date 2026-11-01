"use client";

import { useCopy } from "./LocaleProvider";

import { useEffect, useRef, useState } from "react";

export type BoloState = "idle" | "recording" | "processing" | "error";

const MAX_MS = 30_000;
const HOLD_MS = 450;

function pickMime(): string {
  if (typeof MediaRecorder === "undefined") return "";
  for (const m of ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"]) if (MediaRecorder.isTypeSupported(m)) return m;
  return "";
}

/**
 * Push-to-talk. Hold to record and release to send, or tap once to start and tap again to stop
 * (also Enter and Space). A live level ring shows the owner the mic can hear them.
 */
export function BoloButton({
  state,
  onState,
  onAudio,
  onProblem,
}: {
  state: BoloState;
  onState: (s: BoloState) => void;
  onAudio: (blob: Blob, mime: string) => void;
  onProblem: (message: string) => void;
}) {
  const L = useCopy();
  const btn = useRef<HTMLButtonElement>(null);
  const rec = useRef<MediaRecorder | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const context = useRef<AudioContext | null>(null);
  const starting = useRef(false);
  const generation = useRef(0);
  const chunks = useRef<Blob[]>([]);
  const startedAt = useRef(0);
  const raf = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [pressed, setPressed] = useState(false);

  useEffect(() => () => {
    generation.current++;
    const r = rec.current;
    if (r) { r.onstop = null; r.ondataavailable = null; if (r.state !== "inactive") r.stop(); }
    rec.current = null;
    cleanup();
  }, []);

  function cleanup() {
    cancelAnimationFrame(raf.current);
    if (context.current) { void context.current.close().catch(() => undefined); context.current = null; }
    if (timer.current) clearTimeout(timer.current);
    stream.current?.getTracks().forEach((t) => t.stop());
    stream.current = null;
    btn.current?.style.setProperty("--level", "0");
  }

  async function start() {
    if (rec.current || starting.current) return;
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      onProblem(L("This browser does not support the microphone. Type your entry instead.", "Is browser mein mic nahi chalta. Likh kar bolo."));
      onState("error");
      return;
    }
    starting.current = true;
    const current = generation.current;
    try {
      const s = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, channelCount: 1, sampleRate: 16000 },
      });
      if (current !== generation.current) { s.getTracks().forEach((t) => t.stop()); return; }
      stream.current = s;
      const mime = pickMime();
      const r = new MediaRecorder(s, mime ? { mimeType: mime } : undefined);
      chunks.current = [];
      r.ondataavailable = (e) => e.data.size > 0 && chunks.current.push(e.data);
      r.onstop = () => {
        const type = r.mimeType || mime || "audio/webm";
        const blob = new Blob(chunks.current, { type });
        rec.current = null;
        cleanup();
        if (blob.size < 800) {
          onProblem(L("No speech was heard. Speak again or type your entry.", "Kuch sunai nahi diya. Dobara bolo ya likho."));
          onState("error");
          return;
        }
        onState("processing");
        onAudio(blob, type);
      };
      rec.current = r;
      startedAt.current = Date.now();
      r.start();
      onState("recording");
      timer.current = setTimeout(stop, MAX_MS);
      meter(s);
    } catch {
      rec.current = null;
      cleanup();
      if (current !== generation.current) return;
      onProblem(L("Microphone access is blocked. Allow access or type below.", "Mic band hai. Allow karo, ya neeche likh kar bolo."));
      onState("error");
    } finally { starting.current = false; }
  }

  function meter(s: MediaStream) {
    try {
      const ctx = new AudioContext();
      context.current = ctx;
      const src = ctx.createMediaStreamSource(s);
      const an = ctx.createAnalyser();
      an.fftSize = 256;
      src.connect(an);
      const buf = new Uint8Array(an.frequencyBinCount);
      const tick = () => {
        an.getByteTimeDomainData(buf);
        let peak = 0;
        for (const v of buf) peak = Math.max(peak, Math.abs(v - 128));
        btn.current?.style.setProperty("--level", String(Math.min(1, peak / 64)));
        raf.current = requestAnimationFrame(tick);
      };
      tick();
    } catch {
      // the meter is a nicety; recording still works without it
    }
  }

  function stop() {
    const r = rec.current;
    if (r && r.state !== "inactive") r.stop();
  }

  return (
    <button
      ref={btn}
      type="button"
      className="bolo"
      data-state={state}
      data-testid="bolo"
      aria-pressed={state === "recording" || pressed}
      aria-label={state === "recording" ? L("Recording, press to stop", "Bol raha hoon, rokne ke liye dabao") : L("Speak", "Bolo")}
      disabled={state === "processing"}
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture?.(e.pointerId);
        setPressed(true);
        if (rec.current) stop();
        else void start();
      }}
      onPointerUp={() => {
        setPressed(false);
        if (rec.current && Date.now() - startedAt.current > HOLD_MS) stop();
      }}
      onPointerCancel={() => {
        setPressed(false);
        generation.current++;
        const r = rec.current;
        if (r) { r.onstop = null; r.ondataavailable = null; if (r.state !== "inactive") r.stop(); }
        rec.current = null;
        cleanup();
        onState("idle");
      }}
      onClick={(e) => {
        // keyboard activation (Enter / Space) arrives as click with detail 0
        if (e.detail === 0) {
          if (rec.current) stop();
          else void start();
        }
      }}
    >
      {state === "processing" ? (
        <span className="spinner" aria-hidden="true" />
      ) : (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="9" y="3" width="6" height="11" rx="3" />
          <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
        </svg>
      )}
      <span className="text-sm">{state === "processing" ? L("Wait", "Ruko") : state === "error" ? L("Retry", "Dobara") : L("Speak", "Bolo")}</span>
    </button>
  );
}
