import { getServerLocale } from "@/lib/server-locale";
import type { Metadata } from "next";
import QRCode from "qrcode";
import { formatINR } from "@/lib/money";
import { readPayToken } from "@/lib/pay";
import { getContext } from "@/server/context";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Bharo", robots: { index: false, follow: false } };

export default async function PayPage({ params }: { params: Promise<{ token: string }> }) {
  const locale = await getServerLocale();
  const L = (en: string, hi: string) => locale === "en" ? en : hi;
  const { token } = await params;
  const view = await readPayToken(getContext().store, token, new Date());

  if (view.status !== "ok") {
    return (
      <div className="mx-auto grid max-w-md gap-4 px-4 py-10">
        <h1 className="text-[40px] leading-tight">
          {view.status === "expired" ? L("This link has expired", "Yeh link purana ho gaya") : view.status === "settled" ? L("Nothing outstanding", "Abhi kuch baaki nahi hai") : L("This link is invalid", "Yeh link sahi nahi hai")}
        </h1>
        <p className="text-xl">
          {view.status === "expired"
            ? L("Ask the shopkeeper for a new link.", "Dukaandaar se naya link maango.")
            : view.status === "settled"
              ? L("The shop ledger shows no outstanding balance for this customer.", "Dukaandaar ke khate mein is naam par ab koi baaki nahi dikh raha.")
              : L("Check the link or ask the shopkeeper for a new one.", "Link dobara check karo ya dukaandaar se naya link maango.")}
        </p>
      </div>
    );
  }

  const qr = await QRCode.toDataURL(view.upiUri, { margin: 1, width: 280, color: { dark: "#16123A", light: "#FFFFFF" } });

  return (
    <div className="mx-auto grid max-w-md gap-5 px-4 py-6">
      {view.isDemo ? (
        <p className="sticker p-3 font-semibold" style={{ background: "var(--safed)" }} role="note" data-testid="demo-banner">
          {L("Demo: no money is transferred here", "Demo: yahan paise nahi kat te")}
        </p>
      ) : null}
      <h1 className="text-[28px]">{view.shopName}</h1>
      <p className="text-xl">
        {view.customerName}, {L("your outstanding balance", "aapka baaki")}:
      </p>
      <p className="money text-[56px] leading-none" data-testid="pay-amount">
        {formatINR(view.amountPaise)}
      </p>
      <div className="sticker grid justify-items-center p-4">
        <img src={qr} width={280} height={280} alt={`UPI QR, ${formatINR(view.amountPaise)}`} data-testid="pay-qr" />
      </div>
      <a href={view.upiUri} className="btn btn-primary no-underline" data-testid="pay-button">
        {L("Pay with any UPI app", "Kisi bhi UPI app se bharo")}
      </a>
      {view.isDemo ? (
        <p className="text-base">{L("This is a demo: this link does not transfer money. In a real shop, payment goes directly to the shop’s UPI account. The shopkeeper records receipt.", "Yeh demo hai: is link par paise kisi ko nahi jaate. Asli dukaan mein paise seedhe dukaan ke UPI par jaate hain, aur dukaandaar khud “mile” mark karte hain.")}</p>
      ) : (
        <p className="text-base">{L("Your UPI app pays the shop directly. Opening this page does not mean paid; the shopkeeper records receipt.", "Paise aapke UPI app se seedhe dukaan ko jaate hain. Is page par bharne ka matlab “paid” nahi hai; dukaandaar khud mark karte hain.")}</p>
      )}
    </div>
  );
}
