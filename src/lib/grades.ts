import type { LetterGrade, MetricBlock } from "@/types/report";

function letterFromScore(score: number | null | undefined): LetterGrade {
  if (score == null || Number.isNaN(score)) return "—";
  if (score >= 85) return "A";
  if (score >= 70) return "B";
  if (score >= 55) return "C";
  if (score >= 40) return "D";
  return "F";
}

function fmtNum(n: number, digits = 2): string {
  return n.toLocaleString(undefined, {
    maximumFractionDigits: digits,
    minimumFractionDigits: 0,
  });
}

function fmtPct(n: number, digits = 1): string {
  return `${fmtNum(n, digits)}%`;
}

/** P/E: positive earnings — moderate multiples score better in a simple value lens; very high penalized. */
export function gradePe(pe: number | null): { grade: LetterGrade; score: number | null; detail: string } {
  if (pe == null) return { grade: "—", score: null, detail: "No trailing P/E available (may be unprofitable or data gap)." };
  if (pe <= 0) return { grade: "—", score: null, detail: "Negative or zero earnings — P/E is not a meaningful valuation yardstick here." };
  let score: number;
  if (pe < 12) score = 72;
  else if (pe < 18) score = 85;
  else if (pe < 28) score = 68;
  else if (pe < 45) score = 52;
  else score = 35;
  return {
    grade: letterFromScore(score),
    score,
    detail:
      pe < 18
        ? "Below ~18× trailing earnings often reads as modest or value-tilted vs. the broad market (context: growth and quality still matter)."
        : pe < 28
          ? "Near a typical “fair” range for many blue chips; compare to peers and growth."
          : "Elevated multiple — you are paying more per dollar of current earnings; needs strong growth or quality to justify.",
  };
}

/** Imputed upside from consensus target vs spot. */
export function gradeUpside(pct: number | null): { grade: LetterGrade; score: number | null; detail: string } {
  if (pct == null) return { grade: "—", score: null, detail: "No consensus target or price available." };
  let score: number;
  if (pct >= 25) score = 88;
  else if (pct >= 12) score = 76;
  else if (pct >= 0) score = 62;
  else if (pct >= -12) score = 48;
  else score = 32;
  const g = letterFromScore(score);
  const detail =
    pct >= 0
      ? `Street’s mean target implies ~${fmtPct(pct)} headroom to the 12‑month benchmark (targets can be stale or optimistic).`
      : `Price sits ~${fmtPct(Math.abs(pct))} above the mean target — analysts collectively see less near‑term upside at current levels.`;
  return { grade: g, score, detail };
}

/** PEG ~1.0 often cited as “fair” for growers. */
export function gradePeg(peg: number | null): { grade: LetterGrade; score: number | null; detail: string } {
  if (peg == null || peg <= 0) {
    return { grade: "—", score: null, detail: "PEG unavailable — need P/E and earnings growth; not computable for all names." };
  }
  let score: number;
  if (peg >= 0.7 && peg <= 1.2) score = 88;
  else if (peg <= 1.6) score = 72;
  else if (peg <= 2.2) score = 55;
  else score = 38;
  return {
    grade: letterFromScore(score),
    score,
    detail:
      peg <= 1.2
        ? "PEG near 1.0 suggests the multiple is roughly in line with growth — classic rule‑of‑thumb territory."
        : peg <= 2
          ? "Somewhat rich vs. growth: paying a noticeable premium per unit of expected EPS growth."
          : "High PEG — multiple is steep relative to growth assumptions (verify sustainability).",
  };
}

/** Lower D/E often safer outside financials; heuristic only. */
export function gradeDe(de: number | null): { grade: LetterGrade; score: number | null; detail: string } {
  if (de == null || de < 0) {
    return { grade: "—", score: null, detail: "Debt‑to‑equity not available; some sectors report differently." };
  }
  let score: number;
  if (de < 0.35) score = 86;
  else if (de < 0.85) score = 72;
  else if (de < 1.5) score = 58;
  else if (de < 2.5) score = 45;
  else score = 30;
  return {
    grade: letterFromScore(score),
    score,
    detail:
      de < 0.85
        ? "Leverage looks moderate by this simple lens — less reliance on borrowed money vs. equity."
        : de < 1.5
          ? "Meaningful but not extreme debt load; pair with interest coverage and cash flows."
          : "High D/E — balance sheet stress risk rises if rates, margins, or refinancing bite.",
  };
}

export function gradeFcf(
  fcf: number | null,
  currency: string | null,
): { grade: LetterGrade; score: number | null; detail: string } {
  if (fcf == null) {
    return { grade: "—", score: null, detail: "Free cash flow not extracted from statements — try another exchange or filing lag." };
  }
  const sym = currency ?? "USD";
  const abs = Math.abs(fcf);
  const mag = abs >= 1e9 ? `${fmtNum(abs / 1e9, 2)}B ${sym}` : `${fmtNum(abs / 1e6, 2)}M ${sym}`;
  if (fcf > 0) {
    const score = abs >= 50e6 ? 84 : 72;
    return {
      grade: letterFromScore(score),
      score,
      detail: `Positive FCF (~${mag}) — cash left after capex; supports dividends, buybacks, and resilience.`,
    };
  }
  return {
    grade: "D",
    score: 38,
    detail: `Negative FCF (~${mag}) — cash consumed after investments; can make sense for growth capex but tightens dividend headroom.`,
  };
}

export function gradeRoe(roe: number | null): { grade: LetterGrade; score: number | null; detail: string } {
  if (roe == null) return { grade: "—", score: null, detail: "ROE not reported for this symbol." };
  const r = roe > 2 ? roe : roe * 100;
  let score: number;
  if (r >= 20) score = 90;
  else if (r >= 15) score = 78;
  else if (r >= 10) score = 62;
  else if (r >= 5) score = 45;
  else score = 28;
  return {
    grade: letterFromScore(score),
    score,
    detail:
      r >= 15
        ? "Strong profit generation on shareholder equity — efficiency looks solid (watch leverage distortions)."
        : r >= 10
          ? "Respectable but not elite ROE vs. large‑cap peers."
          : "Weak ROE — low bang per buck of book equity unless cyclical trough or one‑offs.",
  };
}

/** RSI 14: user framing — extremes flag overbought/oversold. */
export function gradeRsi(rsi: number | null): { grade: LetterGrade; score: number | null; detail: string } {
  if (rsi == null) return { grade: "—", score: null, detail: "RSI could not be computed (insufficient history or API limit)." };
  let score: number;
  let detail: string;
  if (rsi >= 70) {
    score = 42;
    detail = "Above 70 — classic “overbought” territory (momentum hot; not a timing guarantee).";
  } else if (rsi <= 30) {
    score = 68;
    detail = "Below 30 — “oversold” by this rule; contrarians watch for stabilization (not automatic buy).";
  } else {
    score = 78;
    detail = "Between 30 and 70 — momentum not at typical extremes.";
  }
  return { grade: letterFromScore(score), score, detail };
}

/** Beta: informational grade centers near market beta 1.0 */
export function gradeBeta(beta: number | null): { grade: LetterGrade; score: number | null; detail: string } {
  if (beta == null || beta <= 0) {
    return { grade: "—", score: null, detail: "Beta not available — likely data gap for this listing." };
  }
  const diff = Math.abs(beta - 1);
  const score = Math.max(40, Math.round(85 - diff * 55));
  const detail =
    beta > 1.15
      ? `Beta ${fmtNum(beta, 2)} — materially more volatile than the broad market (rough S&P 500 guide).`
      : beta < 0.85
        ? `Beta ${fmtNum(beta, 2)} — typically less jumpy than the market on average (defensive tilt).`
        : `Beta ${fmtNum(beta, 2)} — close to market‑like volatility.`;
  return { grade: letterFromScore(score), score, detail };
}

export function gradeFearGreed(
  score: number | null,
  label: string | null,
): { grade: LetterGrade; detail: string; scoreN: number | null } {
  if (score == null) {
    return {
      grade: "—",
      detail: "Macro sentiment index unavailable (network or upstream change).",
      scoreN: null,
    };
  }
  const inv = 100 - score;
  const grade = letterFromScore(inv);
  const lbl = label ? ` (${label})` : "";
  const detail =
    score <= 25
      ? `Reading ~${fmtNum(score, 0)}${lbl} — “Extreme Fear” regime: contrarians note history of better forward returns from panic (not advice).`
      : score >= 75
        ? `Reading ~${fmtNum(score, 0)}${lbl} — “Extreme Greed”: euphoria risk; many investors get more cautious here.`
        : `Reading ~${fmtNum(score, 0)}${lbl} — mid‑range sentiment; neither panic nor euphoria by this gauge.`;
  return { grade, detail, scoreN: inv };
}

export function gradePayout(payoutPct: number | null): { grade: LetterGrade; score: number | null; detail: string } {
  if (payoutPct == null) {
    return { grade: "—", score: null, detail: "Payout ratio unknown — may be non‑dividend stock or missing EPS/dividend data." };
  }
  let score: number;
  if (payoutPct <= 0) score = 70;
  else if (payoutPct < 50) score = 82;
  else if (payoutPct <= 70) score = 68;
  else if (payoutPct <= 80) score = 48;
  else score = 28;
  const detail =
    payoutPct <= 0
      ? "No dividend payout — growth or cash retention focus."
      : payoutPct > 80
        ? `~${fmtPct(payoutPct)} of earnings paid out — >75–80% often raises sustainability questions if earnings dip.`
        : `~${fmtPct(payoutPct)} payout — monitor coverage and FCF if dividends matter to you.`;
  return { grade: letterFromScore(score), score, detail };
}

export function buildMetricBlock(
  id: string,
  title: string,
  subtitle: string,
  value: string,
  graded: { grade: LetterGrade; score?: number | null; detail: string },
): MetricBlock {
  return {
    id,
    title,
    subtitle,
    value,
    grade: graded.grade,
    score: graded.score ?? undefined,
    detail: graded.detail,
  };
}
