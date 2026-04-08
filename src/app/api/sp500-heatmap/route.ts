import { unstable_cache } from "next/cache";
import { buildSp500HeatmapPayload } from "@/lib/sp500-heatmap-build";
import type { HeatmapRangeKey } from "@/lib/yahoo-chart-presets";
import { isHeatmapRangeKey } from "@/lib/yahoo-chart-presets";
import { NextResponse } from "next/server";

/** Cold cache builds ~500 tickers in Yahoo batches + spark series per period; allow headroom on serverless. */
export const maxDuration = 60;

export const runtime = "nodejs";

/** Pass `range` as an argument so the cache key includes the period (do not rely on closure + empty `()`). */
const getCachedHeatmap = unstable_cache(
  async (range: HeatmapRangeKey) => buildSp500HeatmapPayload(range),
  ["sp500-heatmap-v6"],
  { revalidate: 3600 },
);

export async function GET(request: Request) {
  try {
    const rangeParam = new URL(request.url).searchParams.get("range");
    const range: HeatmapRangeKey =
      rangeParam && isHeatmapRangeKey(rangeParam) ? rangeParam : "1d";

    const data = await getCachedHeatmap(range);
    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Heatmap fetch failed";
    console.error("[api/sp500-heatmap]", e);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
