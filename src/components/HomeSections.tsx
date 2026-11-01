import Link from "next/link";
import { Copy } from "./LocaleProvider";
import { Munshi } from "./Munshi";

const STEPS = [
  ["1", "Speak or type", "Bolo ya likho", "Press the mic and say it the way you would to a helper.", "Mic dabao aur waise bolo jaise munshi ji se bolte ho."],
  ["2", "Check the card", "Parchi dekho", "Name, amount in digits and words, and the direction. Wrong? Change it.", "Naam, amount ank aur shabd mein, aur disha. Galat hai? Badlo."],
  ["3", "Record entry", "Likh do", "The stamp lands only after your tap. Then the balance changes.", "Stamp aapke tap ke baad hi lagta hai. Phir balance badalta hai."],
  ["4", "Send a reminder", "Yaad dilao", "A polite WhatsApp draft is ready. WhatsApp opens and you press Send.", "Polite WhatsApp draft tayyar. WhatsApp khulta hai, Send aap dabate ho."],
] as const;

const FAQ = [
  ["Does it send messages by itself?", "Kya yeh khud message bhejta hai?", "No. It prepares a draft. WhatsApp opens and you press Send yourself.", "Nahi. Yeh sirf draft banata hai. WhatsApp khulta hai aur Send aap dabate ho."],
  ["What if it hears me wrong?", "Galat sun liya to?", "You see the card first. Change it or leave it. Nothing is saved until you press Record entry.", "Pehle parchi dikhti hai. Badal sakte ho. Likh do dabane se pehle kuch save nahi hota."],
  ["Can I delete an entry?", "Kya entry delete ho sakti hai?", "No. A wrong entry is voided and the crossed-out original stays in the ledger.", "Nahi. Galat entry hata di jaati hai, khate mein kati hui dikhti rehti hai."],
  ["Do I need to install anything?", "Kuch install karna padega?", "It runs in the browser. On many phones you can also add it to the home screen.", "Browser mein chalta hai. Kai phones mein home screen par bhi laga sakte ho."],
  ["Is the sample shop real?", "Kya sample dukaan asli hai?", "No. The sample uses fictional names and amounts so you can try it freely.", "Nahi. Sample mein naam aur amount kalpanik hain, taaki aap befikar try karo."],
] as const;

export function HowItWorks() {
  return (
    <section className="px-4 py-14 md:px-8" aria-labelledby="kaise">
      <div className="mx-auto max-w-6xl">
        <h2 id="kaise" className="text-[32px]"><Copy en="How one entry works" hi="Ek entry kaise banti hai" /></h2>
        <ol className="mt-8 grid gap-6 md:grid-cols-4">
          {STEPS.map(([n, en, hi, enText, hiText]) => (
            <li key={n} className="sticker flex flex-col gap-3 p-5">
              <span className="font-display text-5xl leading-none">{n}</span>
              <h3 className="text-[24px]"><Copy en={en} hi={hi} /></h3>
              <p><Copy en={enText} hi={hiText} /></p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

export function Questions() {
  return (
    <section className="px-4 py-14 md:px-8" aria-labelledby="sawal">
      <div className="mx-auto max-w-4xl">
        <h2 id="sawal" className="text-[32px]"><Copy en="Questions shopkeepers ask" hi="Dukaandar ke sawal" /></h2>
        <div className="mt-6 grid gap-4">
          {FAQ.map(([qEn, qHi, aEn, aHi]) => (
            <details key={qEn} className="sticker p-4">
              <summary className="cursor-pointer text-lg font-semibold"><Copy en={qEn} hi={qHi} /></summary>
              <p className="mt-3"><Copy en={aEn} hi={aHi} /></p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

export function StartBand() {
  return (
    <section className="bg-pista px-4 py-14 md:px-8" aria-labelledby="shuru">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-8 md:flex-row">
        <Munshi pose="welcome" />
        <div className="flex-1">
          <h2 id="shuru" className="text-[32px]"><Copy en="Try the sample shop first" hi="Pehle sample dukaan mein try karo" /></h2>
          <p className="mt-3 max-w-[48ch] text-xl"><Copy en="No sign-up. Speak one entry, check the card and watch the stamp land." hi="Sign-up nahi chahiye. Ek entry bolo, parchi dekho aur stamp lagta dekho." /></p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/try" className="btn btn-primary"><Copy en="Try sample shop" hi="Sample dukaan try karo" /></Link>
            <Link href="/signup" className="btn"><Copy en="Create account" hi="Naya account" /></Link>
          </div>
        </div>
      </div>
    </section>
  );
}
