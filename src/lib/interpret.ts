import { finalizeIntent, type CheckContext } from "./checks";
import { interpretRules } from "./rules";
import type { Customer, LlmProvider, Proposal, RawIntent, RecentEntry, UndoTarget } from "./types";

export const MAX_INPUT_CHARS = 400;
export const LLM_TIMEOUT_MS = 6000;

export interface InterpretContext {
  shopId: string;
  customers: Customer[];
  llm: LlmProvider | null;
  now: Date;
  recentEntries: RecentEntry[];
  lastEntry?: UndoTarget | null;
}

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error("LLM timeout")), ms);
    p.then(
      (v) => {
        clearTimeout(t);
        resolve(v);
      },
      (e) => {
        clearTimeout(t);
        reject(e);
      },
    );
  });
}

/**
 * Rules first (instant, offline). The LLM is consulted only when the rules cannot read the sentence.
 * Either way the result passes through the same deterministic checks and is never a write.
 */
export async function interpretText(text: string, ctx: InterpretContext): Promise<Proposal> {
  const sourceText = text.trim().slice(0, MAX_INPUT_CHARS);
  const rules = interpretRules(sourceText);
  let raw: RawIntent[] = rules.intents;
  let engine: Proposal["engine"] = "rules";

  if (!rules.confident && ctx.llm) {
    try {
      const fromLlm = await withTimeout(ctx.llm.interpret(sourceText, { customerNames: ctx.customers.map((c) => c.name) }), LLM_TIMEOUT_MS);
      if (fromLlm.length > 0) {
        raw = fromLlm;
        engine = "llm";
      }
    } catch {
      // fall back to the rules result ("unknown" with a retry message)
    }
  }

  const checkCtx: CheckContext = { customers: ctx.customers, recentEntries: ctx.recentEntries, lastEntry: ctx.lastEntry, now: ctx.now };
  if (engine === "llm") {
    // The model's direction is never trusted on its own: the owner always picks it on the card.
    raw = raw.map((r) => ((r.kind === "credit_given" || r.kind === "payment_received") && !r.clarifications.includes("direction") ? { ...r, clarifications: [...r.clarifications, "direction" as const] } : r));
  }
  return { sourceText, engine, intents: raw.map((r) => finalizeIntent(r, sourceText, checkCtx)) };
}
