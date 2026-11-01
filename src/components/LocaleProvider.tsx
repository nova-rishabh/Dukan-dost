"use client";

import { useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { errorHint, LOCALE_COOKIE, translate, type Locale, type MessageKey } from "@/lib/i18n";

interface LocaleContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: MessageKey) => string;
  hint: (error: unknown, fallback: MessageKey) => string;
}
const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ initialLocale, children }: { initialLocale: Locale; children: React.ReactNode }) {
  const router = useRouter();
  const [locale, setLocaleState] = useState(initialLocale);
  useEffect(() => { document.documentElement.lang = locale; }, [locale]);
  const value = useMemo<LocaleContextValue>(() => ({
    locale,
    setLocale(next) {
      document.cookie = `${LOCALE_COOKIE}=${next}; Path=/; Max-Age=31536000; SameSite=Lax${location.protocol === "https:" ? "; Secure" : ""}`;
      setLocaleState(next);
      router.refresh();
    },
    t: (key) => translate(locale, key),
    hint: (error, fallback) => errorHint(locale, error, fallback),
  }), [locale, router]);
  return <LocaleContext value={value}>{children}</LocaleContext>;
}

export function useLocale() {
  const context = useContext(LocaleContext);
  if (!context) throw new Error("useLocale requires LocaleProvider");
  return context;
}

export function LanguageSelector() {
  const { locale, setLocale } = useLocale();
  return <select aria-label="Language / Bhasha" className="input input-sm" value={locale} onChange={(e) => setLocale(e.target.value === "en" ? "en" : "hi-Latn")}>
    <option value="hi-Latn">Hinglish</option><option value="en">English</option>
  </select>;
}

export function LanguageScopeNote() {
  const { locale, t } = useLocale();
  return locale === "en" ? <p className="w-full text-base" data-testid="language-scope">{t("languageScope")}</p> : null;
}

export function LocalizedText({ id }: { id: MessageKey }) { return useLocale().t(id); }

/** UI copy only: never translate customer names, source sentences or other stored evidence. */
export function useCopy() {
  const { locale } = useLocale();
  return useCallback((en: string, hi: string) => locale === "en" ? en : hi, [locale]);
}

export function Copy({ en, hi }: { en: string; hi: string }) { return useCopy()(en, hi); }
