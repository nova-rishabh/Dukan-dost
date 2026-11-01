"use client";

import { useCopy, useLocale } from "./LocaleProvider";

export function Stamp({ label }: { label?: string }) {
  const L = useCopy();
  const { locale } = useLocale();
  return (
    <div className="stamp" role="img" aria-label={L("Recorded", "Likh liya")} data-testid="stamp">
      <span lang={locale === "en" ? "en" : "hi"} aria-hidden="true">
        {label ?? L("Recorded", "लिख लिया")}
      </span>
    </div>
  );
}
