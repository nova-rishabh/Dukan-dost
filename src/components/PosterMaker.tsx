"use client";

import { useCopy, useLocale } from "./LocaleProvider";

import { toPng } from "html-to-image";
import { useRef, useState } from "react";
import { api, ApiError } from "@/lib/client/api";
import type { PosterSpec } from "@/lib/poster";

type Template = "haldi" | "neel" | "sindoor";
const TEMPLATES: Array<{ id: Template; label: string; bg: string; fg: string; card: string }> = [
  { id: "haldi", label: "Haldi", bg: "var(--haldi)", fg: "var(--syahi)", card: "var(--safed)" },
  { id: "neel", label: "Neel", bg: "var(--neel)", fg: "var(--safed)", card: "var(--haldi)" },
  { id: "sindoor", label: "Sindoor", bg: "var(--sindoor)", fg: "var(--syahi)", card: "var(--safed)" },
];

const unitLabel = (u?: string) => (u === "kilo" ? "/ kilo" : u === "packet" ? "/ packet" : u === "litre" ? "/ litre" : "");

/** 1080 by 1350. Every glyph comes from these fixed templates and local fonts; no model draws text. */
function PosterCanvas({ spec, t }: { spec: PosterSpec; t: (typeof TEMPLATES)[number] }) {
  const L = useCopy();
  return (
    <div style={{ width: 1080, height: 1350, background: t.bg, color: t.fg, padding: 72, display: "flex", flexDirection: "column", fontFamily: "var(--font-ui)" }}>
      <div style={{ fontFamily: "var(--font-display)", fontSize: 60 }}>{spec.shopName}</div>
      <div style={{ fontFamily: "var(--font-display)", fontSize: 140, lineHeight: 1.15, marginTop: 48 }}>{spec.headline === "Aaj ka offer" ? L("Today’s offer", spec.headline) : spec.headline}</div>
      <div style={{ marginTop: 56, display: "grid", gap: 28 }}>
        {spec.items.map((it) => (
          <div key={it.name} style={{ background: t.card, color: "var(--syahi)", border: "6px solid var(--syahi)", boxShadow: "12px 12px 0 var(--syahi)", padding: "28px 40px", display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <span style={{ fontSize: 64, fontWeight: 700 }}>{it.name}</span>
            <span style={{ fontSize: 72, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>
              ₹{it.priceRupees} <span style={{ fontSize: 36 }}>{unitLabel(it.unit)}</span>
            </span>
          </div>
        ))}
      </div>
      <div style={{ marginTop: "auto", fontSize: 48, fontWeight: 600 }}>{spec.validUntil === "Aaj shaam tak" ? L("Until this evening", spec.validUntil) : spec.validUntil}</div>
    </div>
  );
}

export function PosterMaker() {
  const L = useCopy();
  const { locale, hint } = useLocale();
  const [text, setText] = useState("aata 40 rupaye kilo, chini 45 rupaye kilo");
  const [spec, setSpec] = useState<PosterSpec | null>(null);
  const [tpl, setTpl] = useState<Template>("haldi");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const node = useRef<HTMLDivElement>(null);
  const t = TEMPLATES.find((x) => x.id === tpl)!;

  async function make() {
    setError(null);
    try {
      setSpec((await api.poster(text)).poster);
    } catch (e) {
      setSpec(null);
      setError(locale === "en" ? hint(e, "posterFailed") : e instanceof ApiError ? e.hint : "Poster nahi bana. Dobara try karo.");
    }
  }

  async function download() {
    if (!node.current) return;
    setBusy(true);
    try {
      const url = await toPng(node.current, { width: 1080, height: 1350, pixelRatio: 1, cacheBust: true });
      const a = document.createElement("a");
      a.href = url;
      a.download = "dukaan-offer.png";
      a.click();
    } catch {
      setError(L("The image could not be saved. Try again.", "Image save nahi hui. Dobara try karo."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-4">
      <div className="grid gap-2">
        <label htmlFor="offer" className="font-semibold">
          {L("Type your offer", "Offer bolo ya likho")}
        </label>
        <textarea id="offer" className="input min-h-[96px] rounded-2xl py-3" value={text} onChange={(e) => setText(e.target.value)} maxLength={300} />
        <div className="flex flex-wrap gap-2" role="group" aria-label={L("Poster colour", "Poster ka rang")}>
          {TEMPLATES.map((x) => (
            <button key={x.id} type="button" className="chip" aria-pressed={tpl === x.id} onClick={() => setTpl(x.id)}>
              {x.label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-3">
          <button type="button" className="btn btn-primary" onClick={make}>
            {L("Make poster", "Poster banao")}
          </button>
          <button type="button" className="btn btn-reminder" onClick={download} disabled={!spec || busy}>
            {L("Save image", "Image save karo")}
          </button>
        </div>
        {error ? <p role="alert" className="font-semibold">{error}</p> : null}
      </div>
      {spec ? (
        <div className="sticker overflow-hidden" style={{ width: "min(100%, 405px)", aspectRatio: "1080 / 1350" }} data-testid="poster-preview">
          <div style={{ transform: "scale(0.375)", transformOrigin: "top left", width: 1080, height: 1350 }}>
            <div ref={node}>
              <PosterCanvas spec={spec} t={t} />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
