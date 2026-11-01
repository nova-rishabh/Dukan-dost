import { registrationStatus } from "@/server/registration";
import { route } from "@/server/http";
export const runtime = "nodejs";
export const GET = route("auth.register.status", registrationStatus, { public: true });
