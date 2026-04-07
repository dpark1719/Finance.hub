import { getSessionUser } from "@/lib/me/require-user";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { NextResponse } from "next/server";

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured" }, { status: 503 });
  }
  const { user, supabase } = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: lists, error: listsErr } = await supabase
    .from("watchlists")
    .select("id, name, sort_order, created_at")
    .eq("user_id", user.id)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (listsErr) {
    return NextResponse.json({ error: listsErr.message }, { status: 500 });
  }

  const ids = (lists ?? []).map((l) => l.id);
  if (ids.length === 0) {
    return NextResponse.json({ watchlists: [] });
  }

  const { data: symbols, error: symErr } = await supabase
    .from("watchlist_symbols")
    .select("watchlist_id, symbol, position")
    .in("watchlist_id", ids)
    .order("position", { ascending: true });

  if (symErr) {
    return NextResponse.json({ error: symErr.message }, { status: 500 });
  }

  const byList = new Map<string, string[]>();
  for (const row of symbols ?? []) {
    const arr = byList.get(row.watchlist_id) ?? [];
    arr.push(row.symbol);
    byList.set(row.watchlist_id, arr);
  }

  const watchlists = (lists ?? []).map((l) => ({
    id: l.id,
    name: l.name,
    sort_order: l.sort_order,
    symbols: byList.get(l.id) ?? [],
  }));

  return NextResponse.json({ watchlists });
}

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured" }, { status: 503 });
  }
  const { user, supabase } = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { name?: string };
  try {
    body = (await request.json()) as { name?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!name) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }

  const { count } = await supabase
    .from("watchlists")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id);

  const sort_order = count ?? 0;

  const { data, error } = await supabase
    .from("watchlists")
    .insert({ user_id: user.id, name, sort_order })
    .select("id, name, sort_order")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ watchlist: { ...data, symbols: [] as string[] } });
}
