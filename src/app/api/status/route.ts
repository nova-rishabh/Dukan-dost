import { getContext } from "@/server/context";
import { route } from "@/server/http";

export const runtime = "nodejs";

/** Which adapters are active. Names only, never values. */
export const GET = route("status", async () => {
  const { status } = getContext();
  return { adapters: { stt: status.stt, tts: status.tts, llm: status.llm, store: status.store }, demoMode: status.demoMode };
});
