"use client";

import { useCopy } from "./LocaleProvider";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/client/api";
import { ShopProfile } from "./ShopProfile";
import { DataPanel } from "./DataPanel";
import { PasscodePanel } from "./PasscodePanel";
import { WaPanel } from "./WaPanel";
import { Munshi } from "./Munshi";

export function ShopSettings() {
  const L = useCopy();
  const [demo, setDemo] = useState<boolean | null>(null);
  const [failed, setFailed] = useState(false);
  const load = useCallback(async () => {
    setFailed(false);
    try { setDemo((await api.me()).isDemoShop); }
    catch { setFailed(true); }
  }, []);
  useEffect(() => { void load(); }, [load]);
  return <div className="mx-auto grid max-w-3xl gap-5 px-4 py-6 md:px-8">
    <Link href="/shop" className="btn w-fit">{L("Back to ledger", "Khata par wapas")}</Link>
    <div className="flex items-center gap-4"><Munshi /><div><h1 className="text-[40px] leading-tight">{L("Shop settings", "Dukaan ki settings")}</h1><p>{L("WhatsApp, password and your data.", "WhatsApp, passcode aur aapka data.")}</p></div></div>
    {failed ? <div role="alert" className="sticker p-4"><p>{L("Settings could not open. Try again.", "Settings nahi khuli. Dobara try karo.")}</p><button className="btn mt-3" onClick={() => void load()}>{L("Try again", "Dobara kholo")}</button></div> : demo === null ? <p role="status">{L("Loading settings…", "Settings khul rahi hain…")}</p> : <>
      {!demo ? <WaPanel /> : <p className="sticker p-4">{L("This is a sample shop. WhatsApp and password settings are available in your own shop.", "Yeh sample dukaan hai. WhatsApp aur passcode ki settings asli dukaan mein milengi.")}</p>}
      <ShopProfile />
      <DataPanel isDemoShop={demo} onErased={() => void load()} />
      {!demo ? <PasscodePanel /> : null}
    </>}
  </div>;
}
