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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="hi-Latn">
      <body>
        <a href="#main" className="skip-link">
          Seedha kaam par jao
        </a>
        <Header />
        <main id="main">{children}</main>
      </body>
    </html>
  );
}
