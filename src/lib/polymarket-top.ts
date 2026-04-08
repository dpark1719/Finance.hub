/**
 * Polymarket Gamma API — read-only market discovery (no API key).
 * @see https://docs.polymarket.com/
 */

export type PolymarketOutcome = {
  name: string;
  /** Implied probability 0–1 from outcome price. */
  probability: number;
};

export type PolymarketTopMarket = {
  id: string;
  question: string;
  slug: string;
  polymarketUrl: string;
  outcomes: PolymarketOutcome[];
  /** USDC notional traded in last 24h (Gamma field). */
  volume24hr: number;
  /** Cumulative volume (Gamma `volumeNum` / `volume`). */
  volumeTotal: number;
  /** Book liquidity (Gamma `liquidityNum`). */
  liquidity: number;
};

const GAMMA_TOP =
  "https://gamma-api.polymarket.com/markets?active=true&closed=false&order=volume24hr&ascending=false&limit=10";

function parseStringArray(v: unknown): string[] {
  if (Array.isArray(v)) return v.map((x) => String(x));
  if (typeof v === "string") {
    try {
      const p = JSON.parse(v) as unknown;
      return Array.isArray(p) ? p.map((x) => String(x)) : [];
    } catch {
      return [];
    }
  }
  return [];
}

function parseNumberArray(v: unknown): number[] {
  if (Array.isArray(v)) {
    return v.map((x) => {
      const n = typeof x === "number" ? x : parseFloat(String(x));
      return Number.isFinite(n) ? n : 0;
    });
  }
  if (typeof v === "string") {
    try {
      const p = JSON.parse(v) as unknown;
      return Array.isArray(p) ? parseNumberArray(p) : [];
    } catch {
      return [];
    }
  }
  return [];
}

function toNum(v: unknown): number {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const n = parseFloat(v);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

function parseMarket(m: Record<string, unknown>): PolymarketTopMarket | null {
  const id = String(m.id ?? "").trim();
  const question = String(m.question ?? "").trim();
  const slug = String(m.slug ?? "").trim();
  if (!question || !slug) return null;

  const names = parseStringArray(m.outcomes);
  const prices = parseNumberArray(m.outcomePrices);
  const outcomes: PolymarketOutcome[] = [];
  const n = Math.max(names.length, prices.length);
  for (let i = 0; i < n; i++) {
    const name = names[i]?.trim() || `Outcome ${i + 1}`;
    let p = prices[i];
    if (p == null || !Number.isFinite(p)) p = 0;
    if (p > 1 && p <= 100) p = p / 100;
    if (p < 0 || p > 1) p = Math.min(1, Math.max(0, p));
    outcomes.push({ name, probability: p });
  }

  const volume24hr = toNum(m.volume24hr ?? m.volume24hrClob);
  const volumeTotal = toNum(m.volumeNum ?? m.volume ?? m.volumeClob);
  const liquidity = toNum(m.liquidityNum ?? m.liquidityClob ?? m.liquidity);

  return {
    id,
    question,
    slug,
    polymarketUrl: `https://polymarket.com/market/${encodeURIComponent(slug)}`,
    outcomes,
    volume24hr,
    volumeTotal,
    liquidity,
  };
}

export async function fetchPolymarketTopByVolume24h(): Promise<PolymarketTopMarket[]> {
  const res = await fetch(GAMMA_TOP, {
    headers: { Accept: "application/json" },
    next: { revalidate: 120 },
  });
  if (!res.ok) {
    throw new Error(`Polymarket Gamma HTTP ${res.status}`);
  }
  const raw = (await res.json()) as unknown;
  if (!Array.isArray(raw)) {
    throw new Error("Polymarket Gamma: expected array");
  }
  const markets: PolymarketTopMarket[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = parseMarket(item as Record<string, unknown>);
    if (row) markets.push(row);
  }
  return markets;
}
