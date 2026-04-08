"use client";

import { useSupabaseUser } from "@/lib/hooks/useSupabaseUser";
import { debounce } from "@/lib/debounce";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type WatchlistRow = { id: string; name: string; sort_order: number; symbols: string[] };

export function WatchlistsPanel(props: {
  /** Increment to add `tickerToAdd` to the active list (e.g. button click). */
  addRequest?: number;
  tickerToAdd?: string;
  /** Load stock report for this symbol (e.g. stocks page). */
  onSelectSymbol?: (symbol: string) => void;
  /** Highlight row matching the open report symbol. */
  selectedSymbol?: string | null;
  className?: string;
}) {
  const {
    addRequest = 0,
    tickerToAdd = "",
    onSelectSymbol,
    selectedSymbol = null,
    className = "",
  } = props;
  const { user, ready, configured } = useSupabaseUser();
  const [lists, setLists] = useState<WatchlistRow[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [addInput, setAddInput] = useState("");
  const [newListName, setNewListName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const listsRef = useRef(lists);
  listsRef.current = lists;

  const saveSymbols = useMemo(
    () =>
      debounce((watchlistId: string, symbols: string[]) => {
        void fetch(`/api/me/watchlists/${watchlistId}/symbols`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ symbols }),
        }).catch(() => {});
      }, 650),
    [],
  );

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/me/watchlists");
      const data = (await res.json()) as { watchlists?: WatchlistRow[]; error?: string };
      if (!res.ok) {
        setError(data.error ?? "Failed to load watchlists");
        return;
      }
      let next = data.watchlists ?? [];
      if (next.length === 0) {
        const create = await fetch("/api/me/watchlists", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: "Main" }),
        });
        const created = (await create.json()) as { watchlist?: WatchlistRow; error?: string };
        if (create.ok && created.watchlist) {
          next = [{ ...created.watchlist, symbols: [] }];
        }
      }
      setLists(next);
      setActiveId((id) => {
        if (id && next.some((l) => l.id === id)) return id;
        return next[0]?.id ?? null;
      });
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (ready && user && configured) void load();
    if (ready && !user) {
      setLists([]);
      setActiveId(null);
    }
  }, [ready, user, configured, load]);

  const active = lists.find((l) => l.id === activeId) ?? null;

  const updateSymbols = useCallback(
    (watchlistId: string, symbols: string[]) => {
      setLists((prev) => prev.map((l) => (l.id === watchlistId ? { ...l, symbols } : l)));
      saveSymbols(watchlistId, symbols);
    },
    [saveSymbols],
  );

  const addSymbol = useCallback(
    (raw: string) => {
      if (!active) return;
      const s = raw.trim().toUpperCase();
      if (!s) return;
      const cur = active.symbols;
      if (cur.includes(s)) return;
      updateSymbols(active.id, [...cur, s]);
      setAddInput("");
    },
    [active, updateSymbols],
  );

  const lastAddRequest = useRef(0);
  useEffect(() => {
    if (!active || addRequest === 0 || addRequest === lastAddRequest.current) return;
    lastAddRequest.current = addRequest;
    const s = tickerToAdd.trim().toUpperCase();
    if (!s || active.symbols.includes(s)) return;
    updateSymbols(active.id, [...active.symbols, s]);
  }, [addRequest, tickerToAdd, active, updateSymbols]);

  const removeSymbol = (sym: string) => {
    if (!active) return;
    updateSymbols(
      active.id,
      active.symbols.filter((x) => x !== sym),
    );
  };

  const createList = async () => {
    const name = newListName.trim();
    if (!name) return;
    setNewListName("");
    const res = await fetch("/api/me/watchlists", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    const data = (await res.json()) as { watchlist?: WatchlistRow; error?: string };
    if (!res.ok) {
      setError(data.error ?? "Could not create list");
      return;
    }
    if (data.watchlist) {
      const row = { ...data.watchlist, symbols: data.watchlist.symbols ?? [] };
      setLists((p) => [...p, row]);
      setActiveId(row.id);
    }
  };

  const deleteList = async (id: string) => {
    if (!confirm("Delete this watchlist and its symbols?")) return;
    const res = await fetch(`/api/me/watchlists/${id}`, { method: "DELETE" });
    if (!res.ok) return;
    setLists((p) => p.filter((l) => l.id !== id));
    setActiveId((cur) => {
      if (cur !== id) return cur;
      const rest = listsRef.current.filter((l) => l.id !== id);
      return rest[0]?.id ?? null;
    });
  };

  if (!configured || !ready || !user) {
    return null;
  }

  const selectedUpper = selectedSymbol?.trim().toUpperCase() ?? "";

  return (
    <section
      className={`rounded-2xl border border-slate-200 dark:border-zinc-800 bg-slate-50/90 dark:bg-zinc-900/50 p-4 sm:p-5 ${className}`}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Watchlists</h2>
          <p className="mt-0.5 text-xs text-slate-600 dark:text-zinc-500">
            Saved to your account · updates sync automatically
          </p>
        </div>
        {loading && <span className="text-xs text-slate-500">Loading…</span>}
      </div>

      {error && (
        <p className="mt-2 text-xs text-red-400" role="alert">
          {error}
        </p>
      )}

      <div className="mt-4 flex flex-wrap items-end gap-2">
        <div className="min-w-0 flex-1 sm:max-w-xs">
          <label className="text-xs font-medium text-slate-500 dark:text-zinc-500">Active list</label>
          <select
            value={activeId ?? ""}
            onChange={(e) => setActiveId(e.target.value || null)}
            className="mt-1 w-full rounded-lg border border-slate-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 px-3 py-2 text-sm text-slate-900 dark:text-white"
          >
            {lists.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name} ({l.symbols.length})
              </option>
            ))}
          </select>
        </div>
        <button
          type="button"
          onClick={() => activeId && void deleteList(activeId)}
          disabled={!activeId || lists.length <= 1}
          className="rounded-lg border border-red-500/40 px-3 py-2 text-xs font-medium text-red-300 hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Delete list
        </button>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <input
          type="text"
          value={newListName}
          onChange={(e) => setNewListName(e.target.value)}
          placeholder="New list name"
          className="min-w-[8rem] flex-1 rounded-lg border border-slate-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 px-3 py-2 text-sm text-slate-900 dark:text-white sm:max-w-[12rem]"
        />
        <button
          type="button"
          onClick={() => void createList()}
          className="rounded-lg bg-slate-200 dark:bg-zinc-800 px-3 py-2 text-xs font-medium text-slate-900 dark:text-white hover:bg-slate-300 dark:hover:bg-zinc-700"
        >
          New list
        </button>
      </div>

      {active && (
        <>
          <div className="mt-4 flex flex-wrap gap-2">
            <input
              type="text"
              value={addInput}
              onChange={(e) => setAddInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addSymbol(addInput)}
              placeholder="Ticker (e.g. AAPL)"
              className="min-w-0 flex-1 rounded-lg border border-slate-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 px-3 py-2 font-mono text-sm text-slate-900 dark:text-white sm:max-w-xs"
            />
            <button
              type="button"
              onClick={() => addSymbol(addInput)}
              className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-medium text-white hover:bg-blue-500"
            >
              Add symbol
            </button>
          </div>
          {active.symbols.length > 0 ? (
            <div className="mt-3 min-h-0">
              <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-slate-500 dark:text-zinc-500">
                Tap a symbol to open report
              </p>
              <ul
                className="max-h-[min(32rem,calc(100dvh-12rem))] space-y-1 overflow-y-auto rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950/40 p-1"
                role="list"
              >
                {active.symbols.map((sym) => {
                  const isSelected = selectedUpper !== "" && sym.toUpperCase() === selectedUpper;
                  return (
                    <li key={sym} className="flex min-w-0 items-stretch gap-0.5">
                      <button
                        type="button"
                        onClick={() => onSelectSymbol?.(sym)}
                        className={`min-w-0 flex-1 rounded-lg px-3 py-2.5 text-left font-mono text-sm transition hover:bg-slate-100 dark:hover:bg-zinc-800/80 ${
                          isSelected
                            ? "bg-blue-500/15 text-blue-800 ring-1 ring-blue-500/40 dark:text-blue-200 dark:ring-blue-400/30"
                            : "text-slate-900 dark:text-zinc-100"
                        }`}
                      >
                        {sym}
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeSymbol(sym);
                        }}
                        className="shrink-0 rounded-lg px-2.5 py-2 text-slate-500 hover:bg-red-500/10 hover:text-red-600 dark:text-zinc-500 dark:hover:text-red-400"
                        aria-label={`Remove ${sym}`}
                      >
                        ×
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : (
            <p className="mt-3 text-xs text-slate-500 dark:text-zinc-500">No symbols yet.</p>
          )}
        </>
      )}
    </section>
  );
}
