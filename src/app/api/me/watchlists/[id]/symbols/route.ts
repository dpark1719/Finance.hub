import { getSessionUser } from "@/lib/me/require-user";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { NextResponse } from "next/server";

type Ctx = { params: Promise<{ id: string }> };

function normalizeSymbols(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  const out: string[] = [];
  const seen = new Set<string>();
  for (const x of raw) {
    if (typeof x !== "string") continue;
    const s = x.trim().toUpperCase();
    if (!s || seen.has(s)) continue;
    seen.add(s);
    out.push(s);
  }
  return out;
}

export async function PUT(request: Request, ctx: Ctx) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured" }, { status: 503 });
  }
  const { id: watchlistId } = await ctx.params;
  const { user, supabase } = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: wl } = await supabase
    .from("watchlists")
    .select("id")
    .eq("id", watchlistId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!wl) {
    return NextResponse.json({ error: "Watchlist not found" }, { status: 404 });
  }

  let body: { symbols?: unknown };
  try {
    body = (await request.json()) as { symbols?: unknown };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const symbols = normalizeSymbols(body.symbols);

  const { error: delErr } = await supabase.from("watchlist_symbols").delete().eq("watchlist_id", watchlistId);

  if (delErr) {
    return NextResponse.json({ error: delErr.message }, { status: 500 });
  }

  if (symbols.length === 0) {
    return NextResponse.json({ symbols: [] });
  }

  const rows = symbols.map((symbol, position) => ({
    watchlist_id: watchlistId,
    symbol,
    position,
  }));

  const { error: insErr } = await supabase.from("watchlist_symbols").insert(rows);

  if (insErr) {
    return NextResponse.json({ error: insErr.message }, { status: 500 });
  }

  return NextResponse.json({ symbols });
}
