"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCopy } from "./LocaleProvider";

export function useShopLinks() {
  const L = useCopy();
  return [["/shop/dashboard", L("Dashboard", "Dashboard")], ["/shop", L("Ledger", "Khata")], ["/shop/customers", L("Customers", "Customers")], ["/shop/inventory", L("Inventory", "Stock")], ["/shop/start", L("Getting started", "Shuru karein")], ["/shop/settings", L("Settings", "Settings")]] as const;
}

/** Desktop sidebar. On phones the same links sit in the header menu. */
export function ShopNav() {
  const L = useCopy(); const pathname = usePathname(); const links = useShopLinks();
  return <nav aria-label={L("Shop pages", "Dukaan ke panne")} className="side-nav print:hidden">{links.map(([href, label]) => <Link href={href} key={href} className="side-link" aria-current={pathname === href ? "page" : undefined}>{label}</Link>)}</nav>;
}
