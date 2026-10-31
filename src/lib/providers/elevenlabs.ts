import { ELEVENLABS_STT_MODEL_ID, ELEVENLABS_TTS_MODEL_ID } from "../config";
import { ProviderError, type SttProvider, type TtsProvider } from "./types";

/** Endpoints and fields: docs/14_API_FACTS.md (ElevenLabs API reference, checked 2026-11-01). */
const BASE = "https://api.elevenlabs.io";
const STT_TIMEOUT_MS = 6000;

type Fetch = typeof fetch;

async function withRetry<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (e) {
    if (e instanceof ProviderError && e.status < 500 && e.status !== 0) throw e;
    return fn();
  }
}

async function timedFetch(f: Fetch, url: string, init: RequestInit, ms: number): Promise<Response> {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), ms);
  try {
    return await f(url, { ...init, signal: ctl.signal });
  } catch {
    throw new ProviderError("elevenlabs", "Request failed or timed out", "Net ya awaaz service nahi mili. Likh kar try karo.", 504);
  } finally {
    clearTimeout(t);
  }
}

export function createElevenLabsStt(apiKey: string, f: Fetch = fetch): SttProvider {
  return {
    name: "elevenlabs",
    async transcribe(audio) {
      return withRetry(async () => {
        const form = new FormData();
        form.append("model_id", ELEVENLABS_STT_MODEL_ID);
        form.append("file", new Blob([audio.data], { type: audio.mime }), "speech");
        const res = await timedFetch(f, `${BASE}/v1/speech-to-text`, { method: "POST", headers: { "xi-api-key": apiKey }, body: form }, STT_TIMEOUT_MS);
        if (!res.ok) throw new ProviderError("elevenlabs", `Speech-to-text failed (${res.status})`, "Samajh nahi aaya. Dobara bolo ya likho.", res.status >= 500 ? 502 : 400);
        const json = (await res.json()) as { text?: string; language_code?: string };
        const text = (json.text ?? "").trim();
        if (!text) throw new ProviderError("elevenlabs", "Empty transcript", "Kuch sunai nahi diya. Dobara bolo ya likho.", 422);
        return { text, language: json.language_code };
      });
    },
  };
}

export function createElevenLabsTts(apiKey: string, f: Fetch = fetch): TtsProvider {
  let voiceId: string | null = process.env.ELEVENLABS_VOICE_ID ?? null;

  async function pickVoice(): Promise<string> {
    if (voiceId) return voiceId;
    const res = await timedFetch(f, `${BASE}/v2/voices?language=hi&page_size=20`, { headers: { "xi-api-key": apiKey } }, 6000);
    if (!res.ok) throw new ProviderError("elevenlabs", `Voice list failed (${res.status})`, "Awaaz nahi mili. Text hi dikhega.", 502);
    const json = (await res.json()) as { voices?: Array<{ voice_id: string }> };
    const first = json.voices?.[0]?.voice_id;
    if (!first) throw new ProviderError("elevenlabs", "No Hindi voice available", "Awaaz nahi mili. Text hi dikhega.", 502);
    voiceId = first;
    return first;
  }

  return {
    name: "elevenlabs",
    async speak(text) {
      const id = await pickVoice();
      const res = await timedFetch(
        f,
        `${BASE}/v1/text-to-speech/${encodeURIComponent(id)}?output_format=mp3_44100_64`,
        { method: "POST", headers: { "xi-api-key": apiKey, "content-type": "application/json" }, body: JSON.stringify({ text, model_id: ELEVENLABS_TTS_MODEL_ID }) },
        8000,
      );
      if (!res.ok) throw new ProviderError("elevenlabs", `Text-to-speech failed (${res.status})`, "Awaaz nahi bani. Text hi dikhega.", 502);
      return { data: await res.arrayBuffer(), mime: "audio/mpeg" };
    },
  };
}
