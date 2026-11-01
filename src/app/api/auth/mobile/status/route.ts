import { mobileChangeStatus } from "@/server/mobile-change";
import { route } from "@/server/http";
export const runtime="nodejs";
export const GET=route("auth.mobile.status",async(req,{session})=>mobileChangeStatus(req,session));
