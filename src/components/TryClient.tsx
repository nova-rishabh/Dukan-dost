"use client";

import { useCopy } from "./LocaleProvider";

import Link from "next/link";
import { useState } from "react";
import { api } from "@/lib/client/api";
import { Assistant } from "./Assistant";

export function TryClient() {
  const L = useCopy();
  const [note, setNote] = useState<string | null>(null);
  return (
    <>
      <Assistant variant="try" showSamples />
      <div className="flex flex-wrap items-center gap-3">
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
