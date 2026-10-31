"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/client/api";

/** Visible whenever any adapter is running locally (no keys). Honest by default. */
export function DemoTag() {
  const [demo, setDemo] = useState<boolean | null>(null);
  useEffect(() => {
    api
      .status()
      .then((s) => setDemo(s.demoMode))
      .catch(() => setDemo(true));
  }, []);
  if (demo === false) return null;
  return (
    <span className="inline-flex min-h-[48px] items-center rounded-full border-2 border-syahi bg-syahi px-4 text-sm font-semibold text-safed" data-testid="demo-tag">
      Demo mode
    </span>
  );
}
