import { parseAmountsFromTokens, type ParsedAmount } from "./numbers";
import { canonical, hasDevanagari, tokenize, transliterate, type Token } from "./text";
import type { Clarification, RawIntent } from "./types";

/**
 * Deterministic Hinglish / Hindi / English interpreter (ADR-020).
 * Direction comes from verb and particle, never from a guess:
 *   "X ne N diye"  -> X paid        (payment_received)
 *   "X ko N diye"  -> shop gave     (credit_given)
 *   "X ne N udhaar liye" -> X took on credit (credit_given)
 * If the particle is missing, or the sentence only states a balance, the intent is flagged.
 */

const K = (...ws: string[]) => new Set(ws.map(canonical));

const UDHAAR = K("udhaar", "udhar", "uddhar", "उधार", "उधारी", "credit", "dhaar", "udhari");
const PAY = K("wapas", "vapas", "jama", "chuka", "chukaya", "chukta", "paid", "received", "return", "lauta", "वापस", "जमा", "लौटा", "payment");
const GIVE = K("diye", "diya", "dediye", "dediya", "दिए", "दिये", "दिया", "gave", "give", "di");
const TAKE = K("liye", "liya", "lie", "लिए", "लिया", "लिये", "took", "taken", "gaye", "gayi");
const STATEMENT = K("baaki", "baki", "bakaya", "bacha", "बाकी", "बकाया", "pending", "due");
const BALANCE_Q = K("kitna", "kitne", "kitni", "कितना", "कितने", "कितनी", "balance", "hisab", "hisaab");
const STOCK = K("kam", "khatam", "khatm", "khalas", "finished", "low", "खत्म", "कम", "samapt");
const UNDO = K("hata", "hatao", "htao", "hatado", "undo", "cancel", "हटा", "हटाओ", "रद्द");
const NE = K("ne", "ने");
const KO = K("ko", "को");
const KA = K("ka", "ki", "ke", "का", "की", "के");
const NAAM = K("naam", "नाम");
const NEW = K("naya", "nayi", "naye", "new", "नया", "नई");
const CONJ = K("aur", "and", "और", "phir", "tatha", "तथा");

const FILLER = K(
  "likh", "likho", "likhdo", "लिख", "लिखो", "do", "de", "dena", "hai", "hain", "है", "हैं", "tha", "thi", "ho", "hota", "rahi", "raha", "rahe", "hone",
  "kar", "kiya", "karo", "saman", "saaman", "samaan", "सामान", "kal", "aaj", "parso", "kuch", "bhi", "mein", "me", "se", "par", "pe", "wale",
  "add", "for", "from", "to", "customer", "entry", "please", "plz", "ruko", "ek", "rupaye", "rs", "ne", "ko", "ka", "ki", "ke", "naam",
  "pichli", "pichhli", "last", "previous", "kitna", "baaki", "ka", "nahi", "mat", "hi", "toh", "to", "bhai", "noise", "the", "a", "of", "rupees",
);

const HONORIFIC_WORDS = new Set(["ji", "babu", "didi", "bhai", "bhaiya", "sahab", "madam", "mrs", "mr", "ms", "uncle", "aunty", "devi"]);

const ITEMS: Record<string, string[]> = {
  atta: ["atta", "aata", "ata", "आटा"],
  chini: ["chini", "cheeni", "chinni", "चीनी", "sugar"],
  dal: ["dal", "daal", "दाल"],
  chawal: ["chawal", "chaval", "चावल", "rice"],
  tel: ["tel", "तेल", "oil"],
  namak: ["namak", "नमक", "salt"],
  doodh: ["doodh", "dudh", "दूध", "milk"],
  "chai patti": ["chai patti", "chaipatti", "चायपत्ती"],
  sabun: ["sabun", "साबुन", "soap"],
  maggi: ["maggi", "मैगी"],
  biscuit: ["biscuit", "biskut", "बिस्कुट"],
};
const ITEM_LOOKUP = new Map<string, string>();
for (const [canon, forms] of Object.entries(ITEMS)) for (const f of forms) ITEM_LOOKUP.set(canonical(f), canon);

const NON_NAME = new Set<string>();
for (const set of [UDHAAR, PAY, GIVE, TAKE, STATEMENT, BALANCE_Q, STOCK, UNDO, NE, KO, KA, NAAM, NEW, CONJ, FILLER]) for (const w of set) NON_NAME.add(w);

interface W {
  token: Token;
  c: string;
  amount?: ParsedAmount;
  punct?: boolean;
}

function titleName(words: Token[]): string {
  return words
    .map((t) => {
      const roman = hasDevanagari(t.raw) ? transliterate(t.raw) : t.raw;
      const lower = roman.toLowerCase();
      if (lower.length === 1) return lower.toUpperCase();
      if (HONORIFIC_WORDS.has(lower) && lower !== "mrs" && lower !== "mr" && lower !== "ms") return lower;
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join(" ");
}

function itemName(words: Token[]): string {
  const key = canonical(words.map((t) => t.raw).join(" "));
  const hit = ITEM_LOOKUP.get(key) ?? ITEM_LOOKUP.get(canonical(words[words.length - 1].raw));
  if (hit) return hit;
  return words.map((t) => (hasDevanagari(t.raw) ? transliterate(t.raw) : t.raw).toLowerCase()).join(" ");
}

function buildW(text: string): W[] {
  const tokens = tokenize(text);
  const amounts = parseAmountsFromTokens(tokens);
  const out: W[] = [];
  let i = 0;
  while (i < tokens.length) {
    const a = amounts.find((x) => x.tokenStart === i);
    if (a) {
      out.push({ token: tokens[i], c: "#amount", amount: a });
      i = a.tokenEnd;
      continue;
    }
    const t = tokens[i];
    out.push({ token: t, c: t.type === "word" ? canonical(t.raw) : t.norm, punct: t.type === "punct" });
    i++;
  }
  return out;
}

function splitClauses(ws: W[]): W[][] {
  const clauses: W[][] = [];
  let cur: W[] = [];
  for (const w of ws) {
    if (w.punct || CONJ.has(w.c)) {
      if (w.punct && w.token.raw === "?") cur.push(w);
      if (cur.length) clauses.push(cur);
      cur = [];
      continue;
    }
    cur.push(w);
  }
  if (cur.length) clauses.push(cur);
  return clauses;
}

interface NameRun {
  tokens: Token[];
  endIdx: number;
}

function findNameRun(clause: W[]): { run: NameRun; particle: "ne" | "ko" | "naam" | "ka" | "none" } | null {
  const runs: NameRun[] = [];
  let cur: W[] = [];
  const flush = (endIdx: number) => {
    if (cur.length) {
      const onlyHonorific = cur.every((w) => HONORIFIC_WORDS.has(w.token.raw.toLowerCase()));
      if (!onlyHonorific) runs.push({ tokens: cur.map((w) => w.token), endIdx });
    }
    cur = [];
  };
  clause.forEach((w, idx) => {
    const isName = w.token.type === "word" && !w.amount && !NON_NAME.has(w.c);
    if (isName) cur.push(w);
    else flush(idx);
  });
  flush(clause.length);
  if (runs.length === 0) return null;
  const rank = (r: NameRun): { p: number; particle: "ne" | "ko" | "naam" | "ka" | "none" } => {
    const next = clause[r.endIdx];
    const next2 = clause[r.endIdx + 1];
    if (next && NE.has(next.c)) return { p: 1, particle: "ne" };
    if (next && KO.has(next.c)) return { p: 1, particle: "ko" };
    if (next && KA.has(next.c) && next2 && NAAM.has(next2.c)) return { p: 1, particle: "naam" };
    if (next && KA.has(next.c)) return { p: 2, particle: "ka" };
    return { p: 3, particle: "none" };
  };
  let best = runs[0];
  let bestRank = rank(best);
  for (const r of runs.slice(1)) {
    const rr = rank(r);
    if (rr.p < bestRank.p) {
      best = r;
      bestRank = rr;
    }
  }
  return { run: best, particle: bestRank.particle };
}

export interface RulesResult {
  intents: RawIntent[];
  /** false when the LLM fallback should be consulted */
  confident: boolean;
}

export function interpretRules(text: string): RulesResult {
  const clauses = splitClauses(buildW(text));
  const intents: RawIntent[] = [];
  let pendingNew: { customer: string } | null = null;
  let undoSeen = false;

  for (const clause of clauses) {
    const has = (set: Set<string>) => clause.some((w) => set.has(w.c));
    const amountW = clause.find((w) => w.amount);
    const nameInfo = findNameRun(clause);
    const customer = nameInfo ? titleName(nameInfo.run.tokens) : undefined;

    if (has(UNDO) && !amountW) {
      if (!undoSeen) intents.push({ kind: "undo_last", confidence: "high", clarifications: [] });
      undoSeen = true;
      continue;
    }

    if (amountW) {
      const amount = amountW.amount!;
      let name = customer;
      let newHint = has(NEW);
      if (!name && pendingNew) {
        name = pendingNew.customer;
        newHint = true;
      }
      pendingNew = null;
      const particle = nameInfo?.particle ?? "none";
      const clarifications: Clarification[] = [];
      let kind: RawIntent["kind"] = "credit_given";
      let confidence: RawIntent["confidence"] = amount.confidence;

      const hasUdhaar = has(UDHAAR);
      const hasPay = has(PAY);
      const hasGive = has(GIVE);
      const hasTake = has(TAKE);
      let direction: "credit" | "payment" | null;

      if (has(STATEMENT)) direction = null;
      else if (hasPay) direction = particle === "ko" ? null : "payment";
      else if (particle === "ne") direction = hasTake || hasUdhaar ? (hasGive ? null : "credit") : hasGive ? "payment" : null;
      else if (particle === "ko") direction = "credit";
      else if (particle === "naam") {
        direction = "credit";
        confidence = "medium";
      } else if (hasUdhaar || hasTake) direction = "credit";
      else direction = null;

      if (direction === null) {
        clarifications.push("direction");
        confidence = "low";
      } else kind = direction === "credit" ? "credit_given" : "payment_received";
      if (!name) {
        clarifications.push("which_customer");
        confidence = "low";
      }
      intents.push({
        kind,
        customer: name,
        amountRupees: amount.rupees,
        confidence,
        clarifications,
        ...(newHint ? { newCustomerHint: true } : {}),
      });
      continue;
    }

    if (has(BALANCE_Q)) {
      intents.push({ kind: "query_balance", customer, confidence: customer ? "high" : "low", clarifications: customer ? [] : ["which_customer"] });
      continue;
    }

    if (has(STOCK)) {
      const idx = clause.findIndex((w) => STOCK.has(w.c));
      const before = clause.slice(0, idx);
      const itemTokens: Token[] = [];
      for (const w of before) if (w.token.type === "word" && !NON_NAME.has(w.c)) itemTokens.push(w.token);
      if (itemTokens.length) {
        intents.push({ kind: "stock_low", item: itemName(itemTokens), confidence: "high", clarifications: [] });
        continue;
      }
    }

    if (has(NEW) && customer) {
      pendingNew = { customer };
      continue;
    }
    // anything else (for example a quantity such as "do kilo chini") is ignored
  }

  if (intents.length === 0) {
    return {
      intents: [{ kind: "unknown", reason: "Samajh nahi aaya. Dobara bolo ya likho.", confidence: "low", clarifications: [] }],
      confident: false,
    };
  }
  return { intents, confident: true };
}
