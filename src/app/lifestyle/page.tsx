"use client";

import { useCallback, useMemo, useRef, useState } from "react";
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

function buildRentDetail(city: CityData, rent: number, bedrooms: string): CategoryDetail {
  const nh = CITY_NEIGHBORHOODS[city.id];
  const rpp = city.rpp;
  let description: string;

  if (rpp >= 120) {
    description = `At ${fmtPrice(rent)}/mo for a ${bedrooms.toLowerCase()}, expect a compact unit in an older building or walk-up. Newer builds and doorman buildings cost 20–40% more.`;
  } else if (rpp >= 105) {
    description = `At ${fmtPrice(rent)}/mo for a ${bedrooms.toLowerCase()}, you'll find a standard apartment with in-unit laundry in many areas. Central neighborhoods run higher.`;
  } else if (rpp >= 95) {
    description = `At ${fmtPrice(rent)}/mo for a ${bedrooms.toLowerCase()}, you can get a well-sized apartment in good neighborhoods, often with parking included.`;
  } else {
    description = `At ${fmtPrice(rent)}/mo for a ${bedrooms.toLowerCase()}, housing is affordable — spacious apartments or small houses available in central areas.`;
  }

  const items: DetailItem[] = [];

  if (nh) {
    items.push({ label: "Budget-friendly areas", price: "", note: nh.affordable });
    items.push({ label: "Mid-range neighborhoods", price: "", note: nh.mid });
    items.push({ label: "Premium neighborhoods", price: "", note: nh.pricey });
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
  const inputRef = useRef<HTMLInputElement>(null);

  const cityLabel = useCallback((c: CityData) => {
    if (c.country === "US") return `${c.name}, ${c.state}`;
    return `${c.name}, ${COUNTRY_NAMES[c.country] ?? c.country}`;
  }, []);

  const filteredCities = useMemo(() => {
    const q = cityQuery.toLowerCase().trim();
    if (!q) return CITIES.slice(0, 50);
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

  const b = result?.budget;

  const details = useMemo(() => {
    if (!b || !selectedCity) return null;
    return {
      rent: getCategoryDetail("rent", selectedCity, b, household),
      food: getCategoryDetail("food", selectedCity, b, household),
      transport: getCategoryDetail("transport", selectedCity, b, household),
      healthcare: getCategoryDetail("healthcare", selectedCity, b, household),
      utilities: getCategoryDetail("utilities", selectedCity, b, household),
      insurance: getCategoryDetail("insurance", selectedCity, b, household),
      personal: getCategoryDetail("personal", selectedCity, b, household),
      discretionary: getCategoryDetail("discretionary", selectedCity, b, household),
    };
  }, [b, selectedCity, household]);

  const donutSlices: DonutSlice[] = b
    ? [
        { label: "Rent", value: b.rent, color: "#3b82f6" },
        { label: "Food", value: b.food, color: "#22c55e" },
        { label: "Transport", value: b.transportation, color: "#f97316" },
        { label: "Healthcare", value: b.healthcare, color: "#ef4444" },
        { label: "Utilities", value: b.utilities, color: "#8b5cf6" },
        { label: "Insurance", value: b.insurance, color: "#ec4899" },
        { label: "Personal", value: b.personal, color: "#14b8a6" },
        { label: "Discretionary", value: b.discretionary, color: "#6b7280" },
      ]
    : [];

  return (
    <main className="mx-auto min-h-screen max-w-5xl px-4 py-10 sm:px-6">
      {/* ── Header ──────────────────────────────────────── */}
      <header className="mb-10 border-b border-zinc-800 pb-8">
        <p className="font-mono text-xs uppercase tracking-widest text-zinc-500">
          Lifestyle Calculator
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
          What can you afford?
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-zinc-400">
          Enter a city and income level to see a full budget breakdown — rent,
          taxes, food, transport, and how much is left over. Covers 80+ US
          cities and 100 global cities with region-adjusted cost estimates.
        </p>
      </header>

      {/* ── Search bar (travel-booking style) ─────────── */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 sm:p-6">
        <div className="grid gap-4 sm:grid-cols-[1fr_180px_100px_auto]">
          {/* City search */}
          <div className="relative">
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-zinc-500">
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
              placeholder="Search a city..."
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800/80 px-4 py-3 text-sm text-white outline-none ring-blue-500/30 placeholder:text-zinc-600 focus:border-blue-500/50 focus:ring-2"
            />
            {showDropdown && filteredCities.length > 0 && (
              <ul className="absolute left-0 right-0 top-full z-50 mt-1 max-h-64 overflow-auto rounded-lg border border-zinc-700 bg-zinc-900 shadow-xl">
                {filteredCities.map((c) => (
                  <li key={c.id}>
                    <button
                      type="button"
                      onMouseDown={() => selectCity(c)}
                      className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-zinc-200 hover:bg-zinc-800"
                    >
                      <span className="font-medium">{c.name}</span>
                      <span className="text-zinc-500">
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
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-zinc-500">
              Annual Income
            </label>
            <select
              value={income}
              onChange={(e) => setIncome(e.target.value ? Number(e.target.value) : "")}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800/80 px-4 py-3 text-sm text-white outline-none ring-blue-500/30 focus:border-blue-500/50 focus:ring-2"
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
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-zinc-500">
              Household
            </label>
            <select
              value={household}
              onChange={(e) => setHousehold(Number(e.target.value))}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800/80 px-4 py-3 text-sm text-white outline-none ring-blue-500/30 focus:border-blue-500/50 focus:ring-2"
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
              className="w-full rounded-lg bg-blue-600 px-6 py-3 text-sm font-medium text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
            >
              {loading ? "Calculating..." : "Calculate"}
            </button>
          </div>
        </div>
      </div>

      {/* ── Error ─────────────────────────────────────── */}
      {err && (
        <div className="mt-6 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {err}
        </div>
      )}

      {/* ── Results ───────────────────────────────────── */}
      {result && b && (
        <div className="mt-8 space-y-6">
          {/* Lifestyle tier hero */}
          <div className="flex flex-col items-center gap-4 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-8 sm:flex-row sm:justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-white">
                {result.city.name},{" "}
                {result.city.country === "US"
                  ? result.city.state
                  : COUNTRY_NAMES[result.city.country] ?? result.city.country}
              </h2>
              <p className="mt-1 font-mono text-sm text-zinc-400">
                ${fmt(result.income)}/yr gross · {result.household}{" "}
                {result.household === 1 ? "person" : "people"}
              </p>
              <p className="mt-1 text-sm text-zinc-500">
                Effective tax rate: {b.effectiveRate}% · Take-home: ${fmt(b.netIncome)}/yr
              </p>
            </div>
            <div className="text-center">
              <span
                className="inline-block rounded-full px-5 py-2 text-sm font-bold uppercase tracking-wider"
                style={{
                  backgroundColor: b.tierColor + "20",
                  color: b.tierColor,
                  border: `1px solid ${b.tierColor}50`,
                }}
              >
                {tierLabels[b.lifestyleTier] ?? b.lifestyleTier}
              </span>
              <p className="mt-2 font-mono text-2xl font-semibold text-white">
                ${fmt(b.discretionary)}
              </p>
              <p className="text-xs text-zinc-500">discretionary/mo</p>
            </div>
          </div>

          {/* Donut + line items */}
          <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
            <div className="flex items-center justify-center rounded-xl border border-zinc-800 bg-[var(--card)] p-4">
              <DonutChart slices={donutSlices} center={`$${fmt(b.monthlyNet)}`} />
            </div>

            <div className="rounded-xl border border-zinc-800 bg-[var(--card)] p-5">
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-zinc-400">
                Monthly Budget Breakdown
              </h3>
              <p className="mb-4 text-xs text-zinc-500">Click any category for typical real-world prices in this city.</p>
              <div className="space-y-1">
                <BudgetRow label={`Rent (${b.rentBedrooms})`} amount={b.rent} color="#3b82f6" total={b.monthlyNet} detail={details?.rent} expanded={expandedRows.has("rent")} onToggle={() => toggleRow("rent")} />
                <BudgetRow label="Food & Groceries" amount={b.food} color="#22c55e" total={b.monthlyNet} detail={details?.food} expanded={expandedRows.has("food")} onToggle={() => toggleRow("food")} />
                <BudgetRow label="Transportation" amount={b.transportation} color="#f97316" total={b.monthlyNet} detail={details?.transport} expanded={expandedRows.has("transport")} onToggle={() => toggleRow("transport")} />
                <BudgetRow label="Healthcare" amount={b.healthcare} color="#ef4444" total={b.monthlyNet} detail={details?.healthcare} expanded={expandedRows.has("healthcare")} onToggle={() => toggleRow("healthcare")} />
                <BudgetRow label="Utilities" amount={b.utilities} color="#8b5cf6" total={b.monthlyNet} detail={details?.utilities} expanded={expandedRows.has("utilities")} onToggle={() => toggleRow("utilities")} />
                <BudgetRow label="Insurance" amount={b.insurance} color="#ec4899" total={b.monthlyNet} detail={details?.insurance} expanded={expandedRows.has("insurance")} onToggle={() => toggleRow("insurance")} />
                <BudgetRow label="Personal & Misc" amount={b.personal} color="#14b8a6" total={b.monthlyNet} detail={details?.personal} expanded={expandedRows.has("personal")} onToggle={() => toggleRow("personal")} />
                <div className="my-3 border-t border-zinc-800" />
                <BudgetRow label="Discretionary" amount={b.discretionary} color="#6b7280" total={b.monthlyNet} bold detail={details?.discretionary} expanded={expandedRows.has("discretionary")} onToggle={() => toggleRow("discretionary")} />
                <BudgetRow label="Savings capacity" amount={b.savingsCapacity} color="#3b82f6" total={b.monthlyNet} muted />
              </div>
            </div>
          </div>

          {/* Tax breakdown */}
          <div className="rounded-xl border border-zinc-800 bg-[var(--card)] p-5">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-400">
              Annual Tax Breakdown
            </h3>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              <TaxCard label="Federal" amount={b.federalTax} />
              <TaxCard label="State" amount={b.stateTax} />
              <TaxCard label="Local" amount={b.localTax} />
              <TaxCard label="FICA" amount={b.fica} />
              <TaxCard label="Total Tax" amount={b.totalTax} highlight />
            </div>
          </div>

          {/* City comparisons */}
          {result.comparisons.length > 0 && (
            <div className="rounded-xl border border-zinc-800 bg-[var(--card)] p-5">
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-400">
                Same income in other cities
              </h3>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                {result.comparisons.map((c) => (
                  <div
                    key={c.id}
                    className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4"
                  >
                    <p className="text-sm font-medium text-white">{c.name}</p>
                    <p className="mt-1 text-xs text-zinc-500">
                      {c.country === "US" ? c.state : COUNTRY_NAMES[c.country] ?? c.country}
                    </p>
                    <p className="mt-3 font-mono text-lg font-semibold text-white">
                      ${fmt(c.discretionary)}
                    </p>
                    <p className="text-xs text-zinc-500">discretionary/mo</p>
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

      <footer className="mt-16 border-t border-zinc-800 pt-8 text-xs text-zinc-600">
        <p>
          Estimates only — not financial advice. US rents based on HUD FY2026
          Fair Market Rents. International rents are approximate USD
          equivalents. Tax brackets from Tax Foundation 2026 (US); international
          taxes use a simplified ~30% effective rate. Actual costs vary.
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
        className={`flex w-full items-center gap-3 rounded-lg px-1 py-1 text-left transition ${clickable ? "cursor-pointer hover:bg-zinc-800/50" : "cursor-default"}`}
      >
        <span
          className="h-2.5 w-2.5 shrink-0 rounded-full"
          style={{ backgroundColor: color }}
        />
        <span
          className={`flex-1 text-sm ${muted ? "text-zinc-500" : bold ? "font-semibold text-white" : "text-zinc-300"}`}
        >
          {label}
          {clickable && (
            <span className="ml-1.5 text-[10px] text-zinc-600">{expanded ? "▾" : "▸"}</span>
          )}
        </span>
        <span className="font-mono text-sm tabular-nums text-zinc-400">
          {Math.round(pct)}%
        </span>
        <span
          className={`w-24 text-right font-mono text-sm tabular-nums ${bold ? "font-semibold text-white" : "text-zinc-300"}`}
        >
          ${fmt(amount)}
        </span>
      </button>

      {expanded && detail && (
        <div className="mb-2 ml-5 mt-1 rounded-xl border border-zinc-800/60 bg-zinc-900/60 px-4 py-3">
          <p className="text-xs leading-relaxed text-zinc-400">{detail.description}</p>
          <div className="mt-3 space-y-1.5">
            {detail.items.map((item, i) => (
              <div key={i} className="flex flex-wrap items-baseline gap-x-2 text-xs">
                <span className="text-zinc-300">{item.label}</span>
                {item.price && (
                  <span className="font-mono font-medium text-white">{item.price}</span>
                )}
                {item.note && (
                  <span className="text-zinc-500">— {item.note}</span>
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
          : "border-zinc-800 bg-zinc-900/50"
      }`}
    >
      <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
        {label}
      </p>
      <p
        className={`mt-1 font-mono text-lg font-semibold tabular-nums ${
          highlight ? "text-blue-300" : "text-white"
        }`}
      >
        ${fmt(amount)}
      </p>
    </div>
  );
}
