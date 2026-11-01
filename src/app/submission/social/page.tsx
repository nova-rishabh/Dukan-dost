import Link from "next/link";
import { Copy } from "@/components/LocaleProvider";

export default function SocialSubmissionPage() {
  const posts = [["post-1-ne-ya-ko", "Ne ya ko", "Direction in words"], ["post-2-bahi-vs-bolo", "Bahi vs bolo", "A spoken entry and a ledger page"], ["post-3-vasooli-politely", "Vasooli, politely", "A reviewed reminder and honest payment link"]];
  return <div className="mx-auto grid max-w-5xl gap-5 px-4 py-6 md:px-8">
    <Link className="underline" href="/submission"><Copy en="Back to submission" hi="Submission par wapas" /></Link>
    <h1 className="text-4xl"><Copy en="Three social posts" hi="Teen social posts" /></h1>
    <p><Copy en="Fictional demo examples. Download the original 1080×1350 images and bilingual captions." hi="Kalpanik demo ki misaal. Asli 1080×1350 images aur Hindi-English captions nikalo." /></p>
    <a className="btn w-fit" href="/submission/social/captions.md" download><Copy en="Download captions" hi="Captions nikalo" /></a>
    <div className="grid gap-5 md:grid-cols-3">{posts.map(([file, title, description]) => <article className="sticker grid content-start gap-3 p-3" key={file}><h2 className="text-2xl">{title}</h2><img src={`/submission/social/${file}.png`} width={1080} height={1350} className="h-auto w-full" alt={`${title}: ${description}. Fictional product demonstration.`} /><a className="underline" href={`/submission/social/${file}.png`} download><Copy en="Download PNG" hi="PNG nikalo" /></a></article>)}</div>
    <a className="underline" href="/submission/credits.txt"><Copy en="Credits and AI disclosure" hi="Credits aur AI ki jaankari" /></a>
  </div>;
}
