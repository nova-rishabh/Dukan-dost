"use client";

import { useEffect, useState } from "react";
import { SAMPLE_CLIPS } from "@/lib/samples";

/** Juror mode: five labelled clips, honest about what is canned. Works without a mic or a login. */
export function SampleClips({ onPick, disabled, showNotes }: { onPick: (id: string) => void; disabled?: boolean; showNotes?: boolean }) {
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
      <ul className="flex flex-wrap gap-2" aria-label="Sample clip">
        {SAMPLE_CLIPS.map((c) => (
          <li key={c.id}>
            <button type="button" className="btn" disabled={disabled} onClick={() => onPick(c.id)} data-testid={`clip-${c.id}`}>
              {c.label}
            </button>
          </li>
        ))}
      </ul>
      {showNotes ? (
        <ul className="mt-4 grid gap-1 text-base">
          {SAMPLE_CLIPS.map((c) => (
            <li key={c.id}>
              <span className="font-semibold">{c.label}:</span> {c.note}
            </li>
          ))}
        </ul>
      ) : null}
      <p className="mt-3 text-base" data-testid="clip-note">
        {anyAudio
          ? "Sample clips AI se banayi gayi awaaz hain (dramatisation), asli dukaandaar nahi."
          : "Abhi clips mein sirf likha hua sentence chalta hai, awaaz nahi."}
      </p>
    </div>
  );
}
