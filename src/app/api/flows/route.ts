import { NextResponse } from "next/server";

type Asset = {
  id: string;
  name: string;
  symbol: string;
  category: string;
  price: number;
  change1d: number;
  change1w: number;
  change1m: number;
  changeYtd: number;
  marketCap: string;
  flowDirection: "inflow" | "outflow" | "neutral";
};

const ASSET_DEFS: { id: string; name: string; symbol: string; category: string }[] = [
  // Precious Metals (10)
  { id: "gold", name: "Gold", symbol: "GC=F", category: "Precious Metals" },
  { id: "silver", name: "Silver", symbol: "SI=F", category: "Precious Metals" },
  { id: "platinum", name: "Platinum", symbol: "PL=F", category: "Precious Metals" },
  { id: "palladium", name: "Palladium", symbol: "PA=F", category: "Precious Metals" },
  { id: "copper", name: "Copper", symbol: "HG=F", category: "Precious Metals" },
  { id: "aluminum", name: "Aluminum", symbol: "ALI=F", category: "Precious Metals" },
  { id: "zinc", name: "Zinc", symbol: "ZNC=F", category: "Precious Metals" },
  { id: "nickel", name: "Nickel", symbol: "^NICK", category: "Precious Metals" },
  { id: "lithium", name: "Lithium ETF", symbol: "LIT", category: "Precious Metals" },
  { id: "uranium", name: "Uranium ETF", symbol: "URA", category: "Precious Metals" },
  // Commodities (10)
  { id: "oil", name: "Crude Oil (WTI)", symbol: "CL=F", category: "Commodities" },
  { id: "brent", name: "Brent Crude", symbol: "BZ=F", category: "Commodities" },
  { id: "natgas", name: "Natural Gas", symbol: "NG=F", category: "Commodities" },
  { id: "wheat", name: "Wheat", symbol: "ZW=F", category: "Commodities" },
  { id: "corn", name: "Corn", symbol: "ZC=F", category: "Commodities" },
  { id: "soybeans", name: "Soybeans", symbol: "ZS=F", category: "Commodities" },
  { id: "coffee", name: "Coffee", symbol: "KC=F", category: "Commodities" },
  { id: "sugar", name: "Sugar", symbol: "SB=F", category: "Commodities" },
  { id: "cotton", name: "Cotton", symbol: "CT=F", category: "Commodities" },
  { id: "lumber", name: "Lumber", symbol: "LBS=F", category: "Commodities" },
  // Crypto (10)
  { id: "btc", name: "Bitcoin", symbol: "BTC-USD", category: "Crypto" },
  { id: "eth", name: "Ethereum", symbol: "ETH-USD", category: "Crypto" },
  { id: "sol", name: "Solana", symbol: "SOL-USD", category: "Crypto" },
  { id: "xrp", name: "XRP", symbol: "XRP-USD", category: "Crypto" },
  { id: "bnb", name: "BNB", symbol: "BNB-USD", category: "Crypto" },
  { id: "ada", name: "Cardano", symbol: "ADA-USD", category: "Crypto" },
  { id: "doge", name: "Dogecoin", symbol: "DOGE-USD", category: "Crypto" },
  { id: "avax", name: "Avalanche", symbol: "AVAX-USD", category: "Crypto" },
  { id: "dot", name: "Polkadot", symbol: "DOT-USD", category: "Crypto" },
  { id: "link", name: "Chainlink", symbol: "LINK-USD", category: "Crypto" },
  // Indices (10)
  { id: "sp500", name: "S&P 500", symbol: "^GSPC", category: "Indices" },
  { id: "nasdaq", name: "Nasdaq Composite", symbol: "^IXIC", category: "Indices" },
  { id: "djia", name: "Dow Jones", symbol: "^DJI", category: "Indices" },
  { id: "russell", name: "Russell 2000", symbol: "^RUT", category: "Indices" },
  { id: "nikkei", name: "Nikkei 225", symbol: "^N225", category: "Indices" },
  { id: "ftse", name: "FTSE 100", symbol: "^FTSE", category: "Indices" },
  { id: "kospi", name: "KOSPI", symbol: "^KS11", category: "Indices" },
  { id: "dax", name: "DAX 40", symbol: "^GDAXI", category: "Indices" },
  { id: "hangseng", name: "Hang Seng", symbol: "^HSI", category: "Indices" },
  { id: "shanghai", name: "Shanghai Composite", symbol: "000001.SS", category: "Indices" },
  // Volatility (10)
  { id: "vix", name: "VIX (Fear Index)", symbol: "^VIX", category: "Volatility" },
  { id: "vvix", name: "VVIX (Vol of Vol)", symbol: "^VVIX", category: "Volatility" },
  { id: "move", name: "MOVE Index (Bond Vol)", symbol: "^MOVE", category: "Volatility" },
  { id: "skew", name: "SKEW Index", symbol: "^SKEW", category: "Volatility" },
  { id: "gvz", name: "Gold Volatility", symbol: "^GVZ", category: "Volatility" },
  { id: "ovx", name: "Oil Volatility", symbol: "^OVX", category: "Volatility" },
  { id: "tyvix", name: "Treasury Vol", symbol: "^TYVIX", category: "Volatility" },
  { id: "vxn", name: "Nasdaq Volatility", symbol: "^VXN", category: "Volatility" },
  { id: "rvx", name: "Russell 2000 Vol", symbol: "^RVX", category: "Volatility" },
  { id: "vxd", name: "DJIA Volatility", symbol: "^VXD", category: "Volatility" },
  // Currency (10)
  { id: "eur", name: "Euro (EUR)", symbol: "EURUSD=X", category: "Currency" },
  { id: "jpy", name: "Japanese Yen (JPY)", symbol: "JPY=X", category: "Currency" },
  { id: "gbp", name: "British Pound (GBP)", symbol: "GBPUSD=X", category: "Currency" },
  { id: "krw", name: "Korean Won (KRW)", symbol: "KRW=X", category: "Currency" },
  { id: "cny", name: "Chinese Yuan (CNY)", symbol: "CNY=X", category: "Currency" },
  { id: "usd", name: "US Dollar (USD)", symbol: "DX-Y.NYB", category: "Currency" },
  { id: "chf", name: "Swiss Franc (CHF)", symbol: "CHFUSD=X", category: "Currency" },
  { id: "aud", name: "Australian Dollar (AUD)", symbol: "AUDUSD=X", category: "Currency" },
  { id: "cad", name: "Canadian Dollar (CAD)", symbol: "CADUSD=X", category: "Currency" },
  { id: "inr", name: "Indian Rupee (INR)", symbol: "INR=X", category: "Currency" },
];

const MARKET_CAPS: Record<string, string> = {
  gold: "$18.5T", silver: "$1.6T", platinum: "$240B", palladium: "$28B", copper: "$320B",
  aluminum: "$180B", zinc: "$45B", nickel: "$35B",
  oil: "$2.3T", brent: "$2.1T", natgas: "$430B", wheat: "$50B", corn: "$90B",
  soybeans: "$55B", coffee: "$45B", sugar: "$40B", cotton: "$30B", lumber: "$15B",
  sp500: "$52T", nasdaq: "$28T", djia: "$15T", russell: "$3.1T", nikkei: "$6.2T",
  ftse: "$3.0T", kospi: "$1.8T", dax: "$2.5T", hangseng: "$4.5T", shanghai: "$7.0T",
};

const cache = { ts: 0, data: null as Asset[] | null };
const CACHE_TTL = 5 * 60 * 1000;

function formatMarketCap(rawCap: number | undefined, id: string): string {
  if (MARKET_CAPS[id]) return MARKET_CAPS[id];
  if (!rawCap || rawCap <= 0) return "—";
  if (rawCap >= 1e12) return `$${(rawCap / 1e12).toFixed(1)}T`;
  if (rawCap >= 1e9) return `$${(rawCap / 1e9).toFixed(0)}B`;
  if (rawCap >= 1e6) return `$${(rawCap / 1e6).toFixed(0)}M`;
  return `$${rawCap.toLocaleString()}`;
}

function pctChange(current: number, previous: number): number {
  if (!previous || previous === 0) return 0;
  return Math.round(((current - previous) / previous) * 10000) / 100;
}

async function fetchYahooQuotes(symbols: string[]): Promise<Map<string, Record<string, number>>> {
  const results = new Map<string, Record<string, number>>();
  const batchSize = 8;

  for (let i = 0; i < symbols.length; i += batchSize) {
    const batch = symbols.slice(i, i + batchSize);
    const promises = batch.map(async (sym) => {
      try {
        const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(sym)}?range=3mo&interval=1d`;
        const res = await fetch(url, {
          headers: { "User-Agent": "Mozilla/5.0 (compatible)" },
          cache: "no-store",
        });
        if (!res.ok) return;
        const json = await res.json();
        const result = json?.chart?.result?.[0];
        if (!result) return;

        const closes: number[] = result.indicators?.quote?.[0]?.close ?? [];
        const meta = result.meta ?? {};
        const price = meta.regularMarketPrice ?? closes[closes.length - 1] ?? 0;
        const marketCap = meta.marketCap ?? 0;

        const validCloses = closes.filter((c: number | null) => c !== null && c > 0);
        const len = validCloses.length;

        const close1dAgo = len >= 2 ? validCloses[len - 2] : price;
        const close1wAgo = len >= 6 ? validCloses[len - 6] : validCloses[0] ?? price;
        const close1mAgo = len >= 22 ? validCloses[len - 22] : validCloses[0] ?? price;

        const timestamps: number[] = result.timestamp ?? [];
        const yearStart = new Date(new Date().getFullYear(), 0, 1).getTime() / 1000;
        let closeYtdStart = validCloses[0] ?? price;
        for (let j = 0; j < timestamps.length; j++) {
          if (timestamps[j] >= yearStart && validCloses[j]) {
            closeYtdStart = validCloses[j];
            break;
          }
        }

        results.set(sym, {
          price,
          marketCap,
          change1d: pctChange(price, close1dAgo),
          change1w: pctChange(price, close1wAgo),
          change1m: pctChange(price, close1mAgo),
          changeYtd: pctChange(price, closeYtdStart),
        });
      } catch {
        // skip failed symbol
      }
    });
    await Promise.all(promises);
  }
  return results;
}

export async function GET() {
  const now = Date.now();
  if (cache.data && now - cache.ts < CACHE_TTL) {
    return NextResponse.json(cache.data);
  }

  try {
    const symbols = ASSET_DEFS.map((a) => a.symbol);
    const quotes = await fetchYahooQuotes(symbols);

    const assets: Asset[] = ASSET_DEFS.map((def) => {
      const q = quotes.get(def.symbol);
      const price = q?.price ?? 0;
      const change1d = q?.change1d ?? 0;
      const change1w = q?.change1w ?? 0;
      const change1m = q?.change1m ?? 0;
      const changeYtd = q?.changeYtd ?? 0;
      const marketCap = formatMarketCap(q?.marketCap, def.id);
      const flowDirection = change1m > 0 ? "inflow" : change1m < 0 ? "outflow" : "neutral";

      return { ...def, price, change1d, change1w, change1m, changeYtd, marketCap, flowDirection };
    });

    cache.ts = now;
    cache.data = assets;
    return NextResponse.json(assets);
  } catch {
    if (cache.data) return NextResponse.json(cache.data);
    return NextResponse.json({ error: "Failed to fetch live data" }, { status: 502 });
  }
}
