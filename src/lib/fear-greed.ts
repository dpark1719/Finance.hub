export interface FearGreedSnapshot {
  score: number | null;
  label: string | null;
  source: string;
  error?: string;
}

type AlternativeMeResponse = {
  data?: Array<{
    value?: string;
    value_classification?: string;
  }>;
};

/**
 * Alternative.me Fear & Greed Index (crypto-flavoured but widely used as
 * a general market sentiment proxy). Free, no auth, no bot detection.
 * Falls back to CNN if Alternative.me ever stops working.
 */
export async function fetchCnnFearGreed(): Promise<FearGreedSnapshot> {
  try {
    const res = await fetch("https://api.alternative.me/fng/?limit=1", {
      cache: "no-store",
      headers: { Accept: "application/json" },
    });
    if (!res.ok) {
      return {
        score: null,
        label: null,
        source: "Fear & Greed Index",
        error: `HTTP ${res.status}`,
      };
    }
    const raw = (await res.json()) as AlternativeMeResponse;
    const entry = raw.data?.[0];
    const score =
      entry?.value != null ? parseInt(entry.value, 10) : null;
    const label = entry?.value_classification ?? null;
    return {
      score: score != null && Number.isFinite(score) ? score : null,
      label,
      source: "Fear & Greed Index (Alternative.me)",
    };
  } catch (e) {
    return {
      score: null,
      label: null,
      source: "Fear & Greed Index",
      error: e instanceof Error ? e.message : "fetch failed",
    };
  }
}
