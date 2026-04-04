import { NextRequest, NextResponse } from "next/server";

/** Frankfurter ECB rates API (see https://www.frankfurter.app/). `api.frankfurter.dev` returned 404 in testing; `api.frankfurter.app` is the working host. */
const FRANKFURTER_BASE = "https://api.frankfurter.app";

const CACHE_TTL_MS = 5 * 60 * 1000;

/** Days of history per `range` query param (Frankfurter time series). */
const RANGE_DAYS: Record<string, number> = {
  "1m": 30,
  "3m": 90,
  "6m": 180,
  "1y": 365,
  "5y": 1825,
  max: 9999,
};

function normalizeRange(raw: string | null): string {
  const v = (raw ?? "1m").trim().toLowerCase();
  return v in RANGE_DAYS ? v : "1m";
}

function rangeToHistoryDays(range: string): number {
  return RANGE_DAYS[range] ?? 30;
}

type CachedBody = {
  base: string;
  date: string;
  rates: Record<string, number>;
  history: {
    dates: string[];
    rates: Record<string, number[]>;
  };
};

const cache = new Map<string, { expires: number; body: CachedBody }>();

function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function buildSearchParams(
  from: string,
  currencies: string[],
): URLSearchParams {
  const params = new URLSearchParams();
  params.set("from", from);
  params.set("to", currencies.join(","));
  return params;
}

function parseCurrencyList(raw: string | null): string[] {
  if (!raw || !raw.trim()) {
    return ["JPY", "KRW", "EUR"];
  }
  return raw
    .split(",")
    .map((s) => s.trim().toUpperCase())
    .filter(Boolean);
}

function cacheKey(from: string, currencies: string[], range: string): string {
  const sorted = [...currencies].sort().join(",");
  return `${from.toUpperCase()}:${sorted}:${range}`;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const from = (searchParams.get("from") ?? "USD").trim().toUpperCase() || "USD";
  const currencies = parseCurrencyList(searchParams.get("to"));
  const range = normalizeRange(searchParams.get("range"));
  const historyDays = rangeToHistoryDays(range);
  const amountRaw = searchParams.get("amount");
  const amount =
    amountRaw !== null && amountRaw !== ""
      ? Number.parseFloat(amountRaw)
      : undefined;

  if (currencies.length === 0) {
    return NextResponse.json(
      { error: "At least one target currency is required in `to`." },
      { status: 400 },
    );
  }

  const key = cacheKey(from, currencies, range);
  const now = Date.now();
  let body: CachedBody;

  const hit = cache.get(key);
  if (hit && hit.expires > now) {
    body = hit.body;
  } else {
    const params = buildSearchParams(from, currencies);

    const end = new Date();
    const start = new Date(end);
    start.setUTCDate(start.getUTCDate() - historyDays);
    const startDate = formatDate(start);
    const endDate = formatDate(end);

    const latestUrl = `${FRANKFURTER_BASE}/latest?${params.toString()}`;
    const historyUrl = `${FRANKFURTER_BASE}/${startDate}..${endDate}?${params.toString()}`;

    let latest: {
      base: string;
      date: string;
      rates: Record<string, number>;
    };
    let series: {
      rates: Record<string, Record<string, number>>;
    };

    try {
      const [latestRes, seriesRes] = await Promise.all([
        fetch(latestUrl, { redirect: "follow" }),
        fetch(historyUrl, { redirect: "follow" }),
      ]);

      if (!latestRes.ok) {
        const text = await latestRes.text();
        return NextResponse.json(
          { error: `Latest rates failed: ${latestRes.status}`, detail: text },
          { status: 502 },
        );
      }
      if (!seriesRes.ok) {
        const text = await seriesRes.text();
        return NextResponse.json(
          { error: `History failed: ${seriesRes.status}`, detail: text },
          { status: 502 },
        );
      }

      latest = (await latestRes.json()) as typeof latest;
      series = (await seriesRes.json()) as typeof series;
    } catch (e) {
      const message = e instanceof Error ? e.message : "Upstream fetch error";
      return NextResponse.json({ error: message }, { status: 502 });
    }

    const dates = Object.keys(series.rates).sort();
    const historyRates: Record<string, number[]> = {};
    for (const c of currencies) {
      historyRates[c] = dates.map((d) => {
        const day = series.rates[d];
        return day && typeof day[c] === "number" ? day[c] : NaN;
      });
    }

    body = {
      base: latest.base,
      date: latest.date,
      rates: latest.rates,
      history: {
        dates,
        rates: historyRates,
      },
    };

    cache.set(key, { expires: now + CACHE_TTL_MS, body });
  }

  const payload: Record<string, unknown> = {
    base: body.base,
    date: body.date,
    rates: body.rates,
    history: body.history,
  };

  if (amount !== undefined && Number.isFinite(amount)) {
    const converted: Record<string, number> = {};
    for (const c of currencies) {
      const rate = body.rates[c];
      if (typeof rate === "number") {
        converted[c] = amount * rate;
      }
    }
    payload.converted = converted;
  }

  return NextResponse.json(payload);
}
