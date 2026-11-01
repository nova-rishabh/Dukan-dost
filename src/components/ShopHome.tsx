"use client";

import { useCopy } from "./LocaleProvider";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { api, type CustomerListItem, type Summary } from "@/lib/client/api";
import { Assistant } from "./Assistant";
import { CustomerRow } from "./CustomerRow";
import { Munshi } from "./Munshi";
import { SummaryStrip } from "./SummaryStrip";

export function ShopHome() {
  const L = useCopy();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [shopName, setShopName] = useState("");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [customers, setCustomers] = useState<CustomerListItem[] | null>(null);
  const [failed, setFailed] = useState(false);

  const load = useCallback(async () => {
    try {
      const [s, c] = await Promise.all([api.summary(), api.customers()]);
      setSummary(s.summary);
      setShopName(s.shopName);
      setCustomers(c.customers);
      setFailed(false);
    } catch {
      setFailed(true);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const visible = customers?.filter((c) => `${c.name} ${c.area ?? ""}`.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()) && (filter === "all" || (filter === "owed" ? c.balancePaise > 0 : filter === "advance" ? c.balancePaise < 0 : c.balancePaise === 0)));

  return (
    <div className="mx-auto grid max-w-5xl gap-5 px-4 pb-40 pt-2 md:px-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-[40px] leading-tight">{shopName || L("My shop", "Meri dukaan")}</h1>
        <Link href="/shop/poster" className="btn">
          {L("Make offer poster", "Offer poster banao")}
        </Link>
      </div>

      <div className="flex flex-wrap gap-3"><Link className="btn" href="/shop/entry">{L("Write exact amount", "Sahi rakam likho")}</Link><Link className="btn" href="/shop/ledger">{L("Browse entries", "Entries dekho")}</Link><Link className="btn" href="/shop/help">{L("Help", "Madad")}</Link></div>
      <div className="flex items-center gap-4"><Munshi /><p>{L("Welcome! Speak an entry or type below. Review the card and confirm it.", "Namaste! Entry bolo ya neeche likho. Main parchi dikhaunga, aap pakka karna.")}</p></div>

      {failed ? (
        <div className="sticker p-4 font-semibold" role="alert"><p>{L("The overview could not open. Try again.", "Hisaab nahi khula. Dobara try karo.")}</p><button className="btn mt-3" onClick={() => void load()}>{L("Try again", "Dobara kholo")}</button></div>
      ) : null}

      {summary ? <SummaryStrip summary={summary} onChanged={load} /> : failed ? null : <div className="sticker h-40 p-4" aria-busy="true">{L("Loading overview…", "Hisaab khul raha hai…")}</div>}

      <Assistant variant="shop" showSamples onChange={() => void load()} />

      <section aria-label="Customer">
        <h2 className="mb-2 text-[28px]">{L("Ledger", "Khata")}</h2>
        <div className="mb-4 grid gap-3 sm:grid-cols-2">
          <label>{L("Find a customer", "Customer dhoondo")}<input type="search" className="input" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={L("Name or area", "Naam ya area")} /></label>
          <label>{L("Show accounts", "Khata dikhao")}<select className="input" value={filter} onChange={(e) => setFilter(e.target.value)}><option value="all">{L("All customers", "Sab customer")}</option><option value="owed">{L("Outstanding", "Udhaar baaki")}</option><option value="settled">{L("Settled", "Hisaab barabar")}</option><option value="advance">{L("Advance balance", "Advance jama")}</option></select></label>
        </div>
        {customers ? (
          <>
          <p role="status" className="mb-3">{visible?.length} {L("customers found", "customer mile")}</p>
          {visible?.length === 0 ? <div className="sticker flex items-center gap-4 p-4"><Munshi pose="empty" /><div><p>{customers.length === 0 ? L("No accounts yet. Speak or type a customer name and amount.", "Abhi koi khata nahi. Customer ka naam aur rakam bolo ya likho.") : L("No customers match this search.", "Is khoj mein koi customer nahi mila.")}</p>{customers.length > 0 ? <button className="btn mt-3" onClick={() => { setQuery(""); setFilter("all"); }}>{L("Show all", "Sab dikhao")}</button> : null}</div></div> : null}
          <ul className="grid gap-3 md:grid-cols-2">
            {visible?.map((c) => (
              <CustomerRow key={c.id} c={c} />
            ))}
          </ul>
          </>
        ) : (
          failed ? null : <p aria-busy="true">{L("Loading ledger…", "Khata khul raha hai…")}</p>
        )}
      </section>

    </div>
  );
}
