import { Copy } from "@/components/LocaleProvider";
import Link from "next/link";
import { Munshi } from "@/components/Munshi";

export const metadata = { title: "Munshi ji ki madad" };

export default function HelpPage() {
  return (
    <div className="mx-auto grid max-w-3xl gap-5 px-4 py-6 md:px-8">
      <Link href="/shop" className="btn w-fit"><Copy en="Back to ledger" hi="Khata par wapas" /></Link>
      <div className="flex items-center gap-4">
        <Munshi />
        <div><h1 className="text-[40px] leading-tight"><Copy en="Help from Munshi ji" hi="Munshi ji ki madad" /></h1><p><Copy en="Speak, review the card, then press Record entry." hi="Bolo, parchi dekho, phir Likh do." /></p></div>
      </div>
      <section className="sticker grid gap-3 p-5">
        <h2 className="text-[28px]"><Copy en="Understand the money direction" hi="Ne aur ko ka farq" /></h2>
        <p className="hand"><Copy en="“Gupta ji paid 500”" hi="“Gupta ji ne 500 diye”" /></p><p><Copy en="Payment received. Gupta ji’s outstanding balance decreases." hi="Paise mile. Gupta ji ka baaki kam hoga." /></p>
        <p className="hand"><Copy en="“Gave Gupta ji 500 credit”" hi="“Gupta ji ko 500 diye”" /></p><p><Copy en="Credit given. Gupta ji’s outstanding balance increases." hi="Udhaar diya. Gupta ji ka baaki badhega." /></p>
        <p><Copy en="Check the name, amount and direction on the card. Press Edit to correct it. The ledger changes only after you press Record entry." hi="Parchi par naam, rakam aur disha dekho. Galat ho toh Badlo dabao. Likh do se pehle khata nahi badalta." /></p>
      </section>
      <section className="sticker grid gap-3 p-5">
        <h2 className="text-[28px]"><Copy en="What can I say?" hi="Kya bol sakte hain?" /></h2>
        <ul className="grid list-disc gap-2 pl-6">
          <li><Copy en="“Gupta ji borrowed 500 rupees”" hi="“Gupta ji ne 500 rupaye udhaar liye”" /></li>
          <li><Copy en="“What is Gupta ji’s balance?”" hi="“Gupta ji ka kitna baaki hai?”" /></li>
          <li><Copy en="“Flour is low” saves a note without inventing a quantity." hi="“Atta kam hai” — sirf note, koi quantity nahi." /></li>
        </ul>
        <p><Copy en="Press Speak, say your entry, then press again to stop. Or hold while speaking and release when finished. You can also type below." hi="Bolo dabao, bol lo, phir dobara dabao. Ya daba kar rakho aur bolne ke baad chhod do. Mic na chale toh neeche likho." /></p>
        <Link href="/try" className="btn w-fit"><Copy en="Try the samples" hi="Sample se seekho" /></Link>
      </section>
      <section className="sticker grid gap-3 p-5">
        <h2 className="text-[28px]"><Copy en="Reminders and payments" hi="Yaad dilao aur paise milna" /></h2>
        <p><Copy en="Open the customer’s ledger, press Send reminder and review the draft. Sending requires your confirmation." hi="Customer ka khata kholo, Yaad dilao dabao aur message dekho. Aapke confirm karne par hi message jaata hai." /></p>
        <p><Copy en="Sending a pay link does not record payment. After receiving the money, press Record payment, review the card and confirm." hi="Pay link bhejne se payment nahi hoti. Paise sach mein milne par hi Mile mark karo, phir parchi dekh kar Likh do." /></p>
        <p><Copy en="Use Void entry to correct a mistake. The original remains visible but no longer affects the balance." hi="Galat entry ko khate mein Hata do se sudharo. Purani entry dikhti rahegi, baaki mein nahi judegi." /></p>
      </section>
    </div>
  );
}
