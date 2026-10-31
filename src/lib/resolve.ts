import { canonical } from "./text";
import type { Candidate, Customer } from "./types";

/** Words that address a person but do not identify them. */
const HONORIFICS = new Set(
  ["ji", "babu", "didi", "bhai", "bhaiya", "sahab", "saheb", "sahib", "madam", "mrs", "mr", "ms", "uncle", "aunty", "aunt", "mataji", "devi", "ben", "behen", "dada", "chacha", "chachi", "sir"].map(canonical),
);

export type ResolveDecision = "exact" | "auto" | "choose" | "new";
export interface ResolveResult {
  decision: ResolveDecision;
  candidates: Candidate[];
}

function words(s: string): string[] {
  return s
    .split(/\s+/)
    .map((w) => canonical(w))
    .filter(Boolean);
}

function core(ws: string[]): string[] {
  return ws.filter((w) => !HONORIFICS.has(w));
}

function trigrams(s: string): Set<string> {
  const p = `  ${s}  `;
  const out = new Set<string>();
  for (let i = 0; i < p.length - 2; i++) out.add(p.slice(i, i + 3));
  return out;
}

/** Dice coefficient over trigrams: the same idea pg_trgm similarity uses in SQL. */
export function similarity(a: string, b: string): number {
  if (!a || !b) return 0;
  const ta = trigrams(a);
  const tb = trigrams(b);
  let shared = 0;
  for (const t of ta) if (tb.has(t)) shared++;
  return (2 * shared) / (ta.size + tb.size);
}

function scoreOne(qFull: string[], qCore: string[], candidate: string): number {
  const cFull = words(candidate);
  const cCore = core(cFull);
  if (qFull.join(" ") === cFull.join(" ")) return 1;
  if (qCore.length > 0 && cCore.length > 0) {
    const qSet = new Set(qCore);
    const cSet = new Set(cCore);
    if (qSet.size === cSet.size && [...qSet].every((w) => cSet.has(w))) return 0.95;
    if (qCore.every((w) => cSet.has(w))) return 0.6 + 0.4 * (qCore.length / cCore.length);
    if (cCore.every((w) => qSet.has(w))) return 0.55;
  }
  return similarity(qCore.join(" "), cCore.join(" ")) * 0.85;
}

export function resolveCustomer(name: string, customers: Customer[]): ResolveResult {
  const qFull = words(name);
  const qCore = core(qFull);
  if (qFull.length === 0) return { decision: "new", candidates: [] };
  const scored: Candidate[] = customers.map((c) => {
    const forms = [c.name, c.nameRoman, c.nameDevanagari ?? "", ...c.aliases].filter(Boolean);
    const score = Math.max(...forms.map((f) => scoreOne(qFull, qCore, f)));
    return { customerId: c.id, name: c.name, label: c.area ? `${c.name}, ${c.area}` : c.name, score: Math.round(score * 1000) / 1000 };
  });
  scored.sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
  const top = scored[0];
  if (!top || top.score < 0.35) return { decision: "new", candidates: [] };
  const second = scored[1];
  if (top.score >= 0.6 && (!second || top.score - second.score >= 0.2)) {
    return { decision: top.score === 1 ? "exact" : "auto", candidates: [top] };
  }
  return { decision: "choose", candidates: scored.filter((c) => c.score >= Math.max(0.35, top.score - 0.3)).slice(0, 3) };
}
