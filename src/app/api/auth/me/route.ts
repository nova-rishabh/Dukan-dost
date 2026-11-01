import { readSession } from "@/server/auth";
import { getContext } from "@/server/context";
import { route } from "@/server/http";

export const runtime = "nodejs";

/** What the browser needs to choose between the sample shop, setup, login and the app. No secrets. */
export const GET = route(
  "auth.me",
  async (req) => {
    const ctx = getContext();
    const owner = ctx.authRequired ? await ctx.store.getOwner(ctx.shopId) : null;
    const session = await readSession(req, ctx);
    const shop = await ctx.store.getShop(ctx.shopId);
    return {
      authRequired: ctx.authRequired,
      setupNeeded: ctx.authRequired && !owner,
      loggedIn: !!session,
      owner: session && owner ? { name: owner.name } : null,
      waLogin: ctx.authRequired && !!ctx.wa,
      isDemoShop: shop?.isDemo ?? !ctx.authRequired,
      shopName: shop?.name ?? null,
    };
  },
  { public: true },
);
