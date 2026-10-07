import { Fraunces, Inter } from "next/font/google";
import { WalletProvider } from "@/components/WalletProvider";
import { Nav } from "@/components/Nav";
import "./globals.css";

const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-fraunces" });
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata = {
  title: "Pela · Pet identity on-chain",
  description: "Register your pets on the blockchain and keep a tamper-proof care log with your vet and trainer.",
  icons: { icon: "/images/logo.svg" },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${fraunces.variable} ${inter.variable}`}>
      <body className="min-h-screen overflow-x-clip font-sans antialiased">
        <WalletProvider>
          <Nav />
          <div className="mx-auto max-w-6xl px-5 pb-24 pt-8">{children}</div>
        </WalletProvider>
      </body>
    </html>
  );
}
