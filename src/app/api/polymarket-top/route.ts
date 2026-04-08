import { fetchPolymarketTopByVolume24h } from "@/lib/polymarket-top";
import { NextResponse } from "next/server";

/** Match Gamma refetch; CDN may cache briefly. */
export const revalidate = 120;

export async function GET() {
  try {
    const markets = await fetchPolymarketTopByVolume24h();
    return NextResponse.json(
      { markets, fetchedAt: new Date().toISOString() },
      {
        headers: {
          "Cache-Control": "public, s-maxage=120, stale-while-revalidate=300",
        },
      },
    );
  } catch (e) {
    const message = e instanceof Error ? e.message : "Polymarket fetch failed";
    console.error("[api/polymarket-top]", e);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
