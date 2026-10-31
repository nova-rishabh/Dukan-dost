"use client";

import { useEffect, useRef, useState } from "react";
import { formatINR } from "@/lib/money";

const reduced = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Counts up only when the value changes after mount, never on first paint. Honours reduced motion. */
export function CountUp({ paise, className }: { paise: number; className?: string }) {
  const [shown, setShown] = useState(paise);
  const from = useRef(paise);
  const first = useRef(true);

  useEffect(() => {
    if (first.current || reduced()) {
      first.current = false;
      from.current = paise;
      setShown(paise);
      return;
    }
    const start = performance.now();
    const origin = from.current;
    const duration = 600;
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const next = Math.round((origin + (paise - origin) * eased) / 100) * 100;
      setShown(next);
      if (t < 1) raf = requestAnimationFrame(tick);
      else from.current = paise;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [paise]);

  return (
    <span className={`money ${className ?? ""}`} data-paise={paise}>
      <span aria-hidden="true">{formatINR(shown)}</span>
      <span className="sr-only">{formatINR(paise)}</span>
    </span>
  );
}
