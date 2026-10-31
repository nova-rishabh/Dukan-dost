/** upi://pay deep link. Amount is built from integer paise, so it always has exactly two decimals. */
export function buildUpiUri(input: { vpa: string; shopName: string; amountPaise: number; note: string }): string {
  const rupees = Math.floor(input.amountPaise / 100);
  const paise = String(input.amountPaise % 100).padStart(2, "0");
  const enc = encodeURIComponent;
  return `upi://pay?pa=${enc(input.vpa)}&pn=${enc(input.shopName)}&am=${rupees}.${paise}&cu=INR&tn=${enc(input.note)}`;
}
