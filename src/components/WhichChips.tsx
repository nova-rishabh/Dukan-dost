"use client";

import type { Candidate } from "@/lib/types";

export function WhichChips({
  question,
  candidates,
  selectedId,
  onPick,
  extra,
}: {
  question: string;
  candidates: Candidate[];
  selectedId?: string;
  onPick: (c: Candidate) => void;
  extra?: React.ReactNode;
}) {
  return (
    <div role="group" aria-label={question} className="mt-3">
      <p className="font-semibold">{question}</p>
      <div className="chip-grid mt-2">
        {candidates.map((c) => (
          <button key={c.customerId} type="button" className="chip" aria-pressed={selectedId === c.customerId} onClick={() => onPick(c)}>
            {c.label}
          </button>
        ))}
        {extra}
      </div>
    </div>
  );
}
