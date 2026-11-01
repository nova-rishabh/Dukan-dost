"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/client/api";
import { DataPanel } from "./DataPanel";
import { PasscodePanel } from "./PasscodePanel";
import { WaPanel } from "./WaPanel";
import { Munshi } from "./Munshi";

export function ShopSettings() {
  const [demo, setDemo] = useState<boolean | null>(null);
  const [failed, setFailed] = useState(false);
  const load = useCallback(async () => {
    setFailed(false);
    try { setDemo((await api.me()).isDemoShop); }
    catch { setFailed(true); }
  }, []);
  useEffect(() => { void load(); }, [load]);
  return <div className="mx-auto grid max-w-3xl gap-5 px-4 py-6 md:px-8">
    <Link href="/shop" className="btn w-fit">Khata par wapas</Link>
    <div className="flex items-center gap-4"><Munshi /><div><h1 className="text-[40px] leading-tight">Dukaan ki settings</h1><p>WhatsApp, passcode aur aapka data.</p></div></div>
    {failed ? <div role="alert" className="sticker p-4"><p>Settings nahi khuli. Dobara try karo.</p><button className="btn mt-3" onClick={() => void load()}>Dobara kholo</button></div> : demo === null ? <p role="status">Settings khul rahi hain…</p> : <>
      {!demo ? <WaPanel /> : <p className="sticker p-4">Yeh sample dukaan hai. WhatsApp aur passcode ki settings asli dukaan mein milengi.</p>}
      <DataPanel isDemoShop={demo} onErased={() => void load()} />
      {!demo ? <PasscodePanel /> : null}
    </>}
  </div>;
}
