import { randomUUID } from "node:crypto";
import { normalizeMobile } from "../auth";
import type { OwnerRecord, Product, RegistrationChallenge, StockMovement } from "../types";
import type { CompleteRegistrationInput, MovementInput } from "./types";

export function normalizedMobile(mobile: string) {
  const normalized = normalizeMobile(mobile);
  if (!normalized) throw new Error("invalid_mobile");
  return normalized;
}

export function ownerByMobile(owners: OwnerRecord[], mobile: string) {
  const matches = owners.filter((o) => normalizedMobile(o.mobile) === normalizedMobile(mobile));
  if (matches.length > 1) throw new Error("duplicate_mobile");
  return matches[0] ? { ...matches[0] } : null;
}

export function completeProof(challenge: RegistrationChallenge | null, owners: OwnerRecord[], input: CompleteRegistrationInput) {
  if (!challenge || challenge.browserHash !== input.browserHash) throw new Error("invalid_registration");
  if (!Number.isFinite(Date.parse(challenge.expiresAt)) || !Number.isFinite(Date.parse(input.now)) || Date.parse(challenge.expiresAt) <= Date.parse(input.now)) throw new Error("invalid_registration");
  const existing = ownerByMobile(owners, challenge.mobile);
  if (challenge.purpose === "mobile_change") throw new Error("invalid_registration");
  if (challenge.state === "completed") {
    if (!existing || existing.shopId !== challenge.resultShopId || existing.authVersion !== challenge.resultAuthVersion) throw new Error("stale_registration");
    return { owner: existing, created: false, replay: true };
  }
  if (challenge.state !== "verified" || challenge.providerVerified !== true || !Number.isFinite(Date.parse(input.now)) || Date.parse(challenge.expiresAt) <= Date.parse(input.now)) throw new Error("invalid_registration");
  if (challenge.purpose === "recovery") {
    if (!existing) throw new Error("owner_not_found");
    if (!input.nextPasscodeHash) throw new Error("invalid_registration");
    return { owner: { ...existing, passcodeHash: input.nextPasscodeHash, authVersion: existing.authVersion + 1 }, created: false, replay: false };
  }
  if (existing) return { owner: existing, created: false, replay: false };
  if (!input.shop || !input.owner || input.owner.shopId !== input.shop.id || normalizedMobile(input.owner.mobile) !== normalizedMobile(challenge.mobile)) throw new Error("invalid_registration");
  return { owner: { ...input.owner, mobile: normalizedMobile(input.owner.mobile) }, created: true, replay: false };
}

export function validateProduct(product: Pick<Product, "unit" | "onHandMinor" | "lowThresholdMinor">) {
  if (!["piece", "kg", "litre"].includes(product.unit) || !Number.isSafeInteger(product.lowThresholdMinor) || product.lowThresholdMinor < 0 || (product.onHandMinor !== null && (!Number.isSafeInteger(product.onHandMinor) || product.onHandMinor < 0))) throw new Error("invalid_quantity");
}

export function movementResult(product: Product, movements: StockMovement[], input: MovementInput) {
  const prior = movements.find((m) => m.shopId === input.shopId && m.idempotencyKey === input.idempotencyKey);
  if (prior) {
    if (prior.productId !== input.productId || prior.kind !== input.kind || prior.quantityMinor !== input.quantityMinor || prior.reason !== input.reason || prior.reversalOf !== input.reversalOf) throw new Error("idempotency_conflict");
    return { product, movement: prior, created: false };
  }
  if (product.version !== input.expectedVersion) throw new Error("version_conflict");
  if (product.archivedAt) throw new Error("product_archived");
  if (!Number.isSafeInteger(input.quantityMinor)) throw new Error("invalid_quantity");
  if (input.reversalOf && input.kind !== "reversal") throw new Error("invalid_reversal");
  let delta = input.quantityMinor;
  if (input.kind === "opening") {
    if (product.onHandMinor !== null || input.quantityMinor < 0) throw new Error("opening_exists");
  } else {
    if (product.onHandMinor === null) throw new Error("opening_required");
    if (input.kind === "in" || input.kind === "out") {
      if (input.quantityMinor <= 0) throw new Error("invalid_quantity");
      delta = input.kind === "out" ? -input.quantityMinor : input.quantityMinor;
    } else if (input.kind === "reversal") {
      const original = movements.find((m) => m.id === input.reversalOf && m.productId === product.id && m.shopId === product.shopId);
      if (!original || original.kind === "reversal" || original.kind === "opening") throw new Error("invalid_reversal");
      if (movements.some((m) => m.reversalOf === original.id)) throw new Error("already_reversed");
      delta = -original.deltaMinor;
    } else if (input.kind !== "adjustment") throw new Error("invalid_movement");
  }
  const onHandMinor = (product.onHandMinor ?? 0) + delta;
  if (!Number.isSafeInteger(onHandMinor) || onHandMinor < 0) throw new Error("negative_stock");
  const { expectedVersion: _version, ...fields } = input;
  void _version;
  return { product: { ...product, onHandMinor, version: product.version + 1 }, movement: { ...fields, id: randomUUID(), deltaMinor: delta }, created: true };
}

export function mobileChangeResult(challenge: RegistrationChallenge | null, owners: OwnerRecord[], input: { id: string; browserHash: string; shopId: string; expectedAuthVersion: number; now: string }) {
  const owner = owners.find((o) => o.shopId === input.shopId);
  if (!challenge || challenge.purpose !== "mobile_change" || challenge.state !== "verified" || !challenge.providerVerified || challenge.browserHash !== input.browserHash || challenge.ownerShopId !== input.shopId || challenge.ownerAuthVersion !== input.expectedAuthVersion || !owner || owner.authVersion !== input.expectedAuthVersion || !(Date.parse(challenge.expiresAt) > Date.parse(input.now))) throw new Error("invalid_mobile_change");
  const existing = ownerByMobile(owners, challenge.mobile);
  if (existing) throw new Error("mobile_unavailable");
  return { ...owner, mobile: normalizedMobile(challenge.mobile), authVersion: owner.authVersion + 1 };
}
