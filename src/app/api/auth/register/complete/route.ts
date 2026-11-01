import { completeRegistration } from "@/server/registration";
import { route } from "@/server/http";
export const runtime = "nodejs";
export const POST = route("auth.register.complete", completeRegistration, { public: true });
