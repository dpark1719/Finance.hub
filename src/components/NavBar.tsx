"use client";

import { AuthMenu } from "@/components/AuthMenu";
import { ThemeToggle } from "@/components/ThemeToggle";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const links: { href: string; label: string; navAriaLabel?: string }[] = [
  { href: "/stocks", label: "Stocks" },
  { href: "/lifestyle", label: "Lifestyle" },
  { href: "/fx", label: "FX" },
  { href: "/rates", label: "Rates" },
  { href: "/savings", label: "Savings" },
  { href: "/credit-cards", label: "Cards" },
  { href: "/flows", label: "Flows" },
  {
    href: "/polymarket",
    label: "Probabilities",
    navAriaLabel: "Real-time probabilities — Polymarket top markets",
  },
  { href: "/calculators", label: "Calculators" },
];

export function NavBar() {
  const path = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [path]);

  return (
    <nav
      className="sticky top-0 z-50 border-b border-slate-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-950/80 pt-[env(safe-area-inset-top,0px)] backdrop-blur-md"
      aria-label="Main navigation"
    >
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-3 gap-y-2 px-4 py-3 sm:px-6">
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-1.5">
          <Link
            href="/"
            className="shrink-0 text-sm font-semibold tracking-tight text-slate-900 dark:text-white"
          >
            finance.hub
          </Link>
          <div className="hidden min-w-0 flex-wrap items-center gap-x-1 gap-y-1 sm:flex">
            {links.map((l) => {
              const active = path === l.href;
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  aria-label={l.navAriaLabel}
                  title={l.navAriaLabel}
                  className={`whitespace-nowrap rounded-md px-2.5 py-1.5 text-xs font-medium transition ${
                    active
                      ? "bg-slate-200 dark:bg-zinc-800 text-slate-900 dark:text-white"
                      : "text-slate-600 dark:text-zinc-400 hover:bg-slate-200/80 dark:hover:bg-zinc-800/50 hover:text-slate-800 dark:hover:text-zinc-200"
                  }`}
                >
                  {l.label}
                </Link>
              );
            })}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <ThemeToggle />
          <AuthMenu />
          <button
            type="button"
            onClick={() => setOpen(!open)}
            className="touch-manipulation rounded-md p-2.5 text-slate-600 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-zinc-800 hover:text-slate-900 dark:hover:text-white sm:hidden"
            aria-expanded={open}
            aria-label={open ? "Close menu" : "Open menu"}
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              {open ? <path d="M6 18L18 6M6 6l12 12" /> : <path d="M4 6h16M4 12h16M4 18h16" />}
            </svg>
          </button>
        </div>
      </div>
      {open && (
        <div className="border-t border-slate-200 dark:border-zinc-800 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom,0px))] pt-2 sm:hidden">
          {links.map((l) => {
            const active = path === l.href;
            return (
              <Link
                key={l.href}
                href={l.href}
                aria-label={l.navAriaLabel}
                onClick={() => setOpen(false)}
                className={`block touch-manipulation rounded-md px-3 py-3 text-base transition ${
                  active
                    ? "bg-slate-200 dark:bg-zinc-800 font-medium text-slate-900 dark:text-white"
                    : "text-slate-600 dark:text-zinc-400 hover:bg-slate-200/80 dark:hover:bg-zinc-800/50 hover:text-slate-800 dark:hover:text-zinc-200"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
        </div>
      )}
    </nav>
  );
}
