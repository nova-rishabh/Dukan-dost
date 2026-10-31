import { CEILING_RUPEES, HIGH_AMOUNT_RUPEES } from "./checks";
import { verifyProposal } from "./proposal";
import type { LedgerStore } from "./store/types";
import type { Customer, Entry, EntrySource, EntryType, StockFlag, UndoTarget } from "./types";

export type LedgerErrorCode =
  | "not_confirmed"
  | "bad_proposal"
  | "bad_request"
  | "needs_clarification"
  | "second_confirm_required"
  | "not_found"
  | "already_voided";

export class LedgerError extends Error {
  constructor(
    public code: LedgerErrorCode,
    message: string,
    public hint: string,
  ) {
    super(message);
  }
}

interface Opts {
  now: Date;
  secret: string;
}

export interface CreateEntryRequest {
  shopId: string;
  proposalToken: string;
  intentIndex: number;
  confirmed: boolean;
  secondConfirmed?: boolean;
  /** clarifications the owner resolved on the card (direction chosen, which Sharma tapped, ...) */
  resolutions: string[];
  customerId: string;
  type: EntryType;
  amountPaise: number;
  source: EntrySource;
  idempotencyKey: string;
  note?: string;
}

function verify(token: string, shopId: string, o: Opts) {
  try {
    return verifyProposal(token, { shopId, now: o.now, secret: o.secret });
  } catch {
    throw new LedgerError("bad_proposal", "Proposal is missing, expired or invalid", "Dobara bolo ya likho, phir Likh do dabao.");
  }
}

/**
 * The only way an entry is created. Requires a signed proposal, an explicit confirmation,
 * every clarification resolved, and an idempotency key. Nothing here trusts the model.
 */
export async function createEntry(store: LedgerStore, req: CreateEntryRequest, o: Opts) {
  if (req.confirmed !== true) throw new LedgerError("not_confirmed", "Entry was not confirmed", "Likh do dabane ke baad hi entry likhi jaati hai.");
  if (typeof req.idempotencyKey !== "string" || req.idempotencyKey.length < 8) throw new LedgerError("bad_request", "Idempotency key missing", "Page dobara kholo aur phir try karo.");
  if (!req.proposalToken) throw new LedgerError("bad_proposal", "Proposal missing", "Dobara bolo ya likho.");
  const payload = verify(req.proposalToken, req.shopId, o);
  const intent = payload.intents[req.intentIndex];
  if (!intent || (intent.kind !== "credit_given" && intent.kind !== "payment_received")) {
    throw new LedgerError("bad_request", "Intent is not a ledger entry", "Dobara bolo ya likho.");
  }
  if (req.type !== "credit_given" && req.type !== "payment_received") throw new LedgerError("bad_request", "Unknown entry type", "Udhaar diya ya Paise mile chuno.");
  const unresolved = intent.clarifications.filter((c) => !req.resolutions.includes(c));
  if (unresolved.length > 0) {
    throw new LedgerError("needs_clarification", `Unresolved: ${unresolved.join(", ")}`, "Pehle card par jo poocha hai woh chuno.");
  }
  if (!Number.isInteger(req.amountPaise) || req.amountPaise <= 0 || req.amountPaise % 100 !== 0) {
    throw new LedgerError("bad_request", "Amount must be a positive whole-rupee amount in integer paise", "Amount check karo.");
  }
  if (req.amountPaise > CEILING_RUPEES * 100) throw new LedgerError("bad_request", "Amount above the ceiling", "Itna bada amount galat sunai diya ho sakta hai. Dobara check karo.");
  if (req.amountPaise >= HIGH_AMOUNT_RUPEES * 100 && req.secondConfirmed !== true) {
    throw new LedgerError("second_confirm_required", "Large amount needs a second confirmation", "Bade amount par ek baar aur pakka karo.");
  }
  const customers = await store.listCustomers(req.shopId);
  if (!customers.some((c) => c.id === req.customerId)) throw new LedgerError("not_found", "Customer not found", "Customer chuno ya naya banao.");

  const edited =
    intent.resolvedCustomerId !== req.customerId ||
    intent.kind !== req.type ||
    (intent.amountRupees ?? -1) * 100 !== req.amountPaise;

  const { entry, created } = await store.insertEntry({
    shopId: req.shopId,
    customerId: req.customerId,
    type: req.type,
    amountPaise: req.amountPaise,
    note: req.note,
    sourceText: payload.sourceText,
    source: req.source,
    idempotencyKey: req.idempotencyKey,
    confirmedAt: o.now.toISOString(),
  });
  if (created) {
    await store.appendAudit(req.shopId, "entry_confirmed", { entryId: entry.id, sourceText: payload.sourceText, edited, resolutions: req.resolutions, type: req.type, amountPaise: req.amountPaise }, o.now.toISOString());
  }
  const balances = computeBalances(customers, await store.listEntries(req.shopId));
  return { entry, created, balancePaise: balances.get(req.customerId) ?? 0 };
}

export async function voidEntry(store: LedgerStore, req: { shopId: string; entryId: string; reason: string; confirmed: boolean }, o: { now: Date }) {
  if (req.confirmed !== true) throw new LedgerError("not_confirmed", "Void was not confirmed", "Void karne se pehle pakka karo.");
  const entries = await store.listEntries(req.shopId);
  const found = entries.find((e) => e.id === req.entryId);
  if (!found) throw new LedgerError("not_found", "Entry not found", "Entry nahi mili.");
  if (found.voidedAt) throw new LedgerError("already_voided", "Entry is already voided", "Yeh entry pehle hi hata di gayi hai.");
  const reason = req.reason.trim().slice(0, 140) || "owner voided";
  const entry = await store.voidEntry(req.shopId, req.entryId, reason, o.now.toISOString());
  await store.appendAudit(req.shopId, "entry_voided", { entryId: req.entryId, reason }, o.now.toISOString());
  return { entry: entry as Entry };
}

export async function createStockFlag(
  store: LedgerStore,
  req: { shopId: string; proposalToken: string; intentIndex: number; confirmed: boolean; resolutions: string[] },
  o: Opts,
) {
  if (req.confirmed !== true) throw new LedgerError("not_confirmed", "Flag was not confirmed", "Likh do dabane ke baad hi likha jaata hai.");
  const payload = verify(req.proposalToken, req.shopId, o);
  const intent = payload.intents[req.intentIndex];
  if (!intent || intent.kind !== "stock_low" || !intent.item) throw new LedgerError("bad_request", "Intent is not a stock note", "Dobara bolo ya likho.");
  if (intent.clarifications.some((c) => !req.resolutions.includes(c))) throw new LedgerError("needs_clarification", "Unresolved clarification", "Pehle card par jo poocha hai woh chuno.");
  const existing = (await store.listStockFlags(req.shopId)).find((f) => !f.resolvedAt && f.itemName.toLowerCase() === intent.item!.toLowerCase());
  if (existing) return { flag: existing, created: false };
  const flag = await store.addStockFlag({ shopId: req.shopId, itemName: intent.item, level: "low", sourceText: payload.sourceText, createdAt: o.now.toISOString() });
  await store.appendAudit(req.shopId, "stock_flagged", { item: intent.item, sourceText: payload.sourceText }, o.now.toISOString());
  return { flag, created: true };
}

/** Balance = credit given minus payments received, voided entries excluded. Positive means the customer owes. */
export function computeBalances(customers: Customer[], entries: Entry[]): Map<string, number> {
  const map = new Map<string, number>(customers.map((c) => [c.id, 0]));
  for (const e of entries) {
    if (e.voidedAt) continue;
    const delta = e.type === "credit_given" ? e.amountPaise : -e.amountPaise;
    map.set(e.customerId, (map.get(e.customerId) ?? 0) + delta);
  }
  return map;
}

export interface Summary {
  totalOutstandingPaise: number;
  customerCount: number;
  topDebtors: Array<{ customerId: string; name: string; balancePaise: number }>;
  lowStock: StockFlag[];
}

export async function getSummary(store: LedgerStore, shopId: string): Promise<Summary> {
  const [customers, entries, flags] = await Promise.all([store.listCustomers(shopId), store.listEntries(shopId), store.listStockFlags(shopId)]);
  const balances = computeBalances(customers, entries);
  const debtors = customers
    .map((c) => ({ customerId: c.id, name: c.name, balancePaise: balances.get(c.id) ?? 0 }))
    .filter((d) => d.balancePaise > 0)
    .sort((a, b) => b.balancePaise - a.balancePaise || a.name.localeCompare(b.name));
  return {
    totalOutstandingPaise: debtors.reduce((s, d) => s + d.balancePaise, 0),
    customerCount: customers.length,
    topDebtors: debtors.slice(0, 3),
    lowStock: flags.filter((f) => !f.resolvedAt),
  };
}

/** The most recent entry that is not voided, for "pichli entry hata do". */
export async function getLastEntry(store: LedgerStore, shopId: string): Promise<UndoTarget | null> {
  const [customers, entries] = await Promise.all([store.listCustomers(shopId), store.listEntries(shopId)]);
  const live = entries.filter((e) => !e.voidedAt);
  if (live.length === 0) return null;
  const last = live.reduce((a, b) => (new Date(b.confirmedAt).getTime() >= new Date(a.confirmedAt).getTime() ? b : a));
  return { entryId: last.id, customerName: customers.find((c) => c.id === last.customerId)?.name ?? "Customer", type: last.type, amountPaise: last.amountPaise };
}
