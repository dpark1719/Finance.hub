import { buildStockReport } from "@/lib/report-builder";
import { getFinnhubApiKey } from "@/lib/server-env";
import { resolveStockQuery } from "@/lib/symbol-resolve";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const envKey = getFinnhubApiKey();
  if (!envKey) {
    return NextResponse.json(
      {
        error: "FINNHUB_API_KEY is not set for this server environment.",
        hint:
          "Local: In the project root, copy .env.example to .env.local, set FINNHUB_API_KEY (free key: https://finnhub.io/register), save the file, then restart the dev server (stop and run npm run dev again). Vercel or other hosts: add FINNHUB_API_KEY under Project → Environment Variables for Production and Preview, then Redeploy.",
      },
      { status: 503 },
    );
  }
  const raw = req.nextUrl.searchParams.get("symbol") ?? "";
  try {
    let symbol = raw.trim();
    let resolutionNote: string | null = null;
    if (symbol) {
      const resolved = await resolveStockQuery(raw);
      symbol = resolved.symbol;
      resolutionNote = resolved.resolutionNote;
    }
    const report = await buildStockReport(symbol, resolutionNote);
    try {
      return NextResponse.json(report);
    } catch (ser) {
      console.error("[api/report] JSON response error", ser);
      return NextResponse.json(
        { error: "Failed to serialize report response." },
        { status: 500 },
      );
    }
  } catch (e) {
    console.error("[api/report]", e);
    const message = e instanceof Error ? e.message : "Server error";
    if (
      message.includes("No listings match") ||
      message.includes("Could not resolve")
    ) {
      return NextResponse.json({ error: message }, { status: 400 });
    }
    const status = message.includes("FINNHUB_API_KEY") ? 503 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
