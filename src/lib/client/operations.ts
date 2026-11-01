import { call, post } from "./api";
import type { Product, StockMovement } from "../types";

export interface ManagedCustomer { id: string; name: string; area?: string; archivedAt?: string; phoneMasked?: string; balancePaise: number }
export interface CustomerChange { name: string; area: string; phoneE164?: string; phoneConsent?: boolean; separate?: boolean; archived?: boolean; confirmed: true }
export interface MovementChange { kind: StockMovement["kind"]; quantityMinor: number; reason: string; expectedVersion: number; idempotencyKey: string; reversalOf?: string; confirmed: true }
export const operations = {
  customers: () => call<{ customers: ManagedCustomer[] }>("/api/customers"),
  saveCustomer: (id: string | undefined, data: CustomerChange) => id ? call(`/api/customers/${encodeURIComponent(id)}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(data) }) : post("/api/customers", data),
  products: () => call<{ products: Product[] }>("/api/inventory"),
  createProduct: (data: { name: string; unit: Product["unit"]; lowThresholdMinor: number; confirmed: true }) => post("/api/inventory", data),
  updateProduct: (id: string, data: { name: string; lowThresholdMinor: number; expectedVersion: number; archived?: boolean; confirmed: true }) => call(`/api/inventory/${encodeURIComponent(id)}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(data) }),
  movements: (id: string) => call<{ movements: StockMovement[] }>(`/api/inventory/${encodeURIComponent(id)}/movements`),
  move: (id: string, data: MovementChange) => post(`/api/inventory/${encodeURIComponent(id)}/movements`, data),
};
