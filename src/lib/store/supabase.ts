import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { AuditEvent, Customer, Entry, PayToken, Shop, StockFlag } from "../types";
import type { LedgerStore } from "./types";

/**
 * Supabase adapter. Server-side only (service role). Schema: supabase/migrations/0001_init.sql.
 * Money is bigint paise; the browser never holds the key.
 */
type Row = Record<string, unknown>;

function must<T>(res: { data: T; error: { message: string } | null }, what: string): NonNullable<T> {
  if (res.error || res.data === null || res.data === undefined) throw new Error(`Supabase ${what} failed: ${res.error?.message ?? "no data"}`);
  return res.data as NonNullable<T>;
}

const toCustomer = (r: Row): Customer => ({
  id: r.id as string,
  shopId: r.shop_id as string,
  name: r.display_name as string,
  area: (r.area as string | null) ?? undefined,
  nameRoman: r.name_roman as string,
  nameDevanagari: (r.name_devanagari as string | null) ?? undefined,
  aliases: (r.aliases as string[]) ?? [],
  phoneE164: (r.phone_e164 as string | null) ?? undefined,
});

const toEntry = (r: Row): Entry => ({
  id: r.id as string,
  shopId: r.shop_id as string,
  customerId: r.customer_id as string,
  type: r.type as Entry["type"],
  amountPaise: Number(r.amount_paise),
  note: (r.note as string | null) ?? undefined,
  sourceText: r.source_text as string,
  source: r.source as Entry["source"],
  idempotencyKey: r.idempotency_key as string,
  confirmedAt: r.confirmed_at as string,
  voidedAt: (r.voided_at as string | null) ?? undefined,
  voidReason: (r.void_reason as string | null) ?? undefined,
});

const toFlag = (r: Row): StockFlag => ({
  id: r.id as string,
  shopId: r.shop_id as string,
  itemName: r.item_name as string,
  level: "low",
  sourceText: (r.source_text as string | null) ?? undefined,
  createdAt: r.created_at as string,
  resolvedAt: (r.resolved_at as string | null) ?? undefined,
});

export class SupabaseStore implements LedgerStore {
  readonly kind = "supabase" as const;
  private db: SupabaseClient;

  constructor(url: string, serviceRoleKey: string, client?: SupabaseClient) {
    this.db = client ?? createClient(url, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });
  }

  async getShop(shopId: string): Promise<Shop | null> {
    const { data } = await this.db.from("shops").select("*").eq("id", shopId).maybeSingle();
    return data ? { id: data.id, name: data.name, upiVpa: data.upi_vpa ?? "", isDemo: data.is_demo } : null;
  }

  async listCustomers(shopId: string) {
    return must(await this.db.from("customers").select("*").eq("shop_id", shopId), "customers.list").map(toCustomer);
  }

  async createCustomer(input: Omit<Customer, "id">) {
    const row = must(
      await this.db
        .from("customers")
        .insert({
          shop_id: input.shopId,
          display_name: input.name,
          area: input.area,
          name_roman: input.nameRoman,
          name_devanagari: input.nameDevanagari,
          aliases: input.aliases,
          phone_e164: input.phoneE164,
        })
        .select()
        .single(),
      "customers.insert",
    );
    return toCustomer(row);
  }

  async listEntries(shopId: string) {
    return must(await this.db.from("entries").select("*").eq("shop_id", shopId), "entries.list").map(toEntry);
  }

  async insertEntry(entry: Omit<Entry, "id">) {
    const payload = {
      shop_id: entry.shopId,
      customer_id: entry.customerId,
      type: entry.type,
      amount_paise: entry.amountPaise,
      note: entry.note,
      source_text: entry.sourceText,
      source: entry.source,
      idempotency_key: entry.idempotencyKey,
      confirmed_at: entry.confirmedAt,
    };
    const { data } = await this.db.from("entries").upsert(payload, { onConflict: "shop_id,idempotency_key", ignoreDuplicates: true }).select().maybeSingle();
    if (data) return { entry: toEntry(data), created: true };
    const existing = must(
      await this.db.from("entries").select("*").eq("shop_id", entry.shopId).eq("idempotency_key", entry.idempotencyKey).single(),
      "entries.existing",
    );
    return { entry: toEntry(existing), created: false };
  }

  async voidEntry(shopId: string, entryId: string, reason: string, at: string) {
    const { data } = await this.db
      .from("entries")
      .update({ voided_at: at, void_reason: reason })
      .eq("id", entryId)
      .eq("shop_id", shopId)
      .is("voided_at", null)
      .select()
      .maybeSingle();
    return data ? toEntry(data) : null;
  }

  async listStockFlags(shopId: string) {
    return must(await this.db.from("stock_flags").select("*").eq("shop_id", shopId), "stock.list").map(toFlag);
  }

  async addStockFlag(flag: Omit<StockFlag, "id">) {
    const row = must(
      await this.db.from("stock_flags").insert({ shop_id: flag.shopId, item_name: flag.itemName, level: flag.level, source_text: flag.sourceText, created_at: flag.createdAt }).select().single(),
      "stock.insert",
    );
    return toFlag(row);
  }

  async resolveStockFlag(shopId: string, flagId: string, at: string) {
    const { data } = await this.db.from("stock_flags").update({ resolved_at: at }).eq("id", flagId).eq("shop_id", shopId).select().maybeSingle();
    return data ? toFlag(data) : null;
  }

  async savePayToken(t: PayToken) {
    must(
      await this.db.from("pay_tokens").insert({ token: t.token, shop_id: t.shopId, customer_id: t.customerId, amount_paise: t.amountPaise, expires_at: t.expiresAt }).select().single(),
      "pay_tokens.insert",
    );
  }

  async getPayToken(token: string) {
    const { data } = await this.db.from("pay_tokens").select("*").eq("token", token).maybeSingle();
    return data
      ? { token: data.token, shopId: data.shop_id, customerId: data.customer_id, amountPaise: Number(data.amount_paise), expiresAt: data.expires_at }
      : null;
  }

  async appendAudit(shopId: string, kind: string, payload: Record<string, unknown>, at: string) {
    await this.db.from("audit_events").insert({ shop_id: shopId, kind, payload, created_at: at });
  }

  async listAudit(shopId: string, limit: number): Promise<AuditEvent[]> {
    const rows = must(await this.db.from("audit_events").select("*").eq("shop_id", shopId).order("id", { ascending: false }).limit(limit), "audit.list");
    return rows.map((r: Row) => ({ id: Number(r.id), shopId: r.shop_id as string, kind: r.kind as string, payload: r.payload as Record<string, unknown>, createdAt: r.created_at as string }));
  }

  async reset(): Promise<void> {
    throw new Error("reset is only available on the local demo store; re-run supabase/seed.sql instead");
  }
}
