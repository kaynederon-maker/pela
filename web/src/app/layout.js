import { Bricolage_Grotesque, Instrument_Serif, JetBrains_Mono } from "next/font/google";
import { WalletProvider } from "@/components/WalletProvider";
import { Nav } from "@/components/Nav";
import { SiteFooter } from "@/components/site-footer";
import { SmoothScroll } from "@/components/motion";
import "./globals.css";

const bricolage = Bricolage_Grotesque({ subsets: ["latin"], variable: "--font-bricolage", axes: ["opsz", "wdth"] });
const instrument = Instrument_Serif({ subsets: ["latin"], weight: "400", style: ["normal", "italic"], variable: "--font-instrument" });
const jetbrains = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains" });

export const metadata = {
  title: "Pela · A passport for every good dog",
  description: "Register your pets on the blockchain and keep a care record your vet and trainer can stamp, and nobody can quietly edit.",
  icons: { icon: "/images/logo.svg" },
};

export const viewport = { themeColor: "#f4eee3" };

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${bricolage.variable} ${instrument.variable} ${jetbrains.variable}`}>
      <body className="min-h-screen font-sans text-[16px] antialiased">
        <a
          href="#main"
          className="fixed top-3 left-3 z-[200] -translate-y-20 rounded-full bg-foreground px-4 py-2 text-sm font-semibold text-background transition-transform focus:translate-y-0"
        >
          Skip to content
        </a>
        <WalletProvider>
          <SmoothScroll>
            <Nav />
            <div id="main" className="mx-auto w-full max-w-[1200px] px-5 pt-28 pb-24 sm:px-8">
              {children}
            </div>
            <SiteFooter />
          </SmoothScroll>
        </WalletProvider>
      </body>
    </html>
  );
}
