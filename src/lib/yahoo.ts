/**
 * Unofficial Yahoo Finance endpoints. Uses cookie + crumb auth for
 * quoteSummary, rate limit retries, per-symbol caches, and host failover.
 */

import {
  YAHOO_CHART_PRESETS,
  type YahooChartRangeKey,
} from "@/lib/yahoo-chart-presets";

export type { YahooChartRangeKey } from "@/lib/yahoo-chart-presets";

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";

const sleep = (ms: number): Promise<void> =>
  new Promise((r) => setTimeout(r, ms));

type Timed<T> = { at: number; data: T };
const CACHE_TTL_MS = 120_000;
const CHART_CACHE_TTL_MS = 90_000;
const fundCache = new Map<string, Timed<YahooFundamentals>>();
const chartCache = new Map<string, Timed<YahooChartResult>>();

function cacheGet<T>(m: Map<string, Timed<T>>, key: string, ttl: number): T | undefined {
  const e = m.get(key);
  if (!e) return undefined;
  if (Date.now() - e.at > ttl) {
    m.delete(key);
    return undefined;
  }
  return e.data;
}

function cacheSet<T>(m: Map<string, Timed<T>>, key: string, data: T) {
  m.set(key, { at: Date.now(), data });
}

/* ── Yahoo crumb + cookie session ─────────────────────────────── */

let crumbSession: { crumb: string; cookie: string; ts: number } | null = null;
const CRUMB_TTL_MS = 600_000; // refresh every 10 min

async function ensureCrumbSession(): Promise<{ crumb: string; cookie: string }> {
  if (crumbSession && Date.now() - crumbSession.ts < CRUMB_TTL_MS) {
    return crumbSession;
  }

  const initRes = await fetch("https://fc.yahoo.com/", {
    cache: "no-store",
    headers: { "User-Agent": UA },
    redirect: "manual",
  });
  await initRes.text().catch(() => "");

  let cookieStr = "";
  const getSetCookie = initRes.headers.getSetCookie;
  if (typeof getSetCookie === "function") {
    const setCookies = getSetCookie.call(initRes.headers);
    cookieStr = setCookies
      .map((c: string) => c.split(";")[0])
      .filter(Boolean)
      .join("; ");
  }
  if (!cookieStr) {
    const raw = initRes.headers.get("set-cookie") ?? "";
    cookieStr = raw
      .split(/,(?=\s*\w+=)/)
      .map((c) => c.split(";")[0].trim())
      .filter(Boolean)
      .join("; ");
  }

  const crumbBackoffs = [0, 2000, 4000];
  let crumb = "";
  let crumbStatus = 0;
  for (const wait of crumbBackoffs) {
    if (wait) await sleep(wait);
    const crumbRes = await fetch(
      "https://query2.finance.yahoo.com/v1/test/getcrumb",
      {
        cache: "no-store",
        headers: { "User-Agent": UA, Cookie: cookieStr },
      },
    );
    crumbStatus = crumbRes.status;
    if (crumbRes.status === 200) {
      crumb = (await crumbRes.text()).trim();
      break;
    }
    await crumbRes.text().catch(() => "");
    if (crumbRes.status !== 429) break;
  }

  if (!crumb) {
    throw new Error(`Yahoo crumb fetch failed (${crumbStatus})`);
  }

  crumbSession = { crumb, cookie: cookieStr, ts: Date.now() };
  return crumbSession;
}

/* ── HTTP helpers ─────────────────────────────────────────────── */

async function yahooGet(url: string): Promise<Response> {
  return fetch(url, {
    cache: "no-store",
    headers: {
      "User-Agent": UA,
      Accept: "application/json,text/plain,*/*",
      "Accept-Language": "en-US,en;q=0.9",
      Referer: "https://finance.yahoo.com/",
    },
  });
}

async function yahooGetAuth(url: string): Promise<Response> {
  const session = await ensureCrumbSession();
  const sep = url.includes("?") ? "&" : "?";
  const authedUrl = `${url}${sep}crumb=${encodeURIComponent(session.crumb)}`;
  return fetch(authedUrl, {
    cache: "no-store",
    headers: {
      "User-Agent": UA,
      Accept: "application/json,text/plain,*/*",
      "Accept-Language": "en-US,en;q=0.9",
      Referer: "https://finance.yahoo.com/",
      Cookie: session.cookie,
    },
  });
}

/** Exponential backoff on 429; re-fetch crumb once on 401. */
async function yahooGetWithRetry(
  url: string,
  auth = false,
): Promise<Response> {
  const max = 5;
  const backoffs = [0, 1500, 3000, 5000, 8000];
  let last: Response | null = null;
  let refreshedCrumb = false;
  for (let i = 0; i < max; i++) {
    if (backoffs[i]) await sleep(backoffs[i]);
    last = auth ? await yahooGetAuth(url) : await yahooGet(url);
    if (last.status === 401 && auth && !refreshedCrumb) {
      crumbSession = null;
      refreshedCrumb = true;
      last = await yahooGetAuth(url);
    }
    if (last.status !== 429) return last;
  }
  return last!;
}

export function toYahooSymbol(finnhubSymbol: string): string {
  const s = finnhubSymbol.trim().toUpperCase();
  if (/^[A-Z]+\.[A-Z]{1,3}$/.test(s)) {
    return s.replace(".", "-");
  }
  return s;
}

export interface YahooChartPoint {
  t: number;
  c: number;
}

export interface YahooChartResult {
  symbol: string;
  currency: string | null;
  points: YahooChartPoint[];
}

export interface YahooPriceTarget {
  targetMean?: number;
  targetHigh?: number;
  targetLow?: number;
  lastUpdated?: string;
}

export interface YahooFundamentals {
  target: YahooPriceTarget | null;
  fcf: { value: number; periodLabel: string } | null;
}

function parseTargetFromResult(
  fd: YahooQuoteFinancialData | undefined,
): YahooPriceTarget | null {
  if (!fd) return null;
  const mean = fd.targetMeanPrice?.raw;
  const high = fd.targetHighPrice?.raw;
  const low = fd.targetLowPrice?.raw;
  if (mean == null && high == null && low == null) return null;
  return { targetMean: mean, targetHigh: high, targetLow: low, lastUpdated: undefined };
}

type YahooQuoteFinancialData = {
  targetMeanPrice?: { raw?: number };
  targetHighPrice?: { raw?: number };
  targetLowPrice?: { raw?: number };
};

function parseFcfFromResult(
  r0: {
    cashflowStatementHistory?: {
      cashflowStatements?: Array<Record<string, { raw?: number; fmt?: string } | undefined>>;
    };
  } | undefined,
): { value: number; periodLabel: string } | null {
  const stmts = r0?.cashflowStatementHistory?.cashflowStatements;
  if (!stmts?.length) return null;
  const row = stmts[0] as Record<string, { raw?: number; fmt?: string } | undefined>;
  const endRaw = row.endDate;
  const end =
    (typeof endRaw === "object" && endRaw?.fmt) ||
    (typeof endRaw === "object" && endRaw?.raw != null && String(endRaw.raw)) ||
    "latest";
  let fcf: number | undefined =
    row.freeCashflow?.raw ?? row.freeCashFlow?.raw ?? row.free_cash_flow?.raw;
  if (typeof fcf !== "number" || !Number.isFinite(fcf)) {
    for (const k of Object.keys(row)) {
      if (/free/i.test(k) && /cash/i.test(k)) {
        const v = row[k]?.raw;
        if (typeof v === "number" && Number.isFinite(v)) {
          fcf = v;
          break;
        }
      }
    }
  }
  if (typeof fcf !== "number" || !Number.isFinite(fcf)) return null;
  return { value: fcf, periodLabel: String(end) };
}

/** One HTTP call: analyst target + cash flow history (cuts Yahoo traffic ~50%). */
export async function fetchYahooFundamentals(finnhubSymbol: string): Promise<YahooFundamentals> {
  const ySym = toYahooSymbol(finnhubSymbol);
  const key = `fund:${ySym}`;
  const hit = cacheGet(fundCache, key, CACHE_TTL_MS);
  if (hit) return hit;

  const modules = "financialData%2CcashflowStatementHistory";
  const url = `https://query2.finance.yahoo.com/v10/finance/quoteSummary/${encodeURIComponent(ySym)}?modules=${modules}`;
  const res = await yahooGetWithRetry(url, true);
  if (!res.ok) {
    throw new Error(`Yahoo quoteSummary ${res.status}: ${res.status === 429 ? "Too Many Requests" : res.statusText}`);
  }
  const json = (await res.json()) as {
    quoteSummary?: {
      error?: { description?: string };
      result?: Array<{
        financialData?: YahooQuoteFinancialData;
        cashflowStatementHistory?: {
          cashflowStatements?: Array<Record<string, { raw?: number; fmt?: string } | undefined>>;
        };
      }>;
    };
  };
  const qe = json.quoteSummary?.error;
  if (qe?.description) throw new Error(qe.description);
  const r0 = json.quoteSummary?.result?.[0];
  const out: YahooFundamentals = {
    target: parseTargetFromResult(r0?.financialData),
    fcf: parseFcfFromResult(r0),
  };
  cacheSet(fundCache, key, out);
  return out;
}

/** Space out chart after quoteSummary to reduce 429 bursts (call from report after fundamentals). */
export function yahooSpacingBeforeChart(): Promise<void> {
  return sleep(2500);
}

export async function fetchYahooChart(
  finnhubSymbol: string,
  key: YahooChartRangeKey,
): Promise<YahooChartResult> {
  const ySym = toYahooSymbol(finnhubSymbol);
  const { range, interval } = YAHOO_CHART_PRESETS[key];
  const ckey = `chart:${ySym}:${range}:${interval}`;
  const cached = cacheGet(chartCache, ckey, CHART_CACHE_TTL_MS);
  if (cached) return cached;

  const chartHosts = ["query1.finance.yahoo.com", "query2.finance.yahoo.com"];
  let res: Response | null = null;
  for (const host of chartHosts) {
    const url = `https://${host}/v8/finance/chart/${encodeURIComponent(ySym)}?interval=${interval}&range=${range}`;
    res = await yahooGetWithRetry(url);
    if (res.status !== 429) break;
    await sleep(1500);
  }
  if (!res || !res.ok) {
    const st = res?.status ?? 0;
    throw new Error(
      `Yahoo chart ${st}: ${st === 429 ? "Too Many Requests" : res?.statusText ?? "failed"}`,
    );
  }
  const json = (await res.json()) as {
    chart?: {
      error?: { description?: string };
      result?: Array<{
        timestamp?: number[];
        indicators?: { quote?: Array<{ close?: Array<number | null> }> };
        meta?: { currency?: string };
      }>;
    };
  };
  const err = json.chart?.error;
  if (err?.description) throw new Error(err.description);
  const r = json.chart?.result?.[0];
  const ts = r?.timestamp;
  const closes = r?.indicators?.quote?.[0]?.close;
  if (!ts?.length || !closes?.length || ts.length !== closes.length) {
    throw new Error("Yahoo chart: missing series");
  }
  const points: YahooChartPoint[] = [];
  for (let i = 0; i < ts.length; i++) {
    const c = closes[i];
    if (typeof c === "number" && Number.isFinite(c)) {
      points.push({ t: ts[i], c });
    }
  }
  if (!points.length) throw new Error("Yahoo chart: no valid closes");
  const result: YahooChartResult = {
    symbol: ySym,
    currency: r?.meta?.currency ?? null,
    points,
  };
  cacheSet(chartCache, ckey, result);
  return result;
}

export async function fetchYahooClosesForRsi(finnhubSymbol: string): Promise<number[]> {
  const chart = await fetchYahooChart(finnhubSymbol, "3m");
  return chart.points.map((p) => p.c);
}

export async function fetchYahooPriceTarget(finnhubSymbol: string): Promise<YahooPriceTarget | null> {
  return (await fetchYahooFundamentals(finnhubSymbol)).target;
}

export async function fetchYahooLatestFreeCashflow(
  finnhubSymbol: string,
): Promise<{ value: number; periodLabel: string } | null> {
  return (await fetchYahooFundamentals(finnhubSymbol)).fcf;
}

/** Free-text search (e.g. "google" when Finnhub returns no hits). Avoid hammering Yahoo on 429 — no multi-retry loop. */
export async function searchYahooFinance(
  query: string,
): Promise<{ symbol: string; name: string } | null> {
  const q = query.trim().slice(0, 64);
  if (!q) return null;

  const urls = [
    `https://query2.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(q)}`,
    `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(q)}`,
  ];

  for (const url of urls) {
    let res = await yahooGet(url);
    if (res.status === 429) {
      await sleep(2000);
      res = await yahooGet(url);
    }
    if (!res.ok) continue;

    let json: {
      quotes?: Array<{
        symbol?: string;
        quoteType?: string;
        shortname?: string;
        longname?: string;
      }>;
    };
    try {
      json = (await res.json()) as typeof json;
    } catch {
      continue;
    }

    const quotes = json.quotes ?? [];
    const equities = quotes.filter((x) => x.quoteType === "EQUITY");
    const pick = equities[0] ?? quotes[0];
    if (!pick?.symbol) continue;
    const name = pick.longname?.trim() || pick.shortname?.trim() || pick.symbol;
    return { symbol: pick.symbol.trim().toUpperCase(), name };
  }
  return null;
}

/** Yahoo uses BRK-B; Finnhub uses BRK.B for class shares. */
export function yahooTickerToFinnhub(yahooSym: string): string {
  const u = yahooSym.trim().toUpperCase();
  const m = /^([A-Z0-9]+)\-([A-Z]{1,3})$/.exec(u);
  if (m) return `${m[1]}.${m[2]}`;
  return u;
}
