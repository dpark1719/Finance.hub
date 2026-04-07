/**
 * Deep links to live **search results** on dealer marketplaces and peer sites.
 * Single marketplace per row (deterministic pick) + filters (year, fuel, body, price band).
 */

import type { CarType, FuelType } from "./car-data";

export type MarketplaceId = "autotrader" | "carscom" | "cargurus";

export type MarketplaceLink = {
  id: MarketplaceId;
  label: string;
  href: string;
};

export type MarketplaceSearchOpts = {
  make: string;
  model: string;
  year: number;
  zip: string;
  /** Tier / budget ceiling (upper bound for price filter) */
  maxPrice: number;
  /** Finder “max mileage” cap when this row has no odometer */
  finderMaxMileageCap: number;
  /** Estimated odometer for this used row — drives mileage min/max on the marketplace */
  listingMileage: number | null;
  rowIsUsed: boolean;
  fuel: FuelType;
  /** First type on the model — used for body-style filters */
  primaryBodyType: CarType;
  /** Listing / estimated price for this row — tight min/max price search */
  estimatedListPrice: number;
};

function hashToUint(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Stable per vehicle+year: which dealer site gets the deep link for this row. */
export function pickMarketplaceForListing(carId: string, year: number): MarketplaceId {
  const order: MarketplaceId[] = ["autotrader", "carscom", "cargurus"];
  return order[hashToUint(`${carId}:${year}`) % 3];
}

/** Stable per vehicle+year: one peer marketplace link per row. */
export function pickPeerMarketplace(carId: string, year: number): "craigslist" | "facebook" {
  return hashToUint(`peer:${carId}:${year}`) % 2 === 0 ? "craigslist" : "facebook";
}

export function slugPart(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function carsComModelParam(make: string, model: string): string {
  return `${slugPart(make)}-${slugPart(model)}`;
}

/** Cars.com body_style_slugs[] value */
function carsComBodySlug(t: CarType): string {
  const m: Record<CarType, string> = {
    sedan: "sedan",
    suv: "suv",
    truck: "truck",
    hatchback: "hatchback",
    luxury: "sedan",
    sports: "coupe",
    minivan: "minivan",
    ev: "suv",
  };
  return m[t] ?? "sedan";
}

/** Cars.com fuel_type[] style slug (best-effort). */
function carsComFuelSlug(f: FuelType): string | undefined {
  if (f === "hybrid") return "hybrid";
  if (f === "electric") return "electric";
  return undefined;
}

/** Autotrader fuelTypeGroup query value */
function autotraderFuelGroup(f: FuelType): string | undefined {
  if (f === "electric") return "ELE";
  if (f === "hybrid") return "HYB";
  return undefined;
}

/** Autotrader bodyStyleGroup (best-effort; unknown values may be ignored by the site). */
function autotraderBodyGroup(t: CarType): string | undefined {
  const m: Partial<Record<CarType, string>> = {
    sedan: "SEDAN",
    suv: "SUV",
    truck: "TRUCKS",
    hatchback: "HATCHBACK",
    sports: "COUPE",
    minivan: "MINIVAN",
    luxury: "SEDAN",
    ev: "SUV",
  };
  return m[t];
}

function zip5(zip: string): string {
  const digits = (zip || "").replace(/\D/g, "").slice(0, 5);
  return digits.length === 5 ? digits : "90210";
}

/**
 * Tight price band around this listing’s price (e.g. $7,591 → ~$7.0k–$8.2k search),
 * still capped by tier max.
 */
export function listingPriceSearchBand(
  listPrice: number,
  tierMax: number,
): { min: number; max: number } {
  const est = Math.max(500, listPrice);
  const cap = Math.max(5000, Math.round(tierMax / 500) * 500);
  const spread = Math.max(350, Math.round(est * 0.08));
  const min = Math.max(500, est - spread);
  let max = Math.min(cap, est + spread);
  if (max <= min) max = min + 400;
  return { min, max };
}

/** Odometer range encoded in marketplace URLs (or finder cap only). */
export type MileageSearchBand =
  | { tag: "range"; minMileage: number; maxMileage: number }
  | { tag: "cap"; maxMileage: number };

/**
 * Mileage search window around this row’s odometer (e.g. 72,000 → ~64.8k–79.2k mi).
 * Falls back to finder cap only when no mileage (e.g. new cars).
 */
export function mileageSearchWindow(
  listingMileage: number | null | undefined,
  finderCap: number,
): MileageSearchBand {
  const cap = Math.max(1000, finderCap);
  if (listingMileage != null && listingMileage > 0) {
    const minMileage = Math.max(0, Math.floor(listingMileage * 0.9));
    let maxMileage = Math.ceil(listingMileage * 1.1);
    maxMileage = Math.max(maxMileage, minMileage + 2000);
    maxMileage = Math.min(maxMileage, Math.max(listingMileage + 25000, cap));
    return { tag: "range", minMileage, maxMileage };
  }
  return { tag: "cap", maxMileage: cap };
}

export function buildSingleMarketplaceSearchLink(
  marketplace: MarketplaceId,
  opts: MarketplaceSearchOpts,
): MarketplaceLink {
  const zip = zip5(opts.zip);
  const makeS = slugPart(opts.make);
  const modelS = slugPart(opts.model);
  const carsModel = carsComModelParam(opts.make, opts.model);
  const year = opts.year;
  const used = opts.rowIsUsed;
  const { min: minP, max: maxPrice } = listingPriceSearchBand(
    opts.estimatedListPrice,
    opts.maxPrice,
  );
  const mileWin = used
    ? mileageSearchWindow(opts.listingMileage, opts.finderMaxMileageCap)
    : null;

  const labels: Record<MarketplaceId, string> = {
    autotrader: "Autotrader",
    carscom: "Cars.com",
    cargurus: "CarGurus",
  };

  if (marketplace === "autotrader") {
    const atParams = new URLSearchParams();
    atParams.set("searchRadius", "50");
    atParams.set("zip", zip);
    atParams.set("startYear", String(year));
    atParams.set("endYear", String(year));
    atParams.set("minPrice", String(minP));
    atParams.set("maxPrice", String(maxPrice));
    if (used && mileWin) {
      if (mileWin.tag === "range") {
        atParams.set("minMileage", String(mileWin.minMileage));
      }
      atParams.set("maxMileage", String(mileWin.maxMileage));
    }
    const fg = autotraderFuelGroup(opts.fuel);
    if (fg) atParams.set("fuelTypeGroup", fg);
    const bg = autotraderBodyGroup(opts.primaryBodyType);
    if (bg) atParams.set("bodyStyleGroup", bg);
    const atSeg = used ? "used-cars" : "new-cars";
    return {
      id: "autotrader",
      label: labels.autotrader,
      href: `https://www.autotrader.com/cars-for-sale/${atSeg}/${makeS}/${modelS}?${atParams.toString()}`,
    };
  }

  if (marketplace === "carscom") {
    const cc = new URLSearchParams();
    cc.set("stock_type", used ? "used" : "new");
    cc.append("makes[]", makeS);
    cc.append("models[]", carsModel);
    cc.append("body_style_slugs[]", carsComBodySlug(opts.primaryBodyType));
    const fs = carsComFuelSlug(opts.fuel);
    if (fs) cc.append("fuel_slugs[]", fs);
    cc.set("year_min", String(year));
    cc.set("year_max", String(year));
    cc.set("zip", zip);
    cc.set("maximum_distance", "50");
    cc.set("price_min", String(minP));
    cc.set("price_max", String(maxPrice));
    if (used && mileWin) {
      if (mileWin.tag === "range") {
        cc.set("mileage_min", String(mileWin.minMileage));
      }
      cc.set("mileage_max", String(mileWin.maxMileage));
    }
    return {
      id: "carscom",
      label: labels.carscom,
      href: `https://www.cars.com/shopping/results/?${cc.toString()}`,
    };
  }

  const cgModel =
    opts.fuel === "hybrid" && !opts.model.toLowerCase().includes("hybrid")
      ? `${opts.model} Hybrid`
      : opts.fuel === "electric" && !opts.model.toLowerCase().includes("electric") && !opts.model.toLowerCase().includes("ev")
        ? `${opts.model} Electric`
        : opts.model;

  const cg = new URLSearchParams();
  cg.set("searchZip", zip);
  cg.set("distance", "500");
  cg.set("searchType", used ? "USED" : "NEW");
  cg.set("minYear", String(year));
  cg.set("maxYear", String(year));
  cg.set("makeNames", opts.make);
  cg.set("modelNames", cgModel);
  cg.set("priceMin", String(minP));
  cg.set("priceMax", String(maxPrice));
  if (used && mileWin) {
    if (mileWin.tag === "range") {
      cg.set("mileageMin", String(mileWin.minMileage));
    }
    cg.set("mileageMax", String(mileWin.maxMileage));
  }

  return {
    id: "cargurus",
    label: labels.cargurus,
    href: `https://www.cargurus.com/Cars/inventorylisting/viewDetailsFilterViewInventoryListing.action?${cg.toString()}`,
  };
}

// --- Peer marketplaces (Craigslist / Facebook) — opt-in; used listings only ---

export type PeerMarketplaceLink = {
  id: "craigslist" | "facebook";
  label: string;
  href: string;
};

/** Lower bound for Craigslist min_price to hide common $1 / $999 bait; scales with budget. */
export function peerBaitFilterMinPrice(maxPrice: number): number {
  const cap = Math.max(3000, Math.round(maxPrice / 500) * 500);
  let min = Math.max(1500, Math.floor(cap * 0.15));
  min = Math.min(min, cap - 500);
  if (min < 1500) min = 1500;
  if (min >= cap) min = Math.max(1000, Math.floor(cap * 0.25));
  return min;
}

/** Guess Craigslist `{subdomain}.craigslist.org` from US ZIP (fallback: losangeles). */
export function defaultCraigslistSubdomainFromZip(zip: string): string {
  const z = (zip || "").replace(/\D/g, "").slice(0, 5);
  if (z.length !== 5) return "losangeles";
  const p = z.slice(0, 3);
  const map: Record<string, string> = {
    "900": "losangeles",
    "901": "losangeles",
    "902": "losangeles",
    "903": "losangeles",
    "904": "losangeles",
    "905": "losangeles",
    "906": "losangeles",
    "907": "losangeles",
    "908": "losangeles",
    "910": "losangeles",
    "911": "losangeles",
    "912": "losangeles",
    "913": "losangeles",
    "914": "losangeles",
    "915": "losangeles",
    "916": "losangeles",
    "917": "losangeles",
    "918": "losangeles",
    "919": "losangeles",
    "920": "sandiego",
    "921": "sandiego",
    "941": "sfbay",
    "942": "sfbay",
    "943": "sfbay",
    "944": "sfbay",
    "945": "sfbay",
    "946": "sfbay",
    "947": "sfbay",
    "948": "sfbay",
    "949": "sfbay",
    "100": "newyork",
    "101": "newyork",
    "102": "newyork",
    "103": "newyork",
    "104": "newyork",
    "105": "newyork",
    "106": "newyork",
    "107": "newyork",
    "108": "newyork",
    "109": "newyork",
    "110": "newyork",
    "111": "newyork",
    "112": "newyork",
    "113": "newyork",
    "114": "newyork",
    "606": "chicago",
    "607": "chicago",
    "608": "chicago",
    "752": "dallas",
    "753": "dallas",
    "770": "houston",
    "771": "houston",
    "772": "houston",
    "980": "seattle",
    "981": "seattle",
    "982": "seattle",
    "021": "boston",
    "022": "boston",
    "023": "boston",
    "024": "boston",
    "850": "phoenix",
    "851": "phoenix",
    "852": "phoenix",
    "853": "phoenix",
    "331": "miami",
    "332": "miami",
    "333": "miami",
  };
  return map[p] ?? "losangeles";
}

export const CRAIGSLIST_SITE_OPTIONS: { value: string; label: string }[] = [
  { value: "losangeles", label: "Los Angeles" },
  { value: "sandiego", label: "San Diego" },
  { value: "sfbay", label: "SF Bay Area" },
  { value: "newyork", label: "New York" },
  { value: "chicago", label: "Chicago" },
  { value: "dallas", label: "Dallas" },
  { value: "miami", label: "Miami" },
  { value: "seattle", label: "Seattle" },
  { value: "boston", label: "Boston" },
  { value: "phoenix", label: "Phoenix" },
  { value: "houston", label: "Houston" },
  { value: "atlanta", label: "Atlanta" },
  { value: "denver", label: "Denver" },
  { value: "philadelphia", label: "Philadelphia" },
  { value: "portland", label: "Portland, OR" },
];

export type PeerSearchOpts = {
  make: string;
  model: string;
  year: number;
  maxPrice: number;
  craigslistSubdomain: string;
  rowIsUsed: boolean;
  fuel: FuelType;
  primaryBodyType: CarType;
  estimatedListPrice: number;
  listingMileage: number | null;
  finderMaxMileageCap: number;
};

const CAR_TYPE_LABEL: Partial<Record<CarType, string>> = {
  sedan: "sedan",
  suv: "suv",
  truck: "truck",
  hatchback: "hatchback",
  luxury: "luxury",
  sports: "sports car",
  minivan: "minivan",
  ev: "electric",
};

function peerSearchQueryLine(opts: PeerSearchOpts): string {
  const bodyWord = CAR_TYPE_LABEL[opts.primaryBodyType] ?? "";
  const fuelWord =
    opts.fuel === "hybrid" ? "hybrid" : opts.fuel === "electric" ? "electric" : "";
  const mileWord =
    opts.rowIsUsed && opts.listingMileage != null && opts.listingMileage > 0
      ? `${Math.round(opts.listingMileage / 1000)}k mi`
      : "";
  return [String(opts.year), opts.make, opts.model, fuelWord, bodyWord, mileWord]
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

export function buildPeerMarketplaceSingleLink(
  which: "craigslist" | "facebook",
  opts: PeerSearchOpts,
): PeerMarketplaceLink {
  const maxPrice = Math.max(5000, Math.round(opts.maxPrice / 500) * 500);
  const { min: minBand, max: maxBand } = listingPriceSearchBand(
    opts.estimatedListPrice,
    opts.maxPrice,
  );
  const minPrice = Math.max(peerBaitFilterMinPrice(maxPrice), minBand);
  const maxP = Math.min(maxPrice, maxBand);
  const sub = opts.craigslistSubdomain.replace(/[^a-z0-9-]/gi, "") || "losangeles";
  const q = peerSearchQueryLine(opts);

  if (which === "craigslist") {
    const clParams = new URLSearchParams();
    clParams.set("query", q);
    clParams.set("min_price", String(Math.min(minPrice, maxP - 500)));
    clParams.set("max_price", String(maxP));
    return {
      id: "craigslist",
      label: "Craigslist",
      href: `https://${sub}.craigslist.org/search/cta?${clParams.toString()}`,
    };
  }

  const fbHref = `https://www.facebook.com/marketplace/category/vehicles?query=${encodeURIComponent(q)}`;
  return {
    id: "facebook",
    label: "Facebook",
    href: fbHref,
  };
}
