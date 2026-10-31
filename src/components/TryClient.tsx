"use client";

import Link from "next/link";
import { useState } from "react";
import { api } from "@/lib/client/api";
import { Assistant } from "./Assistant";

export function TryClient() {
  const [note, setNote] = useState<string | null>(null);
  return (
    <>
      <Assistant variant="try" showSamples />
      <div className="flex flex-wrap items-center gap-3">
        <Link href="/shop" className="btn btn-primary">
          Poora khata dekho
        </Link>
        <button
          type="button"
          className="btn"
          onClick={async () => {
            try {
              await api.resetDemo();
              setNote("Dukaan shuru jaisi ho gayi.");
            } catch {
              setNote("Reset nahi ho paya.");
            }
          }}
        >
          Dukaan reset karo
        </button>
        {note ? <span role="status">{note}</span> : null}
      </div>
    </>
  );
}
