import { clearedCookie } from "@/server/auth";
import { rateLimit, route } from "@/server/http";

export const runtime = "nodejs";

export const POST = route(
  "auth.logout",
  async (req) => {
    rateLimit(req, "logout", 60);
    return Response.json({ ok: true }, { headers: { "set-cookie": clearedCookie(req) } });
  },
  { public: true },
);
