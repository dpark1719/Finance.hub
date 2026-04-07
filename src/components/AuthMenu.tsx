"use client";

import { createClient } from "@/lib/supabase/client";
import { useSupabaseUser } from "@/lib/hooks/useSupabaseUser";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

export function AuthMenu() {
  const { user, ready, configured } = useSupabaseUser();
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!panelRef.current?.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const signOut = useCallback(async () => {
    if (!configured) return;
    const sb = createClient();
    await sb.auth.signOut();
    setOpen(false);
  }, [configured]);

  if (!configured) {
    return (
      <span
        className="hidden max-w-[8rem] truncate rounded-md px-2 py-1.5 text-[10px] text-slate-500 dark:text-zinc-500 sm:inline"
        title="Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY for accounts"
      >
        Account
      </span>
    );
  }

  if (!ready) {
    return (
      <span className="inline-flex h-9 w-9 items-center justify-center rounded-md text-slate-400 dark:text-zinc-600">
        …
      </span>
    );
  }

  if (!user) {
    return (
      <Link
        href="/login"
        className="touch-manipulation rounded-md border border-slate-300 dark:border-zinc-600 bg-slate-50 dark:bg-zinc-900 px-2.5 py-1.5 text-xs font-medium text-slate-800 dark:text-zinc-200 hover:bg-slate-200 dark:hover:bg-zinc-800"
      >
        Log in
      </Link>
    );
  }

  const label =
    user.user_metadata?.full_name ??
    user.user_metadata?.name ??
    user.email?.split("@")[0] ??
    "Account";

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="touch-manipulation max-w-[10rem] truncate rounded-md border border-slate-300 dark:border-zinc-600 bg-slate-50 dark:bg-zinc-900 px-2.5 py-1.5 text-xs font-medium text-slate-800 dark:text-zinc-200 hover:bg-slate-200 dark:hover:bg-zinc-800"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        {label}
      </button>
      {open && (
        <div
          className="absolute right-0 top-full z-[60] mt-1 min-w-[12rem] rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 py-1 shadow-lg"
          role="menu"
        >
          <p className="truncate px-3 py-2 text-xs text-slate-500 dark:text-zinc-500">{user.email}</p>
          <button
            type="button"
            role="menuitem"
            onClick={() => void signOut()}
            className="w-full px-3 py-2 text-left text-sm text-slate-800 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800"
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
