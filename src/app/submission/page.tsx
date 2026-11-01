import Link from "next/link";
import { Copy } from "@/components/LocaleProvider";
import { Munshi } from "@/components/Munshi";

export default function SubmissionPage() {
  return <div className="mx-auto grid max-w-3xl gap-5 px-4 py-6 md:px-8">
    <div className="flex items-center gap-4"><Munshi /><div><h1 className="text-4xl"><Copy en="Dukaan Dost submission" hi="Dukaan Dost ki submission" /></h1><p><Copy en="Try the fictional shop and inspect the supporting work." hi="Kalpanik dukaan try karo aur saath ka kaam dekho." /></p></div></div>
    <p className="sticker p-4"><Copy en="The product, deck, three posts and final video are collected here. All product examples use fictional shop data." hi="Product, deck, teen posts aur final video yahan hain. Product ki saari misaal mein kalpanik dukaan ka data hai." /></p>
    <ol className="grid list-none gap-3 p-0">
      <li className="sticker p-4"><h2 className="text-2xl"><Copy en="1. Product" hi="1. Product" /></h2><Link className="underline" href="/try"><Copy en="Open the fictional trial" hi="Kalpanik trial kholo" /></Link></li>
      <li className="sticker p-4"><h2 className="text-2xl"><Copy en="2. Website" hi="2. Website" /></h2><Link className="underline" href="/"><Copy en="Read the product website" hi="Product ki website dekho" /></Link></li>
      <li className="sticker p-4"><h2 className="text-2xl"><Copy en="3. Social posts" hi="3. Social posts" /></h2><Link className="underline" href="/submission/social"><Copy en="Three posts and bilingual captions" hi="Teen posts aur Hindi-English captions" /></Link></li>
      <li className="sticker p-4"><h2 className="text-2xl"><Copy en="4. Video ad" hi="4. Video ad" /></h2><a className="underline" href="/submission/dukaan-dost-ad.mp4"><Copy en="Watch the 45-second launch film" hi="45-second ka launch film dekho" /></a></li>
      <li className="sticker p-4"><h2 className="text-2xl"><Copy en="5. Pitch deck" hi="5. Pitch deck" /></h2><a className="underline" href="/submission/deck.pdf"><Copy en="Open the eleven-slide PDF" hi="Gyarah-slide PDF kholo" /></a></li>
    </ol>
    <a className="underline" href="/submission/credits.txt"><Copy en="Media credits and AI disclosure" hi="Media credits aur AI ki jaankari" /></a>
    <section className="sticker grid gap-2 p-4"><h2 className="text-2xl"><Copy en="Evidence and limits" hi="Saboot aur seema" /></h2><p><Copy en="Automated tests are engineering evidence. They do not establish real shopkeeper adoption, noisy-speech accuracy, bank settlement or willingness to pay. No guaranteed judging score is claimed." hi="Automated tests engineering ka saboot hain. Inse asli dukaandaar ka use, shor mein awaaz ki accuracy, bank payment ya paise dene ki ichchha sabit nahi hoti. Judging score ki guarantee nahi hai." /></p><a className="underline" href="https://github.com/nova-rishabh/Dukan-dost"><Copy en="Inspect the source repository" hi="Source repository dekho" /></a></section>
  </div>;
}
