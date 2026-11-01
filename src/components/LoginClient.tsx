"use client";

import { useCallback, useEffect, useState } from "react";
import { api, ApiError, type Me } from "@/lib/client/api";

type Mode = "passcode" | "whatsapp";

const msg = (e: unknown, fallback: string) => (e instanceof ApiError ? e.hint : fallback);
const svgSrc = (svg: string) => `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;

/** Two ways in: passcode, or a code sent to the owner's WhatsApp by the WhatsApp service. */
export function LoginClient() {
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

  useEffect(() => {
    api
      .me()
      .then((m) => {
        setMe(m);
        if (m.setupNeeded) window.location.assign("/setup");
        else if (m.loggedIn || !m.authRequired) window.location.assign("/shop");
      })
      .catch(() => setError("Net nahi hai. Thodi der baad try karo."));
  }, []);

  const loadCaptcha = useCallback(async () => {
    setCaptchaCode("");
    try {
      setCaptcha(await api.waCaptcha());
    } catch (e) {
      setCaptcha(null);
      setError(msg(e, "Photo wala code nahi aaya. Dobara try karo."));
    }
  }, []);

  useEffect(() => {
    if (mode === "whatsapp" && step === "details" && !captcha) void loadCaptcha();
  }, [mode, step, captcha, loadCaptcha]);

  async function run(fn: () => Promise<void>) {
    setBusy(true);
    setError(null);
    try {
      await fn();
    } catch (e) {
      setError(msg(e, "Kuch gadbad hui. Dobara try karo."));
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
      if (!captcha) throw new ApiError("captcha", "no captcha", "Pehle photo ke akshar likho.", 0);
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
    return (
      <p aria-busy="true" role="status">
        Khul raha hai…
      </p>
    );
  }

  return (
    <div className="grid gap-4">
      {me.waLogin ? (
        <div role="group" aria-label="Login ka tareeka" className="flex flex-wrap gap-2">
          <button type="button" className="chip" aria-pressed={mode === "passcode"} onClick={() => { setMode("passcode"); setError(null); }}>
            Passcode se
          </button>
          <button type="button" className="chip" aria-pressed={mode === "whatsapp"} onClick={() => { setMode("whatsapp"); setStep("details"); setError(null); }} data-testid="mode-whatsapp">
            WhatsApp code se
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
            Mobile number
          </label>
          <input id="login-mobile" className="input" type="tel" inputMode="tel" autoComplete="tel" value={mobile} onChange={(e) => setMobile(e.target.value)} />
          <label className="font-semibold" htmlFor="login-passcode">
            Passcode
          </label>
          <input id="login-passcode" className="input" type="password" autoComplete="current-password" value={passcode} onChange={(e) => setPasscode(e.target.value)} />
          <button type="submit" className="btn btn-primary w-fit" disabled={busy || !mobile.trim() || !passcode} data-testid="login-submit">
            Login karo
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
            Mobile number (jis par WhatsApp hai)
          </label>
          <input id="wa-mobile" className="input" type="tel" inputMode="tel" autoComplete="tel" value={mobile} onChange={(e) => setMobile(e.target.value)} />
          <div className="sticker flex items-center justify-between gap-3 p-3">
            {captcha ? (
              /* an SVG data URL in an <img>: images cannot run scripts */
              <img src={svgSrc(captcha.svg)} alt="Photo mein likhe hue akshar" width={180} height={60} data-testid="wa-captcha" />
            ) : (
              <span aria-busy="true">Photo aa raha hai…</span>
            )}
            <button type="button" className="chip" onClick={() => void loadCaptcha()}>
              Naya photo
            </button>
          </div>
          <label className="font-semibold" htmlFor="wa-captcha-code">
            Photo mein jo likha hai
          </label>
          <input id="wa-captcha-code" className="input" autoComplete="off" autoCapitalize="characters" maxLength={8} value={captchaCode} onChange={(e) => setCaptchaCode(e.target.value)} data-testid="wa-captcha-code" />
          <button type="submit" className="btn btn-reminder w-fit" disabled={busy || !mobile.trim() || !captcha || !captchaCode.trim()} data-testid="wa-send">
            Code bhejo
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
          <p>Agar yeh number sahi hai to WhatsApp par 6 ank ka code aaya hoga. 5 minute mein khatam ho jaata hai.</p>
          <label className="font-semibold" htmlFor="wa-code">
            6 ank ka code
          </label>
          <input id="wa-code" className="input" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} data-testid="wa-code" />
          <div className="flex flex-wrap gap-3">
            <button type="submit" className="btn btn-primary" disabled={busy || code.length !== 6} data-testid="wa-verify">
              Login karo
            </button>
            <button type="button" className="btn" onClick={() => { setStep("details"); setCaptcha(null); setCode(""); setError(null); }}>
              Naya code mangao
            </button>
          </div>
        </form>
      )}

      {error ? (
        <p className="sticker bg-haldi p-3 font-semibold" role="alert" data-testid="login-error">
          {error}
        </p>
      ) : null}
    </div>
  );
}
