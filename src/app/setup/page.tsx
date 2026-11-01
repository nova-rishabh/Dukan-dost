import { LocalizedText } from "@/components/LocaleProvider";
import type { Metadata } from "next";
import { SetupClient } from "@/components/SetupClient";

export const metadata: Metadata = { title: "Dukaan set karo" };

export default function SetupPage() {
  return (
    <div className="mx-auto grid max-w-lg gap-4 px-4 pb-10 pt-2 md:px-8">
      <h1 className="text-[40px] leading-tight"><LocalizedText id="setup" /></h1>
      <p className="text-xl"><LocalizedText id="setupIntro" /></p>
      <SetupClient />
    </div>
  );
}
