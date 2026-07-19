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
