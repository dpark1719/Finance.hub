"use client";

import {
  formatPeriodChangePct,
  periodChangePctFromPoints,
} from "@/lib/chart-period-return";
import type { YahooChartRangeKey } from "@/lib/yahoo-chart-presets";
import { YAHOO_CHART_PRESETS } from "@/lib/yahoo-chart-presets";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const RANGE_ORDER: YahooChartRangeKey[] = [
  "1d",
  "1w",
  "1m",
  "3m",
  "ytd",
  "1y",
  "5y",
  "max",
];

type Point = { t: number; c: number; label: string };

export function StockPriceChart({ symbol }: { symbol: string }) {
  const [range, setRange] = useState<YahooChartRangeKey>("3m");
  const [points, setPoints] = useState<Point[]>([]);
  const [currency, setCurrency] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (r: YahooChartRangeKey) => {
      if (!symbol) return;
      setLoading(true);
      setError(null);
      setPoints([]);
      try {
        const res = await fetch(
          `/api/chart?symbol=${encodeURIComponent(symbol)}&range=${r}`,
        );
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setError(typeof data.error === "string" ? data.error : "Chart failed");
          setPoints([]);
          return;
        }
        const raw = data.points as { t: number; c: number }[];
        setCurrency(typeof data.currency === "string" ? data.currency : null);
        setPoints(
          (raw ?? []).map((p) => ({
            ...p,
            label: new Date(p.t * 1000).toLocaleString(undefined, {
              month: "short",
              day: "numeric",
              year: r === "1d" || r === "1w" ? undefined : "numeric",
              hour: r === "1d" || r === "1w" ? "numeric" : undefined,
              minute: r === "1d" || r === "1w" ? "2-digit" : undefined,
            }),
          })),
        );
      } catch {
        setError("Network error");
        setPoints([]);
      } finally {
        setLoading(false);
      }
    },
    [symbol],
  );

  useEffect(() => {
    load(range);
  }, [symbol, range, load]);

  const periodPct = useMemo(
    () => (loading ? null : periodChangePctFromPoints(points)),
    [loading, points],
  );

  const periodPctText = loading ? "…" : formatPeriodChangePct(periodPct);
  const periodPctClass =
    loading || periodPct == null
      ? "text-slate-500 dark:text-zinc-500"
      : periodPct >= 0
        ? "text-emerald-700 dark:text-emerald-300"
        : "text-rose-700 dark:text-rose-300";

  return (
    <section className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-[var(--card)] p-4 sm:p-5">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">Price</h3>
          <p className="mt-1 font-mono text-sm tabular-nums">
            <span className={periodPctClass}>{periodPctText}</span>
            <span className="text-slate-500 dark:text-zinc-500">
              {" "}
              · {YAHOO_CHART_PRESETS[range].label}
            </span>
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-zinc-500">
            Yahoo Finance intraday/daily history (ranges as on Yahoo).
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {RANGE_ORDER.map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setRange(k)}
              className={`touch-manipulation rounded-md border px-2.5 py-2 font-mono text-xs font-medium transition sm:py-1 ${
                range === k
                  ? "border-blue-500/60 bg-blue-600/25 text-blue-200"
                  : "border-slate-300 dark:border-zinc-700 bg-white/95 dark:bg-zinc-900/60 text-slate-600 dark:text-zinc-400 hover:border-slate-300 dark:border-zinc-600 hover:text-slate-800 dark:text-zinc-200"
              }`}
            >
              {YAHOO_CHART_PRESETS[k].label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <p className="mb-3 text-sm text-amber-200/90" role="alert">
          {error}
        </p>
      )}

      <div className="h-[240px] w-full min-w-0 sm:h-[280px]" aria-busy={loading}>
        {loading && points.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-slate-500 dark:text-zinc-500">
            Loading chart…
          </div>
        ) : points.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-slate-500 dark:text-zinc-500">
            No price data for this symbol.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
            <AreaChart data={points} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="fillPrice" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
              <XAxis
                dataKey="t"
                tickFormatter={(ts) =>
                  new Date(ts * 1000).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                  })
                }
                stroke="#71717a"
                tick={{ fill: "#a1a1aa", fontSize: 11 }}
                minTickGap={18}
                interval="preserveStartEnd"
              />
              <YAxis
                domain={["auto", "auto"]}
                stroke="#71717a"
                tick={{ fill: "#a1a1aa", fontSize: 10 }}
                width={48}
                tickFormatter={(v) =>
                  Number(v).toLocaleString(undefined, { maximumFractionDigits: 2 })
                }
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#18181b",
                  border: "1px solid #3f3f46",
                  borderRadius: 8,
                }}
                labelStyle={{ color: "#e4e4e7" }}
                formatter={(value: number | string) => [
                  typeof value === "number"
                    ? value.toLocaleString(undefined, {
                        style: currency ? "currency" : "decimal",
                        currency: currency ?? "USD",
                        maximumFractionDigits: 2,
                      })
                    : value,
                  "Close",
                ]}
                labelFormatter={(_, payload) =>
                  payload?.[0]?.payload?.label ?? ""
                }
              />
              <Area
                type="monotone"
                dataKey="c"
                stroke="#60a5fa"
                strokeWidth={1.5}
                fill="url(#fillPrice)"
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </section>
  );
}
