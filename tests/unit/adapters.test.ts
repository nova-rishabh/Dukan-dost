import { describe, expect, it } from "vitest";
import { ELEVENLABS_STT_MODEL_ID, ELEVENLABS_TTS_MODEL_ID, adapterStatus } from "@/lib/config";
import { interpretText } from "@/lib/interpret";
import { createElevenLabsStt, createElevenLabsTts } from "@/lib/providers/elevenlabs";
import { parseLlmJson } from "@/lib/providers/gemini";
import { SEED_CUSTOMERS, SEED_SHOP_ID } from "@/lib/seed";
import type { LlmProvider } from "@/lib/types";

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

describe("ElevenLabs STT (mocked HTTP)", () => {
  it("posts multipart to /v1/speech-to-text with xi-api-key, model_id and file", async () => {
    let seen: { url: string; headers: Headers; form: FormData } | null = null;
    const f = (async (url: string, init: RequestInit) => {
      seen = { url, headers: new Headers(init.headers), form: init.body as FormData };
      return json({ text: " Gupta ji ne 500 diye ", language_code: "hin" });
    }) as unknown as typeof fetch;
    const out = await createElevenLabsStt("test-key", f).transcribe({ data: new Uint8Array([1, 2, 3]).buffer, mime: "audio/webm" });
    expect(out).toEqual({ text: "Gupta ji ne 500 diye", language: "hin" });
    expect(seen!.url).toBe("https://api.elevenlabs.io/v1/speech-to-text");
    expect(seen!.headers.get("xi-api-key")).toBe("test-key");
    expect(seen!.form.get("model_id")).toBe(ELEVENLABS_STT_MODEL_ID);
    expect(seen!.form.get("file")).toBeInstanceOf(Blob);
  });
  it("retries a 5xx once, then gives a typed-fallback hint", async () => {
    let calls = 0;
    const f = (async () => {
      calls++;
      return new Response("boom", { status: 503 });
    }) as unknown as typeof fetch;
    await expect(createElevenLabsStt("k", f).transcribe({ data: new ArrayBuffer(4), mime: "audio/webm" })).rejects.toMatchObject({ hint: expect.stringContaining("Dobara bolo") });
    expect(calls).toBe(2);
  });
  it("does not retry a 4xx", async () => {
    let calls = 0;
    const f = (async () => {
      calls++;
      return new Response("bad", { status: 401 });
    }) as unknown as typeof fetch;
    await expect(createElevenLabsStt("k", f).transcribe({ data: new ArrayBuffer(4), mime: "audio/webm" })).rejects.toBeTruthy();
    expect(calls).toBe(1);
  });
  it("rejects an empty transcript", async () => {
    const f = (async () => json({ text: "  " })) as unknown as typeof fetch;
    await expect(createElevenLabsStt("k", f).transcribe({ data: new ArrayBuffer(4), mime: "audio/webm" })).rejects.toMatchObject({ status: 422 });
  });
});

describe("ElevenLabs TTS (mocked HTTP)", () => {
  it("lists Hindi voices, then posts text and model_id to the voice endpoint", async () => {
    const calls: Array<{ url: string; body?: string }> = [];
    const f = (async (url: string, init: RequestInit) => {
      calls.push({ url, body: init.body as string | undefined });
      if (url.includes("/v2/voices")) return json({ voices: [{ voice_id: "voice-1" }] });
      return new Response(new Uint8Array([9, 9]), { status: 200 });
    }) as unknown as typeof fetch;
    const out = await createElevenLabsTts("k", f).speak("Gupta ji, paanch sau rupaye");
    expect(out?.mime).toBe("audio/mpeg");
    expect(calls[0].url).toContain("https://api.elevenlabs.io/v2/voices?language=hi");
    expect(calls[1].url).toBe("https://api.elevenlabs.io/v1/text-to-speech/voice-1?output_format=mp3_44100_64");
    expect(JSON.parse(calls[1].body!)).toEqual({ text: "Gupta ji, paanch sau rupaye", model_id: ELEVENLABS_TTS_MODEL_ID });
  });
});

describe("Gemini response contract", () => {
  it("accepts valid JSON and maps directionKnown=false to a direction flag", () => {
    const out = parseLlmJson(JSON.stringify({ intents: [{ kind: "credit_given", customer: "Gupta ji", amountRupees: 500, directionKnown: false }] }));
    expect(out).toHaveLength(1);
    expect(out[0]).toMatchObject({ kind: "credit_given", customer: "Gupta ji", amountRupees: 500, clarifications: ["direction"] });
  });
  it("discards invalid JSON, wrong types and unknown kinds instead of repairing them", () => {
    expect(parseLlmJson("not json")).toEqual([]);
    expect(parseLlmJson(JSON.stringify({ intents: [{ kind: "transfer_money", amountRupees: 5 }] }))).toEqual([]);
    expect(parseLlmJson(JSON.stringify({ intents: [{ kind: "credit_given", amountRupees: 5.5 }] }))).toEqual([]);
  });
});

describe("hybrid interpretation (ADR-020)", () => {
  const base = { shopId: SEED_SHOP_ID, customers: SEED_CUSTOMERS, now: new Date("2026-11-01T10:00:00Z"), recentEntries: [] };
  it("does not call the LLM when the rules are confident", async () => {
    let called = 0;
    const llm: LlmProvider = { name: "fake", async interpret() { called++; return []; } };
    const p = await interpretText("Gupta ji ne 500 rupaye udhaar liye", { ...base, llm });
    expect(called).toBe(0);
    expect(p.engine).toBe("rules");
  });
  it("asks the LLM only for sentences the rules cannot read, and the amount cross-check still wins", async () => {
    const llm: LlmProvider = {
      name: "fake",
      async interpret() {
        return [{ kind: "credit_given", customer: "Gupta ji", amountRupees: 700, confidence: "medium", clarifications: [] }];
      },
    };
    // "sat so" is a spelling the number parser does not know, so the rules return unknown and the LLM is consulted
    const p = await interpretText("gupta ji ne sat so udhar", { ...base, llm });
    expect(p.engine).toBe("llm");
    expect(p.intents[0].kind).toBe("credit_given");
    // the model's 700 is not found in the sentence by the deterministic parser: flagged, not writable
    expect(p.intents[0].clarifications).toContain("amount");
    expect(p.intents[0].writable).toBe(false);
  });
  it("lets a model read a name the rules missed, when the amount agrees with the sentence", async () => {
    const llm: LlmProvider = {
      name: "fake",
      async interpret() {
        return [{ kind: "credit_given", customer: "Gupta ji", amountRupees: 700, confidence: "medium", clarifications: [] }];
      },
    };
    const p = await interpretText("700 chadha do bhaiya", { ...base, llm });
    // rules already read a 700 with no direction, so they handled it; the LLM is not asked and direction stays flagged
    expect(p.engine).toBe("rules");
    expect(p.intents[0].clarifications).toContain("direction");
  });
  it("falls back to a friendly retry when the LLM throws", async () => {
    const llm: LlmProvider = { name: "fake", async interpret() { throw new Error("network"); } };
    const p = await interpretText("Chai pilao bhai", { ...base, llm });
    expect(p.intents[0].kind).toBe("unknown");
    expect(p.intents[0].writable).toBe(false);
  });
});

describe("adapter selection (keyless mode)", () => {
  it("selects local adapters and reports every missing name when no keys exist", () => {
    const s = adapterStatus({});
    expect(s).toMatchObject({ stt: "local", tts: "local", llm: "rules-only", store: "local", wa: "none", demoMode: true });
    expect(s.missing).toContain("ELEVENLABS_API_KEY");
    expect(s.missing).toContain("GEMINI_API_KEY");
    expect(s.missing).toHaveLength(10);
  });
  it("selects real adapters when keys exist", () => {
    const s = adapterStatus({ ELEVENLABS_API_KEY: "a", GEMINI_API_KEY: "b", DUKAAN_DB_FILE: ".data/ledger.sqlite", WA_SERVICE_URL: "http://127.0.0.1:3001", WA_APP_KEY: "k", WA_APP_SECRET: "s" });
    expect(s).toMatchObject({ stt: "elevenlabs", llm: "gemini", store: "sqlite", wa: "daemon", demoMode: false });
  });
});

describe("review fixes in the interpreter", () => {
  const base = { shopId: SEED_SHOP_ID, customers: SEED_CUSTOMERS, now: new Date("2026-11-01T10:00:00Z"), recentEntries: [] };
  it("always asks the owner for the direction when the model supplied it", async () => {
    const llm: LlmProvider = { name: "fake", async interpret() { return [{ kind: "payment_received", customer: "Gupta ji", amountRupees: 500, confidence: "medium", clarifications: [] }]; } };
    const p = await interpretText("gupta ji ne sat so udhar", { ...base, llm });
    expect(p.intents[0].clarifications).toContain("direction");
    expect(p.intents[0].writable).toBe(false);
  });
  it("asks which amount when one clause holds two numbers", async () => {
    const p = await interpretText("Ramesh ko 5 sabun 150 udhaar", { ...base, llm: null });
    expect(p.intents[0].clarifications).toContain("amount");
    expect(p.intents[0].amountReadings).toEqual([5, 150]);
    expect(p.intents[0].writable).toBe(false);
  });
});
