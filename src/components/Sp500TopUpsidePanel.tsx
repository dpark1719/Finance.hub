"use client";

import { getUsEquitySession } from "@/lib/us-market-hours";
import type { Sp500TopUpsidePayloadJSON, Sp500TopUpsideRowJSON } from "@/types/sp500-top-upside";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

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
  const chartData = [...rows]
    .sort((a, b) => a.upsidePct - b.upsidePct)
    .map((r) => ({ ...r, label: r.symbol }));

  const maxUpside = rows.reduce((m, r) => Math.max(m, r.upsidePct), 0);
  const chartMax = maxUpside > 0 ? Math.ceil(maxUpside * 1.08) : 10;

  return (
    <section
      className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/90 dark:bg-zinc-950/50 p-4 shadow-sm"
      aria-label="S&P 500 highest imputed upside"
    >
      <div className="flex flex-col gap-1">
        <h2 className="text-sm font-semibold leading-tight text-slate-900 dark:text-white">
          Highest imputed upside
        </h2>
        <p className="text-[11px] leading-snug text-slate-500 dark:text-zinc-500">
          Top 10 S&amp;P 500 names by consensus mean target vs. last price (positive upside only).{" "}
          {payload?.periodLabel ? (
            <span className="text-slate-600 dark:text-zinc-600">{payload.periodLabel}.</span>
          ) : null}
        </p>
        {payload?.generatedAt ? (
          <p className="font-mono text-[10px] text-slate-500 dark:text-zinc-600">
            As of {new Date(payload.generatedAt).toLocaleString()}
            {payload.marketSession === "open" ? " · US session open" : " · US session closed"}
          </p>
        ) : null}
      </div>

      {loading && !payload ? (
        <div className="mt-4 py-10 text-center text-xs text-slate-500 dark:text-zinc-500">Loading…</div>
      ) : null}

      {err ? (
        <p className="mt-3 text-xs text-red-600 dark:text-red-400" role="alert">
          {err}
        </p>
      ) : null}

      {!loading && !err && rows.length === 0 ? (
        <p className="mt-3 text-xs text-slate-600 dark:text-zinc-500">
          No names with positive consensus upside found (coverage gaps or stale targets).
        </p>
      ) : null}

      {rows.length > 0 ? (
        <>
          <div className="mt-3 h-[220px] w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={chartData}
                margin={{ top: 4, right: 8, left: 0, bottom: 4 }}
              >
                <XAxis
                  type="number"
                  domain={[0, chartMax]}
                  tickFormatter={(v) => `${Number(v).toFixed(0)}%`}
                  tick={{ fontSize: 10, fill: "currentColor" }}
                  className="text-zinc-500"
                />
                <YAxis
                  type="category"
                  dataKey="symbol"
                  width={42}
                  tick={{ fontSize: 10, fill: "currentColor" }}
                  className="text-zinc-600 dark:text-zinc-400"
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: "8px",
                    fontSize: "12px",
                    border: "1px solid rgb(51 65 85 / 0.5)",
                  }}
                  formatter={(value) => {
                    const v = typeof value === "number" ? value : Number(value);
                    return Number.isFinite(v) ? [`${v.toFixed(1)}%`, "Upside"] : ["—", "Upside"];
                  }}
                />
                <Bar
                  dataKey="upsidePct"
                  fill="rgb(59 130 246)"
                  radius={[0, 4, 4, 0]}
                  className="cursor-pointer"
                  onClick={(state: unknown) => {
                    const row = (state as { payload?: Sp500TopUpsideRowJSON }).payload;
                    if (row?.symbol) onSelectSymbol(row.symbol);
                  }}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <ul className="mt-3 max-h-[min(22rem,45vh)] space-y-2 overflow-y-auto text-xs">
            {rows.map((r) => {
              const active = selectedSymbol?.toUpperCase() === r.symbol.toUpperCase();
              const indShort =
                r.industry.length > 36 ? `${r.industry.slice(0, 34)}…` : r.industry;
              return (
                <li key={r.symbol}>
                  <button
                    type="button"
                    onClick={() => onSelectSymbol(r.symbol)}
                    title={`${r.industry} · ${r.sector}`}
                    className={`w-full rounded-lg border px-2.5 py-2 text-left transition hover:bg-slate-100/90 dark:hover:bg-zinc-800/80 ${
                      active
                        ? "border-blue-500/50 bg-blue-500/10"
                        : "border-slate-200 dark:border-zinc-700 bg-white/60 dark:bg-zinc-900/40"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-mono text-[13px] font-semibold text-slate-900 dark:text-white">
                        {r.symbol}
                      </span>
                      <span className="shrink-0 font-mono tabular-nums text-emerald-700 dark:text-emerald-400">
                        {fmtPct(r.upsidePct)}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-[11px] text-slate-500 dark:text-zinc-500">{indShort}</p>
                    <p className="mt-1 font-mono text-[11px] tabular-nums text-slate-700 dark:text-zinc-300">
                      {fmtMoney(r.lastPrice, r.currency)} → {fmtMoney(r.targetMean, r.currency)}
                    </p>
                  </button>
                </li>
              );
            })}
          </ul>
        </>
      ) : null}
    </section>
  );
}
