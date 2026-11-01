"use client";

import { useEffect, useState } from "react";
import { api, ApiError } from "@/lib/client/api";

/** First run: name the shop, create the one owner. Needs the setup code from the machine that runs the app. */
export function SetupClient() {
  const [ready, setReady] = useState(false);
  const [f, setF] = useState({ shopName: "", name: "", mobile: "", passcode: "", again: "", setupCode: "", upiVpa: "" });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF((p) => ({ ...p, [k]: e.target.value }));

  useEffect(() => {
    api
      .me()
      .then((m) => {
        if (!m.authRequired) window.location.assign("/shop");
        else if (!m.setupNeeded) window.location.assign(m.loggedIn ? "/shop" : "/login");
        else setReady(true);
      })
      .catch(() => setError("Net nahi hai. Thodi der baad try karo."));
  }, []);

  async function submit() {
    setError(null);
    if (f.passcode !== f.again) {
      setError("Dono passcode ek jaise nahi hain.");
      return;
    }
    setBusy(true);
    try {
      await api.setup({ setupCode: f.setupCode, shopName: f.shopName, name: f.name, mobile: f.mobile, passcode: f.passcode, upiVpa: f.upiVpa || undefined });
      window.location.assign("/shop");
    } catch (e) {
      setError(e instanceof ApiError ? e.hint : "Set nahi ho paya. Dobara try karo.");
      setBusy(false);
    }
  }

  if (!ready && !error) {
    return (
      <p aria-busy="true" role="status">
        Khul raha hai…
      </p>
    );
  }

  return (
    <form
      className="grid gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        void submit();
      }}
    >
      <label className="font-semibold" htmlFor="s-shop">
        Dukaan ka naam
      </label>
      <input id="s-shop" className="input" autoComplete="organization" value={f.shopName} onChange={set("shopName")} data-testid="setup-shop" />
      <label className="font-semibold" htmlFor="s-name">
        Aapka naam
      </label>
      <input id="s-name" className="input" autoComplete="name" value={f.name} onChange={set("name")} data-testid="setup-name" />
      <label className="font-semibold" htmlFor="s-mobile">
        Aapka mobile number (WhatsApp wala)
      </label>
      <input id="s-mobile" className="input" type="tel" inputMode="tel" autoComplete="tel" value={f.mobile} onChange={set("mobile")} data-testid="setup-mobile" />
      <label className="font-semibold" htmlFor="s-pass">
        Passcode (kam se kam 8 akshar)
      </label>
      <input id="s-pass" className="input" type="password" autoComplete="new-password" value={f.passcode} onChange={set("passcode")} data-testid="setup-passcode" />
      <label className="font-semibold" htmlFor="s-again">
        Passcode dobara
      </label>
      <input id="s-again" className="input" type="password" autoComplete="new-password" value={f.again} onChange={set("again")} data-testid="setup-again" />
      <label className="font-semibold" htmlFor="s-upi">
        Dukaan ka UPI id (zaroori nahi)
      </label>
      <input id="s-upi" className="input" autoComplete="off" value={f.upiVpa} onChange={set("upiVpa")} />
      <label className="font-semibold" htmlFor="s-code">
        Setup code
      </label>
      <input id="s-code" className="input" autoComplete="off" value={f.setupCode} onChange={set("setupCode")} data-testid="setup-code" />
      <p className="text-base">Setup code us computer par hai jahan yeh app chal raha hai: .data/setup-code.txt file mein.</p>
      <button type="submit" className="btn btn-primary w-fit" disabled={busy || !f.shopName.trim() || !f.name.trim() || !f.mobile.trim() || !f.passcode || !f.setupCode.trim()} data-testid="setup-submit">
        Dukaan set karo
      </button>
      {error ? (
        <p className="sticker bg-haldi p-3 font-semibold" role="alert" data-testid="setup-error">
          {error}
        </p>
      ) : null}
    </form>
  );
}
