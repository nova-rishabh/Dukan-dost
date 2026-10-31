import { amountInWords, rupeesToPaise } from "./money";
import { parseAmounts } from "./numbers";
import { resolveCustomer } from "./resolve";
import type { Clarification, Customer, ProposalIntent, RawIntent, RecentEntry, UndoTarget } from "./types";

/** Amounts of this size or more need a second tap (₹5,000). */
export const HIGH_AMOUNT_RUPEES = 5000;
/** Above this a mishearing is more likely than a real entry (₹1,00,000). */
export const CEILING_RUPEES = 100000;
export const DUPLICATE_WINDOW_MS = 60_000;

export interface CheckContext {
  customers: Customer[];
  recentEntries: RecentEntry[];
  lastEntry?: UndoTarget | null;
  now: Date;
}

const ORDER: Clarification[] = ["direction", "amount", "which_customer", "new_customer"];

/**
 * The deterministic gate. The model (or rules) propose; this module decides what is writable.
 * Anything uncertain gets a clarification and is never writable.
 */
export function finalizeIntent(raw: RawIntent, sourceText: string, ctx: CheckContext): ProposalIntent {
  const out: ProposalIntent = { ...raw, clarifications: [...raw.clarifications], writable: false };
  const add = (c: Clarification) => {
    if (!out.clarifications.includes(c)) out.clarifications.push(c);
  };

  if ((raw.kind === "credit_given" || raw.kind === "payment_received" || raw.kind === "query_balance") && raw.customer) {
    const res = resolveCustomer(raw.customer, ctx.customers);
    if (res.decision === "exact" || res.decision === "auto") {
      out.resolvedCustomerId = res.candidates[0].customerId;
      out.candidates = res.candidates;
    } else if (res.decision === "choose") {
      out.candidates = res.candidates;
      add("which_customer");
    } else if (raw.kind === "query_balance") {
      add("which_customer");
    } else {
      add("new_customer");
    }
    if (raw.newCustomerHint && !out.resolvedCustomerId) {
      out.clarifications = out.clarifications.filter((c) => c !== "which_customer");
      add("new_customer");
    }
  }

  if (raw.kind === "credit_given" || raw.kind === "payment_received") {
    const amount = raw.amountRupees;
    if (amount === undefined || !Number.isInteger(amount) || amount <= 0) {
      add("amount");
    } else {
      out.amountInWords = amountInWords(amount);
      const readings = parseAmounts(sourceText).map((a) => a.rupees);
      if (!readings.includes(amount)) {
        add("amount");
        out.amountReadings = readings;
      }
      if (raw.clarifications.includes("amount")) out.amountReadings = readings;
      if (amount > CEILING_RUPEES) {
        add("amount");
        out.reason = "Itna bada amount galat sunai diya ho sakta hai. Dobara check karo.";
      }
      if (amount >= HIGH_AMOUNT_RUPEES) out.needsSecondConfirm = true;
      if (out.resolvedCustomerId) {
        const paise = rupeesToPaise(amount);
        out.duplicateWarning = ctx.recentEntries.some(
          (e) =>
            e.customerId === out.resolvedCustomerId &&
            e.type === raw.kind &&
            e.amountPaise === paise &&
            ctx.now.getTime() - new Date(e.confirmedAt).getTime() <= DUPLICATE_WINDOW_MS &&
            ctx.now.getTime() >= new Date(e.confirmedAt).getTime(),
        );
      }
    }
    if (!raw.customer) add("which_customer");
  }

  if (raw.kind === "undo_last") {
    if (ctx.lastEntry) out.undoTarget = ctx.lastEntry;
    else out.reason = "Void karne ke liye koi entry nahi mili.";
  }

  out.clarifications.sort((a, b) => ORDER.indexOf(a) - ORDER.indexOf(b));
  out.needsClarification = out.clarifications[0];
  if (out.clarifications.length > 0 && out.confidence === "high") out.confidence = "medium";

  const clean = out.clarifications.length === 0;
  switch (raw.kind) {
    case "credit_given":
    case "payment_received":
      out.writable = clean && !!out.resolvedCustomerId && !!raw.amountRupees;
      break;
    case "stock_low":
      out.writable = clean && !!raw.item;
      break;
    case "undo_last":
      out.writable = clean && !!out.undoTarget;
      break;
    default:
      out.writable = false;
  }
  return out;
}
