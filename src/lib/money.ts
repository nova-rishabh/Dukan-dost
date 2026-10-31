/** Money is integer paise everywhere. Rupees appear only at the edges (speech, display). */

export function rupeesToPaise(rupees: number): number {
  if (!Number.isInteger(rupees)) throw new Error("Amount must be whole rupees");
  return rupees * 100;
}

export function paiseToRupees(paise: number): number {
  return Math.trunc(paise / 100);
}

function group(n: number): string {
  const s = String(n);
  if (s.length <= 3) return s;
  const last3 = s.slice(-3);
  const rest = s.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ",");
  return `${rest},${last3}`;
}

/** Indian grouping: 12500000 paise -> "₹1,25,000". Paise shown only when non-zero. */
export function formatINR(paise: number): string {
  const sign = paise < 0 ? "-" : "";
  const abs = Math.abs(paise);
  const rupees = Math.floor(abs / 100);
  const rem = abs % 100;
  const frac = rem === 0 ? "" : `.${String(rem).padStart(2, "0")}`;
  return `${sign}₹${group(rupees)}${frac}`;
}

export const HI_WORDS = [
  "शून्य", "एक", "दो", "तीन", "चार", "पाँच", "छह", "सात", "आठ", "नौ",
  "दस", "ग्यारह", "बारह", "तेरह", "चौदह", "पंद्रह", "सोलह", "सत्रह", "अठारह", "उन्नीस",
  "बीस", "इक्कीस", "बाईस", "तेईस", "चौबीस", "पच्चीस", "छब्बीस", "सत्ताईस", "अट्ठाईस", "उनतीस",
  "तीस", "इकतीस", "बत्तीस", "तैंतीस", "चौंतीस", "पैंतीस", "छत्तीस", "सैंतीस", "अड़तीस", "उनतालीस",
  "चालीस", "इकतालीस", "बयालीस", "तैंतालीस", "चौवालीस", "पैंतालीस", "छियालीस", "सैंतालीस", "अड़तालीस", "उनचास",
  "पचास", "इक्यावन", "बावन", "तिरपन", "चौवन", "पचपन", "छप्पन", "सत्तावन", "अट्ठावन", "उनसठ",
  "साठ", "इकसठ", "बासठ", "तिरसठ", "चौंसठ", "पैंसठ", "छियासठ", "सड़सठ", "अड़सठ", "उनहत्तर",
  "सत्तर", "इकहत्तर", "बहत्तर", "तिहत्तर", "चौहत्तर", "पचहत्तर", "छिहत्तर", "सतहत्तर", "अठहत्तर", "उनासी",
  "अस्सी", "इक्यासी", "बयासी", "तिरासी", "चौरासी", "पचासी", "छियासी", "सत्तासी", "अठासी", "नवासी",
  "नब्बे", "इक्यानवे", "बानवे", "तिरानवे", "चौरानवे", "पचानवे", "छियानवे", "सत्तानवे", "अट्ठानवे", "निन्यानवे",
];

export const EN_ONES = [
  "zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten",
  "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen",
];
export const EN_TENS = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];

function enBelow100(n: number): string {
  if (n < 20) return EN_ONES[n];
  const t = EN_TENS[Math.floor(n / 10)];
  return n % 10 === 0 ? t : `${t}-${EN_ONES[n % 10]}`;
}

function compose(n: number, below100: (x: number) => string, units: Array<[number, string]>, hundred: string): string {
  const parts: string[] = [];
  let rest = n;
  for (const [size, name] of units) {
    const q = Math.floor(rest / size);
    if (q > 0) parts.push(`${compose(q, below100, units, hundred)} ${name}`);
    rest %= size;
  }
  const h = Math.floor(rest / 100);
  if (h > 0) parts.push(`${below100(h)} ${hundred}`);
  rest %= 100;
  if (rest > 0) parts.push(below100(rest));
  return parts.join(" ");
}

/** Whole-rupee amount in words. Digits and words are always shown together on a confirm card. */
export function amountInWords(rupees: number): { hi: string; en: string } {
  if (!Number.isInteger(rupees) || rupees <= 0) throw new Error("Amount must be positive whole rupees");
  const en = compose(
    rupees,
    enBelow100,
    [[10000000, "crore"], [100000, "lakh"], [1000, "thousand"]],
    "hundred",
  );
  const hi = compose(
    rupees,
    (x) => HI_WORDS[x],
    [[10000000, "करोड़"], [100000, "लाख"], [1000, "हज़ार"]],
    "सौ",
  );
  return {
    en: `${en} ${rupees === 1 ? "rupee" : "rupees"}`,
    hi: `${hi} ${rupees === 1 ? "रुपया" : "रुपये"}`,
  };
}
