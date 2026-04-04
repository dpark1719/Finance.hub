export type LetterGrade = "A" | "B" | "C" | "D" | "F" | "—";

export interface MetricBlock {
  id: string;
  title: string;
  subtitle: string;
  value: string;
  detail: string;
  grade: LetterGrade;
  score?: number;
}

export interface StockReport {
  symbol: string;
  name: string | null;
  exchange: string | null;
  currency: string | null;
  lastPrice: number | null;
  asOf: string;
  metrics: MetricBlock[];
  warnings: string[];
  /** Present when input was a company name (e.g. "apple") rather than a ticker. */
  resolutionNote?: string | null;
}
