import type { Metadata, Viewport } from "next";
import { Geist_Mono, Anybody, Mulish } from "next/font/google";
import "./globals.css";
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
    default: "Nox Dashboard | Live protocol activity",
    template: "%s · Nox Dashboard",
  },
  description: "Nox Dashboard | Live protocol activity",
  openGraph: {
    title: "Nox Dashboard | Live protocol activity",
    description: "Nox Dashboard | Live protocol activity",
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
      suppressHydrationWarning
      className={`${mulish.variable} ${geistMono.variable} ${anybody.variable}`}
    >
      {/* Browser extensions (e.g. Bitdefender) inject attributes on <body>
          before React hydrates; suppressHydrationWarning silences the resulting
          mismatch, which is external and cannot be patched anyway. */}
      <body className="antialiased min-h-screen" suppressHydrationWarning>
        <a href="#content" className="skip-link">
          Skip to content
        </a>
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
