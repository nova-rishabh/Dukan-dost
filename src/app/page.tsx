import { Assistant } from "@/components/Assistant";
import { LandingCtas } from "@/components/LandingCtas";

const HERO_SENTENCE = "Amit Sharma ne 500 rupaye udhaar liye";

export default function Landing() {
  return (
    <>
      <section className="mx-auto grid max-w-6xl gap-8 px-4 pb-10 pt-4 md:grid-cols-12 md:px-8 md:pt-10">
        <div className="md:col-span-5">
          <h1 className="text-[clamp(44px,8vw,72px)] leading-[1.1]">
            <span lang="hi" className="block">
              बोलो, लिखो मत।
            </span>
            <span className="block">Bolo. Likho mat.</span>
          </h1>
          <p className="mt-5 max-w-[34ch] text-xl">
            Udhaar ka khata jo aap bolkar likhwate ho. Pehle parchi dikhti hai, aap Likh do dabate ho, tab stamp lagta hai.
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
            Teen kaam, ek bol mein
          </h2>
          <div className="mt-6 grid gap-6 md:grid-cols-3">
            <div>
              <h3 className="text-[22px]">Likhna</h3>
              <p className="mt-2">“Gupta ji ne 500 udhaar liye.” Amount, naam aur disha parchi par dikhti hai, aap tab hi Likh do dabate ho.</p>
            </div>
            <div>
              <h3 className="text-[22px]">Yaad dilana</h3>
              <p className="mt-2">Polite WhatsApp message tayyar hota hai, pay link ke saath. WhatsApp mein Send aap dabate ho.</p>
            </div>
            <div>
              <h3 className="text-[22px]">Dekhna</h3>
              <p className="mt-2">Kitna udhaar baaki hai, kis par sabse zyada, aur kya kam hai. Ek nazar mein.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-safed px-4 py-10 md:px-8" aria-labelledby="safe">
        <div className="mx-auto max-w-6xl">
          <h2 id="safe" className="text-[28px]">
            Safe kyun hai
          </h2>
          <ul className="mt-5 grid gap-4 md:grid-cols-2">
            <li>
              <span className="font-semibold">Likhne se pehle poochta hai.</span> Bina Likh do ke kuch save nahi hota.
            </li>
            <li>
              <span className="font-semibold">Amount ank aur shabd dono mein.</span> ₹500 aur <span lang="hi">पाँच सौ रुपये</span>.
            </li>
            <li>
              <span className="font-semibold">Disha shabdon mein.</span> “Sharma ji ne 500 diye” aur “Sharma ji ko 500 diye” ulti disha ke hain. Dono alag dikhte hain.
            </li>
            <li>
              <span className="font-semibold">Entry mitati nahi, hata di jaati hai.</span> Khate mein kati hui dikhti rehti hai.
            </li>
            <li>
              <span className="font-semibold">Do Sharma ho to poochta hai.</span> Andaza nahi lagata.
            </li>
            <li>
              <span className="font-semibold">Pay link ka matlab “paid” nahi.</span> Paise tabhi mile mante hain jab aap Mile mark karo dabate ho.
            </li>
          </ul>
        </div>
      </section>

      <section className="bg-sindoor px-4 py-10 md:px-8" aria-labelledby="tulna">
        <div className="mx-auto max-w-6xl">
          <h2 id="tulna" className="text-[28px]">
            Purane khate se kya badla
          </h2>
          <div className="mt-5">
            <table className="w-full table-fixed border-2 border-syahi bg-safed text-left text-base md:text-lg">
              <thead>
                <tr className="border-b-2 border-syahi">
                  <th scope="col" className="p-3"></th>
                  <th scope="col" className="p-3">Kaagaz ka khata</th>
                  <th scope="col" className="p-3">Dukaan Dost</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b-2 border-dashed border-syahi">
                  <th scope="row" className="p-3">Entry likhna</th>
                  <td className="p-3">Kaam rokkar haath se</td>
                  <td className="p-3">Bolo ya likho, ek tap mein pakka</td>
                </tr>
                <tr className="border-b-2 border-dashed border-syahi">
                  <th scope="row" className="p-3">Galti</th>
                  <td className="p-3">Kaat-chaant</td>
                  <td className="p-3">Hata di jaati hai, khate mein kati hui dikhti hai</td>
                </tr>
                <tr className="border-b-2 border-dashed border-syahi">
                  <th scope="row" className="p-3">Vasooli</th>
                  <td className="p-3">Phone ya ghar jaakar</td>
                  <td className="p-3">Polite WhatsApp draft aur pay link</td>
                </tr>
                <tr>
                  <th scope="row" className="p-3">Kya kam hai</th>
                  <td className="p-3">Yaad se</td>
                  <td className="p-3">“Atta kam hai” se note</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-base">
            Doosre ledger apps ke features humne yahan nahi tole. Yeh table sirf Dukaan Dost ka apna kaam batati hai. Demo mein sab naam kalpanik hain.
          </p>
        </div>
      </section>
    </>
  );
}
