/**
 * Representative primary colors for sports teams and similar entities (Polymarket outcomes).
 * Keys are lowercase nicknames or short tokens; lookup tries tokens in the label.
 * Colors are approximate brand primaries for UI bars only.
 */

const ENTITY_HEX: Record<string, string> = {
  // NFL (nicknames + common short forms)
  "49ers": "#AA0000",
  niners: "#AA0000",
  bears: "#0B162A",
  bengals: "#FB4F14",
  bills: "#00338D",
  broncos: "#FB4F14",
  browns: "#311D00",
  buccaneers: "#D50A0A",
  bucs: "#D50A0A",
  cardinals: "#97233F",
  chargers: "#0080C6",
  chiefs: "#E31837",
  colts: "#002C5F",
  cowboys: "#003594",
  dolphins: "#008E97",
  eagles: "#004C54",
  falcons: "#A71930",
  giants: "#0B2265",
  jaguars: "#006778",
  jets: "#125740",
  lions: "#0076B6",
  packers: "#203731",
  panthers: "#0085CA",
  patriots: "#002244",
  raiders: "#000000",
  rams: "#003594",
  ravens: "#241773",
  saints: "#D3BC8D",
  seahawks: "#002244",
  steelers: "#FFB612",
  texans: "#03202F",
  titans: "#0C2340",
  vikings: "#4F2683",
  commanders: "#5A1414",
  washington: "#5A1414",

  // NBA
  hawks: "#E03A3E",
  celtics: "#007A33",
  nets: "#000000",
  hornets: "#1D1160",
  bulls: "#CE1141",
  cavaliers: "#860038",
  cavs: "#860038",
  mavericks: "#00538C",
  mavs: "#00538C",
  nuggets: "#0E2240",
  pistons: "#C8102E",
  warriors: "#1D428A",
  rockets: "#CE1141",
  pacers: "#002D62",
  clippers: "#C8102E",
  lakers: "#552583",
  grizzlies: "#5D76A9",
  heat: "#98002E",
  bucks: "#00471B",
  timberwolves: "#0C2340",
  wolves: "#0C2340",
  pelicans: "#0C2340",
  knicks: "#006BB6",
  thunder: "#007AC1",
  magic: "#0077C0",
  "76ers": "#006BB6",
  sixers: "#006BB6",
  suns: "#1D1160",
  blazers: "#E03A3E",
  trailblazers: "#E03A3E",
  kings: "#5A2D81",
  spurs: "#C4CED4",
  raptors: "#CE1141",
  jazz: "#002B5C",

  // MLB (selected)
  yankees: "#003087",
  mets: "#002D72",
  dodgers: "#005A9C",
  sfgiants: "#FD5A1E",
  redsox: "#BD3039",
  cubs: "#0E3386",
  cardinalsmlb: "#C41E3A",
  astros: "#EB6E1F",
  braves: "#CE1141",
  phillies: "#E81828",
  mariners: "#0C2C56",
  padres: "#2F241D",
  rangers: "#003278",
  orioles: "#DF4601",
  rays: "#092C5C",
  bluejays: "#134A8E",
  whitesox: "#27251F",

  // NHL (selected)
  bruins: "#FFB81C",
  mapleleafs: "#00205B",
  leafs: "#00205B",
  canadiens: "#AF1E2D",
  habs: "#AF1E2D",
  blackhawks: "#CF0A2C",
  redwings: "#CE1126",
  penguins: "#000000",
  oilers: "#FF4C00",
  avalanche: "#6F263D",
  lightning: "#002868",
  capitals: "#C8102E",
  goldenknights: "#B4975A",
  kraken: "#99D9D9",

  // College / other common Polymarket strings
  alabama: "#9E1B32",
  crimson: "#9E1B32",
  georgia: "#BA0C2F",
  ohio: "#BB0000",
  michigan: "#00274C",
  notre: "#0C2340",
  dame: "#0C2340",
  texas: "#BF5700",
  usc: "#990000",
  clemson: "#F66733",
  lsu: "#461D7C",
  oregon: "#154733",
  penn: "#011F5B",
  florida: "#0021A5",
  gators: "#0021A5",
  seminoles: "#782F40",
  auburn: "#0C2340",
  tennessee: "#FF8200",
  oklahoma: "#841617",
  sooners: "#841617",
  nebraska: "#E41C38",
  wisconsin: "#C5050C",
  iowa: "#000000",
};

const YES_GREEN = "#059669";
const NO_RED = "#DC2626";

function tokens(raw: string): string[] {
  return raw
    .trim()
    .toLowerCase()
    .split(/[^a-z0-9]+/g)
    .filter((t) => t.length >= 2);
}

/** Longest-token-first match against ENTITY_HEX keys (handles multi-word labels). */
function lookupEntityHex(raw: string): string | undefined {
  const tks = tokens(raw);
  const sortedKeys = Object.keys(ENTITY_HEX).sort((a, b) => b.length - a.length);
  for (const tok of tks) {
    if (ENTITY_HEX[tok]) return ENTITY_HEX[tok];
  }
  const full = raw.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
  if (full && ENTITY_HEX[full]) return ENTITY_HEX[full];
  for (const key of sortedKeys) {
    if (full.includes(key) || raw.toLowerCase().includes(key)) return ENTITY_HEX[key];
  }
  return undefined;
}

function hashHue(seed: string, salt: number): string {
  let h = salt;
  for (let i = 0; i < seed.length; i++) h = seed.charCodeAt(i) + ((h << 5) - h);
  const hue = Math.abs(h) % 360;
  return `hsl(${hue} 58% 40%)`;
}

export type OutcomeColorKind = "yes" | "no" | "neutral";

/**
 * Fill color for a probability bar: Yes=green, No=red, else team lookup or deterministic hue.
 */
export function barColorForOutcome(name: string, kind: OutcomeColorKind, salt = 0): string {
  if (kind === "yes") return YES_GREEN;
  if (kind === "no") return NO_RED;
  const team = lookupEntityHex(name);
  if (team) return team;
  return hashHue(name.trim().toLowerCase(), salt);
}

export const OUTCOME_YES_GREEN = YES_GREEN;
export const OUTCOME_NO_RED = NO_RED;
