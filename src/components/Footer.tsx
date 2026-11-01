import Link from "next/link";
import { Copy } from "./LocaleProvider";

export function Footer() {
  return (
    <footer className="bg-syahi px-4 py-12 text-safed print:hidden md:px-8">
      <div className="mx-auto grid max-w-6xl gap-10 md:grid-cols-12">
        <div className="md:col-span-5">
          <p className="font-display text-3xl">Dukaan Dost</p>
          <p className="mt-3 max-w-[36ch] text-lg">
            <Copy en="A credit ledger you speak to. You confirm every entry." hi="Udhaar ka khata jo aap bolkar likhwate ho. Har entry aap pakki karte ho." />
          </p>
        </div>
        <nav aria-label="Dukaan Dost" className="md:col-span-2">
          <h2 className="font-display text-xl"><Copy en="Try it" hi="Try karo" /></h2>
          <ul className="mt-3 grid gap-2">
            <li><Link className="footer-link" href="/try"><Copy en="Sample shop" hi="Sample dukaan" /></Link></li>
            <li><Link className="footer-link" href="/signup"><Copy en="Create account" hi="Naya account" /></Link></li>
            <li><Link className="footer-link" href="/login"><Copy en="Log in" hi="Login" /></Link></li>
            <li><Link className="footer-link" href="/shop"><Copy en="My shop" hi="Meri dukaan" /></Link></li>
          </ul>
        </nav>
        <div className="md:col-span-3">
          <h2 className="font-display text-xl"><Copy en="How it stays careful" hi="Kaise bharosa rakhta hai" /></h2>
          <ul className="mt-3 grid gap-2">
            <li><Copy en="Nothing is recorded until you confirm." hi="Bina Likh do ke kuch save nahi hota." /></li>
            <li><Copy en="Mistakes are voided, never erased." hi="Galti hata di jaati hai, mitati nahi." /></li>
            <li><Copy en="Reminders are drafts. You press Send." hi="Reminder draft hai. Send aap dabate ho." /></li>
          </ul>
        </div>
        <nav aria-label="Project" className="md:col-span-2">
          <h2 className="font-display text-xl"><Copy en="Project" hi="Project" /></h2>
          <ul className="mt-3 grid gap-2">
            <li><Link className="footer-link" href="/submission"><Copy en="Submission" hi="Submission" /></Link></li>
            <li><Link className="footer-link" href="/submission/social"><Copy en="Social posts" hi="Social posts" /></Link></li>
          </ul>
        </nav>
      </div>
      <div className="mx-auto mt-10 max-w-6xl border-t-2 border-safed pt-5 text-base">
        <p><Copy en="Sample shop names and numbers are fictional. Built for the AI Builder Challenge." hi="Sample dukaan ke naam aur amount kalpanik hain. AI Builder Challenge ke liye banaya gaya." /></p>
      </div>
    </footer>
  );
}
