export const LOCALE_COOKIE = "dukaan-locale";
export type Locale = "en" | "hi-Latn";
export const readLocale = (value: string | undefined): Locale => value === "en" ? "en" : "hi-Latn";

const en = {
  language: "Language", skip: "Skip to main content", home: "Dukaan Dost, home", sampleShop: "Sample shop", myShop: "My shop",
  languageScope: "English preview: account screens. The khata is still in Hinglish.",
  setup: "Set up shop", login: "Login", logout: "Logout", demo: "Demo mode", mainNav: "Main navigation",
  loading: "Opening…", retry: "Try again", network: "Check your connection and try again.",
  loginIntro: "Only the shop owner can sign in.", setupIntro: "Set up once to become the owner of this shop.",
  loginLoadFailed: "Login could not open. Check your connection and try again.",
  captchaFailed: "The image code could not load. Request a new image or use your password.",
  captchaRequired: "Enter the letters from the image first.", requestFailed: "Something went wrong. Please try again.",
  loginMethod: "Sign-in method", passwordMode: "Use password", whatsappMode: "Use WhatsApp code",
  mobile: "Mobile number", password: "Password", signIn: "Sign in", whatsappMobile: "Mobile number with WhatsApp",
  captchaAlt: "Letters in the image", captchaMissing: "Image could not load.", captchaLoading: "Loading image…",
  newImage: "New image", captchaLabel: "Letters from the image", sendCode: "Send code",
  codeSent: "If the number is correct, a 6-digit code has been sent to its WhatsApp. It expires in 5 minutes.",
  sixDigitCode: "6-digit code", newCode: "Request a new code", passwordsMismatch: "The passwords do not match.",
  setupFailed: "Shop setup failed. Please try again.", shopName: "Shop name", ownerName: "Your name",
  ownerMobile: "Your mobile number with WhatsApp", newPasswordRule: "Password (at least 8 characters)",
  repeatPassword: "Repeat password", optionalUpi: "Shop UPI ID (optional)", setupCode: "Setup code",
  setupCodeHelp: "Ask the app operator for the setup code. It is in setup-code.txt beside the shop database.",
  changePassword: "Change password", currentPassword: "Current password", nextPassword: "New password (at least 8 characters)",
  change: "Change", passwordChanged: "Password changed. All devices have been signed out. Sign in with the new password.",
  passwordFailed: "The password could not be changed. Try again.", allSignedOut: "All devices have been signed out. Sign in again.",
  logoutFailed: "Sign-out did not complete. Try again.", lostPhone: "Lost your phone? Sign out all devices, including this one.",
  logoutAll: "Sign out all devices", confirmLogoutAll: "Yes, sign out all devices", cancel: "Cancel",
  timeout: "The response is taking too long. Try opening again.",
  interruptedWrite: "No response received. The action may have completed. Check your ledger or status before trying again.",
  badCredentials: "Check your mobile number and password.", locked: "Too many attempts. Wait a while before trying again.",
  weakPassword: "Use a password of at least 8 characters that is not easy to guess.", badMobile: "Enter a valid mobile number with its country code.",
  badSetupCode: "The setup code is incorrect. Check it with the operator.", alreadySetup: "This shop is already set up. Sign in instead.",
  captchaInvalid: "The image code is incorrect or expired. Request a new image.", badCode: "The verification code is incorrect or expired.",
  waUnavailable: "WhatsApp verification is unavailable. Use your password or try again later.",
  rateLimited: "Too many requests. Wait a while, then try again.", authRequired: "Sign in to continue.", setupRequired: "Set up the shop first.",
} as const;

const hi: Record<keyof typeof en, string> = {
  language: "Bhasha", skip: "Seedha kaam par jao", home: "Dukaan Dost, home", sampleShop: "Sample dukaan", myShop: "Meri dukaan",
  languageScope: "English abhi account screen par hai. Khata filhaal Hinglish mein hai.",
  setup: "Dukaan set karo", login: "Login", logout: "Logout", demo: "Demo mode", mainNav: "Main",
  loading: "Khul raha hai…", retry: "Dobara kholo", network: "Net nahi hai. Connection check karke dobara kholo.",
  loginIntro: "Sirf dukaan ka maalik andar aa sakta hai.", setupIntro: "Ek baar ka kaam. Isse aap is dukaan ke maalik ban jaate ho.",
  loginLoadFailed: "Login nahi khula. Connection check karke dobara kholo.",
  captchaFailed: "Photo wala code nahi aaya. Naya photo dabao ya Passcode se login karo.",
  captchaRequired: "Pehle photo ke akshar likho.", requestFailed: "Kuch gadbad hui. Dobara try karo.",
  loginMethod: "Login ka tareeka", passwordMode: "Passcode se", whatsappMode: "WhatsApp code se",
  mobile: "Mobile number", password: "Passcode", signIn: "Login karo", whatsappMobile: "Mobile number (jis par WhatsApp hai)",
  captchaAlt: "Photo mein likhe hue akshar", captchaMissing: "Photo nahi aaya.", captchaLoading: "Photo aa raha hai…",
  newImage: "Naya photo", captchaLabel: "Photo mein jo likha hai", sendCode: "Code bhejo",
  codeSent: "Agar yeh number sahi hai to WhatsApp par 6 ank ka code aaya hoga. 5 minute mein khatam ho jaata hai.",
  sixDigitCode: "6 ank ka code", newCode: "Naya code mangao", passwordsMismatch: "Dono passcode ek jaise nahi hain.",
  setupFailed: "Set nahi ho paya. Dobara try karo.", shopName: "Dukaan ka naam", ownerName: "Aapka naam",
  ownerMobile: "Aapka mobile number (WhatsApp wala)", newPasswordRule: "Passcode (kam se kam 8 akshar)",
  repeatPassword: "Passcode dobara", optionalUpi: "Dukaan ka UPI id (zaroori nahi)", setupCode: "Setup code",
  setupCodeHelp: "Setup code app chalane wale operator se lo. Yeh database wale folder ki setup-code.txt file mein hai.",
  changePassword: "Passcode badlo", currentPassword: "Abhi ka passcode", nextPassword: "Naya passcode (kam se kam 8 akshar)",
  change: "Badlo", passwordChanged: "Passcode badal diya. Sab device se logout ho gaya. Naye passcode se login karo.",
  passwordFailed: "Passcode nahi badla. Dobara try karo.", allSignedOut: "Sab device se logout ho gaya. Dobara login karo.",
  logoutFailed: "Logout nahi hua. Dobara try karo.", lostPhone: "Phone kho gaya? Sab device se logout kar sakte hain. Is device se bhi logout hoga.",
  logoutAll: "Sab device se logout", confirmLogoutAll: "Haan, sab se logout", cancel: "Rehne do",
  timeout: "Jawab der se aa raha hai. Dobara kholo.",
  interruptedWrite: "Jawab nahi mila. Kaam hua ho sakta hai. Dobara dabane se pehle khata ya status check karo.",
  badCredentials: "Mobile number aur passcode dobara check karo.", locked: "Bahut baar try kiya. Thodi der ruko, phir try karo.",
  weakPassword: "Passcode kam se kam 8 akshar ka rakho aur aasaan passcode mat chuno.", badMobile: "Mobile number desh code ke saath likho.",
  badSetupCode: "Setup code galat hai. Operator se check karo.", alreadySetup: "Dukaan pehle se set hai. Login karo.",
  captchaInvalid: "Photo wala code galat ya purana hai. Naya photo mangao.", badCode: "Code galat hai ya purana ho gaya.",
  waUnavailable: "WhatsApp code nahi mil raha. Passcode se login karo ya baad mein try karo.",
  rateLimited: "Bahut request ho gayi. Thodi der ruko, phir try karo.", authRequired: "Pehle login karo.", setupRequired: "Pehle dukaan set karo.",
};

export type MessageKey = keyof typeof en;
export const translate = (locale: Locale, key: MessageKey): string => (locale === "en" ? en : hi)[key];

const errorKeys: Record<string, MessageKey> = {
  network: "network", timeout: "timeout", aborted: "network", bad_credentials: "badCredentials", locked: "locked",
  weak_passcode: "weakPassword", bad_mobile: "badMobile", bad_setup_code: "badSetupCode", already_set_up: "alreadySetup",
  captcha_failed: "captchaInvalid", bad_code: "badCode", wa_unavailable: "waUnavailable", wa_failed: "waUnavailable",
  rate_limited: "rateLimited", auth_required: "authRequired", setup_required: "setupRequired",
};

/** Codes select localized copy; raw provider/server text is never translated as evidence. */
export function errorHint(locale: Locale, error: unknown, fallback: MessageKey): string {
  if (error && typeof error === "object" && "code" in error) {
    const code = String(error.code);
    if (locale === "en" && code === "bad_credentials" && fallback === "setupFailed") return translate(locale, "badSetupCode");
    // Client write interruption must keep its uncertainty warning in either language.
    if (["timeout", "network", "aborted"].includes(code) && "hint" in error && String(error.hint).includes("Kaam hua ho sakta hai")) {
      return translate(locale, "interruptedWrite");
    }
    if (locale === "hi-Latn" && "hint" in error && typeof error.hint === "string") return error.hint;
    return translate(locale, errorKeys[code] ?? fallback);
  }
  return translate(locale, fallback);
}
