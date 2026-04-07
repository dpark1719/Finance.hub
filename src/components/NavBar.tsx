"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const links = [
  { href: "/stocks", label: "Stocks" },
  { href: "/lifestyle", label: "Lifestyle" },
  { href: "/fx", label: "FX" },
  { href: "/rates", label: "Rates" },
  { href: "/savings", label: "Savings" },
  { href: "/credit-cards", label: "Cards" },
  { href: "/flows", label: "Flows" },
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
      className="sticky top-0 z-50 border-b border-zinc-800 bg-zinc-950/80 pt-[env(safe-area-inset-top,0px)] backdrop-blur-md"
      aria-label="Main navigation"
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-1 overflow-x-auto">
          <Link
            href="/"
            className="mr-4 shrink-0 text-sm font-semibold tracking-tight text-white"
          >
            P1: finance.hub
          </Link>
          <div className="hidden items-center gap-0.5 sm:flex">
            {links.map((l) => {
              const active = path === l.href;
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className={`rounded-md px-2.5 py-1.5 text-xs font-medium transition ${
                    active
                      ? "bg-zinc-800 text-white"
                      : "text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200"
                  }`}
                >
                  {l.label}
                </Link>
              );
            })}
          </div>
        </div>
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="touch-manipulation rounded-md p-2.5 text-zinc-400 hover:bg-zinc-800 hover:text-white sm:hidden"
          aria-expanded={open}
          aria-label={open ? "Close menu" : "Open menu"}
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            {open ? <path d="M6 18L18 6M6 6l12 12" /> : <path d="M4 6h16M4 12h16M4 18h16" />}
          </svg>
        </button>
      </div>
      {open && (
        <div className="border-t border-zinc-800 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom,0px))] pt-2 sm:hidden">
          {links.map((l) => {
            const active = path === l.href;
            return (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className={`block touch-manipulation rounded-md px-3 py-3 text-base transition ${
                  active
                    ? "bg-zinc-800 font-medium text-white"
                    : "text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200"
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
