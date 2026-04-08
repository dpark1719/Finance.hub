import { fetchPolymarketTopByVolume24h } from "@/lib/polymarket-top";
import { NextResponse } from "next/server";

/**
 * Revalidate often; Gamma API is free. Keeps edge/server from hammering origin every millisecond.
 * Clients poll + use cache: no-store so browsers don’t stick on stale JSON.
 */
export const revalidate = 12;

export async function GET() {
  try {
    const markets = await fetchPolymarketTopByVolume24h();
    return NextResponse.json(
      { markets, fetchedAt: new Date().toISOString() },
      {
        headers: {
          "Cache-Control": "public, s-maxage=12, stale-while-revalidate=30",
        },
      },
    );
  } catch (e) {
    const message = e instanceof Error ? e.message : "Polymarket fetch failed";
    console.error("[api/polymarket-top]", e);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
