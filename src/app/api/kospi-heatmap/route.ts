import { unstable_cache } from "next/cache";
import { buildKospiHeatmapPayload } from "@/lib/kospi-heatmap-build";
import type { HeatmapRangeKey } from "@/lib/yahoo-chart-presets";
import { isHeatmapRangeKey } from "@/lib/yahoo-chart-presets";
import { NextResponse } from "next/server";

export const maxDuration = 60;

export const runtime = "nodejs";

const getCachedHeatmap = unstable_cache(
  async (range: HeatmapRangeKey) => buildKospiHeatmapPayload(range),
  ["kospi-heatmap-v1"],
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
        "Cache-Control": "private, no-store",
      },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Heatmap fetch failed";
    console.error("[api/kospi-heatmap]", e);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
