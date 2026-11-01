import { readSession } from "@/server/auth";
import { getContext } from "@/server/context";
import { route } from "@/server/http";

export const runtime = "nodejs";

/** What the browser needs to choose between the sample shop, setup, login and the app. No secrets. */
export const GET = route(
  "auth.me",
  async (req) => {
    const ctx = getContext();
    const session = await readSession(req, ctx);
    const owner = session ? await ctx.store.getOwner(session.shopId) : null;
    const shop = await ctx.store.getShop(session?.shopId ?? ctx.shopId);
    return {
      authRequired: ctx.authRequired,
      setupNeeded: ctx.authRequired && !(await ctx.store.hasOwners()),
      publicSignup: ctx.authRequired && !!ctx.wa,
      loggedIn: !!session,
      owner: session && owner ? { name: owner.name } : null,
      waLogin: ctx.authRequired && !!ctx.wa,
      isDemoShop: shop?.isDemo ?? !ctx.authRequired,
      visitorDemo: ctx.visitorDemo === true,
      shopName: session || !ctx.authRequired ? shop?.name ?? null : null,
    };
  },
  { public: true },
);
