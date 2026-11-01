"use client";

import Link from "next/link";
import { LanguageScopeNote, LanguageSelector, useLocale } from "./LocaleProvider";
import { DemoTag } from "./DemoTag";
import { NavBar } from "./NavBar";
import { AppAvailability } from "./AppAvailability";

export function Header() {
  const { t } = useLocale();
  return (
    <><header className="flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3 md:px-8">
      <Link href="/" className="font-display text-xl text-syahi no-underline md:text-2xl" aria-label={t("home")}>
        Dukaan Dost
      </Link>
      <DemoTag />
      <div className="ml-auto flex items-center gap-3">
        <div className="order-2 md:order-1"><NavBar /></div>
        <div className="order-1 md:order-2"><LanguageSelector /></div>
      </div>
      <LanguageScopeNote />
    </header><AppAvailability /></>
  );
}
