import { SP500_GICS, SP500_TICKERS } from "@/lib/sp500-lookup.generated";
import {
  fetchYahooQuotesForFinnhubSymbols,
  type YahooV7QuoteRow,
} from "@/lib/yahoo";

export type Sp500HeatmapLeafJSON = {
  name: string;
  /** Full / long company name for tooltips (Yahoo); may be missing if quote failed. */
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

function leafFromTicker(ticker: string, q: YahooV7QuoteRow | undefined): Sp500HeatmapLeafJSON {
  const companyName = q?.companyName?.trim() || undefined;
  return {
    name: ticker,
    ...(companyName ? { companyName } : {}),
    size: leafSize(q),
    changePct: q?.changePct ?? null,
    o: q?.o ?? null,
    h: q?.h ?? null,
    l: q?.l ?? null,
    c: q?.c ?? null,
    searchSymbol: ticker,
    isLeaf: true,
  };
}

export async function buildSp500HeatmapPayload(): Promise<{
  generatedAt: string;
  /** ISO time — client may show “next refresh ~ …” */
  refreshAfter: string;
  tree: Sp500HeatmapBranchJSON[];
}> {
  const quoteMap = await fetchYahooQuotesForFinnhubSymbols(SP500_TICKERS);
  const sectorMap = new Map<string, Map<string, Sp500HeatmapLeafJSON[]>>();

  for (const ticker of SP500_TICKERS) {
    const g = SP500_GICS[ticker] ?? { sector: "Unknown", industry: "Unknown" };
    const q = quoteMap.get(ticker);
    const leaf = leafFromTicker(ticker, q);
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

  return { generatedAt, refreshAfter, tree };
}
