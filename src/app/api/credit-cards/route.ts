import { NextResponse } from "next/server";

const DATA_URL =
  "https://raw.githubusercontent.com/andenacitelli/credit-card-bonuses-api/master/exports/data.json";

const CACHE_MS = 6 * 60 * 60 * 1000;

export type CreditCardDto = {
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

type RawOfferAmount = { amount?: unknown };

type RawOffer = {
  spend?: unknown;
  amount?: RawOfferAmount[];
  days?: unknown;
};

type RawCard = {
  cardId?: unknown;
  name?: unknown;
  issuer?: unknown;
  network?: unknown;
  currency?: unknown;
  isBusiness?: unknown;
  annualFee?: unknown;
  offers?: unknown;
  discontinued?: unknown;
};

const cache = new Map<string, { ts: number; data: CreditCardDto[] }>();

const CPP_BY_CURRENCY: Record<string, number> = {
  DELTA: 1.2,
  UNITED: 1.3,
  ALASKA: 1.3,
  SOUTHWEST: 1.4,
  JETBLUE: 1.3,
  HILTON: 0.5,
  MARRIOTT: 0.7,
  IHG: 0.5,
  HYATT: 1.7,
  AMEX_MR: 2.0,
  CHASE_UR: 2.0,
  CITI_TYP: 1.0,
  CAPITAL_ONE: 1.0,
  VENTURE: 1.0,
  CASH_BACK: 1.0,
};

function centsPerPoint(currency: string): number {
  return CPP_BY_CURRENCY[currency] ?? 1.0;
}

/** e.g. AMERICAN_EXPRESS -> American Express, CHASE -> Chase */
function formatIssuerOrNetwork(value: unknown): string {
  if (typeof value !== "string" || !value.trim()) return "Unknown";
  const s = value.trim();
  const special: Record<string, string> = {
    BANK_OF_AMERICA: "Bank of America",
    US_BANK: "U.S. Bank",
  };
  if (special[s]) return special[s];
  return s
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

function parseFiniteNumber(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const n = parseFloat(v.replace(/[^0-9.-]/g, ""));
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function formatUsd(amount: number): string {
  return `$${amount.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}

/** Human-readable program name for bonus copy (falls back to title-cased code). */
const CURRENCY_LABEL: Record<string, string> = {
  AMEX_MR: "Membership Rewards",
  CHASE_UR: "Chase Ultimate Rewards",
  CITI_TYP: "Citi ThankYou",
};

function formatCurrencyLabel(currency: string): string {
  return CURRENCY_LABEL[currency] ?? formatIssuerOrNetwork(currency);
}

function inferCashbackOrTravel(currency: string): CreditCardDto["cashbackOrTravel"] {
  if (currency.toUpperCase().includes("CASH")) return "cashback";
  return "travel";
}

function buildBonusDescription(params: {
  points: number;
  currencyLabel: string;
  spend: number;
  months: number;
}): string {
  const pts = Math.round(params.points).toLocaleString("en-US");
  const spend = formatUsd(params.spend);
  const m = params.months;
  const monthWord = m === 1 ? "month" : "months";
  return `Earn ${pts} ${params.currencyLabel} points after spending ${spend} in ${m} ${monthWord}`;
}

function shouldIncludeCard(raw: RawCard): boolean {
  if (raw.discontinued === true) return false;
  const offers = raw.offers;
  if (!Array.isArray(offers) || offers.length === 0) return false;
  return true;
}

function normalizeRows(json: unknown): RawCard[] {
  if (Array.isArray(json)) return json as RawCard[];
  if (json && typeof json === "object") {
    const o = json as Record<string, unknown>;
    const candidates = ["cards", "data", "offers", "items", "results"];
    for (const k of candidates) {
      const v = o[k];
      if (Array.isArray(v)) return v as RawCard[];
    }
  }
  return [];
}

function transformCard(raw: RawCard, index: number): CreditCardDto {
  const offers = raw.offers as RawOffer[];
  const first = offers[0] ?? {};
  const spend = parseFiniteNumber(first.spend) ?? 0;
  const days = parseFiniteNumber(first.days) ?? 0;
  const months = Math.max(0, Math.round(days / 30));

  const amountArr = Array.isArray(first.amount) ? first.amount : [];
  const points = parseFiniteNumber(amountArr[0]?.amount) ?? 0;

  const currencyRaw =
    typeof raw.currency === "string" ? raw.currency.trim().toUpperCase() : "";
  const cpp = centsPerPoint(currencyRaw);
  const bonusValue = Math.round(points * (cpp / 100) * 100) / 100;

  const currencyLabel = currencyRaw ? formatCurrencyLabel(currencyRaw) : "Rewards";
  const bonusDescription = buildBonusDescription({
    points,
    currencyLabel,
    spend,
    months,
  });

  const name =
    typeof raw.name === "string" && raw.name.trim()
      ? raw.name.trim()
      : "Unknown card";
  const issuer = formatIssuerOrNetwork(raw.issuer);
  const network = formatIssuerOrNetwork(raw.network);

  const annualFeeRaw = parseFiniteNumber(raw.annualFee);
  const annualFee = annualFeeRaw !== null ? annualFeeRaw : null;

  const isBusinessCard = raw.isBusiness === true;

  const spendRequirement = spend > 0 ? formatUsd(spend) : "—";
  const spendTimeframe =
    months > 0 ? `${months} ${months === 1 ? "month" : "months"}` : "—";

  const cashbackOrTravel = inferCashbackOrTravel(currencyRaw);

  return {
    id: index,
    name,
    issuer,
    network,
    bonusValue,
    bonusDescription,
    annualFee,
    spendRequirement,
    spendTimeframe,
    isBusinessCard,
    cashbackOrTravel,
  };
}

export async function GET() {
  const hit = cache.get("v1");
  const now = Date.now();
  if (hit && now - hit.ts < CACHE_MS) {
    return NextResponse.json(hit.data);
  }

  try {
    const res = await fetch(DATA_URL, { cache: "no-store" });
    if (!res.ok) {
      return NextResponse.json(
        { error: "Failed to fetch credit card data" },
        { status: 502 }
      );
    }
    const json: unknown = await res.json();
    const rows = normalizeRows(json).filter(shouldIncludeCard);
    const data = rows.map((row, i) => transformCard(row, i));
    cache.set("v1", { ts: now, data });
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: "Upstream fetch failed" },
      { status: 502 }
    );
  }
}
