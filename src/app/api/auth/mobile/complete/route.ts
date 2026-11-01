import { completeMobileChange } from "@/server/mobile-change";
import { route } from "@/server/http";
export const runtime="nodejs";
export const POST=route("auth.mobile.complete",async(req,{session})=>completeMobileChange(req,session));
