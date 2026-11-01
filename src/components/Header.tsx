import Link from "next/link";
import { DemoTag } from "./DemoTag";
import { NavBar } from "./NavBar";

export function Header() {
  return (
    <header className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 px-4 py-3 md:px-8">
      <Link href="/" className="font-display text-2xl text-syahi no-underline" aria-label="Dukaan Dost, home">
        Dukaan Dost
      </Link>
      <DemoTag />
      <NavBar />
    </header>
  );
}
