import type { Metadata } from "next";
import { LoginClient } from "@/components/LoginClient";

export const metadata: Metadata = { title: "Login" };

export default function LoginPage() {
  return (
    <div className="mx-auto grid max-w-lg gap-4 px-4 pb-10 pt-2 md:px-8">
      <h1 className="text-[40px] leading-tight">Login</h1>
      <p className="text-xl">Sirf dukaan ka maalik andar aa sakta hai.</p>
      <LoginClient />
    </div>
  );
}
