import { Copy } from "@/components/LocaleProvider";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { TryClient } from "@/components/TryClient";
import { getContext } from "@/server/context";

export const metadata: Metadata = { title: "Sample dukaan", description: "Bina login, bina mic: paanch sample clip ya apna sentence likho." };

// the sample shop is for the open demo only; a real shop sends visitors to its own login
export const dynamic = "force-dynamic";

export default function TryPage() {
  if (getContext().authRequired) redirect("/shop");
  return (
    <div className="mx-auto grid max-w-3xl gap-5 px-4 pb-8 pt-2 md:px-8">
      <h1 className="text-[40px] leading-tight"><Copy en="Sample shop" hi="Sample dukaan" /></h1>
      <p className="text-xl">
        <Copy en="No login or microphone needed. Try five sample clips or type your own sentence. This is a fictional shop; the clips use AI voices (dramatisation)." hi="Bina login, bina mic. Paanch sample clip dabao ya apna sentence likho. Dukaan kalpanik hai, aur clips AI se banayi gayi awaaz hain (dramatisation)." />
      </p>
      <TryClient />
    </div>
  );
}
