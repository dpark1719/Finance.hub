/**
 * Builds src/lib/lifestyle-col-extremes.ts — top 100 most expensive + 100 least expensive
 * cities by Numbeo Cost of Living Index (same ordering as their global city ranking page).
 *
 * Run: node scripts/generate-lifestyle-col-extremes.mjs
 * Requires network on first run (downloads Numbeo HTML).
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const cacheDir = path.join(__dirname, ".cache");
const outFile = path.join(root, "src/lib/lifestyle-col-extremes.ts");

const NUMBEO_URL = "https://www.numbeo.com/cost-of-living/rankings.jsp";

fs.mkdirSync(cacheDir, { recursive: true });

/** Map trailing country/region string from Numbeo → ISO 3166-1 alpha-2 */
const COUNTRY_TO_ISO = {
  Afghanistan: "AF",
  Albania: "AL",
  Algeria: "DZ",
  Argentina: "AR",
  Armenia: "AM",
  Australia: "AU",
  Austria: "AT",
  Azerbaijan: "AZ",
  Bahrain: "BH",
  Bangladesh: "BD",
  Belarus: "BY",
  Belgium: "BE",
  Bolivia: "BO",
  "Bosnia And Herzegovina": "BA",
  Brazil: "BR",
  Bulgaria: "BG",
  Cambodia: "KH",
  Canada: "CA",
  Chile: "CL",
  China: "CN",
  Colombia: "CO",
  "Costa Rica": "CR",
  Croatia: "HR",
  Cyprus: "CY",
  "Czech Republic": "CZ",
  Denmark: "DK",
  Ecuador: "EC",
  Egypt: "EG",
  Estonia: "EE",
  Ethiopia: "ET",
  Finland: "FI",
  France: "FR",
  Georgia: "GE",
  Germany: "DE",
  Ghana: "GH",
  Greece: "GR",
  Guatemala: "GT",
  Hungary: "HU",
  Iceland: "IS",
  India: "IN",
  Indonesia: "ID",
  Iran: "IR",
  Iraq: "IQ",
  Ireland: "IE",
  Israel: "IL",
  Italy: "IT",
  Jamaica: "JM",
  Japan: "JP",
  Jordan: "JO",
  Kazakhstan: "KZ",
  Kenya: "KE",
  Kosovo: "XK",
  Kuwait: "KW",
  Kyrgyzstan: "KG",
  Latvia: "LV",
  Lebanon: "LB",
  Lithuania: "LT",
  Luxembourg: "LU",
  Malaysia: "MY",
  Malta: "MT",
  Mexico: "MX",
  Moldova: "MD",
  Mongolia: "MN",
  Montenegro: "ME",
  Morocco: "MA",
  Nepal: "NP",
  Netherlands: "NL",
  "New Zealand": "NZ",
  Nigeria: "NG",
  "North Macedonia": "MK",
  Norway: "NO",
  Oman: "OM",
  Pakistan: "PK",
  Panama: "PA",
  Paraguay: "PY",
  Peru: "PE",
  Philippines: "PH",
  Poland: "PL",
  Portugal: "PT",
  Qatar: "QA",
  Romania: "RO",
  Russia: "RU",
  "Saudi Arabia": "SA",
  Serbia: "RS",
  Singapore: "SG",
  Slovakia: "SK",
  Slovenia: "SI",
  "South Africa": "ZA",
  "South Korea": "KR",
  Spain: "ES",
  "Sri Lanka": "LK",
  Sweden: "SE",
  Switzerland: "CH",
  Taiwan: "TW",
  Tajikistan: "TJ",
  Tanzania: "TZ",
  Thailand: "TH",
  Tunisia: "TN",
  Turkey: "TR",
  Uganda: "UG",
  Ukraine: "UA",
  "United Arab Emirates": "AE",
  "United Kingdom": "GB",
  "United States": "US",
  Uruguay: "UY",
  Uzbekistan: "UZ",
  Venezuela: "VE",
  Vietnam: "VN",
  Zimbabwe: "ZW",
};

const US_STATE_NAMES = {
  AL: "Alabama",
  AK: "Alaska",
  AZ: "Arizona",
  AR: "Arkansas",
  CA: "California",
  CO: "Colorado",
  CT: "Connecticut",
  DE: "Delaware",
  DC: "District of Columbia",
  FL: "Florida",
  GA: "Georgia",
  HI: "Hawaii",
  ID: "Idaho",
  IL: "Illinois",
  IN: "Indiana",
  IA: "Iowa",
  KS: "Kansas",
  KY: "Kentucky",
  LA: "Louisiana",
  ME: "Maine",
  MD: "Maryland",
  MA: "Massachusetts",
  MI: "Michigan",
  MN: "Minnesota",
  MS: "Mississippi",
  MO: "Missouri",
  MT: "Montana",
  NE: "Nebraska",
  NV: "Nevada",
  NH: "New Hampshire",
  NJ: "New Jersey",
  NM: "New Mexico",
  NY: "New York",
  NC: "North Carolina",
  ND: "North Dakota",
  OH: "Ohio",
  OK: "Oklahoma",
  OR: "Oregon",
  PA: "Pennsylvania",
  RI: "Rhode Island",
  SC: "South Carolina",
  SD: "South Dakota",
  TN: "Tennessee",
  TX: "Texas",
  UT: "Utah",
  VT: "Vermont",
  VA: "Virginia",
  WA: "Washington",
  WV: "West Virginia",
  WI: "Wisconsin",
  WY: "Wyoming",
};

const SALES_TAX_BY_ISO = {
  US: 7.5,
  CH: 7.7,
  IS: 24,
  IL: 18,
  NO: 25,
  SG: 9,
  GB: 20,
  DK: 25,
  SE: 25,
  DE: 19,
  FR: 20,
  NL: 21,
  BE: 21,
  AT: 20,
  IE: 23,
  FI: 24,
  IT: 22,
  ES: 21,
  PT: 23,
  PL: 23,
  CZ: 21,
  AU: 10,
  NZ: 15,
  JP: 10,
  KR: 10,
  CN: 13,
  HK: 0,
  TW: 5,
  IN: 18,
  BR: 17,
  MX: 16,
  AE: 5,
  QA: 0,
  SA: 15,
  TR: 20,
  RU: 20,
  ZA: 15,
  AR: 21,
  CL: 19,
  CO: 19,
  PE: 18,
  TH: 7,
  MY: 6,
  ID: 11,
  PH: 12,
  VN: 10,
  PK: 18,
  BD: 15,
  EG: 14,
  MA: 20,
  KE: 16,
  NG: 7.5,
  RO: 19,
  RS: 20,
  HR: 25,
  HU: 27,
  GR: 24,
  UA: 20,
  BY: 20,
  KZ: 12,
  UZ: 12,
  GE: 18,
  AM: 20,
  AZ: 18,
  BH: 10,
  KW: 0,
  OM: 5,
  LK: 18,
  NP: 13,
  IR: 9,
  IQ: 10,
  JO: 16,
  LB: 11,
  TN: 19,
  DZ: 19,
  XK: 18,
  BA: 17,
  ME: 21,
  MK: 18,
  AL: 20,
  MD: 20,
  EE: 22,
  LV: 21,
  LT: 21,
  SK: 20,
  SI: 22,
  LU: 17,
  MT: 18,
  CY: 19,
  _DEFAULT: 15,
};

function slug(s) {
  return s
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ß/g, "ss")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 44);
}

function salesTaxFor(iso) {
  return SALES_TAX_BY_ISO[iso] ?? SALES_TAX_BY_ISO._DEFAULT;
}

/**
 * Map Numbeo COL index (NYC=100) to app RPP-like scale (~US average 95–100).
 */
function rppFromNumbeo(col) {
  const lo = 17;
  const hi = 120;
  const t = Math.max(0, Math.min(1, (col - lo) / (hi - lo)));
  const rpp = 42 + t * 95;
  return Math.round(rpp * 10) / 10;
}

function fmrFromRpp(rpp) {
  const base = [850, 1000, 1250, 1650, 1950];
  const scale = rpp / 95;
  return base.map((x) => Math.round(x * scale));
}

/**
 * @returns {{ name: string, state: string, stateCode: string, country: string }}
 */
function parseLocation(cityField) {
  const raw = cityField.trim();
  if (raw.endsWith("United States")) {
    const parts = raw.split(",").map((s) => s.trim());
    if (parts.length >= 3) {
      const st = parts[parts.length - 2];
      if (st.length === 2 && /^[A-Z]{2}$/.test(st)) {
        const name = parts.slice(0, -2).join(", ");
        return {
          name,
          state: US_STATE_NAMES[st] ?? st,
          stateCode: st,
          country: "US",
        };
      }
    }
    const name = parts.slice(0, -1).join(", ");
    return { name, state: "", stateCode: "", country: "US" };
  }
  if (raw.includes("Hong Kong (China)") || /^Hong Kong,/.test(raw)) {
    return { name: "Hong Kong", state: "", stateCode: "", country: "HK" };
  }
  if (raw.includes("Taiwan")) {
    const name = raw.split(",")[0].trim();
    return { name, state: "", stateCode: "", country: "TW" };
  }
  const lastComma = raw.lastIndexOf(",");
  if (lastComma === -1) {
    return { name: raw, state: "", stateCode: "", country: "US" };
  }
  const countryPart = raw.slice(lastComma + 1).trim();
  const namePart = raw.slice(0, lastComma).trim();

  let iso = COUNTRY_TO_ISO[countryPart];
  if (!iso && countryPart.includes("China")) {
    if (/Hong Kong/i.test(countryPart)) iso = "HK";
    else if (/Taiwan/i.test(countryPart)) iso = "TW";
    else iso = "CN";
  }
  if (!iso && /Kosovo|Disputed/i.test(countryPart)) iso = "XK";
  if (!iso) iso = "US";

  return { name: namePart, state: "", stateCode: "", country: iso };
}

function esc(s) {
  return String(s).replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function parseNumbeoHtml(html) {
  const rows = [];
  /** Table rows: city cell then Cost of Living Index (first numeric column). */
  const re =
    /<td class="cityOrCountryInIndicesTable">([^<]+)<\/td>\s*<td[^>]*>([\d.]+)<\/td>/g;
  let m;
  while ((m = re.exec(html)) !== null) {
    const cityField = m[1].trim();
    const col = parseFloat(m[2]);
    if (!Number.isFinite(col)) continue;
    rows.push({ cityField, col });
  }
  return rows;
}

function main() {
  const cacheFile = path.join(cacheDir, "numbeo-rankings.html");
  if (!fs.existsSync(cacheFile)) {
    console.error("Downloading", NUMBEO_URL);
    execSync(`curl -fsSL "${NUMBEO_URL}" -o "${cacheFile}"`, { stdio: "inherit" });
  }
  const html = fs.readFileSync(cacheFile, "utf8");
  const rows = parseNumbeoHtml(html);
  if (rows.length < 200) {
    console.error("Expected ≥200 data rows, got", rows.length);
    process.exit(1);
  }

  const expensive = rows.slice(0, 100);
  const cheap = rows.slice(-100);

  const out = [];

  function pushRow(row, tier, rank) {
    const loc = parseLocation(row.cityField);
    const rpp = rppFromNumbeo(row.col);
    const fmr = fmrFromRpp(rpp);
    const st = salesTaxFor(loc.country);
    const id =
      tier === "expensive"
        ? `numbeo-exp-${String(rank).padStart(2, "0")}-${slug(loc.name)}-${loc.country.toLowerCase()}`
        : `numbeo-cheap-${String(rank).padStart(2, "0")}-${slug(loc.name)}-${loc.country.toLowerCase()}`;
    const note = `Included in Numbeo global Cost of Living Index ranking (snapshot: ${tier === "expensive" ? "top 100 most expensive" : "100 least expensive"} cities in that table). Index value ${row.col.toFixed(1)} (New York = 100). Rents here are scaled from that index for budgeting — not a HUD FMR or a specific listing.`;
    out.push({
      id,
      name: loc.name,
      state: loc.state,
      stateCode: loc.stateCode,
      country: loc.country,
      fmr,
      rpp,
      salesTax: st,
      localIncomeTax: 0,
      rentAreaNote: note,
    });
  }

  expensive.forEach((row, i) => pushRow(row, "expensive", i + 1));
  cheap.forEach((row, i) => pushRow(row, "cheap", i + 1));

  const header = `/**
 * AUTO-GENERATED — do not edit by hand.
 * Regenerate: node scripts/generate-lifestyle-col-extremes.mjs
 *
 * Source: Numbeo Cost of Living Index by City (rankings.jsp snapshot).
 * First 100 rows = most expensive; last 100 rows = least expensive in that table.
 * Economics: RPP and rent tiers scaled from Numbeo index (NYC = 100); see rentAreaNote on each row.
 */

import type { CityData } from "./lifestyle-types";

`;

  const body = `export const COL_EXTREME_LIFESTYLE_CITIES: CityData[] = [\n${out
    .map(
      (c) =>
        `  { id: "${esc(c.id)}", name: "${esc(c.name)}", state: "${esc(c.state)}", stateCode: "${esc(c.stateCode)}", country: "${c.country}", fmr: [${c.fmr.join(", ")}], rpp: ${c.rpp}, salesTax: ${c.salesTax}, localIncomeTax: 0, rentAreaNote: "${esc(c.rentAreaNote)}" }`,
    )
    .join(",\n")},\n];\n`;

  fs.writeFileSync(outFile, header + body, "utf8");
  console.log(`Wrote ${outFile} (${out.length} cities: 100 expensive + 100 cheap)`);
}

main();
