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
  rows: Sp500TopUpsideRowJSON[];
};
