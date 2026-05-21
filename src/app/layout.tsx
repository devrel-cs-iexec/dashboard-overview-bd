import type { Metadata, Viewport } from "next";
import { Geist_Mono, Anybody, Mulish } from "next/font/google";
import "./globals.css";

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
  title: "Nox · live protocol activity, then dive into every tool",
  description:
    "Follow live on-chain activity across the Nox protocol in one feed. Open the dashboard for TVS, charts, and every module in the sidebar.",
  openGraph: {
    title: "Nox · live protocol activity",
    description:
      "Real-time view of the Nox protocol — shielding, staking, decryption, and every module in one place.",
  },
};

export const viewport: Viewport = {
  themeColor: "#0d0d12",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${mulish.variable} ${geistMono.variable} ${anybody.variable}`}
    >
      <body className="antialiased min-h-screen">{children}</body>
    </html>
  );
}
