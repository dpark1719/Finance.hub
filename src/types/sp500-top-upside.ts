export type Sp500TopUpsideRowJSON = {
  symbol: string;
  name: string | null;
  sector: string;
  industry: string;
  lastPrice: number;
  targetMean: number;
  upsidePct: number;
  currency: string | null;
};

export type Sp500TopUpsidePayloadJSON = {
  generatedAt: string;
  refreshAfter: string;
  marketSession: "open" | "closed";
  periodLabel: string;
  /** Top 10 by positive imputed upside (consensus vs spot). */
  rows: Sp500TopUpsideRowJSON[];
  /** Top 10 by most negative imputed upside (consensus below spot). */
  losers: Sp500TopUpsideRowJSON[];
};
