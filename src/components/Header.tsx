import Link from "next/link";
import { DemoTag } from "./DemoTag";

export function Header() {
  return (
    <header className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 md:px-8">
      <Link href="/" className="font-display text-2xl text-syahi no-underline" aria-label="Dukaan Dost, home">
        Dukaan Dost
      </Link>
      <nav aria-label="Main" className="flex flex-wrap items-center gap-2">
        <DemoTag />
        <Link href="/try" className="btn">
          Sample dukaan
        </Link>
        <Link href="/shop" className="btn btn-primary">
          Meri dukaan
        </Link>
      </nav>
    </header>
  );
}
