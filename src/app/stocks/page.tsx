"use client";

import type { LetterGrade, StockReport } from "@/types/report";
import { WatchlistsPanel } from "@/components/WatchlistsPanel";
import dynamic from "next/dynamic";
import { useCallback, useMemo, useState } from "react";

const StockPriceChart = dynamic(
  () =>
    import("@/components/StockPriceChart").then((m) => m.StockPriceChart),
  {
    ssr: false,
    loading: () => (
      <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-[var(--card)] p-8 text-center text-sm text-slate-500 dark:text-zinc-500">
        Loading chart…
      </div>
    ),
  },
);

const Sp500Heatmap = dynamic(
  () => import("@/components/Sp500Heatmap").then((m) => m.Sp500Heatmap),
  {
    ssr: false,
    loading: () => (
      <div className="mt-10 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-100/90 dark:bg-zinc-950/40 p-12 text-center text-sm text-slate-500 dark:text-zinc-500">
        Loading S&amp;P 500 heatmap…
      </div>
    ),
  },
);

const gradeStyles: Record<LetterGrade, string> = {
  A: "bg-emerald-500/15 text-emerald-900 border-emerald-500/40 dark:bg-emerald-500/20 dark:text-emerald-300",
  B: "bg-lime-500/15 text-lime-900 border-lime-500/40 dark:bg-lime-500/20 dark:text-lime-200",
  C: "bg-amber-500/15 text-amber-900 border-amber-500/40 dark:bg-amber-500/20 dark:text-amber-200",
  D: "bg-orange-500/15 text-orange-900 border-orange-500/40 dark:bg-orange-500/20 dark:text-orange-200",
  F: "bg-red-500/15 text-red-900 border-red-500/40 dark:bg-red-500/20 dark:text-red-300",
  "—": "bg-slate-200 text-slate-600 border-slate-300 dark:bg-zinc-500/15 dark:text-zinc-400 dark:border-zinc-600/50",
};

export default function Home() {
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<StockReport | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [watchAddRequest, setWatchAddRequest] = useState(0);

  const run = useCallback(async (symbolOverride?: string) => {
    const symbol = (symbolOverride ?? q).trim();
    if (!symbol) return;
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch(`/api/report?symbol=${encodeURIComponent(symbol)}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setReport(null);
        setErr(typeof data.error === "string" ? data.error : "Request failed");
        return;
      }
      setReport(data as StockReport);
    } catch {
      setReport(null);
      setErr("Network error");
    } finally {
      setLoading(false);
    }
  }, [q]);

  const onHeatmapSymbol = useCallback(
    (sym: string) => {
      setQ(sym);
      void run(sym);
    },
    [run],
  );

  /** Symbol to add via Watchlist +: search box if non-empty, else last resolved report ticker. */
  const watchTicker = useMemo(() => {
    const qq = q.trim();
    if (qq) return qq;
    if (report?.symbol?.trim()) return report.symbol.trim();
    return "";
  }, [q, report?.symbol]);

  return (
    <main className="mx-auto min-h-screen min-w-0 max-w-5xl px-4 py-10 sm:px-6">
      <header className="mb-10 border-b border-slate-200 dark:border-zinc-800 pb-8">
        <p className="font-mono text-xs uppercase tracking-widest text-slate-500 dark:text-zinc-500">
          finance.hub · Stocks
        </p>
        <h1
          className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 dark:text-white sm:text-4xl"
          style={{ fontFamily: "var(--font-dm-sans), system-ui" }}
        >
          Ten metrics, one page
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-600 dark:text-zinc-400">
          P/E, consensus upside, PEG, leverage, free cash flow, ROE, RSI, beta,
          CNN Fear &amp; Greed, and dividend payout — graded for quick context.
          Type a ticker (<span className="font-mono">AAPL</span>,{" "}
          <span className="font-mono">brk.b</span>) or an{" "}
          <span className="text-slate-700 dark:text-zinc-300">S&amp;P 500</span> or{" "}
          <span className="text-slate-700 dark:text-zinc-300">KOSPI</span> names
          (<span className="font-mono">apple</span>,{" "}
          <span className="font-mono">samsung electronics</span>,{" "}
          <span className="font-mono">삼성전자</span>,{" "}
          <span className="font-mono">005930.KS</span>). Other names use
          Finnhub search, with Yahoo fallbacks when the free tier blocks an exchange.
          Not investment advice; data depends on coverage and delays.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && void run()}
            placeholder="Company or ticker (apple, Google, AAPL, 7203.T)"
            className="min-w-0 flex-1 rounded-lg border border-slate-300 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900/80 px-4 py-3 font-mono text-base text-slate-900 dark:text-white outline-none ring-blue-500/30 placeholder:text-slate-600 dark:text-zinc-600 focus:border-blue-500/50 focus:ring-2 sm:max-w-md sm:text-sm"
          />
          <button
            type="button"
            onClick={() => void run()}
            disabled={loading || !q.trim()}
            className="touch-manipulation shrink-0 rounded-lg bg-blue-600 px-5 py-3 text-base font-medium text-slate-900 dark:text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm"
          >
            {loading ? "Loading…" : "Run report"}
          </button>
          <button
            type="button"
            onClick={() => setWatchAddRequest((n) => n + 1)}
            disabled={!watchTicker}
            title="Adds the current ticker (search box, or last report below) to your active watchlist when signed in"
            className="touch-manipulation shrink-0 rounded-lg border border-slate-300 dark:border-zinc-600 bg-slate-100 dark:bg-zinc-800 px-4 py-3 text-sm font-medium text-slate-800 dark:text-zinc-200 hover:bg-slate-200 dark:hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Watchlist +
          </button>
        </div>
      </header>

      <WatchlistsPanel addRequest={watchAddRequest} tickerToAdd={watchTicker} />

      <Sp500Heatmap onSelectSymbol={onHeatmapSymbol} />

      {err && (
        <div
          className="mb-6 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200"
          role="alert"
        >
          {err}
        </div>
      )}

      {report && report.symbol && (
        <div className="space-y-6">
          <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/95 dark:bg-zinc-900/40 p-4 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
              <div className="min-w-0">
                <h2 className="break-words text-xl font-semibold text-slate-900 dark:text-white sm:text-2xl">
                  {report.name ?? report.symbol}
                </h2>
                <p className="mt-1 break-all font-mono text-xs text-slate-600 dark:text-zinc-400 sm:text-sm">
                  {report.symbol}
                  {report.exchange ? ` · ${report.exchange}` : ""}
                  {report.currency ? ` · ${report.currency}` : ""}
                </p>
                {report.resolutionNote && (
                  <p className="mt-2 break-words text-sm text-blue-300/90">{report.resolutionNote}</p>
                )}
              </div>
              <div className="shrink-0 text-left sm:text-right">
                {report.lastPrice != null && (
                  <p className="text-xl font-semibold tabular-nums text-slate-900 dark:text-white sm:text-2xl">
                    {report.lastPrice.toLocaleString(undefined, {
                      style: "currency",
                      currency: report.currency || "USD",
                    })}
                  </p>
                )}
                <p className="font-mono text-xs text-slate-500 dark:text-zinc-500">
                  as of {new Date(report.asOf).toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <StockPriceChart symbol={report.symbol} />

          {report.warnings.length > 0 && (
            <ul className="list-outside space-y-1.5 rounded-lg border border-amber-500/25 bg-amber-500/5 py-3 pl-6 pr-4 text-sm text-amber-100/90 sm:list-inside sm:space-y-0 sm:px-4 sm:pl-4">
              {report.warnings.map((w) => (
                <li key={w}>{w}</li>
              ))}
            </ul>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            {report.metrics.map((m) => (
              <article
                key={m.id}
                className="flex flex-col rounded-xl border border-slate-200 dark:border-zinc-800 bg-[var(--card)] p-5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-base font-semibold text-slate-900 dark:text-white">{m.title}</h3>
                    <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-zinc-500">
                      {m.subtitle}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-md border px-2.5 py-1 font-mono text-sm font-medium ${gradeStyles[m.grade]}`}
                  >
                    {m.grade}
                  </span>
                </div>
                <p
                  className="mt-4 font-mono text-2xl font-medium tabular-nums text-slate-800 dark:text-zinc-100"
                  style={{ fontFamily: "var(--font-plex-mono), ui-monospace" }}
                >
                  {m.value}
                </p>
                <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-zinc-400">{m.detail}</p>
              </article>
            ))}
          </div>
        </div>
      )}

      <footer className="mt-16 border-t border-slate-200 dark:border-zinc-800 pt-8 text-xs text-slate-600 dark:text-zinc-600">
        <p>
          Grades are heuristic summaries for education — not a recommendation.
          Verify figures in filings. Fear &amp; Greed from CNN when reachable;
          Finnhub and Yahoo Finance (chart + some 403 fallbacks) power prices and
          fundamentals.
        </p>
      </footer>
    </main>
  );
}
