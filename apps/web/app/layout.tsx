import type { Metadata } from "next";
import { Geist, Geist_Mono, Source_Serif_4, Inter, Caveat } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const sourceSerif = Source_Serif_4({
  variable: "--font-serif",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const caveat = Caveat({
  variable: "--font-cursive",
  subsets: ["latin"],
  weight: ["600", "700"],
});

export const metadata: Metadata = {
  title: "KIET Smart Care",
  description: "Campus healthcare monitoring system for KIET Group of Institutions, Ghaziabad",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} ${sourceSerif.variable} ${inter.variable} ${caveat.variable}`}>
      <body className="min-h-screen bg-[var(--bg)] font-sans text-[var(--text)] antialiased">
        {children}
      </body>
    </html>
  );
}
