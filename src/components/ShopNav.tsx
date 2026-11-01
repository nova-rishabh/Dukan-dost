"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCopy } from "./LocaleProvider";

export function ShopNav() {
  const L = useCopy(); const pathname = usePathname();
  const links = [["/shop/dashboard", L("Dashboard", "Dashboard")], ["/shop", L("Ledger", "Khata")], ["/shop/customers", L("Customers", "Customers")], ["/shop/inventory", L("Inventory", "Stock")], ["/shop/start", L("Getting started", "Shuru karein")], ["/shop/settings", L("Settings", "Settings")]];
  return <nav aria-label={L("Shop pages", "Dukaan ke panne")} className="flex flex-wrap gap-2 print:hidden">{links.map(([href, label]) => <Link href={href} key={href} className={`chip ${pathname === href ? "bg-syahi text-safed" : ""}`} aria-current={pathname === href ? "page" : undefined}>{label}</Link>)}</nav>;
}
