import { Copy } from "@/components/LocaleProvider";
import { Assistant } from "@/components/Assistant";
import { LandingCtas } from "@/components/LandingCtas";

const HERO_SENTENCE = "Amit Sharma ne 500 rupaye udhaar liye";

export default function Landing() {
  return (
    <>
      <section className="mx-auto grid max-w-6xl gap-8 px-4 pb-10 pt-4 md:grid-cols-12 md:px-8 md:pt-10">
        <div className="md:col-span-5">
          <h1 className="text-[clamp(44px,8vw,72px)] leading-[1.1]">
            <span className="block">
              <Copy en="Speak it. Record it." hi="बोलो, लिखो मत।" />
            </span>
            <span className="block"><Copy en="Your voice. Your ledger." hi="Bolo. Likho mat." /></span>
          </h1>
          <p className="mt-5 max-w-[34ch] text-xl">
            <Copy en="A credit ledger you can speak to. Review the card, press Record entry, and watch it get stamped." hi="Udhaar ka khata jo aap bolkar likhwate ho. Pehle parchi dikhti hai, aap Likh do dabate ho, tab stamp lagta hai." />
          </p>
          <LandingCtas />
        </div>
        <div className="md:col-span-7">
          <Assistant variant="hero" previewText={HERO_SENTENCE} />
        </div>
      </section>

      <section className="bg-neel px-4 py-10 text-safed md:px-8" aria-labelledby="teen-kaam">
        <div className="mx-auto max-w-6xl">
          <h2 id="teen-kaam" className="text-[28px]">
            <Copy en="Three tasks, one sentence" hi="Teen kaam, ek bol mein" />
          </h2>
          <div className="mt-6 grid gap-6 md:grid-cols-3">
            <div>
              <h3 className="text-[22px]"><Copy en="Record" hi="Likhna" /></h3>
              <p className="mt-2"><Copy en="“Gupta ji borrowed 500.” Review the amount, name and money direction before pressing Record entry." hi="“Gupta ji ne 500 udhaar liye.” Amount, naam aur disha parchi par dikhti hai, aap tab hi Likh do dabate ho." /></p>
            </div>
            <div>
              <h3 className="text-[22px]"><Copy en="Remind" hi="Yaad dilana" /></h3>
              <p className="mt-2"><Copy en="Review a polite WhatsApp draft with a pay link. You decide when to send it." hi="Polite WhatsApp message tayyar hota hai, pay link ke saath. WhatsApp mein Send aap dabate ho." /></p>
            </div>
            <div>
              <h3 className="text-[22px]"><Copy en="Review" hi="Dekhna" /></h3>
              <p className="mt-2"><Copy en="See outstanding credit, the largest balances and low stock notes at a glance." hi="Kitna udhaar baaki hai, kis par sabse zyada, aur kya kam hai. Ek nazar mein." /></p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-safed px-4 py-10 md:px-8" aria-labelledby="safe">
        <div className="mx-auto max-w-6xl">
          <h2 id="safe" className="text-[28px]">
            <Copy en="Built for careful bookkeeping" hi="Safe kyun hai" />
          </h2>
          <ul className="mt-5 grid gap-4 md:grid-cols-2">
            <li>
              <span className="font-semibold"><Copy en="Confirmation before recording." hi="Likhne se pehle poochta hai." /></span> <Copy en="Nothing is recorded until you confirm." hi="Bina Likh do ke kuch save nahi hota." />
            </li>
            <li>
              <span className="font-semibold"><Copy en="Amounts in digits and words." hi="Amount ank aur shabd dono mein." /></span> ₹500 <Copy en="and" hi="aur" /> <span><Copy en="five hundred rupees" hi="पाँच सौ रुपये" /></span>.
            </li>
            <li>
              <span className="font-semibold"><Copy en="Money direction in words." hi="Disha shabdon mein." /></span> <Copy en="“Sharma ji paid 500” and “Gave Sharma ji 500 credit” move money in opposite directions. Each is labelled clearly." hi="“Sharma ji ne 500 diye” aur “Sharma ji ko 500 diye” ulti disha ke hain. Dono alag dikhte hain." />
            </li>
            <li>
              <span className="font-semibold"><Copy en="Mistakes are voided." hi="Entry mitati nahi, hata di jaati hai." /></span> <Copy en="The crossed-out original remains visible in the ledger." hi="Khate mein kati hui dikhti rehti hai." />
            </li>
            <li>
              <span className="font-semibold"><Copy en="Two customers named Sharma? It asks." hi="Do Sharma ho to poochta hai." /></span> <Copy en="It does not guess." hi="Andaza nahi lagata." />
            </li>
            <li>
              <span className="font-semibold"><Copy en="A pay link does not mean paid." hi="Pay link ka matlab “paid” nahi." /></span> <Copy en="Record payment only after you actually receive the money." hi="Paise tabhi mile mante hain jab aap Mile mark karo dabate ho." />
            </li>
          </ul>
        </div>
      </section>

      <section className="bg-sindoor px-4 py-10 md:px-8" aria-labelledby="tulna">
        <div className="mx-auto max-w-6xl">
          <h2 id="tulna" className="text-[28px]">
            <Copy en="From paper to Dukaan Dost" hi="Purane khate se kya badla" />
          </h2>
          <div className="mt-5">
            <table className="w-full table-fixed border-2 border-syahi bg-safed text-left text-base md:text-lg">
              <thead>
                <tr className="border-b-2 border-syahi">
                  <th scope="col" className="p-3"></th>
                  <th scope="col" className="p-3"><Copy en="Paper ledger" hi="Kaagaz ka khata" /></th>
                  <th scope="col" className="p-3">Dukaan Dost</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b-2 border-dashed border-syahi">
                  <th scope="row" className="p-3"><Copy en="Recording entries" hi="Entry likhna" /></th>
                  <td className="p-3"><Copy en="Stop work and write by hand" hi="Kaam rokkar haath se" /></td>
                  <td className="p-3"><Copy en="Speak or type, then confirm" hi="Bolo ya likho, ek tap mein pakka" /></td>
                </tr>
                <tr className="border-b-2 border-dashed border-syahi">
                  <th scope="row" className="p-3"><Copy en="Mistakes" hi="Galti" /></th>
                  <td className="p-3"><Copy en="Crossing things out" hi="Kaat-chaant" /></td>
                  <td className="p-3"><Copy en="Voided originals stay visible" hi="Hata di jaati hai, khate mein kati hui dikhti hai" /></td>
                </tr>
                <tr className="border-b-2 border-dashed border-syahi">
                  <th scope="row" className="p-3"><Copy en="Collections" hi="Vasooli" /></th>
                  <td className="p-3"><Copy en="Phone calls or visits" hi="Phone ya ghar jaakar" /></td>
                  <td className="p-3"><Copy en="Polite WhatsApp draft and pay link" hi="Polite WhatsApp draft aur pay link" /></td>
                </tr>
                <tr>
                  <th scope="row" className="p-3"><Copy en="Low stock" hi="Kya kam hai" /></th>
                  <td className="p-3"><Copy en="Remember it yourself" hi="Yaad se" /></td>
                  <td className="p-3"><Copy en="Save a note by saying “flour is low”" hi="“Atta kam hai” se note" /></td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-base">
            <Copy en="This table describes Dukaan Dost, rather than comparing features of other ledger apps. All demo names are fictional." hi="Doosre ledger apps ke features humne yahan nahi tole. Yeh table sirf Dukaan Dost ka apna kaam batati hai. Demo mein sab naam kalpanik hain." />
          </p>
        </div>
      </section>
    </>
  );
}
