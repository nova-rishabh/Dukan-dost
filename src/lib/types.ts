export type EntryType = "credit_given" | "payment_received";
export type IntentKind = EntryType | "stock_low" | "query_balance" | "undo_last" | "unknown";
export type Clarification = "direction" | "amount" | "which_customer" | "new_customer";
export type EntrySource = "voice" | "text" | "sample";

export interface Customer {
  archivedAt?: string;
  id: string;
  shopId: string;
  /** short display name, e.g. "Amit Sharma" */
  name: string;
  area?: string;
  nameRoman: string;
  nameDevanagari?: string;
  aliases: string[];
  /** never shown on public pages; masked in lists */
  phoneE164?: string;
}

export interface Shop {
  id: string;
  name: string;
  upiVpa: string;
  isDemo: boolean;
}

export interface Entry {
  id: string;
  shopId: string;
  customerId: string;
  type: EntryType;
  /** integer paise */
  amountPaise: number;
  note?: string;
  sourceText: string;
  source: EntrySource;
  idempotencyKey: string;
  confirmedAt: string;
  voidedAt?: string;
  voidReason?: string;
}

export interface StockFlag {
  id: string;
  shopId: string;
  itemName: string;
  level: "low";
  sourceText?: string;
  createdAt: string;
  resolvedAt?: string;
}

export interface PayToken {
  token: string;
  shopId: string;
  customerId: string;
  amountPaise: number;
  expiresAt: string;
}

export interface AuditEvent {
  id: number;
  shopId: string;
  kind: string;
  payload: Record<string, unknown>;
  createdAt: string;
}

/** What an interpreter (rules or LLM) returns before resolution and deterministic checks. */
export interface RawIntent {
  kind: IntentKind;
  customer?: string;
  amountRupees?: number;
  item?: string;
  note?: string;
  reason?: string;
  confidence: "high" | "medium" | "low";
  clarifications: Clarification[];
  /** true when the customer was introduced as new ("naya customer Raju") */
  newCustomerHint?: boolean;
}

export interface Candidate {
  customerId: string;
  name: string;
  label: string;
  score: number;
}

export interface UndoTarget {
  entryId: string;
  customerName: string;
  type: EntryType;
  amountPaise: number;
}

export interface ProposalIntent extends RawIntent {
  /** primary clarification, TRD field name */
  needsClarification?: Clarification;
  candidates?: Candidate[];
  resolvedCustomerId?: string;
  amountInWords?: { hi: string; en: string };
  amountReadings?: number[];
  needsSecondConfirm?: boolean;
  duplicateWarning?: boolean;
  undoTarget?: UndoTarget;
  /** filled by the API layer for query_balance */
  balancePaise?: number;
  /** true only when nothing is ambiguous and the owner may press Likh do */
  writable: boolean;
}

export interface Proposal {
  sourceText: string;
  intents: ProposalIntent[];
  /** signed proposal token, added by the API layer */
  token?: string;
  engine: "rules" | "llm";
}

export interface RecentEntry {
  customerId: string;
  type: EntryType;
  amountPaise: number;
  confirmedAt: string;
}

export interface LlmProvider {
  readonly name: string;
  interpret(text: string, ctx: { customerNames: string[] }): Promise<RawIntent[]>;
}

/** The single signed-in person of a shop. The passcode is only ever stored as a salted scrypt hash. */
export interface OwnerRecord {
  shopId: string;
  name: string;
  /** E.164, for example +91XXXXXXXXXX */
  mobile: string;
  passcodeHash: string;
  /** Incremented atomically when credentials change or all device sessions are revoked. */
  authVersion: number;
  createdAt: string;
}

/** One send attempt per reviewed pay-link draft; no recipient or text is persisted here. */
export interface ReminderDelivery {
  shopId: string;
  token: string;
  fingerprint: string;
  status: "pending" | "sent" | "unknown";
  createdAt: string;
  messageId?: string;
  simulated?: boolean;
}


export interface RegistrationChallenge {
  id: string;
  browserHash: string;
  mobile: string;
  purpose: "signup" | "recovery" | "mobile_change";
  ownerShopId?: string;
  ownerAuthVersion?: number;
  expiresAt: string;
  state: "requested" | "verifying" | "verified" | "completed" | "failed";
  providerVerified?: boolean;
  verifyAttempts?: number;
  resultShopId?: string;
  resultAuthVersion?: number;
}

export interface Product {
  id: string;
  shopId: string;
  name: string;
  unit: "piece" | "kg" | "litre";
  /** Integer pieces, grams or millilitres. null means no confirmed opening count. */
  onHandMinor: number | null;
  lowThresholdMinor: number;
  version: number;
  archivedAt?: string;
}

export interface StockMovement {
  id: string;
  shopId: string;
  productId: string;
  kind: "opening" | "in" | "out" | "adjustment" | "reversal";
  quantityMinor: number;
  deltaMinor: number;
  reason: string;
  idempotencyKey: string;
  reversalOf?: string;
  createdAt: string;
}
