import { startMobileChange } from "@/server/mobile-change";
import { route } from "@/server/http";
export const runtime="nodejs";
export const POST=route("auth.mobile.start",async(req,{session})=>startMobileChange(req,session));
