import { fetchCnnFearGreed } from "@/lib/fear-greed";
import {
  extractFcf,
  fetchCashFlows,
  fetchCandlesDaily,
  fetchIndicatorsRsi,
  fetchPriceTarget,
  fetchProfile,
  fetchQuote,
  fetchStockMetrics,
  isFinnhubForbidden,
  lastRsiFromIndicator,
  num,
  type Profile,
  type StockMetricBag,
} from "@/lib/finnhub";
import {
  fetchYahooClosesForRsi,
  fetchYahooFinnhubFallback,
  fetchYahooFundamentals,
  yahooSpacingBeforeChart,
  type YahooFundamentals,
} from "@/lib/yahoo";
import {
  buildMetricBlock,
  gradeBeta,
  gradeDe,
  gradeFcf,
  gradeFearGreed,
  gradePayout,
  gradePeg,
  gradePe,
  gradeRoe,
  gradeRsi,
  gradeUpside,
} from "@/lib/grades";
import { rsiFromCloses } from "@/lib/rsi";
import type { StockReport } from "@/types/report";

function rejectionReason(err: unknown): string {
  if (err instanceof Error) return err.message;
  return String(err);
}

function normalizeGrowthRate(raw: number | null): number | null {
  if (raw == null || !Number.isFinite(raw)) return null;
  if (Math.abs(raw) < 1) return raw * 100;
  return raw;
}

function computePeg(pe: number | null, metrics: StockMetricBag | undefined): number | null {
  const direct = num(metrics ?? {}, ["pegTTM", "pegRatioTTM", "pegFiveYearAvg"]);
  if (direct != null && direct > 0) return direct;
  if (pe == null || pe <= 0) return null;
  const gRaw = num(metrics ?? {}, [
    "epsGrowthTTMYoy",
    "epsGrowthQuarterlyYoy",
    "revenueGrowthTTMYoy",
    "revenueGrowthQuarterlyYoy",
  ]);
  const g = normalizeGrowthRate(gRaw);
  if (g == null || g <= 0) return null;
  return pe / g;
}

function computePayoutPct(metrics: StockMetricBag | undefined): number | null {
  const dps = num(metrics ?? {}, ["dividendPerShareTTM", "dividendPerShareAnnual"]);
  const eps = num(metrics ?? {}, ["epsTTM", "epsBasicTTM", "epsAnnual"]);
  if (dps == null || eps == null || eps <= 0) return null;
  return (dps / eps) * 100;
}

function totalFcf(
  fcfRaw: number | null,
  perShare: boolean,
  profile: Profile | undefined,
): number | null {
  if (fcfRaw == null) return null;
  if (!perShare) return fcfRaw;
  const sh = profile?.shareOutstanding;
  if (typeof sh !== "number" || !Number.isFinite(sh) || sh <= 0) return fcfRaw;
  // Finnhub profile reports shareOutstanding in millions
  return fcfRaw * sh * 1_000_000;
}

export async function buildStockReport(
  symbolRaw: string,
  resolutionNote: string | null = null,
): Promise<StockReport> {
  const symbol = symbolRaw.trim().toUpperCase();
  let warnings: string[] = [];
  if (!symbol) {
    return {
      symbol: "",
      name: null,
      exchange: null,
      currency: null,
      lastPrice: null,
      asOf: new Date().toISOString(),
      metrics: [],
      warnings: ["Enter a valid ticker symbol."],
      resolutionNote: resolutionNote ?? null,
    };
  }

  const [quoteRes, profileRes, targetRes, metricRes, cfRes, fgRes, rsiRes, candleRes] =
    await Promise.allSettled([
      fetchQuote(symbol),
      fetchProfile(symbol),
      fetchPriceTarget(symbol),
      fetchStockMetrics(symbol),
      fetchCashFlows(symbol),
      fetchCnnFearGreed(),
      fetchIndicatorsRsi(symbol),
      fetchCandlesDaily(symbol),
    ]);

  let quote = quoteRes.status === "fulfilled" ? quoteRes.value : null;
  if (quoteRes.status === "rejected") {
    warnings.push(`Quote request failed: ${rejectionReason(quoteRes.reason)}`);
  }
  let profile = profileRes.status === "fulfilled" ? profileRes.value : null;
  if (profileRes.status === "rejected") {
    warnings.push(`Profile request failed: ${rejectionReason(profileRes.reason)}`);
  }
  let stockMetric =
    metricRes.status === "fulfilled" ? metricRes.value : null;
  if (metricRes.status === "rejected") {
    warnings.push(
      `Fundamental metrics request failed: ${rejectionReason(metricRes.reason)}`,
    );
  }
  const cf = cfRes.status === "fulfilled" ? cfRes.value : undefined;
  if (cfRes.status === "rejected" && !isFinnhubForbidden(cfRes.reason)) {
    warnings.push(`Cash flow statement failed: ${rejectionReason(cfRes.reason)}`);
  }

  let priceTarget =
    targetRes.status === "fulfilled" ? targetRes.value : null;
  let usedYahoo = false;
  let yahooFundamentalsPrefetched: YahooFundamentals | null = null;

  const fhQuote403 =
    quoteRes.status === "rejected" && isFinnhubForbidden(quoteRes.reason);
  const fhProfile403 =
    profileRes.status === "rejected" && isFinnhubForbidden(profileRes.reason);
  const fhMetrics403 =
    metricRes.status === "rejected" && isFinnhubForbidden(metricRes.reason);

  if (fhQuote403 || fhProfile403 || fhMetrics403) {
    try {
      const fb = await fetchYahooFinnhubFallback(symbol);
      yahooFundamentalsPrefetched = fb.fundamentals;
      usedYahoo = true;
      if (fhQuote403 && fb.quote) {
        quote = fb.quote;
        warnings = warnings.filter((w) => !w.startsWith("Quote request failed"));
      }
      if (fhProfile403 && fb.profile?.name) {
        profile = {
          ...profile,
          name: fb.profile.name,
          exchange: fb.profile.exchange ?? profile?.exchange,
          currency: fb.profile.currency ?? profile?.currency,
          country: fb.profile.country ?? profile?.country,
        };
        warnings = warnings.filter((w) => !w.startsWith("Profile request failed"));
      }
      if (fhMetrics403 && Object.keys(fb.metricBag).length > 0) {
        stockMetric = {
          metric: { ...(stockMetric?.metric ?? {}), ...fb.metricBag },
        };
        warnings = warnings.filter((w) =>
          !w.startsWith("Fundamental metrics request failed"),
        );
      }
    } catch (e) {
      warnings.push(`Yahoo fallback (Finnhub 403): ${rejectionReason(e)}`);
    }
  }

  const targetLooksEmpty = (t: typeof priceTarget) =>
    t == null ||
    (t.targetMean == null && t.targetMedian == null && t.targetHigh == null);

  if (targetRes.status === "rejected" && !isFinnhubForbidden(targetRes.reason)) {
    warnings.push(`Price target request failed: ${rejectionReason(targetRes.reason)}`);
  }

  const bag = stockMetric?.metric;
  const lastPriceRaw = quote?.c ?? null;
  let {
    value: fcfNum,
    period: fcfPeriod,
    perShare: fcfIsPerShare,
  } = extractFcf(cf, bag, lastPriceRaw);

  const target403 =
    targetRes.status === "rejected" && isFinnhubForbidden(targetRes.reason);
  const targetEmpty =
    targetRes.status === "fulfilled" && targetLooksEmpty(priceTarget);
  const needTargetYahoo = target403 || targetEmpty;
  const needFcfYahoo = fcfNum == null;

  if (needTargetYahoo || needFcfYahoo) {
    try {
      const yf: YahooFundamentals =
        yahooFundamentalsPrefetched ?? (await fetchYahooFundamentals(symbol));
      const yt = yf.target;
      if (
        needTargetYahoo &&
        yt &&
        (yt.targetMean != null || yt.targetHigh != null)
      ) {
        if (target403) {
          priceTarget = {
            targetMean: yt.targetMean,
            targetHigh: yt.targetHigh,
            targetLow: yt.targetLow,
            lastUpdated: yt.lastUpdated,
          };
        } else {
          priceTarget = {
            ...priceTarget,
            targetMean: yt.targetMean ?? priceTarget?.targetMean,
            targetHigh: yt.targetHigh ?? priceTarget?.targetHigh,
            targetLow: yt.targetLow ?? priceTarget?.targetLow,
          };
        }
        usedYahoo = true;
      } else if (needTargetYahoo) {
        warnings.push(
          "Analyst price target unavailable (Finnhub blocked or empty; Yahoo had no target).",
        );
      }

      if (needFcfYahoo && yf.fcf) {
        fcfNum = yf.fcf.value;
        fcfPeriod = `${yf.fcf.periodLabel} (Yahoo)`;
        fcfIsPerShare = false;
        usedYahoo = true;
      } else if (needFcfYahoo && !yf.fcf) {
        if (cfRes.status === "rejected" && isFinnhubForbidden(cfRes.reason)) {
          warnings.push(
            "Free cash flow unavailable (Finnhub 403; Yahoo cash flow line missing).",
          );
        } else {
          warnings.push(
            "Free cash flow not available from Finnhub or Yahoo for this symbol.",
          );
        }
      }
    } catch (e) {
      if (needTargetYahoo) {
        warnings.push(`Analyst price target (Yahoo): ${rejectionReason(e)}`);
      }
      if (needFcfYahoo) {
        warnings.push(`Free cash flow (Yahoo): ${rejectionReason(e)}`);
      }
    }
  }

  const lastPrice = lastPriceRaw;
  const targetMean = priceTarget?.targetMean ?? null;

  const pe = num(bag ?? {}, ["peTTM", "peNormalizedAnnual", "peAnnual"]);

  const upsidePct =
    lastPrice != null && targetMean != null && lastPrice !== 0
      ? ((targetMean - lastPrice) / lastPrice) * 100
      : null;

  const peg = computePeg(pe, bag);
  const de = num(bag ?? {}, [
    "totalDebt/totalEquityAnnual",
    "totalDebt/totalEquityQuarterly",
    "longTermDebt/equityAnnual",
    "longTermDebt/equityQuarterly",
    "debtEquityTTM",
    "debtEquityAnnual",
    "debtEquityQuarterly",
  ]);

  const fcfTotal = totalFcf(fcfNum, fcfIsPerShare, profile ?? undefined);

  let roe = num(bag ?? {}, ["roeTTM", "roeAnnual", "roeQuarterly"]);
  if (roe != null && roe <= 2) roe = roe * 100;

  let rsi: number | null = null;
  if (rsiRes.status === "fulfilled") {
    rsi = lastRsiFromIndicator(rsiRes.value);
  }
  if (rsi == null && candleRes.status === "fulfilled") {
    const closes = candleRes.value.c;
    if (closes?.length) rsi = rsiFromCloses(closes, 14);
  }
  if (rsi == null) {
    try {
      await yahooSpacingBeforeChart();
      const closes = await fetchYahooClosesForRsi(symbol);
      if (closes.length >= 15) {
        rsi = rsiFromCloses(closes, 14);
        usedYahoo = true;
      } else {
        const indFail =
          rsiRes.status === "rejected"
            ? rejectionReason(rsiRes.reason)
            : "no RSI series";
        const cndFail =
          candleRes.status === "rejected"
            ? rejectionReason(candleRes.reason)
            : "no candles";
        warnings.push(
          `RSI unavailable (${indFail}; ${cndFail}; Yahoo: too few daily bars).`,
        );
      }
    } catch (e) {
      const indFail =
        rsiRes.status === "rejected"
          ? rejectionReason(rsiRes.reason)
          : "no RSI series";
      const cndFail =
        candleRes.status === "rejected"
          ? rejectionReason(candleRes.reason)
          : "no candles";
      warnings.push(`RSI unavailable (${indFail}; ${cndFail}; Yahoo: ${rejectionReason(e)}).`);
    }
  }

  if (usedYahoo) {
    warnings.push(
      "FYI: Some figures use Yahoo Finance where Finnhub’s free tier blocks those endpoints (403).",
    );
  }

  const beta = num(bag ?? {}, ["beta"]) ?? null;

  const fg =
    fgRes.status === "fulfilled"
      ? fgRes.value
      : { score: null, label: null, source: "CNN Fear & Greed Index", error: "unavailable" };
  if (fgRes.status === "rejected") {
    warnings.push(`Fear & Greed fetch failed: ${rejectionReason(fgRes.reason)}`);
  }

  const payoutPct = computePayoutPct(bag);

  const gPe = gradePe(pe);
  const gUpside = gradeUpside(upsidePct);
  const gPeg = gradePeg(peg);
  const gDe = gradeDe(de);
  const gFcf = gradeFcf(fcfTotal, profile?.currency ?? null);
  const gRoe = gradeRoe(roe);
  const gRsi = gradeRsi(rsi);
  const gBeta = gradeBeta(beta);
  const gFg = gradeFearGreed(fg.score, fg.label);
  const gPay = gradePayout(payoutPct);

  const peVal =
    pe == null ? "—" : pe <= 0 ? "N/M" : `${fmt(pe, 2)}×`;

  const upsideVal =
    upsidePct == null ? "—" : `${upsidePct >= 0 ? "+" : ""}${fmt(upsidePct, 1)}%`;

  const pegVal = peg == null ? "—" : `${fmt(peg, 2)}`;
  const deVal = de == null ? "—" : `${fmt(de, 2)}`;
  const fcfVal =
    fcfTotal == null
      ? "—"
      : `${formatFcf(fcfTotal, profile?.currency ?? "USD")}${fcfPeriod ? ` (${fcfPeriod})` : ""}`;

  const roeVal = roe == null ? "—" : `${fmt(roe, 1)}%`;
  const rsiVal = rsi == null ? "—" : fmt(rsi, 1);
  const betaVal = beta == null ? "—" : fmt(beta, 2);
  const fgVal =
    fg.score == null ? "—" : `${fmt(fg.score, 0)}${fg.label ? ` · ${fg.label}` : ""}`;
  const payVal = payoutPct == null ? "—" : `${fmt(payoutPct, 1)}%`;

  const targetBlurb =
    targetMean != null && lastPrice != null
      ? `Consensus ~${profile?.currency ?? ""} ${fmt(targetMean, 2)} vs. spot ${fmt(lastPrice, 2)}.`
      : "Wall Street mean 12‑month price objective vs. current price.";

  const metrics = [
    buildMetricBlock(
      "pe",
      "P/E ratio",
      "Price to earnings — what you pay per dollar of profit.",
      peVal,
      gPe,
    ),
    buildMetricBlock(
      "target",
      "Industry target price",
      targetBlurb,
      upsideVal === "—" ? "—" : `Imputed upside: ${upsideVal}`,
      gUpside,
    ),
    buildMetricBlock(
      "peg",
      "PEG ratio",
      "P/E adjusted for growth; ~1.0 often read as fair for growers.",
      pegVal,
      gPeg,
    ),
    buildMetricBlock(
      "de",
      "Debt‑to‑equity",
      "Borrowed funds vs. equity — balance‑sheet leverage snapshot.",
      deVal,
      gDe,
    ),
    buildMetricBlock(
      "fcf",
      "Free cash flow",
      "Cash after operations and capex — harder to “adjust” than earnings.",
      fcfVal,
      gFcf,
    ),
    buildMetricBlock(
      "roe",
      "Return on equity",
      "Profit per dollar of shareholder equity — capital efficiency.",
      roeVal,
      gRoe,
    ),
    buildMetricBlock(
      "rsi",
      "RSI (14)",
      "Momentum: >70 overbought, <30 oversold (rules of thumb).",
      rsiVal,
      gRsi,
    ),
    buildMetricBlock(
      "beta",
      "Beta",
      "Volatility vs. the broad market (≈ S&P 500). 1.2 ⇒ ~20% more volatile.",
      betaVal,
      gBeta,
    ),
    buildMetricBlock(
      "fg",
      "Fear & Greed index",
      fg.source + (fg.error ? ` (${fg.error})` : ""),
      fgVal,
      { grade: gFg.grade, score: gFg.scoreN ?? undefined, detail: gFg.detail },
    ),
    buildMetricBlock(
      "payout",
      "Dividend payout ratio",
      "% of earnings paid as dividends; very high can stress sustainability.",
      payVal,
      gPay,
    ),
  ];

  if (warnings.length === 0 && !profile?.name && lastPrice == null) {
    warnings.push("No data returned — check the symbol/exchange suffix (e.g. 7203.T).");
  }

  return {
    symbol,
    name: profile?.name ?? null,
    exchange: profile?.exchange ?? null,
    currency: profile?.currency ?? null,
    lastPrice,
    asOf: new Date().toISOString(),
    metrics,
    warnings,
    resolutionNote: resolutionNote ?? null,
  };
}

function fmt(n: number, d: number) {
  return n.toLocaleString(undefined, { maximumFractionDigits: d, minimumFractionDigits: 0 });
}

function formatFcf(n: number, currency: string) {
  const sign = n < 0 ? "-" : "";
  const abs = Math.abs(n);
  const denom = abs >= 1e9 ? 1e9 : 1e6;
  const suf = abs >= 1e9 ? "B" : "M";
  return `${sign}${currency} ${fmt(abs / denom, 2)}${suf}`;
}
