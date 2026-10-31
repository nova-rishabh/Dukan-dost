import { randomBytes } from "node:crypto";
import type { LedgerStore } from "./store/types";
import type { PayToken } from "./types";
import { buildUpiUri } from "./upi";

export const PAY_TOKEN_TTL_MS = 7 * 24 * 3600_000;

export async function createPayToken(store: LedgerStore, input: { shopId: string; customerId: string; amountPaise: number; now: Date }): Promise<PayToken> {
  const token: PayToken = {
    token: randomBytes(18).toString("base64url"),
    shopId: input.shopId,
    customerId: input.customerId,
    amountPaise: input.amountPaise,
    expiresAt: new Date(input.now.getTime() + PAY_TOKEN_TTL_MS).toISOString(),
  };
  await store.savePayToken(token);
  return token;
}

export type PayView =
  | { status: "ok"; shopName: string; customerName: string; amountPaise: number; upiUri: string; isDemo: boolean }
  | { status: "invalid" }
  | { status: "expired" };

/** What the customer sees: shop name, their name and the amount. Nothing else is exposed. */
export async function readPayToken(store: LedgerStore, token: string, now: Date): Promise<PayView> {
  const row = await store.getPayToken(token);
  if (!row) return { status: "invalid" };
  if (new Date(row.expiresAt).getTime() < now.getTime()) return { status: "expired" };
  const [shop, customers] = await Promise.all([store.getShop(row.shopId), store.listCustomers(row.shopId)]);
  const customer = customers.find((c) => c.id === row.customerId);
  if (!shop || !customer) return { status: "invalid" };
  return {
    status: "ok",
    shopName: shop.name,
    customerName: customer.name,
    amountPaise: row.amountPaise,
    isDemo: shop.isDemo,
    upiUri: buildUpiUri({ vpa: shop.upiVpa, shopName: shop.name, amountPaise: row.amountPaise, note: "Udhaar jama" }),
  };
}
