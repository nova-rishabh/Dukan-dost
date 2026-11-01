"use client";

import { useEffect, useState } from "react";
import { useLocale } from "./LocaleProvider";
import { api } from "@/lib/client/api";

/** Visible whenever any adapter is running locally (no keys). Honest by default. */
export function DemoTag() {
  const { t } = useLocale();
  const [demo, setDemo] = useState<boolean | null>(null);
  useEffect(() => {
    api
      .status()
      .then((s) => setDemo(s.demoMode))
      .catch(() => setDemo(true));
  }, []);
  if (demo === false) return null;
  return (
    <span className="inline-flex min-h-[48px] items-center rounded-md border-2 border-syahi bg-syahi px-3 text-sm font-semibold text-safed" data-testid="demo-tag">
      {t("demo")}
    </span>
  );
}
