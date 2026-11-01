"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useCopy } from "./LocaleProvider";

interface InstallPrompt extends Event { prompt(): Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> }

export function AppAvailability() {
  const L = useCopy();
  const [offline, setOffline] = useState(false);
  const [returned, setReturned] = useState(false);
  const [install, setInstall] = useState<InstallPrompt | null>(null);
  useEffect(() => {
    const unavailable = () => { setOffline(true); setReturned(false); };
    const available = () => { setOffline(false); setReturned(true); };
    const prompt = (event: Event) => { event.preventDefault(); setInstall(event as InstallPrompt); };
    const installed = () => setInstall(null);
    if (!navigator.onLine) unavailable();
    window.addEventListener("offline", unavailable); window.addEventListener("online", available);
    window.addEventListener("beforeinstallprompt", prompt); window.addEventListener("appinstalled", installed);
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      void navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" }).catch(() => { /* offline help is optional; live app remains usable */ });
    }
    return () => { window.removeEventListener("offline", unavailable); window.removeEventListener("online", available); window.removeEventListener("beforeinstallprompt", prompt); window.removeEventListener("appinstalled", installed); };
  }, []);
  async function installApp() {
    if (!install) return;
    setInstall(null);
    try { await install.prompt(); await install.userChoice; } catch { /* browser can decline an install prompt */ }
  }
  if (!offline && !returned && !install) return null;
  return <aside className="mx-4 mb-4 grid gap-2 border-2 border-syahi bg-safed p-3 md:mx-8" aria-label={L("Connection and installation", "Connection aur app")}>
    {offline ? <p role="status">{L("You are offline. No ledger entry or message will be sent. Keep a typed draft in this tab, then reconnect and review it.", "Net band hai. Koi entry ya message nahi bhejenge. Isi tab mein likha draft rakho, phir net aane par check karo.")}</p> : returned ? <div className="flex flex-wrap items-center gap-3"><p role="status">{L("Connection returned. Reload records before confirming. Nothing was sent automatically.", "Net aa gaya. Confirm karne se pehle hisaab dobara kholo. Apne aap kuch nahi bheja.")}</p><button className="chip" onClick={() => window.location.reload()}>{L("Reload records", "Hisaab dobara kholo")}</button><button className="chip" onClick={() => setReturned(false)}>{L("Dismiss", "Band karo")}</button></div> : null}
    {install ? <button className="btn w-fit" onClick={() => void installApp()}>{L("Install Dukaan Dost", "Dukaan Dost install karo")}</button> : null}
    {offline ? <Link className="underline" href="/offline.html">{L("Offline help", "Bina net ki madad")}</Link> : null}
  </aside>;
}
