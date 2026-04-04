"use client";

import { useEffect, useMemo, useState } from "react";

type HistoryPoint = { date: string; rate: number };

type RateRow = {
  id: string;
  name: string;
  country: string;
  flag: string;
  current: number;
  previous: number;
  lastChange: string;
  nextMeeting: string | null;
  history: HistoryPoint[];
};

function Sparkline({ history }: { history: HistoryPoint[] }) {
  const w = 200;
  const h = 48;
  const pad = 4;
  const rates = history.map((h) => h.rate);
  const minR = Math.min(...rates);
  const maxR = Math.max(...rates);
  const span = maxR - minR || 1;
  const n = rates.length;
  const pts = rates.map((r, i) => {
    const x = pad + (i / Math.max(1, n - 1)) * (w - pad * 2);
    const y = pad + (1 - (r - minR) / span) * (h - pad * 2);
    return `${x},${y}`;
  });

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className="h-12 w-full max-w-[200px]"
      preserveAspectRatio="none"
      aria-hidden
    >
      <polyline
        fill="none"
        stroke="rgb(59 130 246 / 0.85)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={pts.join(" ")}
      />
    </svg>
  );
}

function ChangeBadge({ current, previous }: { current: number; previous: number }) {
  const delta = current - previous;
  if (delta === 0) {
    return (
      <span className="text-sm font-medium text-zinc-500">No change vs prior</span>
    );
  }
  const up = delta > 0;
  return (
    <span
      className={`inline-flex items-center gap-1 text-sm font-semibold ${
        up ? "text-red-400" : "text-emerald-400"
      }`}
    >
      <span aria-hidden>{up ? "↑" : "↓"}</span>
      <span>
        {up ? "Higher" : "Lower"} vs prior ({previous.toFixed(2)}%)
      </span>
    </span>
  );
}

export default function RatesPage() {
  const [rates, setRates] = useState<RateRow[]>([]);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/rates");
        const data = await res.json().catch(() => []);
        if (!res.ok) {
          setErr("Could not load rates");
          return;
        }
        if (!cancelled) setRates(Array.isArray(data) ? data : []);
      } catch {
        if (!cancelled) setErr("Network error");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const fed = rates.find((r) => r.id === "fed");
  const boj = rates.find((r) => r.id === "boj");
  const bok = rates.find((r) => r.id === "bok");

  const spreads = useMemo(() => {
    if (!fed || !boj || !bok) return null;
    const usJp = fed.current - boj.current;
    const usKr = fed.current - bok.current;
    return { usJp, usKr };
  }, [fed, boj, bok]);

  return (
    <main className="mx-auto min-h-screen max-w-5xl px-4 py-10 sm:px-6">
      <header className="mb-10 border-b border-zinc-800 pb-8">
        <p className="font-mono text-xs uppercase tracking-widest text-zinc-500">
          Macro
        </p>
        <h1
          className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl"
          style={{ fontFamily: "var(--font-dm-sans), system-ui" }}
        >
          Interest Rates
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-zinc-400">
          Central bank policy rates and the U.S. 10-year Treasury benchmark —
          static snapshot for illustration (no live FRED feed). Use for context
          on policy stance and yield curve anchors, not trading signals.
        </p>
      </header>

      {err && (
        <p className="mb-6 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {err}
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {rates.map((r) => (
          <article
            key={r.id}
            className="flex flex-col rounded-xl border border-zinc-800 bg-[var(--card)] p-5 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-lg">
                  <span className="mr-2" aria-hidden>
                    {r.flag}
                  </span>
                  <span className="text-zinc-300">{r.country}</span>
                </p>
                <h2 className="mt-1 text-sm font-medium text-zinc-500">{r.name}</h2>
              </div>
            </div>

            <p
              className="mt-4 text-4xl font-semibold tabular-nums tracking-tight text-white"
              style={{ fontFamily: "var(--font-dm-sans), system-ui" }}
            >
              {r.current.toFixed(2)}
              <span className="text-2xl font-medium text-zinc-400">%</span>
            </p>

            <div className="mt-2">
              <ChangeBadge current={r.current} previous={r.previous} />
            </div>

            <dl className="mt-4 grid gap-2 text-sm text-zinc-400">
              <div className="flex justify-between gap-4">
                <dt>Last change</dt>
                <dd className="text-zinc-300">{r.lastChange}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt>Next meeting</dt>
                <dd className="text-zinc-300">
                  {r.nextMeeting ?? "—"}
                </dd>
              </div>
            </dl>

            <div className="mt-4 border-t border-zinc-800/80 pt-4">
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-zinc-500">
                History
              </p>
              <Sparkline history={r.history} />
            </div>
          </article>
        ))}
      </div>

      {spreads && (
        <section className="mt-12 rounded-xl border border-zinc-800 bg-[var(--card)] p-6">
          <h2 className="text-lg font-semibold text-white">Rate differential</h2>
          <p className="mt-2 text-sm leading-relaxed text-zinc-400">
            The gap between U.S. policy rates and those in Japan and Korea
            matters for{" "}
            <span className="text-zinc-300">carry trades</span>: investors borrow
            in low-rate currencies (often JPY) and invest in higher-yielding
            assets elsewhere. Wider spreads can attract such flows; narrowing
            spreads or FX volatility can unwind positions quickly.
          </p>
          <ul className="mt-6 space-y-4">
            <li className="flex flex-wrap items-baseline justify-between gap-2 border-b border-zinc-800/80 pb-4">
              <span className="text-zinc-400">U.S. vs Japan (Fed − BOJ)</span>
              <span className="text-2xl font-semibold tabular-nums text-emerald-300">
                +{spreads.usJp.toFixed(2)} pp
              </span>
            </li>
            <li className="flex flex-wrap items-baseline justify-between gap-2">
              <span className="text-zinc-400">U.S. vs Korea (Fed − BOK)</span>
              <span className="text-2xl font-semibold tabular-nums text-emerald-300">
                +{spreads.usKr.toFixed(2)} pp
              </span>
            </li>
          </ul>
        </section>
      )}
    </main>
  );
}
