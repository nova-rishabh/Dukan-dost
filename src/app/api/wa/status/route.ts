import { waHealth } from "@/lib/waService";
import { getContext } from "@/server/context";
import { rateLimit, route } from "@/server/http";

export const runtime = "nodejs";

/** Is the WhatsApp service up, and is a phone paired? Owner only. */
export const GET = route("wa.status", async (req) => {
  rateLimit(req, "wastatus", 60);
  const ctx = getContext();
  if (!ctx.authRequired || !ctx.wa) return { configured: false, reachable: false, whatsapp: "NONE", adminUrl: null };
  const h = await waHealth(ctx.wa);
  return { configured: true, reachable: h.reachable, whatsapp: h.whatsapp, adminUrl: `${ctx.wa.baseUrl}/admin` };
});
