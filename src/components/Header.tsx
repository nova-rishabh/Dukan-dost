"use client";

import Link from "next/link";
import { LanguageSelector, useLocale } from "./LocaleProvider";
import { DemoTag } from "./DemoTag";
import { NavBar } from "./NavBar";
import { AppAvailability } from "./AppAvailability";

export function Header() {
  const { t } = useLocale();
  return (
    <><header className="flex items-center gap-x-3 px-4 py-3 md:px-8">
      <Link href="/" className="font-display text-xl text-syahi no-underline md:text-2xl" aria-label={t("home")}>
        Dukaan Dost
      </Link>
      <DemoTag />
      <div className="ml-auto flex items-center gap-2 md:gap-3">
        <NavBar />
        <LanguageSelector />
      </div>
    </header><AppAvailability /></>
  );
}
