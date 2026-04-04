"use client";

import type { CSSProperties } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type FxHistory = {
  dates: string[];
  rates: Record<string, number[]>;
};

type FxResponse = {
  base: string;
  date: string;
  rates: Record<string, number>;
  converted?: Record<string, number>;
  history: FxHistory;
};

const CURRENCIES = ["USD", "JPY", "KRW", "EUR"] as const;

type FxRange = "1m" | "3m" | "6m" | "1y" | "5y" | "max";

const RANGE_BUTTONS: { value: FxRange; label: string }[] = [
  { value: "1m", label: "1M" },
  { value: "3m", label: "3M" },
  { value: "6m", label: "6M" },
  { value: "1y", label: "1Y" },
  { value: "5y", label: "5Y" },
  { value: "max", label: "Max" },
];

/* ── 2026 projection data ─────────────────────────────────────── */

interface FxProjection {
  pair: string;
  target: string;
  bias: string;
  biasColor: string;
  summary: string;
  reasons: string[];
  catalysts: { type: "confirm" | "deny"; event: string }[];
}

const FX_PROJECTIONS: FxProjection[] = [
  {
    pair: "USD / JPY",
    target: "138 – 148",
    bias: "Yen Strengthening",
    biasColor: "#22c55e",
    summary:
      "Consensus expects the yen to gradually recover as the BOJ continues its tightening cycle while the Fed eases. The carry-trade unwind and repatriation flows add downside pressure on USD/JPY.",
    reasons: [
      "BOJ raised rates to 0.50% in Jan 2025 and markets price further hikes toward 0.75–1.00% through 2026",
      "Fed expected to cut 75–100 bps by end of 2026, narrowing the US-Japan rate differential",
      "Japanese institutional investors repatriating foreign bond holdings as domestic yields rise",
      "Carry-trade unwind risk: leveraged yen-short positions remain elevated and vulnerable to sudden squeezes",
      "Japan's trade balance improving with lower energy import costs and stronger auto/chip exports",
    ],
    catalysts: [
      { type: "confirm", event: "BOJ hikes to 0.75%+ at any 2026 meeting — signals confidence in sustained inflation above 2%" },
      { type: "confirm", event: "Fed cuts 50+ bps by mid-2026 — compresses rate spread and weakens dollar bid" },
      { type: "confirm", event: "Japan spring wage negotiations (Shunto) deliver 4%+ raises — supports BOJ's tightening case" },
      { type: "deny", event: "BOJ pauses or reverses due to recession risk — yen-weakening resumes if policy pivots dovish" },
      { type: "deny", event: "US inflation re-accelerates, forcing the Fed to hold or hike — widens differential again" },
      { type: "deny", event: "Global risk-off event triggers USD safe-haven demand, overpowering yen repatriation flows" },
    ],
  },
  {
    pair: "USD / KRW",
    target: "1,320 – 1,400",
    bias: "Won Modest Gain",
    biasColor: "#3b82f6",
    summary:
      "The won is projected to strengthen modestly as Korea's semiconductor export cycle peaks and Fed rate cuts weaken the dollar. However, geopolitical risk and BOK easing keep gains limited.",
    reasons: [
      "Memory chip super-cycle: Samsung & SK Hynix benefiting from AI-driven HBM demand, driving record export revenues",
      "Fed rate cuts expected to weaken the broad dollar index (DXY), giving room for EM Asian FX appreciation",
      "BOK likely to ease cautiously (25 bps cuts) to support domestic growth while managing won stability",
      "Foreign portfolio inflows returning to Korean equities (KOSPI rerating on chip earnings)",
      "Current account surplus expanding on strong tech exports and normalizing energy imports",
    ],
    catalysts: [
      { type: "confirm", event: "Samsung/SK Hynix post record quarterly earnings — validates chip cycle thesis and draws FX inflows" },
      { type: "confirm", event: "DXY index falls below 100 — signals broad dollar weakness benefiting Asian FX" },
      { type: "confirm", event: "South Korea removed from US Treasury FX monitoring list — removes overhang on won policy" },
      { type: "deny", event: "China slowdown deepens, dragging Korean exports — won weakens on trade balance fears" },
      { type: "deny", event: "North Korea provocation or political instability — triggers risk premium on won assets" },
      { type: "deny", event: "Global chip glut or AI capex pullback — reverses the semiconductor earnings cycle" },
    ],
  },
  {
    pair: "KRW / JPY",
    target: "0.098 – 0.108",
    bias: "Range-Bound",
    biasColor: "#eab308",
    summary:
      "This cross is caught between two forces: a recovering yen (BOJ tightening) and a firming won (chip exports). Consensus sees a relatively stable range with slight yen outperformance given the magnitude of BOJ policy shift.",
    reasons: [
      "BOJ tightening is a larger policy shift than BOK easing, giving the yen a relative edge in this cross",
      "Both currencies benefit from Fed cuts and USD weakness, partially offsetting each other",
      "Japan-Korea trade normalization (post-2023 thaw) reducing friction in bilateral capital flows",
      "Korean tourists to Japan remain strong, creating steady KRW selling / JPY buying flow",
      "Relative equity valuations: KOSPI cheaper than Nikkei may attract capital toward won",
    ],
    catalysts: [
      { type: "confirm", event: "BOJ hikes faster than BOK cuts — widens Japan-Korea rate spread in yen's favor" },
      { type: "confirm", event: "Cross holds 0.095–0.110 range through H1 2026 — validates range-bound thesis" },
      { type: "confirm", event: "Japan-Korea bilateral trade and tourism flows remain stable — supports equilibrium" },
      { type: "deny", event: "BOJ forced to pause while BOK cuts aggressively — tips the cross sharply toward won strength" },
      { type: "deny", event: "Korean exports surge far beyond expectations — breaks the cross out of range on won strength" },
      { type: "deny", event: "Japan enters technical recession — yen reverses gains and cross spikes higher" },
    ],
  },
];

function InteractiveChart({
  values,
  dates,
  className,
}: {
  values: number[];
  dates: string[];
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<{
    x: number;
    y: number;
    value: number;
    date: string;
    clientX: number;
  } | null>(null);

  const clean: { value: number; date: string; index: number }[] = [];
  for (let i = 0; i < values.length; i++) {
    if (Number.isFinite(values[i])) {
      clean.push({ value: values[i], date: dates[i] ?? "", index: i });
    }
  }

  if (clean.length < 2) {
    return (
      <div
        className={`flex h-40 items-center justify-center text-xs text-zinc-500 ${className ?? ""}`}
      >
        No chart data
      </div>
    );
  }

  const rawValues = clean.map((c) => c.value);
  const min = Math.min(...rawValues);
  const max = Math.max(...rawValues);
  const pad = max === min ? 1 : (max - min) * 0.1;
  const y0 = min - pad;
  const y1 = max + pad;
  const W = 600;
  const H = 160;
  const PL = 0;
  const PR = 0;
  const PT = 8;
  const PB = 8;
  const innerW = W - PL - PR;
  const innerH = H - PT - PB;

  const sx = (i: number) => PL + (i / (clean.length - 1)) * innerW;
  const sy = (v: number) => PT + innerH - ((v - y0) / (y1 - y0)) * innerH;

  const points = clean.map((c, i) => `${sx(i).toFixed(1)},${sy(c.value).toFixed(1)}`).join(" ");

  const areaPath = `M ${sx(0).toFixed(1)},${(PT + innerH).toFixed(1)} L ${clean.map((c, i) => `${sx(i).toFixed(1)},${sy(c.value).toFixed(1)}`).join(" L ")} L ${sx(clean.length - 1).toFixed(1)},${(PT + innerH).toFixed(1)} Z`;

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const mouseX = ((e.clientX - rect.left) / rect.width) * W;
    const idx = Math.round(((mouseX - PL) / innerW) * (clean.length - 1));
    const clamped = Math.max(0, Math.min(clean.length - 1, idx));
    const pt = clean[clamped];
    setHover({
      x: sx(clamped),
      y: sy(pt.value),
      value: pt.value,
      date: pt.date,
      clientX: e.clientX,
    });
  };

  const handleMouseLeave = () => setHover(null);

  const first = clean[0].value;
  const last = clean[clean.length - 1].value;
  const isUp = last >= first;

  return (
    <div ref={containerRef} className={`relative w-full ${className ?? ""}`}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="h-40 w-full"
        preserveAspectRatio="none"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{ cursor: "crosshair" }}
      >
        <defs>
          <linearGradient id="fxChartGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={isUp ? "rgb(34 197 94)" : "rgb(239 68 68)"} stopOpacity="0.25" />
            <stop offset="100%" stopColor={isUp ? "rgb(34 197 94)" : "rgb(239 68 68)"} stopOpacity="0.02" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill="url(#fxChartGrad)" />
        <polyline
          fill="none"
          stroke={isUp ? "rgb(34 197 94)" : "rgb(239 68 68)"}
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
          points={points}
        />
        {hover && (
          <>
            <line
              x1={hover.x}
              y1={PT}
              x2={hover.x}
              y2={PT + innerH}
              stroke="rgb(161 161 170)"
              strokeWidth="1"
              strokeDasharray="3 2"
            />
            <circle cx={hover.x} cy={hover.y} r="4" fill="white" stroke={isUp ? "rgb(34 197 94)" : "rgb(239 68 68)"} strokeWidth="2" />
          </>
        )}
      </svg>
      {hover && (
        <div className="pointer-events-none absolute left-0 top-0 z-10 -translate-y-full px-1 pb-1" style={{ left: `${(hover.x / W) * 100}%`, top: `${(hover.y / H) * 100}%`, transform: "translate(-50%, -110%)" }}>
          <div className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs shadow-lg">
            <p className="font-mono font-medium text-white">{hover.value.toLocaleString(undefined, { maximumFractionDigits: 6 })}</p>
            <p className="text-zinc-400">{hover.date}</p>
          </div>
        </div>
      )}
      <div className="mt-1 flex justify-between text-[10px] text-zinc-500">
        <span>{clean[0].date}</span>
        <span>{clean[clean.length - 1].date}</span>
      </div>
    </div>
  );
}

async function fetchFx(
  from: string,
  to: string,
  amount?: number,
  range?: FxRange,
): Promise<FxResponse> {
  const params = new URLSearchParams();
  params.set("from", from);
  params.set("to", to);
  if (amount !== undefined) {
    params.set("amount", String(amount));
  }
  if (range !== undefined) {
    params.set("range", range);
  }
  const res = await fetch(`/api/fx?${params.toString()}`);
  const data = (await res.json()) as FxResponse & { error?: string };
  if (!res.ok) {
    throw new Error(typeof data.error === "string" ? data.error : "Request failed");
  }
  return data as FxResponse;
}

function fetchPairHistory(from: string, to: string, range: FxRange): Promise<FxResponse> {
  return fetchFx(from, to, undefined, range);
}

export default function FxPage() {
  const [amount, setAmount] = useState(1);
  const [from, setFrom] = useState("USD");
  const [to, setTo] = useState("JPY");
  const [result, setResult] = useState<FxResponse | null>(null);
  const [convertLoading, setConvertLoading] = useState(false);
  const [convertError, setConvertError] = useState<string | null>(null);

  const [usdJpy, setUsdJpy] = useState<FxResponse | null>(null);
  const [usdKrw, setUsdKrw] = useState<FxResponse | null>(null);
  const [krwJpy, setKrwJpy] = useState<FxResponse | null>(null);
  const [gridLoading, setGridLoading] = useState(true);
  const [gridError, setGridError] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<number | null>(null);

  const [rangeUsdJpy, setRangeUsdJpy] = useState<FxRange>("1m");
  const [rangeUsdKrw, setRangeUsdKrw] = useState<FxRange>("1m");
  const [rangeKrwJpy, setRangeKrwJpy] = useState<FxRange>("1m");
  const [historyLoadingUsdJpy, setHistoryLoadingUsdJpy] = useState(false);
  const [historyLoadingUsdKrw, setHistoryLoadingUsdKrw] = useState(false);
  const [historyLoadingKrwJpy, setHistoryLoadingKrwJpy] = useState(false);

  const loadGrid = useCallback(async () => {
    setGridLoading(true);
    setGridError(null);
    try {
      const [usdMulti, krwJpyData] = await Promise.all([
        fetchFx("USD", "JPY,KRW,EUR", undefined, "1m"),
        fetchFx("KRW", "JPY", undefined, "1m"),
      ]);

      const jpy = usdMulti.rates.JPY;
      const krw = usdMulti.rates.KRW;
      setUsdJpy({
        ...usdMulti,
        rates: typeof jpy === "number" ? { JPY: jpy } : {},
        history: {
          dates: usdMulti.history.dates,
          rates: { JPY: usdMulti.history.rates.JPY ?? [] },
        },
      });
      setUsdKrw({
        ...usdMulti,
        rates: typeof krw === "number" ? { KRW: krw } : {},
        history: {
          dates: usdMulti.history.dates,
          rates: { KRW: usdMulti.history.rates.KRW ?? [] },
        },
      });
      setKrwJpy(krwJpyData);
      setUpdatedAt(Date.now());
    } catch (e) {
      setGridError(e instanceof Error ? e.message : "Failed to load rates");
    } finally {
      setGridLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadGrid();
  }, [loadGrid]);

  const handleRangeUsdJpy = useCallback(async (r: FxRange) => {
    setRangeUsdJpy(r);
    setHistoryLoadingUsdJpy(true);
    try {
      const data = await fetchPairHistory("USD", "JPY", r);
      const jpy = data.rates.JPY;
      setUsdJpy({
        ...data,
        rates: typeof jpy === "number" ? { JPY: jpy } : {},
        history: { dates: data.history.dates, rates: { JPY: data.history.rates.JPY ?? [] } },
      });
      setUpdatedAt(Date.now());
    } catch (e) {
      setGridError(e instanceof Error ? e.message : "Failed to load chart");
    } finally {
      setHistoryLoadingUsdJpy(false);
    }
  }, []);

  const handleRangeUsdKrw = useCallback(async (r: FxRange) => {
    setRangeUsdKrw(r);
    setHistoryLoadingUsdKrw(true);
    try {
      const data = await fetchPairHistory("USD", "KRW", r);
      const krw = data.rates.KRW;
      setUsdKrw({
        ...data,
        rates: typeof krw === "number" ? { KRW: krw } : {},
        history: { dates: data.history.dates, rates: { KRW: data.history.rates.KRW ?? [] } },
      });
      setUpdatedAt(Date.now());
    } catch (e) {
      setGridError(e instanceof Error ? e.message : "Failed to load chart");
    } finally {
      setHistoryLoadingUsdKrw(false);
    }
  }, []);

  const handleRangeKrwJpy = useCallback(async (r: FxRange) => {
    setRangeKrwJpy(r);
    setHistoryLoadingKrwJpy(true);
    try {
      const data = await fetchPairHistory("KRW", "JPY", r);
      setKrwJpy(data);
      setUpdatedAt(Date.now());
    } catch (e) {
      setGridError(e instanceof Error ? e.message : "Failed to load chart");
    } finally {
      setHistoryLoadingKrwJpy(false);
    }
  }, []);

  const handleConvert = async () => {
    if (from === to) {
      setConvertError("Choose two different currencies.");
      setResult(null);
      return;
    }
    setConvertLoading(true);
    setConvertError(null);
    try {
      const data = await fetchFx(from, to, amount);
      setResult(data);
    } catch (e) {
      setResult(null);
      setConvertError(e instanceof Error ? e.message : "Conversion failed");
    } finally {
      setConvertLoading(false);
    }
  };

  const displayConverted = useMemo(() => {
    if (!result || !result.converted) return null;
    const v = result.converted[to];
    return typeof v === "number" && Number.isFinite(v) ? v : null;
  }, [result, to]);

  const swap = () => {
    setFrom(to);
    setTo(from);
  };

  const formatTs = (ts: number | null) => {
    if (ts === null) return "—";
    return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(ts));
  };

  const rateCard = (
    label: string,
    data: FxResponse | null,
    baseCode: string,
    quoteCode: string,
    range: FxRange,
    onRangeChange: (r: FxRange) => void | Promise<void>,
    historyLoading: boolean,
  ) => {
    const direct =
      data?.rates[quoteCode] != null && Number.isFinite(data.rates[quoteCode])
        ? data.rates[quoteCode]
        : null;
    const inverse = direct !== null && direct !== 0 ? 1 / direct : null;
    const series = data?.history?.rates?.[quoteCode] ?? [];
    const historyDates = data?.history?.dates ?? [];

    return (
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">{label}</p>
        {gridLoading && !data ? (
          <p className="mt-2 text-sm text-zinc-500">Loading…</p>
        ) : direct === null ? (
          <p className="mt-2 text-sm text-zinc-500">No data available</p>
        ) : (
          <>
            <p className="mt-2 font-mono text-lg text-white">
              1 {baseCode} = {direct.toLocaleString(undefined, { maximumFractionDigits: 4 })} {quoteCode}
            </p>
            <p className="mt-1 font-mono text-sm text-zinc-400">
              1 {quoteCode} = {inverse !== null ? inverse.toLocaleString(undefined, { maximumFractionDigits: 8 }) : "—"} {baseCode}
            </p>
            <p className="mt-2 text-xs text-zinc-500">Updated: {formatTs(updatedAt)}</p>
            <div className="mt-3 border-t border-zinc-800/80 pt-3">
              <div className="mb-2 flex flex-wrap gap-1">
                {RANGE_BUTTONS.map(({ value, label: btnLabel }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => void onRangeChange(value)}
                    disabled={historyLoading || gridLoading}
                    className={`rounded-md px-2 py-1 text-xs font-medium transition disabled:opacity-50 ${
                      range === value
                        ? "bg-blue-600 text-white"
                        : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                    }`}
                  >
                    {btnLabel}
                  </button>
                ))}
              </div>
              <div className={historyLoading ? "opacity-50 transition-opacity" : ""}>
                <InteractiveChart values={series} dates={historyDates} />
              </div>
            </div>
          </>
        )}
      </div>
    );
  };

  return (
    <main
      className="mx-auto min-h-screen max-w-5xl px-4 py-10 sm:px-6"
      style={{ "--background": "#0c0f14", "--card": "#151a22" } as CSSProperties}
    >
      <header className="mb-10 border-b border-zinc-800 pb-8">
        <p className="font-mono text-xs uppercase tracking-widest text-zinc-500">Travel money</p>
        <h1
          className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl"
          style={{ fontFamily: "var(--font-dm-sans), system-ui" }}
        >
          Currency Exchange
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-zinc-400">
          Live mid-market rates from the European Central Bank via Frankfurter. Compare pairs and
          hover over charts to see exact rates on any date.
        </p>
      </header>

      <section className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-500">Amount</label>
            <input
              type="number"
              min={0}
              step="any"
              value={Number.isNaN(amount) ? "" : amount}
              onChange={(e) => setAmount(Number.parseFloat(e.target.value) || 0)}
              className="mt-1 w-full max-w-xs rounded-lg border border-zinc-700 bg-[var(--card)] px-3 py-2 text-white outline-none ring-blue-500/0 transition focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/30"
            />
          </div>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="min-w-0 flex-1">
              <label className="block text-xs font-medium text-zinc-500">From</label>
              <select
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="mt-1 w-full rounded-lg border border-zinc-700 bg-[var(--card)] px-3 py-2 text-white outline-none focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/30"
              >
                {CURRENCIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="flex justify-center sm:pb-0.5">
              <button
                type="button"
                onClick={swap}
                className="rounded-lg border border-zinc-600 bg-zinc-800/80 px-4 py-2 text-sm font-medium text-zinc-200 transition hover:bg-zinc-700"
                aria-label="Swap currencies"
              >
                ⇄ Swap
              </button>
            </div>
            <div className="min-w-0 flex-1">
              <label className="block text-xs font-medium text-zinc-500">To</label>
              <select
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="mt-1 w-full rounded-lg border border-zinc-700 bg-[var(--card)] px-3 py-2 text-white outline-none focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/30"
              >
                {CURRENCIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={() => void handleConvert()}
            disabled={convertLoading}
            className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-500 disabled:opacity-60"
          >
            {convertLoading ? "Converting…" : "Convert"}
          </button>
          {convertError && <p className="text-sm text-red-400">{convertError}</p>}
        </div>

        {displayConverted !== null && (
          <div className="mt-8 rounded-xl border border-zinc-800/80 bg-black/20 p-6">
            <p className="text-sm text-zinc-500">You receive</p>
            <p className="mt-1 text-4xl font-semibold tracking-tight text-white">
              {displayConverted.toLocaleString(undefined, { maximumFractionDigits: 4 })}{" "}
              <span className="text-2xl font-medium text-zinc-400">{to}</span>
            </p>
            <p className="mt-2 text-xs text-zinc-500">
              Rate date: {result?.date ?? "—"} · Base {result?.base ?? "—"}
            </p>
          </div>
        )}
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold text-white">Popular pairs</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Hover over charts to see exact rates. Select a time range below each chart.
        </p>
        {gridError && <p className="mt-4 text-sm text-red-400">{gridError}</p>}
        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          {rateCard("USD / JPY", usdJpy, "USD", "JPY", rangeUsdJpy, handleRangeUsdJpy, historyLoadingUsdJpy)}
          {rateCard("USD / KRW", usdKrw, "USD", "KRW", rangeUsdKrw, handleRangeUsdKrw, historyLoadingUsdKrw)}
          {rateCard("KRW / JPY", krwJpy, "KRW", "JPY", rangeKrwJpy, handleRangeKrwJpy, historyLoadingKrwJpy)}
        </div>
      </section>

      {/* ── 2026 Projections ─────────────────────────────── */}
      <section className="mt-12">
        <h2 className="text-lg font-semibold text-white">2026 Consensus Projections</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Wall Street and major bank forecasts compiled as of Q1 2026. Projections are mid-range consensus — actual outcomes depend on the catalysts listed below.
        </p>
        <div className="mt-6 grid gap-5 lg:grid-cols-3">
          {FX_PROJECTIONS.map((proj) => (
            <div key={proj.pair} className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">{proj.pair}</p>
                  <p className="mt-1 font-mono text-xl font-semibold text-white">{proj.target}</p>
                </div>
                <span
                  className="mt-1 shrink-0 rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider"
                  style={{
                    backgroundColor: proj.biasColor + "20",
                    color: proj.biasColor,
                    border: `1px solid ${proj.biasColor}50`,
                  }}
                >
                  {proj.bias}
                </span>
              </div>

              <p className="mt-3 text-sm leading-relaxed text-zinc-300">{proj.summary}</p>

              <div className="mt-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Key Drivers</p>
                <ul className="mt-2 space-y-1.5">
                  {proj.reasons.map((r, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-zinc-300">
                      <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: proj.biasColor }} />
                      {r}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-4 border-t border-zinc-800 pt-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Events to Watch</p>
                <ul className="mt-2 space-y-1.5">
                  {proj.catalysts.map((c, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-zinc-400">
                      <span className="mt-0.5 shrink-0 text-zinc-600">{c.type === "confirm" ? "✓" : "✗"}</span>
                      <span>
                        <span className={c.type === "confirm" ? "text-green-400/80" : "text-red-400/80"}>{c.type === "confirm" ? "Confirms" : "Denies"}</span>
                        {" — "}{c.event}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>

        <p className="mt-6 text-xs text-zinc-600">
          Sources: Goldman Sachs, Morgan Stanley, JPMorgan, Barclays, ING, MUFG, Nomura Research, Reuters polls. Forecasts are not financial advice and carry significant uncertainty.
        </p>
      </section>
    </main>
  );
}
