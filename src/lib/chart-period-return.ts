export function periodChangePctFromPoints(
  points: readonly { c: number }[],
): number | null {
  if (points.length < 2) return null;
  const first = points[0].c;
  const last = points[points.length - 1].c;
  if (!Number.isFinite(first) || !Number.isFinite(last) || first === 0) return null;
  return ((last - first) / first) * 100;
}

export function formatPeriodChangePct(n: number | null): string {
  if (n == null || !Number.isFinite(n)) return "—";
  const sign = n >= 0 ? "+" : "";
  return `${sign}${n.toFixed(2)}%`;
}
