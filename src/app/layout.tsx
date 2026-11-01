import { cookies } from "next/headers";
import { LocaleProvider, LocalizedText } from "@/components/LocaleProvider";
import { LOCALE_COOKIE, readLocale } from "@/lib/i18n";
import type { Metadata, Viewport } from "next";
import "@fontsource/yatra-one/latin-400.css";
import "@fontsource/yatra-one/devanagari-400.css";
import "@fontsource/hind/latin-400.css";
import "@fontsource/hind/latin-500.css";
import "@fontsource/hind/latin-600.css";
import "@fontsource/hind/latin-700.css";
import "@fontsource/hind/devanagari-400.css";
import "@fontsource/hind/devanagari-500.css";
import "@fontsource/hind/devanagari-600.css";
import "@fontsource/hind/devanagari-700.css";
import "@fontsource/kalam/latin-400.css";
import "@fontsource/kalam/latin-700.css";
import "@fontsource/kalam/devanagari-400.css";
import "@fontsource/kalam/devanagari-700.css";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  title: { default: "Dukaan Dost: बोलो, लिखो मत।", template: "%s | Dukaan Dost" },
  description: "Udhaar ka khata jo aap bolkar likhwate ho. Bolo, dekho, Likh do. Phir polite WhatsApp yaad dilao.",
  applicationName: "Dukaan Dost",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#FFC400",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = readLocale((await cookies()).get(LOCALE_COOKIE)?.value);
  return (
    <html lang={locale}>
      <body>
        <LocaleProvider initialLocale={locale}>
        <a href="#main" className="skip-link">
          <LocalizedText id="skip" />
        </a>
        <Header />
        <main id="main">{children}</main>
        <Footer />
        </LocaleProvider>
      </body>
    </html>
  );
}
