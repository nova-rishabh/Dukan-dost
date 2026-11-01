"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { api, type CustomerListItem, type Summary } from "@/lib/client/api";
import { Assistant } from "./Assistant";
import { CustomerRow } from "./CustomerRow";
import { DataPanel } from "./DataPanel";
import { SummaryStrip } from "./SummaryStrip";

export function ShopHome() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [shopName, setShopName] = useState("");
  const [isDemoShop, setIsDemoShop] = useState(true);
  const [customers, setCustomers] = useState<CustomerListItem[] | null>(null);
  const [failed, setFailed] = useState(false);

  const load = useCallback(async () => {
    try {
      const [s, c] = await Promise.all([api.summary(), api.customers()]);
      setSummary(s.summary);
      setShopName(s.shopName);
      setIsDemoShop(s.isDemoShop);
      setCustomers(c.customers);
      setFailed(false);
    } catch {
      setFailed(true);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="mx-auto grid max-w-5xl gap-5 px-4 pb-40 pt-2 md:px-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-[40px] leading-tight">{shopName || "Meri dukaan"}</h1>
        <Link href="/shop/poster" className="btn">
          Offer poster banao
        </Link>
      </div>

      {failed ? (
        <p className="sticker p-4 font-semibold" role="alert">
          Net nahi hai. Thodi der baad try karo.
        </p>
      ) : null}

      {summary ? <SummaryStrip summary={summary} onChanged={load} /> : <div className="sticker h-40 p-4" aria-busy="true">Hisaab khul raha hai…</div>}

      <Assistant variant="shop" showSamples onChange={() => void load()} />

      <section aria-label="Customer">
        <h2 className="mb-2 text-[28px]">Khata</h2>
        {customers ? (
          <ul className="grid gap-3 md:grid-cols-2">
            {customers.map((c) => (
              <CustomerRow key={c.id} c={c} />
            ))}
          </ul>
        ) : (
          <p aria-busy="true">Khata khul raha hai…</p>
        )}
      </section>

      <DataPanel isDemoShop={isDemoShop} onErased={() => void load()} />
    </div>
  );
}
