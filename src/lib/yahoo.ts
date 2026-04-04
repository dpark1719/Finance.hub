/**
 * Unofficial Yahoo Finance endpoints. Uses curl as HTTP transport to avoid
 * TLS fingerprint detection, cookie+crumb auth for quoteSummary, per-symbol
 * caches, and 429 retry with backoff.
 */

import { execSync } from "node:child_process";

import {
  YAHOO_CHART_PRESETS,
  type YahooChartRangeKey,
} from "@/lib/yahoo-chart-presets";

export type { YahooChartRangeKey } from "@/lib/yahoo-chart-presets";

const UA = "Mozilla/5.0 (compatible)";

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

/* ── curl-based HTTP transport (avoids TLS fingerprint blocking) ── */

interface CurlResult {
  status: number;
  body: string;
  headers: Record<string, string>;
}

function curlGet(
  url: string,
  opts?: { cookie?: string; extraHeaders?: Record<string, string>; timeout?: number },
): CurlResult {
  const hdrs = [
    `-H "User-Agent: ${UA}"`,
    `-H "Accept: application/json,text/plain,*/*"`,
    `-H "Accept-Language: en-US,en;q=0.9"`,
    `-H "Referer: https://finance.yahoo.com/"`,
  ];
  if (opts?.cookie) hdrs.push(`-H "Cookie: ${opts.cookie}"`);
  for (const [k, v] of Object.entries(opts?.extraHeaders ?? {})) {
    hdrs.push(`-H "${k}: ${v}"`);
  }
  const timeout = opts?.timeout ?? 30;
  const cmd = `curl -sS -m ${timeout} -D - ${hdrs.join(" ")} "${url}"`;
  const raw = execSync(cmd, {
    encoding: "utf-8",
    maxBuffer: 10 * 1024 * 1024,
    timeout: (timeout + 5) * 1000,
  });

  const headerEnd = raw.indexOf("\r\n\r\n");
  const headerSection = headerEnd >= 0 ? raw.slice(0, headerEnd) : "";
  const body = headerEnd >= 0 ? raw.slice(headerEnd + 4) : raw;

  let status = 0;
  const statusMatch = headerSection.match(/^HTTP\/[\d.]+ (\d+)/m);
  if (statusMatch) status = parseInt(statusMatch[1], 10);

  const headers: Record<string, string> = {};
  for (const line of headerSection.split("\r\n")) {
    const idx = line.indexOf(":");
    if (idx > 0) {
      const key = line.slice(0, idx).trim().toLowerCase();
      headers[key] = (headers[key] ? headers[key] + ", " : "") + line.slice(idx + 1).trim();
    }
  }
  return { status, body: body.trim(), headers };
}

/* ── Yahoo crumb + cookie session ─────────────────────────────── */

let crumbSession: { crumb: string; cookie: string; ts: number } | null = null;
const CRUMB_TTL_MS = 600_000;

function ensureCrumbSessionSync(): { crumb: string; cookie: string } {
  if (crumbSession && Date.now() - crumbSession.ts < CRUMB_TTL_MS) {
    return crumbSession;
  }

  const initRes = curlGet("https://fc.yahoo.com/", {
    extraHeaders: { Accept: "text/html" },
  });
  const setCookieRaw = initRes.headers["set-cookie"] ?? "";
  const cookieStr = setCookieRaw
    .split(/,(?=\s*\w+=)/)
    .map((c) => c.split(";")[0].trim())
    .filter(Boolean)
    .join("; ");

  const crumbRes = curlGet(
    "https://query2.finance.yahoo.com/v1/test/getcrumb",
    { cookie: cookieStr, extraHeaders: { Accept: "*/*" } },
  );
  if (crumbRes.status !== 200 || !crumbRes.body) {
    throw new Error(`Yahoo crumb fetch failed (${crumbRes.status})`);
  }

  crumbSession = { crumb: crumbRes.body.trim(), cookie: cookieStr, ts: Date.now() };
  return crumbSession;
}

/* ── High-level Yahoo fetchers using curl ─────────────────────── */

function yahooCurlJson<T>(url: string, auth = false): { status: number; data: T | null } {
  let cookie: string | undefined;
  let finalUrl = url;
  if (auth) {
    const sess = ensureCrumbSessionSync();
    cookie = sess.cookie;
    const sep = url.includes("?") ? "&" : "?";
    finalUrl = `${url}${sep}crumb=${encodeURIComponent(sess.crumb)}`;
  }
  const res = curlGet(finalUrl, { cookie });
  if (!res.body || res.status !== 200) return { status: res.status, data: null };
  try {
    return { status: res.status, data: JSON.parse(res.body) as T };
  } catch {
    return { status: res.status, data: null };
  }
}

async function yahooCurlJsonWithRetry<T>(
  url: string,
  auth = false,
): Promise<{ status: number; data: T | null }> {
  const backoffs = [0, 1500, 3000, 5000];
  let last: { status: number; data: T | null } = { status: 0, data: null };
  let refreshedCrumb = false;
  for (const wait of backoffs) {
    if (wait) await sleep(wait);
    last = yahooCurlJson<T>(url, auth);
    if (last.status === 401 && auth && !refreshedCrumb) {
      crumbSession = null;
      refreshedCrumb = true;
      last = yahooCurlJson<T>(url, auth);
    }
    if (last.status !== 429) return last;
  }
  return last;
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
  const { status, data: json } = await yahooCurlJsonWithRetry<{
    quoteSummary?: {
      error?: { description?: string };
      result?: Array<{
        financialData?: YahooQuoteFinancialData;
        cashflowStatementHistory?: {
          cashflowStatements?: Array<Record<string, { raw?: number; fmt?: string } | undefined>>;
        };
      }>;
    };
  }>(url, true);

  if (!json || status !== 200) {
    throw new Error(`Yahoo quoteSummary ${status}: ${status === 429 ? "Too Many Requests" : "failed"}`);
  }
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

  const chartUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ySym)}?interval=${interval}&range=${range}`;
  const { status, data: json } = await yahooCurlJsonWithRetry<{
    chart?: {
      error?: { description?: string };
      result?: Array<{
        timestamp?: number[];
        indicators?: { quote?: Array<{ close?: Array<number | null> }> };
        meta?: { currency?: string };
      }>;
    };
  }>(chartUrl, false);

  if (!json || status !== 200) {
    throw new Error(
      `Yahoo chart ${status}: ${status === 429 ? "Too Many Requests" : "failed"}`,
    );
  }
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

/** Free-text search (e.g. "google" when Finnhub returns no hits). */
export async function searchYahooFinance(
  query: string,
): Promise<{ symbol: string; name: string } | null> {
  const q = query.trim().slice(0, 64);
  if (!q) return null;

  type SearchResponse = {
    quotes?: Array<{
      symbol?: string;
      quoteType?: string;
      shortname?: string;
      longname?: string;
    }>;
  };

  const hosts = ["query2.finance.yahoo.com", "query1.finance.yahoo.com"];
  for (const host of hosts) {
    const url = `https://${host}/v1/finance/search?q=${encodeURIComponent(q)}`;
    const { status, data: json } = yahooCurlJson<SearchResponse>(url);
    if (status !== 200 || !json) continue;

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
