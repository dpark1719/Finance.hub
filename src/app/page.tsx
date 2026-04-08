"use client";

import Link from "next/link";
import type { ReactNode } from "react";

type Section = {
  href: string;
  title: string;
  description: string;
  icon: ReactNode;
};

function IconWrap({ children }: { children: ReactNode }) {
  return (
    <div className="mb-4 flex h-10 items-center text-[var(--accent)]">
      {children}
    </div>
  );
}

const icons = {
  chart: (
    <svg
      className="h-8 w-8"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M3 3v18h18" />
      <path d="M7 16l4-4 4 4 6-7" />
    </svg>
  ),
  building: (
    <svg
      className="h-8 w-8"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18" />
      <path d="M6 12h4" />
      <path d="M14 9h4" />
      <path d="M14 13h4" />
      <path d="M14 17h4" />
      <path d="M10 22v-4a2 2 0 0 1 2-2h0a2 2 0 0 1 2 2v4" />
    </svg>
  ),
  exchange: (
    <svg
      className="h-8 w-8"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M7 16V4m0 0L4 7m3-3 3 3" />
      <path d="M17 8v12m0 0 3-3m-3 3-3-3" />
    </svg>
  ),
  percent: (
    <svg
      className="h-8 w-8"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="7.5" cy="7.5" r="1.5" />
      <circle cx="16.5" cy="16.5" r="1.5" />
      <path d="M21 3 3 21" />
    </svg>
  ),
  piggy: (
    <span className="text-3xl leading-none" role="img" aria-hidden>
      🐷
    </span>
  ),
  card: (
    <svg
      className="h-8 w-8"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <path d="M2 10h20" />
    </svg>
  ),
  trending: (
    <svg
      className="h-8 w-8"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M22 7l-8.5 8.5-5-5L2 17" />
      <path d="M16 7h6v6" />
    </svg>
  ),
  probability: (
    <svg
      className="h-8 w-8"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 2v20" />
      <path d="M2 12h20" />
    </svg>
  ),
  calculator: (
    <svg
      className="h-8 w-8"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="4" y="2" width="16" height="20" rx="2" />
      <path d="M8 6h8" />
      <path d="M8 10h.01M12 10h.01M16 10h.01M8 14h.01M12 14h.01M16 14h.01M8 18h6" />
    </svg>
  ),
};

const sections: Section[] = [
  {
    href: "/stocks",
    title: "Stocks",
    description: "Stock report cards with 10 graded metrics",
    icon: icons.chart,
  },
  {
    href: "/lifestyle",
    title: "Lifestyle Calculator",
    description: "See what you can afford in 30+ US cities",
    icon: icons.building,
  },
  {
    href: "/fx",
    title: "Currency Exchange",
    description: "Live FX rates and converter for USD/JPY, USD/KRW, KRW/JPY",
    icon: icons.exchange,
  },
  {
    href: "/rates",
    title: "Interest Rates",
    description: "US Fed, BOJ, and BOK policy rates with history",
    icon: icons.percent,
  },
  {
    href: "/savings",
    title: "Savings Accounts",
    description: "Best high-yield savings accounts ranked by APY",
    icon: icons.piggy,
  },
  {
    href: "/credit-cards",
    title: "Credit Cards",
    description: "Compare sign-up bonuses and find the best card",
    icon: icons.card,
  },
  {
    href: "/flows",
    title: "Capital Flows",
    description: "Track money flowing into gold, oil, crypto, and more",
    icon: icons.trending,
  },
  {
    href: "/polymarket",
    title: "Real-time probabilities",
    description: "Top Polymarket markets by volume with live Yes/No implied odds",
    icon: icons.probability,
  },
  {
    href: "/calculators",
    title: "Calculators",
    description: "Compound interest, mortgage, FIRE, and debt payoff",
    icon: icons.calculator,
  },
];

export default function Home() {
  return (
    <main className="mx-auto min-h-screen min-w-0 max-w-6xl px-4 py-12 sm:px-6">
      <header className="mb-12 text-center sm:mb-14 sm:text-left">
        <h1
          className="text-4xl font-semibold tracking-tight text-slate-900 dark:text-white sm:text-5xl"
          style={{ fontFamily: "var(--font-dm-sans), system-ui" }}
        >
          finance.hub
        </h1>
        <p className="mt-3 text-lg text-[var(--muted)]">
          Your personal finance command center
        </p>
      </header>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {sections.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            className="group block rounded-xl border border-slate-200 dark:border-zinc-800 bg-[var(--card)] p-6 shadow-sm transition hover:border-slate-300 dark:border-zinc-600 sm:hover:scale-[1.02]"
          >
            <IconWrap>{s.icon}</IconWrap>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{s.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-zinc-400">
              {s.description}
            </p>
          </Link>
        ))}
      </div>

      <footer className="mt-16 border-t border-slate-200 dark:border-zinc-800 pt-8 text-center text-xs text-slate-500 dark:text-zinc-500 sm:text-left">
        <p>
          finance.hub — tools for planning and learning. Not financial advice.
        </p>
      </footer>
    </main>
  );
}
