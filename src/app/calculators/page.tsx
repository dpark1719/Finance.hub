"use client";

import { useCallback, useEffect, useMemo, useState, type CSSProperties } from "react";
import {
  CARS,
  CAR_TYPES,
  computeTiers,
  estimateOwnership,
  getRate,
  uniqueMakes,
  usedCarPrice,
  type CarModel,
  type CarType,
  type CreditTier,
  type FuelType,
} from "@/lib/car-data";
import {
  buildPeerMarketplaceSingleLink,
  buildSingleMarketplaceSearchLink,
  CRAIGSLIST_SITE_OPTIONS,
  defaultCraigslistSubdomainFromZip,
  listingPriceSearchBand,
  mileageSearchWindow,
  type MileageSearchBand,
  pickMarketplaceForListing,
  pickPeerMarketplace,
} from "@/lib/car-marketplace-links";

type TabId = "compound" | "mortgage" | "fire" | "debt" | "car";

function formatMoney(n: number): string {
  return n.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

function formatMoney2(n: number): string {
  return n.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

// --- Compound Interest ---

function compoundSeries(
  initial: number,
  monthly: number,
  annualPct: number,
  years: number,
): { year: number; balance: number; contributions: number }[] {
  const y = Math.max(0, Math.floor(years));
  const r = annualPct / 100 / 12;
  const out: { year: number; balance: number; contributions: number }[] = [];
  for (let yr = 0; yr <= y; yr++) {
    const m = yr * 12;
    const contrib = initial + monthly * m;
    let bal: number;
    if (r === 0) {
      bal = contrib;
    } else {
      const growth = (1 + r) ** m;
      bal = initial * growth + monthly * ((growth - 1) / r);
    }
    out.push({ year: yr, balance: bal, contributions: contrib });
  }
  return out;
}

// --- Mortgage ---

function mortgagePayment(
  principal: number,
  annualPct: number,
  years: number,
): number {
  const n = years * 12;
  const r = annualPct / 100 / 12;
  if (principal <= 0) return 0;
  if (n <= 0) return principal;
  if (r === 0) return principal / n;
  return (principal * (r * (1 + r) ** n)) / ((1 + r) ** n - 1);
}

function amortizationYearSlices(
  principal: number,
  annualPct: number,
  yearsLoan: number,
): {
  firstYearInterest: number;
  firstYearPrincipal: number;
  lastYearInterest: number;
  lastYearPrincipal: number;
} {
  const n = yearsLoan * 12;
  const r = annualPct / 100 / 12;
  let bal = principal;
  let firstInterest = 0;
  let firstPrincipal = 0;
  let lastInterest = 0;
  let lastPrincipal = 0;

  for (let month = 1; month <= n; month++) {
    const interest = bal * r;
    const payment = mortgagePayment(principal, annualPct, yearsLoan);
    const principalPart = payment - interest;
    bal -= principalPart;

    if (month <= 12) {
      firstInterest += interest;
      firstPrincipal += principalPart;
    }
    if (month > n - 12) {
      lastInterest += interest;
      lastPrincipal += principalPart;
    }
  }

  return {
    firstYearInterest: firstInterest,
    firstYearPrincipal: firstPrincipal,
    lastYearInterest: lastInterest,
    lastYearPrincipal: lastPrincipal,
  };
}

// --- FIRE ---

function monthsToFire(
  pv: number,
  pmt: number,
  annualPct: number,
  target: number,
): number | null {
  if (target <= 0) return 0;
  if (pv >= target) return 0;
  const r = annualPct / 100 / 12;
  if (pmt <= 0 && pv < target) return null;
  if (pmt <= 0) {
    if (r <= 0) return null;
    const u = target / pv;
    if (u < 1) return 0;
    return Math.ceil(Math.log(u) / Math.log(1 + r));
  }
  if (r === 0) {
    const months = (target - pv) / pmt;
    return months <= 0 ? 0 : Math.ceil(months);
  }
  const coef = pv + pmt / r;
  const u = (target + pmt / r) / coef;
  if (u <= 1) return 0;
  const months = Math.log(u) / Math.log(1 + r);
  return Math.ceil(months);
}

function fvAfterMonths(
  pv: number,
  pmt: number,
  annualPct: number,
  months: number,
): number {
  const m = Math.max(0, months);
  const r = annualPct / 100 / 12;
  if (r === 0) return pv + pmt * m;
  const growth = (1 + r) ** m;
  return pv * growth + pmt * ((growth - 1) / r);
}

// --- Debt ---

type DebtRow = { id: string; name: string; balanceStr: string; aprStr: string; minPaymentStr: string };

interface DebtRowNumeric { id: string; name: string; balance: number; apr: number; minPayment: number }

function simulateDebt(
  debts: DebtRowNumeric[],
  strategy: "avalanche" | "snowball",
  extraMonthly: number,
): { months: number; totalInterestPaid: number } {
  const state = debts.map((d) => ({
    id: d.id,
    balance: Math.max(0, d.balance),
    apr: d.apr,
    minPayment: Math.max(0, d.minPayment),
  }));

  let totalInterestPaid = 0;
  let months = 0;
  const maxMonths = 600;

  while (state.some((d) => d.balance > 0.01) && months < maxMonths) {
    months++;

    for (const d of state) {
      if (d.balance <= 0) continue;
      const interest = d.balance * (d.apr / 100 / 12);
      d.balance += interest;
      totalInterestPaid += interest;
    }

    for (const d of state) {
      if (d.balance <= 0) continue;
      const pay = Math.min(d.minPayment, d.balance);
      d.balance -= pay;
    }

    let extra = Math.max(0, extraMonthly);
    const active = state.filter((d) => d.balance > 0.01);
    const order =
      strategy === "avalanche"
        ? [...active].sort((a, b) => b.apr - a.apr)
        : [...active].sort((a, b) => a.balance - b.balance);

    for (const target of order) {
      if (extra <= 0) break;
      const d = state.find((x) => x.id === target.id);
      if (!d || d.balance <= 0) continue;
      const pay = Math.min(extra, d.balance);
      d.balance -= pay;
      extra -= pay;
    }
  }

  return { months, totalInterestPaid };
}

const TABS: { id: TabId; label: string }[] = [
  { id: "compound", label: "Compound Interest" },
  { id: "mortgage", label: "Mortgage" },
  { id: "fire", label: "FIRE Calculator" },
  { id: "debt", label: "Debt Payoff" },
  { id: "car", label: "Car Affordability" },
];

export default function CalculatorsPage() {
  const [tab, setTab] = useState<TabId>("compound");

  // Compound — store as strings so users can clear the field before typing
  const [ciInitialStr, setCiInitialStr] = useState("10000");
  const [ciMonthlyStr, setCiMonthlyStr] = useState("500");
  const [ciRateStr, setCiRateStr] = useState("7");
  const [ciYearsStr, setCiYearsStr] = useState("30");

  const ciInitial = Number(ciInitialStr) || 0;
  const ciMonthly = Number(ciMonthlyStr) || 0;
  const ciRate = Number(ciRateStr) || 0;
  const ciYears = Math.max(0, Number(ciYearsStr) || 0);

  const compound = useMemo(() => {
    const years = ciYears;
    const series = compoundSeries(ciInitial, ciMonthly, ciRate, years);
    const final = series[series.length - 1]?.balance ?? ciInitial;
    const totalContrib =
      ciInitial + ciMonthly * 12 * years;
    const totalInterest = final - totalContrib;
    return { series, final, totalContrib, totalInterest, years };
  }, [ciInitial, ciMonthly, ciRate, ciYears]);

  // Mortgage — string state for clearable inputs
  const [mHomeStr, setMHomeStr] = useState("450000");
  const [mDownPctStr, setMDownPctStr] = useState("20");
  const [mRateStr, setMRateStr] = useState("6.5");
  const [mTerm, setMTerm] = useState<15 | 30>(30);

  const mHome = Number(mHomeStr) || 0;
  const mDownPct = Number(mDownPctStr) || 0;
  const mRate = Number(mRateStr) || 0;

  const mortgage = useMemo(() => {
    const loan = Math.max(0, mHome * (1 - clamp(mDownPct, 0, 100) / 100));
    const payment = mortgagePayment(loan, mRate, mTerm);
    const n = mTerm * 12;
    const totalPayments = payment * n;
    const totalInterest = totalPayments - loan;
    const totalCost = totalPayments + mHome * (mDownPct / 100);
    const slices =
      loan > 0 && mRate >= 0
        ? amortizationYearSlices(loan, mRate, mTerm)
        : {
            firstYearInterest: 0,
            firstYearPrincipal: 0,
            lastYearInterest: 0,
            lastYearPrincipal: 0,
          };
    return {
      loan,
      payment,
      totalInterest,
      totalCost,
      totalPayments,
      slices,
    };
  }, [mHome, mDownPct, mRate, mTerm]);

  // FIRE — string state for clearable inputs
  const [fireSavingsStr, setFireSavingsStr] = useState("75000");
  const [fireIncomeStr, setFireIncomeStr] = useState("120000");
  const [fireSaveRate, setFireSaveRate] = useState(25);
  const [fireReturnStr, setFireReturnStr] = useState("7");
  const [fireSpendStr, setFireSpendStr] = useState("50000");

  const fireSavings = Number(fireSavingsStr) || 0;
  const fireIncome = Number(fireIncomeStr) || 0;
  const fireReturn = Number(fireReturnStr) || 0;
  const fireSpend = Number(fireSpendStr) || 0;

  const fire = useMemo(() => {
    const target = 25 * fireSpend;
    const annualSave = fireIncome * (fireSaveRate / 100);
    const monthlySave = annualSave / 12;
    const months = monthsToFire(fireSavings, monthlySave, fireReturn, target);
    const yearsTo =
      months === null ? null : months === 0 ? 0 : months / 12;
    const projectedAtFire =
      months === null
        ? 0
        : fvAfterMonths(fireSavings, monthlySave, fireReturn, months);
    const milestones =
      months === null || months === 0
        ? [{ label: "Start", years: 0, balance: fireSavings }]
        : [0, 0.25, 0.5, 0.75, 1].map((f, i) => {
            const m = Math.round(f * months);
            return {
              label:
                i === 0
                  ? "Now"
                  : i === 4
                    ? "FIRE"
                    : `${Math.round(f * 100)}%`,
              years: m / 12,
              balance: fvAfterMonths(fireSavings, monthlySave, fireReturn, m),
            };
          });
    return {
      target,
      monthlySave,
      months,
      yearsTo,
      projectedAtFire,
      milestones,
    };
  }, [fireSavings, fireIncome, fireSaveRate, fireReturn, fireSpend]);

  // Debt — string state for clearable inputs
  const [debts, setDebts] = useState<DebtRow[]>(() => [
    {
      id: "1",
      name: "Credit card",
      balanceStr: "8500",
      aprStr: "22.9",
      minPaymentStr: "200",
    },
    {
      id: "2",
      name: "Car loan",
      balanceStr: "12000",
      aprStr: "6.5",
      minPaymentStr: "350",
    },
  ]);
  const [debtExtra, setDebtExtra] = useState(150);

  const debtCompare = useMemo(() => {
    const parsed = debts.map((d) => ({
      id: d.id,
      name: d.name,
      balance: Number(d.balanceStr) || 0,
      apr: Number(d.aprStr) || 0,
      minPayment: Number(d.minPaymentStr) || 0,
    }));
    const av = simulateDebt(parsed, "avalanche", debtExtra);
    const sn = simulateDebt(parsed, "snowball", debtExtra);
    return { avalanche: av, snowball: sn };
  }, [debts, debtExtra]);

  // Car Affordability — string state for clearable inputs
  const [carIncomeStr, setCarIncomeStr] = useState("75000");
  const [carDebtsStr, setCarDebtsStr] = useState("300");
  const [carDownStr, setCarDownStr] = useState("5000");
  const [carCredit, setCarCredit] = useState<CreditTier>("good");
  const [carTermStr, setCarTermStr] = useState("60");

  const carIncome = Number(carIncomeStr) || 0;
  const carDebts = Number(carDebtsStr) || 0;
  const carDown = Number(carDownStr) || 0;
  const carTerm = Number(carTermStr) || 60;

  const carTiers = useMemo(
    () => computeTiers(carIncome, carDebts, carDown, carCredit, carTerm),
    [carIncome, carDebts, carDown, carCredit, carTerm],
  );

  // Car finder state
  const [finderOpen, setFinderOpen] = useState(false);
  const [finderTier, setFinderTier] = useState(1);
  const [finderMake, setFinderMake] = useState("any");
  const [finderType, setFinderType] = useState<CarType | "any">("any");
  const [finderCondition, setFinderCondition] = useState<"new" | "used" | "any">("any");
  const [finderMaxYear, setFinderMaxYear] = useState(2026);
  const [finderMinYear, setFinderMinYear] = useState(2018);
  const [finderMaxMileage, setFinderMaxMileage] = useState(80000);
  const [finderFuel, setFinderFuel] = useState<FuelType | "any">("any");
  const [finderSort, setFinderSort] = useState<"monthly" | "price" | "mileage" | "mpg">("monthly");
  const [finderZipStr, setFinderZipStr] = useState("90210");
  const [showPeerMarketplaces, setShowPeerMarketplaces] = useState(false);
  const [peerCraigslistSite, setPeerCraigslistSite] = useState("losangeles");

  const allMakes = useMemo(() => uniqueMakes(), []);
  const currentYear = 2026;

  useEffect(() => {
    if (showPeerMarketplaces) {
      setPeerCraigslistSite(defaultCraigslistSubdomainFromZip(finderZipStr));
    }
  }, [finderZipStr, showPeerMarketplaces]);

  const finderResults = useMemo(() => {
    const tier = carTiers[finderTier];
    if (!tier) return [];
    const budget = tier.maxCarPrice;
    const rate = getRate(carCredit, false);
    const usedRate = getRate(carCredit, true);

    const results: {
      car: CarModel;
      price: number;
      year: number;
      isUsed: boolean;
      mileage: number | null;
      monthlyTotal: number;
    }[] = [];

    for (const car of CARS) {
      if (finderMake !== "any" && car.make !== finderMake) continue;
      if (finderType !== "any" && !car.types.includes(finderType)) continue;
      if (finderFuel !== "any" && car.fuel !== finderFuel) continue;

      if (finderCondition !== "used") {
        if (car.msrp <= budget && car.years[1] >= currentYear) {
          const costs = estimateOwnership(car.msrp, carDown, rate, carTerm, car, false);
          results.push({ car, price: car.msrp, year: currentYear, isUsed: false, mileage: null, monthlyTotal: costs.total });
        }
      }

      if (finderCondition !== "new") {
        for (let yr = Math.max(car.years[0], finderMinYear); yr < Math.min(car.years[1], currentYear); yr++) {
          if (yr > finderMaxYear) continue;
          const age = currentYear - yr;
          const estMileage = age * 12000;
          if (estMileage > finderMaxMileage) continue;
          const price = usedCarPrice(car.msrp, age, estMileage);
          if (price <= budget) {
            const costs = estimateOwnership(price, carDown, usedRate, carTerm, car, true);
            results.push({ car, price, year: yr, isUsed: true, mileage: estMileage, monthlyTotal: costs.total });
          }
        }
      }
    }

    switch (finderSort) {
      case "price": results.sort((a, b) => a.price - b.price); break;
      case "mileage": results.sort((a, b) => (a.mileage ?? 0) - (b.mileage ?? 0)); break;
      case "mpg": results.sort((a, b) => b.car.mpg - a.car.mpg); break;
      default: results.sort((a, b) => a.monthlyTotal - b.monthlyTotal);
    }
    return results.slice(0, 120);
  }, [carTiers, finderTier, finderMake, finderType, finderCondition, finderFuel, finderSort, finderMinYear, finderMaxYear, finderMaxMileage, carCredit, carDown, carTerm]);

  const sampleCarForTier = useCallback(
    (tierIdx: number) => {
      const tier = carTiers[tierIdx];
      if (!tier) return null;
      const budget = tier.maxCarPrice;
      const candidates = CARS.filter((c) => c.msrp <= budget && c.years[1] >= currentYear);
      if (candidates.length === 0) return null;
      candidates.sort((a, b) => b.msrp - a.msrp);
      return candidates[0];
    },
    [carTiers],
  );

  const compoundChart = useMemo(() => {
    const { series, years } = compound;
    if (years <= 0) return null;
    const w = 400;
    const h = 200;
    const pad = { t: 12, r: 12, b: 28, l: 12 };
    const innerW = w - pad.l - pad.r;
    const innerH = h - pad.t - pad.b;
    const maxY = Math.max(
      ...series.map((s) => Math.max(s.balance, s.contributions)),
      1,
    );
    const maxX = Math.max(years, 1);
    const sx = (x: number) => pad.l + (x / maxX) * innerW;
    const sy = (y: number) => pad.t + innerH - (y / maxY) * innerH;

    const bottom = pad.t + innerH;
    const balancePts = series.map((s) => `${sx(s.year)},${sy(s.balance)}`).join(" ");
    const contribPts = series.map((s) => `${sx(s.year)},${sy(s.contributions)}`).join(" ");
    const balanceEdge = balancePts.replace(/ /g, " L ");
    const areaPath = `M ${sx(0)},${bottom} L ${balanceEdge} L ${sx(maxX)},${bottom} Z`;

    return { w, h, balancePts, contribPts, areaPath, maxY, maxX, sx, sy, pad };
  }, [compound]);

  return (
    <main className="min-h-screen min-w-0 text-slate-900 dark:text-white">
      <div className="mx-auto min-w-0 max-w-6xl px-4 py-8 sm:px-6">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Financial calculators
        </h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-zinc-400">
          Client-side estimates — not financial advice.
        </p>

        <div className="mt-6 flex flex-wrap gap-2">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`touch-manipulation rounded-lg px-3 py-2.5 text-sm font-medium transition-colors sm:px-4 sm:py-2 ${
                tab === t.id
                  ? "bg-blue-600 text-white"
                  : "bg-slate-200 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:text-slate-800 dark:text-zinc-200"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Compound */}
        {tab === "compound" && (
          <section className="mt-8 grid gap-8 lg:grid-cols-2 lg:items-start">
            <div
              className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-[var(--card)] p-5 sm:p-6"
              style={{ ["--card" as string]: "#151a22" } as CSSProperties}
            >
              <h2 className="text-lg font-semibold">Inputs</h2>
              <div className="mt-4 space-y-4">
                <label className="block">
                  <span className="text-sm text-slate-600 dark:text-zinc-400">Initial amount ($)</span>
                  <input
                    type="number"
                    className="mt-1 w-full rounded-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-slate-900 dark:text-white outline-none focus:border-blue-500"
                    value={ciInitialStr}
                    onChange={(e) => setCiInitialStr(e.target.value)}
                  />
                </label>
                <label className="block">
                  <span className="text-sm text-slate-600 dark:text-zinc-400">Monthly contribution ($)</span>
                  <input
                    type="number"
                    className="mt-1 w-full rounded-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-slate-900 dark:text-white outline-none focus:border-blue-500"
                    value={ciMonthlyStr}
                    onChange={(e) => setCiMonthlyStr(e.target.value)}
                  />
                </label>
                <label className="block">
                  <span className="text-sm text-slate-600 dark:text-zinc-400">Annual interest rate (%)</span>
                  <input
                    type="number"
                    step="0.01"
                    className="mt-1 w-full rounded-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-slate-900 dark:text-white outline-none focus:border-blue-500"
                    value={ciRateStr}
                    onChange={(e) => setCiRateStr(e.target.value)}
                  />
                </label>
                <label className="block">
                  <span className="text-sm text-slate-600 dark:text-zinc-400">Years</span>
                  <input
                    type="number"
                    className="mt-1 w-full rounded-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-slate-900 dark:text-white outline-none focus:border-blue-500"
                    value={ciYearsStr}
                    onChange={(e) => setCiYearsStr(e.target.value)}
                  />
                </label>
              </div>
            </div>

            <div
              className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-[var(--card)] p-5 sm:p-6"
              style={{ ["--card" as string]: "#151a22" } as CSSProperties}
            >
              <h2 className="text-lg font-semibold">Results</h2>
              <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-1">
                <div className="flex justify-between gap-4 border-b border-slate-200 dark:border-zinc-800 pb-2">
                  <dt className="text-slate-600 dark:text-zinc-400">Final balance</dt>
                  <dd className="font-mono text-lg font-medium">
                    ${formatMoney(compound.final)}
                  </dd>
                </div>
                <div className="flex justify-between gap-4 border-b border-slate-200 dark:border-zinc-800 pb-2">
                  <dt className="text-slate-600 dark:text-zinc-400">Total contributions</dt>
                  <dd className="font-mono">${formatMoney(compound.totalContrib)}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-600 dark:text-zinc-400">Total interest earned</dt>
                  <dd className="font-mono text-emerald-400">
                    ${formatMoney(compound.totalInterest)}
                  </dd>
                </div>
              </dl>

              {compoundChart && compound.years > 0 && (
                <div className="mt-6">
                  <p className="text-sm text-slate-600 dark:text-zinc-400">Growth over time</p>
                  <svg
                    viewBox={`0 0 ${compoundChart.w} ${compoundChart.h}`}
                    className="mt-2 h-auto w-full max-w-full"
                    role="img"
                    aria-label="Balance and contributions by year"
                  >
                    <defs>
                      <linearGradient id="balGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="rgb(37 99 235)" stopOpacity="0.35" />
                        <stop offset="100%" stopColor="rgb(37 99 235)" stopOpacity="0.05" />
                      </linearGradient>
                    </defs>
                    <path
                      d={compoundChart.areaPath}
                      fill="url(#balGrad)"
                      stroke="none"
                    />
                    <polyline
                      fill="none"
                      stroke="rgb(37 99 235)"
                      strokeWidth="2"
                      points={compoundChart.balancePts}
                    />
                    <polyline
                      fill="none"
                      stroke="rgb(161 161 170)"
                      strokeWidth="1.5"
                      strokeDasharray="4 3"
                      points={compoundChart.contribPts}
                    />
                    <text
                      x={compoundChart.pad.l}
                      y={compoundChart.h - 6}
                      fill="rgb(161 161 170)"
                      fontSize="10"
                    >
                      0
                    </text>
                    <text
                      x={compoundChart.w - compoundChart.pad.r - 20}
                      y={compoundChart.h - 6}
                      fill="rgb(161 161 170)"
                      fontSize="10"
                      textAnchor="end"
                    >
                      {compound.years} yr
                    </text>
                  </svg>
                  <div className="mt-2 flex gap-4 text-xs text-slate-500 dark:text-zinc-500">
                    <span className="flex items-center gap-1">
                      <span className="inline-block h-0.5 w-6 bg-blue-600" /> Balance
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="inline-block h-0.5 w-6 border-t border-dashed border-slate-300 dark:border-zinc-500" />{" "}
                      Contributions
                    </span>
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Mortgage */}
        {tab === "mortgage" && (
          <section className="mt-8 grid gap-8 lg:grid-cols-2 lg:items-start">
            <div
              className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-[var(--card)] p-5 sm:p-6"
              style={{ ["--card" as string]: "#151a22" } as CSSProperties}
            >
              <h2 className="text-lg font-semibold">Inputs</h2>
              <div className="mt-4 space-y-4">
                <label className="block">
                  <span className="text-sm text-slate-600 dark:text-zinc-400">Home price ($)</span>
                  <input
                    type="number"
                    className="mt-1 w-full rounded-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-slate-900 dark:text-white outline-none focus:border-blue-500"
                    value={mHomeStr}
                    onChange={(e) => setMHomeStr(e.target.value)}
                  />
                </label>
                <label className="block">
                  <span className="text-sm text-slate-600 dark:text-zinc-400">Down payment (%)</span>
                  <input
                    type="number"
                    step="0.1"
                    className="mt-1 w-full rounded-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-slate-900 dark:text-white outline-none focus:border-blue-500"
                    value={mDownPctStr}
                    onChange={(e) => setMDownPctStr(e.target.value)}
                  />
                </label>
                <label className="block">
                  <span className="text-sm text-slate-600 dark:text-zinc-400">Interest rate (%)</span>
                  <input
                    type="number"
                    step="0.01"
                    className="mt-1 w-full rounded-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-slate-900 dark:text-white outline-none focus:border-blue-500"
                    value={mRateStr}
                    onChange={(e) => setMRateStr(e.target.value)}
                  />
                </label>
                <fieldset>
                  <legend className="text-sm text-slate-600 dark:text-zinc-400">Loan term</legend>
                  <div className="mt-2 flex gap-4">
                    <label className="flex cursor-pointer items-center gap-2 text-sm">
                      <input
                        type="radio"
                        name="term"
                        checked={mTerm === 15}
                        onChange={() => setMTerm(15)}
                        className="accent-blue-600"
                      />
                      15 years
                    </label>
                    <label className="flex cursor-pointer items-center gap-2 text-sm">
                      <input
                        type="radio"
                        name="term"
                        checked={mTerm === 30}
                        onChange={() => setMTerm(30)}
                        className="accent-blue-600"
                      />
                      30 years
                    </label>
                  </div>
                </fieldset>
              </div>
            </div>

            <div
              className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-[var(--card)] p-5 sm:p-6"
              style={{ ["--card" as string]: "#151a22" } as CSSProperties}
            >
              <h2 className="text-lg font-semibold">Results</h2>
              <dl className="mt-4 space-y-3 text-sm">
                <div className="flex justify-between gap-4 border-b border-slate-200 dark:border-zinc-800 pb-2">
                  <dt className="text-slate-600 dark:text-zinc-400">Loan amount</dt>
                  <dd className="font-mono">${formatMoney(mortgage.loan)}</dd>
                </div>
                <div className="flex justify-between gap-4 border-b border-slate-200 dark:border-zinc-800 pb-2">
                  <dt className="text-slate-600 dark:text-zinc-400">Monthly payment</dt>
                  <dd className="font-mono text-lg font-medium">
                    ${formatMoney2(mortgage.payment)}
                  </dd>
                </div>
                <div className="flex justify-between gap-4 border-b border-slate-200 dark:border-zinc-800 pb-2">
                  <dt className="text-slate-600 dark:text-zinc-400">Total interest</dt>
                  <dd className="font-mono">${formatMoney(mortgage.totalInterest)}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-600 dark:text-zinc-400">Total cost (loan + down)</dt>
                  <dd className="font-mono">${formatMoney(mortgage.totalCost)}</dd>
                </div>
              </dl>

              <div className="mt-6 rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-4">
                <h3 className="text-sm font-medium text-slate-700 dark:text-zinc-300">Amortization summary</h3>
                <div className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-zinc-500">
                      First year
                    </p>
                    <p className="mt-1 text-slate-600 dark:text-zinc-400">
                      Interest:{" "}
                      <span className="font-mono text-slate-900 dark:text-white">
                        ${formatMoney(mortgage.slices.firstYearInterest)}
                      </span>
                    </p>
                    <p className="text-slate-600 dark:text-zinc-400">
                      Principal:{" "}
                      <span className="font-mono text-slate-900 dark:text-white">
                        ${formatMoney(mortgage.slices.firstYearPrincipal)}
                      </span>
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-zinc-500">
                      Last year
                    </p>
                    <p className="mt-1 text-slate-600 dark:text-zinc-400">
                      Interest:{" "}
                      <span className="font-mono text-slate-900 dark:text-white">
                        ${formatMoney(mortgage.slices.lastYearInterest)}
                      </span>
                    </p>
                    <p className="text-slate-600 dark:text-zinc-400">
                      Principal:{" "}
                      <span className="font-mono text-slate-900 dark:text-white">
                        ${formatMoney(mortgage.slices.lastYearPrincipal)}
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* FIRE */}
        {tab === "fire" && (
          <section className="mt-8 grid gap-8 lg:grid-cols-2 lg:items-start">
            <div
              className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-[var(--card)] p-5 sm:p-6"
              style={{ ["--card" as string]: "#151a22" } as CSSProperties}
            >
              <h2 className="text-lg font-semibold">Inputs</h2>
              <div className="mt-4 space-y-4">
                <label className="block">
                  <span className="text-sm text-slate-600 dark:text-zinc-400">Current savings ($)</span>
                  <input
                    type="number"
                    className="mt-1 w-full rounded-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-slate-900 dark:text-white outline-none focus:border-blue-500"
                    value={fireSavingsStr}
                    onChange={(e) => setFireSavingsStr(e.target.value)}
                  />
                </label>
                <label className="block">
                  <span className="text-sm text-slate-600 dark:text-zinc-400">Annual income ($)</span>
                  <input
                    type="number"
                    className="mt-1 w-full rounded-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-slate-900 dark:text-white outline-none focus:border-blue-500"
                    value={fireIncomeStr}
                    onChange={(e) => setFireIncomeStr(e.target.value)}
                  />
                </label>
                <label className="block">
                  <span className="flex justify-between text-sm text-slate-600 dark:text-zinc-400">
                    <span>Savings rate</span>
                    <span className="font-mono text-slate-900 dark:text-white">{fireSaveRate}%</span>
                  </span>
                  <input
                    type="range"
                    min={10}
                    max={80}
                    value={fireSaveRate}
                    onChange={(e) => setFireSaveRate(Number(e.target.value))}
                    className="mt-2 w-full accent-blue-600"
                  />
                </label>
                <label className="block">
                  <span className="text-sm text-slate-600 dark:text-zinc-400">Expected annual return (%)</span>
                  <input
                    type="number"
                    step="0.1"
                    className="mt-1 w-full rounded-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-slate-900 dark:text-white outline-none focus:border-blue-500"
                    value={fireReturnStr}
                    onChange={(e) => setFireReturnStr(e.target.value)}
                  />
                </label>
                <label className="block">
                  <span className="text-sm text-slate-600 dark:text-zinc-400">
                    Annual spending in retirement ($)
                  </span>
                  <input
                    type="number"
                    className="mt-1 w-full rounded-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-slate-900 dark:text-white outline-none focus:border-blue-500"
                    value={fireSpendStr}
                    onChange={(e) => setFireSpendStr(e.target.value)}
                  />
                </label>
              </div>
            </div>

            <div
              className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-[var(--card)] p-5 sm:p-6"
              style={{ ["--card" as string]: "#151a22" } as CSSProperties}
            >
              <h2 className="text-lg font-semibold">Results</h2>
              <dl className="mt-4 space-y-3 text-sm">
                <div className="flex justify-between gap-4 border-b border-slate-200 dark:border-zinc-800 pb-2">
                  <dt className="text-slate-600 dark:text-zinc-400">Target nest egg (25× spending)</dt>
                  <dd className="font-mono">${formatMoney(fire.target)}</dd>
                </div>
                <div className="flex justify-between gap-4 border-b border-slate-200 dark:border-zinc-800 pb-2">
                  <dt className="text-slate-600 dark:text-zinc-400">Monthly savings needed (from rate)</dt>
                  <dd className="font-mono">${formatMoney2(fire.monthlySave)}</dd>
                </div>
                <div className="flex justify-between gap-4 border-b border-slate-200 dark:border-zinc-800 pb-2">
                  <dt className="text-slate-600 dark:text-zinc-400">Years to FIRE</dt>
                  <dd className="font-mono text-lg font-medium">
                    {fire.yearsTo === null
                      ? "—"
                      : fire.yearsTo === 0
                        ? "0"
                        : fire.yearsTo.toLocaleString(undefined, {
                            maximumFractionDigits: 1,
                          })}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-600 dark:text-zinc-400">Projected portfolio at FIRE</dt>
                  <dd className="font-mono text-emerald-400">
                    ${formatMoney(fire.projectedAtFire)}
                  </dd>
                </div>
              </dl>

              {fire.months !== null && (
                <div className="mt-6">
                  <h3 className="text-sm font-medium text-slate-700 dark:text-zinc-300">Milestone timeline</h3>
                  <ul className="mt-3 space-y-2">
                    {fire.milestones.map((m, i) => (
                      <li
                        key={i}
                        className="flex flex-wrap items-baseline justify-between gap-2 rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-50/95 dark:bg-zinc-900/40 px-3 py-2 text-sm"
                      >
                        <span className="text-slate-600 dark:text-zinc-400">{m.label}</span>
                        <span className="text-slate-500 dark:text-zinc-500">
                          {m.years.toLocaleString(undefined, {
                            maximumFractionDigits: 1,
                          })}{" "}
                          yrs
                        </span>
                        <span className="font-mono text-slate-900 dark:text-white">
                          ${formatMoney(m.balance)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Debt */}
        {tab === "debt" && (
          <section className="mt-8 grid gap-8 lg:grid-cols-2 lg:items-start">
            <div
              className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-[var(--card)] p-5 sm:p-6"
              style={{ ["--card" as string]: "#151a22" } as CSSProperties}
            >
              <h2 className="text-lg font-semibold">Debts</h2>
              <div className="mt-4 space-y-4 overflow-x-auto">
                <table className="w-full min-w-[320px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400">
                      <th className="pb-2 pr-2 font-medium">Name</th>
                      <th className="pb-2 pr-2 font-medium">Balance</th>
                      <th className="pb-2 pr-2 font-medium">APR %</th>
                      <th className="pb-2 font-medium">Min pay</th>
                      <th className="pb-2 w-8" />
                    </tr>
                  </thead>
                  <tbody>
                    {debts.map((d) => (
                      <tr key={d.id} className="border-b border-slate-200 dark:border-zinc-800/80">
                        <td className="py-2 pr-2">
                          <input
                            className="w-full min-w-[100px] rounded border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2 py-1 text-slate-900 dark:text-white"
                            value={d.name}
                            onChange={(e) =>
                              setDebts((prev) =>
                                prev.map((x) =>
                                  x.id === d.id ? { ...x, name: e.target.value } : x,
                                ),
                              )
                            }
                          />
                        </td>
                        <td className="py-2 pr-2">
                          <input
                            type="number"
                            className="w-full min-w-[80px] rounded border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2 py-1 text-slate-900 dark:text-white"
                            value={d.balanceStr}
                            onChange={(e) =>
                              setDebts((prev) =>
                                prev.map((x) =>
                                  x.id === d.id
                                    ? { ...x, balanceStr: e.target.value }
                                    : x,
                                ),
                              )
                            }
                          />
                        </td>
                        <td className="py-2 pr-2">
                          <input
                            type="number"
                            step="0.01"
                            className="w-full min-w-[70px] rounded border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2 py-1 text-slate-900 dark:text-white"
                            value={d.aprStr}
                            onChange={(e) =>
                              setDebts((prev) =>
                                prev.map((x) =>
                                  x.id === d.id
                                    ? { ...x, aprStr: e.target.value }
                                    : x,
                                ),
                              )
                            }
                          />
                        </td>
                        <td className="py-2 pr-2">
                          <input
                            type="number"
                            className="w-full min-w-[70px] rounded border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2 py-1 text-slate-900 dark:text-white"
                            value={d.minPaymentStr}
                            onChange={(e) =>
                              setDebts((prev) =>
                                prev.map((x) =>
                                  x.id === d.id
                                    ? { ...x, minPaymentStr: e.target.value }
                                    : x,
                                ),
                              )
                            }
                          />
                        </td>
                        <td className="py-2">
                          <button
                            type="button"
                            className="text-xs text-red-400 hover:text-red-300"
                            onClick={() =>
                              setDebts((prev) => prev.filter((x) => x.id !== d.id))
                            }
                            aria-label={`Remove ${d.name}`}
                          >
                            ✕
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button
                type="button"
                onClick={() =>
                  setDebts((prev) => [
                    ...prev,
                    {
                      id: String(Date.now()),
                      name: "New debt",
                      balanceStr: "1000",
                      aprStr: "15",
                      minPaymentStr: "50",
                    },
                  ])
                }
                className="mt-4 rounded-lg bg-slate-200 dark:bg-zinc-800 px-4 py-2 text-sm font-medium text-slate-800 dark:text-zinc-200 hover:bg-zinc-700"
              >
                Add debt
              </button>

              <label className="mt-6 block">
                <span className="flex justify-between text-sm text-slate-600 dark:text-zinc-400">
                  <span>Extra monthly payment</span>
                  <span className="font-mono text-slate-900 dark:text-white">${debtExtra}</span>
                </span>
                <input
                  type="range"
                  min={0}
                  max={2000}
                  step={25}
                  value={debtExtra}
                  onChange={(e) => setDebtExtra(Number(e.target.value))}
                  className="mt-2 w-full accent-blue-600"
                />
              </label>
            </div>

            <div
              className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-[var(--card)] p-5 sm:p-6"
              style={{ ["--card" as string]: "#151a22" } as CSSProperties}
            >
              <h2 className="text-lg font-semibold">Avalanche vs snowball</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-4">
                  <h3 className="text-sm font-semibold text-blue-400">Avalanche</h3>
                  <p className="mt-2 text-xs text-slate-500 dark:text-zinc-500">Highest APR first</p>
                  <dl className="mt-3 space-y-2 text-sm">
                    <div className="flex justify-between gap-2">
                      <dt className="text-slate-600 dark:text-zinc-400">Total interest</dt>
                      <dd className="font-mono">
                        ${formatMoney(debtCompare.avalanche.totalInterestPaid)}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-2">
                      <dt className="text-slate-600 dark:text-zinc-400">Payoff time</dt>
                      <dd className="font-mono">
                        {debtCompare.avalanche.months >= 600
                          ? "50+ yrs"
                          : `${(debtCompare.avalanche.months / 12).toLocaleString(undefined, {
                              maximumFractionDigits: 1,
                            })} yrs`}
                      </dd>
                    </div>
                  </dl>
                </div>
                <div className="rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-4">
                  <h3 className="text-sm font-semibold text-amber-400">Snowball</h3>
                  <p className="mt-2 text-xs text-slate-500 dark:text-zinc-500">Lowest balance first</p>
                  <dl className="mt-3 space-y-2 text-sm">
                    <div className="flex justify-between gap-2">
                      <dt className="text-slate-600 dark:text-zinc-400">Total interest</dt>
                      <dd className="font-mono">
                        ${formatMoney(debtCompare.snowball.totalInterestPaid)}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-2">
                      <dt className="text-slate-600 dark:text-zinc-400">Payoff time</dt>
                      <dd className="font-mono">
                        {debtCompare.snowball.months >= 600
                          ? "50+ yrs"
                          : `${(debtCompare.snowball.months / 12).toLocaleString(undefined, {
                              maximumFractionDigits: 1,
                            })} yrs`}
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>
            </div>
          </section>
        )}
        {/* Car Affordability */}
        {tab === "car" && (
          <section className="mt-8 space-y-8">
            <div className="grid gap-8 lg:grid-cols-[340px_1fr] lg:items-start">
              {/* Inputs */}
              <div
                className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-[var(--card)] p-5 sm:p-6"
                style={{ ["--card" as string]: "#151a22" } as CSSProperties}
              >
                <h2 className="text-lg font-semibold">Your finances</h2>
                <div className="mt-4 space-y-4">
                  <label className="block">
                    <span className="text-sm text-slate-600 dark:text-zinc-400">Annual gross income ($)</span>
                    <input type="number" className="mt-1 w-full rounded-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-slate-900 dark:text-white outline-none focus:border-blue-500" value={carIncomeStr} onChange={(e) => setCarIncomeStr(e.target.value)} />
                  </label>
                  <label className="block">
                    <span className="text-sm text-slate-600 dark:text-zinc-400">Monthly debt payments ($)</span>
                    <input type="number" className="mt-1 w-full rounded-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-slate-900 dark:text-white outline-none focus:border-blue-500" value={carDebtsStr} onChange={(e) => setCarDebtsStr(e.target.value)} />
                    <span className="mt-1 block text-xs text-slate-600 dark:text-zinc-600">Student loans, credit cards, etc.</span>
                  </label>
                  <label className="block">
                    <span className="text-sm text-slate-600 dark:text-zinc-400">Down payment available ($)</span>
                    <input type="number" className="mt-1 w-full rounded-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-slate-900 dark:text-white outline-none focus:border-blue-500" value={carDownStr} onChange={(e) => setCarDownStr(e.target.value)} />
                  </label>
                  <label className="block">
                    <span className="text-sm text-slate-600 dark:text-zinc-400">Credit score range</span>
                    <select className="mt-1 w-full rounded-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-slate-900 dark:text-white outline-none focus:border-blue-500" value={carCredit} onChange={(e) => setCarCredit(e.target.value as CreditTier)}>
                      <option value="excellent">Excellent (750+)</option>
                      <option value="good">Good (700–749)</option>
                      <option value="fair">Fair (650–699)</option>
                      <option value="poor">Below 650</option>
                    </select>
                  </label>
                  <label className="block">
                    <span className="text-sm text-slate-600 dark:text-zinc-400">Loan term</span>
                    <select className="mt-1 w-full rounded-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-slate-900 dark:text-white outline-none focus:border-blue-500" value={carTermStr} onChange={(e) => setCarTermStr(e.target.value)}>
                      <option value="36">36 months (3 years)</option>
                      <option value="48">48 months (4 years)</option>
                      <option value="60">60 months (5 years)</option>
                      <option value="72">72 months (6 years)</option>
                    </select>
                  </label>
                </div>
              </div>

              {/* 3-Tier Results */}
              <div className="space-y-4">
                <h2 className="text-lg font-semibold">What you can afford</h2>
                <p className="text-sm text-slate-600 dark:text-zinc-400">Based on your income, debts, and credit. Click a tier to find matching cars below.</p>
                <div className="grid gap-4 sm:grid-cols-3">
                  {carTiers.map((tier, idx) => {
                    const sample = sampleCarForTier(idx);
                    const isUsed = false;
                    const r = getRate(carCredit, isUsed);
                    const costs = sample ? estimateOwnership(Math.min(sample.msrp, tier.maxCarPrice), carDown, r, carTerm, sample, isUsed) : null;

                    return (
                      <button
                        key={tier.label}
                        type="button"
                        onClick={() => { setFinderTier(idx); setFinderOpen(true); }}
                        className={`rounded-xl border p-5 text-left transition hover:border-slate-300 dark:border-zinc-600 ${
                          finderOpen && finderTier === idx ? "border-blue-500/50 bg-blue-500/5" : "border-slate-200 dark:border-zinc-800 bg-[#151a22]"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="h-3 w-3 rounded-full" style={{ backgroundColor: tier.color }} />
                          <span className="text-sm font-semibold uppercase tracking-wider" style={{ color: tier.color }}>{tier.label}</span>
                        </div>

                        <p className="mt-3 font-mono text-2xl font-semibold text-slate-900 dark:text-white">
                          ${formatMoney(tier.maxCarPrice)}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-zinc-500">max car price</p>

                        <div className="mt-4 space-y-1.5 text-sm">
                          <div className="flex justify-between text-slate-600 dark:text-zinc-400">
                            <span>Loan amount</span>
                            <span className="font-mono text-slate-700 dark:text-zinc-300">${formatMoney(tier.loanAmount)}</span>
                          </div>
                          <div className="flex justify-between text-slate-600 dark:text-zinc-400">
                            <span>Monthly payment</span>
                            <span className="font-mono text-slate-700 dark:text-zinc-300">${formatMoney(tier.maxMonthlyPayment)}/mo</span>
                          </div>
                          <div className="flex justify-between text-slate-600 dark:text-zinc-400">
                            <span>Interest rate</span>
                            <span className="font-mono text-slate-700 dark:text-zinc-300">{tier.rate}%</span>
                          </div>
                        </div>

                        {costs && sample && (
                          <div className="mt-4 border-t border-slate-200 dark:border-zinc-800 pt-3">
                            <p className="text-xs font-medium text-slate-500 dark:text-zinc-500">Estimated total monthly cost</p>
                            <div className="mt-2 space-y-1 text-xs">
                              <div className="flex justify-between text-slate-600 dark:text-zinc-400">
                                <span>Payment</span>
                                <span className="font-mono">${formatMoney(costs.monthlyPayment)}</span>
                              </div>
                              <div className="flex justify-between text-slate-600 dark:text-zinc-400">
                                <span>Insurance</span>
                                <span className="font-mono">${formatMoney(costs.insurance)}</span>
                              </div>
                              <div className="flex justify-between text-slate-600 dark:text-zinc-400">
                                <span>Gas / energy</span>
                                <span className="font-mono">${formatMoney(costs.gas)}</span>
                              </div>
                              <div className="flex justify-between text-slate-600 dark:text-zinc-400">
                                <span>Maintenance</span>
                                <span className="font-mono">${formatMoney(costs.maintenance)}</span>
                              </div>
                              <div className="mt-1 flex justify-between border-t border-slate-200 dark:border-zinc-800 pt-1 font-medium text-slate-900 dark:text-white">
                                <span>Total</span>
                                <span className="font-mono">${formatMoney(costs.total)}/mo</span>
                              </div>
                            </div>
                            <p className="mt-2 text-xs text-slate-600 dark:text-zinc-600">
                              e.g. {sample.years[1] >= currentYear ? "New" : ""} {sample.make} {sample.model}
                            </p>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Car Finder */}
            <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-[#151a22]">
              <button
                type="button"
                onClick={() => setFinderOpen(!finderOpen)}
                className="flex w-full items-center justify-between px-5 py-4 text-left"
              >
                <div>
                  <h3 className="text-base font-semibold text-slate-900 dark:text-white">Find cars in your budget</h3>
                  <p className="mt-0.5 text-sm text-slate-500 dark:text-zinc-500">
                    Browse {CARS.length}+ models — filter by brand, type, new/used, and more
                  </p>
                </div>
                <span className="text-lg text-slate-500 dark:text-zinc-500">{finderOpen ? "▾" : "▸"}</span>
              </button>

              {finderOpen && (
                <div className="border-t border-slate-200 dark:border-zinc-800 px-5 py-5">
                  {/* Tier selector */}
                  <div className="mb-4 flex flex-wrap items-center gap-2">
                    <span className="text-sm text-slate-600 dark:text-zinc-400">Shopping in:</span>
                    {carTiers.map((tier, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setFinderTier(idx)}
                        className={`rounded-lg px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition ${
                          finderTier === idx
                            ? "text-slate-900 dark:text-white"
                            : "bg-slate-200 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:text-slate-800 dark:text-zinc-200"
                        }`}
                        style={finderTier === idx ? { backgroundColor: tier.color + "30", color: tier.color, border: `1px solid ${tier.color}50` } : {}}
                      >
                        {tier.label} (up to ${formatMoney(tier.maxCarPrice)})
                      </button>
                    ))}
                  </div>

                  {/* Filters */}
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-500 dark:text-zinc-500">Brand</label>
                      <select className="mt-1 w-full rounded-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm text-slate-900 dark:text-white outline-none focus:border-blue-500" value={finderMake} onChange={(e) => setFinderMake(e.target.value)}>
                        <option value="any">All brands</option>
                        {allMakes.map((m) => <option key={m} value={m}>{m}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500 dark:text-zinc-500">Type</label>
                      <select className="mt-1 w-full rounded-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm text-slate-900 dark:text-white outline-none focus:border-blue-500" value={finderType} onChange={(e) => setFinderType(e.target.value as CarType | "any")}>
                        <option value="any">All types</option>
                        {CAR_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500 dark:text-zinc-500">Condition</label>
                      <select className="mt-1 w-full rounded-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm text-slate-900 dark:text-white outline-none focus:border-blue-500" value={finderCondition} onChange={(e) => setFinderCondition(e.target.value as "new" | "used" | "any")}>
                        <option value="any">New &amp; Used</option>
                        <option value="new">New only</option>
                        <option value="used">Used only</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500 dark:text-zinc-500">Fuel type</label>
                      <select className="mt-1 w-full rounded-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm text-slate-900 dark:text-white outline-none focus:border-blue-500" value={finderFuel} onChange={(e) => setFinderFuel(e.target.value as FuelType | "any")}>
                        <option value="any">All fuel types</option>
                        <option value="gas">Gas</option>
                        <option value="hybrid">Hybrid</option>
                        <option value="electric">Electric</option>
                      </select>
                    </div>
                  </div>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-500 dark:text-zinc-500">ZIP code</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        autoComplete="postal-code"
                        maxLength={5}
                        className="mt-1 w-full rounded-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm text-slate-900 dark:text-white outline-none focus:border-blue-500"
                        value={finderZipStr}
                        onChange={(e) =>
                          setFinderZipStr(e.target.value.replace(/\D/g, "").slice(0, 5))
                        }
                        placeholder="90210"
                      />
                      <p className="mt-1 text-[11px] text-slate-600 dark:text-zinc-600">Local inventory on dealer sites</p>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500 dark:text-zinc-500">Year range</label>
                      <div className="mt-1 flex gap-1">
                        <input type="number" className="w-full rounded-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2 py-2 text-sm text-slate-900 dark:text-white outline-none focus:border-blue-500" value={finderMinYear} onChange={(e) => setFinderMinYear(Number(e.target.value) || 2010)} min={2010} max={2026} />
                        <span className="self-center text-slate-500 dark:text-zinc-500">–</span>
                        <input type="number" className="w-full rounded-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2 py-2 text-sm text-slate-900 dark:text-white outline-none focus:border-blue-500" value={finderMaxYear} onChange={(e) => setFinderMaxYear(Number(e.target.value) || 2026)} min={2010} max={2026} />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500 dark:text-zinc-500">Max mileage (used)</label>
                      <select className="mt-1 w-full rounded-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm text-slate-900 dark:text-white outline-none focus:border-blue-500" value={finderMaxMileage} onChange={(e) => setFinderMaxMileage(Number(e.target.value))}>
                        <option value={30000}>30,000 mi</option>
                        <option value={50000}>50,000 mi</option>
                        <option value={80000}>80,000 mi</option>
                        <option value={100000}>100,000 mi</option>
                        <option value={150000}>150,000 mi</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500 dark:text-zinc-500">Sort by</label>
                      <select className="mt-1 w-full rounded-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm text-slate-900 dark:text-white outline-none focus:border-blue-500" value={finderSort} onChange={(e) => setFinderSort(e.target.value as "monthly" | "price" | "mileage" | "mpg")}>
                        <option value="monthly">Monthly cost (low to high)</option>
                        <option value="price">Price (low to high)</option>
                        <option value="mileage">Mileage (low to high)</option>
                        <option value="mpg">MPG (high to low)</option>
                      </select>
                    </div>
                  </div>

                  {/* Results */}
                  <div className="mt-5">
                    <p className="text-sm text-slate-600 dark:text-zinc-400">{finderResults.length} vehicles found</p>
                    {finderResults.length > 0 && (
                      <p className="mt-2 text-xs leading-relaxed text-slate-500 dark:text-zinc-500">
                        Each card opens <span className="text-slate-600 dark:text-zinc-400">one</span> marketplace with a targeted search (year,
                        make/model, body style, fuel, price and mileage near this row&apos;s estimate, ZIP{" "}
                        <span className="font-mono text-slate-600 dark:text-zinc-400">
                          {finderZipStr.length === 5 ? finderZipStr : "90210"}
                        </span>
                        ). The site rotates by vehicle so every link stays as specific as possible—we don&apos;t receive
                        listing feeds, only search URLs.
                      </p>
                    )}
                    {finderResults.length === 0 ? (
                      <p className="mt-4 text-center text-sm text-slate-500 dark:text-zinc-500">No vehicles match your filters and budget. Try broadening your search.</p>
                    ) : (
                      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {finderResults.map((r, i) => {
                          const typeLabel = r.car.types.map((t) => CAR_TYPES.find((ct) => ct.value === t)?.label ?? t).join(" / ");
                          const tier = carTiers[finderTier];
                          const tierMax = tier?.maxCarPrice ?? r.price;
                          const dealerSite = pickMarketplaceForListing(r.car.id, r.year);
                          const dealerLink = buildSingleMarketplaceSearchLink(dealerSite, {
                            make: r.car.make,
                            model: r.car.model,
                            year: r.year,
                            zip: finderZipStr,
                            maxPrice: tierMax,
                            finderMaxMileageCap: finderMaxMileage,
                            listingMileage: r.isUsed ? r.mileage : null,
                            rowIsUsed: r.isUsed,
                            fuel: r.car.fuel,
                            primaryBodyType: r.car.types[0] ?? "sedan",
                            estimatedListPrice: r.price,
                          });
                          const priceBand = listingPriceSearchBand(r.price, tierMax);
                          const mileBand: MileageSearchBand | null = r.isUsed
                            ? mileageSearchWindow(r.mileage, finderMaxMileage)
                            : null;
                          let mileBandLabel = "";
                          if (mileBand) {
                            if (mileBand.tag === "range") {
                              mileBandLabel = ` · ~${formatMoney(mileBand.minMileage)}–${formatMoney(mileBand.maxMileage)} mi`;
                            } else {
                              mileBandLabel = ` · up to ${formatMoney(mileBand.maxMileage)} mi`;
                            }
                          }
                          return (
                            <div
                              key={`${r.car.id}-${r.year}-${i}`}
                              className="flex flex-col rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-4"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <p className="text-sm font-semibold text-slate-900 dark:text-white">{r.car.make} {r.car.model}</p>
                                  <p className="mt-0.5 text-xs text-slate-500 dark:text-zinc-500">{r.year} · {typeLabel}{r.isUsed && r.mileage !== null ? ` · ${formatMoney(r.mileage)} mi` : ""}</p>
                                </div>
                                <div className="flex shrink-0 gap-1">
                                  {r.car.fuel !== "gas" && (
                                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${r.car.fuel === "electric" ? "bg-purple-500/20 text-purple-400" : "bg-teal-500/20 text-teal-400"}`}>
                                      {r.car.fuel === "electric" ? "EV" : "Hybrid"}
                                    </span>
                                  )}
                                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${r.isUsed ? "bg-amber-500/20 text-amber-400" : "bg-green-500/20 text-green-400"}`}>
                                    {r.isUsed ? "Used" : "New"}
                                  </span>
                                </div>
                              </div>
                              <p className="mt-3 font-mono text-lg font-semibold text-slate-900 dark:text-white">${formatMoney(r.price)}</p>
                              <div className="mt-2 flex items-baseline justify-between text-xs">
                                <span className="text-slate-600 dark:text-zinc-400">Est. total monthly</span>
                                <span className="font-mono font-medium text-blue-400">${formatMoney(r.monthlyTotal)}/mo</span>
                              </div>
                              <div className="mt-1 flex items-baseline justify-between text-xs">
                                <span className="text-slate-500 dark:text-zinc-500">{r.car.types.includes("ev") ? "MPGe" : "MPG"}</span>
                                <span className="font-mono text-slate-600 dark:text-zinc-400">{r.car.mpg}</span>
                              </div>
                              <div className="mt-3 border-t border-slate-200 dark:border-zinc-800 pt-3">
                                <p className="mb-2 text-[10px] font-medium uppercase tracking-wide text-slate-500 dark:text-zinc-500">
                                  Shop live listings
                                </p>
                                <a
                                  href={dealerLink.href}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex w-full flex-col items-center justify-center rounded-lg border border-slate-300 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-950/60 px-3 py-3 text-center text-xs font-semibold leading-snug text-blue-400 transition hover:border-slate-300 dark:border-zinc-500 hover:bg-slate-200 dark:bg-zinc-800 hover:text-blue-300"
                                >
                                  <span>Open on {dealerLink.label}</span>
                                  <span className="mt-1 text-[10px] font-normal text-slate-500 dark:text-zinc-500">
                                    ~${formatMoney(priceBand.min)}–${formatMoney(priceBand.max)}
                                    {mileBandLabel}
                                    {" · "}
                                    {CAR_TYPES.find((ct) => ct.value === (r.car.types[0] ?? "sedan"))?.label ?? "vehicle"}
                                    {r.car.fuel !== "gas"
                                      ? ` · ${r.car.fuel === "electric" ? "Electric" : "Hybrid"}`
                                      : ""}
                                  </span>
                                </a>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Peer marketplaces (Craigslist / Facebook) — opt-in */}
            <div className="mt-6 rounded-xl border border-amber-900/40 bg-[#151a22]">
              <div className="border-b border-amber-900/30 px-5 py-4">
                <label className="flex cursor-pointer items-start gap-3">
                  <input
                    type="checkbox"
                    className="mt-1 h-4 w-4 shrink-0 rounded border-slate-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-amber-500 focus:ring-amber-500/40"
                    checked={showPeerMarketplaces}
                    onChange={(e) => setShowPeerMarketplaces(e.target.checked)}
                  />
                  <span>
                    <span className="block text-sm font-semibold text-amber-200/95">
                      Show peer-to-peer search links (Craigslist &amp; Facebook Marketplace)
                    </span>
                    <span className="mt-1 block text-xs leading-relaxed text-slate-500 dark:text-zinc-500">
                      Private-party listings are unverified. Meet safely, confirm price and title/VIN before paying.
                      Facebook does not support min-price filters in the URL—ignore unrealistic prices.
                    </span>
                  </span>
                </label>
              </div>

              {showPeerMarketplaces && (
                <div className="px-5 py-5">
                  <div className="max-w-md">
                    <label className="block text-xs font-medium text-slate-500 dark:text-zinc-500">Craigslist region</label>
                    <select
                      className="mt-1 w-full rounded-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm text-slate-900 dark:text-white outline-none focus:border-amber-600/60"
                      value={peerCraigslistSite}
                      onChange={(e) => setPeerCraigslistSite(e.target.value)}
                    >
                      {CRAIGSLIST_SITE_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label} ({o.value}.craigslist.org)
                        </option>
                      ))}
                    </select>
                    <p className="mt-1 text-[11px] text-slate-600 dark:text-zinc-600">
                      Defaults from your ZIP when you enable this section; change if you shop outside that area.
                      Craigslist search uses min/max price to reduce obvious $1 / $999 bait.
                    </p>
                  </div>

                  {finderResults.length === 0 ? (
                    <p className="mt-6 text-center text-sm text-slate-500 dark:text-zinc-500">
                      Use the finder above with results first—peer links use the same filters and tier cap.
                    </p>
                  ) : (
                    <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {finderResults.map((r, i) => {
                        const typeLabel = r.car.types
                          .map((t) => CAR_TYPES.find((ct) => ct.value === t)?.label ?? t)
                          .join(" / ");
                        const tier = carTiers[finderTier];
                        const tierMax = tier?.maxCarPrice ?? r.price;
                        const peerWhich = pickPeerMarketplace(r.car.id, r.year);
                        const peerLink =
                          r.isUsed
                            ? buildPeerMarketplaceSingleLink(peerWhich, {
                                make: r.car.make,
                                model: r.car.model,
                                year: r.year,
                                maxPrice: tierMax,
                                craigslistSubdomain: peerCraigslistSite,
                                rowIsUsed: r.isUsed,
                                fuel: r.car.fuel,
                                primaryBodyType: r.car.types[0] ?? "sedan",
                                estimatedListPrice: r.price,
                                listingMileage: r.mileage,
                                finderMaxMileageCap: finderMaxMileage,
                              })
                            : null;
                        return (
                          <div
                            key={`peer-${r.car.id}-${r.year}-${i}`}
                            className="flex flex-col rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-4"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                                  {r.car.make} {r.car.model}
                                </p>
                                <p className="mt-0.5 text-xs text-slate-500 dark:text-zinc-500">
                                  {r.year} · {typeLabel}
                                  {r.isUsed && r.mileage !== null ? ` · ${formatMoney(r.mileage)} mi` : ""}
                                </p>
                              </div>
                              <span
                                className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                                  r.isUsed ? "bg-amber-500/20 text-amber-400" : "bg-zinc-600/40 text-slate-600 dark:text-zinc-400"
                                }`}
                              >
                                {r.isUsed ? "Used" : "New"}
                              </span>
                            </div>
                            {!peerLink ? (
                              <p className="mt-3 text-xs leading-relaxed text-slate-500 dark:text-zinc-500">
                                Peer listings are almost always <span className="text-slate-600 dark:text-zinc-400">used</span>. Use dealer
                                links above for new cars, or include used vehicles in the finder.
                              </p>
                            ) : (
                              <div className="mt-3 border-t border-slate-200 dark:border-zinc-800 pt-3">
                                <p className="mb-2 text-[10px] font-medium uppercase tracking-wide text-slate-500 dark:text-zinc-500">
                                  Peer search (filtered)
                                </p>
                                <a
                                  href={peerLink.href}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex w-full flex-col items-center justify-center rounded-lg border border-slate-300 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-950/60 px-3 py-3 text-center text-xs font-semibold leading-snug text-amber-400/95 transition hover:border-amber-700/50 hover:bg-slate-200 dark:bg-zinc-800 hover:text-amber-300"
                                >
                                  <span>Open on {peerLink.label}</span>
                                  <span className="mt-1 text-[10px] font-normal text-slate-500 dark:text-zinc-500">
                                    One peer site per vehicle (Craigslist or Facebook) with price + keyword filters where
                                    supported.
                                  </span>
                                </a>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
