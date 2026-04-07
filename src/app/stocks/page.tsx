"use client";

import type { LetterGrade, StockReport } from "@/types/report";
import dynamic from "next/dynamic";
import { useCallback, useState } from "react";

const StockPriceChart = dynamic(
  () =>
    import("@/components/StockPriceChart").then((m) => m.StockPriceChart),
  {
    ssr: false,
    loading: () => (
      <div className="rounded-xl border border-zinc-800 bg-[var(--card)] p-8 text-center text-sm text-zinc-500">
        Loading chart…
      </div>
    ),
  },
);

const gradeStyles: Record<LetterGrade, string> = {
  A: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
  B: "bg-lime-500/20 text-lime-200 border-lime-500/35",
  C: "bg-amber-500/20 text-amber-200 border-amber-500/35",
  D: "bg-orange-500/20 text-orange-200 border-orange-500/40",
  F: "bg-red-500/20 text-red-300 border-red-500/40",
  "—": "bg-zinc-500/15 text-zinc-400 border-zinc-600/50",
};

export default function Home() {
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<StockReport | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const run = useCallback(async () => {
    const symbol = q.trim();
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

  return (
    <main className="mx-auto min-h-screen min-w-0 max-w-5xl px-4 py-10 sm:px-6">
      <header className="mb-10 border-b border-zinc-800 pb-8">
        <p className="font-mono text-xs uppercase tracking-widest text-zinc-500">
          Stock report card
        </p>
        <h1
          className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl"
          style={{ fontFamily: "var(--font-dm-sans), system-ui" }}
        >
          Ten metrics, one page
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-zinc-400">
          P/E, consensus upside, PEG, leverage, free cash flow, ROE, RSI, beta,
          CNN Fear &amp; Greed, and dividend payout — graded for quick context.
          Type a ticker (<span className="font-mono">AAPL</span>,{" "}
          <span className="font-mono">brk.b</span>) or an{" "}
          <span className="text-zinc-300">S&amp;P 500</span> company name
          (<span className="font-mono">apple</span>,{" "}
          <span className="font-mono">berkshire hathaway</span>). Other names use
          Finnhub search, with Yahoo fallbacks when the free tier blocks an exchange.
          Not investment advice; data depends on coverage and delays.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && run()}
            placeholder="Company or ticker (apple, Google, AAPL, 7203.T)"
            className="min-w-0 flex-1 rounded-lg border border-zinc-700 bg-zinc-900/80 px-4 py-3 font-mono text-base text-white outline-none ring-blue-500/30 placeholder:text-zinc-600 focus:border-blue-500/50 focus:ring-2 sm:max-w-md sm:text-sm"
          />
          <button
            type="button"
            onClick={run}
            disabled={loading || !q.trim()}
            className="touch-manipulation shrink-0 rounded-lg bg-blue-600 px-5 py-3 text-base font-medium text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm"
          >
            {loading ? "Loading…" : "Run report"}
          </button>
        </div>
      </header>

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
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
              <div className="min-w-0">
                <h2 className="break-words text-xl font-semibold text-white sm:text-2xl">
                  {report.name ?? report.symbol}
                </h2>
                <p className="mt-1 break-all font-mono text-xs text-zinc-400 sm:text-sm">
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
                  <p className="text-xl font-semibold tabular-nums text-white sm:text-2xl">
                    {report.lastPrice.toLocaleString(undefined, {
                      style: "currency",
                      currency: report.currency || "USD",
                    })}
                  </p>
                )}
                <p className="font-mono text-xs text-zinc-500">
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
                className="flex flex-col rounded-xl border border-zinc-800 bg-[var(--card)] p-5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-base font-semibold text-white">{m.title}</h3>
                    <p className="mt-1 text-xs leading-relaxed text-zinc-500">
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
                  className="mt-4 font-mono text-2xl font-medium tabular-nums text-zinc-100"
                  style={{ fontFamily: "var(--font-plex-mono), ui-monospace" }}
                >
                  {m.value}
                </p>
                <p className="mt-3 text-sm leading-relaxed text-zinc-400">{m.detail}</p>
              </article>
            ))}
          </div>
        </div>
      )}

      <footer className="mt-16 border-t border-zinc-800 pt-8 text-xs text-zinc-600">
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
