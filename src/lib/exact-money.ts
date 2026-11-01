import { amountInWords, HI_WORDS } from "./money";

/** Parse the written decimal, never multiply a binary floating point rupee value. */
export function parseRupeeText(value: string): number {
  const text = value.trim();
  if (!/^\d{1,6}(?:\.\d{1,2})?$/.test(text)) throw new Error("invalid_amount");
  const [whole, fraction = ""] = text.split(".");
  const amount = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
  if (!Number.isSafeInteger(amount) || amount <= 0 || amount > 10_000_000) throw new Error("invalid_amount");
  return amount;
}

export function paiseInWords(amount: number): { en: string; hi: string } {
  if (!Number.isSafeInteger(amount) || amount <= 0 || amount > 10_000_000) throw new Error("invalid_amount");
  const whole = Math.floor(amount / 100);
  const fraction = amount % 100;
  const rupees = whole ? amountInWords(whole) : { en: "zero rupees", hi: "शून्य रुपये" };
  if (!fraction) return rupees;
  // Reuse the established Indian number names, replacing only the currency suffix.
  const english = amountInWords(fraction).en.replace(/ rupees?$/, "");
  return { en: `${rupees.en} and ${english} ${fraction === 1 ? "paisa" : "paise"}`, hi: `${rupees.hi} और ${HI_WORDS[fraction]} पैसे` };
}
