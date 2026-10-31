import type { Metadata } from "next";
import QRCode from "qrcode";
import { formatINR } from "@/lib/money";
import { readPayToken } from "@/lib/pay";
import { getContext } from "@/server/context";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Bharo", robots: { index: false, follow: false } };

export default async function PayPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const view = await readPayToken(getContext().store, token, new Date());

  if (view.status !== "ok") {
    return (
      <div className="mx-auto grid max-w-md gap-4 px-4 py-10">
        <h1 className="text-[40px] leading-tight">
          {view.status === "expired" ? "Yeh link purana ho gaya" : view.status === "settled" ? "Abhi kuch baaki nahi hai" : "Yeh link sahi nahi hai"}
        </h1>
        <p className="text-xl">
          {view.status === "expired"
            ? "Dukaandaar se naya link maango."
            : view.status === "settled"
              ? "Dukaandaar ke khate mein is naam par ab koi baaki nahi dikh raha."
              : "Link dobara check karo ya dukaandaar se naya link maango."}
        </p>
      </div>
    );
  }

  const qr = await QRCode.toDataURL(view.upiUri, { margin: 1, width: 280, color: { dark: "#16123A", light: "#FFFFFF" } });

  return (
    <div className="mx-auto grid max-w-md gap-5 px-4 py-6">
      {view.isDemo ? (
        <p className="sticker p-3 font-semibold" style={{ background: "var(--safed)" }} role="note" data-testid="demo-banner">
          Demo: yahan paise nahi kat te
        </p>
      ) : null}
      <h1 className="text-[28px]">{view.shopName}</h1>
      <p className="text-xl">
        {view.customerName}, aapka baaki:
      </p>
      <p className="money text-[56px] leading-none" data-testid="pay-amount">
        {formatINR(view.amountPaise)}
      </p>
      <div className="sticker grid justify-items-center p-4">
        <img src={qr} width={280} height={280} alt={`UPI QR, ${formatINR(view.amountPaise)}`} data-testid="pay-qr" />
      </div>
      <a href={view.upiUri} className="btn btn-primary no-underline" data-testid="pay-button">
        Kisi bhi UPI app se bharo
      </a>
      <p className="text-base">Paise aapke UPI app se seedhe dukaan ko jaate hain. Is page par bharne ka matlab “paid” nahi hai; dukaandaar khud mark karte hain.</p>
    </div>
  );
}
