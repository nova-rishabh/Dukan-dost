import { Copy } from "@/components/LocaleProvider";
import type { Metadata } from "next";
import Link from "next/link";
import { PosterMaker } from "@/components/PosterMaker";

export const metadata: Metadata = { title: "Offer poster" };

export default function PosterPage() {
  return (
    <div className="mx-auto grid max-w-3xl gap-4 px-4 pb-8 pt-2 md:px-8">
      <Link href="/shop" className="btn w-fit">
        <Copy en="My shop" hi="Meri dukaan" />
      </Link>
      <h1 className="text-[40px] leading-tight"><Copy en="Make an offer poster" hi="Kal ka offer poster" /></h1>
      <p className="text-xl"><Copy en="Enter items and prices. Fixed poster templates keep Hindi and Latin lettering clear." hi="Item aur daam bolo. Poster fixed template se banta hai, isliye Hindi aur Latin akshar saaf aate hain." /></p>
      <PosterMaker />
    </div>
  );
}
