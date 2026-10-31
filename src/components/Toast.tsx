"use client";

import { useEffect } from "react";

/** Past-tense confirmation, 3 seconds, sits above the Bolo button. */
export function Toast({ message, onGone }: { message: string | null; onGone: () => void }) {
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(onGone, 3000);
    return () => clearTimeout(t);
  }, [message, onGone]);
  return (
    <div className="toast" role="status" aria-live="polite">
      {message ? (
        <div className="sticker rounded-full px-5 py-3 font-semibold" data-testid="toast">
          {message}
        </div>
      ) : null}
    </div>
  );
}
