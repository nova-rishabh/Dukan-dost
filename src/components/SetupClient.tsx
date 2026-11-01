"use client";

import { useEffect, useState } from "react";
import { useLocale } from "./LocaleProvider";
import { api } from "@/lib/client/api";

/** First run: name the shop, create the one owner. Needs the setup code from the machine that runs the app. */
export function SetupClient() {
  const { t, hint } = useLocale();
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
      .catch((e) => setError(hint(e, "network")));
  }, [hint]);

  async function submit() {
    setError(null);
    if (f.passcode !== f.again) {
      setError(t("passwordsMismatch"));
      return;
    }
    setBusy(true);
    try {
      await api.setup({ setupCode: f.setupCode, shopName: f.shopName, name: f.name, mobile: f.mobile, passcode: f.passcode, upiVpa: f.upiVpa || undefined });
      window.location.assign("/shop");
    } catch (e) {
      setError(hint(e, "setupFailed"));
      setBusy(false);
    }
  }

  if (!ready && !error) {
    return (
      <p aria-busy="true" role="status">
        {t("loading")}
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
        {t("shopName")}
      </label>
      <input id="s-shop" className="input" autoComplete="organization" value={f.shopName} onChange={set("shopName")} data-testid="setup-shop" />
      <label className="font-semibold" htmlFor="s-name">
        {t("ownerName")}
      </label>
      <input id="s-name" className="input" autoComplete="name" value={f.name} onChange={set("name")} data-testid="setup-name" />
      <label className="font-semibold" htmlFor="s-mobile">
        {t("ownerMobile")}
      </label>
      <input id="s-mobile" className="input" type="tel" inputMode="tel" autoComplete="tel" value={f.mobile} onChange={set("mobile")} data-testid="setup-mobile" />
      <label className="font-semibold" htmlFor="s-pass">
        {t("newPasswordRule")}
      </label>
      <input id="s-pass" className="input" type="password" autoComplete="new-password" value={f.passcode} onChange={set("passcode")} data-testid="setup-passcode" />
      <label className="font-semibold" htmlFor="s-again">
        {t("repeatPassword")}
      </label>
      <input id="s-again" className="input" type="password" autoComplete="new-password" value={f.again} onChange={set("again")} data-testid="setup-again" />
      <label className="font-semibold" htmlFor="s-upi">
        {t("optionalUpi")}
      </label>
      <input id="s-upi" className="input" autoComplete="off" value={f.upiVpa} onChange={set("upiVpa")} />
      <label className="font-semibold" htmlFor="s-code">
        {t("setupCode")}
      </label>
      <input id="s-code" className="input" autoComplete="off" value={f.setupCode} onChange={set("setupCode")} data-testid="setup-code" />
      <p className="text-base">{t("setupCodeHelp")}</p>
      <button type="submit" className="btn btn-primary w-fit" disabled={busy || !f.shopName.trim() || !f.name.trim() || !f.mobile.trim() || !f.passcode || !f.setupCode.trim()} data-testid="setup-submit">
        {t("setup")}
      </button>
      {error ? (
        <p className="sticker bg-haldi p-3 font-semibold" role="alert" data-testid="setup-error">
          {error}
        </p>
      ) : null}
    </form>
  );
}
