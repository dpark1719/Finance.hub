/**
 * Wilder's RSI (default period 14) from closing prices, oldest → newest.
 */
export function rsiFromCloses(closes: number[], period = 14): number | null {
  if (closes.length < period + 1) return null;
  const delta: number[] = [];
  for (let i = 1; i < closes.length; i++) {
    delta.push(closes[i] - closes[i - 1]);
  }
  let gains = 0;
  let losses = 0;
  for (let i = 0; i < period; i++) {
    const d = delta[i];
    if (d >= 0) gains += d;
    else losses -= d;
  }
  let avgGain = gains / period;
  let avgLoss = losses / period;
  for (let i = period; i < delta.length; i++) {
    const d = delta[i];
    const g = d > 0 ? d : 0;
    const l = d < 0 ? -d : 0;
    avgGain = (avgGain * (period - 1) + g) / period;
    avgLoss = (avgLoss * (period - 1) + l) / period;
  }
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - 100 / (1 + rs);
}
