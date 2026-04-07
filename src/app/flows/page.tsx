"use client";

import { FlowsCompareChart } from "@/components/FlowsCompareChart";
import { useCallback, useEffect, useMemo, useState } from "react";

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
  aluminum: 1.5, zinc: 1, nickel: 1, lithium: 1.5, uranium: 1.5,
  oil: 3, brent: 2.5, natgas: 2, wheat: 1, corn: 1, soybeans: 1, coffee: 1.5,
  sugar: 1, cotton: 1, lumber: 1,
  btc: 5, eth: 4, sol: 2.5, xrp: 2, bnb: 2, ada: 1.5,
  doge: 1.5, avax: 1.5, dot: 1.5, link: 1.5,
  sp500: 5, nasdaq: 5, djia: 4, russell: 2, nikkei: 3, ftse: 2.5, kospi: 2,
  dax: 2.5, hangseng: 3, shanghai: 3,
  vix: 2, vvix: 1, move: 1.5, skew: 1, gvz: 1,
  ovx: 1, tyvix: 1, vxn: 1, rvx: 1, vxd: 1,
  eur: 3, jpy: 3, gbp: 2.5, krw: 2, cny: 2.5, usd: 3,
  chf: 2, aud: 2, cad: 2, inr: 1.5,
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
  const [compareIds, setCompareIds] = useState<Set<string>>(new Set());
  const [compareSortKey, setCompareSortKey] = useState<"1d" | "1w" | "1m" | "ytd">("1m");

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

  const toggleCompare = useCallback((id: string) => {
    setCompareIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const removeFromCompare = useCallback((id: string) => {
    setCompareIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const clearCompare = useCallback(() => setCompareIds(new Set()), []);

  const compareAssets = useMemo(() => {
    const items = assets.filter((a) => compareIds.has(a.id));
    const key = compareSortKey;
    return items.sort((a, b) => {
      const av = key === "1d" ? a.change1d : key === "1w" ? a.change1w : key === "1m" ? a.change1m : a.changeYtd;
      const bv = key === "1d" ? b.change1d : key === "1w" ? b.change1w : key === "1m" ? b.change1m : b.changeYtd;
      return bv - av;
    });
  }, [assets, compareIds, compareSortKey]);

  const bestWorst = useMemo(() => {
    if (compareAssets.length < 2) return null;
    const get = (key: "change1d" | "change1w" | "change1m" | "changeYtd") => {
      let best = compareAssets[0], worst = compareAssets[0];
      for (const a of compareAssets) {
        if (a[key] > best[key]) best = a;
        if (a[key] < worst[key]) worst = a;
      }
      return { best, worst };
    };
    return { d1: get("change1d"), w1: get("change1w"), m1: get("change1m"), ytd: get("changeYtd") };
  }, [compareAssets]);

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
          and macro indicators. Select assets to compare performance side by side.
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
            {filtered.map((a) => {
              const checked = compareIds.has(a.id);
              return (
                <li
                  key={a.id}
                  className={`relative flex flex-col rounded-2xl border p-4 transition-colors ${
                    checked
                      ? "border-blue-500/60 ring-1 ring-blue-500/30"
                      : "border-zinc-800"
                  }`}
                  style={{ backgroundColor: "var(--card)" }}
                >
                  <button
                    type="button"
                    onClick={() => toggleCompare(a.id)}
                    className={`absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded border text-xs transition ${
                      checked
                        ? "border-blue-500 bg-blue-500 text-white"
                        : "border-zinc-600 bg-zinc-800/60 text-transparent hover:border-zinc-400"
                    }`}
                    title={checked ? "Remove from comparison" : "Add to comparison"}
                  >
                    {checked && "✓"}
                  </button>
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
              );
            })}
          </ul>

          {compareIds.size > 0 && (
            <section
              className="mt-12 rounded-2xl border border-blue-500/25 p-5 sm:p-6"
              style={{ backgroundColor: "var(--card)" }}
              aria-label="Performance comparison"
            >
              <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-white">
                    Performance comparison
                  </h2>
                  <p className="mt-1 text-sm text-zinc-500">
                    {compareAssets.length} asset{compareAssets.length !== 1 ? "s" : ""} selected — table sorted by{" "}
                    {compareSortKey.toUpperCase()} change
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex gap-1 rounded-lg border border-zinc-700 p-0.5">
                    {(["1d", "1w", "1m", "ytd"] as const).map((k) => (
                      <button
                        key={k}
                        type="button"
                        onClick={() => setCompareSortKey(k)}
                        className={`rounded-md px-2.5 py-1 text-xs font-semibold transition ${
                          compareSortKey === k
                            ? "bg-zinc-100 text-zinc-900"
                            : "text-zinc-400 hover:text-zinc-200"
                        }`}
                      >
                        {k.toUpperCase()}
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={clearCompare}
                    className="rounded-lg border border-zinc-700 px-3 py-1.5 text-sm text-zinc-400 transition hover:border-zinc-500 hover:text-white"
                  >
                    Clear all
                  </button>
                </div>
              </div>

              {compareAssets.length > 0 && (
                <div className="mb-6">
                  <FlowsCompareChart
                    key={compareAssets.map((a) => a.id).sort().join(",")}
                    assets={compareAssets.map((a) => ({
                      id: a.id,
                      name: a.name,
                      symbol: a.symbol,
                    }))}
                  />
                </div>
              )}

              {compareAssets.length === 0 && (
                <p className="mb-6 text-sm text-zinc-500">
                  Loading selected assets…
                </p>
              )}

              {compareAssets.length > 0 && (
                <>
                  {bestWorst && (
                    <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                      {(
                        [
                          ["1D", bestWorst.d1],
                          ["1W", bestWorst.w1],
                          ["1M", bestWorst.m1],
                          ["YTD", bestWorst.ytd],
                        ] as [string, { best: FlowAsset; worst: FlowAsset }][]
                      ).map(([label, { best, worst }]) => (
                        <div
                          key={label}
                          className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-3"
                        >
                          <div className="text-xs font-medium text-zinc-500">{label} Leader</div>
                          <div className="mt-1 flex items-center gap-1.5">
                            <span className="text-sm font-semibold text-emerald-400">{best.name}</span>
                            <span className="text-xs tabular-nums text-emerald-300">
                              {best[`change${label === "1D" ? "1d" : label === "1W" ? "1w" : label === "1M" ? "1m" : "Ytd"}` as keyof FlowAsset] as number > 0 ? "+" : ""}
                              {(best[`change${label === "1D" ? "1d" : label === "1W" ? "1w" : label === "1M" ? "1m" : "Ytd"}` as keyof FlowAsset] as number).toFixed(1)}%
                            </span>
                          </div>
                          <div className="mt-1 flex items-center gap-1.5">
                            <span className="text-sm font-semibold text-red-400">{worst.name}</span>
                            <span className="text-xs tabular-nums text-red-300">
                              {(worst[`change${label === "1D" ? "1d" : label === "1W" ? "1w" : label === "1M" ? "1m" : "Ytd"}` as keyof FlowAsset] as number).toFixed(1)}%
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-sm">
                      <thead>
                        <tr className="border-b border-zinc-800 text-left">
                          <th className="whitespace-nowrap py-2 pr-4 text-xs font-medium text-zinc-500">#</th>
                          <th className="whitespace-nowrap py-2 pr-4 text-xs font-medium text-zinc-500">Asset</th>
                          <th className="whitespace-nowrap py-2 pr-4 text-xs font-medium text-zinc-500">Category</th>
                          <th className="whitespace-nowrap py-2 pr-4 text-right text-xs font-medium text-zinc-500">Price</th>
                          <th className="whitespace-nowrap py-2 pr-4 text-right text-xs font-medium text-zinc-500">Mkt Cap</th>
                          <th className="whitespace-nowrap py-2 pr-4 text-right text-xs font-medium text-zinc-500">1D</th>
                          <th className="whitespace-nowrap py-2 pr-4 text-right text-xs font-medium text-zinc-500">1W</th>
                          <th className="whitespace-nowrap py-2 pr-4 text-right text-xs font-medium text-zinc-500">1M</th>
                          <th className="whitespace-nowrap py-2 pr-4 text-right text-xs font-medium text-zinc-500">YTD</th>
                          <th className="py-2 text-center text-xs font-medium text-zinc-500">Remove</th>
                        </tr>
                      </thead>
                      <tbody>
                        {compareAssets.map((a, i) => (
                          <tr
                            key={a.id}
                            className="border-b border-zinc-800/50 transition hover:bg-zinc-800/30"
                          >
                            <td className="py-2.5 pr-4 tabular-nums text-zinc-500">{i + 1}</td>
                            <td className="py-2.5 pr-4 font-semibold text-white">{a.name}</td>
                            <td className="py-2.5 pr-4 text-xs text-zinc-500">{a.category}</td>
                            <td className="py-2.5 pr-4 text-right tabular-nums text-zinc-300">
                              {formatPrice(a)}
                            </td>
                            <td className="py-2.5 pr-4 text-right text-xs tabular-nums text-zinc-500">
                              {a.marketCap}
                            </td>
                            {(
                              [a.change1d, a.change1w, a.change1m, a.changeYtd] as number[]
                            ).map((v, j) => (
                              <td
                                key={j}
                                className={`py-2.5 pr-4 text-right tabular-nums font-medium ${
                                  v > 0 ? "text-emerald-400" : v < 0 ? "text-red-400" : "text-zinc-500"
                                }`}
                              >
                                {v > 0 ? "+" : ""}
                                {v.toFixed(1)}%
                              </td>
                            ))}
                            <td className="py-2.5 text-center">
                              <button
                                type="button"
                                onClick={() => removeFromCompare(a.id)}
                                className="text-zinc-600 transition hover:text-red-400"
                                title="Remove"
                              >
                                ✕
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </section>
          )}

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
