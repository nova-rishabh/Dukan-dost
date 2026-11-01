import { getContext } from "@/server/context";
import { clearedDemoCookie, exitDemo } from "@/server/demo";
import { route } from "@/server/http";
export const runtime = "nodejs";
export const POST = route("demo.exit", async (req) => {
  exitDemo(getContext(), req.headers.get("cookie"));
  return Response.json({ ok: true }, { headers: { "set-cookie": clearedDemoCookie(req), "cache-control": "no-store" } });
}, { public: true });
