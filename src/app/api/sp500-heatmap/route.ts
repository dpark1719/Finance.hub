import { unstable_cache } from "next/cache";
import { buildSp500HeatmapPayload } from "@/lib/sp500-heatmap-build";
import { NextResponse } from "next/server";

/** Cold cache builds ~500 tickers in Yahoo batches; allow headroom on serverless. */
export const maxDuration = 60;

const getCachedHeatmap = unstable_cache(
  () => buildSp500HeatmapPayload(),
  ["sp500-heatmap-data-v2-company"],
  { revalidate: 3600 },
);

export const runtime = "nodejs";

export async function GET() {
  try {
    const data = await getCachedHeatmap();
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
