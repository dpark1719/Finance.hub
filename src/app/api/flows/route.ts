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

function withFlow(a: Omit<Asset, "flowDirection">): Asset {
  return { ...a, flowDirection: a.change1m > 0 ? "inflow" : a.change1m < 0 ? "outflow" : "neutral" };
}

const ASSETS: Asset[] = [
  // ── Precious Metals ──
  withFlow({ id: "gold", name: "Gold", symbol: "GC=F", category: "Precious Metals", price: 3124.50, change1d: 1.2, change1w: 3.5, change1m: 8.2, changeYtd: 15.4, marketCap: "$18.5T" }),
  withFlow({ id: "silver", name: "Silver", symbol: "SI=F", category: "Precious Metals", price: 34.82, change1d: 0.8, change1w: 2.1, change1m: 5.6, changeYtd: 12.3, marketCap: "$1.6T" }),
  withFlow({ id: "platinum", name: "Platinum", symbol: "PL=F", category: "Precious Metals", price: 985.40, change1d: 0.4, change1w: 1.8, change1m: 3.2, changeYtd: 4.1, marketCap: "$240B" }),
  withFlow({ id: "palladium", name: "Palladium", symbol: "PA=F", category: "Precious Metals", price: 962.80, change1d: -0.6, change1w: -2.3, change1m: -5.8, changeYtd: -12.5, marketCap: "$28B" }),
  withFlow({ id: "copper", name: "Copper", symbol: "HG=F", category: "Precious Metals", price: 4.68, change1d: 1.1, change1w: 4.2, change1m: 9.5, changeYtd: 18.7, marketCap: "$320B" }),

  // ── Commodities ──
  withFlow({ id: "oil", name: "Crude Oil (WTI)", symbol: "CL=F", category: "Commodities", price: 69.45, change1d: -1.5, change1w: -4.2, change1m: -8.1, changeYtd: -5.2, marketCap: "$2.3T" }),
  withFlow({ id: "brent", name: "Brent Crude", symbol: "BZ=F", category: "Commodities", price: 73.20, change1d: -1.3, change1w: -3.8, change1m: -7.4, changeYtd: -4.1, marketCap: "$2.1T" }),
  withFlow({ id: "natgas", name: "Natural Gas", symbol: "NG=F", category: "Commodities", price: 4.12, change1d: 2.3, change1w: 5.8, change1m: 12.1, changeYtd: 35.6, marketCap: "$430B" }),
  withFlow({ id: "wheat", name: "Wheat", symbol: "ZW=F", category: "Commodities", price: 5.48, change1d: 0.3, change1w: 1.5, change1m: -2.4, changeYtd: -8.3, marketCap: "$50B" }),
  withFlow({ id: "corn", name: "Corn", symbol: "ZC=F", category: "Commodities", price: 4.52, change1d: -0.2, change1w: 0.8, change1m: -1.7, changeYtd: -5.6, marketCap: "$90B" }),
  withFlow({ id: "soybeans", name: "Soybeans", symbol: "ZS=F", category: "Commodities", price: 10.15, change1d: 0.5, change1w: 1.2, change1m: -3.1, changeYtd: -9.2, marketCap: "$55B" }),
  withFlow({ id: "coffee", name: "Coffee", symbol: "KC=F", category: "Commodities", price: 3.82, change1d: 1.8, change1w: 6.2, change1m: 14.5, changeYtd: 42.3, marketCap: "$45B" }),

  // ── Crypto ──
  withFlow({ id: "btc", name: "Bitcoin", symbol: "BTC-USD", category: "Crypto", price: 84250, change1d: -2.1, change1w: -5.3, change1m: -12.5, changeYtd: -10.2, marketCap: "$1.7T" }),
  withFlow({ id: "eth", name: "Ethereum", symbol: "ETH-USD", category: "Crypto", price: 1875, change1d: -3.2, change1w: -8.1, change1m: -18.4, changeYtd: -43.8, marketCap: "$225B" }),
  withFlow({ id: "sol", name: "Solana", symbol: "SOL-USD", category: "Crypto", price: 128.50, change1d: -2.8, change1w: -6.5, change1m: -15.2, changeYtd: -32.1, marketCap: "$62B" }),
  withFlow({ id: "xrp", name: "XRP", symbol: "XRP-USD", category: "Crypto", price: 2.18, change1d: -1.5, change1w: -4.8, change1m: -10.3, changeYtd: 2.8, marketCap: "$125B" }),
  withFlow({ id: "bnb", name: "BNB", symbol: "BNB-USD", category: "Crypto", price: 598.40, change1d: -1.2, change1w: -3.1, change1m: -8.7, changeYtd: -12.4, marketCap: "$88B" }),
  withFlow({ id: "ada", name: "Cardano", symbol: "ADA-USD", category: "Crypto", price: 0.68, change1d: -2.5, change1w: -7.2, change1m: -20.1, changeYtd: -25.6, marketCap: "$24B" }),

  // ── Indices ──
  withFlow({ id: "sp500", name: "S&P 500", symbol: "^GSPC", category: "Indices", price: 5580.25, change1d: -0.5, change1w: -2.8, change1m: -5.2, changeYtd: -4.8, marketCap: "$52.5T" }),
  withFlow({ id: "nasdaq", name: "Nasdaq Composite", symbol: "^IXIC", category: "Indices", price: 17322.50, change1d: -0.8, change1w: -3.5, change1m: -7.1, changeYtd: -10.5, marketCap: "$28.4T" }),
  withFlow({ id: "djia", name: "Dow Jones", symbol: "^DJI", category: "Indices", price: 41985.30, change1d: -0.3, change1w: -1.9, change1m: -3.8, changeYtd: -2.1, marketCap: "$15.2T" }),
  withFlow({ id: "russell", name: "Russell 2000", symbol: "^RUT", category: "Indices", price: 2012.45, change1d: -1.1, change1w: -4.5, change1m: -9.3, changeYtd: -14.2, marketCap: "$3.1T" }),
  withFlow({ id: "nikkei", name: "Nikkei 225", symbol: "^N225", category: "Indices", price: 37120.80, change1d: 0.6, change1w: -1.2, change1m: -4.5, changeYtd: -6.8, marketCap: "$6.2T" }),
  withFlow({ id: "ftse", name: "FTSE 100", symbol: "^FTSE", category: "Indices", price: 8620.50, change1d: 0.2, change1w: 0.5, change1m: 1.8, changeYtd: 5.4, marketCap: "$3.0T" }),
  withFlow({ id: "kospi", name: "KOSPI", symbol: "^KS11", category: "Indices", price: 2555.40, change1d: -0.7, change1w: -2.4, change1m: -6.1, changeYtd: -8.5, marketCap: "$1.8T" }),

  // ── Volatility ──
  withFlow({ id: "vix", name: "VIX (Fear Index)", symbol: "^VIX", category: "Volatility", price: 22.45, change1d: 5.2, change1w: 15.3, change1m: 28.6, changeYtd: 30.1, marketCap: "—" }),
  withFlow({ id: "vvix", name: "VVIX (Vol of Vol)", symbol: "^VVIX", category: "Volatility", price: 98.30, change1d: 3.8, change1w: 10.2, change1m: 18.5, changeYtd: 22.4, marketCap: "—" }),
  withFlow({ id: "move", name: "MOVE Index (Bond Vol)", symbol: "^MOVE", category: "Volatility", price: 112.60, change1d: 2.1, change1w: 8.4, change1m: 15.2, changeYtd: 10.8, marketCap: "—" }),
  withFlow({ id: "skew", name: "SKEW Index", symbol: "^SKEW", category: "Volatility", price: 138.40, change1d: -1.2, change1w: -3.5, change1m: -5.8, changeYtd: -2.1, marketCap: "—" }),
  withFlow({ id: "gvz", name: "Gold Volatility", symbol: "^GVZ", category: "Volatility", price: 18.90, change1d: 1.5, change1w: 4.2, change1m: 12.8, changeYtd: 8.5, marketCap: "—" }),

  // ── Currency (positive change = strengthening vs USD = money flowing in) ──
  withFlow({ id: "eur", name: "Euro (EUR)", symbol: "EURUSD=X", category: "Currency", price: 1.0835, change1d: 0.3, change1w: 1.1, change1m: 2.8, changeYtd: 4.5, marketCap: "—" }),
  withFlow({ id: "jpy", name: "Japanese Yen (JPY)", symbol: "JPY=X", category: "Currency", price: 149.85, change1d: 0.4, change1w: 1.8, change1m: 3.2, changeYtd: 5.1, marketCap: "—" }),
  withFlow({ id: "gbp", name: "British Pound (GBP)", symbol: "GBPUSD=X", category: "Currency", price: 1.2945, change1d: 0.2, change1w: 0.8, change1m: 1.9, changeYtd: 3.2, marketCap: "—" }),
  withFlow({ id: "krw", name: "Korean Won (KRW)", symbol: "KRW=X", category: "Currency", price: 1425.60, change1d: 0.1, change1w: 0.5, change1m: 1.4, changeYtd: -2.8, marketCap: "—" }),
  withFlow({ id: "cny", name: "Chinese Yuan (CNY)", symbol: "CNY=X", category: "Currency", price: 7.265, change1d: -0.1, change1w: -0.3, change1m: -0.8, changeYtd: -1.2, marketCap: "—" }),
  withFlow({ id: "usd", name: "US Dollar (USD)", symbol: "DX-Y.NYB", category: "Currency", price: 104.20, change1d: -0.3, change1w: -1.2, change1m: -2.5, changeYtd: -4.1, marketCap: "—" }),
];

export async function GET() {
  return NextResponse.json(ASSETS);
}
