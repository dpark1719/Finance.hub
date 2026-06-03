import type { IndexSessionKind } from "@/components/Sp500TopUpsidePanel";

export type StocksIndexTab = "sp500" | "kospi200";

export const STOCKS_INDEX_TABS: { id: StocksIndexTab; label: string }[] = [
  { id: "sp500", label: "S&P 500" },
  { id: "kospi200", label: "KOSPI 200" },
];

export const SP500_INDEX_CONFIG = {
  upside: {
    apiPath: "/api/sp500-top-upside",
    ariaLabel: "S&P 500 consensus upside and downside",
    sessionKind: "us" as IndexSessionKind,
  },
  heatmap: {
    apiPath: "/api/sp500-heatmap",
    title: "S&P 500 heatmap",
    description:
      "Tile area blends market cap with how large the move was for the selected period (bigger movers get more space; missing data shrinks). Color = sign of that return (1 day uses regular session change; longer ranges use Yahoo spark first→last close). Hover for OHLC; click to run the report. Data refreshes about every hour.",
  },
};

export const KOSPI_200_INDEX_CONFIG = {
  upside: {
    apiPath: "/api/kospi-top-upside",
    ariaLabel: "KOSPI 200 consensus upside and downside",
    sessionKind: "kr" as IndexSessionKind,
  },
  heatmap: {
    apiPath: "/api/kospi-heatmap",
    title: "KOSPI 200 heatmap",
    description:
      "KOSPI 200 members grouped by GICS sector (Wikipedia). Tile area blends market cap with |return| for the selected period; color = direction. Hover for OHLC; click to run the report. Data refreshes about every hour.",
  },
};
