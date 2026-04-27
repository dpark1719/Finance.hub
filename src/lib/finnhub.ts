import { getFinnhubApiKey } from "@/lib/server-env";

/** Trailing slash required: `new URL("/quote", base)` would drop `/api/v1` and hit the wrong HTML page. */
const FINNHUB_BASE = "https://finnhub.io/api/v1/";

export class FinnhubError extends Error {
  Status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "FinnhubError";
    this.Status = status;
  }
}

export function isFinnhubForbidden(e: unknown): boolean {
  return e instanceof FinnhubError && e.Status === 403;
}

/** Free tier: 403 (no access) or 429 (rate limit) — treat both as “try Yahoo”. */
export function isFinnhubBlockedOrRateLimited(e: unknown): boolean {
  return e instanceof FinnhubError && (e.Status === 403 || e.Status === 429);
}

function getToken(): string {
  const key = getFinnhubApiKey();
  if (!key) {
    throw new Error("FINNHUB_API_KEY is not set");
  }
  return key;
}

async function finnhubFetch<T>(path: string, params: Record<string, string>): Promise<T> {
  const token = getToken();
  const pathClean = path.replace(/^\//, "");
  const url = new URL(pathClean, FINNHUB_BASE);
  url.searchParams.set("token", token);
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }

  const doFetch = () => fetch(url.toString(), { cache: "no-store" });

  let res = await doFetch();
  if (res.status === 429) {
    await new Promise((r) => setTimeout(r, 1250));
    res = await doFetch();
  }
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    let detail = text || res.statusText;
    try {
      const j = JSON.parse(text) as { error?: string };
      if (typeof j.error === "string") detail = j.error;
    } catch {
      /* use raw text */
    }
    throw new FinnhubError(`${res.status}: ${detail}`.slice(0, 500), res.status);
  }
  const body = await res.text();
  try {
    return JSON.parse(body) as T;
  } catch {
    throw new FinnhubError(`Invalid JSON (HTML or error page?): ${body.slice(0, 160)}`, res.status);
  }
}

export interface Quote {
  c?: number;
  d?: number;
  dp?: number;
  h?: number;
  l?: number;
  o?: number;
  pc?: number;
  t?: number;
}

export interface Profile {
  name?: string;
  ticker?: string;
  exchange?: string;
  currency?: string;
  country?: string;
  finnhubIndustry?: string;
  weburl?: string;
  logo?: string;
  ipo?: string;
  shareOutstanding?: number;
}

export interface PriceTarget {
  lastUpdated?: string;
  targetHigh?: number;
  targetLow?: number;
  targetMean?: number;
  targetMedian?: number;
}

export type StockMetricBag = Record<string, number | string | null | undefined>;

export interface StockMetricResponse {
  metric?: StockMetricBag;
  metricType?: string;
  symbol?: string;
}

export interface FinancialPeriod {
  period?: string;
  year?: number;
  quarter?: number;
  /** Line labels vary; we scan for free cash flow */
  [key: string]: string | number | undefined | null | Record<string, unknown>;
}

export interface FinancialsResponse {
  symbol?: string;
  data?: FinancialPeriod[];
}

export interface IndicatorResponse {
  indicator?: Array<{ rsi?: number[] }>;
  technicalIndicator?: { rsi?: number[] };
}

export interface SymbolSearchHit {
  description?: string;
  displaySymbol?: string;
  symbol?: string;
  type?: string;
  primary?: boolean;
  exchange?: string /** exchange code, e.g. US */;
  mic?: string;
}

export interface SymbolSearchResponse {
  count?: number;
  result?: SymbolSearchHit[];
}

/** Resolve company names and partial tickers (e.g. "apple" → AAPL). */
export async function searchSymbols(query: string) {
  return finnhubFetch<SymbolSearchResponse>("search", {
    q: query.trim().slice(0, 64),
  });
}

export async function fetchQuote(symbol: string) {
  return finnhubFetch<Quote>("/quote", { symbol });
}

export async function fetchProfile(symbol: string) {
  return finnhubFetch<Profile>("/stock/profile2", { symbol });
}

export async function fetchPriceTarget(symbol: string) {
  return finnhubFetch<PriceTarget>("/stock/price-target", { symbol });
}

export async function fetchStockMetrics(symbol: string) {
  return finnhubFetch<StockMetricResponse>("/stock/metric", {
    symbol,
    metric: "all",
  });
}

export async function fetchCashFlows(symbol: string) {
  return finnhubFetch<FinancialsResponse>("/stock/financials", {
    symbol,
    statement: "cf",
    freq: "annual",
  });
}

export async function fetchIndicatorsRsi(symbol: string) {
  const to = Math.floor(Date.now() / 1000);
  const from = to - 400 * 24 * 60 * 60;
  return finnhubFetch<IndicatorResponse>("/indicator", {
    symbol,
    resolution: "D",
    from: String(from),
    to: String(to),
    indicator: "rsi",
  });
}

export interface CandleResponse {
  c?: number[];
  t?: number[];
  s?: string;
}

export async function fetchCandlesDaily(symbol: string) {
  const to = Math.floor(Date.now() / 1000);
  const from = to - 120 * 24 * 60 * 60;
  return finnhubFetch<CandleResponse>("/stock/candle", {
    symbol,
    resolution: "D",
    from: String(from),
    to: String(to),
  });
}

export function lastRsiFromIndicator(res: IndicatorResponse | undefined): number | null {
  const series =
    res?.indicator?.[0]?.rsi ?? res?.technicalIndicator?.rsi;
  if (!series?.length) return null;
  for (let i = series.length - 1; i >= 0; i--) {
    const v = series[i];
    if (typeof v === "number" && Number.isFinite(v)) return v;
  }
  return null;
}

export function num(m: StockMetricBag | undefined, keys: string[]): number | null {
  if (!m) return null;
  for (const k of keys) {
    const v = m[k];
    if (v == null || v === "") continue;
    const n = typeof v === "number" ? v : parseFloat(String(v));
    if (!Number.isFinite(n)) continue;
    return n;
  }
  return null;
}

/**
 * Best-effort FCF from annual cash-flow statements, metric bag, or derived
 * from price-to-FCF ratios in the metric bag (pfcfShareTTM / pfcfShareAnnual).
 */
export function extractFcf(
  cf: FinancialsResponse | undefined,
  metrics: StockMetricBag | undefined,
  lastPrice?: number | null,
): { value: number | null; period: string | null; perShare: boolean } {
  const m = metrics ?? {};
  const totalKeys = ["freeCashFlowTTM", "freeCashFlowAnnual", "freeCashflowTTM"];
  const perShareKeys = ["fcfPerShareTTM", "freeCashFlowPerShareTTM"];
  const total = num(m, totalKeys);
  if (total != null) {
    return { value: total, period: "TTM / reported metric", perShare: false };
  }
  const per = num(m, perShareKeys);
  if (per != null) {
    return { value: per, period: "TTM (per share)", perShare: true };
  }

  if (lastPrice != null && lastPrice > 0) {
    const pfcf = num(m, ["pfcfShareTTM", "pfcfShareAnnual"]);
    if (pfcf != null && pfcf > 0) {
      const fcfPerShare = lastPrice / pfcf;
      return { value: fcfPerShare, period: "TTM (derived)", perShare: true };
    }
  }

  const data = cf?.data;
  if (!data?.length) return { value: null, period: null, perShare: false };

  const period = data[0];
  const labelCandidates = [
    "freeCashFlow",
    "freeCashFlows",
    "fcf",
    "Free Cash Flow",
  ];
  for (const row of data) {
    for (const key of Object.keys(row)) {
      const lowered = key.toLowerCase();
      if (
        labelCandidates.some(
          (c) => lowered.includes(c.replace(/\s/g, "").toLowerCase()) || lowered.includes("freecashflow"),
        ) ||
        (lowered.includes("free") && lowered.includes("cash"))
      ) {
        const v = row[key];
        if (typeof v === "number" && Number.isFinite(v)) {
          return {
            value: v,
            period: String(row.period ?? row.year ?? ""),
            perShare: false,
          };
        }
      }
    }
  }
  return {
    value: null,
    period: period?.period ? String(period.period) : null,
    perShare: false,
  };
}
