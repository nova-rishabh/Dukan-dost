"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useLocale } from "./LocaleProvider";
import { api, ApiError, type Me } from "@/lib/client/api";

type Mode = "passcode" | "whatsapp";

const svgSrc = (svg: string) => `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;

/** Two ways in: passcode, or a code sent to the owner's WhatsApp by the WhatsApp service. */
export function LoginClient() {
  const { t, hint, locale } = useLocale();
  const [me, setMe] = useState<Me | null>(null);
  const [mode, setMode] = useState<Mode>("passcode");
  const [mobile, setMobile] = useState("");
  const [passcode, setPasscode] = useState("");
  const [captcha, setCaptcha] = useState<{ captchaId: string; svg: string } | null>(null);
  const [captchaCode, setCaptchaCode] = useState("");
  const [step, setStep] = useState<"details" | "code">("details");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [captchaState, setCaptchaState] = useState<"idle" | "loading" | "ready" | "failed">("idle");
  const [captchaError, setCaptchaError] = useState<string | null>(null);
  const captchaPending = useRef(false);

  const loadMe = useCallback(async () => {
    setLoadError(null);
    try {
      const m = await api.me();
      setMe(m);
      if (!m.authRequired || (m.loggedIn && new URLSearchParams(window.location.search).get("reauth") !== "1")) window.location.assign("/shop");
    } catch (e) {
      setLoadError(hint(e, "loginLoadFailed"));
    }
  }, [hint]);

  useEffect(() => { void loadMe(); }, [loadMe]);

  const loadCaptcha = useCallback(async () => {
    if (captchaPending.current) return;
    captchaPending.current = true;
    setCaptchaState("loading");
    setCaptchaError(null);
    setCaptcha(null);
    setCaptchaCode("");
    try {
      setCaptcha(await api.waCaptcha());
      setCaptchaState("ready");
    } catch (e) {
      setCaptchaState("failed");
      setCaptchaError(hint(e, "captchaFailed"));
    } finally {
      captchaPending.current = false;
    }
  }, [hint]);

  useEffect(() => {
    if (mode === "whatsapp" && step === "details" && captchaState === "idle") void loadCaptcha();
  }, [mode, step, captchaState, loadCaptcha]);

  async function run(fn: () => Promise<void>) {
    setBusy(true);
    setError(null);
    try {
      await fn();
    } catch (e) {
      setError(hint(e, "requestFailed"));
    } finally {
      setBusy(false);
    }
  }

  const loginPasscode = () =>
    run(async () => {
      await api.login(mobile, passcode);
      window.location.assign("/shop");
    });

  const sendCode = () =>
    run(async () => {
      if (!captcha) throw new ApiError("captcha", "no captcha", t("captchaRequired"), 0);
      try {
        await api.waSend(mobile, captcha.captchaId, captchaCode);
        setStep("code");
      } catch (e) {
        void loadCaptcha();
        throw e;
      }
    });

  const verifyCode = () =>
    run(async () => {
      await api.waVerify(mobile, code);
      window.location.assign("/shop");
    });

  if (!me) {
    return loadError ? (
      <div className="grid gap-3">
        <p className="sticker p-3 font-semibold" role="alert" data-testid="login-load-error">{loadError}</p>
        <button type="button" className="btn w-fit" onClick={() => void loadMe()}>{t("retry")}</button>
      </div>
    ) : <p aria-busy="true" role="status">{t("loading")}</p>;
  }

  return (
    <div className="grid gap-4">
      {me.waLogin ? (
        <div role="group" aria-label={t("loginMethod")} className="chip-grid">
          <button type="button" className="chip" aria-pressed={mode === "passcode"} onClick={() => { setMode("passcode"); setError(null); }}>
            {t("passwordMode")}
          </button>
          <button type="button" className="chip" aria-pressed={mode === "whatsapp"} onClick={() => { setMode("whatsapp"); setStep("details"); setError(null); }} data-testid="mode-whatsapp">
            {t("whatsappMode")}
          </button>
        </div>
      ) : null}

      {mode === "passcode" ? (
        <form
          className="grid gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            void loginPasscode();
          }}
        >
          <label className="font-semibold" htmlFor="login-mobile">
            {t("mobile")}
          </label>
          <input id="login-mobile" className="input" type="tel" inputMode="tel" autoComplete="tel" value={mobile} onChange={(e) => setMobile(e.target.value)} />
          <label className="font-semibold" htmlFor="login-passcode">
            {t("password")}
          </label>
          <input id="login-passcode" className="input" type="password" autoComplete="current-password" value={passcode} onChange={(e) => setPasscode(e.target.value)} />
          <button type="submit" className="btn btn-primary w-fit" disabled={busy || !mobile.trim() || !passcode} data-testid="login-submit">
            {t("signIn")}
          </button>
        </form>
      ) : step === "details" ? (
        <form
          className="grid gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            void sendCode();
          }}
        >
          <label className="font-semibold" htmlFor="wa-mobile">
            {t("whatsappMobile")}
          </label>
          <input id="wa-mobile" className="input" type="tel" inputMode="tel" autoComplete="tel" value={mobile} onChange={(e) => setMobile(e.target.value)} />
          <div className="sticker flex items-center justify-between gap-3 p-3">
            {captcha ? (
              /* an SVG data URL in an <img>: images cannot run scripts */
              <img src={svgSrc(captcha.svg)} alt={t("captchaAlt")} width={180} height={60} data-testid="wa-captcha" />
            ) : (
              <span aria-busy={captchaState === "loading"}>{captchaState === "failed" ? t("captchaMissing") : t("captchaLoading")}</span>
            )}
            <button type="button" className="chip" disabled={captchaState === "loading" || busy} onClick={() => void loadCaptcha()}>
              {t("newImage")}
            </button>
          </div>
          {captchaError ? <p role="alert" data-testid="captcha-error">{captchaError}</p> : null}
          <label className="font-semibold" htmlFor="wa-captcha-code">
            {t("captchaLabel")}
          </label>
          <input id="wa-captcha-code" className="input" autoComplete="off" autoCapitalize="characters" maxLength={8} value={captchaCode} onChange={(e) => setCaptchaCode(e.target.value)} data-testid="wa-captcha-code" />
          <button type="submit" className="btn btn-reminder w-fit" disabled={busy || !mobile.trim() || !captcha || !captchaCode.trim()} data-testid="wa-send">
            {t("sendCode")}
          </button>
        </form>
      ) : (
        <form
          className="grid gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            void verifyCode();
          }}
        >
          <p>{t("codeSent")}</p>
          <label className="font-semibold" htmlFor="wa-code">
            {t("sixDigitCode")}
          </label>
          <input id="wa-code" className="input" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} data-testid="wa-code" />
          <div className="btn-grid">
            <button type="submit" className="btn btn-primary" disabled={busy || code.length !== 6} data-testid="wa-verify">
              {t("signIn")}
            </button>
            <button type="button" className="btn" onClick={() => { setStep("details"); setCaptcha(null); setCaptchaState("idle"); setCode(""); setError(null); }}>
              {t("newCode")}
            </button>
          </div>
        </form>
      )}

      <div className="flex flex-wrap gap-4"><Link className="underline" href="/signup">{locale === "en" ? "Create a shop" : "Dukaan banao"}</Link><Link className="underline" href="/recover">{locale === "en" ? "Recover account" : "Account wapas kholo"}</Link></div>
      {error ? (
        <p className="sticker bg-haldi p-3 font-semibold" role="alert" data-testid="login-error">
          {error}
        </p>
      ) : null}
    </div>
  );
}
