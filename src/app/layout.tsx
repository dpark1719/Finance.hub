import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import { AiAssistLauncher } from "@/components/AiAssistLauncher";
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
    default: "finance.hub",
    template: "%s · finance.hub",
  },
  description:
    "finance.hub — stocks, lifestyle calculator, FX, rates, savings, cards, flows, and calculators.",
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
    <html lang="en" className="h-full min-w-0" suppressHydrationWarning>
      <head>
        <ThemeInitScript />
      </head>
      <body
        className={`${dmSans.variable} ${plexMono.variable} min-h-full min-w-0 font-sans antialiased`}
        style={{ fontFamily: "var(--font-dm-sans), system-ui, sans-serif" }}
      >
        {/* AiAssistLauncher is a body sibling (not a flex item) so WebKit does not reserve space for the fixed FAB. */}
        <div className="flex min-h-full min-w-0 flex-col">
          <NavBar />
          <div className="min-w-0 flex-1">{children}</div>
        </div>
        <AiAssistLauncher />
        <Analytics />
      </body>
    </html>
  );
}
