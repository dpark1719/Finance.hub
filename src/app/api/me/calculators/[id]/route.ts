import { getSessionUser } from "@/lib/me/require-user";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { NextResponse } from "next/server";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: Request, ctx: Ctx) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured" }, { status: 503 });
  }
  const { id } = await ctx.params;
  const { user, supabase } = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("calculator_snapshots")
    .select("id, name, tab, payload, updated_at")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ snapshot: data });
}

export async function PATCH(request: Request, ctx: Ctx) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured" }, { status: 503 });
  }
  const { id } = await ctx.params;
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

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (typeof body.name === "string" && body.name.trim()) {
    updates.name = body.name.trim();
  }
  if (typeof body.tab === "string" && body.tab.trim()) {
    updates.tab = body.tab.trim();
  }
  if (body.payload !== undefined) {
    if (typeof body.payload !== "object" || body.payload === null) {
      return NextResponse.json({ error: "payload must be an object" }, { status: 400 });
    }
    updates.payload = body.payload;
  }
  if (Object.keys(updates).length === 1) {
    return NextResponse.json({ error: "No valid fields" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("calculator_snapshots")
    .update(updates)
    .eq("id", id)
    .eq("user_id", user.id)
    .select("id, name, tab, payload, updated_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ snapshot: data });
}

export async function DELETE(_request: Request, ctx: Ctx) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured" }, { status: 503 });
  }
  const { id } = await ctx.params;
  const { user, supabase } = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { error } = await supabase
    .from("calculator_snapshots")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
