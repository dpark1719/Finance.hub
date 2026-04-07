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

  const [sav, cards] = await Promise.all([
    supabase.from("saved_savings_accounts").select("account_id").eq("user_id", user.id),
    supabase.from("saved_credit_cards").select("card_id").eq("user_id", user.id),
  ]);

  if (sav.error) {
    return NextResponse.json({ error: sav.error.message }, { status: 500 });
  }
  if (cards.error) {
    return NextResponse.json({ error: cards.error.message }, { status: 500 });
  }

  return NextResponse.json({
    savingsIds: (sav.data ?? []).map((r) => r.account_id),
    cardIds: (cards.data ?? []).map((r) => r.card_id),
  });
}

export async function PUT(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured" }, { status: 503 });
  }
  const { user, supabase } = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { savingsIds?: unknown; cardIds?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const savingsIds = Array.isArray(body.savingsIds)
    ? body.savingsIds.filter((x): x is string => typeof x === "string")
    : null;
  const cardIds = Array.isArray(body.cardIds)
    ? body.cardIds.filter((x): x is string => typeof x === "string")
    : null;

  if (!savingsIds && !cardIds) {
    return NextResponse.json({ error: "savingsIds or cardIds array required" }, { status: 400 });
  }

  if (savingsIds) {
    const { error: del } = await supabase.from("saved_savings_accounts").delete().eq("user_id", user.id);
    if (del) {
      return NextResponse.json({ error: del.message }, { status: 500 });
    }
    if (savingsIds.length > 0) {
      const { error: ins } = await supabase.from("saved_savings_accounts").insert(
        savingsIds.map((account_id) => ({ user_id: user.id, account_id })),
      );
      if (ins) {
        return NextResponse.json({ error: ins.message }, { status: 500 });
      }
    }
  }

  if (cardIds) {
    const { error: del } = await supabase.from("saved_credit_cards").delete().eq("user_id", user.id);
    if (del) {
      return NextResponse.json({ error: del.message }, { status: 500 });
    }
    if (cardIds.length > 0) {
      const { error: ins } = await supabase.from("saved_credit_cards").insert(
        cardIds.map((card_id) => ({ user_id: user.id, card_id })),
      );
      if (ins) {
        return NextResponse.json({ error: ins.message }, { status: 500 });
      }
    }
  }

  return NextResponse.json({ ok: true });
}
