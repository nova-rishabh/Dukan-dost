import type { Metadata } from "next";
import Link from "next/link";
import { PosterMaker } from "@/components/PosterMaker";

export const metadata: Metadata = { title: "Offer poster" };

export default function PosterPage() {
  return (
    <div className="mx-auto grid max-w-3xl gap-4 px-4 pb-8 pt-2 md:px-8">
      <Link href="/shop" className="font-semibold underline">
        Meri dukaan
      </Link>
      <h1 className="text-[40px] leading-tight">Kal ka offer poster</h1>
      <p className="text-xl">Item aur daam bolo. Poster fixed template se banta hai, isliye Hindi aur Latin akshar saaf aate hain.</p>
      <PosterMaker />
    </div>
  );
}
