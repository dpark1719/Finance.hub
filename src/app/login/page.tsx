"use client";

import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useState } from "react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const err = searchParams.get("error");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"magic" | "password">("magic");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState<string | null>(null);

  const origin = typeof window !== "undefined" ? window.location.origin : "";

  const oauth = useCallback(
    async (provider: "google" | "apple") => {
      if (!isSupabaseConfigured()) return;
      setLoading(provider);
      setMessage(null);
      const sb = createClient();
      const { error } = await sb.auth.signInWithOAuth({
        provider,
        options: { redirectTo: `${origin}/auth/callback` },
      });
      setLoading(null);
      if (error) setMessage(error.message);
    },
    [origin],
  );

  const sendMagicLink = useCallback(async () => {
    if (!isSupabaseConfigured() || !email.trim()) return;
    setLoading("magic");
    setMessage(null);
    const sb = createClient();
    const { error } = await sb.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: `${origin}/auth/callback` },
    });
    setLoading(null);
    if (error) {
      setMessage(error.message);
      return;
    }
    setMessage("Check your email for the sign-in link.");
  }, [email, origin]);

  const passwordAuth = useCallback(async () => {
    if (!isSupabaseConfigured() || !email.trim() || !password) return;
    setLoading("password");
    setMessage(null);
    const sb = createClient();
    const { error } = await sb.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setLoading(null);
    if (error) {
      setMessage(error.message);
      return;
    }
    router.replace("/");
    router.refresh();
  }, [email, password, router]);

  const signUpPassword = useCallback(async () => {
    if (!isSupabaseConfigured() || !email.trim() || password.length < 6) {
      setMessage("Use at least 6 characters for the password.");
      return;
    }
    setLoading("signup");
    setMessage(null);
    const sb = createClient();
    const { error } = await sb.auth.signUp({
      email: email.trim(),
      password,
      options: { emailRedirectTo: `${origin}/auth/callback` },
    });
    setLoading(null);
    if (error) {
      setMessage(error.message);
      return;
    }
    setMessage("If email confirmation is required, check your inbox. Otherwise you are signed in.");
    router.refresh();
  }, [email, password, origin, router]);

  if (!isSupabaseConfigured()) {
    return (
      <main className="mx-auto max-w-md px-4 py-16">
        <p className="text-sm text-slate-600 dark:text-zinc-400">
          Supabase environment variables are not set. Add{" "}
          <code className="rounded bg-slate-200 px-1 dark:bg-zinc-800">NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
          <code className="rounded bg-slate-200 px-1 dark:bg-zinc-800">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>{" "}
          to <code className="rounded bg-slate-200 px-1 dark:bg-zinc-800">.env.local</code>, run the SQL migration
          in <code className="rounded bg-slate-200 px-1 dark:bg-zinc-800">supabase/migrations</code>, then restart
          the dev server.
        </p>
        <Link href="/" className="mt-6 inline-block text-sm font-medium text-blue-600 dark:text-blue-400">
          ← Home
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-md px-4 py-16">
      <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Log in or sign up</h1>
      <p className="mt-2 text-sm text-slate-600 dark:text-zinc-400">
        Use Google, Apple, or email. Your watchlists and saved settings sync when you are signed in.
      </p>

      {err && (
        <p className="mt-4 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">
          Sign-in failed. Try again.
        </p>
      )}

      <div className="mt-8 flex flex-col gap-3">
        <button
          type="button"
          onClick={() => void oauth("google")}
          disabled={loading !== null}
          className="rounded-lg border border-slate-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 px-4 py-3 text-sm font-medium text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-zinc-800 disabled:opacity-50"
        >
          {loading === "google" ? "Redirecting…" : "Continue with Google"}
        </button>
        <button
          type="button"
          onClick={() => void oauth("apple")}
          disabled={loading !== null}
          className="rounded-lg border border-slate-300 dark:border-zinc-600 bg-slate-900 px-4 py-3 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100"
        >
          {loading === "apple" ? "Redirecting…" : "Continue with Apple"}
        </button>
      </div>

      <div className="my-8 border-t border-slate-200 dark:border-zinc-800 pt-8">
        <div className="mb-4 flex gap-2">
          <button
            type="button"
            onClick={() => setMode("magic")}
            className={`rounded-md px-3 py-1.5 text-xs font-medium ${
              mode === "magic"
                ? "bg-slate-200 dark:bg-zinc-800 text-slate-900 dark:text-white"
                : "text-slate-600 dark:text-zinc-400"
            }`}
          >
            Email magic link
          </button>
          <button
            type="button"
            onClick={() => setMode("password")}
            className={`rounded-md px-3 py-1.5 text-xs font-medium ${
              mode === "password"
                ? "bg-slate-200 dark:bg-zinc-800 text-slate-900 dark:text-white"
                : "text-slate-600 dark:text-zinc-400"
            }`}
          >
            Email + password
          </button>
        </div>

        <label className="block text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-zinc-500">
          Email
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          className="mt-1 w-full rounded-lg border border-slate-300 dark:border-zinc-600 bg-slate-50 dark:bg-zinc-900 px-3 py-2 text-sm text-slate-900 dark:text-white"
        />

        {mode === "password" && (
          <>
            <label className="mt-4 block text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-zinc-500">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              className="mt-1 w-full rounded-lg border border-slate-300 dark:border-zinc-600 bg-slate-50 dark:bg-zinc-900 px-3 py-2 text-sm text-slate-900 dark:text-white"
            />
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => void passwordAuth()}
                disabled={loading !== null}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50"
              >
                {loading === "password" ? "…" : "Sign in"}
              </button>
              <button
                type="button"
                onClick={() => void signUpPassword()}
                disabled={loading !== null}
                className="rounded-lg border border-slate-300 dark:border-zinc-600 px-4 py-2 text-sm font-medium text-slate-800 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 disabled:opacity-50"
              >
                {loading === "signup" ? "…" : "Create account"}
              </button>
            </div>
          </>
        )}

        {mode === "magic" && (
          <button
            type="button"
            onClick={() => void sendMagicLink()}
            disabled={loading !== null || !email.trim()}
            className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50"
          >
            {loading === "magic" ? "Sending…" : "Send magic link"}
          </button>
        )}
      </div>

      {message && <p className="mt-4 text-sm text-slate-700 dark:text-zinc-300">{message}</p>}

      <Link href="/" className="mt-10 inline-block text-sm text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white">
        ← Back to app
      </Link>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<main className="mx-auto max-w-md px-4 py-16 text-sm text-slate-500">Loading…</main>}>
      <LoginForm />
    </Suspense>
  );
}
