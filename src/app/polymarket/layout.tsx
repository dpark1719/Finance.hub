import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Polymarket",
  description:
    "Top Polymarket markets by 24-hour volume with implied odds and traded notional (Gamma API).",
};

export default function PolymarketLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
