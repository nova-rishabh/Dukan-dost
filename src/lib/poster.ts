import { parseAmountsFromTokens } from "./numbers";
import { canonical, hasDevanagari, tokenize, transliterate } from "./text";

export interface PosterItem {
  name: string;
  priceRupees: number;
  unit?: "kilo" | "packet" | "litre";
}

export interface PosterSpec {
  shopName: string;
  headline: string;
  items: PosterItem[];
  validUntil: string;
}

const SKIP = new Set(
  ["rupaye", "rs", "rupees", "per", "mein", "me", "ka", "ki", "ke", "offer", "sirf", "only", "at", "for", "ek", "aaj", "kal", "sale", "bhav", "rate", "daam", "hai", "ab", "sab"].map(canonical),
);
const UNIT_WORDS: Record<string, PosterItem["unit"]> = { kilo: "kilo", kg: "kilo", packet: "packet", pkt: "packet", litre: "litre", liter: "litre", ltr: "litre" };

/**
 * Owner says "aata 40 rupaye kilo, chini 45 kilo". We only pull item names and prices out of the
 * sentence; the layout, fonts and every glyph on the poster come from fixed templates.
 */
export function parseOffer(text: string): PosterItem[] {
  const segments = text.split(/[,;\n]|\baur\b|\band\b/i);
  const items: PosterItem[] = [];
  for (const seg of segments) {
    const tokens = tokenize(seg);
    const amount = parseAmountsFromTokens(tokens)[0];
    if (!amount) continue;
    let unit: PosterItem["unit"];
    const nameTokens = tokens.filter((t, idx) => {
      if (idx >= amount.tokenStart && idx < amount.tokenEnd) return false;
      if (t.type !== "word") return false;
      const u = UNIT_WORDS[t.norm];
      if (u) {
        unit = u;
        return false;
      }
      return !SKIP.has(canonical(t.raw));
    });
    if (nameTokens.length === 0) continue;
    const name = nameTokens
      .slice(0, 3)
      .map((t) => (hasDevanagari(t.raw) ? transliterate(t.raw) : t.raw).toLowerCase())
      .join(" ");
    items.push({ name: name.charAt(0).toUpperCase() + name.slice(1), priceRupees: amount.rupees, ...(unit ? { unit } : {}) });
    if (items.length === 4) break;
  }
  return items;
}

export function buildPoster(input: { shopName: string; text: string; validUntil?: string }): PosterSpec | null {
  const items = parseOffer(input.text);
  if (items.length === 0) return null;
  return { shopName: input.shopName, headline: "Aaj ka offer", items, validUntil: input.validUntil?.trim() || "Aaj shaam tak" };
}
