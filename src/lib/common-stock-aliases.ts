/**
 * When Finnhub search is empty and Yahoo blocks server-side search (429), map
 * very common names to a primary US ticker.
 */
const ALIASES: Record<string, string> = {
  google: "GOOGL",
  alphabet: "GOOGL",
  apple: "AAPL",
  microsoft: "MSFT",
  amazon: "AMZN",
  meta: "META",
  facebook: "META",
  tesla: "TSLA",
  netflix: "NFLX",
  nvidia: "NVDA",
  amd: "AMD",
  intel: "INTC",
  disney: "DIS",
  walmart: "WMT",
  jpmorgan: "JPM",
  visa: "V",
  mastercard: "MA",
  berkshire: "BRK.B",
  cocacola: "KO",
  "coca cola": "KO",
  pepsi: "PEP",
  mcdonalds: "MCD",
  starbucks: "SBUX",
  nike: "NKE",
  boeing: "BA",
  ibm: "IBM",
  oracle: "ORCL",
  salesforce: "CRM",
  paypal: "PYPL",
  uber: "UBER",
  lyft: "LYFT",
  spotify: "SPOT",
  zoom: "ZM",
  palantir: "PLTR",
  snowflake: "SNOW",
  /** US OTC; Finnhub free tier often 403s on Seoul listing (005930.KS). */
  samsung: "SSNLF",
};

export function resolveCommonStockAlias(raw: string): string | null {
  const k = raw
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (!k) return null;
  if (ALIASES[k]) return ALIASES[k];
  const first = k.split(" ")[0];
  if (first && ALIASES[first]) return ALIASES[first];
  return null;
}
