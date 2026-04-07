"use client";

import { useSupabaseUser } from "@/lib/hooks/useSupabaseUser";
import { debounce } from "@/lib/debounce";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type CreditCard = {
  id: number;
  name: string;
  issuer: string;
  network: string;
  bonusValue: number;
  bonusDescription: string;
  annualFee: number | null;
  spendRequirement: string;
  spendTimeframe: string;
  isBusinessCard: boolean;
  cashbackOrTravel: "cashback" | "travel" | "mixed" | "unknown";
};

type BizFilter = "all" | "personal" | "business";
type RewardFilter = "all" | "travel" | "cashback";
type SortKey = "value" | "fee" | "spend";

function issuerChipClass(issuer: string): string {
  const i = issuer.toLowerCase();
  if (i.includes("chase")) return "bg-blue-600/95 text-white";
  if (i.includes("amex") || i.includes("american express"))
    return "bg-teal-700/95 text-white";
  if (i.includes("citi")) return "bg-sky-800/95 text-white";
  if (i.includes("capital")) return "bg-emerald-800/95 text-white";
  if (i.includes("discover")) return "bg-orange-700/95 text-white";
  if (i.includes("wells")) return "bg-amber-600/95 text-zinc-900";
  if (i.includes("bank of america") || i.includes("bofa"))
    return "bg-red-800/95 text-white";
  if (i.includes("usbank") || i.includes("u.s. bank"))
    return "bg-indigo-700/95 text-white";
  return "bg-violet-700/95 text-white";
}

function parseSpendNumber(s: string): number {
  const m = s.replace(/,/g, "").match(/(\d+(?:\.\d+)?)/);
  if (!m) return Number.POSITIVE_INFINITY;
  const n = parseFloat(m[0]);
  return Number.isFinite(n) ? n : Number.POSITIVE_INFINITY;
}

export default function CreditCardsPage() {
  const [cards, setCards] = useState<CreditCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, ready, configured } = useSupabaseUser();
  const [savedCardIds, setSavedCardIds] = useState<Set<string>>(new Set());
  const [savingsIdsMirror, setSavingsIdsMirror] = useState<string[]>([]);
  const savingsIdsRef = useRef<string[]>([]);
  const bookmarksReady = useRef(false);

  useEffect(() => {
    savingsIdsRef.current = savingsIdsMirror;
  }, [savingsIdsMirror]);

  const persistBookmarks = useMemo(
    () =>
      debounce((savingsIds: string[], cardIds: string[]) => {
        void fetch("/api/me/bookmarks", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ savingsIds, cardIds }),
        }).catch(() => {});
      }, 550),
    [],
  );

  useEffect(() => {
    if (!ready || !user || !configured) {
      bookmarksReady.current = false;
      return;
    }
    let cancelled = false;
    void fetch("/api/me/bookmarks")
      .then((r) => r.json())
      .then((d: { savingsIds?: string[]; cardIds?: string[] }) => {
        if (cancelled) return;
        setSavingsIdsMirror(d.savingsIds ?? []);
        setSavedCardIds(new Set(d.cardIds ?? []));
        bookmarksReady.current = true;
      });
    return () => {
      cancelled = true;
    };
  }, [ready, user, configured]);

  const toggleSavedCard = useCallback(
    (id: number) => {
      const sid = String(id);
      setSavedCardIds((prev) => {
        const next = new Set(prev);
        if (next.has(sid)) next.delete(sid);
        else next.add(sid);
        if (bookmarksReady.current && user && configured) {
          persistBookmarks(savingsIdsRef.current, [...next]);
        }
        return next;
      });
    },
    [persistBookmarks, user, configured],
  );

  const [q, setQ] = useState("");
  const [biz, setBiz] = useState<BizFilter>("all");
  const [reward, setReward] = useState<RewardFilter>("all");
  const [sort, setSort] = useState<SortKey>("value");
  const [maxFee, setMaxFee] = useState<"any" | "0" | "100" | "250" | "500">("any");
  const [maxSpend, setMaxSpend] = useState<"any" | "1000" | "3000" | "5000" | "10000">("any");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/credit-cards");
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(
            typeof body.error === "string" ? body.error : "Request failed"
          );
        }
        const data: CreditCard[] = await res.json();
        if (!cancelled) setCards(data);
      } catch (e) {
        if (!cancelled)
          setError(e instanceof Error ? e.message : "Something went wrong");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const list = cards.filter((c) => {
      if (q.trim()) {
        const qq = q.trim().toLowerCase();
        if (
          !c.name.toLowerCase().includes(qq) &&
          !c.issuer.toLowerCase().includes(qq)
        )
          return false;
      }
      if (biz === "personal" && c.isBusinessCard) return false;
      if (biz === "business" && !c.isBusinessCard) return false;
      if (reward === "travel") {
        if (c.cashbackOrTravel === "cashback") return false;
        if (c.cashbackOrTravel === "unknown") return false;
      }
      if (reward === "cashback") {
        if (c.cashbackOrTravel === "travel") return false;
        if (c.cashbackOrTravel === "unknown") return false;
      }
      if (maxFee !== "any") {
        const limit = Number(maxFee);
        const fee = c.annualFee ?? Infinity;
        if (fee > limit) return false;
      }
      if (maxSpend !== "any") {
        const limit = Number(maxSpend);
        const spend = parseSpendNumber(c.spendRequirement);
        if (spend > limit) return false;
      }
      return true;
    });

    const copy = [...list];
    copy.sort((a, b) => {
      if (sort === "value") return b.bonusValue - a.bonusValue;
      if (sort === "fee") {
        const af = (x: CreditCard) =>
          x.annualFee === null ? Number.POSITIVE_INFINITY : x.annualFee;
        return af(a) - af(b);
      }
      return parseSpendNumber(a.spendRequirement) - parseSpendNumber(b.spendRequirement);
    });
    return copy;
  }, [cards, q, biz, reward, sort, maxFee, maxSpend]);

  return (
    <main className="mx-auto min-w-0 max-w-6xl px-4 py-10 sm:px-6">
      <header className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">
          Credit Card Bonuses
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600 dark:text-zinc-400">
          Compare sign-up bonuses, annual fees, and spend requirements in one
          place—filter by personal or business cards and how you prefer to earn
          rewards.
        </p>
        {user && configured && (
          <p className="mt-2 text-xs text-slate-500 dark:text-zinc-500">
            Star cards while signed in to save them to your profile.
          </p>
        )}
      </header>

      <section className="mb-8 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-900/60 p-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0 flex-1">
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-zinc-500">
              Search
            </label>
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Card or issuer name…"
              className="w-full rounded-xl border border-slate-300 dark:border-zinc-700 bg-slate-100 dark:bg-zinc-950/80 px-3 py-2 text-sm text-slate-800 dark:text-zinc-100 placeholder:text-slate-500 dark:placeholder:text-zinc-500 focus:border-slate-400 dark:focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-slate-400 dark:focus:ring-zinc-500"
            />
          </div>
          <div className="flex flex-wrap gap-6">
            <div>
              <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-zinc-500">
                Card type
              </span>
              <div className="flex gap-2">
                {(
                  [
                    ["all", "All"],
                    ["personal", "Personal"],
                    ["business", "Business"],
                  ] as const
                ).map(([k, label]) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setBiz(k)}
                    className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
                      biz === k
                        ? "bg-slate-200 text-slate-900 dark:bg-zinc-100 dark:text-zinc-900"
                        : "bg-slate-100 dark:bg-zinc-800/80 text-slate-700 dark:text-zinc-300 hover:bg-slate-200 dark:hover:bg-zinc-800"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-zinc-500">
                Rewards
              </span>
              <div className="flex gap-2">
                {(
                  [
                    ["all", "All"],
                    ["travel", "Travel"],
                    ["cashback", "Cashback"],
                  ] as const
                ).map(([k, label]) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setReward(k)}
                    className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
                      reward === k
                        ? "bg-slate-200 text-slate-900 dark:bg-zinc-100 dark:text-zinc-900"
                        : "bg-slate-100 dark:bg-zinc-800/80 text-slate-700 dark:text-zinc-300 hover:bg-slate-200 dark:hover:bg-zinc-800"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-zinc-500">
                Max Annual Fee
              </label>
              <select
                value={maxFee}
                onChange={(e) => setMaxFee(e.target.value as typeof maxFee)}
                className="rounded-xl border border-slate-300 dark:border-zinc-700 bg-slate-100 dark:bg-zinc-950/80 px-3 py-2 text-sm text-slate-800 dark:text-zinc-100 focus:border-slate-400 dark:focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-slate-400 dark:focus:ring-zinc-500"
              >
                <option value="any">Any</option>
                <option value="0">$0 (No Fee)</option>
                <option value="100">Up to $100</option>
                <option value="250">Up to $250</option>
                <option value="500">Up to $500</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-zinc-500">
                Max Min Spend
              </label>
              <select
                value={maxSpend}
                onChange={(e) => setMaxSpend(e.target.value as typeof maxSpend)}
                className="rounded-xl border border-slate-300 dark:border-zinc-700 bg-slate-100 dark:bg-zinc-950/80 px-3 py-2 text-sm text-slate-800 dark:text-zinc-100 focus:border-slate-400 dark:focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-slate-400 dark:focus:ring-zinc-500"
              >
                <option value="any">Any</option>
                <option value="1000">Up to $1,000</option>
                <option value="3000">Up to $3,000</option>
                <option value="5000">Up to $5,000</option>
                <option value="10000">Up to $10,000</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-zinc-500">
                Sort
              </label>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortKey)}
                className="rounded-xl border border-slate-300 dark:border-zinc-700 bg-slate-100 dark:bg-zinc-950/80 px-3 py-2 text-sm text-slate-800 dark:text-zinc-100 focus:border-slate-400 dark:focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-slate-400 dark:focus:ring-zinc-500"
              >
                <option value="value">Best Value</option>
                <option value="fee">Lowest Fee</option>
                <option value="spend">Lowest Spend</option>
              </select>
            </div>
          </div>
        </div>
      </section>

      {loading && (
        <p className="text-sm text-slate-500 dark:text-zinc-500">Loading credit card offers…</p>
      )}
      {error && !loading && (
        <p className="text-sm text-red-400">{error}</p>
      )}

      {!loading && !error && (
        <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((c) => {
            const noFee = c.annualFee === 0;
            return (
              <li
                key={c.id}
                className="flex flex-col rounded-2xl border border-slate-200 dark:border-zinc-800 p-5 shadow-sm transition hover:border-slate-300 dark:border-zinc-700"
                style={{ backgroundColor: "var(--card)" }}
              >
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  {user && configured && (
                    <button
                      type="button"
                      onClick={() => toggleSavedCard(c.id)}
                      className={`shrink-0 rounded-md p-1 text-lg leading-none ${
                        savedCardIds.has(String(c.id))
                          ? "text-amber-400"
                          : "text-slate-400 dark:text-zinc-600"
                      }`}
                      aria-label={savedCardIds.has(String(c.id)) ? "Remove from saved" : "Save card"}
                      title={savedCardIds.has(String(c.id)) ? "Saved" : "Save"}
                    >
                      {savedCardIds.has(String(c.id)) ? "★" : "☆"}
                    </button>
                  )}
                  <span
                    className={`inline-flex max-w-full truncate rounded-md px-2 py-0.5 text-xs font-semibold ${issuerChipClass(c.issuer)}`}
                  >
                    {c.issuer}
                  </span>
                  {noFee && (
                    <span className="rounded-md bg-emerald-900/50 px-2 py-0.5 text-xs font-medium text-emerald-300 ring-1 ring-emerald-700/50">
                      No Fee
                    </span>
                  )}
                </div>
                <h2 className="text-lg font-semibold leading-snug text-slate-900 dark:text-white">
                  {c.name}
                </h2>
                <p className="mt-3 text-3xl font-bold tabular-nums text-emerald-400">
                  ${c.bonusValue.toLocaleString("en-US", { maximumFractionDigits: 0 })}
                  <span className="ml-1 text-sm font-normal text-slate-500 dark:text-zinc-500">
                    est. value
                  </span>
                </p>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-600 dark:text-zinc-400">
                  {c.bonusDescription}
                </p>
                <dl className="mt-4 space-y-2 border-t border-slate-200 dark:border-zinc-800 pt-4 text-sm">
                  <div className="flex justify-between gap-2">
                    <dt className="text-slate-500 dark:text-zinc-500">Annual fee</dt>
                    <dd className="text-right text-slate-800 dark:text-zinc-200">
                      {c.annualFee === null
                        ? "—"
                        : `$${c.annualFee.toLocaleString("en-US")}`}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-slate-500 dark:text-zinc-500">Spend requirement</dt>
                    <dd className="text-right text-slate-800 dark:text-zinc-200">{c.spendRequirement}</dd>
                  </div>
                  {c.spendTimeframe !== "—" && (
                    <div className="flex justify-between gap-2">
                      <dt className="text-slate-500 dark:text-zinc-500">Timeframe</dt>
                      <dd className="text-right text-slate-800 dark:text-zinc-200">{c.spendTimeframe}</dd>
                    </div>
                  )}
                </dl>
                <div className="mt-4">
                  <span className="inline-flex rounded-md border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900/50 px-2 py-1 text-xs font-medium text-slate-700 dark:text-zinc-300">
                    {c.network}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {!loading && !error && filtered.length === 0 && (
        <p className="text-sm text-slate-500 dark:text-zinc-500">No cards match your filters.</p>
      )}
    </main>
  );
}
