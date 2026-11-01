"use client";

import Link from "next/link";
import { LanguageSelector, useLocale } from "./LocaleProvider";
import { DemoTag } from "./DemoTag";
import { NavBar } from "./NavBar";
import { AppAvailability } from "./AppAvailability";

export function Header() {
  const { t } = useLocale();
  return (
    <><header className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 px-4 py-3 md:px-8">
      <Link href="/" className="font-display text-2xl text-syahi no-underline" aria-label={t("home")}>
        Dukaan Dost
      </Link>
      <DemoTag />
      <LanguageSelector />
      <NavBar />
    </header><AppAvailability /></>
  );
}
