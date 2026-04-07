/**
 * Builds src/lib/lifestyle-generated-cities.ts
 *
 * Data sources (downloaded to scripts/.cache on first run):
 * - US: Simplemaps-style uscities.csv (CC BY 4.0) — top 500 by population
 * - Intl: GeoNames cities15000 (CC BY 4.0) — top 3 cities per country by population
 *
 * Run: node scripts/generate-lifestyle-cities.mjs
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const cacheDir = path.join(__dirname, ".cache");
const lifestyleTs = path.join(root, "src/lib/lifestyle-data.ts");
const outFile = path.join(root, "src/lib/lifestyle-generated-cities.ts");

fs.mkdirSync(cacheDir, { recursive: true });

const USCITIES_URL =
  "https://gist.githubusercontent.com/kcsluis/206500156bf9dbae54dcb62aeb12d8cb/raw/uscities.csv";
const GEONAMES_ZIP = "https://download.geonames.org/export/dump/cities15000.zip";

function ensureDownload(url, dest) {
  if (!fs.existsSync(dest)) {
    console.error("Downloading", url);
    execSync(`curl -fsSL "${url}" -o "${dest}"`, { stdio: "inherit" });
  }
}

/** BEA-style regional price parity-ish + typical combined sales tax; local income tax 0 for generated */
const US_STATE_ECON = {
  AL: { rpp: 90.5, salesTax: 9.5 },
  AK: { rpp: 104, salesTax: 1.75 },
  AZ: { rpp: 98.5, salesTax: 8.4 },
  AR: { rpp: 88, salesTax: 9.5 },
  CA: { rpp: 110, salesTax: 8.8 },
  CO: { rpp: 103, salesTax: 7.8 },
  CT: { rpp: 102, salesTax: 6.4 },
  DE: { rpp: 100, salesTax: 0 },
  DC: { rpp: 117, salesTax: 6 },
  FL: { rpp: 99, salesTax: 7 },
  GA: { rpp: 96, salesTax: 7.4 },
  HI: { rpp: 113, salesTax: 4.5 },
  ID: { rpp: 95, salesTax: 6 },
  IL: { rpp: 100, salesTax: 8.8 },
  IN: { rpp: 92, salesTax: 7 },
  IA: { rpp: 92, salesTax: 6.9 },
  KS: { rpp: 92, salesTax: 8.7 },
  KY: { rpp: 91, salesTax: 6 },
  LA: { rpp: 91, salesTax: 9.6 },
  ME: { rpp: 98, salesTax: 5.5 },
  MD: { rpp: 105, salesTax: 6 },
  MA: { rpp: 107, salesTax: 6.25 },
  MI: { rpp: 94, salesTax: 6 },
  MN: { rpp: 102, salesTax: 8.9 },
  MS: { rpp: 87, salesTax: 7 },
  MO: { rpp: 93, salesTax: 8.4 },
  MT: { rpp: 94, salesTax: 0 },
  NE: { rpp: 93, salesTax: 6.9 },
  NV: { rpp: 98, salesTax: 8.3 },
  NH: { rpp: 104, salesTax: 0 },
  NJ: { rpp: 106, salesTax: 6.6 },
  NM: { rpp: 92, salesTax: 7.7 },
  NY: { rpp: 105, salesTax: 8 },
  NC: { rpp: 94, salesTax: 7 },
  ND: { rpp: 93, salesTax: 6.5 },
  OH: { rpp: 93, salesTax: 7.25 },
  OK: { rpp: 90, salesTax: 8.9 },
  OR: { rpp: 101, salesTax: 0 },
  PA: { rpp: 99, salesTax: 7 },
  RI: { rpp: 100, salesTax: 7 },
  SC: { rpp: 93, salesTax: 7.5 },
  SD: { rpp: 92, salesTax: 6.2 },
  TN: { rpp: 94, salesTax: 9.6 },
  TX: { rpp: 97, salesTax: 8.2 },
  UT: { rpp: 99, salesTax: 7.3 },
  VT: { rpp: 101, salesTax: 6.3 },
  VA: { rpp: 102, salesTax: 5.8 },
  WA: { rpp: 107, salesTax: 9.5 },
  WV: { rpp: 88, salesTax: 6.5 },
  WI: { rpp: 95, salesTax: 5.7 },
  WY: { rpp: 96, salesTax: 5.6 },
};

const STATE_NAMES = {
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

/** Rough national rent template scaled by RPP (USD/mo) */
const NATIONAL_FMR = [850, 1000, 1250, 1650, 1950];

const COUNTRY_ECON = {
  GB: { rpp: 105, salesTax: 20 },
  FR: { rpp: 110, salesTax: 20 },
  DE: { rpp: 108, salesTax: 19 },
  NL: { rpp: 115, salesTax: 21 },
  CH: { rpp: 130, salesTax: 7.7 },
  AT: { rpp: 102, salesTax: 20 },
  ES: { rpp: 100, salesTax: 21 },
  IT: { rpp: 104, salesTax: 22 },
  IE: { rpp: 112, salesTax: 23 },
  PT: { rpp: 95, salesTax: 23 },
  DK: { rpp: 118, salesTax: 25 },
  SE: { rpp: 115, salesTax: 25 },
  NO: { rpp: 122, salesTax: 25 },
  FI: { rpp: 110, salesTax: 24 },
  BE: { rpp: 104, salesTax: 21 },
  CZ: { rpp: 88, salesTax: 21 },
  PL: { rpp: 82, salesTax: 23 },
  HU: { rpp: 78, salesTax: 27 },
  GR: { rpp: 85, salesTax: 24 },
  JP: { rpp: 108, salesTax: 10 },
  KR: { rpp: 102, salesTax: 10 },
  CN: { rpp: 95, salesTax: 13 },
  HK: { rpp: 125, salesTax: 0 },
  SG: { rpp: 122, salesTax: 9 },
  TW: { rpp: 92, salesTax: 5 },
  TH: { rpp: 58, salesTax: 7 },
  MY: { rpp: 65, salesTax: 6 },
  ID: { rpp: 55, salesTax: 11 },
  PH: { rpp: 50, salesTax: 12 },
  VN: { rpp: 52, salesTax: 10 },
  IN: { rpp: 55, salesTax: 18 },
  AE: { rpp: 115, salesTax: 5 },
  QA: { rpp: 110, salesTax: 0 },
  SA: { rpp: 88, salesTax: 15 },
  IL: { rpp: 112, salesTax: 18 },
  TR: { rpp: 72, salesTax: 20 },
  AU: { rpp: 110, salesTax: 10 },
  NZ: { rpp: 105, salesTax: 15 },
  CA: { rpp: 105, salesTax: 13 },
  MX: { rpp: 68, salesTax: 16 },
  BR: { rpp: 75, salesTax: 17 },
  AR: { rpp: 58, salesTax: 21 },
  CO: { rpp: 55, salesTax: 19 },
  CL: { rpp: 78, salesTax: 19 },
  PE: { rpp: 62, salesTax: 18 },
  PA: { rpp: 85, salesTax: 7 },
  ZA: { rpp: 66, salesTax: 15 },
  KE: { rpp: 58, salesTax: 16 },
  NG: { rpp: 55, salesTax: 7.5 },
  EG: { rpp: 52, salesTax: 14 },
  GH: { rpp: 55, salesTax: 15 },
  MA: { rpp: 58, salesTax: 20 },
  RO: { rpp: 72, salesTax: 19 },
  RS: { rpp: 62, salesTax: 20 },
  HR: { rpp: 72, salesTax: 25 },
  BD: { rpp: 40, salesTax: 15 },
  PK: { rpp: 38, salesTax: 18 },
  KH: { rpp: 48, salesTax: 10 },
  OM: { rpp: 85, salesTax: 5 },
  KW: { rpp: 92, salesTax: 0 },
  _DEFAULT: { rpp: 78, salesTax: 15 },
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
    .slice(0, 48);
}

function normName(name) {
  return name
    .toLowerCase()
    .replace(/\s+city$/i, "")
    .trim();
}

function dedupeKey(country, stateCode, name) {
  const n = normName(name);
  return country === "US" ? `${stateCode}|${n}` : `${country}|${n}`;
}

function loadManualKeys() {
  const t = fs.readFileSync(lifestyleTs, "utf8");
  const keys = new Set();
  const re =
    /\{\s*id:\s*"[^"]*",\s*name:\s*"([^"]*)",\s*state:\s*"[^"]*",\s*stateCode:\s*"([^"]*)",\s*country:\s*"([A-Z]{2})"/g;
  let m;
  while ((m = re.exec(t))) {
    keys.add(dedupeKey(m[3], m[2], m[1]));
  }
  return keys;
}

function parseCsvRow(line) {
  const out = [];
  let cur = "";
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      inQ = !inQ;
      continue;
    }
    if (!inQ && c === ",") {
      out.push(cur);
      cur = "";
      continue;
    }
    cur += c;
  }
  out.push(cur);
  return out;
}

function parseUSCities(csvPath, manualKeys, limit) {
  const text = fs.readFileSync(csvPath, "utf8");
  const lines = text.split(/\r?\n/).filter(Boolean);
  const header = parseCsvRow(lines[0]);
  const idx = (name) => header.indexOf(name);
  const iCity = idx("city_ascii");
  const iState = idx("state_id");
  const iStateName = idx("state_name");
  const iPop =
    idx("population_proper") >= 0
      ? idx("population_proper")
      : idx("population");

  const rows = [];
  for (let li = 1; li < lines.length; li++) {
    const cols = parseCsvRow(lines[li]);
    if (cols.length < header.length - 2) continue;
    const cityAscii = cols[iCity];
    const stateId = cols[iState];
    const stateName = cols[iStateName];
    const popRaw = parseFloat(String(cols[iPop] ?? "").replace(/,/g, "")) || 0;
    if (!cityAscii || !stateId || popRaw < 5000) continue;
    const key = dedupeKey("US", stateId, cityAscii);
    if (manualKeys.has(key)) continue;
    rows.push({
      cityAscii,
      displayName: cols[0] || cityAscii,
      stateId,
      stateName,
      pop: popRaw,
    });
  }
  rows.sort((a, b) => b.pop - a.pop);
  const seen = new Set();
  const out = [];
  for (const r of rows) {
    const k = `${r.cityAscii}|${r.stateId}`;
    if (seen.has(k)) continue;
    seen.add(k);
    const econ = US_STATE_ECON[r.stateId] ?? { rpp: 95, salesTax: 7 };
    const pop = Math.max(r.pop, 20_000);
    const sizeFactor = Math.min(1.32, Math.max(0.82, 1 + Math.log10(pop / 200_000) * 0.1));
    const rpp = Math.round(econ.rpp * sizeFactor * 10) / 10;
    const rentScale = (rpp / 95) * sizeFactor;
    const fmr = NATIONAL_FMR.map((x) => Math.round(x * rentScale));
    const id = `${slug(r.cityAscii)}-${r.stateId.toLowerCase()}`;
    out.push({
      id,
      name: r.displayName.replace(/^"|"$/g, "") || r.cityAscii,
      state: STATE_NAMES[r.stateId] ?? r.stateName,
      stateCode: r.stateId,
      country: "US",
      fmr,
      rpp,
      salesTax: econ.salesTax,
      localIncomeTax: 0,
    });
    if (out.length >= limit) break;
  }
  return out;
}

function parseGeoNames(geonamesPath, manualKeys) {
  const text = fs.readFileSync(geonamesPath, "utf8");
  const byCountry = new Map();
  for (const line of text.split("\n")) {
    if (!line) continue;
    const p = line.split("\t");
    if (p.length < 15) continue;
    const country = p[8];
    if (country === "US") continue;
    const name = p[1];
    const pop = parseInt(p[14], 10) || 0;
    if (pop < 10_000) continue;
    if (!byCountry.has(country)) byCountry.set(country, []);
    byCountry.get(country).push({ name, pop });
  }
  const out = [];
  for (const [country, cities] of byCountry) {
    cities.sort((a, b) => b.pop - a.pop);
    let added = 0;
    for (const c of cities) {
      if (added >= 3) break;
      const key = dedupeKey(country, "", c.name);
      if (manualKeys.has(key)) continue;
      added++;
      const econ = COUNTRY_ECON[country] ?? COUNTRY_ECON._DEFAULT;
      const sizeFactor = added === 1 ? 1.06 : added === 2 ? 1.0 : 0.94;
      const rpp = Math.round(econ.rpp * sizeFactor * 10) / 10;
      const rentScale = (rpp / 95) * sizeFactor;
      const base = [700, 950, 1250, 1650, 2100];
      const fmr = base.map((x) => Math.round(x * rentScale));
      const id = `${slug(c.name)}-${country.toLowerCase()}`;
      out.push({
        id,
        name: c.name,
        state: "",
        stateCode: "",
        country,
        fmr,
        rpp,
        salesTax: econ.salesTax,
        localIncomeTax: 0,
      });
    }
  }
  return out;
}

function esc(s) {
  return s.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function emitCity(c) {
  const fmr = `[${c.fmr.join(", ")}]`;
  return `  { id: "${esc(c.id)}", name: "${esc(c.name)}", state: "${esc(c.state)}", stateCode: "${esc(c.stateCode)}", country: "${c.country}", fmr: ${fmr}, rpp: ${c.rpp}, salesTax: ${c.salesTax}, localIncomeTax: ${c.localIncomeTax} }`;
}

function main() {
  const usPath = path.join(cacheDir, "uscities.csv");
  const zipPath = path.join(cacheDir, "cities15000.zip");
  const gnPath = path.join(cacheDir, "cities15000.txt");

  ensureDownload(USCITIES_URL, usPath);
  ensureDownload(GEONAMES_ZIP, zipPath);
  if (!fs.existsSync(gnPath)) {
    execSync(`unzip -o -d "${cacheDir}" "${zipPath}" cities15000.txt`, { stdio: "inherit" });
  }

  const manualKeys = loadManualKeys();
  const us = parseUSCities(usPath, manualKeys, 500);
  const intl = parseGeoNames(gnPath, manualKeys);

  const header = `/**
 * AUTO-GENERATED — do not edit by hand.
 * Regenerate: node scripts/generate-lifestyle-cities.mjs
 *
 * US: top 500 incorporated places by population (Simplemaps uscities.csv, CC BY 4.0);
 *     economics scaled from state-level RPP/tax estimates.
 * Intl: up to 3 largest cities per country (GeoNames cities15000, CC BY 4.0);
 *        economics from country-level estimates.
 */

import type { CityData } from "./lifestyle-types";

`;

  const body = `export const GENERATED_LIFESTYLE_CITIES: CityData[] = [\n${us
    .map(emitCity)
    .join(",\n")},\n${intl.map(emitCity).join(",\n")},\n];\n`;

  fs.writeFileSync(outFile, header + body, "utf8");
  console.log(
    `Wrote ${outFile} (${us.length} US + ${intl.length} international ≈ ${us.length + intl.length} cities)`,
  );
}

main();
