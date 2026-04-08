import { SP500_GICS, SP500_TICKERS } from "@/lib/sp500-lookup.generated";
import type { HeatmapRangeKey } from "@/lib/yahoo-chart-presets";
import { HEATMAP_RANGE_OPTIONS } from "@/lib/yahoo-chart-presets";
import {
  fetchYahooQuotesForFinnhubSymbols,
  fetchYahooSparkPeriodChangePercents,
  type YahooV7QuoteRow,
} from "@/lib/yahoo";

/** Yahoo spark `range` / `interval` for heatmap period returns (not used for 1 day). */
const HEATMAP_SPARK_QUERY: Record<Exclude<HeatmapRangeKey, "1d">, { range: string; interval: string }> = {
  "1w": { range: "5d", interval: "1d" },
  "1m": { range: "1mo", interval: "1d" },
  "3m": { range: "3mo", interval: "1d" },
  ytd: { range: "ytd", interval: "1d" },
  "1y": { range: "1y", interval: "1d" },
  "5y": { range: "5y", interval: "1wk" },
  max: { range: "max", interval: "1mo" },
};

function heatmapPeriodLabel(range: HeatmapRangeKey): string {
  return HEATMAP_RANGE_OPTIONS.find((o) => o.key === range)?.label ?? range;
}

export type Sp500HeatmapLeafJSON = {
  name: string;
  /** Full / long company name for tooltips (Yahoo); may be missing if quote failed. */
  companyName?: string;
  /** Treemap weight: market cap scaled by √|period return| (not raw cap). */
  size: number;
  changePct: number | null;
  o: number | null;
  h: number | null;
  l: number | null;
  c: number | null;
  searchSymbol: string;
  isLeaf: true;
};

export type Sp500HeatmapBranchJSON = {
  name: string;
  children: (Sp500HeatmapBranchJSON | Sp500HeatmapLeafJSON)[];
};

function leafSize(q: YahooV7QuoteRow | undefined): number {
  if (q?.marketCap != null && q.marketCap > 0) return q.marketCap;
  const c = q?.c;
  const sh = q?.sharesOutstanding;
  if (c != null && sh != null && c > 0 && sh > 0) return c * sh;
  return 500_000;
}

/**
 * Treemap `size` blends market cap with absolute % change for the **selected** period so
 * layout (not just color) shifts when the user changes 1D / 1M / YTD / etc.
 * Uses √|Δ%| so huge multi-month moves do not blow up the chart.
 */
function treemapSizeFromPerformance(baseCap: number, changePct: number | null): number {
  const base = Math.max(baseCap, 1000);
  if (changePct == null || !Number.isFinite(changePct)) {
    return Math.max(base * 0.32, 50_000);
  }
  const sqrtPct = Math.sqrt(Math.abs(changePct));
  const mult = Math.min(3.6, Math.max(0.2, 0.48 + sqrtPct * 0.34));
  return Math.max(base * mult, 50_000);
}

function leafFromTicker(
  ticker: string,
  q: YahooV7QuoteRow | undefined,
  changePct: number | null,
): Sp500HeatmapLeafJSON {
  const companyName = q?.companyName?.trim() || undefined;
  return {
    name: ticker,
    ...(companyName ? { companyName } : {}),
    size: treemapSizeFromPerformance(leafSize(q), changePct),
    changePct,
    o: q?.o ?? null,
    h: q?.h ?? null,
    l: q?.l ?? null,
    c: q?.c ?? null,
    searchSymbol: ticker,
    isLeaf: true,
  };
}

export async function buildSp500HeatmapPayload(
  range: HeatmapRangeKey = "1d",
): Promise<{
  generatedAt: string;
  /** ISO time — client may show “next refresh ~ …” */
  refreshAfter: string;
  range: HeatmapRangeKey;
  periodLabel: string;
  tree: Sp500HeatmapBranchJSON[];
}> {
  const quoteMap = await fetchYahooQuotesForFinnhubSymbols(SP500_TICKERS);
  let sparkMap: Map<string, number | null> | null = null;
  if (range !== "1d") {
    const sq = HEATMAP_SPARK_QUERY[range];
    sparkMap = await fetchYahooSparkPeriodChangePercents(SP500_TICKERS, sq.range, sq.interval);
  }

  const sectorMap = new Map<string, Map<string, Sp500HeatmapLeafJSON[]>>();

  for (const ticker of SP500_TICKERS) {
    const g = SP500_GICS[ticker] ?? { sector: "Unknown", industry: "Unknown" };
    const q = quoteMap.get(ticker);
    const changePct =
      range === "1d"
        ? (q?.changePct ?? null)
        : (sparkMap?.get(ticker) ?? null);
    const leaf = leafFromTicker(ticker, q, changePct);
    if (!sectorMap.has(g.sector)) sectorMap.set(g.sector, new Map());
    const indMap = sectorMap.get(g.sector)!;
    if (!indMap.has(g.industry)) indMap.set(g.industry, []);
    indMap.get(g.industry)!.push(leaf);
  }

  const tree: Sp500HeatmapBranchJSON[] = [];
  const sectorNames = [...sectorMap.keys()].sort((a, b) => a.localeCompare(b));
  for (const sectorName of sectorNames) {
    const indMap = sectorMap.get(sectorName)!;
    const industryChildren: Sp500HeatmapBranchJSON[] = [];
    const indNames = [...indMap.keys()].sort((a, b) => a.localeCompare(b));
    for (const indName of indNames) {
      const leaves = indMap.get(indName)!;
      industryChildren.push({ name: indName, children: leaves });
    }
    tree.push({ name: sectorName, children: industryChildren });
  }

  const generatedAt = new Date().toISOString();
  const refreshAfter = new Date(Date.now() + 3600_000).toISOString();
  const periodLabel = heatmapPeriodLabel(range);

  return { generatedAt, refreshAfter, range, periodLabel, tree };
}
