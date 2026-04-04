import { NextRequest, NextResponse } from "next/server";
import { CITIES, computeBudget } from "@/lib/lifestyle-data";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const cityId = sp.get("city");
  const incomeRaw = sp.get("income");
  const householdRaw = sp.get("household");

  if (!cityId || !incomeRaw) {
    return NextResponse.json({ error: "city and income are required" }, { status: 400 });
  }

  const city = CITIES.find((c) => c.id === cityId);
  if (!city) {
    return NextResponse.json({ error: `Unknown city: ${cityId}` }, { status: 400 });
  }

  const income = parseInt(incomeRaw, 10);
  if (!Number.isFinite(income) || income <= 0) {
    return NextResponse.json({ error: "Invalid income" }, { status: 400 });
  }

  const household = Math.max(1, Math.min(6, parseInt(householdRaw ?? "1", 10) || 1));

  const budget = computeBudget(city, income, household);

  const allOthers = CITIES
    .filter((c) => c.id !== cityId)
    .map((c) => {
      const b = computeBudget(c, income, household);
      return {
        id: c.id,
        name: c.name,
        state: c.state,
        country: c.country,
        monthlyNet: Math.round(b.monthlyNet),
        rent: b.rent,
        discretionary: Math.round(b.discretionary),
        lifestyleTier: b.lifestyleTier,
        tierColor: b.tierColor,
      };
    });

  const sameRegion = allOthers.filter((c) => c.country === city.country);
  const otherRegion = allOthers.filter((c) => c.country !== city.country);
  sameRegion.sort((a, b) => b.discretionary - a.discretionary);
  otherRegion.sort((a, b) => b.discretionary - a.discretionary);

  const comparisons = [
    ...sameRegion.slice(0, 5),
    ...otherRegion.slice(0, 5),
  ].sort((a, b) => b.discretionary - a.discretionary).slice(0, 10);

  return NextResponse.json({
    city: { id: city.id, name: city.name, state: city.state, country: city.country },
    income,
    household,
    budget: {
      grossIncome: budget.taxes.grossIncome,
      federalTax: Math.round(budget.taxes.federalTax),
      stateTax: Math.round(budget.taxes.stateTax),
      localTax: Math.round(budget.taxes.localTax),
      fica: Math.round(budget.taxes.fica),
      totalTax: Math.round(budget.taxes.totalTax),
      effectiveRate: Math.round(budget.taxes.effectiveRate * 10) / 10,
      netIncome: Math.round(budget.taxes.netIncome),
      monthlyNet: Math.round(budget.monthlyNet),
      rent: budget.rent,
      rentBedrooms: budget.rentBedrooms,
      food: budget.food,
      transportation: budget.transportation,
      healthcare: budget.healthcare,
      utilities: budget.utilities,
      insurance: budget.insurance,
      personal: budget.personal,
      totalEssentials: budget.totalEssentials,
      discretionary: Math.round(budget.discretionary),
      savingsCapacity: Math.round(budget.savingsCapacity),
      lifestyleTier: budget.lifestyleTier,
      tierColor: budget.tierColor,
    },
    comparisons,
  });
}
