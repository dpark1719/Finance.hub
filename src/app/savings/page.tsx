"use client";

import { useEffect, useMemo, useState } from "react";

type Account = {
  id: string;
  bank: string;
  apy: number;
  minDeposit: string;
  monthlyFee: string;
  fdic: boolean;
  notes: string;
};

type SortKey = "bank" | "apy" | "minDeposit" | "monthlyFee" | "fdic" | "notes";

function apyColor(apy: number, min: number, max: number): string {
  if (max <= min) return "rgb(34 197 94)";
  const t = (apy - min) / (max - min);
  const r = Math.round(34 + (187 - 34) * (1 - t));
  const g = Math.round(197 + (247 - 197) * t);
  const b = Math.round(94 + (208 - 94) * t);
  return `rgb(${r} ${g} ${b})`;
}

function compare(a: Account, b: Account, key: SortKey, dir: number): number {
  const mul = dir;
  switch (key) {
    case "apy":
      return (a.apy - b.apy) * mul;
    case "bank":
      return a.bank.localeCompare(b.bank) * mul;
    case "minDeposit":
      return a.minDeposit.localeCompare(b.minDeposit, undefined, {
        numeric: true,
      }) * mul;
    case "monthlyFee":
      return a.monthlyFee.localeCompare(b.monthlyFee, undefined, {
        numeric: true,
      }) * mul;
    case "fdic":
      return (Number(a.fdic) - Number(b.fdic)) * mul;
    case "notes":
      return a.notes.localeCompare(b.notes) * mul;
    default:
      return 0;
  }
}

const HEADER: { key: SortKey; label: string; className?: string }[] = [
  { key: "bank", label: "Bank" },
  { key: "apy", label: "APY" },
  { key: "minDeposit", label: "Min deposit" },
  { key: "monthlyFee", label: "Monthly fee" },
  { key: "fdic", label: "FDIC" },
  { key: "notes", label: "Notes", className: "text-left" },
];

export default function SavingsPage() {
  const [rows, setRows] = useState<Account[]>([]);
  const [sortKey, setSortKey] = useState<SortKey>("apy");
  const [sortDir, setSortDir] = useState<1 | -1>(-1);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/savings");
        const data = await res.json().catch(() => []);
        if (!res.ok) {
          setErr("Could not load savings data");
          return;
        }
        if (!cancelled) setRows(Array.isArray(data) ? data : []);
      } catch {
        if (!cancelled) setErr("Network error");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const { minApy, maxApy } = useMemo(() => {
    if (rows.length === 0) return { minApy: 0, maxApy: 0 };
    const apys = rows.map((r) => r.apy);
    return { minApy: Math.min(...apys), maxApy: Math.max(...apys) };
  }, [rows]);

  const sorted = useMemo(() => {
    const copy = [...rows];
    copy.sort((a, b) => compare(a, b, sortKey, sortDir));
    return copy;
  }, [rows, sortKey, sortDir]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === 1 ? -1 : 1));
    } else {
      setSortKey(key);
      setSortDir(key === "apy" ? -1 : 1);
    }
  }

  return (
    <main className="mx-auto min-h-screen min-w-0 max-w-5xl px-4 py-10 sm:px-6">
      <header className="mb-8 border-b border-slate-200 dark:border-zinc-800 pb-8">
        <p className="font-mono text-xs uppercase tracking-widest text-slate-500 dark:text-zinc-500">
          Deposits
        </p>
        <h1
          className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 dark:text-white sm:text-4xl"
          style={{ fontFamily: "var(--font-dm-sans), system-ui" }}
        >
          Best Savings Accounts
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-600 dark:text-zinc-400">
          Compare high-yield savings accounts (HYSA) by APY, fees, and FDIC
          insurance — curated static sample for UI demo; confirm rates and terms
          with each institution before opening an account.
        </p>
      </header>

      <div
        className="mb-6 rounded-lg border border-blue-500/30 bg-blue-500/10 px-4 py-3 text-sm text-slate-800 dark:text-zinc-200"
        role="status"
      >
        <span className="font-medium text-blue-200">Context: </span>
        Current Fed rate:{" "}
        <span className="tabular-nums font-semibold text-slate-900 dark:text-white">4.50%</span>
      </div>

      {err && (
        <p className="mb-6 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {err}
        </p>
      )}

      <div className="mb-3 flex flex-wrap gap-2 sm:hidden">
        {HEADER.map((h) => (
          <button
            key={h.key}
            type="button"
            onClick={() => toggleSort(h.key)}
            className={`rounded-md border border-slate-300 dark:border-zinc-700 bg-white/95 dark:bg-zinc-900/60 px-2.5 py-1.5 text-xs font-medium uppercase tracking-wide text-slate-600 dark:text-zinc-400 hover:border-slate-300 dark:border-zinc-600 hover:text-slate-800 dark:text-zinc-200 ${h.className ?? ""}`}
          >
            {h.label}
            {sortKey === h.key ? (sortDir === 1 ? " ↑" : " ↓") : ""}
          </button>
        ))}
      </div>

      <div className="mb-2 hidden sm:grid sm:grid-cols-[1.2fr_0.9fr_0.85fr_0.75fr_0.5fr_1.4fr] sm:gap-3 sm:px-3">
        {HEADER.map((h) => (
          <button
            key={h.key}
            type="button"
            onClick={() => toggleSort(h.key)}
            className={`text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-zinc-500 hover:text-slate-700 dark:text-zinc-300 ${h.className ?? ""}`}
          >
            {h.label}
            {sortKey === h.key ? (sortDir === 1 ? " ↑" : " ↓") : ""}
          </button>
        ))}
      </div>

      <ul className="space-y-3">
        {sorted.map((row) => (
          <li
            key={row.id}
            className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-[var(--card)] p-4 sm:grid sm:grid-cols-[1.2fr_0.9fr_0.85fr_0.75fr_0.5fr_1.4fr] sm:items-center sm:gap-3"
          >
            <div className="font-medium text-slate-900 dark:text-white sm:pl-0">{row.bank}</div>
            <div
              className="mt-2 text-2xl font-semibold tabular-nums sm:mt-0 sm:text-3xl"
              style={{ color: apyColor(row.apy, minApy, maxApy) }}
            >
              {row.apy.toFixed(2)}%
            </div>
            <div className="mt-1 text-sm text-slate-600 dark:text-zinc-400 sm:mt-0">
              {row.minDeposit}
            </div>
            <div className="mt-1 text-sm text-slate-600 dark:text-zinc-400 sm:mt-0">
              {row.monthlyFee}
            </div>
            <div
              className="mt-2 flex items-center justify-start sm:mt-0"
              aria-label={row.fdic ? "FDIC insured" : "Not FDIC insured"}
            >
              {row.fdic ? (
                <span className="text-lg text-emerald-400" title="FDIC">
                  ✓
                </span>
              ) : (
                <span className="text-lg text-red-400" title="Not FDIC">
                  ✗
                </span>
              )}
            </div>
            <p className="mt-3 border-t border-slate-200 dark:border-zinc-800 pt-3 text-sm leading-snug text-slate-600 dark:text-zinc-400 sm:mt-0 sm:border-0 sm:pt-0">
              {row.notes}
            </p>
          </li>
        ))}
      </ul>
    </main>
  );
}
