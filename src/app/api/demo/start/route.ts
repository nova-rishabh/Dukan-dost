import { getContext } from "@/server/context";
import { demoCookie, startDemo } from "@/server/demo";
import { HttpError, rateLimit, route } from "@/server/http";
export const runtime = "nodejs";
export const POST = route("demo.start", async (req) => {
  rateLimit(req, "demo-start", 30);
  try {
    const demo = startDemo(getContext(), req.headers.get("cookie"));
    return Response.json({ ok: true, demo: true, expiresInSeconds: 1800 }, { headers: { "set-cookie": demoCookie(req, demo.token), "cache-control": "no-store" } });
  } catch (error) {
    if (error instanceof Error && error.message === "demo_capacity") throw new HttpError(503, "demo_capacity", "The sample shop is busy", "Please try the sample shop again in a few minutes.");
    throw error;
  }
}, { public: true });
