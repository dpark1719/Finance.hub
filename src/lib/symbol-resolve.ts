import { resolveCommonStockAlias } from "@/lib/common-stock-aliases";
import { searchSymbols, type SymbolSearchHit } from "@/lib/finnhub";
import {
  isKospiListedSymbol,
  isKospiSixDigitCode,
  resolveKospiLookup,
} from "@/lib/kospi-lookup.generated";
import {
  isSp500Ticker,
  resolveSp500Lookup,
} from "@/lib/sp500-lookup.generated";
import { searchYahooFinance, yahooTickerToFinnhub } from "@/lib/yahoo";

export interface ResolvedQuery {
  symbol: string;
  /** Shown when user typed a company name or phrase. */
  resolutionNote: string | null;
}

/**
 * True if the string should be passed through as an exchange ticker (no search).
 */
export function looksLikeTickerSymbol(raw: string): boolean {
  const s = raw.trim();
  if (!s) return false;
  if (/\s/.test(s)) return false;
  const u = s.toUpperCase();
  if (!/^[A-Z0-9^.\-]+$/.test(u)) return false;
  // Title-case company name (Apple, Microsoft) — not a ticker
  if (/^[A-Z][a-z]{2,}$/.test(s)) return false;
  return true;
}

function scoreSearchHit(h: SymbolSearchHit): number {
  let sc = 0;
  if (h.primary === true) sc += 200;
  const t = (h.type ?? "").toLowerCase();
  if (t.includes("common stock")) sc += 80;
  if (t.includes("etf") || t.includes("fund")) sc -= 60;
  const ex = `${h.exchange ?? ""}${h.mic ?? ""}`.toUpperCase();
  if (/NASDAQ|NYSE|NMS|US\W/.test(ex) || ex === "US") sc += 40;
  const sym = (h.symbol ?? h.displaySymbol ?? "").toUpperCase();
  if (sym && isSp500Ticker(sym)) sc += 55;
  if (
    sym &&
    (isKospiListedSymbol(sym) ||
      isKospiSixDigitCode(sym.replace(/\.KS$/i, "")))
  ) {
    sc += 48;
  }
  return sc;
}

function pickBestHit(hits: SymbolSearchHit[]): SymbolSearchHit {
  const ranked = [...hits].sort(
    (a, b) => scoreSearchHit(b) - scoreSearchHit(a),
  );
  return ranked[0];
}

/**
 * Resolve "apple", "Google", "AAPL", "7203.T" → Finnhub symbol.
 */
export async function resolveStockQuery(raw: string): Promise<ResolvedQuery> {
  const q = raw.trim();
  if (!q) {
    return { symbol: "", resolutionNote: null };
  }
  if (looksLikeTickerSymbol(q)) {
    let sym = q.toUpperCase();
    if (/^\d{6}$/.test(sym) && isKospiSixDigitCode(sym)) {
      sym = `${sym}.KS`;
    }
    return { symbol: sym, resolutionNote: null };
  }

  const aliasedEarly = resolveCommonStockAlias(q);
  if (aliasedEarly) {
    return {
      symbol: aliasedEarly,
      resolutionNote: `Matched “${q}” → ${aliasedEarly} (well-known name)`,
    };
  }

  const sp500 = resolveSp500Lookup(q);
  if (sp500) {
    return {
      symbol: sp500,
      resolutionNote: `Matched “${q}” → ${sp500} (S&P 500)`,
    };
  }

  const kospi = resolveKospiLookup(q);
  if (kospi) {
    return {
      symbol: kospi,
      resolutionNote: `Matched “${q}” → ${kospi} (KOSPI)`,
    };
  }

  const { result } = await searchSymbols(q);
  const hits = result ?? [];
  if (hits.length === 0) {
    const yHit = await searchYahooFinance(q);
    if (!yHit) {
      throw new Error(
        `No listings match “${q}”. Try a ticker (e.g. AAPL, GOOGL) or another spelling.`,
      );
    }
    const sym = yahooTickerToFinnhub(yHit.symbol);
    return {
      symbol: sym,
      resolutionNote: `Matched “${q}” → ${sym} (${yHit.name})`,
    };
  }
  const best = pickBestHit(hits);
  const sym = (best.symbol ?? best.displaySymbol ?? "").toUpperCase();
  if (!sym) {
    throw new Error(`Could not resolve a symbol for “${q}”.`);
  }
  const label = best.description?.trim() || sym;
  return {
    symbol: sym,
    resolutionNote: `Matched “${q}” → ${sym} (${label})`,
  };
}
