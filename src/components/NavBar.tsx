"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useLocale, useCopy } from "./LocaleProvider";
import { api, post, ApiError, type Me } from "@/lib/client/api";

/** Demo shop: the two sample links. Real shop: login, or the shop and logout. */
export function NavBar() {
  const L = useCopy();
  const { t } = useLocale();
  const [me, setMe] = useState<(Me & { visitorDemo?: boolean }) | null>(null);
  const [expiredDemo, setExpiredDemo] = useState(false);
  const [exitFailed, setExitFailed] = useState(false);
  useEffect(() => {
    api
      .me()
      .then(setMe)
      .catch((error) => { setMe(null); setExpiredDemo(error instanceof ApiError && error.code === "demo_expired"); });
  }, []);

  async function logout() {
    try {
      await api.logout();
    } finally {
      window.location.assign("/login");
    }
  }
  async function leaveDemo() {
    setExitFailed(false);
    try { await post("/api/demo/exit", {}); window.location.assign("/"); }
    catch { setExitFailed(true); }
  }

  return (
    <nav aria-label={t("mainNav")} className="flex min-h-[48px] w-full flex-wrap items-center gap-2 md:w-auto">
      {expiredDemo ? <><Link href="/try" className="btn">{L("Restart sample", "Sample dobara kholo")}</Link><button className="btn" type="button" onClick={() => void leaveDemo()}>{L("Exit sample", "Sample se bahar")}</button></> : me?.visitorDemo ? <>
        <Link href="/try" className="btn">{t("sampleShop")}</Link>
        <Link href="/shop" className="btn btn-primary">{L("Sample ledger", "Sample khata")}</Link>
        <Link href="/signup" className="btn">{L("Create account", "Naya account")}</Link>
        <button className="btn" type="button" onClick={() => void leaveDemo()}>{L("Exit sample", "Sample se bahar")}</button>
      </> : !me || !me.authRequired ? (
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
        <Link href="/try" className="btn">{t("sampleShop")}</Link>
        <Link href="/signup" className="btn btn-primary">{L("Create account", "Naya account")}</Link>
        <Link href="/login" className="btn" data-testid="nav-login">{t("login")}</Link>
        </>
      )}
      {exitFailed ? <p role="alert">{L("Could not exit the sample. Check your connection and try again.", "Sample se bahar nahi nikle. Connection check karke dobara karo.")}</p> : null}
    </nav>
  );
}
