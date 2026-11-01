import { verifyRegistration } from "@/server/registration";
import { route } from "@/server/http";
export const runtime = "nodejs";
export const POST = route("auth.register.verify", verifyRegistration, { public: true });
