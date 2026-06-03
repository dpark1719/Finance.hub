import { KOSPI_200_GICS, KOSPI_200_NAMES, KOSPI_200_TICKERS } from "@/lib/kospi-lookup.generated";
import { getKrEquitySession } from "@/lib/kr-market-hours";
import {
  fetchYahooFundamentals,
  fetchYahooQuotesForFinnhubSymbols,
} from "@/lib/yahoo";
import type { Sp500TopUpsidePayloadJSON, Sp500TopUpsideRowJSON } from "@/types/sp500-top-upside";

const FUNDAMENTALS_CONCURRENCY = 24;

async function poolMap<T, R>(
  items: readonly T[],
  concurrency: number,
  mapper: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let cursor = 0;

  async function worker(): Promise<void> {
    while (true) {
      const i = cursor++;
      if (i >= items.length) return;
      results[i] = await mapper(items[i], i);
    }
  }

  const n = Math.min(Math.max(1, concurrency), Math.max(1, items.length));
  await Promise.all(Array.from({ length: n }, () => worker()));
  return results;
}

export async function buildKospiTopUpsidePayload(): Promise<Sp500TopUpsidePayloadJSON> {
  const quoteMap = await fetchYahooQuotesForFinnhubSymbols(KOSPI_200_TICKERS);

  const symbolsWithPrice = KOSPI_200_TICKERS.filter((t) => {
    const c = quoteMap.get(t)?.c;
    return c != null && c > 0;
  });

  const targetBySymbol = new Map<string, number | null>();

  for (const sym of symbolsWithPrice) {
    const tm = quoteMap.get(sym)?.targetMean;
    if (tm != null && Number.isFinite(tm)) targetBySymbol.set(sym, tm);
  }

  const needFundamentals = symbolsWithPrice.filter((t) => !targetBySymbol.has(t));

  const fundRows = await poolMap(needFundamentals, FUNDAMENTALS_CONCURRENCY, async (sym) => {
    try {
      const f = await fetchYahooFundamentals(sym);
      return { sym, mean: f.target?.targetMean ?? null };
    } catch {
      return { sym, mean: null };
    }
  });

  for (const { sym, mean } of fundRows) {
    targetBySymbol.set(sym, mean);
  }

  const scored: Sp500TopUpsideRowJSON[] = [];

  for (const sym of symbolsWithPrice) {
    const q = quoteMap.get(sym);
    const last = q?.c;
    if (last == null || last <= 0) continue;
    const targetMean = targetBySymbol.get(sym);
    if (targetMean == null || !Number.isFinite(targetMean)) continue;

    const upsidePct = ((targetMean - last) / last) * 100;
    const gics = KOSPI_200_GICS[sym] ?? { sector: "Unknown", industry: "Unknown" };
    const wikiName = KOSPI_200_NAMES[sym];

    scored.push({
      symbol: sym,
      name: q?.companyName ?? q?.shortName ?? wikiName ?? null,
      sector: gics.sector,
      industry: gics.industry,
      lastPrice: last,
      targetMean,
      upsidePct,
      currency: q?.currency ?? "KRW",
    });
  }

  scored.sort((a, b) => b.upsidePct - a.upsidePct);
  const positive = scored.filter((r) => r.upsidePct > 0);
  const rows = positive.slice(0, 10);

  const negative = scored.filter((r) => r.upsidePct < 0);
  negative.sort((a, b) => a.upsidePct - b.upsidePct);
  const losers = negative.slice(0, 10);

  const generatedAt = new Date().toISOString();
  const refreshAfter = new Date(Date.now() + 900_000).toISOString();

  return {
    generatedAt,
    refreshAfter,
    marketSession: getKrEquitySession(),
    periodLabel: "Consensus mean target vs. last price (Yahoo, KOSPI 200)",
    rows,
    losers,
  };
}
