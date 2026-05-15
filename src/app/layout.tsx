import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Space_Grotesk } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

const displayFont = Space_Grotesk({
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
  themeColor: "#050505",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${displayFont.variable}`}
    >
      <body className="antialiased min-h-screen">{children}</body>
    </html>
  );
}
