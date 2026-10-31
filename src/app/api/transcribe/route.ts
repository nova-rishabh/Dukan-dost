import { sampleById } from "@/lib/samples";
import { TranscribeJson } from "@/lib/schemas";
import { getContext } from "@/server/context";
import { HttpError, rateLimit, readJson, route } from "@/server/http";

export const runtime = "nodejs";
const MAX_AUDIO_BYTES = 5 * 1024 * 1024;

export const POST = route("transcribe", async (req) => {
  rateLimit(req, "transcribe", 20);
  const ctx = getContext();
  const type = req.headers.get("content-type") ?? "";
  if (type.includes("application/json")) {
    const { sampleId } = TranscribeJson.parse(await readJson(req, 500));
    const clip = sampleById(sampleId);
    if (!clip) throw new HttpError(404, "sample_not_found", "Unknown sample clip", "Sample clip chuno.");
    return { text: clip.transcript, language: "hi", engine: "sample" };
  }
  const data = await req.arrayBuffer();
  if (data.byteLength === 0) throw new HttpError(400, "empty_audio", "No audio received", "Dobara bolo.");
  if (data.byteLength > MAX_AUDIO_BYTES) throw new HttpError(413, "audio_too_large", "Audio too large", "Chhota sentence bolo.");
  const result = await ctx.stt.transcribe({ data, mime: type.split(";")[0] || "audio/webm" });
  return { text: result.text, language: result.language, engine: ctx.stt.name };
});
