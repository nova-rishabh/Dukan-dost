import type { Product } from "./types";

/** Parse measured quantities exactly; kg/litre are stored in grams/ml. */
export function parseQuantity(value: string, unit: Product["unit"], signed = false): number {
  const pattern = unit === "piece" ? (signed ? /^-?\d+$/ : /^\d+$/) : (signed ? /^-?\d+(?:\.\d{1,3})?$/ : /^\d+(?:\.\d{1,3})?$/);
  if (!pattern.test(value.trim())) throw new Error(unit === "piece" ? "Enter whole pieces" : "Use at most three decimal places");
  const raw = value.trim();
  const negative = raw.startsWith("-");
  const [whole, fraction = ""] = raw.replace(/^-/, "").split(".");
  const amount = unit === "piece" ? Number(whole) : Number(whole) * 1000 + Number(fraction.padEnd(3, "0"));
  if (!Number.isSafeInteger(amount)) throw new Error("Quantity is too large");
  return negative ? -amount : amount;
}

export function displayQuantity(value: number | null, unit: Product["unit"]): string {
  if (value === null) return "—";
  return `${unit === "piece" ? value : (value / 1000).toFixed(3).replace(/\.?0+$/, "")} ${unit}`;
}

export function previewQuantity(current: number | null, kind: "opening" | "in" | "out" | "adjustment", quantity: number): number {
  if (!Number.isSafeInteger(quantity)) throw new Error("Invalid quantity");
  if (kind === "opening") {
    if (current !== null) throw new Error("Opening stock is already recorded");
    if (quantity < 0) throw new Error("Stock cannot be negative");
    return quantity;
  }
  if (current === null) throw new Error("Record opening stock first");
  if (kind !== "adjustment" && quantity <= 0) throw new Error("Quantity must be positive");
  if (kind === "adjustment" && quantity === 0) throw new Error("Adjustment must change stock");
  const next = current + (kind === "out" ? -quantity : quantity);
  if (!Number.isSafeInteger(next) || next < 0) throw new Error("Stock cannot be negative or too large");
  return next;
}
