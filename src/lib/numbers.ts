import { HI_WORDS, EN_ONES, EN_TENS } from "./money";
import { normaliseWord, tokenize, type Token } from "./text";

export interface ParsedAmount {
  rupees: number;
  confidence: "high" | "medium";
  /** token index range, end exclusive; includes a currency marker when present */
  tokenStart: number;
  tokenEnd: number;
  /** the spoken text this amount came from */
  text: string;
}

const ROMAN_SMALL: Record<number, string[]> = {
  1: ["ek"], 2: ["do"], 3: ["teen"], 4: ["char", "chaar"], 5: ["paanch", "panch", "paach"],
  6: ["chhe", "chhah", "chhay"], 7: ["saat"], 8: ["aath", "aat"], 9: ["nau"], 10: ["das"],
  11: ["gyarah", "gyaarah", "gyara"], 12: ["barah", "baarah"], 13: ["terah"], 14: ["chaudah"],
  15: ["pandrah", "pandra"], 16: ["solah"], 17: ["satrah"], 18: ["atharah", "athaarah"], 19: ["unnis", "unnees"],
  20: ["bees"], 21: ["ikkis", "ikkees"], 22: ["baais", "bais"], 23: ["teis", "teeis"], 24: ["chaubis"],
  25: ["pachchis", "pachis", "pachees"], 26: ["chhabbis", "chabbis"], 27: ["sattais"], 28: ["atthais", "athais"],
  29: ["untis", "unatis"], 30: ["tees", "tis"], 31: ["ikatis"], 32: ["battis"], 33: ["taintis"], 34: ["chautis"],
  35: ["paintis"], 36: ["chhattis"], 37: ["saintis"], 38: ["adtis"], 39: ["untalis"], 40: ["chalis", "chaalis"],
  41: ["iktalis"], 42: ["bayalis"], 43: ["taintalis"], 44: ["chauvalis"], 45: ["paintalis"], 46: ["chhiyalis"],
  47: ["saintalis"], 48: ["adtalis"], 49: ["unchas"], 50: ["pachaas", "pachas", "pachaash"],
  51: ["ikyavan"], 52: ["bavan"], 53: ["tirpan"], 54: ["chauvan"], 55: ["pachpan"], 56: ["chhappan"], 57: ["sattavan"],
  58: ["atthavan"], 59: ["unsath"], 60: ["saath", "sath"], 61: ["iksath"], 62: ["basath"], 63: ["tirsath"],
  64: ["chausath"], 65: ["painsath"], 66: ["chhiyasath"], 67: ["sarsath"], 68: ["adsath"], 69: ["unhattar"],
  70: ["sattar"], 71: ["ikhattar"], 72: ["bahattar"], 73: ["tihattar"], 74: ["chauhattar"], 75: ["pachattar", "pachhattar"],
  76: ["chhihattar"], 77: ["sathattar"], 78: ["athattar"], 79: ["unasi"], 80: ["assi"], 81: ["ikyasi"], 82: ["bayasi"],
  83: ["tirasi"], 84: ["chaurasi"], 85: ["pachasi"], 86: ["chhiyasi"], 87: ["sattasi"], 88: ["athasi"], 89: ["navasi"],
  90: ["nabbe"], 91: ["ikyanve"], 92: ["banve"], 93: ["tiranve"], 94: ["chauranve"], 95: ["pachanve"], 96: ["chhiyanve"],
  97: ["sattanve"], 98: ["atthanve"], 99: ["ninyanve", "ninnanve"],
};
const DEV_EXTRA: Record<string, number> = { "छः": 6, "छे": 6, "पन्द्रह": 15, "बाइस": 22, "तेइस": 23 };

const SMALL = new Map<string, number>();
for (const [n, words] of Object.entries(ROMAN_SMALL)) for (const w of words) SMALL.set(normaliseWord(w), Number(n));
HI_WORDS.forEach((w, n) => n > 0 && SMALL.set(normaliseWord(w), n));
for (const [w, n] of Object.entries(DEV_EXTRA)) SMALL.set(normaliseWord(w), n);
EN_ONES.forEach((w, n) => n > 0 && SMALL.set(w, n));
EN_TENS.forEach((w, i) => w && SMALL.set(w, i * 10));

const MULT = new Map<string, number>();
for (const w of ["sau", "सौ", "hundred"]) MULT.set(normaliseWord(w), 100);
for (const w of ["hazaar", "hajar", "hazar", "hajaar", "हज़ार", "हजार", "thousand"]) MULT.set(normaliseWord(w), 1000);
for (const w of ["lakh", "lac", "laakh", "लाख", "lakhs"]) MULT.set(normaliseWord(w), 100000);

/** idioms that stand in for a number: dedh (1.5), dhai (2.5) */
const IDIOM_VALUE = new Map<string, number>();
for (const w of ["dedh", "dhed", "डेढ़", "डेढ"]) IDIOM_VALUE.set(normaliseWord(w), 1.5);
for (const w of ["dhai", "dhaai", "dhaee", "ढाई"]) IDIOM_VALUE.set(normaliseWord(w), 2.5);
/** idioms that adjust the next number: sadhe +0.5, sawa +0.25, paune -0.25 */
const IDIOM_ADJUST = new Map<string, number>();
for (const w of ["sadhe", "saadhe", "saade", "साढ़े", "साढे"]) IDIOM_ADJUST.set(normaliseWord(w), 0.5);
for (const w of ["sawa", "savaa", "सवा"]) IDIOM_ADJUST.set(normaliseWord(w), 0.25);
for (const w of ["paune", "paun", "पौने"]) IDIOM_ADJUST.set(normaliseWord(w), -0.25);

const CURRENCY = new Set(
  ["rupaye", "rupay", "rupaiya", "rupya", "rupees", "rupee", "rs", "inr", "taka", "रुपये", "रुपए", "रुपया", "₹"].map(normaliseWord),
);
const UNITS = new Set(
  [
    "kilo", "kg", "kilogram", "gram", "gm", "litre", "liter", "ltr", "packet", "pkt", "dozen", "darjan",
    "piece", "pcs", "bori", "bottle", "botal", "किलो", "ग्राम", "लीटर", "पैकेट", "दर्जन", "बोरी", "पीस",
  ].map(normaliseWord),
);

type Kind = "digit" | "small" | "mult" | "idiomValue" | "idiomAdjust";
function kindOf(t: Token): { kind: Kind; value: number } | null {
  if (t.type === "number") return { kind: "digit", value: Number(t.norm) };
  if (t.type !== "word") return null;
  const m = MULT.get(t.norm);
  if (m !== undefined) return { kind: "mult", value: m };
  const iv = IDIOM_VALUE.get(t.norm);
  if (iv !== undefined) return { kind: "idiomValue", value: iv };
  const ia = IDIOM_ADJUST.get(t.norm);
  if (ia !== undefined) return { kind: "idiomAdjust", value: ia };
  const s = SMALL.get(t.norm);
  if (s !== undefined) return { kind: "small", value: s };
  return null;
}

export const isCurrencyToken = (t?: Token) => !!t && (CURRENCY.has(t.norm) || t.raw === "₹");
export const isUnitToken = (t?: Token) => !!t && UNITS.has(t.norm);

/** Parse every rupee amount in the tokens. Quantities (2 kilo, 5 packet) are never returned. */
export function parseAmountsFromTokens(tokens: Token[]): ParsedAmount[] {
  const out: ParsedAmount[] = [];
  let i = 0;
  while (i < tokens.length) {
    if (!kindOf(tokens[i])) {
      i++;
      continue;
    }
    let total = 0;
    let cur = 0;
    let adjust = 0;
    let sawMult = false;
    let sawIdiom = false;
    let lastWasNumber = false;
    let bareSau = true;
    let j = i;
    for (; j < tokens.length; j++) {
      const k = kindOf(tokens[j]);
      if (!k) break;
      if (k.kind === "digit" || k.kind === "small") {
        if (lastWasNumber) break; // two adjacent plain numbers are two amounts, not one
        if (j > i && k.kind === "digit" && !sawMult) break;
        cur += k.value + adjust;
        adjust = 0;
        lastWasNumber = true;
        bareSau = false;
      } else if (k.kind === "idiomValue") {
        if (lastWasNumber || cur !== 0) break;
        cur += k.value;
        sawIdiom = true;
        lastWasNumber = true;
        bareSau = false;
      } else if (k.kind === "idiomAdjust") {
        if (lastWasNumber) break;
        adjust = k.value;
        sawIdiom = true;
        bareSau = false;
      } else {
        if (adjust !== 0 && cur === 0) {
          cur = 1 + adjust;
          adjust = 0;
        }
        if (k.value === 100) {
          if (cur === 0) cur = 1;
          else bareSau = false;
          cur *= 100;
        } else {
          total += (cur === 0 ? 1 : cur) * k.value;
          cur = 0;
          bareSau = false;
        }
        sawMult = true;
        lastWasNumber = false;
      }
    }
    const spanStart = i;
    i = Math.max(j, i + 1);
    if (adjust !== 0) continue; // dangling "sadhe" / "paune"
    let start = spanStart;
    let end = j;
    const value = total + cur;
    const next = tokens[end];
    const prev = tokens[start - 1];
    const hasCurrency = isCurrencyToken(next) || isCurrencyToken(prev);
    const isDigits = tokens[spanStart].type === "number";
    const bareSmallWord = !isDigits && !sawMult && !sawIdiom && value < 10;
    if (isUnitToken(next)) continue;
    if (!Number.isInteger(value) || value <= 0) continue;
    if (bareSmallWord && !hasCurrency) continue;
    if (isCurrencyToken(next)) end++;
    if (isCurrencyToken(prev)) start--;
    const bare = sawMult && bareSau && !isDigits && !sawIdiom && value === 100;
    out.push({
      rupees: value,
      confidence: sawIdiom || bare ? "medium" : "high",
      tokenStart: start,
      tokenEnd: end,
      text: tokens.slice(start, end).map((t) => t.raw).join(" "),
    });
  }
  return out;
}

export function parseAmounts(text: string): ParsedAmount[] {
  return parseAmountsFromTokens(tokenize(text));
}
