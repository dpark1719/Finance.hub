import { unstable_cache } from "next/cache";
import { buildSp500TopUpsidePayload } from "@/lib/sp500-top-upside-build";
import { NextResponse } from "next/server";

/** Cold build: S&P quotes + ~500 Yahoo quoteSummary targets with bounded concurrency. */
export const maxDuration = 120;

export const runtime = "nodejs";

const getCachedTopUpside = unstable_cache(
  async () => buildSp500TopUpsidePayload(),
  ["sp500-top-upside-v2-losers"],
  { revalidate: 900 },
);

export async function GET() {
  try {
    const data = await getCachedTopUpside();
    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "private, no-store",
      },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Top upside fetch failed";
    console.error("[api/sp500-top-upside]", e);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
