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
  title: "Nox Protocol · confidential DeFi infrastructure",
  description:
    "Real-time analytics for the Nox Protocol — encrypted balances, TEE-attested computation, value secured.",
  openGraph: {
    title: "Nox Protocol — Confidential DeFi, in clear view",
    description:
      "Total value secured, encrypted operations, and live activity on the Nox Protocol.",
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
