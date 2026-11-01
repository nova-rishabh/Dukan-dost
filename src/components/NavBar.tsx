"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useLocale, useCopy } from "./LocaleProvider";
import { useShopLinks } from "./ShopNav";
import { api, post, ApiError, type Me } from "@/lib/client/api";

/** Demo shop: the two sample links. Real shop: login, or the shop and logout. */
export function NavBar() {
  const L = useCopy();
  const { t } = useLocale();
  const [me, setMe] = useState<(Me & { visitorDemo?: boolean }) | null>(null);
  const [expiredDemo, setExpiredDemo] = useState(false);
  const [exitFailed, setExitFailed] = useState(false);
  const menu = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const shopLinks = useShopLinks();
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
    <nav aria-label={t("mainNav")}>
      <button type="button" className="btn btn-sm menu-toggle" popoverTarget="site-menu" aria-label={L("Menu", "Menu")} data-testid="menu-button">
        <svg aria-hidden="true" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M4 6h16M4 12h16M4 18h16" /></svg>
      </button>
      <div id="site-menu" popover="auto" ref={menu} className="nav-menu" onClick={(event) => { if ((event.target as HTMLElement).closest("a")) { try { menu.current?.hidePopover(); } catch { /* already closed */ } } }}>
      {expiredDemo ? <><Link href="/try" className="btn btn-sm">{L("Restart sample", "Sample dobara kholo")}</Link><button className="btn btn-sm" type="button" onClick={() => void leaveDemo()}>{L("Exit sample", "Sample se bahar")}</button></> : me?.visitorDemo ? <>
        <Link href="/try" className="btn btn-sm">{t("sampleShop")}</Link>
        <Link href="/shop" className="btn btn-sm btn-primary">{L("Sample ledger", "Sample khata")}</Link>
        <Link href="/signup" className="btn btn-sm">{L("Create account", "Naya account")}</Link>
        <button className="btn btn-sm" type="button" onClick={() => void leaveDemo()}>{L("Exit sample", "Sample se bahar")}</button>
      </> : !me || !me.authRequired ? (
        <>
          <Link href="/try" className="btn btn-sm">
            {t("sampleShop")}
          </Link>
          <Link href="/shop" className="btn btn-sm btn-primary">
            {t("myShop")}
          </Link>
        </>
      ) : me.loggedIn ? (
        <>
          <Link href="/shop" className="btn btn-sm btn-primary">
            {t("myShop")}
          </Link>
          <button type="button" className="btn btn-sm" onClick={logout} data-testid="logout">
            {t("logout")}
          </button>
        </>
      ) : (
        <>
        <Link href="/try" className="btn btn-sm">{t("sampleShop")}</Link>
        <Link href="/signup" className="btn btn-sm btn-primary">{L("Create account", "Naya account")}</Link>
        <Link href="/login" className="btn btn-sm" data-testid="nav-login">{t("login")}</Link>
        </>
      )}
      {pathname.startsWith("/shop") ? <div className="nav-shop">{shopLinks.map(([href, label]) => <Link href={href} key={href} className="menu-link" aria-current={pathname === href ? "page" : undefined}>{label}</Link>)}</div> : null}
      {exitFailed ? <p role="alert">{L("Could not exit the sample. Check your connection and try again.", "Sample se bahar nahi nikle. Connection check karke dobara karo.")}</p> : null}
      </div>
    </nav>
  );
}
