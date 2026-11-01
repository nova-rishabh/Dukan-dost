import { createHmac, timingSafeEqual } from "node:crypto";
import type { Clarification, IntentKind, Proposal } from "./types";

/**
 * A proposal token proves a sentence went through the interpreter and records which
 * clarifications the owner still has to resolve. It is HMAC-signed, so it works without
 * server-side state (serverless) and cannot be forged by a client.
 */
export const PROPOSAL_TTL_MS = 30 * 60_000;

export interface ProposalPayload {
  v: 1;
  shopId: string;
  sourceText: string;
  issuedAt: string;
  intents: Array<{
    kind: IntentKind;
    resolvedCustomerId?: string;
    candidateIds?: string[];
    amountRupees?: number;
    /** Only deterministic manual entry preparation signs exact paise. */
    amountPaise?: number;
    item?: string;
    clarifications: Clarification[];
    undoEntryId?: string;
  }>;
}

interface Opts {
  shopId: string;
  now: Date;
  secret: string;
}

const b64 = (b: Buffer | string) => Buffer.from(b).toString("base64url");
const mac = (body: string, secret: string) => createHmac("sha256", secret).update(body).digest();

/** Stable id of one intent of one signed proposal; used as the server-side idempotency key. */
export function proposalIntentKey(token: string, intentIndex: number): string {
  return `p:${token.split(".")[1] ?? ""}:${intentIndex}`;
}

export function signProposal(p: Proposal, o: Opts): string {
  const payload: ProposalPayload = {
    v: 1,
    shopId: o.shopId,
    sourceText: p.sourceText,
    issuedAt: o.now.toISOString(),
    intents: p.intents.map((i) => ({
      kind: i.kind,
      resolvedCustomerId: i.resolvedCustomerId,
      candidateIds: i.candidates?.map((c) => c.customerId),
      amountRupees: i.amountRupees,
      item: i.item,
      clarifications: i.clarifications,
      undoEntryId: i.undoTarget?.entryId,
    })),
  };
  const body = b64(JSON.stringify(payload));
  return `${body}.${b64(mac(body, o.secret))}`;
}

export function verifyProposal(token: string, o: Opts): ProposalPayload {
  const [body, sig] = token.split(".");
  if (!body || !sig) throw new Error("malformed proposal token");
  const expected = mac(body, o.secret);
  const given = Buffer.from(sig, "base64url");
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) throw new Error("bad proposal signature");
  const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as ProposalPayload;
  if (payload.v !== 1 || payload.shopId !== o.shopId) throw new Error("proposal belongs to another shop");
  const age = o.now.getTime() - new Date(payload.issuedAt).getTime();
  if (age < 0 || age > PROPOSAL_TTL_MS) throw new Error("proposal expired");
  return payload;
}

/** Manual amounts still use the same signed, expiring, tenant-bound confirmation gate. */
export function signManualEntry(input: { customerId: string; type: "credit_given" | "payment_received"; amountPaise: number; sourceText: string }, o: Opts): string {
  if (!Number.isSafeInteger(input.amountPaise) || input.amountPaise <= 0 || input.amountPaise > 10_000_000) throw new Error("invalid_amount");
  const payload: ProposalPayload = { v: 1, shopId: o.shopId, sourceText: input.sourceText, issuedAt: o.now.toISOString(), intents: [{ kind: input.type, resolvedCustomerId: input.customerId, amountPaise: input.amountPaise, clarifications: [] }] };
  const body = b64(JSON.stringify(payload));
  return `${body}.${b64(mac(body, o.secret))}`;
}
