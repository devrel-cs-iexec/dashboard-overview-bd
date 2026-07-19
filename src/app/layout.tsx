import type { Metadata, Viewport } from "next";
import { Geist_Mono, Anybody, Mulish } from "next/font/google";
import "./globals.css";
import { TopNav } from "@/components/TopNav";
import { Sidebar } from "@/components/Sidebar";
import { MobileNav } from "@/components/MobileNav";
import { LiveRefresh } from "@/components/LiveRefresh";
import { getPrices } from "@/lib/price";

const mulish = Mulish({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

const anybody = Anybody({
  variable: "--font-display",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Nox·Stats — live protocol activity",
    template: "%s · Nox·Stats",
  },
  description:
    "Live on-chain view of the Nox protocol — total value shielded, confidential transfers, compute operations and access control across ARB and ETH Sepolia.",
  openGraph: {
    title: "Nox·Stats — live protocol activity",
    description:
      "Real-time view of the Nox protocol — shielding, confidential transfers, decryption and every module in one place.",
  },
};

export const viewport: Viewport = {
  themeColor: "#1d1d24",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Fetched once for the whole shell rather than in each of the twelve pages.
  const prices = await getPrices().catch(() => null);

  return (
    <html
      lang="en"
      className={`${mulish.variable} ${geistMono.variable} ${anybody.variable}`}
    >
      <body className="antialiased min-h-screen">
        <a href="#content" className="skip-link">
          Skip to content
        </a>
        <TopNav />
        <LiveRefresh />
        <MobileNav />
        <div className="flex">
          <Sidebar rlcPrice={prices?.rlc} />
          <div className="flex min-w-0 flex-1 flex-col">{children}</div>
        </div>
      </body>
    </html>
  );
}
