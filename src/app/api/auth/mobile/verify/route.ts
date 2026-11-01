import { verifyMobileChange } from "@/server/mobile-change";
import { route } from "@/server/http";
export const runtime="nodejs";
export const POST=route("auth.mobile.verify",async(req,{session})=>verifyMobileChange(req,session));
