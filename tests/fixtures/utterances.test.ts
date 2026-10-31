import { describe, expect, it } from "vitest";
import fixtures from "./utterances.json";
import { interpretText } from "@/lib/interpret";
import { SEED_CUSTOMERS, SEED_SHOP_ID } from "@/lib/seed";

interface Expected {
  kind?: string;
  customer?: string;
  amountRupees?: number;
  item?: string;
  confidence?: string;
  needsSecondConfirm?: boolean;
  clarifications?: string[];
  resolvedName?: string;
  chips?: string[];
  noAmount?: boolean;
  noCustomer?: boolean;
}

const ctx = { shopId: SEED_SHOP_ID, customers: SEED_CUSTOMERS, llm: null, now: new Date("2026-11-01T10:00:00Z"), recentEntries: [] };

describe("20 utterance fixtures, offline rules interpreter (06_TEST_PLAN section 2)", () => {
  for (const fx of fixtures as Array<{ id: number; text: string; intents: Expected[] }>) {
    it(`#${fx.id} ${fx.text}`, async () => {
      const proposal = await interpretText(fx.text, ctx);
      expect(proposal.intents.map((i) => i.kind).length).toBe(fx.intents.length);
      fx.intents.forEach((exp, idx) => {
        const got = proposal.intents[idx];
        if (exp.kind) expect(got.kind).toBe(exp.kind);
        if (exp.customer !== undefined) expect(got.customer).toBe(exp.customer);
        if (exp.amountRupees !== undefined) expect(got.amountRupees).toBe(exp.amountRupees);
        if (exp.item !== undefined) expect(got.item).toBe(exp.item);
        if (exp.confidence) expect(got.confidence).toBe(exp.confidence);
        if (exp.needsSecondConfirm) expect(got.needsSecondConfirm).toBe(true);
        if (exp.noAmount) expect(got.amountRupees).toBeUndefined();
        if (exp.noCustomer) expect(got.customer).toBeUndefined();
        if (exp.clarifications) expect([...got.clarifications].sort()).toEqual([...exp.clarifications].sort());
        if (exp.resolvedName) {
          expect(got.clarifications).toEqual([]);
          expect(SEED_CUSTOMERS.find((c) => c.id === got.resolvedCustomerId)?.name).toBe(exp.resolvedName);
        }
        if (exp.chips) expect((got.candidates ?? []).map((c) => c.name).sort()).toEqual([...exp.chips].sort());
      });
    });
  }

  it("never leaves a flagged intent writable (no silent wrong write)", async () => {
    for (const fx of fixtures as Array<{ text: string }>) {
      const p = await interpretText(fx.text, ctx);
      for (const i of p.intents) {
        if (i.clarifications.length > 0) expect(i.writable).toBe(false);
        if (i.writable) {
          expect(i.clarifications).toEqual([]);
          expect(i.kind === "credit_given" || i.kind === "payment_received" || i.kind === "stock_low" || i.kind === "undo_last" || i.kind === "query_balance").toBe(true);
        }
      }
    }
  });
});
