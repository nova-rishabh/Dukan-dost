"use client";
import { useCopy } from "@/components/LocaleProvider";
import { Munshi } from "@/components/Munshi";
export default function ErrorBoundary({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const L = useCopy();
  return <div className="mx-auto grid max-w-xl gap-4 px-4 py-8" role="alert"><Munshi pose="retry" /><h1 className="text-4xl">{L("This screen could not open", "Yeh panna nahi khula")}</h1><p>{L("If you had just confirmed a change, it may have completed. Check the ledger or history before recording or sending again.", "Abhi badlav pakka kiya tha toh ho sakta hai kaam ho gaya ho. Dobara likhne ya bhejne se pehle khata ya history check karo.")}</p><button className="btn w-fit" onClick={reset}>{L("Open screen again", "Panna dobara kholo")}</button><a className="underline" href="/shop">{L("Check ledger", "Khata dekho")}</a></div>;
}
