import { formatINR } from "./money";

const HONORIFIC_END = /\b(ji|didi|babu|bhai|bhaiya|sahab|aunty|devi|madam)$/i;

export function buildReminderText(input: { customerName: string; shopName: string; amountPaise: number; payUrl: string; locale?: "en" | "hi-Latn" }): string {
  if (input.locale === "en") return `Hello ${input.customerName.trim()}, this is ${input.shopName}. Your outstanding balance is ${formatINR(input.amountPaise)}. You can pay here when convenient: ${input.payUrl}. Thank you.`;
  const name = HONORIFIC_END.test(input.customerName.trim()) ? input.customerName.trim() : `${input.customerName.trim()} ji`;
  return `Namaste ${name}, ${input.shopName} se. Aapka ${formatINR(input.amountPaise)} baaki hai. Jab suvidha ho yahan se de dijiye: ${input.payUrl}. Dhanyavaad.`;
}

/** Click-to-send link. The owner reviews the text in WhatsApp and presses Send; we never send. */
export function buildWaUrl(input: { text: string; phone?: string }): string {
  const digits = (input.phone ?? "").replace(/\D/g, "");
  const base = digits ? `https://wa.me/${digits}` : "https://wa.me/";
  return `${base}?text=${encodeURIComponent(input.text)}`;
}
