import type { Metadata, Viewport } from "next";
import { ThemeInitScript } from "@/components/ThemeInitScript";
import { NavBar } from "@/components/NavBar";
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
  title: {
    default: "P1: finance.hub",
    template: "%s · P1: finance.hub",
  },
  description:
    "P1: finance.hub — stocks, lifestyle calculator, FX, rates, savings, cards, flows, and calculators.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8fafc" },
    { media: "(prefers-color-scheme: dark)", color: "#0c0f14" },
  ],
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full" suppressHydrationWarning>
      <head>
        <ThemeInitScript />
      </head>
      <body
        className={`${dmSans.variable} ${plexMono.variable} min-h-full min-w-0 font-sans antialiased`}
        style={{ fontFamily: "var(--font-dm-sans), system-ui, sans-serif" }}
      >
        <div className="flex min-h-full min-w-0 flex-col">
          <NavBar />
          <div className="min-w-0 flex-1">{children}</div>
        </div>
      </body>
    </html>
  );
}
