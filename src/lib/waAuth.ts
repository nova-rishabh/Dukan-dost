import { AuthError, normalizeMobile, type OwnerPublic } from "./auth";
import type { LedgerStore } from "./store/types";
import { waResultVerify, waSendOtp, waVerifyOtp, type WaConfig } from "./waService";

/** The daemon wants a name and an email for a first-time user; the owner's email is not collected, so a fixed non-routable one is used. */
const OWNER_EMAIL = "owner@dukaan-dost.invalid";

/**
 * Login with a WhatsApp code, through the WA-USERAUTH daemon: CAPTCHA, rate limits and the code itself
 * live there. This app only decides who may receive a code (the registered owner and nobody else) and
 * who the verified token belongs to.
 */
export async function requestWaCode(
  store: LedgerStore,
  cfg: WaConfig,
  input: { shopId: string; mobile: string; captchaId: string; captchaCode: string; ip: string },
): Promise<{ sent: true }> {
  const mobile = normalizeMobile(input.mobile);
  if (!mobile) throw new AuthError("bad_mobile", "Mobile number is not valid", "Mobile number saaf likho.");
  const owner = await store.getOwner(input.shopId);
  // the same answer whether or not the number is the owner's, and no message goes to anyone else
  if (!owner || owner.mobile !== mobile) return { sent: true };
  await waSendOtp(cfg, { mobile, captchaId: input.captchaId, captchaCode: input.captchaCode, name: owner.name, email: OWNER_EMAIL, ip: input.ip });
  return { sent: true };
}

export async function confirmWaCode(store: LedgerStore, cfg: WaConfig, input: { shopId: string; mobile: string; code: string }): Promise<OwnerPublic> {
  const mobile = normalizeMobile(input.mobile);
  const owner = await store.getOwner(input.shopId);
  if (!mobile || !owner || owner.mobile !== mobile || !/^\d{6}$/.test(input.code ?? "")) {
    throw new AuthError("bad_code", "Code is wrong or expired", "Code galat ya purana hai. Naya code mangao.", 401);
  }
  const token = await waVerifyOtp(cfg, { mobile, code: input.code });
  const verified = await waResultVerify(cfg, token);
  if (verified.mobile !== owner.mobile) throw new AuthError("bad_code", "Verified number is not the owner", "Login poora nahi hua.", 401);
  return { shopId: owner.shopId, name: owner.name, mobile: owner.mobile, authVersion: owner.authVersion };
}
