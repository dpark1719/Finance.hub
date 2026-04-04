"use client";

import { useMemo, useState, type CSSProperties } from "react";

type TabId = "compound" | "mortgage" | "fire" | "debt";

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
    <main
      className="min-h-screen text-white"
      style={
        {
          backgroundColor: "var(--background, #0c0f14)",
          color: "var(--foreground, #e8eaed)",
          ["--background" as string]: "#0c0f14",
          ["--card" as string]: "#151a22",
          ["--foreground" as string]: "#e8eaed",
        } as CSSProperties
      }
    >
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Financial calculators
        </h1>
        <p className="mt-1 text-sm text-zinc-400">
          Client-side estimates — not financial advice.
        </p>

        <div className="mt-6 flex flex-wrap gap-2">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors sm:px-4 ${
                tab === t.id
                  ? "bg-blue-600 text-white"
                  : "bg-zinc-800 text-zinc-400 hover:text-zinc-200"
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
              className="rounded-xl border border-zinc-800 bg-[var(--card)] p-5 sm:p-6"
              style={{ ["--card" as string]: "#151a22" } as CSSProperties}
            >
              <h2 className="text-lg font-semibold">Inputs</h2>
              <div className="mt-4 space-y-4">
                <label className="block">
                  <span className="text-sm text-zinc-400">Initial amount ($)</span>
                  <input
                    type="number"
                    className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-white outline-none focus:border-blue-500"
                    value={ciInitialStr}
                    onChange={(e) => setCiInitialStr(e.target.value)}
                  />
                </label>
                <label className="block">
                  <span className="text-sm text-zinc-400">Monthly contribution ($)</span>
                  <input
                    type="number"
                    className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-white outline-none focus:border-blue-500"
                    value={ciMonthlyStr}
                    onChange={(e) => setCiMonthlyStr(e.target.value)}
                  />
                </label>
                <label className="block">
                  <span className="text-sm text-zinc-400">Annual interest rate (%)</span>
                  <input
                    type="number"
                    step="0.01"
                    className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-white outline-none focus:border-blue-500"
                    value={ciRateStr}
                    onChange={(e) => setCiRateStr(e.target.value)}
                  />
                </label>
                <label className="block">
                  <span className="text-sm text-zinc-400">Years</span>
                  <input
                    type="number"
                    className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-white outline-none focus:border-blue-500"
                    value={ciYearsStr}
                    onChange={(e) => setCiYearsStr(e.target.value)}
                  />
                </label>
              </div>
            </div>

            <div
              className="rounded-xl border border-zinc-800 bg-[var(--card)] p-5 sm:p-6"
              style={{ ["--card" as string]: "#151a22" } as CSSProperties}
            >
              <h2 className="text-lg font-semibold">Results</h2>
              <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-1">
                <div className="flex justify-between gap-4 border-b border-zinc-800 pb-2">
                  <dt className="text-zinc-400">Final balance</dt>
                  <dd className="font-mono text-lg font-medium">
                    ${formatMoney(compound.final)}
                  </dd>
                </div>
                <div className="flex justify-between gap-4 border-b border-zinc-800 pb-2">
                  <dt className="text-zinc-400">Total contributions</dt>
                  <dd className="font-mono">${formatMoney(compound.totalContrib)}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-zinc-400">Total interest earned</dt>
                  <dd className="font-mono text-emerald-400">
                    ${formatMoney(compound.totalInterest)}
                  </dd>
                </div>
              </dl>

              {compoundChart && compound.years > 0 && (
                <div className="mt-6">
                  <p className="text-sm text-zinc-400">Growth over time</p>
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
                  <div className="mt-2 flex gap-4 text-xs text-zinc-500">
                    <span className="flex items-center gap-1">
                      <span className="inline-block h-0.5 w-6 bg-blue-600" /> Balance
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="inline-block h-0.5 w-6 border-t border-dashed border-zinc-500" />{" "}
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
              className="rounded-xl border border-zinc-800 bg-[var(--card)] p-5 sm:p-6"
              style={{ ["--card" as string]: "#151a22" } as CSSProperties}
            >
              <h2 className="text-lg font-semibold">Inputs</h2>
              <div className="mt-4 space-y-4">
                <label className="block">
                  <span className="text-sm text-zinc-400">Home price ($)</span>
                  <input
                    type="number"
                    className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-white outline-none focus:border-blue-500"
                    value={mHomeStr}
                    onChange={(e) => setMHomeStr(e.target.value)}
                  />
                </label>
                <label className="block">
                  <span className="text-sm text-zinc-400">Down payment (%)</span>
                  <input
                    type="number"
                    step="0.1"
                    className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-white outline-none focus:border-blue-500"
                    value={mDownPctStr}
                    onChange={(e) => setMDownPctStr(e.target.value)}
                  />
                </label>
                <label className="block">
                  <span className="text-sm text-zinc-400">Interest rate (%)</span>
                  <input
                    type="number"
                    step="0.01"
                    className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-white outline-none focus:border-blue-500"
                    value={mRateStr}
                    onChange={(e) => setMRateStr(e.target.value)}
                  />
                </label>
                <fieldset>
                  <legend className="text-sm text-zinc-400">Loan term</legend>
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
              className="rounded-xl border border-zinc-800 bg-[var(--card)] p-5 sm:p-6"
              style={{ ["--card" as string]: "#151a22" } as CSSProperties}
            >
              <h2 className="text-lg font-semibold">Results</h2>
              <dl className="mt-4 space-y-3 text-sm">
                <div className="flex justify-between gap-4 border-b border-zinc-800 pb-2">
                  <dt className="text-zinc-400">Loan amount</dt>
                  <dd className="font-mono">${formatMoney(mortgage.loan)}</dd>
                </div>
                <div className="flex justify-between gap-4 border-b border-zinc-800 pb-2">
                  <dt className="text-zinc-400">Monthly payment</dt>
                  <dd className="font-mono text-lg font-medium">
                    ${formatMoney2(mortgage.payment)}
                  </dd>
                </div>
                <div className="flex justify-between gap-4 border-b border-zinc-800 pb-2">
                  <dt className="text-zinc-400">Total interest</dt>
                  <dd className="font-mono">${formatMoney(mortgage.totalInterest)}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-zinc-400">Total cost (loan + down)</dt>
                  <dd className="font-mono">${formatMoney(mortgage.totalCost)}</dd>
                </div>
              </dl>

              <div className="mt-6 rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
                <h3 className="text-sm font-medium text-zinc-300">Amortization summary</h3>
                <div className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-zinc-500">
                      First year
                    </p>
                    <p className="mt-1 text-zinc-400">
                      Interest:{" "}
                      <span className="font-mono text-white">
                        ${formatMoney(mortgage.slices.firstYearInterest)}
                      </span>
                    </p>
                    <p className="text-zinc-400">
                      Principal:{" "}
                      <span className="font-mono text-white">
                        ${formatMoney(mortgage.slices.firstYearPrincipal)}
                      </span>
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-zinc-500">
                      Last year
                    </p>
                    <p className="mt-1 text-zinc-400">
                      Interest:{" "}
                      <span className="font-mono text-white">
                        ${formatMoney(mortgage.slices.lastYearInterest)}
                      </span>
                    </p>
                    <p className="text-zinc-400">
                      Principal:{" "}
                      <span className="font-mono text-white">
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
              className="rounded-xl border border-zinc-800 bg-[var(--card)] p-5 sm:p-6"
              style={{ ["--card" as string]: "#151a22" } as CSSProperties}
            >
              <h2 className="text-lg font-semibold">Inputs</h2>
              <div className="mt-4 space-y-4">
                <label className="block">
                  <span className="text-sm text-zinc-400">Current savings ($)</span>
                  <input
                    type="number"
                    className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-white outline-none focus:border-blue-500"
                    value={fireSavingsStr}
                    onChange={(e) => setFireSavingsStr(e.target.value)}
                  />
                </label>
                <label className="block">
                  <span className="text-sm text-zinc-400">Annual income ($)</span>
                  <input
                    type="number"
                    className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-white outline-none focus:border-blue-500"
                    value={fireIncomeStr}
                    onChange={(e) => setFireIncomeStr(e.target.value)}
                  />
                </label>
                <label className="block">
                  <span className="flex justify-between text-sm text-zinc-400">
                    <span>Savings rate</span>
                    <span className="font-mono text-white">{fireSaveRate}%</span>
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
                  <span className="text-sm text-zinc-400">Expected annual return (%)</span>
                  <input
                    type="number"
                    step="0.1"
                    className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-white outline-none focus:border-blue-500"
                    value={fireReturnStr}
                    onChange={(e) => setFireReturnStr(e.target.value)}
                  />
                </label>
                <label className="block">
                  <span className="text-sm text-zinc-400">
                    Annual spending in retirement ($)
                  </span>
                  <input
                    type="number"
                    className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-white outline-none focus:border-blue-500"
                    value={fireSpendStr}
                    onChange={(e) => setFireSpendStr(e.target.value)}
                  />
                </label>
              </div>
            </div>

            <div
              className="rounded-xl border border-zinc-800 bg-[var(--card)] p-5 sm:p-6"
              style={{ ["--card" as string]: "#151a22" } as CSSProperties}
            >
              <h2 className="text-lg font-semibold">Results</h2>
              <dl className="mt-4 space-y-3 text-sm">
                <div className="flex justify-between gap-4 border-b border-zinc-800 pb-2">
                  <dt className="text-zinc-400">Target nest egg (25× spending)</dt>
                  <dd className="font-mono">${formatMoney(fire.target)}</dd>
                </div>
                <div className="flex justify-between gap-4 border-b border-zinc-800 pb-2">
                  <dt className="text-zinc-400">Monthly savings needed (from rate)</dt>
                  <dd className="font-mono">${formatMoney2(fire.monthlySave)}</dd>
                </div>
                <div className="flex justify-between gap-4 border-b border-zinc-800 pb-2">
                  <dt className="text-zinc-400">Years to FIRE</dt>
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
                  <dt className="text-zinc-400">Projected portfolio at FIRE</dt>
                  <dd className="font-mono text-emerald-400">
                    ${formatMoney(fire.projectedAtFire)}
                  </dd>
                </div>
              </dl>

              {fire.months !== null && (
                <div className="mt-6">
                  <h3 className="text-sm font-medium text-zinc-300">Milestone timeline</h3>
                  <ul className="mt-3 space-y-2">
                    {fire.milestones.map((m, i) => (
                      <li
                        key={i}
                        className="flex flex-wrap items-baseline justify-between gap-2 rounded-lg border border-zinc-800 bg-zinc-900/40 px-3 py-2 text-sm"
                      >
                        <span className="text-zinc-400">{m.label}</span>
                        <span className="text-zinc-500">
                          {m.years.toLocaleString(undefined, {
                            maximumFractionDigits: 1,
                          })}{" "}
                          yrs
                        </span>
                        <span className="font-mono text-white">
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
              className="rounded-xl border border-zinc-800 bg-[var(--card)] p-5 sm:p-6"
              style={{ ["--card" as string]: "#151a22" } as CSSProperties}
            >
              <h2 className="text-lg font-semibold">Debts</h2>
              <div className="mt-4 space-y-4 overflow-x-auto">
                <table className="w-full min-w-[320px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-zinc-800 text-zinc-400">
                      <th className="pb-2 pr-2 font-medium">Name</th>
                      <th className="pb-2 pr-2 font-medium">Balance</th>
                      <th className="pb-2 pr-2 font-medium">APR %</th>
                      <th className="pb-2 font-medium">Min pay</th>
                      <th className="pb-2 w-8" />
                    </tr>
                  </thead>
                  <tbody>
                    {debts.map((d) => (
                      <tr key={d.id} className="border-b border-zinc-800/80">
                        <td className="py-2 pr-2">
                          <input
                            className="w-full min-w-[100px] rounded border border-zinc-700 bg-zinc-900 px-2 py-1 text-white"
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
                            className="w-full min-w-[80px] rounded border border-zinc-700 bg-zinc-900 px-2 py-1 text-white"
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
                            className="w-full min-w-[70px] rounded border border-zinc-700 bg-zinc-900 px-2 py-1 text-white"
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
                            className="w-full min-w-[70px] rounded border border-zinc-700 bg-zinc-900 px-2 py-1 text-white"
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
                className="mt-4 rounded-lg bg-zinc-800 px-4 py-2 text-sm font-medium text-zinc-200 hover:bg-zinc-700"
              >
                Add debt
              </button>

              <label className="mt-6 block">
                <span className="flex justify-between text-sm text-zinc-400">
                  <span>Extra monthly payment</span>
                  <span className="font-mono text-white">${debtExtra}</span>
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
              className="rounded-xl border border-zinc-800 bg-[var(--card)] p-5 sm:p-6"
              style={{ ["--card" as string]: "#151a22" } as CSSProperties}
            >
              <h2 className="text-lg font-semibold">Avalanche vs snowball</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
                  <h3 className="text-sm font-semibold text-blue-400">Avalanche</h3>
                  <p className="mt-2 text-xs text-zinc-500">Highest APR first</p>
                  <dl className="mt-3 space-y-2 text-sm">
                    <div className="flex justify-between gap-2">
                      <dt className="text-zinc-400">Total interest</dt>
                      <dd className="font-mono">
                        ${formatMoney(debtCompare.avalanche.totalInterestPaid)}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-2">
                      <dt className="text-zinc-400">Payoff time</dt>
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
                <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
                  <h3 className="text-sm font-semibold text-amber-400">Snowball</h3>
                  <p className="mt-2 text-xs text-zinc-500">Lowest balance first</p>
                  <dl className="mt-3 space-y-2 text-sm">
                    <div className="flex justify-between gap-2">
                      <dt className="text-zinc-400">Total interest</dt>
                      <dd className="font-mono">
                        ${formatMoney(debtCompare.snowball.totalInterestPaid)}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-2">
                      <dt className="text-zinc-400">Payoff time</dt>
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
      </div>
    </main>
  );
}
