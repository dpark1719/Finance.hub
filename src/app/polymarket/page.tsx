"use client";

import { barColorForOutcome, OUTCOME_NO_RED, OUTCOME_YES_GREEN } from "@/lib/entity-colors";
import type { PolymarketTopMarket } from "@/lib/polymarket-top";
import type { CSSProperties } from "react";
import { useCallback, useEffect, useState } from "react";

const POLL_MS = 15_000;

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

function clampPct(p: number): number {
  if (!Number.isFinite(p)) return 0;
  return Math.min(100, Math.max(0, p * 100));
}

/** Yes = green, No = red; anything else uses team/entity lookup or a fallback hue. */
function outcomeKind(name: string): "yes" | "no" | "neutral" {
  const n = name.trim().toLowerCase();
  if (n === "yes") return "yes";
  if (n === "no") return "no";
  return "neutral";
}

function isYesNoBinary(outcomes: PolymarketTopMarket["outcomes"]): boolean {
  if (outcomes.length !== 2) return false;
  const set = new Set(outcomes.map((o) => o.name.trim().toLowerCase()));
  return set.has("yes") && set.has("no");
}

/** Yes = green (left), No = red (right); labels always below the bar. */
function YesNoSplitBar({
  yesProb,
  noProb,
}: {
  yesProb: number;
  noProb: number;
}) {
  const rawYes = clampPct(yesProb);
  const rawNo = clampPct(noProb);
  const sum = rawYes + rawNo;
  const yesW = sum > 0 ? (rawYes / sum) * 100 : 50;
  const noW = sum > 0 ? (rawNo / sum) * 100 : 50;

  const thinMin = (w: number): Pick<CSSProperties, "minWidth"> =>
    w > 0 && w < 8 ? { minWidth: "6px" } : {};

  const yesStyle: CSSProperties = {
    width: `${yesW}%`,
    backgroundColor: OUTCOME_YES_GREEN,
    ...thinMin(yesW),
  };
  const noStyle: CSSProperties = {
    width: `${noW}%`,
    backgroundColor: OUTCOME_NO_RED,
    ...thinMin(noW),
  };

  return (
    <div className="w-full space-y-1.5">
      <div
        className="flex h-9 w-full min-w-0 overflow-hidden rounded-lg border border-slate-200 shadow-sm dark:border-zinc-700"
        role="img"
        aria-label={`Yes ${formatPct(yesProb)}, No ${formatPct(noProb)}`}
      >
        <div className="h-full min-w-0 transition-[width] duration-300" style={yesStyle} />
        <div className="h-full min-w-0 transition-[width] duration-300" style={noStyle} />
      </div>
      <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-[11px] tabular-nums text-slate-700 dark:text-zinc-300">
        <span className="min-w-0 justify-self-start text-left [overflow-wrap:anywhere]">
          <span className="font-semibold text-emerald-600 dark:text-emerald-400">Yes</span> {formatPct(yesProb)}
        </span>
        <span className="min-w-0 justify-self-end text-right [overflow-wrap:anywhere]">
          <span className="font-semibold text-red-600 dark:text-red-400">No</span> {formatPct(noProb)}
        </span>
      </div>
    </div>
  );
}

type OutcomeRow = PolymarketTopMarket["outcomes"][number];

/** Two-outcome market (not Yes/No): team / entity colors, labels under left & right. */
function BinarySplitBar({ left, right }: { left: OutcomeRow; right: OutcomeRow }) {
  const rawL = clampPct(left.probability);
  const rawR = clampPct(right.probability);
  const sum = rawL + rawR;
  const wL = sum > 0 ? (rawL / sum) * 100 : 50;
  const wR = sum > 0 ? (rawR / sum) * 100 : 50;

  const thinMin = (w: number): Pick<CSSProperties, "minWidth"> =>
    w > 0 && w < 8 ? { minWidth: "6px" } : {};

  const colorL = barColorForOutcome(left.name, "neutral", 0);
  const colorR = barColorForOutcome(right.name, "neutral", 1);

  const styleL: CSSProperties = { width: `${wL}%`, backgroundColor: colorL, ...thinMin(wL) };
  const styleR: CSSProperties = { width: `${wR}%`, backgroundColor: colorR, ...thinMin(wR) };

  return (
    <div className="w-full space-y-1.5">
      <div
        className="flex h-9 w-full min-w-0 overflow-hidden rounded-lg border border-slate-200 shadow-sm dark:border-zinc-700"
        role="img"
        aria-label={`${left.name} ${formatPct(left.probability)}, ${right.name} ${formatPct(right.probability)}`}
      >
        <div className="h-full min-w-0 transition-[width] duration-300" style={styleL} title={left.name} />
        <div className="h-full min-w-0 transition-[width] duration-300" style={styleR} title={right.name} />
      </div>
      <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-[11px] leading-snug text-slate-700 dark:text-zinc-300">
        <span className="min-w-0 justify-self-start text-left [overflow-wrap:anywhere]">
          <span className="font-semibold" style={{ color: colorL }}>
            {left.name}
          </span>{" "}
          <span className="tabular-nums">{formatPct(left.probability)}</span>
        </span>
        <span className="min-w-0 justify-self-end text-right [overflow-wrap:anywhere]">
          <span className="font-semibold" style={{ color: colorR }}>
            {right.name}
          </span>{" "}
          <span className="tabular-nums">{formatPct(right.probability)}</span>
        </span>
      </div>
    </div>
  );
}

function OutcomesLine({ outcomes }: { outcomes: PolymarketTopMarket["outcomes"] }) {
  if (outcomes.length === 0) {
    return <span className="text-slate-500 dark:text-zinc-500">—</span>;
  }
  const show = outcomes.slice(0, 6);
  const more = outcomes.length - show.length;

  if (isYesNoBinary(show)) {
    const yes = show.find((o) => o.name.trim().toLowerCase() === "yes");
    const no = show.find((o) => o.name.trim().toLowerCase() === "no");
    const yesProb = yes?.probability ?? 0;
    const noProb = no?.probability ?? 0;
    return (
      <div className="min-w-[10rem] space-y-1">
        <YesNoSplitBar yesProb={yesProb} noProb={noProb} />
        {more > 0 ? <p className="text-xs text-slate-500 dark:text-zinc-500">+{more} more outcomes</p> : null}
      </div>
    );
  }

  if (show.length === 2) {
    return (
      <div className="min-w-[10rem] space-y-1">
        <BinarySplitBar left={show[0]} right={show[1]} />
        {more > 0 ? <p className="text-xs text-slate-500 dark:text-zinc-500">+{more} more outcomes</p> : null}
      </div>
    );
  }

  return (
    <ul className="flex min-w-[10rem] flex-col gap-2 text-sm text-slate-800 dark:text-zinc-200">
      {show.map((o, i) => {
        const kind = outcomeKind(o.name);
        const pct = clampPct(o.probability);
        const fill = barColorForOutcome(o.name, kind, i);
        return (
          <li key={`${o.name}-${i}`} className="min-w-0 space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="w-14 shrink-0 truncate text-xs font-semibold text-slate-700 dark:text-zinc-300">{o.name}</span>
              <div className="h-6 min-h-6 min-w-0 flex-1 overflow-hidden rounded-md bg-slate-200/90 dark:bg-zinc-800">
                <div
                  className="h-full min-w-0 rounded-sm transition-[width] duration-300"
                  style={{
                    width: `${pct}%`,
                    backgroundColor: fill,
                    ...(pct > 0 && pct < 6 ? { minWidth: "4px" } : {}),
                  }}
                />
              </div>
              <span className="w-[3.25rem] shrink-0 text-right font-mono text-xs tabular-nums text-slate-900 dark:text-zinc-100">
                {formatPct(o.probability)}
              </span>
            </div>
          </li>
        );
      })}
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

  const loadMarkets = useCallback(async () => {
    try {
      const res = await fetch("/api/polymarket-top", { cache: "no-store" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(typeof data.error === "string" ? data.error : "Could not load Polymarket data");
        setMarkets([]);
        return;
      }
      setErr(null);
      setMarkets(Array.isArray(data.markets) ? data.markets : []);
      setFetchedAt(typeof data.fetchedAt === "string" ? data.fetchedAt : null);
    } catch {
      setErr("Network error");
      setMarkets([]);
    }
  }, []);

  useEffect(() => {
    void loadMarkets();
    const id = window.setInterval(() => {
      if (document.visibilityState === "visible") void loadMarkets();
    }, POLL_MS);
    return () => window.clearInterval(id);
  }, [loadMarkets]);

  return (
    <main className="mx-auto min-h-screen min-w-0 max-w-5xl px-4 py-10 sm:px-6">
      <header className="mb-10 border-b border-slate-200 dark:border-zinc-800 pb-8">
        <p className="font-mono text-xs uppercase tracking-widest text-slate-500 dark:text-zinc-500">
          finance.hub · Real-time probabilities
        </p>
        <h1
          className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 dark:text-white sm:text-4xl"
          style={{ fontFamily: "var(--font-dm-sans), system-ui" }}
        >
          Top markets by 24h volume
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-600 dark:text-zinc-400">
          The ten most active Polymarket markets by{" "}
          <strong className="font-medium text-slate-800 dark:text-zinc-300">24h volume</strong> (USDC). Prices are implied
          probabilities from the order book. Data from Polymarket&apos;s Gamma API may lag. Prediction markets carry risk and
          may be restricted where you live — not investment or gambling advice.
        </p>
        <div className="mt-3 max-w-2xl text-xs leading-relaxed text-slate-600 dark:text-zinc-500">
          <span className="font-medium text-slate-700 dark:text-zinc-400">Bar width = implied probability</span>.{" "}
          <span className="text-emerald-600 dark:text-emerald-400">Yes</span> is green (left) and{" "}
          <span className="text-red-600 dark:text-red-400">No</span> is red (right), with labels under the bar. Two-sided
          sports matchups use representative team colors when we recognize the name; otherwise colors are assigned for
          contrast.
        </div>
        <p className="mt-2 max-w-2xl text-xs text-slate-500 dark:text-zinc-600">
          Data auto-refreshes about every {POLL_MS / 1000}s while this tab is visible (Polymarket Gamma — no API key).
        </p>
        {fetchedAt && (
          <p className="mt-2 font-mono text-xs text-slate-500 dark:text-zinc-600">
            Last updated {new Date(fetchedAt).toLocaleString()}
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
          Loading markets…
        </div>
      )}

      {markets.length > 0 && (
        <div className="space-y-4">
          {/* Mobile: cards */}
          <div className="flex flex-col gap-4 lg:hidden">
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
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-zinc-500">Implied probability</p>
                  <div className="mt-2">
                    <OutcomesLine outcomes={m.outcomes} />
                  </div>
                </div>
              </article>
            ))}
          </div>

          {/* Desktop: table */}
          <div className="hidden overflow-x-auto rounded-xl border border-slate-200 dark:border-zinc-800 lg:block">
            <table className="w-full min-w-[1080px] table-fixed border-collapse text-left text-sm">
              <caption className="sr-only">
                Markets sorted by 24-hour volume. Yes is green and No is red; two-outcome markets may use team colors.
              </caption>
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 dark:border-zinc-800 dark:bg-zinc-900/50">
                  <th className="w-10 min-w-[2.5rem] px-2 py-3 text-center font-semibold text-slate-700 dark:text-zinc-300">
                    #
                  </th>
                  <th className="min-w-0 w-[28%] px-3 py-3 font-semibold text-slate-700 dark:text-zinc-300">Market</th>
                  <th className="min-w-0 w-[26%] px-3 py-3 font-semibold text-slate-700 dark:text-zinc-300">Implied %</th>
                  <th className="min-w-[10.5rem] w-[14%] px-3 py-3 text-right font-semibold text-slate-700 dark:text-zinc-300">
                    24h volume
                  </th>
                  <th className="min-w-[10.5rem] w-[14%] px-3 py-3 text-right font-semibold text-slate-700 dark:text-zinc-300">
                    All-time vol
                  </th>
                  <th className="min-w-[10.5rem] w-[14%] px-3 py-3 text-right font-semibold text-slate-700 dark:text-zinc-300">
                    Liquidity
                  </th>
                </tr>
              </thead>
              <tbody>
                {markets.map((m, idx) => (
                  <tr
                    key={m.id}
                    className="border-b border-slate-100 dark:border-zinc-800/80 last:border-0 hover:bg-slate-50/80 dark:hover:bg-zinc-900/30"
                  >
                    <td className="w-10 min-w-[2.5rem] px-2 py-3 text-center align-middle font-mono text-slate-500 dark:text-zinc-500">
                      {idx + 1}
                    </td>
                    <td className="min-w-0 w-[28%] px-3 py-3 align-middle">
                      <a
                        href={m.polymarketUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block break-words font-medium leading-snug text-blue-600 [overflow-wrap:anywhere] hover:underline dark:text-blue-400"
                      >
                        {m.question}
                      </a>
                    </td>
                    <td className="min-w-0 w-[26%] px-3 py-3 align-top">
                      <div className="max-w-full">
                        <OutcomesLine outcomes={m.outcomes} />
                      </div>
                    </td>
                    <td className="min-w-[10.5rem] w-[14%] px-3 py-3 text-right align-middle font-mono text-sm tabular-nums tracking-tight text-slate-900 dark:text-zinc-100 whitespace-nowrap">
                      {formatUsd(m.volume24hr)}
                    </td>
                    <td className="min-w-[10.5rem] w-[14%] px-3 py-3 text-right align-middle font-mono text-sm tabular-nums tracking-tight text-slate-900 dark:text-zinc-100 whitespace-nowrap">
                      {formatUsd(m.volumeTotal)}
                    </td>
                    <td className="min-w-[10.5rem] w-[14%] px-3 py-3 text-right align-middle font-mono text-sm tabular-nums tracking-tight text-slate-900 dark:text-zinc-100 whitespace-nowrap">
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
