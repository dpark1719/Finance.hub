"use client";

import { useSupabaseUser } from "@/lib/hooks/useSupabaseUser";
import { debounce } from "@/lib/debounce";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CITIES, INCOME_LEVELS, type CityData } from "@/lib/lifestyle-data";

/* ── Types ────────────────────────────────────────────────────── */

interface BudgetResult {
  city: { id: string; name: string; state: string; country: string };
  income: number;
  household: number;
  budget: {
    grossIncome: number;
    federalTax: number;
    stateTax: number;
    localTax: number;
    fica: number;
    totalTax: number;
    effectiveRate: number;
    netIncome: number;
    monthlyNet: number;
    rent: number;
    rentBedrooms: string;
    food: number;
    transportation: number;
    healthcare: number;
    utilities: number;
    insurance: number;
    personal: number;
    totalEssentials: number;
    discretionary: number;
    savingsCapacity: number;
    lifestyleTier: string;
    tierColor: string;
  };
  comparisons: Array<{
    id: string;
    name: string;
    state: string;
    country: string;
    monthlyNet: number;
    rent: number;
    discretionary: number;
    lifestyleTier: string;
    tierColor: string;
  }>;
}

/* ── Helpers ──────────────────────────────────────────────────── */

const fmt = (n: number) =>
  n.toLocaleString("en-US", { maximumFractionDigits: 0 });

const COUNTRY_NAMES: Record<string, string> = {
  US: "United States", GB: "United Kingdom", FR: "France", DE: "Germany",
  NL: "Netherlands", CH: "Switzerland", AT: "Austria", ES: "Spain",
  IT: "Italy", IE: "Ireland", PT: "Portugal", DK: "Denmark", SE: "Sweden",
  NO: "Norway", FI: "Finland", BE: "Belgium", CZ: "Czech Republic",
  PL: "Poland", HU: "Hungary", GR: "Greece", JP: "Japan", KR: "South Korea",
  CN: "China", HK: "Hong Kong", SG: "Singapore", TW: "Taiwan",
  TH: "Thailand", MY: "Malaysia", ID: "Indonesia", PH: "Philippines",
  VN: "Vietnam", IN: "India", AE: "UAE", QA: "Qatar", SA: "Saudi Arabia",
  IL: "Israel", TR: "Turkey", AU: "Australia", NZ: "New Zealand",
  CA: "Canada", MX: "Mexico", BR: "Brazil", AR: "Argentina",
  CO: "Colombia", CL: "Chile", PE: "Peru", PA: "Panama",
  ZA: "South Africa", KE: "Kenya", NG: "Nigeria", EG: "Egypt",
  GH: "Ghana", MA: "Morocco", RO: "Romania", RS: "Serbia",
  HR: "Croatia", BD: "Bangladesh", PK: "Pakistan", KH: "Cambodia",
  OM: "Oman", KW: "Kuwait",
};

const tierLabels: Record<string, string> = {
  struggling: "Struggling",
  tight: "Tight Budget",
  modest: "Modest",
  comfortable: "Comfortable",
  affluent: "Affluent",
};

/* ── Typical-example data for each category ─────────────────── */

interface DetailItem { label: string; price: string; note?: string }
interface CategoryDetail { description: string; items: DetailItem[] }

const CITY_NEIGHBORHOODS: Record<string, { affordable: string; mid: string; pricey: string }> = {
  nyc: { affordable: "Washington Heights, East Harlem, Bushwick", mid: "Astoria, Jackson Heights, Crown Heights", pricey: "Lower Manhattan, Williamsburg, Park Slope" },
  la: { affordable: "Koreatown, North Hollywood, Inglewood", mid: "Silver Lake, Culver City, Glendale", pricey: "Santa Monica, West Hollywood, Beverly Grove" },
  chicago: { affordable: "Rogers Park, Bridgeport, Pilsen", mid: "Logan Square, Lakeview, Uptown", pricey: "Lincoln Park, West Loop, River North" },
  sf: { affordable: "Outer Sunset, Excelsior, Bayview", mid: "Inner Richmond, Noe Valley, Glen Park", pricey: "Marina, SoMa, Pacific Heights" },
  seattle: { affordable: "Rainier Valley, White Center, Beacon Hill", mid: "Ballard, Fremont, Columbia City", pricey: "Capitol Hill, Queen Anne, South Lake Union" },
  boston: { affordable: "Dorchester, Mattapan, East Boston", mid: "Allston, Jamaica Plain, Somerville", pricey: "Back Bay, Beacon Hill, South End" },
  dc: { affordable: "Anacostia, Brookland, Congress Heights", mid: "Petworth, Columbia Heights, H Street NE", pricey: "Dupont Circle, Georgetown, Logan Circle" },
  miami: { affordable: "Hialeah, Little Havana, Overtown", mid: "Wynwood, Edgewater, Coral Gables", pricey: "Brickell, South Beach, Coconut Grove" },
  denver: { affordable: "Montbello, Westwood, Globeville", mid: "Capitol Hill, Baker, Wash Park", pricey: "Cherry Creek, LoDo, Highlands" },
  austin: { affordable: "Rundberg, Dove Springs, Del Valle", mid: "East Austin, North Loop, Mueller", pricey: "Downtown, Zilker, Tarrytown" },
  houston: { affordable: "Greenspoint, Alief, Gulfton", mid: "Montrose, Heights, Midtown", pricey: "River Oaks, West University, Upper Kirby" },
  phoenix: { affordable: "Maryvale, South Mountain, Laveen", mid: "Tempe, Central Phoenix, Arcadia", pricey: "Scottsdale, Paradise Valley, Biltmore" },
  dallas: { affordable: "Pleasant Grove, Oak Cliff, West Dallas", mid: "Bishop Arts, Deep Ellum, Lakewood", pricey: "Uptown, Highland Park, Knox-Henderson" },
  atlanta: { affordable: "College Park, East Point, Decatur outskirts", mid: "Old Fourth Ward, East Atlanta, Inman Park", pricey: "Buckhead, Midtown, Virginia-Highland" },
  nashville: { affordable: "Antioch, Madison, Donelson", mid: "East Nashville, Germantown, Berry Hill", pricey: "The Gulch, 12 South, Green Hills" },
  portland: { affordable: "Lents, Gresham, outer SE", mid: "Hawthorne, Alberta, St. Johns", pricey: "Pearl District, NW 23rd, Irvington" },
  vegas: { affordable: "North Las Vegas, Sunrise Manor", mid: "Henderson, Spring Valley, Summerlin South", pricey: "Summerlin, Southwest, Southern Highlands" },
  london: { affordable: "Barking, Croydon, Lewisham", mid: "Brixton, Hackney, Peckham", pricey: "Kensington, Mayfair, Notting Hill" },
  paris: { affordable: "19th arr., 20th arr., 13th arr.", mid: "11th arr., 10th arr., Montmartre", pricey: "6th arr., 7th arr., Le Marais" },
  tokyo: { affordable: "Adachi, Katsushika, Edogawa", mid: "Nakano, Suginami, Koenji", pricey: "Minato, Shibuya, Shinjuku" },
  seoul: { affordable: "Nowon, Dobong, Guro", mid: "Mapo, Seodaemun, Dongdaemun", pricey: "Gangnam, Seocho, Yongsan" },
  sydney: { affordable: "Bankstown, Parramatta, Liverpool", mid: "Newtown, Marrickville, Surry Hills", pricey: "Bondi, Manly, Darlinghurst" },
  toronto: { affordable: "Scarborough, Etobicoke, North York", mid: "Leslieville, Kensington Market, Bloor West", pricey: "Yorkville, King West, Liberty Village" },
  singapore: { affordable: "Woodlands, Jurong, Punggol (HDB)", mid: "Toa Payoh, Queenstown (HDB/condo)", pricey: "Orchard, Marina Bay, Tanjong Pagar (condo)" },
  dubai: { affordable: "Al Nahda, International City, Discovery Gardens", mid: "JLT, Al Barsha, Business Bay", pricey: "Downtown, DIFC, Palm Jumeirah" },
  "hong-kong": { affordable: "Tuen Mun, Tin Shui Wai, Sham Shui Po", mid: "Mong Kok, Tsuen Wan, Taikoo", pricey: "Mid-Levels, Wan Chai, Central" },
};

const CITY_TRANSIT: Record<string, { mode: string; single: string; monthly: string }> = {
  nyc: { mode: "Subway (MTA)", single: "$2.90", monthly: "$132 (unlimited MetroCard)" },
  la: { mode: "Metro rail/bus", single: "$1.75", monthly: "$100 (TAP pass)" },
  chicago: { mode: "CTA 'L' train/bus", single: "$2.50", monthly: "$75 (Ventra pass)" },
  sf: { mode: "BART / Muni", single: "$2.50 Muni / $4–8 BART", monthly: "$98 Muni pass" },
  seattle: { mode: "Link light rail / bus", single: "$2.75", monthly: "$99 ORCA pass" },
  boston: { mode: "MBTA subway/bus", single: "$2.40", monthly: "$90 (CharlieCard)" },
  dc: { mode: "Metro (WMATA)", single: "$2.25–6.00", monthly: "$96 (bus+rail)" },
  london: { mode: "Tube / bus", single: "£2.80 Tube / £1.75 bus", monthly: "£160 (Zone 1-2 Travelcard)" },
  paris: { mode: "Métro / RER", single: "€2.15 (t+ ticket)", monthly: "€86 (Navigo pass)" },
  tokyo: { mode: "JR / Tokyo Metro", single: "¥170–330 ($1.10–$2.20)", monthly: "¥10,000–15,000 ($65–$100)" },
  seoul: { mode: "Metro / bus", single: "₩1,400 ($1.05)", monthly: "₩62,000 ($46) climate card" },
  sydney: { mode: "Train / bus / ferry", single: "A$4–6 (Opal card)", monthly: "~A$200 capped ($130)" },
  toronto: { mode: "TTC subway/bus", single: "C$3.35", monthly: "C$156 Metropass ($112)" },
  singapore: { mode: "MRT / bus", single: "S$1–3 ($0.75–$2.25)", monthly: "~S$120 ($90)" },
  dubai: { mode: "Metro / bus", single: "AED 4–8.50 ($1–$2.30)", monthly: "AED 350 ($95) Nol Silver" },
  "hong-kong": { mode: "MTR / bus / tram", single: "HK$5–30 ($0.65–$3.85)", monthly: "~HK$500 ($64) MTR monthly" },
};

function scale(base: number, rpp: number): number {
  return Math.round(base * (rpp / 100));
}

function fmtPrice(n: number): string {
  return "$" + n.toLocaleString("en-US", { maximumFractionDigits: 0 });
}

const DEFAULT_US_RENT_SCOPE =
  "U.S. amounts use HUD Fair Market Rent where we have matched the city to a metro: a regional benchmark for the whole metropolitan statistical area (often near the 40th percentile of rents), not one neighborhood or a luxury building. Downtown and waterfront districts are usually above this; outer neighborhoods and many suburbs are often closer.";

function buildRentDetail(city: CityData, rent: number, bedrooms: string): CategoryDetail {
  const nh = CITY_NEIGHBORHOODS[city.id];
  const rpp = city.rpp;
  const br = bedrooms.toLowerCase();
  let description: string;

  if (city.country === "US") {
    description = `Budget line ${fmtPrice(rent)}/mo for a ${br} is tied to HUD’s metro-wide Fair Market Rent for this market—not a typical Loop or downtown high-rise listing. It’s meant as a regional planning benchmark (see “What this number represents” below).`;
    if (rpp >= 120) {
      description += ` In high-cost metros, listings in the urban core often run hundreds above this HUD figure for the same bedroom count.`;
    } else if (rpp >= 105) {
      description += ` Core city neighborhoods usually skew higher than the metro average; many listings closer to this range appear farther from the central business district.`;
    } else {
      description += ` In lower-cost markets, actual asking rents sometimes track closer to this benchmark across more of the city.`;
    }
  } else if (rpp >= 120) {
    description = `At ${fmtPrice(rent)}/mo for a ${br}, expect a compact unit in an older building or walk-up. Newer builds and doorman buildings cost 20–40% more.`;
  } else if (rpp >= 105) {
    description = `At ${fmtPrice(rent)}/mo for a ${br}, you'll find a standard apartment with in-unit laundry in many areas. Central neighborhoods run higher.`;
  } else if (rpp >= 95) {
    description = `At ${fmtPrice(rent)}/mo for a ${br}, you can get a well-sized apartment in good neighborhoods, often with parking included.`;
  } else {
    description = `At ${fmtPrice(rent)}/mo for a ${br}, housing is affordable — spacious apartments or small houses available in central areas.`;
  }

  const items: DetailItem[] = [];

  if (city.country === "US") {
    items.push({
      label: "What this number represents",
      price: "",
      note: city.rentAreaNote ?? DEFAULT_US_RENT_SCOPE,
    });
  }

  if (nh) {
    items.push({
      label: "Budget-friendly areas (often closer to the HUD line)",
      price: "",
      note: nh.affordable,
    });
    items.push({ label: "Mid-range neighborhoods", price: "", note: nh.mid });
    items.push({ label: "Premium neighborhoods (usually above the HUD benchmark)", price: "", note: nh.pricey });
  }

  items.push({ label: "Broker / agent fee (if applicable)", price: rpp >= 115 ? "1–2 months' rent" : "Typically none" });
  items.push({ label: "Security deposit", price: "1 month's rent typical" });
  items.push({ label: "Renters insurance", price: `${fmtPrice(scale(15, rpp))}–${fmtPrice(scale(30, rpp))}/mo` });

  return { description, items };
}

function buildFoodDetail(city: CityData, monthlyFood: number, household: number): CategoryDetail {
  const rpp = city.rpp;
  const perPerson = Math.round(monthlyFood / (household > 0 ? household : 1));
  const description = `Budget of ${fmtPrice(monthlyFood)}/mo (${fmtPrice(perPerson)}/person) covers groceries and modest dining. Here's what typical costs look like:`;

  return {
    description,
    items: [
      { label: "Weekly grocery run (one person)", price: `${fmtPrice(scale(70, rpp))}–${fmtPrice(scale(110, rpp))}`, note: "Staples, produce, proteins, dairy" },
      { label: "Casual sit-down dinner (per person)", price: `${fmtPrice(scale(15, rpp))}–${fmtPrice(scale(25, rpp))}`, note: "Burrito bowl, ramen, pub meal" },
      { label: "Fast food combo meal", price: `${fmtPrice(scale(10, rpp))}–${fmtPrice(scale(14, rpp))}` },
      { label: "Coffee (latte)", price: `${fmtPrice(scale(5, rpp))}–${fmtPrice(scale(7, rpp))}` },
      { label: "Food delivery order (one person)", price: `${fmtPrice(scale(18, rpp))}–${fmtPrice(scale(30, rpp))}`, note: "Including delivery fee and tip" },
      { label: "Nice restaurant dinner (per person)", price: `${fmtPrice(scale(40, rpp))}–${fmtPrice(scale(75, rpp))}`, note: "Entrée + drink, pre-tip" },
      { label: "Beer at a bar", price: `${fmtPrice(scale(6, rpp))}–${fmtPrice(scale(10, rpp))}` },
      { label: "Dozen eggs", price: `${fmtPrice(scale(3, rpp))}–${fmtPrice(scale(5, rpp))}` },
      { label: "Gallon of milk", price: `${fmtPrice(scale(4, rpp))}–${fmtPrice(scale(6, rpp))}` },
    ],
  };
}

function buildTransportDetail(city: CityData, monthlyTransport: number): CategoryDetail {
  const rpp = city.rpp;
  const transit = CITY_TRANSIT[city.id];
  const description = `Budget of ${fmtPrice(monthlyTransport)}/mo covers typical commuting costs.${transit ? ` Primary public transit: ${transit.mode}.` : ""}`;

  const items: DetailItem[] = [];
  if (transit) {
    items.push({ label: "Single ride", price: transit.single });
    items.push({ label: "Monthly transit pass", price: transit.monthly });
  } else {
    items.push({ label: "Public transit single ride", price: `${fmtPrice(scale(2, rpp))}–${fmtPrice(scale(4, rpp))}` });
    items.push({ label: "Monthly transit pass (estimate)", price: `${fmtPrice(scale(70, rpp))}–${fmtPrice(scale(120, rpp))}` });
  }
  items.push({ label: "Uber / Lyft (5-mile ride)", price: `${fmtPrice(scale(12, rpp))}–${fmtPrice(scale(22, rpp))}`, note: "Standard, non-surge" });
  items.push({ label: "Uber / Lyft (airport run)", price: `${fmtPrice(scale(25, rpp))}–${fmtPrice(scale(55, rpp))}` });
  items.push({ label: "Gallon of gas", price: `${fmtPrice(scale(3, rpp))}–${fmtPrice(scale(5, rpp))}` });
  items.push({ label: "Monthly parking (downtown)", price: `${fmtPrice(scale(150, rpp))}–${fmtPrice(scale(350, rpp))}` });
  items.push({ label: "Car insurance (monthly)", price: `${fmtPrice(scale(120, rpp))}–${fmtPrice(scale(200, rpp))}` });

  return { description, items };
}

function buildHealthcareDetail(city: CityData, monthlyHealth: number, household: number): CategoryDetail {
  const rpp = city.rpp;
  const isUS = city.country === "US";
  const perPerson = Math.round(monthlyHealth / (household > 0 ? household : 1));
  const description = isUS
    ? `Budget of ${fmtPrice(monthlyHealth)}/mo (${fmtPrice(perPerson)}/person) for out-of-pocket medical costs beyond employer insurance.`
    : `Budget of ${fmtPrice(monthlyHealth)}/mo (${fmtPrice(perPerson)}/person). Many countries have public healthcare, so this covers supplemental/private costs and out-of-pocket expenses.`;

  const items: DetailItem[] = isUS
    ? [
        { label: "Primary care visit (copay)", price: `${fmtPrice(scale(25, rpp))}–${fmtPrice(scale(50, rpp))}` },
        { label: "Specialist visit (copay)", price: `${fmtPrice(scale(40, rpp))}–${fmtPrice(scale(75, rpp))}` },
        { label: "Urgent care visit", price: `${fmtPrice(scale(100, rpp))}–${fmtPrice(scale(200, rpp))}`, note: "With insurance" },
        { label: "Generic prescription (30-day)", price: `${fmtPrice(scale(5, rpp))}–${fmtPrice(scale(30, rpp))}` },
        { label: "Dental cleaning", price: `${fmtPrice(scale(80, rpp))}–${fmtPrice(scale(150, rpp))}`, note: "With insurance" },
        { label: "Eye exam", price: `${fmtPrice(scale(50, rpp))}–${fmtPrice(scale(100, rpp))}` },
        { label: "ER visit (copay)", price: `${fmtPrice(scale(150, rpp))}–${fmtPrice(scale(500, rpp))}`, note: "High variability" },
      ]
    : [
        { label: "Private GP consultation", price: `${fmtPrice(scale(40, rpp))}–${fmtPrice(scale(100, rpp))}` },
        { label: "Specialist visit (private)", price: `${fmtPrice(scale(80, rpp))}–${fmtPrice(scale(200, rpp))}` },
        { label: "Prescription (common meds)", price: `${fmtPrice(scale(5, rpp))}–${fmtPrice(scale(40, rpp))}` },
        { label: "Dental cleaning (private)", price: `${fmtPrice(scale(50, rpp))}–${fmtPrice(scale(120, rpp))}` },
        { label: "Private health insurance (monthly)", price: `${fmtPrice(scale(80, rpp))}–${fmtPrice(scale(250, rpp))}` },
        { label: "Public system wait times", price: "", note: "Varies — weeks to months for non-urgent" },
      ];

  return { description, items };
}

function buildUtilitiesDetail(city: CityData, monthlyUtil: number): CategoryDetail {
  const rpp = city.rpp;
  const description = `Budget of ${fmtPrice(monthlyUtil)}/mo covers basic home utilities for an average apartment.`;

  return {
    description,
    items: [
      { label: "Electricity", price: `${fmtPrice(scale(60, rpp))}–${fmtPrice(scale(120, rpp))}/mo`, note: "Varies by climate / AC usage" },
      { label: "Gas / heating", price: `${fmtPrice(scale(30, rpp))}–${fmtPrice(scale(80, rpp))}/mo`, note: "Higher in winter" },
      { label: "Water / sewer", price: `${fmtPrice(scale(25, rpp))}–${fmtPrice(scale(50, rpp))}/mo` },
      { label: "Internet (high-speed)", price: `${fmtPrice(scale(50, rpp))}–${fmtPrice(scale(80, rpp))}/mo` },
      { label: "Cell phone plan", price: `${fmtPrice(scale(40, rpp))}–${fmtPrice(scale(70, rpp))}/mo`, note: "Unlimited data" },
      { label: "Streaming services (2–3)", price: `${fmtPrice(scale(25, rpp))}–${fmtPrice(scale(45, rpp))}/mo` },
    ],
  };
}

function buildInsuranceDetail(city: CityData, monthlyIns: number, household: number): CategoryDetail {
  const rpp = city.rpp;
  const description = `Budget of ${fmtPrice(monthlyIns)}/mo covers non-health insurance needs for ${household} ${household === 1 ? "person" : "people"}.`;

  return {
    description,
    items: [
      { label: "Renters insurance", price: `${fmtPrice(scale(15, rpp))}–${fmtPrice(scale(30, rpp))}/mo` },
      { label: "Auto insurance (if applicable)", price: `${fmtPrice(scale(100, rpp))}–${fmtPrice(scale(200, rpp))}/mo`, note: "Full coverage, varies by driving record" },
      { label: "Umbrella policy", price: `${fmtPrice(scale(15, rpp))}–${fmtPrice(scale(25, rpp))}/mo`, note: "$1M coverage" },
      { label: "Life insurance (term, 30s)", price: `${fmtPrice(scale(20, rpp))}–${fmtPrice(scale(40, rpp))}/mo`, note: "$500K coverage" },
      { label: "Pet insurance (if applicable)", price: `${fmtPrice(scale(30, rpp))}–${fmtPrice(scale(60, rpp))}/mo` },
    ],
  };
}

function buildPersonalDetail(city: CityData, monthlyPersonal: number): CategoryDetail {
  const rpp = city.rpp;
  const description = `Budget of ${fmtPrice(monthlyPersonal)}/mo for personal care, clothing, and everyday purchases.`;

  return {
    description,
    items: [
      { label: "Haircut (basic)", price: `${fmtPrice(scale(20, rpp))}–${fmtPrice(scale(45, rpp))}` },
      { label: "Gym membership", price: `${fmtPrice(scale(30, rpp))}–${fmtPrice(scale(70, rpp))}/mo`, note: "Basic gym; boutique classes 2–3x more" },
      { label: "Movie ticket", price: `${fmtPrice(scale(12, rpp))}–${fmtPrice(scale(18, rpp))}` },
      { label: "Clothing (monthly average)", price: `${fmtPrice(scale(50, rpp))}–${fmtPrice(scale(120, rpp))}`, note: "Basic wardrobe maintenance" },
      { label: "Dry cleaning (shirt)", price: `${fmtPrice(scale(3, rpp))}–${fmtPrice(scale(7, rpp))}` },
      { label: "Toiletries / personal care", price: `${fmtPrice(scale(25, rpp))}–${fmtPrice(scale(50, rpp))}/mo` },
      { label: "Books / subscriptions", price: `${fmtPrice(scale(15, rpp))}–${fmtPrice(scale(30, rpp))}/mo` },
    ],
  };
}

function buildDiscretionaryDetail(city: CityData, monthlyDisc: number): CategoryDetail {
  const rpp = city.rpp;
  const description = monthlyDisc > 0
    ? `You have ${fmtPrice(monthlyDisc)}/mo after essentials. Here's what that buys in this city:`
    : "No discretionary budget remaining after essential expenses.";

  return {
    description,
    items: [
      { label: "Weekend brunch for two", price: `${fmtPrice(scale(40, rpp))}–${fmtPrice(scale(70, rpp))}` },
      { label: "Concert / event ticket", price: `${fmtPrice(scale(40, rpp))}–${fmtPrice(scale(120, rpp))}` },
      { label: "Weekend road trip (gas + hotel)", price: `${fmtPrice(scale(150, rpp))}–${fmtPrice(scale(300, rpp))}` },
      { label: "Cocktail at a nice bar", price: `${fmtPrice(scale(12, rpp))}–${fmtPrice(scale(20, rpp))}` },
      { label: "Monthly dining out budget (casual)", price: `${fmtPrice(scale(100, rpp))}–${fmtPrice(scale(250, rpp))}`, note: "2–4 meals out" },
      { label: "Annual vacation fund (monthly set-aside)", price: `${fmtPrice(scale(200, rpp))}–${fmtPrice(scale(500, rpp))}`, note: "For a modest trip" },
    ],
  };
}

type CategoryKey = "rent" | "food" | "transport" | "healthcare" | "utilities" | "insurance" | "personal" | "discretionary";

function mergeBudgetOverrides(
  b: BudgetResult["budget"],
  o: Partial<Record<CategoryKey, number>>,
): BudgetResult["budget"] {
  const pick = (k: CategoryKey, base: number) => {
    const v = o[k];
    return typeof v === "number" && Number.isFinite(v) && v >= 0 ? v : base;
  };
  const rent = pick("rent", b.rent);
  const food = pick("food", b.food);
  const transportation = pick("transport", b.transportation);
  const healthcare = pick("healthcare", b.healthcare);
  const utilities = pick("utilities", b.utilities);
  const insurance = pick("insurance", b.insurance);
  const personal = pick("personal", b.personal);
  const discretionary = pick("discretionary", b.discretionary);
  const essentials =
    rent +
    food +
    transportation +
    healthcare +
    utilities +
    insurance +
    personal +
    discretionary;
  const savingsCapacity = Math.max(0, b.monthlyNet - essentials);
  return {
    ...b,
    rent,
    food,
    transportation,
    healthcare,
    utilities,
    insurance,
    personal,
    discretionary,
    savingsCapacity,
  };
}

function getCategoryDetail(
  key: CategoryKey,
  city: CityData,
  budget: BudgetResult["budget"],
  household: number,
): CategoryDetail {
  switch (key) {
    case "rent": return buildRentDetail(city, budget.rent, budget.rentBedrooms);
    case "food": return buildFoodDetail(city, budget.food, household);
    case "transport": return buildTransportDetail(city, budget.transportation);
    case "healthcare": return buildHealthcareDetail(city, budget.healthcare, household);
    case "utilities": return buildUtilitiesDetail(city, budget.utilities);
    case "insurance": return buildInsuranceDetail(city, budget.insurance, household);
    case "personal": return buildPersonalDetail(city, budget.personal);
    case "discretionary": return buildDiscretionaryDetail(city, budget.discretionary);
  }
}

/* ── Donut Chart (SVG) ────────────────────────────────────────── */

interface DonutSlice { label: string; value: number; color: string }

function DonutChart({ slices, center }: { slices: DonutSlice[]; center: string }) {
  const total = slices.reduce((s, x) => s + x.value, 0);
  if (total === 0) return null;
  const r = 80;
  const cx = 100;
  const cy = 100;
  let cumAngle = -90;

  const paths = slices.filter(s => s.value > 0).map((s) => {
    const angle = (s.value / total) * 360;
    const startAngle = cumAngle;
    const endAngle = cumAngle + angle;
    cumAngle = endAngle;

    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;
    const x1 = cx + r * Math.cos(startRad);
    const y1 = cy + r * Math.sin(startRad);
    const x2 = cx + r * Math.cos(endRad);
    const y2 = cy + r * Math.sin(endRad);
    const large = angle > 180 ? 1 : 0;

    return (
      <path
        key={s.label}
        d={`M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`}
        fill={s.color}
        stroke="var(--background)"
        strokeWidth="2"
      >
        <title>{`${s.label}: $${fmt(s.value)}/mo (${Math.round((s.value / total) * 100)}%)`}</title>
      </path>
    );
  });

  return (
    <svg viewBox="0 0 200 200" className="mx-auto h-52 w-52">
      {paths}
      <circle cx={cx} cy={cy} r="50" fill="var(--background)" />
      <text x={cx} y={cy - 6} textAnchor="middle" fill="var(--foreground)" fontSize="11" fontWeight="600">
        {center}
      </text>
      <text x={cx} y={cy + 12} textAnchor="middle" fill="var(--muted)" fontSize="9">
        /month
      </text>
    </svg>
  );
}

/* ── Main Page ────────────────────────────────────────────────── */

export default function LifestylePage() {
  const [cityQuery, setCityQuery] = useState("");
  const [selectedCity, setSelectedCity] = useState<CityData | null>(null);
  const [income, setIncome] = useState<number | "">("");
  const [household, setHousehold] = useState(1);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<BudgetResult | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<CategoryKey>>(new Set());
  const [budgetOverrides, setBudgetOverrides] = useState<Partial<Record<CategoryKey, number>>>({});
  const [scenarioName, setScenarioName] = useState("");
  const [scenarios, setScenarios] = useState<{ id: string; name: string; updated_at: string }[]>([]);
  const [scenarioMsg, setScenarioMsg] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { user, ready, configured } = useSupabaseUser();
  const draftHydrating = useRef(false);

  const saveDraft = useMemo(
    () =>
      debounce((payload: Record<string, unknown>) => {
        void fetch("/api/me/lifestyle/draft", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ payload }),
        }).catch(() => {});
      }, 750),
    [],
  );

  const loadScenarios = useCallback(async () => {
    if (!user || !configured) return;
    const res = await fetch("/api/me/lifestyle/scenarios");
    const data = (await res.json()) as { scenarios?: { id: string; name: string; updated_at: string }[] };
    if (res.ok && data.scenarios) setScenarios(data.scenarios);
  }, [user, configured]);

  useEffect(() => {
    if (!ready || !user || !configured) return;
    void loadScenarios();
  }, [ready, user, configured, loadScenarios]);

  useEffect(() => {
    if (!ready || !user || !configured) return;
    let cancelled = false;
    draftHydrating.current = true;
    void fetch("/api/me/lifestyle/draft")
      .then((r) => r.json())
      .then((d: { payload?: Record<string, unknown> }) => {
        if (cancelled) return;
        const p = d.payload ?? {};
        if (typeof p.cityQuery === "string") setCityQuery(p.cityQuery);
        if (typeof p.cityId === "string") {
          const c = CITIES.find((x) => x.id === p.cityId);
          if (c) {
            setSelectedCity(c);
            setCityQuery(
              c.country === "US" ? `${c.name}, ${c.state}` : `${c.name}, ${COUNTRY_NAMES[c.country] ?? c.country}`,
            );
          }
        }
        if (typeof p.income === "number" && Number.isFinite(p.income)) setIncome(p.income);
        if (p.income === "" || p.income === null) setIncome("");
        if (typeof p.household === "number") setHousehold(Math.min(6, Math.max(1, p.household)));
        if (Array.isArray(p.expandedRows)) {
          const next = new Set<CategoryKey>();
          for (const x of p.expandedRows) {
            if (typeof x === "string") next.add(x as CategoryKey);
          }
          setExpandedRows(next);
        }
        if (p.budgetOverrides && typeof p.budgetOverrides === "object" && p.budgetOverrides !== null) {
          const o: Partial<Record<CategoryKey, number>> = {};
          for (const k of Object.keys(p.budgetOverrides) as CategoryKey[]) {
            const v = (p.budgetOverrides as Record<string, unknown>)[k];
            if (typeof v === "number" && Number.isFinite(v)) o[k] = v;
          }
          setBudgetOverrides(o);
        }
        requestAnimationFrame(() => {
          draftHydrating.current = false;
        });
      })
      .catch(() => {
        draftHydrating.current = false;
      });
    return () => {
      cancelled = true;
    };
  }, [ready, user, configured]);

  useEffect(() => {
    if (!ready || !user || !configured) return;
    if (draftHydrating.current) return;
    saveDraft({
      cityQuery,
      cityId: selectedCity?.id ?? null,
      income,
      household,
      expandedRows: [...expandedRows],
      budgetOverrides,
    });
  }, [
    cityQuery,
    selectedCity,
    income,
    household,
    expandedRows,
    budgetOverrides,
    ready,
    user,
    configured,
    saveDraft,
  ]);

  const cityLabel = useCallback((c: CityData) => {
    if (c.country === "US") return `${c.name}, ${c.state}`;
    return `${c.name}, ${COUNTRY_NAMES[c.country] ?? c.country}`;
  }, []);

  const filteredCities = useMemo(() => {
    const q = cityQuery.toLowerCase().trim();
    if (!q) return CITIES.slice(0, 100);
    return CITIES.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.state.toLowerCase().includes(q) ||
        c.country.toLowerCase().includes(q) ||
        (COUNTRY_NAMES[c.country] ?? "").toLowerCase().includes(q) ||
        c.id.includes(q),
    );
  }, [cityQuery]);

  const selectCity = useCallback((c: CityData) => {
    setSelectedCity(c);
    setCityQuery(cityLabel(c));
    setShowDropdown(false);
  }, [cityLabel]);

  const calculate = useCallback(async () => {
    if (!selectedCity || !income) return;
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch(
        `/api/lifestyle?city=${selectedCity.id}&income=${income}&household=${household}`,
      );
      const data = await res.json();
      if (!res.ok) {
        setErr(data.error ?? "Request failed");
        setResult(null);
        return;
      }
      setResult(data as BudgetResult);
    } catch {
      setErr("Network error");
      setResult(null);
    } finally {
      setLoading(false);
    }
  }, [selectedCity, income, household]);

  const toggleRow = useCallback((key: CategoryKey) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const bRaw = result?.budget ?? null;
  const displayB = useMemo(() => {
    if (!bRaw) return null;
    return mergeBudgetOverrides(bRaw, budgetOverrides);
  }, [bRaw, budgetOverrides]);

  const details = useMemo(() => {
    if (!bRaw || !selectedCity) return null;
    return {
      rent: getCategoryDetail("rent", selectedCity, bRaw, household),
      food: getCategoryDetail("food", selectedCity, bRaw, household),
      transport: getCategoryDetail("transport", selectedCity, bRaw, household),
      healthcare: getCategoryDetail("healthcare", selectedCity, bRaw, household),
      utilities: getCategoryDetail("utilities", selectedCity, bRaw, household),
      insurance: getCategoryDetail("insurance", selectedCity, bRaw, household),
      personal: getCategoryDetail("personal", selectedCity, bRaw, household),
      discretionary: getCategoryDetail("discretionary", selectedCity, bRaw, household),
    };
  }, [bRaw, selectedCity, household]);

  const donutSlices: DonutSlice[] = displayB
    ? [
        { label: "Rent", value: displayB.rent, color: "#3b82f6" },
        { label: "Food", value: displayB.food, color: "#22c55e" },
        { label: "Transport", value: displayB.transportation, color: "#f97316" },
        { label: "Healthcare", value: displayB.healthcare, color: "#ef4444" },
        { label: "Utilities", value: displayB.utilities, color: "#8b5cf6" },
        { label: "Insurance", value: displayB.insurance, color: "#ec4899" },
        { label: "Personal", value: displayB.personal, color: "#14b8a6" },
        { label: "Discretionary", value: displayB.discretionary, color: "#6b7280" },
      ]
    : [];

  return (
    <main className="mx-auto min-h-screen min-w-0 max-w-5xl px-4 py-10 sm:px-6">
      {/* ── Header ──────────────────────────────────────── */}
      <header className="mb-10 border-b border-slate-200 dark:border-zinc-800 pb-8">
        <p className="font-mono text-xs uppercase tracking-widest text-slate-500 dark:text-zinc-500">
          Lifestyle Calculator
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
          What can you afford?
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-600 dark:text-zinc-400">
          Enter a city and income level to see a full budget breakdown — rent,
          taxes, food, transport, and how much is left over. Covers 80+ US
          cities and 100 global cities with region-adjusted cost estimates.
        </p>
      </header>

      {/* ── Search bar (travel-booking style) ─────────── */}
      <div className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-900/60 p-4 sm:p-6">
        <div className="grid gap-4 sm:grid-cols-[1fr_180px_100px_auto]">
          {/* City search */}
          <div className="relative">
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-zinc-500">
              City
            </label>
            <input
              ref={inputRef}
              type="text"
              value={cityQuery}
              onChange={(e) => {
                setCityQuery(e.target.value);
                setSelectedCity(null);
                setShowDropdown(true);
              }}
              onFocus={() => setShowDropdown(true)}
              onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
              placeholder={`Search ${CITIES.length.toLocaleString("en-US")} cities…`}
              className="w-full rounded-lg border border-slate-300 dark:border-zinc-700 bg-slate-100 dark:bg-slate-200 dark:bg-zinc-800/80 px-4 py-3 text-base text-slate-900 dark:text-white outline-none ring-blue-500/30 placeholder:text-slate-600 dark:text-zinc-600 focus:border-blue-500/50 focus:ring-2 sm:text-sm"
            />
            {showDropdown && filteredCities.length > 0 && (
              <ul className="absolute left-0 right-0 top-full z-50 mt-1 max-h-64 overflow-auto rounded-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-xl">
                {filteredCities.map((c) => (
                  <li key={c.id}>
                    <button
                      type="button"
                      onMouseDown={() => selectCity(c)}
                      className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-slate-800 dark:text-zinc-200 hover:bg-slate-200 dark:bg-zinc-800"
                    >
                      <span className="font-medium">{c.name}</span>
                      <span className="text-slate-500 dark:text-zinc-500">
                        {c.country === "US" ? c.state : COUNTRY_NAMES[c.country] ?? c.country}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Income dropdown */}
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-zinc-500">
              Annual Income
            </label>
            <select
              value={income}
              onChange={(e) => setIncome(e.target.value ? Number(e.target.value) : "")}
              className="w-full rounded-lg border border-slate-300 dark:border-zinc-700 bg-slate-100 dark:bg-slate-200 dark:bg-zinc-800/80 px-4 py-3 text-base text-slate-900 dark:text-white outline-none ring-blue-500/30 focus:border-blue-500/50 focus:ring-2 sm:text-sm"
            >
              <option value="">Select...</option>
              {INCOME_LEVELS.map((l) => (
                <option key={l.value} value={l.value}>
                  {l.label}
                </option>
              ))}
            </select>
          </div>

          {/* Household size */}
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-zinc-500">
              Household
            </label>
            <select
              value={household}
              onChange={(e) => setHousehold(Number(e.target.value))}
              className="w-full rounded-lg border border-slate-300 dark:border-zinc-700 bg-slate-100 dark:bg-slate-200 dark:bg-zinc-800/80 px-4 py-3 text-base text-slate-900 dark:text-white outline-none ring-blue-500/30 focus:border-blue-500/50 focus:ring-2 sm:text-sm"
            >
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <option key={n} value={n}>
                  {n} {n === 1 ? "person" : "people"}
                </option>
              ))}
            </select>
          </div>

          {/* Calculate button */}
          <div className="flex items-end">
            <button
              type="button"
              onClick={calculate}
              disabled={loading || !selectedCity || !income}
              className="touch-manipulation w-full rounded-lg bg-blue-600 px-6 py-3 text-base font-medium text-slate-900 dark:text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:text-sm"
            >
              {loading ? "Calculating..." : "Calculate"}
            </button>
          </div>
        </div>
      </div>

      {user && configured && (
        <div className="mt-6 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-slate-50/90 dark:bg-zinc-900/50 p-4">
          <p className="text-xs font-medium text-slate-700 dark:text-zinc-300">Account · Lifestyle</p>
          <p className="mt-1 text-xs text-slate-500 dark:text-zinc-500">
            Your inputs and overrides save automatically. Name a scenario to store a snapshot you can reload later.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <input
              type="text"
              value={scenarioName}
              onChange={(e) => setScenarioName(e.target.value)}
              placeholder="Scenario name"
              className="min-w-0 flex-1 rounded-lg border border-slate-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 px-3 py-2 text-sm text-slate-900 dark:text-white sm:max-w-xs"
            />
            <button
              type="button"
              onClick={async () => {
                const name = scenarioName.trim();
                if (!name) return;
                setScenarioMsg(null);
                const payload = {
                  cityQuery,
                  cityId: selectedCity?.id ?? null,
                  income,
                  household,
                  expandedRows: [...expandedRows],
                  budgetOverrides,
                };
                const res = await fetch("/api/me/lifestyle/scenarios", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ name, payload }),
                });
                const data = (await res.json()) as { error?: string };
                if (!res.ok) {
                  setScenarioMsg(data.error ?? "Could not save");
                  return;
                }
                setScenarioName("");
                setScenarioMsg("Scenario saved.");
                void loadScenarios();
              }}
              className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-medium text-white hover:bg-blue-500"
            >
              Save scenario
            </button>
          </div>
          {scenarioMsg && <p className="mt-2 text-xs text-slate-600 dark:text-zinc-400">{scenarioMsg}</p>}
          {scenarios.length > 0 && (
            <ul className="mt-3 space-y-1 text-xs">
              {scenarios.map((s) => (
                <li key={s.id} className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    className="text-left font-medium text-blue-600 dark:text-blue-400 hover:underline"
                    onClick={async () => {
                      const res = await fetch(`/api/me/lifestyle/scenarios/${s.id}`);
                      const data = (await res.json()) as {
                        scenario?: { payload?: Record<string, unknown> };
                      };
                      const p = data.scenario?.payload;
                      if (!p || typeof p !== "object") return;
                      if (typeof p.cityQuery === "string") setCityQuery(p.cityQuery);
                      if (typeof p.cityId === "string") {
                        const c = CITIES.find((x) => x.id === p.cityId);
                        if (c) {
                          setSelectedCity(c);
                          setCityQuery(
                            c.country === "US"
                              ? `${c.name}, ${c.state}`
                              : `${c.name}, ${COUNTRY_NAMES[c.country] ?? c.country}`,
                          );
                        }
                      }
                      if (typeof p.income === "number") setIncome(p.income);
                      if (p.income === "" || p.income === null) setIncome("");
                      if (typeof p.household === "number") setHousehold(Math.min(6, Math.max(1, p.household)));
                      if (Array.isArray(p.expandedRows)) {
                        const next = new Set<CategoryKey>();
                        for (const x of p.expandedRows) {
                          if (typeof x === "string") next.add(x as CategoryKey);
                        }
                        setExpandedRows(next);
                      }
                      if (p.budgetOverrides && typeof p.budgetOverrides === "object" && p.budgetOverrides !== null) {
                        const o: Partial<Record<CategoryKey, number>> = {};
                        for (const k of Object.keys(p.budgetOverrides) as CategoryKey[]) {
                          const v = (p.budgetOverrides as Record<string, unknown>)[k];
                          if (typeof v === "number" && Number.isFinite(v)) o[k] = v;
                        }
                        setBudgetOverrides(o);
                      }
                      setScenarioMsg(`Loaded “${s.name}”. Run Calculate to refresh API figures if needed.`);
                    }}
                  >
                    {s.name}
                  </button>
                  <button
                    type="button"
                    className="text-red-400 hover:underline"
                    onClick={async () => {
                      await fetch(`/api/me/lifestyle/scenarios/${s.id}`, { method: "DELETE" });
                      void loadScenarios();
                    }}
                  >
                    Delete
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* ── Error ─────────────────────────────────────── */}
      {err && (
        <div className="mt-6 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {err}
        </div>
      )}

      {/* ── Results ───────────────────────────────────── */}
      {result && displayB && bRaw && (
        <div className="mt-8 space-y-6">
          {/* Lifestyle tier hero */}
          <div className="flex flex-col items-center gap-4 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-slate-50/95 dark:bg-zinc-900/40 p-8 sm:flex-row sm:justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">
                {result.city.name},{" "}
                {result.city.country === "US"
                  ? result.city.state
                  : COUNTRY_NAMES[result.city.country] ?? result.city.country}
              </h2>
              <p className="mt-1 font-mono text-sm text-slate-600 dark:text-zinc-400">
                ${fmt(result.income)}/yr gross · {result.household}{" "}
                {result.household === 1 ? "person" : "people"}
              </p>
              <p className="mt-1 text-sm text-slate-500 dark:text-zinc-500">
                Effective tax rate: {bRaw.effectiveRate}% · Take-home: ${fmt(bRaw.netIncome)}/yr
              </p>
            </div>
            <div className="text-center">
              <span
                className="inline-block rounded-full px-5 py-2 text-sm font-bold uppercase tracking-wider"
                style={{
                  backgroundColor: displayB.tierColor + "20",
                  color: displayB.tierColor,
                  border: `1px solid ${displayB.tierColor}50`,
                }}
              >
                {tierLabels[displayB.lifestyleTier] ?? displayB.lifestyleTier}
              </span>
              <p className="mt-2 font-mono text-2xl font-semibold text-slate-900 dark:text-white">
                ${fmt(displayB.discretionary)}
              </p>
              <p className="text-xs text-slate-500 dark:text-zinc-500">discretionary/mo</p>
            </div>
          </div>

          {/* Donut + line items */}
          <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
            <div className="flex items-center justify-center rounded-xl border border-slate-200 dark:border-zinc-800 bg-[var(--card)] p-4">
              <DonutChart slices={donutSlices} center={`$${fmt(displayB.monthlyNet)}`} />
            </div>

            <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-[var(--card)] p-5">
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-600 dark:text-zinc-400">
                Monthly Budget Breakdown
              </h3>
              <p className="mb-4 text-xs text-slate-500 dark:text-zinc-500">Click any category for typical real-world prices in this city.</p>
              {Object.keys(budgetOverrides).length > 0 && (
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <span className="text-xs text-amber-600 dark:text-amber-400">Custom line amounts applied</span>
                  <button
                    type="button"
                    onClick={() => setBudgetOverrides({})}
                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    Reset overrides
                  </button>
                </div>
              )}
              <div className="mb-4 grid gap-2 sm:grid-cols-2">
                {(
                  [
                    ["rent", "Rent / mo"],
                    ["food", "Food / mo"],
                    ["transport", "Transport / mo"],
                    ["healthcare", "Healthcare / mo"],
                    ["utilities", "Utilities / mo"],
                    ["insurance", "Insurance / mo"],
                    ["personal", "Personal / mo"],
                    ["discretionary", "Discretionary / mo"],
                  ] as const
                ).map(([key, label]) => (
                  <label key={key} className="block text-xs text-slate-500 dark:text-zinc-500">
                    {label} (optional)
                    <input
                      type="number"
                      min={0}
                      step={1}
                      placeholder="API value"
                      value={budgetOverrides[key] !== undefined ? budgetOverrides[key] : ""}
                      onChange={(e) => {
                        const v = e.target.value;
                        setBudgetOverrides((prev) => {
                          const next = { ...prev };
                          if (v === "") delete next[key];
                          else {
                            const n = Number(v);
                            if (Number.isFinite(n) && n >= 0) next[key] = n;
                          }
                          return next;
                        });
                      }}
                      className="mt-0.5 w-full rounded border border-slate-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 px-2 py-1 font-mono text-sm text-slate-900 dark:text-white"
                    />
                  </label>
                ))}
              </div>
              <div className="space-y-1">
                <BudgetRow label={`Rent (${displayB.rentBedrooms})`} amount={displayB.rent} color="#3b82f6" total={displayB.monthlyNet} detail={details?.rent} expanded={expandedRows.has("rent")} onToggle={() => toggleRow("rent")} />
                <BudgetRow label="Food & Groceries" amount={displayB.food} color="#22c55e" total={displayB.monthlyNet} detail={details?.food} expanded={expandedRows.has("food")} onToggle={() => toggleRow("food")} />
                <BudgetRow label="Transportation" amount={displayB.transportation} color="#f97316" total={displayB.monthlyNet} detail={details?.transport} expanded={expandedRows.has("transport")} onToggle={() => toggleRow("transport")} />
                <BudgetRow label="Healthcare" amount={displayB.healthcare} color="#ef4444" total={displayB.monthlyNet} detail={details?.healthcare} expanded={expandedRows.has("healthcare")} onToggle={() => toggleRow("healthcare")} />
                <BudgetRow label="Utilities" amount={displayB.utilities} color="#8b5cf6" total={displayB.monthlyNet} detail={details?.utilities} expanded={expandedRows.has("utilities")} onToggle={() => toggleRow("utilities")} />
                <BudgetRow label="Insurance" amount={displayB.insurance} color="#ec4899" total={displayB.monthlyNet} detail={details?.insurance} expanded={expandedRows.has("insurance")} onToggle={() => toggleRow("insurance")} />
                <BudgetRow label="Personal & Misc" amount={displayB.personal} color="#14b8a6" total={displayB.monthlyNet} detail={details?.personal} expanded={expandedRows.has("personal")} onToggle={() => toggleRow("personal")} />
                <div className="my-3 border-t border-slate-200 dark:border-zinc-800" />
                <BudgetRow label="Discretionary" amount={displayB.discretionary} color="#6b7280" total={displayB.monthlyNet} bold detail={details?.discretionary} expanded={expandedRows.has("discretionary")} onToggle={() => toggleRow("discretionary")} />
                <BudgetRow label="Savings capacity" amount={displayB.savingsCapacity} color="#3b82f6" total={displayB.monthlyNet} muted />
              </div>
            </div>
          </div>

          {/* Tax breakdown */}
          <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-[var(--card)] p-5">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-600 dark:text-zinc-400">
              Annual Tax Breakdown
            </h3>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              <TaxCard label="Federal" amount={bRaw.federalTax} />
              <TaxCard label="State" amount={bRaw.stateTax} />
              <TaxCard label="Local" amount={bRaw.localTax} />
              <TaxCard label="FICA" amount={bRaw.fica} />
              <TaxCard label="Total Tax" amount={bRaw.totalTax} highlight />
            </div>
          </div>

          {/* City comparisons */}
          {result.comparisons.length > 0 && (
            <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-[var(--card)] p-5">
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-600 dark:text-zinc-400">
                Same income in other cities
              </h3>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                {result.comparisons.map((c) => (
                  <div
                    key={c.id}
                    className="rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-4"
                  >
                    <p className="text-sm font-medium text-slate-900 dark:text-white">{c.name}</p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-zinc-500">
                      {c.country === "US" ? c.state : COUNTRY_NAMES[c.country] ?? c.country}
                    </p>
                    <p className="mt-3 font-mono text-lg font-semibold text-slate-900 dark:text-white">
                      ${fmt(c.discretionary)}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-zinc-500">discretionary/mo</p>
                    <span
                      className="mt-2 inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase"
                      style={{
                        backgroundColor: c.tierColor + "20",
                        color: c.tierColor,
                      }}
                    >
                      {tierLabels[c.lifestyleTier] ?? c.lifestyleTier}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <footer className="mt-16 border-t border-slate-200 dark:border-zinc-800 pt-8 text-xs text-slate-600 dark:text-zinc-600">
        <p>
          Estimates only — not financial advice. U.S. rents use HUD FY2026 Fair
          Market Rents for metropolitan areas (regional benchmarks, not one
          neighborhood). Additional cities marked in Numbeo rankings use cost-of-living
          index–scaled rents (see each city&apos;s rent note). International rents are
          approximate USD equivalents. Tax brackets from Tax Foundation 2026 (US);
          international taxes use a simplified ~30% effective rate. Actual costs vary.
        </p>
      </footer>
    </main>
  );
}

/* ── Sub-components ───────────────────────────────────────────── */

function BudgetRow({
  label,
  amount,
  color,
  total,
  bold,
  muted,
  detail,
  expanded,
  onToggle,
}: {
  label: string;
  amount: number;
  color: string;
  total: number;
  bold?: boolean;
  muted?: boolean;
  detail?: CategoryDetail;
  expanded?: boolean;
  onToggle?: () => void;
}) {
  const pct = total > 0 ? (amount / total) * 100 : 0;
  const clickable = !!detail && !!onToggle;
  return (
    <div>
      <button
        type="button"
        onClick={clickable ? onToggle : undefined}
        className={`flex w-full items-center gap-3 rounded-lg px-1 py-1 text-left transition ${clickable ? "cursor-pointer hover:bg-slate-200/80 dark:bg-slate-200 dark:bg-zinc-800/50" : "cursor-default"}`}
      >
        <span
          className="h-2.5 w-2.5 shrink-0 rounded-full"
          style={{ backgroundColor: color }}
        />
        <span
          className={`flex-1 text-sm ${muted ? "text-slate-500 dark:text-zinc-500" : bold ? "font-semibold text-slate-900 dark:text-white" : "text-slate-700 dark:text-zinc-300"}`}
        >
          {label}
          {clickable && (
            <span className="ml-1.5 text-[10px] text-slate-600 dark:text-zinc-600">{expanded ? "▾" : "▸"}</span>
          )}
        </span>
        <span className="font-mono text-sm tabular-nums text-slate-600 dark:text-zinc-400">
          {Math.round(pct)}%
        </span>
        <span
          className={`w-24 text-right font-mono text-sm tabular-nums ${bold ? "font-semibold text-slate-900 dark:text-white" : "text-slate-700 dark:text-zinc-300"}`}
        >
          ${fmt(amount)}
        </span>
      </button>

      {expanded && detail && (
        <div className="mb-2 ml-5 mt-1 rounded-xl border border-slate-200 dark:border-zinc-800/60 bg-white/95 dark:bg-zinc-900/60 px-4 py-3">
          <p className="text-xs leading-relaxed text-slate-600 dark:text-zinc-400">{detail.description}</p>
          <div className="mt-3 space-y-1.5">
            {detail.items.map((item, i) => (
              <div key={i} className="flex flex-wrap items-baseline gap-x-2 text-xs">
                <span className="text-slate-700 dark:text-zinc-300">{item.label}</span>
                {item.price && (
                  <span className="font-mono font-medium text-slate-900 dark:text-white">{item.price}</span>
                )}
                {item.note && (
                  <span className="text-slate-500 dark:text-zinc-500">— {item.note}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function TaxCard({
  label,
  amount,
  highlight,
}: {
  label: string;
  amount: number;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-lg border p-4 ${
        highlight
          ? "border-blue-500/30 bg-blue-500/10"
          : "border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50"
      }`}
    >
      <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-zinc-500">
        {label}
      </p>
      <p
        className={`mt-1 font-mono text-lg font-semibold tabular-nums ${
          highlight ? "text-blue-300" : "text-slate-900 dark:text-white"
        }`}
      >
        ${fmt(amount)}
      </p>
    </div>
  );
}
