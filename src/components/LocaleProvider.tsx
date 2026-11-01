"use client";

import { useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
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
  const menu = useRef<HTMLDivElement>(null);
  function pick(next: Locale) {
    try { menu.current?.hidePopover(); } catch { /* already closed */ }
    if (next !== locale) setLocale(next);
  }
  return <>
    <button type="button" className="btn btn-sm lang-toggle" popoverTarget="lang-menu" aria-label="Language / Bhasha" data-testid="language-button">
      <span aria-hidden="true">{locale === "en" ? "E" : "H"}</span>
      <svg aria-hidden="true" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6" /></svg>
    </button>
    <div id="lang-menu" popover="auto" ref={menu} className="lang-menu" role="menu">
      <button type="button" role="menuitemradio" aria-checked={locale === "hi-Latn"} className="menu-link" onClick={() => pick("hi-Latn")}>Hinglish</button>
      <button type="button" role="menuitemradio" aria-checked={locale === "en"} className="menu-link" onClick={() => pick("en")}>English</button>
    </div>
  </>;
}

export function LocalizedText({ id }: { id: MessageKey }) { return useLocale().t(id); }

/** UI copy only: never translate customer names, source sentences or other stored evidence. */
export function useCopy() {
  const { locale } = useLocale();
  return useCallback((en: string, hi: string) => locale === "en" ? en : hi, [locale]);
}

export function Copy({ en, hi }: { en: string; hi: string }) { return useCopy()(en, hi); }
