import Link from "next/link";
import { Munshi } from "@/components/Munshi";

export const metadata = { title: "Munshi ji ki madad" };

export default function HelpPage() {
  return (
    <div className="mx-auto grid max-w-3xl gap-5 px-4 py-6 md:px-8">
      <Link href="/shop" className="btn w-fit">Khata par wapas</Link>
      <div className="flex items-center gap-4">
        <Munshi />
        <div><h1 className="text-[40px] leading-tight">Munshi ji ki madad</h1><p>Bolo, parchi dekho, phir Likh do.</p></div>
      </div>
      <section className="sticker grid gap-3 p-5">
        <h2 className="text-[28px]">Ne aur ko ka farq</h2>
        <p className="hand">“Gupta ji ne 500 diye”</p><p>Paise mile. Gupta ji ka baaki kam hoga.</p>
        <p className="hand">“Gupta ji ko 500 diye”</p><p>Udhaar diya. Gupta ji ka baaki badhega.</p>
        <p>Parchi par naam, rakam aur disha dekho. Galat ho toh Badlo dabao. Likh do se pehle khata nahi badalta.</p>
      </section>
      <section className="sticker grid gap-3 p-5">
        <h2 className="text-[28px]">Kya bol sakte hain?</h2>
        <ul className="grid list-disc gap-2 pl-6">
          <li>“Gupta ji ne 500 rupaye udhaar liye”</li>
          <li>“Gupta ji ka kitna baaki hai?”</li>
          <li>“Atta kam hai” — sirf note, koi quantity nahi.</li>
        </ul>
        <p>Bolo dabao, bol lo, phir dobara dabao. Ya daba kar rakho aur bolne ke baad chhod do. Mic na chale toh neeche likho.</p>
        <Link href="/try" className="btn w-fit">Sample se seekho</Link>
      </section>
      <section className="sticker grid gap-3 p-5">
        <h2 className="text-[28px]">Yaad dilao aur paise milna</h2>
        <p>Customer ka khata kholo, Yaad dilao dabao aur message dekho. Aapke confirm karne par hi message jaata hai.</p>
        <p>Pay link bhejne se payment nahi hoti. Paise sach mein milne par hi Mile mark karo, phir parchi dekh kar Likh do.</p>
        <p>Galat entry ko khate mein Hata do se sudharo. Purani entry dikhti rahegi, baaki mein nahi judegi.</p>
      </section>
    </div>
  );
}
