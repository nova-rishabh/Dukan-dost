/** Tokeniser and Devanagari helpers shared by numbers, rules and resolve. */

export type TokenType = "word" | "number" | "punct";
export interface Token {
  raw: string;
  /** lowercase, Devanagari nukta/chandrabindu normalised */
  norm: string;
  type: TokenType;
  start: number;
  end: number;
}

export function normaliseDevanagari(s: string): string {
  return s
    .normalize("NFD")
    .replace(/़/g, "")
    .replace(/ँ/g, "ं")
    .normalize("NFC");
}

export function normaliseWord(s: string): string {
  return normaliseDevanagari(s.toLowerCase());
}

const TOKEN_RE = /\d+(?:,\d{2,3})*(?:\.\d+)?|[\p{L}\p{M}]+|₹|[,;?!.।]/gu;

export function tokenize(text: string): Token[] {
  const out: Token[] = [];
  for (const m of text.matchAll(TOKEN_RE)) {
    const raw = m[0];
    const type: TokenType = /^\d/.test(raw) ? "number" : /^[,;?!.।]$/.test(raw) ? "punct" : "word";
    out.push({ raw, norm: type === "number" ? raw.replace(/,/g, "") : normaliseWord(raw), type, start: m.index!, end: m.index! + raw.length });
  }
  return out;
}

export const hasDevanagari = (s: string) => /[ऀ-ॿ]/.test(s);

const CONSONANTS: Record<string, string> = {
  क: "k", ख: "kh", ग: "g", घ: "gh", ङ: "n", च: "ch", छ: "chh", ज: "j", झ: "jh", ञ: "n",
  ट: "t", ठ: "th", ड: "d", ढ: "dh", ण: "n", त: "t", थ: "th", द: "d", ध: "dh", न: "n",
  प: "p", फ: "ph", ब: "b", भ: "bh", म: "m", य: "y", र: "r", ल: "l", व: "v", श: "sh",
  ष: "sh", स: "s", ह: "h", ळ: "l", ड़: "d", ढ़: "dh", फ़: "f", ज़: "z", क़: "q", ख़: "kh", ग़: "g",
};
const VOWELS: Record<string, string> = {
  अ: "a", आ: "a", इ: "i", ई: "i", उ: "u", ऊ: "u", ऋ: "ri", ए: "e", ऐ: "ai", ओ: "o", औ: "au", ऑ: "o",
};
const MATRAS: Record<string, string> = {
  "ा": "a", "ि": "i", "ी": "i", "ु": "u", "ू": "u", "ृ": "ri", "े": "e", "ै": "ai", "ो": "o", "ौ": "au", "ॉ": "o",
};

/** Rough Devanagari to Roman, tuned for matching names, not for display of arbitrary Hindi. */
export function transliterate(input: string): string {
  const s = input.normalize("NFC");
  let out = "";
  const chars = [...s];
  for (let i = 0; i < chars.length; i++) {
    const c = chars[i];
    const next = chars[i + 1];
    if (CONSONANTS[c] !== undefined) {
      let base = CONSONANTS[c];
      if (next === "़") {
        // nukta: ड़ ढ़ ज़ फ़
        const withNukta = CONSONANTS[c + "़"];
        if (withNukta) base = withNukta;
        i++;
      }
      const after = chars[i + 1];
      if (after === "्") {
        out += base; // virama: no vowel
        i++;
      } else if (after && MATRAS[after] !== undefined) {
        out += base + MATRAS[after];
        i++;
      } else {
        // inherent 'a', dropped at word end
        const atEnd = !after || !/[ऀ-ॿ]/.test(after) || after === "ं" || after === "ः";
        out += atEnd && !(after === "ं" || after === "ः") ? base : base + "a";
      }
    } else if (VOWELS[c] !== undefined) out += VOWELS[c];
    else if (c === "ं" || c === "ँ") out += "n";
    else if (c === "ः") out += "h";
    else if (c === "़" || c === "्") continue;
    else if (c === "।") out += ".";
    else out += c;
  }
  return out;
}

/** Fold spelling variants so udhaar/udhar/उधार and aata/atta/आटा compare equal. */
export function canonical(word: string): string {
  const roman = hasDevanagari(word) ? transliterate(word) : word;
  return roman
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, "")
    .replace(/(.)\1+/g, "$1")
    .replace(/ee/g, "i")
    .replace(/oo/g, "u")
    .replace(/w/g, "v")
    .replace(/z/g, "j")
    .replace(/ph/g, "f")
    .replace(/kh/g, "k")
    .replace(/h(?=\b)/g, "")
    .replace(/(?<=[a-z])h/g, "")
    .replace(/y(?=\b)/g, "i")
    .replace(/(?<![a-z])y/g, "i")
    .replace(/\s+/g, " ")
    .trim();
}
