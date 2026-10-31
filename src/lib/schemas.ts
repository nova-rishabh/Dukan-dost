import { z } from "zod";

export const InterpretBody = z.object({
  text: z.string().trim().min(1).max(400),
  source: z.enum(["voice", "text", "sample"]).default("text"),
});

export const CreateEntryBody = z.object({
  proposalToken: z.string().min(10).max(4000),
  intentIndex: z.number().int().min(0).max(9),
  confirmed: z.boolean(),
  secondConfirmed: z.boolean().optional(),
  resolutions: z.array(z.enum(["direction", "amount", "which_customer", "new_customer"])).max(4),
  customerId: z.string().min(1).max(64),
  type: z.enum(["credit_given", "payment_received"]),
  amountPaise: z.number().int(),
  source: z.enum(["voice", "text", "sample"]),
  idempotencyKey: z.string().min(8).max(80),
  allowDuplicate: z.boolean().optional(),
  note: z.string().max(140).optional(),
});

export const VoidBody = z.object({
  reason: z.string().max(140).default(""),
  confirmed: z.boolean(),
  proposalToken: z.string().min(10).max(4000).optional(),
  intentIndex: z.number().int().min(0).max(9).optional(),
});

export const StockBody = z.object({
  proposalToken: z.string().min(10).max(4000),
  intentIndex: z.number().int().min(0).max(9),
  confirmed: z.boolean(),
  resolutions: z.array(z.enum(["direction", "amount", "which_customer", "new_customer"])).max(4).default([]),
});

export const CustomerBody = z.object({
  name: z.string().trim().min(1).max(60),
  area: z.string().trim().max(40).optional(),
});

export const RemindBody = z.object({
  customerId: z.string().min(1).max(64),
});

export const SpeakBody = z.object({ text: z.string().trim().min(1).max(200) });

export const PosterBody = z.object({
  text: z.string().trim().min(1).max(300),
  validUntil: z.string().max(40).optional(),
});

export const TranscribeJson = z.object({ sampleId: z.string().max(40) });
