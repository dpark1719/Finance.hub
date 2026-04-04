import { fetchYahooChart } from "@/lib/yahoo";
import {
  isYahooChartRangeKey,
  type YahooChartRangeKey,
} from "@/lib/yahoo-chart-presets";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const symbol = req.nextUrl.searchParams.get("symbol")?.trim() ?? "";
  const rangeParam = (req.nextUrl.searchParams.get("range") ?? "3m").toLowerCase();

  const range: YahooChartRangeKey = isYahooChartRangeKey(rangeParam)
    ? rangeParam
    : "3m";

  if (!symbol) {
    return NextResponse.json({ error: "symbol required" }, { status: 400 });
  }

  try {
    const chart = await fetchYahooChart(symbol, range);
    return NextResponse.json({
      symbol: chart.symbol,
      currency: chart.currency,
      range,
      points: chart.points,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Chart fetch failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
