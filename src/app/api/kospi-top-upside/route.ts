import { unstable_cache } from "next/cache";
import { buildKospiTopUpsidePayload } from "@/lib/kospi-top-upside-build";
import { NextResponse } from "next/server";

export const maxDuration = 120;

export const runtime = "nodejs";

const getCachedTopUpside = unstable_cache(
  async () => buildKospiTopUpsidePayload(),
  ["kospi-top-upside-v1"],
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
    console.error("[api/kospi-top-upside]", e);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
