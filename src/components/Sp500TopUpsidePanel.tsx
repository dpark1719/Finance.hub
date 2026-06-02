"use client";

import { getUsEquitySession } from "@/lib/us-market-hours";
import type { Sp500TopUpsidePayloadJSON, Sp500TopUpsideRowJSON } from "@/types/sp500-top-upside";
import { useCallback, useEffect, useRef, useState } from "react";

const POLL_MS = 900_000;

function fmtMoney(n: number, currency: string | null): string {
  const cur = currency && currency.trim() ? currency.trim() : "USD";
  try {
    return n.toLocaleString(undefined, { style: "currency", currency: cur, maximumFractionDigits: 2 });
  } catch {
    return n.toLocaleString(undefined, { maximumFractionDigits: 2 });
  }
}

function fmtPct(n: number): string {
  const sign = n >= 0 ? "+" : "";
  return `${sign}${n.toFixed(1)}%`;
}

function titleForRow(r: Sp500TopUpsideRowJSON): string {
  const name = (r.name ?? "").trim();
  return name ? `${name} (${r.symbol})` : r.symbol;
}

function RowList(props: {
  rows: Sp500TopUpsideRowJSON[];
  variant: "gain" | "loss";
  selectedSymbol: string | null | undefined;
  onSelectSymbol: (symbol: string) => void;
}) {
  const { rows, variant, selectedSymbol, onSelectSymbol } = props;
  if (rows.length === 0) return null;

  const pctClass =
    variant === "gain"
      ? "text-emerald-800 dark:text-emerald-300/90"
      : "text-rose-800 dark:text-rose-300/90";

  return (
    <ul className="mt-3 max-h-[min(22rem,45vh)] space-y-2 overflow-y-auto text-xs">
      {rows.map((r) => {
        const active = selectedSymbol?.toUpperCase() === r.symbol.toUpperCase();
        const indShort = r.industry.length > 36 ? `${r.industry.slice(0, 34)}…` : r.industry;
        const heading = titleForRow(r);
        return (
          <li key={`${variant}-${r.symbol}`}>
            <button
              type="button"
              onClick={() => onSelectSymbol(r.symbol)}
              title={`${r.industry} · ${r.sector}`}
              className={`w-full rounded-lg border px-2.5 py-2 text-left transition hover:bg-zinc-100/90 dark:hover:bg-zinc-800/80 ${
                active
                  ? "border-zinc-500/60 bg-zinc-500/10 dark:border-zinc-500/50"
                  : "border-zinc-200 dark:border-zinc-700 bg-white/70 dark:bg-zinc-900/40"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <span className="min-w-0 flex-1 text-left text-[13px] font-semibold leading-snug text-zinc-900 dark:text-white">
                  <span className="line-clamp-2">{heading}</span>
                </span>
                <span className={`shrink-0 font-mono text-[12px] tabular-nums ${pctClass}`}>{fmtPct(r.upsidePct)}</span>
              </div>
              <p className="mt-0.5 truncate text-[11px] text-zinc-500 dark:text-zinc-500">{indShort}</p>
              <p className="mt-1 font-mono text-[11px] tabular-nums text-zinc-700 dark:text-zinc-300">
                {fmtMoney(r.lastPrice, r.currency)} → {fmtMoney(r.targetMean, r.currency)}
              </p>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

export function Sp500TopUpsidePanel(props: {
  onSelectSymbol: (symbol: string) => void;
  selectedSymbol?: string | null;
}) {
  const { onSelectSymbol, selectedSymbol } = props;
  const [payload, setPayload] = useState<Sp500TopUpsidePayloadJSON | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const prevSession = useRef<ReturnType<typeof getUsEquitySession>>(getUsEquitySession());

  const load = useCallback(async () => {
    setErr(null);
    try {
      const res = await fetch("/api/sp500-top-upside", { cache: "no-store" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setPayload(null);
        setErr(typeof data.error === "string" ? data.error : "Could not load panel.");
        return;
      }
      setPayload(data as Sp500TopUpsidePayloadJSON);
    } catch {
      setPayload(null);
      setErr("Network error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const id = window.setInterval(() => void load(), POLL_MS);
    return () => window.clearInterval(id);
  }, [load]);

  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === "visible") void load();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [load]);

  useEffect(() => {
    const id = window.setInterval(() => {
      const s = getUsEquitySession();
      if (prevSession.current === "open" && s === "closed") void load();
      prevSession.current = s;
    }, 60_000);
    return () => window.clearInterval(id);
  }, [load]);

  const rows = payload?.rows ?? [];
  const losers = payload?.losers ?? [];

  return (
    <section
      className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/90 dark:bg-zinc-950/50 p-4 shadow-sm"
      aria-label="S&P 500 consensus upside and downside"
    >
      <div className="flex flex-col gap-1 border-b border-zinc-200/80 pb-3 dark:border-zinc-800">
        <h2 className="text-sm font-semibold leading-tight text-zinc-900 dark:text-white">
          Consensus vs. price — leaders &amp; laggards
        </h2>
        <p className="text-[11px] leading-snug text-zinc-500 dark:text-zinc-500">
          Top 10 imputed upside (street mean target above spot) and top 10 projected downside (mean target below spot).{" "}
          {payload?.periodLabel ? (
            <span className="text-zinc-600 dark:text-zinc-600">{payload.periodLabel}.</span>
          ) : null}
        </p>
        {payload?.generatedAt ? (
          <p className="font-mono text-[10px] text-zinc-500 dark:text-zinc-600">
            As of {new Date(payload.generatedAt).toLocaleString()}
            {payload.marketSession === "open" ? " · US session open" : " · US session closed"}
          </p>
        ) : null}
      </div>

      {loading && !payload ? (
        <div className="mt-4 py-10 text-center text-xs text-zinc-500 dark:text-zinc-500">Loading…</div>
      ) : null}

      {err ? (
        <p className="mt-3 text-xs text-red-600 dark:text-red-400" role="alert">
          {err}
        </p>
      ) : null}

      {!loading && !err ? (
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-600 dark:text-zinc-400">
              Top upside
            </h3>
            {!rows.length ? (
              <p className="mt-2 text-xs text-zinc-600 dark:text-zinc-500">
                No names with positive consensus upside (coverage gaps or stale targets).
              </p>
            ) : (
              <RowList rows={rows} variant="gain" selectedSymbol={selectedSymbol} onSelectSymbol={onSelectSymbol} />
            )}
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-600 dark:text-zinc-400">
              Top projected downside
            </h3>
            {!losers.length ? (
              <p className="mt-2 text-xs text-zinc-600 dark:text-zinc-500">
                No names with negative consensus upside (coverage gaps or stale targets).
              </p>
            ) : (
              <RowList rows={losers} variant="loss" selectedSymbol={selectedSymbol} onSelectSymbol={onSelectSymbol} />
            )}
          </div>
        </div>
      ) : null}
    </section>
  );
}
