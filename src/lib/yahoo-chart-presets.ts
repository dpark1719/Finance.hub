/** Client-safe chart range config (no Yahoo fetch / server-only code). */

export type YahooChartRangeKey = "1d" | "1w" | "1m" | "3m" | "ytd" | "1y" | "5y" | "max";

export const YAHOO_CHART_PRESETS: Record<
  YahooChartRangeKey,
  { range: string; interval: string; label: string }
> = {
  "1d": { range: "1d", interval: "5m", label: "1D" },
  "1w": { range: "5d", interval: "15m", label: "1W" },
  "1m": { range: "1mo", interval: "1d", label: "1M" },
  "3m": { range: "3mo", interval: "1d", label: "3M" },
  ytd: { range: "ytd", interval: "1d", label: "YTD" },
  "1y": { range: "1y", interval: "1d", label: "1Y" },
  "5y": { range: "5y", interval: "1wk", label: "5Y" },
  max: { range: "max", interval: "1mo", label: "Max" },
};

export function isYahooChartRangeKey(s: string): s is YahooChartRangeKey {
  return s in YAHOO_CHART_PRESETS;
}

/** S&P 500 heatmap period selector (same keys as chart where applicable). */
export type HeatmapRangeKey = YahooChartRangeKey;

export const HEATMAP_RANGE_OPTIONS: { key: HeatmapRangeKey; label: string }[] = [
  { key: "1d", label: "1 day" },
  { key: "1w", label: "1 week" },
  { key: "1m", label: "1 month" },
  { key: "3m", label: "3 month" },
  { key: "ytd", label: "YTD" },
  { key: "1y", label: "1 year" },
  { key: "5y", label: "5 years" },
  { key: "max", label: "Max" },
];

export function isHeatmapRangeKey(s: string): s is HeatmapRangeKey {
  return isYahooChartRangeKey(s);
}
