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
    amountRupees?: number;
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

export function signProposal(p: Proposal, o: Opts): string {
  const payload: ProposalPayload = {
    v: 1,
    shopId: o.shopId,
    sourceText: p.sourceText,
    issuedAt: o.now.toISOString(),
    intents: p.intents.map((i) => ({
      kind: i.kind,
      resolvedCustomerId: i.resolvedCustomerId,
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
