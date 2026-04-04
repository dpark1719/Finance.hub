import type { Metadata } from "next";
import { DM_Sans, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
});

const plexMono = IBM_Plex_Mono({
  weight: ["400", "500"],
  subsets: ["latin"],
  variable: "--font-plex-mono",
});

export const metadata: Metadata = {
  title: "Stock Report Card",
  description:
    "Valuation, fundamentals, and sentiment metrics in one report card view.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${dmSans.variable} ${plexMono.variable} min-h-screen font-sans antialiased`}
        style={{ fontFamily: "var(--font-dm-sans), system-ui, sans-serif" }}
      >
        {children}
      </body>
    </html>
  );
}
