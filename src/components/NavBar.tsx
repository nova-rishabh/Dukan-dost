"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useLocale, useCopy } from "./LocaleProvider";
import { api, type Me } from "@/lib/client/api";

/** Demo shop: the two sample links. Real shop: login, or the shop and logout. */
export function NavBar() {
  const L = useCopy();
  const { t } = useLocale();
  const [me, setMe] = useState<Me | null>(null);
  useEffect(() => {
    api
      .me()
      .then(setMe)
      .catch(() => setMe(null));
  }, []);

  async function logout() {
    try {
      await api.logout();
    } finally {
      window.location.assign("/login");
    }
  }

  return (
    <nav aria-label={t("mainNav")} className="flex min-h-[48px] w-full flex-wrap items-center gap-2 md:w-auto">
      {!me || !me.authRequired ? (
        <>
          <Link href="/try" className="btn">
            {t("sampleShop")}
          </Link>
          <Link href="/shop" className="btn btn-primary">
            {t("myShop")}
          </Link>
        </>
      ) : me.loggedIn ? (
        <>
          <Link href="/shop" className="btn btn-primary">
            {t("myShop")}
          </Link>
          <button type="button" className="btn" onClick={logout} data-testid="logout">
            {t("logout")}
          </button>
        </>
      ) : (
        <>
        <Link href="/signup" className="btn btn-primary">{L("Create account", "Naya account")}</Link>
        <Link href="/login" className="btn" data-testid="nav-login">{t("login")}</Link>
        </>
      )}
    </nav>
  );
}
