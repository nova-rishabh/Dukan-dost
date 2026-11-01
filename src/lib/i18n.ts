export const LOCALE_COOKIE = "dukaan-locale";
export type Locale = "en" | "hi-Latn";
export const readLocale = (value: string | undefined): Locale => value === "en" ? "en" : "hi-Latn";

const en = {
  language: "Language", skip: "Skip to main content", home: "Dukaan Dost, home", sampleShop: "Sample shop", myShop: "My shop",
  languageScope: "Speak or type in Hindi, Hinglish or English. Your original entries stay as entered.",
  setup: "Set up shop", login: "Login", logout: "Logout", demo: "Demo mode", mainNav: "Main navigation",
  inputFailed: "The sentence could not be understood. Speak again or type the customer, amount and direction.",
  entryFailed: "Recording could not be confirmed. Check the ledger before trying again.",
  customerFailed: "The customer could not be created. Check the customer list before trying again.",
  draftFailed: "The reminder draft could not be created. Check the customer balance and try again.",
  reminderFailed: "The reminder could not be sent. Check WhatsApp before trying again.",
  posterFailed: "The poster could not be created. Check the item names and prices, then try again.",
  eraseFailed: "Erasing could not be confirmed. Reload the shop to check its data before trying again.",
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
  languageScope: "Hindi, Hinglish ya English mein bolo ya likho. Aapki asli entry waise hi rahegi.",
  setup: "Dukaan set karo", login: "Login", logout: "Logout", demo: "Demo mode", mainNav: "Main",
  inputFailed: "Samajh nahi aaya. Dobara bolo ya likho.",
  entryFailed: "Entry nahi likhi ja saki. Khata check karke dobara try karo.",
  customerFailed: "Customer nahi ban paya. Customer list check karo.",
  draftFailed: "Reminder nahi bana. Khata check karke dobara try karo.",
  reminderFailed: "Message nahi ja paya. WhatsApp check karo.",
  posterFailed: "Poster nahi bana. Item aur daam check karo.",
  eraseFailed: "Data hata ya nahi, pakka nahi hai. Dukaan dobara kholo aur check karo.",
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
    if (locale === "en" && domainErrors[code]) return domainErrors[code];
    return translate(locale, errorKeys[code] ?? fallback);
  }
  return translate(locale, fallback);
}


const domainErrors: Record<string, string> = {
  reauth_required: "Enter your current password or sign in again with WhatsApp before confirming this sensitive action.",
  invalid_import: "This export file is invalid or unsupported. No records were imported.",
  import_conflict: "Shop records changed after the preview. Preview the import again before confirming.",
  import_preview_expired: "The import preview expired. Review the file again before confirming.",
  invalid_mobile_change: "This number-change verification expired or belongs to a different session. Start again.",
  mobile_unavailable: "This number cannot be used for this shop. Choose another verified number.",
  demo_expired: "Your private sample session expired. Start a new sample shop, or sign in to your own shop.",
  invalid_amount: "Enter a positive amount with up to two decimal places, up to ₹1,00,000.",
  invalid_registration: "Your verification expired or is unavailable. Verify your WhatsApp number again.",
  stale_registration: "Your signup verification expired or changed. Request a fresh code and try again.",
  verification_in_progress: "Verification is already in progress. Wait for its result before requesting another code.",
  passcode_required: "Enter your password to continue.",
  profile_required: "Enter your name and shop name to continue.",
  invalid_period: "Choose a valid date range with the start date before the end date.",
  customer_archived: "This customer is archived. Restore the customer before recording another entry.",
  consent_required: "Confirm that the customer agreed to storing this WhatsApp number, or leave it blank.",
  upi_required: "Configure your shop UPI ID in Settings before creating a payment link.",
  verification_locked: "Too many incorrect verification attempts. Request a new verification code.",
  nothing_due: "This customer has no outstanding balance.",
  inventory_conflict: "Stock changed or the item is unavailable. Reload inventory and review before confirming.",
  same_name: "A customer with this name exists. Confirm these are different people before creating a separate account.",
  too_large: "This request is too large. Speak or type a shorter sentence.",
  sample_not_found: "This sample is unavailable. Choose another clip or type your sentence.",
  not_demo: "This action is available only in the sample shop.",
  no_upi: "Ask the shopkeeper to add a UPI ID before creating a pay link.",
  wa_not_connected: "Connect WhatsApp in Settings before sending directly, or open your own WhatsApp.",
  no_outstanding: "This customer has no outstanding balance.",
  forbidden: "You do not have permission for this action. Sign in to your own shop.",
  bad_audio: "This recording could not be read. Record again or type the sentence.",
  no_speech: "No speech was heard. Speak again or type the sentence.",
  not_confirmed: "Review the card and confirm before recording.",
  bad_proposal: "This proposal is invalid or expired. Enter the sentence again and review a fresh card.",
  bad_request: "Check the required fields and try again.",
  not_found: "This record could not be found. Refresh the ledger.",
  needs_clarification: "Choose the customer, amount and money direction before recording.",
  proposal_mismatch: "The details no longer match this proposal. Enter the sentence again and review a fresh card.",
  second_confirm_required: "This large amount needs a second confirmation. Check the amount and confirm again.",
  duplicate_entry: "An identical entry was just recorded. Check the ledger before confirming another.",
  already_voided: "This entry is already voided. Refresh the ledger.",
  draft_stale: "The balance changed. Create a fresh reminder draft before sending.",
  draft_expired: "This reminder draft expired. Create a fresh draft before sending.",
  draft_already_used: "This reminder was already attempted. Check WhatsApp before sending again.",
  delivery_unknown: "Delivery is uncertain. Check the customer's WhatsApp before sending again.",
  no_balance: "There is no outstanding balance to remind this customer about.",
  bad_phone: "Enter a valid WhatsApp number with its country code.",
  empty_audio: "No speech was heard. Speak again or type your entry.",
  audio_too_large: "The recording is too large. Record a shorter sentence or type it.",
  audio_unsupported: "This audio format is unsupported. Try another browser or type your entry.",
  transcription_failed: "The recording could not be understood. Speak again or type your entry.",
  no_items: "Include an item name and price, for example: flour 40 rupees per kilo.",
  invalid_offer: "Include an item name and price, for example: flour 40 rupees per kilo.",
};
