import { GoogleGenAI } from "@google/genai";
import { z } from "zod";
import { GEMINI_MODEL_ID } from "../config";
import type { LlmProvider, RawIntent } from "../types";

/** Strict contract (TRD section 5). Anything that fails this schema is discarded, never repaired. */
const IntentSchema = z.object({
  kind: z.enum(["credit_given", "payment_received", "stock_low", "query_balance", "undo_last", "unknown"]),
  customer: z.string().max(60).optional(),
  amountRupees: z.number().int().positive().optional(),
  item: z.string().max(40).optional(),
  reason: z.string().max(140).optional(),
  directionKnown: z.boolean().optional(),
});
export const LlmResponseSchema = z.object({ intents: z.array(IntentSchema).max(6) });

const RESPONSE_JSON_SCHEMA = {
  type: "object",
  properties: {
    intents: {
      type: "array",
      items: {
        type: "object",
        properties: {
          kind: { type: "string", enum: ["credit_given", "payment_received", "stock_low", "query_balance", "undo_last", "unknown"] },
          customer: { type: "string" },
          amountRupees: { type: "integer" },
          item: { type: "string" },
          reason: { type: "string" },
          directionKnown: { type: "boolean" },
        },
        required: ["kind"],
      },
    },
  },
  required: ["intents"],
};

export const SYSTEM_PROMPT = `You read one sentence a Hindi, Hinglish or English speaking shopkeeper said and return JSON only.
Rules:
1. Output JSON only. No advice, no extra intents, no invented amounts.
2. Direction by verb and particle. "X ne N udhaar liye" / "X ko N ka saman udhaar" / "X ko N diye" = credit_given (customer took goods on credit). "X ne N diye" / "wapas kar diye" / "jama kiye" = payment_received (customer paid). If the particle is missing or the sentence only states a balance, set directionKnown to false.
3. Quantities of goods ("2 kilo chini") are never amounts. Only rupee amounts count. amountRupees is whole rupees.
4. Item shortages ("atta kam hai") are stock_low with the item name only. Never invent a quantity.
5. Keep names as spoken. Do not translate or correct them.
6. If the sentence is not about the shop, return one intent with kind "unknown".`;

export function createGeminiLlm(apiKey: string): LlmProvider {
  const ai = new GoogleGenAI({ apiKey });
  return {
    name: "gemini",
    async interpret(text, ctx): Promise<RawIntent[]> {
      const response = await ai.models.generateContent({
        model: GEMINI_MODEL_ID,
        contents: `Known customers: ${ctx.customerNames.join(", ")}\nSentence: ${text}`,
        config: { httpOptions: { timeout: 2500, retryOptions: { attempts: 2, initialDelay: 0.2, maxDelay: 0.3, expBase: 2, jitter: 0.1, httpStatusCodes: [429, 500, 502, 503, 504] } }, systemInstruction: SYSTEM_PROMPT, responseMimeType: "application/json", responseJsonSchema: RESPONSE_JSON_SCHEMA, temperature: 0 },
      });
      return parseLlmJson(response.text ?? "");
    },
  };
}

export function parseLlmJson(raw: string): RawIntent[] {
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    return [];
  }
  const parsed = LlmResponseSchema.safeParse(json);
  if (!parsed.success) return [];
  return parsed.data.intents.map((i) => ({
    kind: i.kind,
    customer: i.customer?.trim() || undefined,
    amountRupees: i.amountRupees,
    item: i.item?.trim().toLowerCase() || undefined,
    reason: i.reason,
    confidence: "medium" as const,
    clarifications: i.directionKnown === false ? (["direction"] as const).slice() : [],
  }));
}
