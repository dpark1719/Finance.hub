/**
 * Generates src/lib/sp500-lookup.generated.ts from the public S&P 500 constituents CSV.
 * Source: https://github.com/datasets/s-and-p-500-companies (CC0 / public domain data).
 *
 * Run: node scripts/generate-sp500-lookup.mjs
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const outFile = path.join(root, "src/lib/sp500-lookup.generated.ts");
const csvUrl =
  "https://raw.githubusercontent.com/datasets/s-and-p-500-companies/master/data/constituents.csv";

function downloadCsv() {
  try {
    return execSync(`curl -fsSL "${csvUrl}"`, {
      encoding: "utf-8",
      maxBuffer: 2 * 1024 * 1024,
    });
  } catch {
    const local = path.join(__dirname, ".cache", "sp500-constituents.csv");
    if (fs.existsSync(local)) return fs.readFileSync(local, "utf-8");
    throw new Error("Could not download S&P 500 CSV and no local cache.");
  }
}

/** Parse CSV fields with quoted commas; reads `count` fields from a line. */
function parseCsvFields(line, count) {
  let i = 0;
  function readField() {
    if (i >= line.length) return "";
    if (line[i] === '"') {
      i++;
      let s = "";
      while (i < line.length) {
        if (line[i] === '"' && line[i + 1] === '"') {
          s += '"';
          i += 2;
          continue;
        }
        if (line[i] === '"') {
          i++;
          break;
        }
        s += line[i++];
      }
      if (line[i] === ",") i++;
      return s.trim();
    }
    const j = line.indexOf(",", i);
    const field = (j === -1 ? line.slice(i) : line.slice(i, j)).trim();
    i = j === -1 ? line.length : j + 1;
    return field;
  }
  const out = [];
  for (let k = 0; k < count; k++) out.push(readField());
  return out;
}

function parseSymbolSecurity(line) {
  const [symbol, security] = parseCsvFields(line, 2);
  return { symbol, security };
}

/** Symbol, Security, GICS Sector, GICS Sub-Industry (constituents.csv). */
function parseConstituentRow(line) {
  const [symbol, security, sector, industry] = parseCsvFields(line, 4);
  return { symbol, security, sector, industry };
}

function normalizeKey(s) {
  return s
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[’'`]/g, "")
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const CORP_SUFFIX =
  /\s*,?\s*(inc\.?|incorporated|corporation|corp\.?|plc\.?|plc|l\.?p\.?|llc\.?|company|co\.?|group|holdings?|brands?|technologies|technology|limited)\s*$/i;

function stripCorpLayers(name) {
  let n = name.replace(/\([^)]*\)/g, " ").replace(/\s+/g, " ").trim();
  let prev;
  do {
    prev = n;
    n = n.replace(CORP_SUFFIX, "").trim();
  } while (n !== prev);
  return n.replace(/\s+/g, " ").trim();
}

function collectKeys(symbol, security) {
  const keys = new Set();
  const sym = symbol.trim().toUpperCase();
  if (!sym || !security) return keys;

  const full = normalizeKey(security);
  if (full.length >= 2) keys.add(full);

  const stripped = normalizeKey(stripCorpLayers(security));
  if (stripped.length >= 2) keys.add(stripped);

  const core = normalizeKey(stripCorpLayers(security.replace(/\([^)]*\)/g, " ")));
  if (core.length >= 2) keys.add(core);

  const symLower = sym.toLowerCase();
  if (symLower.length >= 1) keys.add(symLower);

  return keys;
}

function main() {
  const text = downloadCsv();
  const lines = text.split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) throw new Error("Empty CSV");

  /** @type {Map<string, string>} */
  const keyToSymbol = new Map();
  /** @type {string[]} */
  const tickers = [];
  /** @type {Map<string, { sector: string; industry: string }>} */
  const gicsBySymbol = new Map();

  for (let li = 1; li < lines.length; li++) {
    const row = parseConstituentRow(lines[li]);
    const { symbol, security, sector, industry } = row;
    if (!symbol || !security) continue;
    const sym = symbol.trim().toUpperCase();
    tickers.push(sym);
    const sec = (sector || "").trim() || "Unknown";
    const ind = (industry || "").trim() || "Unknown";
    gicsBySymbol.set(sym, { sector: sec, industry: ind });
    for (const k of collectKeys(sym, security)) {
      if (k.length < 2 && k !== sym.toLowerCase()) continue;
      if (!keyToSymbol.has(k)) keyToSymbol.set(k, sym);
    }
  }

  const sortedKeys = [...keyToSymbol.keys()].sort((a, b) =>
    a.localeCompare(b),
  );
  const tickerSorted = [...new Set(tickers)].sort();

  const lookupEntries = sortedKeys
    .map((k) => `  ${JSON.stringify(k)}: ${JSON.stringify(keyToSymbol.get(k))},`)
    .join("\n");

  const tickerEntries = tickerSorted
    .map((t) => `  ${JSON.stringify(t)},`)
    .join("\n");

  const gicsEntries = tickerSorted
    .map((t) => {
      const g = gicsBySymbol.get(t) ?? { sector: "Unknown", industry: "Unknown" };
      return `  ${JSON.stringify(t)}: { sector: ${JSON.stringify(g.sector)}, industry: ${JSON.stringify(g.industry)} },`;
    })
    .join("\n");

  const header = `/**
 * AUTO-GENERATED by scripts/generate-sp500-lookup.mjs — do not edit by hand.
 * Source: datasets/s-and-p-500-companies (constituents.csv), CC0.
 * Regenerate after index changes: \`npm run generate:sp500\`
 */

`;

  const body = `${header}export const SP500_LOOKUP: Record<string, string> = {
${lookupEntries}
};

export const SP500_TICKERS: readonly string[] = [
${tickerEntries}
];

/** GICS sector / sub-industry per ticker (same CSV order as index). */
export const SP500_GICS: Record<string, { sector: string; industry: string }> = {
${gicsEntries}
};

const SP500_SET = new Set(SP500_TICKERS);

const CORP_SUFFIX =
  /\\s*,?\\s*(inc\\.?|incorporated|corporation|corp\\.?|plc\\.?|plc|l\\.?p\\.?|llc\\.?|company|co\\.?|group|holdings?|brands?|technologies|technology|limited)\\s*$/i;

function stripCorpLayersLocal(name: string): string {
  let n = name.replace(/\\([^)]*\\)/g, " ").replace(/\\s+/g, " ").trim();
  let prev: string;
  do {
    prev = n;
    n = n.replace(CORP_SUFFIX, "").trim();
  } while (n !== prev);
  return n.replace(/\\s+/g, " ").trim();
}

/** Same normalization as keys in SP500_LOOKUP (company name or phrase). */
export function normalizeSp500Query(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/['\`'’]/g, "")
    .replace(/[^\\w\\s]/g, " ")
    .replace(/\\s+/g, " ")
    .trim();
}

/** Resolve a typed company name / phrase to an S&P 500 ticker, or null. */
export function resolveSp500Lookup(raw: string): string | null {
  const q = normalizeSp500Query(raw);
  if (!q) return null;
  const direct = SP500_LOOKUP[q];
  if (direct) return direct;
  const stripped = normalizeSp500Query(stripCorpLayersLocal(raw));
  if (stripped && SP500_LOOKUP[stripped]) return SP500_LOOKUP[stripped];
  return null;
}

export function isSp500Ticker(symbol: string): boolean {
  return SP500_SET.has(symbol.trim().toUpperCase());
}
`;

  fs.writeFileSync(outFile, body, "utf-8");
  console.error(
    `Wrote ${outFile} (${sortedKeys.length} lookup keys, ${tickerSorted.length} tickers).`,
  );
}

main();
