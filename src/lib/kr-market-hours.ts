/**
 * Korea equity regular session (KOSPI/KOSDAQ cash), simplified — no exchange holidays.
 */

export type KrEquitySession = "open" | "closed";

export function getKrEquitySession(now: Date = new Date()): KrEquitySession {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Seoul",
    weekday: "short",
    hour: "numeric",
    minute: "numeric",
    hour12: false,
  }).formatToParts(now);
  const wd = parts.find((p) => p.type === "weekday")?.value ?? "";
  if (wd === "Sat" || wd === "Sun") return "closed";
  const hour = parseInt(parts.find((p) => p.type === "hour")?.value ?? "0", 10);
  const minute = parseInt(parts.find((p) => p.type === "minute")?.value ?? "0", 10);
  const mins = hour * 60 + minute;
  const open = 9 * 60;
  const close = 15 * 60 + 30;
  if (mins >= open && mins < close) return "open";
  return "closed";
}
