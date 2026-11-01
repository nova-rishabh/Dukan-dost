"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { errorHint, LOCALE_COOKIE, translate, type Locale, type MessageKey } from "@/lib/i18n";

interface LocaleContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: MessageKey) => string;
  hint: (error: unknown, fallback: MessageKey) => string;
}
const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ initialLocale, children }: { initialLocale: Locale; children: React.ReactNode }) {
  const [locale, setLocaleState] = useState(initialLocale);
  useEffect(() => { document.documentElement.lang = locale; }, [locale]);
  const value = useMemo<LocaleContextValue>(() => ({
    locale,
    setLocale(next) {
      document.cookie = `${LOCALE_COOKIE}=${next}; Path=/; Max-Age=31536000; SameSite=Lax${location.protocol === "https:" ? "; Secure" : ""}`;
      setLocaleState(next);
    },
    t: (key) => translate(locale, key),
    hint: (error, fallback) => errorHint(locale, error, fallback),
  }), [locale]);
  return <LocaleContext value={value}>{children}</LocaleContext>;
}

export function useLocale() {
  const context = useContext(LocaleContext);
  if (!context) throw new Error("useLocale requires LocaleProvider");
  return context;
}

export function LanguageSelector() {
  const { locale, setLocale, t } = useLocale();
  return <div className="grid max-w-sm gap-1"><label className="flex min-h-[48px] items-center gap-2 font-semibold">
    <span>{t("language")}</span>
    <select aria-label="Language / Bhasha" className="input w-auto" value={locale} onChange={(e) => setLocale(e.target.value === "en" ? "en" : "hi-Latn")}>
      <option value="hi-Latn">Hindi / Hinglish</option><option value="en">English</option>
    </select>
  </label>{locale === "en" ? <p className="text-base" data-testid="language-scope">{t("languageScope")}</p> : null}</div>;
}

export function LocalizedText({ id }: { id: MessageKey }) { return useLocale().t(id); }
