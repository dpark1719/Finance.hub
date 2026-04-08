import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Real-time probabilities",
  description:
    "Top prediction markets by 24-hour volume with live implied Yes/No probabilities (Polymarket Gamma API).",
};

export default function PolymarketLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
