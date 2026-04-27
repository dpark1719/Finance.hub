/**
 * Read Finnhub API key for server code (Route Handlers, RSC, etc.).
 * Uses bracket access so the Next.js/SWC bundler will not inline this at
 * build time with an empty value when the key is only set on the host
 * (e.g. Vercel) at request/runtime.
 * @see https://nextjs.org/docs/app/api-reference/config/next-config-js/env
 */
export function getFinnhubApiKey(): string | undefined {
  const raw = process.env["FINNHUB_API_KEY"];
  if (raw == null) return undefined;
  const t = raw.trim().replace(/^["']|["']$/g, "").trim();
  return t || undefined;
}
