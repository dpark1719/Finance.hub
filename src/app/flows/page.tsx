"use client";

import { useEffect, useMemo, useState } from "react";

type FlowDirection = "inflow" | "outflow" | "neutral";

type FlowAsset = {
  id: string;
  name: string;
  symbol: string;
  category: string;
  price: number;
  change1d: number;
  change1w: number;
  change1m: number;
  changeYtd: number;
  marketCap: string;
  flowDirection: FlowDirection;
};

const CATEGORIES = [
  "All",
  "Precious Metals",
  "Commodities",
  "Crypto",
  "Indices",
  "Volatility",
  "Currency",
] as const;

const HEATMAP_IMPORTANCE: Record<string, number> = {
  gold: 4, silver: 2, platinum: 1.5, palladium: 1, copper: 2,
  oil: 3, brent: 2.5, natgas: 2, wheat: 1, corn: 1, soybeans: 1, coffee: 1.5,
  btc: 5, eth: 4, sol: 2.5, xrp: 2, bnb: 2, ada: 1.5,
  sp500: 5, nasdaq: 5, djia: 4, russell: 2, nikkei: 3, ftse: 2.5, kospi: 2,
  vix: 2, vvix: 1, move: 1.5, skew: 1, gvz: 1,
  eur: 3, jpy: 3, gbp: 2.5, krw: 2, cny: 2.5, usd: 3,
};

function formatPrice(a: FlowAsset): string {
  const { id, price } = a;
  if (id === "btc" || id === "eth") {
    return price.toLocaleString("en-US", {
      maximumFractionDigits: id === "btc" ? 0 : 2,
      minimumFractionDigits: 0,
    });
  }
  if (id === "gold" || id === "silver") {
    return price.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }
  if (id === "oil" || id === "natgas") {
    return price.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }
  if (id === "sp500" || id === "nasdaq") {
    return price.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }
  if (id === "vix") return price.toFixed(2);
  if (id === "dxy") return price.toFixed(1);
  return String(price);
}

function pctClass(v: number): string {
  if (v > 0) return "bg-emerald-950/80 text-emerald-300 ring-emerald-800/60";
  if (v < 0) return "bg-red-950/80 text-red-300 ring-red-800/60";
  return "bg-zinc-800/80 text-zinc-300 ring-zinc-700/60";
}

function flowDirectionFor(a: FlowAsset): FlowDirection {
  if (a.flowDirection) return a.flowDirection;
  if (a.change1m > 0) return "inflow";
  if (a.change1m < 0) return "outflow";
  return "neutral";
}

function sortByAbsChange1m(a: FlowAsset, b: FlowAsset): number {
  return Math.abs(b.change1m) - Math.abs(a.change1m);
}

export default function FlowsPage() {
  const [assets, setAssets] = useState<FlowAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>("All");
  const [animationsStarted, setAnimationsStarted] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/flows");
        if (!res.ok) throw new Error("Failed to load flows");
        const data: FlowAsset[] = await res.json();
        if (!cancelled) setAssets(data);
      } catch (e) {
        if (!cancelled)
          setError(e instanceof Error ? e.message : "Something went wrong");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setAnimationsStarted(true);
  }, []);

  const filtered = useMemo(() => {
    if (category === "All") return assets;
    return assets.filter((a) => a.category === category);
  }, [assets, category]);

  const inflowAssets = useMemo(() => {
    return filtered
      .filter((a) => flowDirectionFor(a) === "inflow")
      .sort(sortByAbsChange1m);
  }, [filtered]);

  const outflowAssets = useMemo(() => {
    return filtered
      .filter((a) => flowDirectionFor(a) === "outflow")
      .sort(sortByAbsChange1m);
  }, [filtered]);

  const maxInflowMag = useMemo(() => {
    const m = Math.max(
      1,
      ...inflowAssets.map((a) => Math.abs(a.change1m)),
    );
    return m;
  }, [inflowAssets]);

  const maxOutflowMag = useMemo(() => {
    const m = Math.max(
      1,
      ...outflowAssets.map((a) => Math.abs(a.change1m)),
    );
    return m;
  }, [outflowAssets]);

  const netFlow = useMemo(() => {
    let inSum = 0;
    let outSum = 0;
    for (const a of filtered) {
      if (a.change1m > 0) inSum += a.change1m;
      else if (a.change1m < 0) outSum += Math.abs(a.change1m);
    }
    const total = inSum + outSum;
    return {
      inSum,
      outSum,
      greenPct: total > 0 ? (inSum / total) * 100 : 50,
      redPct: total > 0 ? (outSum / total) * 100 : 50,
    };
  }, [filtered]);

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <style>{`
        @keyframes fillUp {
          from {
            height: 0%;
          }
          to {
            height: var(--fill-pct);
          }
        }
        @keyframes drainDown {
          from {
            height: 100%;
          }
          to {
            height: var(--fill-pct);
          }
        }
        @keyframes flowRight {
          0% {
            transform: translateX(100%);
            opacity: 0.35;
          }
          15% {
            opacity: 1;
          }
          100% {
            transform: translateX(-100%);
            opacity: 0.35;
          }
        }
        @keyframes pulse {
          0%,
          100% {
            box-shadow: 0 0 0 1px rgb(39 39 42 / 0.6);
          }
          50% {
            box-shadow: 0 0 0 2px rgb(63 63 70 / 0.9);
          }
        }
        .flows-fill-up {
          animation: fillUp 1.5s ease-out forwards;
        }
        .flows-drain-down {
          animation: drainDown 1.5s ease-out forwards;
        }
        .flows-tank-pulse {
          animation: pulse 2s ease-in-out infinite;
        }
        .flows-dot-flow {
          animation: flowRight 2s linear infinite;
        }
        .flows-net-green {
          transition: width 1.2s ease-out;
        }
        .flows-net-red {
          transition: width 1.2s ease-out;
        }
      `}</style>

      <header className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight text-white">
          Capital Flows
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-400">
          Track where money moves across metals, commodities, crypto, indices,
          and macro indicators—using static snapshot prices for stable,
          rate-limit-free viewing.
        </p>
      </header>

      <div className="mb-6 flex flex-wrap gap-2">
        {CATEGORIES.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setCategory(c)}
            className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
              category === c
                ? "bg-zinc-100 text-zinc-900"
                : "border border-zinc-800 bg-zinc-900/40 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {loading && (
        <p className="text-sm text-zinc-500">Loading market snapshot…</p>
      )}
      {error && !loading && (
        <p className="text-sm text-red-400">{error}</p>
      )}

      {!loading && !error && (
        <>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {filtered.map((a) => (
              <li
                key={a.id}
                className="flex flex-col rounded-2xl border border-zinc-800 p-4"
                style={{ backgroundColor: "var(--card)" }}
              >
                <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                  {a.category}
                </span>
                <h2 className="mt-1 text-base font-semibold text-white">
                  {a.name}
                </h2>
                <p className="mt-3 text-2xl font-bold tabular-nums tracking-tight text-white">
                  {formatPrice(a)}
                </p>
                <p className="mt-1 text-xs tabular-nums text-zinc-500">
                  {a.marketCap ?? "—"}
                </p>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {(
                    [
                      ["1D", a.change1d],
                      ["1W", a.change1w],
                      ["1M", a.change1m],
                      ["YTD", a.changeYtd],
                    ] as const
                  ).map(([label, v]) => (
                    <span
                      key={label}
                      className={`rounded-lg px-2 py-1 text-center text-xs font-semibold tabular-nums ring-1 ${pctClass(v)}`}
                    >
                      {label}{" "}
                      {v > 0 ? "+" : ""}
                      {v.toFixed(1)}%
                    </span>
                  ))}
                </div>
              </li>
            ))}
          </ul>

          <section className="mt-12">
            <h2 className="text-lg font-semibold text-white">
              Capital Flow Visualization
            </h2>
            <p className="mt-1 text-sm text-zinc-500">
              1-month momentum tanks (magnitude-scaled); center stream shows
              notional movement from outflows toward inflows.
            </p>

            <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-[1fr_auto_1fr] lg:items-stretch">
              <div className="flex min-h-[280px] flex-col rounded-2xl border border-zinc-800 p-4"
                style={{ backgroundColor: "var(--card)" }}
              >
                <h3 className="text-center text-sm font-semibold text-emerald-400">
                  Inflows
                </h3>
                <div className="mt-3 flex flex-1 flex-col gap-3">
                  {inflowAssets.length === 0 ? (
                    <p className="text-center text-sm text-zinc-500">
                      No inflows in this filter.
                    </p>
                  ) : (
                    inflowAssets.map((a) => {
                      const pct =
                        (Math.abs(a.change1m) / maxInflowMag) * 100;
                      return (
                        <div
                          key={a.id}
                          className="flows-tank-pulse flex flex-col rounded-xl border border-zinc-800 bg-zinc-950/40 p-3"
                        >
                          <div className="text-center text-xs font-medium text-zinc-300">
                            {a.name}
                          </div>
                          <div className="relative mt-2 h-20 w-full overflow-hidden rounded-lg bg-zinc-900/80">
                            <div
                              className={`absolute bottom-0 left-0 right-0 rounded-b-lg bg-emerald-500/75 ${
                                animationsStarted ? "flows-fill-up" : ""
                              }`}
                              style={
                                {
                                  "--fill-pct": `${pct}%`,
                                  height: animationsStarted ? undefined : "0%",
                                } as React.CSSProperties
                              }
                            />
                          </div>
                          <div className="mt-2 text-center text-lg font-bold tabular-nums text-emerald-300">
                            +{a.change1m.toFixed(1)}%
                          </div>
                          <div className="text-center text-[11px] tabular-nums text-zinc-500">
                            {a.marketCap ?? "—"}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              <div
                className="relative flex min-h-[120px] min-w-[56px] items-center justify-center overflow-hidden rounded-2xl border border-zinc-800 lg:min-h-0 lg:w-14"
                style={{ backgroundColor: "var(--card)" }}
                aria-hidden
              >
                <div className="pointer-events-none absolute inset-y-4 inset-x-1">
                  {[0, 1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="flows-dot-flow absolute top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-blue-400"
                      style={{
                        left: `${12 + i * 18}%`,
                        animationDelay: `${i * 0.45}s`,
                      }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex min-h-[280px] flex-col rounded-2xl border border-zinc-800 p-4"
                style={{ backgroundColor: "var(--card)" }}
              >
                <h3 className="text-center text-sm font-semibold text-red-400">
                  Outflows
                </h3>
                <div className="mt-3 flex flex-1 flex-col gap-3">
                  {outflowAssets.length === 0 ? (
                    <p className="text-center text-sm text-zinc-500">
                      No outflows in this filter.
                    </p>
                  ) : (
                    outflowAssets.map((a) => {
                      const pct =
                        (Math.abs(a.change1m) / maxOutflowMag) * 100;
                      return (
                        <div
                          key={a.id}
                          className="flows-tank-pulse flex flex-col rounded-xl border border-zinc-800 bg-zinc-950/40 p-3"
                        >
                          <div className="text-center text-xs font-medium text-zinc-300">
                            {a.name}
                          </div>
                          <div className="relative mt-2 h-20 w-full overflow-hidden rounded-lg bg-zinc-900/80">
                            <div
                              className={`absolute bottom-0 left-0 right-0 rounded-b-lg bg-red-500/75 ${
                                animationsStarted ? "flows-drain-down" : ""
                              }`}
                              style={
                                {
                                  "--fill-pct": `${pct}%`,
                                  height: animationsStarted ? undefined : "100%",
                                } as React.CSSProperties
                              }
                            />
                          </div>
                          <div className="mt-2 text-center text-lg font-bold tabular-nums text-red-300">
                            {a.change1m.toFixed(1)}%
                          </div>
                          <div className="text-center text-[11px] tabular-nums text-zinc-500">
                            {a.marketCap ?? "—"}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-zinc-800 p-4"
              style={{ backgroundColor: "var(--card)" }}
            >
              <div className="mb-2 flex items-center justify-between text-xs font-medium text-zinc-400">
                <span className="text-emerald-400">Risk On</span>
                <span className="text-zinc-500">Net Flow Summary</span>
                <span className="text-red-400">Risk Off</span>
              </div>
              <div className="flex h-4 w-full overflow-hidden rounded-full bg-zinc-900 ring-1 ring-zinc-800">
                <div
                  className="flows-net-green h-full rounded-l-full bg-emerald-500/90"
                  style={{
                    width: animationsStarted ? `${netFlow.greenPct}%` : "0%",
                  }}
                />
                <div
                  className="flows-net-red h-full rounded-r-full bg-red-600/90"
                  style={{
                    width: animationsStarted ? `${netFlow.redPct}%` : "0%",
                  }}
                />
              </div>
            </div>
          </section>

          <section className="mt-12">
            <h2 className="text-lg font-semibold text-white">Market Heatmap</h2>
            <p className="mt-1 text-sm text-zinc-500">
              Rectangle size reflects relative importance; color follows 1-month
              performance.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {filtered.map((a) => {
                const up = a.change1m >= 0;
                const w = HEATMAP_IMPORTANCE[a.id] ?? 2;
                return (
                  <div
                    key={a.id}
                    className={`min-h-[72px] min-w-[100px] rounded-lg border px-3 py-2 ${
                      up
                        ? "border-emerald-800/50 bg-emerald-950/70"
                        : "border-red-900/50 bg-red-950/70"
                    }`}
                    style={{ flex: `${w} 1 120px` }}
                  >
                    <div className="text-xs font-semibold text-zinc-200">
                      {a.name}
                    </div>
                    <div
                      className={`mt-1 text-sm font-bold tabular-nums ${
                        up ? "text-emerald-300" : "text-red-300"
                      }`}
                    >
                      {a.change1m > 0 ? "+" : ""}
                      {a.change1m.toFixed(1)}%
                    </div>
                    <div className="mt-0.5 text-[10px] text-zinc-500">
                      1M
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </>
      )}
    </main>
  );
}
