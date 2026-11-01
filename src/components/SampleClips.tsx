"use client";

import { useCopy, useLocale } from "./LocaleProvider";

import { useEffect, useState } from "react";
import { SAMPLE_CLIPS, sampleDescription } from "@/lib/samples";

/** Juror mode: five labelled clips, honest about what is canned. Works without a mic or a login. */
export function SampleClips({ onPick, disabled, showNotes }: { onPick: (id: string) => void; disabled?: boolean; showNotes?: boolean }) {
  const L = useCopy();
  const { locale } = useLocale();
  const [audio, setAudio] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let alive = true;
    Promise.all(
      SAMPLE_CLIPS.map((c) =>
        fetch(c.audioPath, { method: "HEAD" })
          .then((r) => [c.id, r.ok && (r.headers.get("content-type") ?? "").includes("audio")] as const)
          .catch(() => [c.id, false] as const),
      ),
    ).then((rows) => alive && setAudio(Object.fromEntries(rows)));
    return () => {
      alive = false;
    };
  }, []);

  const anyAudio = Object.values(audio).some(Boolean);

  return (
    <div>
      <ul className="chip-grid" aria-label="Sample clip">
        {SAMPLE_CLIPS.map((c) => (
          <li key={c.id}>
            <button type="button" className="btn" disabled={disabled} onClick={() => onPick(c.id)} data-testid={`clip-${c.id}`}>
              {sampleDescription(c, locale === "en").label}
            </button>
          </li>
        ))}
      </ul>
      {showNotes ? (
        <ul className="mt-4 grid gap-3 text-base">
          {SAMPLE_CLIPS.map((c) => (
            <li key={c.id}>
              <span className="block font-semibold">{sampleDescription(c, locale === "en").label}</span>
              <span className="block">{sampleDescription(c, locale === "en").note}</span>
            </li>
          ))}
        </ul>
      ) : null}
      <p className="mt-3 text-base" data-testid="clip-note">
        {anyAudio
          ? L("Sample clips use AI voices (dramatisation), not real shopkeepers.", "Sample clips AI se banayi gayi awaaz hain (dramatisation), asli dukaandaar nahi.")
          : L("These clips currently use their written sentences without audio.", "Abhi clips mein sirf likha hua sentence chalta hai, awaaz nahi.")}
      </p>
    </div>
  );
}
