# 14 API Facts (verified 2026-11-01)

Sources are official docs fetched via WebFetch, plus read-only inspection of node_modules. Anything not verified is marked UNVERIFIED.

## 1. ElevenLabs Speech-to-Text
Source: https://elevenlabs.io/docs/api-reference/speech-to-text/convert
- `POST https://api.elevenlabs.io/v1/speech-to-text`, `Content-Type: multipart/form-data`
- Auth header: `xi-api-key`
- Query params (optional): `token`, `enable_logging`
- Multipart fields: `model_id` (REQUIRED), `file`, `source_url` (`cloud_storage_url` deprecated), `language_code`, `tag_audio_events`, `num_speakers`, `timestamps_granularity`, `diarize`, `diarization_threshold`, `additional_formats`, `file_format`, `webhook`, `webhook_id`, `webhook_metadata`, `temperature`, `seed`, `use_multi_channel`, `multichannel_output_style`, `entity_detection`, `entity_redaction`, `entity_redaction_mode`, `no_verbatim`, `use_speaker_library`, `detect_speaker_roles`, `keyterms`, `transcript_edit`
- model_id: the page does not list the enum; the only value shown (in examples) is `scribe_v2`. Use `scribe_v2`. Allowed list: UNVERIFIED.
- Response 200 (single transcript): `language_code`, `language_probability`, `text`, `words[]` (`text`, `type`, `logprob`, `start`, `end`, `speaker_id`, `characters`, `channel_index`), `channel_index`, `additional_formats`, `transcription_id`, `entities`, `audio_duration_secs`, `edited_transcript`. With `use_multi_channel`: `transcripts`, `transcription_id`, `audio_duration_secs`. Webhook mode / 202: `message`, `request_id`, `transcription_id`. 422: `detail`.

## 2. ElevenLabs Text-to-Speech
Source: https://elevenlabs.io/docs/api-reference/text-to-speech/convert
- `POST https://api.elevenlabs.io/v1/text-to-speech/{voice_id}`; auth `xi-api-key`
- Query: `output_format` (default `mp3_44100_128`). MP3 values: `mp3_22050_32`, `mp3_24000_48`, `mp3_44100_32`, `mp3_44100_64`, `mp3_44100_96`, `mp3_44100_128`, `mp3_44100_192` (Creator tier+). Also `enable_logging`.
- JSON body: `text` (required), `model_id` (default `eleven_multilingual_v2`; no enum on page, "Query available models with `GET /v1/models`"), `language_code` (ISO 639-1; NOT supported for multilingual_v2 models), `voice_settings`, `seed`, `previous_text`, `next_text`, `apply_text_normalization` (`auto|on|off`), etc.
- Response 200: binary audio.
- Hindi recommended model: the docs page only states default `eleven_multilingual_v2`. Whether `eleven_v3` / `eleven_flash_v2_5` is recommended for Hindi: UNVERIFIED (not stated on this page). Call `GET https://api.elevenlabs.io/v1/models` at runtime (needs key) to confirm.
- List voices: source https://elevenlabs.io/docs/api-reference/voices/search : `GET https://api.elevenlabs.io/v2/voices` (v2, not v1/voices). Query: `search`, `page_size` (default 10, max 100), `next_page_token`, `language` (list), `gender`, `accent`, `category`, `voice_type`, `sort`, `sort_direction`, `include_total_count`, `voice_ids`. Response: `voices[]` (`voice_id`, `name`, `labels`, `verified_languages[]` with `language`, `model_id`, `accent`, `locale`, `preview_url`), `has_more`, `total_count`, `next_page_token`. Pick a voice whose `verified_languages` includes Hindi (`hi`); exact language string format UNVERIFIED. GET /v1/voices legacy form: UNVERIFIED.

## 3. Gemini
Sources: https://ai.google.dev/gemini-api/docs/models ; https://ai.google.dev/gemini-api/docs/structured-output ; node_modules.
- Stable Flash-class: `gemini-3.8-flash` (labeled "New Stable") CONFIRMED. Also stable: `gemini-3.6-flash`, `gemini-3.5-flash-lite`, `gemini-3.1-flash-lite`. Preview: `gemini-3-flash-preview`. Older: `gemini-2.5-flash`, `gemini-2.5-flash-lite` (limited access to prior users).
- Installed `@google/genai` version: 2.32.0 (node_modules/@google/genai/package.json).
- Types (dist/genai.d.ts, GenerateContentConfig): `systemInstruction?: ContentUnion`, `responseMimeType?: string`, `responseSchema?: SchemaUnion`, `responseJsonSchema?: unknown` (JSON Schema; "If set, `response_schema` must be omitted, but `response_mime_type` is required"). Both exist; use ONE. Doc comment: if responseSchema doesn't process correctly, try responseJsonSchema.
- `GenerateContentResponse` has `get text(): string | undefined` -> `response.text`; parse with `JSON.parse(response.text ?? '')`.
- Usage (matches d.ts; runtime not executed):
```ts
import { GoogleGenAI } from '@google/genai';
const ai = new GoogleGenAI({ apiKey });
const response = await ai.models.generateContent({
  model: 'gemini-3.8-flash',
  contents,
  config: { systemInstruction, responseMimeType: 'application/json', responseJsonSchema: schema },
});
const data = JSON.parse(response.text!);
```
- NOTE: the current structured-output docs page shows a newer `client.interactions.create({ model, input, response_format: { type: 'text', mime_type: 'application/json', schema } })` reading `interaction.output_text`. `ai.models.generateContent` still exists in the installed SDK types, so it remains usable; the docs page did not mention it (UNVERIFIED whether it is deprecated).

## 4. @supabase/supabase-js
Installed version 2.118.0 (postgrest-js 2.118.0, auth-js 2.118.0).
- `createClient(url, key, { auth: { persistSession: false } })`: `persistSession?: boolean` exists in auth-js types.d.ts (line 62). CONFIRMED.
- postgrest-js d.ts (`dist/index.d.cts`, upsert docs ~line 4483-4550): `.upsert(values, { onConflict: 'col1,col2', ignoreDuplicates: boolean })`; `onConflict` = comma-separated UNIQUE column(s); `ignoreDuplicates: true` ignores duplicate rows (default false = merge). Example in docs: `.upsert({ username: 'supabot' }, { onConflict: 'username' })`.
- `.insert(row).select().single()` standard postgrest-js chain; `.single()` errors unless exactly one row is returned. (Not individually grepped; standard API, treat as high confidence.) Note: with `ignoreDuplicates: true` and a conflict, `.select().single()` returns no row and errors; use `.maybeSingle()` in that case.

## 5. Openverse
Source: https://api.openverse.org/v1/audio/?q=stamp&license=cc0 (attempted)
- UNVERIFIED. Requests from this environment returned HTTP 504 (twice), HTTP 500 (Cloudflare-fronted error page) and a WebFetch timeout at 60s. A first attempt with a custom User-Agent was blocked by the permission classifier and was not retried. No JSON was obtained, so field names, whether `url` is a directly downloadable audio file, and the 5 candidates per query (rubber stamp, stamp thud, ui click, notification, whoosh) are all UNVERIFIED.
- Expected (from Openverse docs knowledge, UNVERIFIED): result fields include `id`, `title`, `creator`, `license`, `url`, `foreign_landing_url`, `filetype`, `duration` (ms). Retry later with plain `curl` and no auth; always check `license == "cc0"` per result.
