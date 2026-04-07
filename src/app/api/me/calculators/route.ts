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

  const { data, error } = await supabase
    .from("calculator_snapshots")
    .select("id, name, tab, updated_at")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ snapshots: data ?? [] });
}

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured" }, { status: 503 });
  }
  const { user, supabase } = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { name?: string; tab?: string; payload?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const tab = typeof body.tab === "string" ? body.tab.trim() : "";
  if (!name || !tab) {
    return NextResponse.json({ error: "name and tab are required" }, { status: 400 });
  }

  const payload =
    body.payload !== undefined && typeof body.payload === "object" && body.payload !== null
      ? body.payload
      : {};

  const { data, error } = await supabase
    .from("calculator_snapshots")
    .insert({
      user_id: user.id,
      name,
      tab,
      payload,
      updated_at: new Date().toISOString(),
    })
    .select("id, name, tab, payload, updated_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ snapshot: data });
}
