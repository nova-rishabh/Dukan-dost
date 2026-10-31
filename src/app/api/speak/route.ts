import { SpeakBody } from "@/lib/schemas";
import { getContext } from "@/server/context";
import { rateLimit, readJson, route } from "@/server/http";

export const runtime = "nodejs";

/** Read-back (P1-1, P1-3). Silent in keyless mode: the card and answer are always shown as text too. */
export const POST = route("speak", async (req) => {
  rateLimit(req, "speak", 20);
  const ctx = getContext();
  const { text } = SpeakBody.parse(await readJson(req, 1000));
  const audio = await ctx.tts.speak(text);
  if (!audio) return { available: false };
  return new Response(audio.data, { headers: { "content-type": audio.mime, "cache-control": "no-store" } });
});
