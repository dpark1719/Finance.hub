"use client";

import type { PolymarketTopMarket } from "@/lib/polymarket-top";
import { useEffect, useState } from "react";

const usd0 = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const usd2 = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function formatUsd(n: number): string {
  if (!Number.isFinite(n) || n <= 0) return "—";
  return n >= 1_000_000 ? usd0.format(n) : usd2.format(n);
}

function formatPct(p: number): string {
  if (!Number.isFinite(p)) return "—";
  return `${(p * 100).toFixed(1)}%`;
}

function OutcomesLine({ outcomes }: { outcomes: PolymarketTopMarket["outcomes"] }) {
  if (outcomes.length === 0) {
    return <span className="text-slate-500 dark:text-zinc-500">—</span>;
  }
  const show = outcomes.slice(0, 6);
  const more = outcomes.length - show.length;
  return (
    <ul className="flex flex-col gap-1 text-sm text-slate-800 dark:text-zinc-200">
      {show.map((o, i) => (
        <li key={`${o.name}-${i}`} className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
          <span className="font-medium text-slate-700 dark:text-zinc-300">{o.name}</span>
          <span className="font-mono tabular-nums text-slate-900 dark:text-zinc-100">{formatPct(o.probability)}</span>
        </li>
      ))}
      {more > 0 ? (
        <li className="text-xs text-slate-500 dark:text-zinc-500">+{more} more outcomes</li>
      ) : null}
    </ul>
  );
}

export default function PolymarketPage() {
  const [markets, setMarkets] = useState<PolymarketTopMarket[]>([]);
  const [fetchedAt, setFetchedAt] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/polymarket-top");
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          if (!cancelled) {
            setErr(typeof data.error === "string" ? data.error : "Could not load Polymarket data");
            setMarkets([]);
          }
          return;
        }
        if (!cancelled) {
          setErr(null);
          setMarkets(Array.isArray(data.markets) ? data.markets : []);
          setFetchedAt(typeof data.fetchedAt === "string" ? data.fetchedAt : null);
        }
      } catch {
        if (!cancelled) {
          setErr("Network error");
          setMarkets([]);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="mx-auto min-h-screen min-w-0 max-w-5xl px-4 py-10 sm:px-6">
      <header className="mb-10 border-b border-slate-200 dark:border-zinc-800 pb-8">
        <p className="font-mono text-xs uppercase tracking-widest text-slate-500 dark:text-zinc-500">
          finance.hub · Polymarket
        </p>
        <h1
          className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 dark:text-white sm:text-4xl"
          style={{ fontFamily: "var(--font-dm-sans), system-ui" }}
        >
          Top volume markets
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-600 dark:text-zinc-400">
          The ten most active Polymarket markets by <strong className="font-medium text-slate-800 dark:text-zinc-300">24h volume</strong>
          (USDC). Prices are implied probabilities from the order book. Data comes from Polymarket&apos;s public Gamma API;
          it may lag or omit markets. Prediction markets carry risk and may be restricted where you live — not investment or
          gambling advice.
        </p>
        {fetchedAt && (
          <p className="mt-3 font-mono text-xs text-slate-500 dark:text-zinc-600">
            Fetched {new Date(fetchedAt).toLocaleString()}
          </p>
        )}
      </header>

      {err && (
        <div
          className="mb-6 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-800 dark:text-red-200"
          role="alert"
        >
          {err}
        </div>
      )}

      {markets.length === 0 && !err && (
        <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/90 dark:bg-zinc-950/40 px-4 py-12 text-center text-sm text-slate-500 dark:text-zinc-500">
          Loading Polymarket markets…
        </div>
      )}

      {markets.length > 0 && (
        <div className="space-y-4">
          {/* Mobile: cards */}
          <div className="flex flex-col gap-4 sm:hidden">
            {markets.map((m, idx) => (
              <article
                key={m.id}
                className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-[var(--card)] p-4 shadow-sm"
              >
                <p className="font-mono text-xs text-slate-500 dark:text-zinc-500">#{idx + 1}</p>
                <h2 className="mt-1 text-base font-semibold leading-snug text-slate-900 dark:text-white">
                  <a
                    href={m.polymarketUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline dark:text-blue-400"
                  >
                    {m.question}
                  </a>
                </h2>
                <dl className="mt-3 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <dt className="text-slate-500 dark:text-zinc-500">24h volume</dt>
                    <dd className="font-mono font-medium text-slate-900 dark:text-zinc-100">{formatUsd(m.volume24hr)}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-500 dark:text-zinc-500">All-time volume</dt>
                    <dd className="font-mono font-medium text-slate-900 dark:text-zinc-100">{formatUsd(m.volumeTotal)}</dd>
                  </div>
                  <div className="col-span-2">
                    <dt className="text-slate-500 dark:text-zinc-500">Liquidity</dt>
                    <dd className="font-mono font-medium text-slate-900 dark:text-zinc-100">{formatUsd(m.liquidity)}</dd>
                  </div>
                </dl>
                <div className="mt-3 border-t border-slate-200 pt-3 dark:border-zinc-800">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-zinc-500">Odds (implied)</p>
                  <div className="mt-2">
                    <OutcomesLine outcomes={m.outcomes} />
                  </div>
                </div>
              </article>
            ))}
          </div>

          {/* Desktop: table */}
          <div className="hidden overflow-x-auto rounded-xl border border-slate-200 dark:border-zinc-800 sm:block">
            <table className="w-full min-w-[640px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 dark:border-zinc-800 dark:bg-zinc-900/50">
                  <th className="px-4 py-3 font-semibold text-slate-700 dark:text-zinc-300">#</th>
                  <th className="px-4 py-3 font-semibold text-slate-700 dark:text-zinc-300">Market</th>
                  <th className="px-4 py-3 font-semibold text-slate-700 dark:text-zinc-300">Odds (implied %)</th>
                  <th className="px-4 py-3 text-right font-semibold text-slate-700 dark:text-zinc-300">24h volume</th>
                  <th className="px-4 py-3 text-right font-semibold text-slate-700 dark:text-zinc-300">All-time volume</th>
                  <th className="px-4 py-3 text-right font-semibold text-slate-700 dark:text-zinc-300">Liquidity</th>
                </tr>
              </thead>
              <tbody>
                {markets.map((m, idx) => (
                  <tr
                    key={m.id}
                    className="border-b border-slate-100 dark:border-zinc-800/80 last:border-0 hover:bg-slate-50/80 dark:hover:bg-zinc-900/30"
                  >
                    <td className="px-4 py-3 font-mono text-slate-500 dark:text-zinc-500">{idx + 1}</td>
                    <td className="max-w-xs px-4 py-3">
                      <a
                        href={m.polymarketUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-blue-600 hover:underline dark:text-blue-400"
                      >
                        {m.question}
                      </a>
                    </td>
                    <td className="min-w-[180px] px-4 py-3 align-top">
                      <OutcomesLine outcomes={m.outcomes} />
                    </td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums text-slate-900 dark:text-zinc-100">
                      {formatUsd(m.volume24hr)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums text-slate-900 dark:text-zinc-100">
                      {formatUsd(m.volumeTotal)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums text-slate-900 dark:text-zinc-100">
                      {formatUsd(m.liquidity)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <footer className="mt-12 border-t border-slate-200 dark:border-zinc-800 pt-8 text-xs text-slate-600 dark:text-zinc-600">
        <p>
          Polymarket is a third-party platform. Volume and prices are as reported by Polymarket Gamma; finance.hub does not
          operate markets or custody funds.
        </p>
      </footer>
    </main>
  );
}
