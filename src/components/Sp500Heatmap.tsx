"use client";

import type { HeatmapRangeKey } from "@/lib/yahoo-chart-presets";
import { HEATMAP_RANGE_OPTIONS } from "@/lib/yahoo-chart-presets";
import { useCallback, useEffect, useState } from "react";
import {
  ResponsiveContainer,
  Tooltip,
  Treemap,
  type TooltipProps,
} from "recharts";

type Leaf = {
  name: string;
  companyName?: string;
  size: number;
  changePct: number | null;
  o: number | null;
  h: number | null;
  l: number | null;
  c: number | null;
  searchSymbol: string;
  isLeaf: true;
};

type Branch = { name: string; children: (Branch | Leaf)[] };

type Payload = {
  name?: string;
  companyName?: string;
  size?: number;
  children?: unknown[];
  isLeaf?: boolean;
  changePct?: number | null;
  o?: number | null;
  h?: number | null;
  l?: number | null;
  c?: number | null;
  searchSymbol?: string;
};

function leafFill(changePct: number | null): string {
  if (changePct == null || !Number.isFinite(changePct)) return "#3f3f46";
  const t = Math.max(-6, Math.min(6, changePct)) / 6;
  if (t <= 0) {
    const k = 1 + t;
    const r = Math.round(220 - 40 * k);
    const g = Math.round(38 + 20 * k);
    const b = Math.round(38 + 25 * k);
    return `rgb(${r},${g},${b})`;
  }
  const k = t;
  const r = Math.round(20 + 30 * (1 - k));
  const g = Math.round(140 + 80 * k);
  const b = Math.round(60 + 40 * k);
  return `rgb(${r},${g},${b})`;
}

function fmtPx(n: number | null): string {
  if (n == null || !Number.isFinite(n)) return "—";
  return n.toLocaleString(undefined, { maximumFractionDigits: 2, minimumFractionDigits: 2 });
}

function HeatTooltip({
  active,
  payload,
  periodLabel = "1 day",
}: TooltipProps<number, string> & { periodLabel?: string }) {
  if (!active || !payload?.length) return null;
  const raw = payload[0]?.payload as Payload | undefined;
  const isStockTile = Boolean(raw?.searchSymbol);
  if (!isStockTile) {
    return (
      <div className="max-w-xs rounded-lg border border-slate-300 dark:border-zinc-600 bg-slate-50 dark:bg-zinc-950/95 px-3 py-2 text-xs text-slate-800 dark:text-zinc-200 shadow-xl backdrop-blur-sm">
        <p className="font-semibold uppercase tracking-wide text-slate-600 dark:text-zinc-400">{raw?.name}</p>
        <p className="mt-1 text-slate-500 dark:text-zinc-500">Sector / industry group</p>
      </div>
    );
  }
  if (!raw) return null;
  const ch = raw.changePct;
  const chStr =
    ch == null || !Number.isFinite(ch) ? "—" : `${ch >= 0 ? "+" : ""}${ch.toFixed(2)}%`;
  const company = typeof raw.companyName === "string" ? raw.companyName.trim() : "";
  const sym = raw.searchSymbol ?? "";
  const title = company || sym;
  return (
    <div className="max-w-sm rounded-lg border border-slate-300 dark:border-zinc-600 bg-slate-50 dark:bg-zinc-950/95 px-3 py-2.5 text-xs text-slate-800 dark:text-zinc-100 shadow-xl backdrop-blur-sm">
      <p className="text-sm font-semibold leading-snug text-slate-900 dark:text-white">{title}</p>
      {company ? (
        <p className="mt-1 font-mono text-[11px] text-slate-500 dark:text-zinc-500">{sym}</p>
      ) : null}
      <p className="mt-1.5 tabular-nums text-slate-700 dark:text-zinc-300">
        <span className="text-slate-500 dark:text-zinc-500">O</span> {fmtPx(raw.o ?? null)}
        {" · "}
        <span className="text-slate-500 dark:text-zinc-500">H</span> {fmtPx(raw.h ?? null)}
        {" · "}
        <span className="text-slate-500 dark:text-zinc-500">L</span> {fmtPx(raw.l ?? null)}
        {" · "}
        <span className="text-slate-500 dark:text-zinc-500">C</span> {fmtPx(raw.c ?? null)}
      </p>
      <p className="mt-1.5 font-mono tabular-nums text-slate-800 dark:text-zinc-200">
        {periodLabel} {chStr}
      </p>
    </div>
  );
}

/** Recharts passes one flat object (layout + your data fields) — not `payload`. */
type TreemapCellProps = {
  x: number;
  y: number;
  width: number;
  height: number;
  /** Recharts may omit this on synthetic nodes */
  name?: string;
  /** Present on branch nodes after squarify; absent or empty on leaves */
  children?: unknown[];
  changePct?: number | null;
  o?: number | null;
  h?: number | null;
  l?: number | null;
  c?: number | null;
  searchSymbol?: string;
  isLeaf?: boolean;
  onLeafClick?: (symbol: string) => void;
};

function HeatmapCell({
  x,
  y,
  width,
  height,
  name,
  children,
  changePct,
  searchSymbol,
  isLeaf: isLeafFlag,
  onLeafClick,
}: TreemapCellProps) {
  if (width < 2 || height < 2) return null;
  const isLeaf = isLeafFlag === true || !children?.length;
  const branchLabel = String(name ?? "").trim();

  if (!isLeaf) {
    const fs = Math.min(13, Math.max(9, height * 0.12));
    return (
      <g>
        <rect
          x={x}
          y={y}
          width={width}
          height={height}
          className="fill-slate-200 stroke-slate-300 dark:fill-[#0c0c0e] dark:stroke-zinc-800"
          strokeWidth={1}
        />
        {width > 50 && height > fs + 6 && branchLabel && (
          <text
            x={x + 6}
            y={y + fs + 2}
            className="fill-slate-600 dark:fill-[#a1a1aa]"
            fontSize={fs}
            fontWeight={600}
            style={{ textTransform: "uppercase", letterSpacing: "0.04em" }}
          >
            {branchLabel.length > 28 ? `${branchLabel.slice(0, 26)}…` : branchLabel}
          </text>
        )}
      </g>
    );
  }

  const cp = changePct ?? null;
  const fill = leafFill(cp);
  const showTxt = width > 34 && height > 26;
  const pctStr =
    cp == null || !Number.isFinite(cp) ? "—" : `${cp >= 0 ? "+" : ""}${cp.toFixed(2)}%`;
  const fs = Math.min(11, width / 4);
  const fs2 = Math.min(9, width / 5);
  const sym = searchSymbol;
  const leafLabel = (String(name ?? "").trim() || sym || "—").trim();

  return (
    <g
      role="button"
      tabIndex={0}
      className="outline-none"
      style={{ cursor: "pointer" }}
      onClick={() => sym && onLeafClick?.(sym)}
      onKeyDown={(e) => {
        if ((e.key === "Enter" || e.key === " ") && sym) {
          e.preventDefault();
          onLeafClick?.(sym);
        }
      }}
    >
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill={fill}
        stroke="#09090b"
        strokeWidth={0.5}
      />
      {showTxt && (
        <>
          <text
            x={x + width / 2}
            y={y + height / 2 - (height > 40 ? 5 : 0)}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="#fafafa"
            fontSize={fs}
            fontWeight={600}
            fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
          >
            {leafLabel.length > 8 ? `${leafLabel.slice(0, 7)}…` : leafLabel}
          </text>
          {height > 36 && (
            <text
              x={x + width / 2}
              y={y + height / 2 + 12}
              textAnchor="middle"
              fill="#f4f4f5"
              fontSize={fs2}
              fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
            >
              {pctStr}
            </text>
          )}
        </>
      )}
    </g>
  );
}

export function Sp500Heatmap({
  onSelectSymbol,
}: {
  onSelectSymbol: (finnhubSymbol: string) => void;
}) {
  const [heatmapRange, setHeatmapRange] = useState<HeatmapRangeKey>("1d");
  const [periodLabel, setPeriodLabel] = useState("1 day");
  const [tree, setTree] = useState<Branch[]>([]);
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);
  const [refreshAfter, setRefreshAfter] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (range: HeatmapRangeKey) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/sp500-heatmap?range=${encodeURIComponent(range)}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "Could not load heatmap");
        setTree([]);
        return;
      }
      setTree(Array.isArray(data.tree) ? data.tree : []);
      setGeneratedAt(typeof data.generatedAt === "string" ? data.generatedAt : null);
      setRefreshAfter(typeof data.refreshAfter === "string" ? data.refreshAfter : null);
      setPeriodLabel(typeof data.periodLabel === "string" ? data.periodLabel : "1 day");
    } catch {
      setError("Network error");
      setTree([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(heatmapRange);
  }, [load, heatmapRange]);

  useEffect(() => {
    const id = window.setInterval(() => void load(heatmapRange), 3600_000);
    return () => window.clearInterval(id);
  }, [load, heatmapRange]);

  const treemapCellContent = useCallback(
    (props: unknown) => {
      const p = props as TreemapCellProps;
      return (
        <HeatmapCell
          {...p}
          onLeafClick={(sym) => {
            onSelectSymbol(sym);
          }}
        />
      );
    },
    [onSelectSymbol],
  );

  return (
    <section className="mt-10 border-t border-slate-200 dark:border-zinc-800 pt-10">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">S&amp;P 500 heatmap</h2>
          <p className="mt-1 max-w-2xl text-sm text-slate-500 dark:text-zinc-500">
            Block size ≈ market cap (Yahoo). Color = return over the selected period (1 day uses
            regular session change; longer ranges use Yahoo spark first→last close). Hover for OHLC;
            click to run the report. Data refreshes about every hour.
          </p>
        </div>
        {generatedAt && (
          <p className="font-mono text-xs text-slate-600 dark:text-zinc-600">
            Updated {new Date(generatedAt).toLocaleString()}
            {refreshAfter && (
              <span className="block text-slate-600 dark:text-zinc-700 sm:inline sm:before:content-['·_']">
                Next refresh ~ {new Date(refreshAfter).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
            )}
          </p>
        )}
      </div>

      <div className="mb-4 flex flex-wrap gap-2" role="tablist" aria-label="Heatmap time period">
        {HEATMAP_RANGE_OPTIONS.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={heatmapRange === key}
            onClick={() => setHeatmapRange(key)}
            className={`touch-manipulation rounded-lg px-3 py-2 text-xs font-medium transition sm:text-sm ${
              heatmapRange === key
                ? "bg-blue-600 text-white"
                : "border border-slate-300 dark:border-zinc-600 bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 hover:border-slate-400 dark:hover:border-zinc-500"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {error && (
        <div
          className="mb-4 rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-900 dark:border-amber-500/30 dark:text-amber-100"
          role="alert"
        >
          {error}
        </div>
      )}

      {loading && tree.length === 0 && !error && (
        <div className="flex h-[520px] items-center justify-center rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-100/90 dark:bg-zinc-950/50 text-sm text-slate-500 dark:text-zinc-500">
          Loading heatmap…
        </div>
      )}

      {!loading && tree.length === 0 && !error && (
        <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-100/90 dark:bg-zinc-950/50 px-4 py-8 text-center text-sm text-slate-500 dark:text-zinc-500">
          No heatmap data.
        </div>
      )}

      {tree.length > 0 && (
        <div
          className="w-full rounded-xl border border-slate-300 dark:border-zinc-800 bg-slate-200 dark:bg-[#050506] p-1 sm:p-2"
          style={{ height: "min(70vh, 640px)", minHeight: 480 }}
        >
          <ResponsiveContainer width="100%" height="100%">
            <Treemap
              data={tree as never}
              dataKey="size"
              type="flat"
              stroke="transparent"
              isAnimationActive={false}
              content={treemapCellContent as never}
            >
              <Tooltip
                content={(props) => <HeatTooltip {...props} periodLabel={periodLabel} />}
              />
            </Treemap>
          </ResponsiveContainer>
        </div>
      )}

      <p className="mt-3 text-center text-[11px] text-slate-600 dark:text-zinc-600">
        Red = down · green = up · gray = missing data. Yahoo Finance (quotes + spark for multi-day
        ranges).
      </p>
    </section>
  );
}
