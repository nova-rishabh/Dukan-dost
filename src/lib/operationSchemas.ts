import { z } from "zod";

export const CustomerManageBody = z.object({
  name: z.string().trim().min(1).max(60), area: z.string().trim().max(40).optional(),
  phoneE164: z.string().regex(/^\+[1-9]\d{7,14}$/).or(z.literal("")).optional(),
  phoneConsent: z.boolean().optional(), separate: z.boolean().optional(), confirmed: z.literal(true),
  archived: z.boolean().optional(),
}).superRefine((v, ctx) => { if (v.phoneE164 && !v.phoneConsent) ctx.addIssue({ code: "custom", path: ["phoneConsent"], message: "Phone consent required" }); });

export const ProductBody = z.object({ name: z.string().trim().min(1).max(80), unit: z.enum(["piece", "kg", "litre"]), lowThresholdMinor: z.number().int().min(0).max(Number.MAX_SAFE_INTEGER), confirmed: z.literal(true) });
export const MovementBody = z.object({ kind: z.enum(["opening", "in", "out", "adjustment", "reversal"]), quantityMinor: z.number().int().min(-Number.MAX_SAFE_INTEGER).max(Number.MAX_SAFE_INTEGER), reason: z.string().trim().min(1).max(140), expectedVersion: z.number().int().min(0), idempotencyKey: z.string().min(8).max(80), reversalOf: z.string().min(1).max(80).optional(), confirmed: z.literal(true) });
