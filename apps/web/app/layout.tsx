import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "KIET Smart Care | Campus Healthcare System",
  description: "Next-generation campus healthcare system for KIET Group of Institutions, Korangi, India",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
