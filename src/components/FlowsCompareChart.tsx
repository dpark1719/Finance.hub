"use client";

import type { YahooChartRangeKey } from "@/lib/yahoo-chart-presets";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const RANGE_OPTIONS: { key: YahooChartRangeKey; label: string }[] = [
  { key: "1m", label: "1M" },
  { key: "3m", label: "3M" },
  { key: "1y", label: "1Y" },
  { key: "5y", label: "5Y" },
];

const LINE_COLORS = [
  "#60a5fa",
  "#34d399",
  "#fbbf24",
  "#f472b6",
  "#a78bfa",
  "#fb923c",
  "#2dd4bf",
  "#f87171",
  "#94a3b8",
  "#c084fc",
];

type AssetRef = { id: string; name: string; symbol: string };

function valueAtOrBefore(
  data: { t: number; v: number }[],
  t: number,
): number | undefined {
  let lo = 0;
  let hi = data.length - 1;
  let ans = -1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (data[mid].t <= t) {
      ans = mid;
      lo = mid + 1;
    } else hi = mid - 1;
  }
  return ans >= 0 ? data[ans].v : undefined;
}

function closeAtOrBeforeRaw(
  pts: { t: number; c: number }[],
  t0: number,
): number | undefined {
  let lo = 0;
  let hi = pts.length - 1;
  let ans = -1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (pts[mid].t <= t0) {
      ans = mid;
      lo = mid + 1;
    } else hi = mid - 1;
  }
  return ans >= 0 && pts[ans].c > 0 ? pts[ans].c : undefined;
}

/** Common anchor: latest "first available" day so every series has a price; index = 100 at that date. */
function mergeIndexedSeries(
  seriesList: { id: string; points: { t: number; c: number }[] }[],
): Record<string, string | number>[] {
  const cleaned = seriesList.map((s) => {
    const pts = [...s.points]
      .sort((a, b) => a.t - b.t)
      .filter((p) => p.c > 0);
    return { id: s.id, pts };
  });

  const valid = cleaned.filter((s) => s.pts.length > 0);
  if (valid.length === 0) return [];

  const anchorT = Math.max(...valid.map((s) => s.pts[0].t));

  const bases: Record<string, number> = {};
  for (const s of valid) {
    const b = closeAtOrBeforeRaw(s.pts, anchorT);
    if (b === undefined || b <= 0) return [];
    bases[s.id] = b;
  }

  const normalized = valid.map((s) => ({
    id: s.id,
    data: s.pts
      .filter((p) => p.t >= anchorT)
      .map((p) => ({ t: p.t, v: (p.c / bases[s.id]) * 100 })),
  }));

  const allT = new Set<number>();
  for (const s of normalized) {
    for (const p of s.data) allT.add(p.t);
  }
  const sortedT = [...allT].sort((a, b) => a - b);
  const rows: Record<string, string | number>[] = [];

  for (const t of sortedT) {
    const row: Record<string, string | number> = {
      t,
      label: new Date(t * 1000).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: sortedT.length > 60 ? "2-digit" : undefined,
      }),
    };
    let any = false;
    for (const s of normalized) {
      const v = valueAtOrBefore(s.data, t);
      if (v !== undefined) {
        row[s.id] = v;
        any = true;
      }
    }
    if (any) rows.push(row);
  }
  return rows;
}

export function FlowsCompareChart({ assets }: { assets: AssetRef[] }) {
  const [range, setRange] = useState<YahooChartRangeKey>("3m");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chartRows, setChartRows] = useState<Record<string, string | number>[]>(
    [],
  );
  const [activeIds, setActiveIds] = useState<string[]>([]);

  const load = useCallback(async () => {
    if (assets.length === 0) {
      setChartRows([]);
      setActiveIds([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const settled = await Promise.allSettled(
        assets.map(async (a) => {
          const res = await fetch(
            `/api/chart?symbol=${encodeURIComponent(a.symbol)}&range=${range}`,
          );
          const data = await res.json().catch(() => ({}));
          if (!res.ok) {
            throw new Error(
              typeof data.error === "string"
                ? data.error
                : `Chart failed for ${a.name}`,
            );
          }
          const raw = data.points as { t: number; c: number }[];
          return {
            id: a.id,
            points: raw ?? [],
          };
        }),
      );
      const results = settled
        .filter(
          (r): r is PromiseFulfilledResult<{ id: string; points: { t: number; c: number }[] }> =>
            r.status === "fulfilled" && r.value.points.length > 0,
        )
        .map((r) => r.value);
      if (results.length === 0) {
        setError("No chart data returned for the selected assets.");
        setChartRows([]);
        setActiveIds([]);
        return;
      }
      const merged = mergeIndexedSeries(results);
      if (merged.length === 0) {
        setError("Could not align series for comparison.");
        setChartRows([]);
        setActiveIds([]);
        return;
      }
      setChartRows(merged);
      setActiveIds(results.map((r) => r.id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Chart load failed");
      setChartRows([]);
      setActiveIds([]);
    } finally {
      setLoading(false);
    }
  }, [assets, range]);

  useEffect(() => {
    load();
  }, [load]);

  const ids = useMemo(() => assets.map((a) => a.id), [assets]);

  if (assets.length === 0) return null;

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-4">
      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-sm font-semibold text-white">
            Relative performance (indexed to 100)
          </h3>
          <p className="text-xs text-zinc-500">
            Lines share the same anchor date (latest first quote in the group);
            values are indexed so 100 = price on that date.
          </p>
        </div>
        <div className="flex flex-wrap gap-1 rounded-lg border border-zinc-700 p-0.5">
          {RANGE_OPTIONS.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => setRange(key)}
              className={`rounded-md px-2.5 py-1 text-xs font-semibold transition ${
                range === key
                  ? "bg-zinc-100 text-zinc-900"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <p className="py-8 text-center text-sm text-zinc-500">Loading chart…</p>
      )}
      {error && !loading && (
        <p className="py-4 text-center text-sm text-red-400">{error}</p>
      )}
      {!loading && !error && chartRows.length === 0 && (
        <p className="py-8 text-center text-sm text-zinc-500">
          No chart data for this selection.
        </p>
      )}
      {!loading && !error && chartRows.length > 0 && (
        <div className="h-[min(420px,55vh)] w-full min-h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartRows} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis
                dataKey="label"
                tick={{ fill: "#a1a1aa", fontSize: 10 }}
                interval="preserveStartEnd"
                minTickGap={24}
              />
              <YAxis
                domain={["auto", "auto"]}
                tick={{ fill: "#a1a1aa", fontSize: 10 }}
                tickFormatter={(v) => `${Number(v).toFixed(0)}`}
                label={{
                  value: "Index",
                  angle: -90,
                  position: "insideLeft",
                  fill: "#71717a",
                  fontSize: 10,
                }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#18181b",
                  border: "1px solid #3f3f46",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
                labelStyle={{ color: "#e4e4e7" }}
                formatter={(value: number | string) => [
                  typeof value === "number" ? value.toFixed(2) : String(value),
                  "Index",
                ]}
              />
              <Legend
                wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }}
                formatter={(value) => (
                  <span className="text-zinc-300">{value}</span>
                )}
              />
              {(activeIds.length > 0 ? activeIds : ids).map((id, i) => {
                const name = assets.find((a) => a.id === id)?.name ?? id;
                return (
                  <Line
                    key={id}
                    type="monotone"
                    dataKey={id}
                    name={name}
                    stroke={LINE_COLORS[i % LINE_COLORS.length]}
                    strokeWidth={2}
                    dot={false}
                    connectNulls
                  />
                );
              })}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
