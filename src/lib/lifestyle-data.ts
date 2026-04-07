/**
 * Static data for the lifestyle calculator.
 * Sources: HUD FY2026 Fair Market Rents, Tax Foundation 2026 brackets,
 * BEA Regional Price Parities, BLS Consumer Expenditure Survey.
 */

import type { CityData } from "./lifestyle-types";
import { COL_EXTREME_LIFESTYLE_CITIES } from "./lifestyle-col-extremes";
import { GENERATED_LIFESTYLE_CITIES } from "./lifestyle-generated-cities";

export type { CityData } from "./lifestyle-types";

/* ── City data ────────────────────────────────────────────────── */

/** Hand-tuned metros — also used as the comparison pool for the lifestyle API (see route). */
export const LIFESTYLE_CORE_CITIES: CityData[] = [
  // ── United States ──
  { id: "nyc", name: "New York City", state: "New York", stateCode: "NY", country: "US", fmr: [1901, 1945, 2217, 2780, 3066], rpp: 122.3, salesTax: 8.875, localIncomeTax: 3.876 },
  { id: "la", name: "Los Angeles", state: "California", stateCode: "CA", country: "US", fmr: [1578, 1830, 2326, 3170, 3463], rpp: 116.0, salesTax: 9.5, localIncomeTax: 0 },
  {
    id: "chicago",
    name: "Chicago",
    state: "Illinois",
    stateCode: "IL",
    country: "US",
    fmr: [1011, 1115, 1308, 1694, 1852],
    rpp: 105.2,
    salesTax: 10.25,
    localIncomeTax: 0,
    rentAreaNote:
      "HUD FY2026 Fair Market Rent for the Chicago-Naperville-Elgin, IL-IN-WI metropolitan area (the full CBSA, not the city limits alone). HUD uses a metro-wide rent distribution—often around the 40th percentile—so it blends pricier neighborhoods with cheaper suburbs and smaller cities in the region. A 1 BR near this benchmark is more commonly found toward Rogers Park, Albany Park, Bridgeport, Avondale, south/west sides, or collar suburbs; Loop, River North, Streeterville, and Lincoln Park typically ask well above this for comparable units.",
  },
  { id: "houston", name: "Houston", state: "Texas", stateCode: "TX", country: "US", fmr: [939, 1057, 1282, 1719, 2010], rpp: 96.4, salesTax: 8.25, localIncomeTax: 0 },
  { id: "phoenix", name: "Phoenix", state: "Arizona", stateCode: "AZ", country: "US", fmr: [1004, 1126, 1353, 1830, 2100], rpp: 100.5, salesTax: 8.6, localIncomeTax: 0 },
  { id: "philly", name: "Philadelphia", state: "Pennsylvania", stateCode: "PA", country: "US", fmr: [1027, 1098, 1313, 1660, 1893], rpp: 106.4, salesTax: 8.0, localIncomeTax: 3.75 },
  { id: "san-antonio", name: "San Antonio", state: "Texas", stateCode: "TX", country: "US", fmr: [825, 963, 1193, 1610, 1890], rpp: 91.8, salesTax: 8.25, localIncomeTax: 0 },
  { id: "san-diego", name: "San Diego", state: "California", stateCode: "CA", country: "US", fmr: [1605, 1874, 2377, 3314, 3680], rpp: 117.5, salesTax: 7.75, localIncomeTax: 0 },
  { id: "dallas", name: "Dallas", state: "Texas", stateCode: "TX", country: "US", fmr: [1020, 1147, 1382, 1840, 2135], rpp: 99.3, salesTax: 8.25, localIncomeTax: 0 },
  { id: "san-jose", name: "San Jose", state: "California", stateCode: "CA", country: "US", fmr: [2007, 2521, 3155, 4185, 4572], rpp: 125.8, salesTax: 9.375, localIncomeTax: 0 },
  { id: "austin", name: "Austin", state: "Texas", stateCode: "TX", country: "US", fmr: [1100, 1298, 1578, 2070, 2415], rpp: 101.2, salesTax: 8.25, localIncomeTax: 0 },
  { id: "sf", name: "San Francisco", state: "California", stateCode: "CA", country: "US", fmr: [2118, 2658, 3403, 4478, 4944], rpp: 127.4, salesTax: 8.625, localIncomeTax: 0 },
  {
    id: "atherton-ca",
    name: "Atherton",
    state: "California",
    stateCode: "CA",
    country: "US",
    fmr: [2118, 2658, 3403, 4478, 4944],
    rpp: 129.0,
    salesTax: 9.375,
    localIncomeTax: 0,
    rentAreaNote:
      "HUD FY2026 Fair Market Rent for the San Francisco-Oakland-Hayward, CA metropolitan area (San Mateo County). The benchmark is metro-wide; Atherton’s market rents are often materially above this FMR.",
  },
  { id: "seattle", name: "Seattle", state: "Washington", stateCode: "WA", country: "US", fmr: [1484, 1737, 2091, 2802, 3235], rpp: 115.0, salesTax: 10.25, localIncomeTax: 0 },
  { id: "denver", name: "Denver", state: "Colorado", stateCode: "CO", country: "US", fmr: [1195, 1384, 1692, 2286, 2617], rpp: 108.5, salesTax: 8.81, localIncomeTax: 0 },
  { id: "dc", name: "Washington DC", state: "District of Columbia", stateCode: "DC", country: "US", fmr: [1592, 1700, 2013, 2531, 2882], rpp: 117.0, salesTax: 6.0, localIncomeTax: 0 },
  { id: "nashville", name: "Nashville", state: "Tennessee", stateCode: "TN", country: "US", fmr: [1030, 1128, 1336, 1724, 1945], rpp: 99.8, salesTax: 9.25, localIncomeTax: 0 },
  { id: "boston", name: "Boston", state: "Massachusetts", stateCode: "MA", country: "US", fmr: [1794, 2087, 2622, 3257, 3556], rpp: 120.5, salesTax: 6.25, localIncomeTax: 0 },
  { id: "atlanta", name: "Atlanta", state: "Georgia", stateCode: "GA", country: "US", fmr: [1100, 1217, 1422, 1880, 2100], rpp: 100.8, salesTax: 8.9, localIncomeTax: 0 },
  { id: "miami", name: "Miami", state: "Florida", stateCode: "FL", country: "US", fmr: [1378, 1637, 2050, 2720, 3010], rpp: 112.8, salesTax: 7.0, localIncomeTax: 0 },
  { id: "minneapolis", name: "Minneapolis", state: "Minnesota", stateCode: "MN", country: "US", fmr: [964, 1108, 1375, 1816, 2050], rpp: 102.0, salesTax: 8.025, localIncomeTax: 0 },
  { id: "portland", name: "Portland", state: "Oregon", stateCode: "OR", country: "US", fmr: [1148, 1330, 1601, 2178, 2490], rpp: 109.2, salesTax: 0, localIncomeTax: 0 },
  { id: "charlotte", name: "Charlotte", state: "North Carolina", stateCode: "NC", country: "US", fmr: [960, 1070, 1268, 1640, 1870], rpp: 96.5, salesTax: 7.25, localIncomeTax: 0 },
  { id: "raleigh", name: "Raleigh", state: "North Carolina", stateCode: "NC", country: "US", fmr: [1008, 1120, 1310, 1705, 1940], rpp: 97.0, salesTax: 7.25, localIncomeTax: 0 },
  { id: "tampa", name: "Tampa", state: "Florida", stateCode: "FL", country: "US", fmr: [1100, 1286, 1570, 2050, 2340], rpp: 100.2, salesTax: 7.5, localIncomeTax: 0 },
  { id: "detroit", name: "Detroit", state: "Michigan", stateCode: "MI", country: "US", fmr: [756, 854, 1054, 1378, 1536], rpp: 92.0, salesTax: 6.0, localIncomeTax: 2.4 },
  { id: "baltimore", name: "Baltimore", state: "Maryland", stateCode: "MD", country: "US", fmr: [1060, 1188, 1428, 1836, 2078], rpp: 104.5, salesTax: 6.0, localIncomeTax: 3.2 },
  { id: "vegas", name: "Las Vegas", state: "Nevada", stateCode: "NV", country: "US", fmr: [1010, 1147, 1377, 1840, 2085], rpp: 99.0, salesTax: 8.375, localIncomeTax: 0 },
  { id: "columbus", name: "Columbus", state: "Ohio", stateCode: "OH", country: "US", fmr: [780, 900, 1086, 1400, 1600], rpp: 93.2, salesTax: 7.5, localIncomeTax: 2.5 },
  { id: "indianapolis", name: "Indianapolis", state: "Indiana", stateCode: "IN", country: "US", fmr: [720, 828, 1010, 1330, 1510], rpp: 91.0, salesTax: 7.0, localIncomeTax: 0 },
  { id: "kansas-city", name: "Kansas City", state: "Missouri", stateCode: "MO", country: "US", fmr: [790, 910, 1098, 1450, 1660], rpp: 93.5, salesTax: 9.1, localIncomeTax: 1.0 },
  { id: "jacksonville-fl", name: "Jacksonville", state: "Florida", stateCode: "FL", country: "US", fmr: [1010, 1105, 1320, 1680, 1950], rpp: 96, salesTax: 7.25, localIncomeTax: 0 },
  { id: "fort-worth-tx", name: "Fort Worth", state: "Texas", stateCode: "TX", country: "US", fmr: [920, 1050, 1280, 1680, 2100], rpp: 99, salesTax: 8.25, localIncomeTax: 0 },
  { id: "memphis-tn", name: "Memphis", state: "Tennessee", stateCode: "TN", country: "US", fmr: [780, 880, 1020, 1280, 1520], rpp: 91, salesTax: 9.75, localIncomeTax: 0 },
  { id: "louisville-ky", name: "Louisville", state: "Kentucky", stateCode: "KY", country: "US", fmr: [750, 850, 1020, 1350, 1580], rpp: 93, salesTax: 6.0, localIncomeTax: 2.2 },
  { id: "milwaukee-wi", name: "Milwaukee", state: "Wisconsin", stateCode: "WI", country: "US", fmr: [720, 820, 980, 1280, 1520], rpp: 94, salesTax: 7.9, localIncomeTax: 0 },
  { id: "albuquerque-nm", name: "Albuquerque", state: "New Mexico", stateCode: "NM", country: "US", fmr: [720, 820, 980, 1240, 1480], rpp: 93, salesTax: 7.75, localIncomeTax: 0 },
  { id: "tucson-az", name: "Tucson", state: "Arizona", stateCode: "AZ", country: "US", fmr: [780, 920, 1120, 1580, 1880], rpp: 95, salesTax: 8.7, localIncomeTax: 0 },
  { id: "fresno-ca", name: "Fresno", state: "California", stateCode: "CA", country: "US", fmr: [850, 980, 1180, 1620, 1980], rpp: 98, salesTax: 8.35, localIncomeTax: 0 },
  { id: "sacramento-ca", name: "Sacramento", state: "California", stateCode: "CA", country: "US", fmr: [1100, 1280, 1520, 2050, 2480], rpp: 106, salesTax: 8.75, localIncomeTax: 0 },
  { id: "mesa-az", name: "Mesa", state: "Arizona", stateCode: "AZ", country: "US", fmr: [920, 1080, 1320, 1820, 2180], rpp: 99, salesTax: 8.3, localIncomeTax: 0 },
  { id: "omaha-ne", name: "Omaha", state: "Nebraska", stateCode: "NE", country: "US", fmr: [750, 880, 1080, 1480, 1780], rpp: 94, salesTax: 7.0, localIncomeTax: 0 },
  { id: "virginia-beach-va", name: "Virginia Beach", state: "Virginia", stateCode: "VA", country: "US", fmr: [980, 1120, 1320, 1780, 2180], rpp: 102, salesTax: 6.0, localIncomeTax: 0 },
  { id: "colorado-springs-co", name: "Colorado Springs", state: "Colorado", stateCode: "CO", country: "US", fmr: [920, 1080, 1320, 1780, 2120], rpp: 99, salesTax: 8.2, localIncomeTax: 0 },
  { id: "tulsa-ok", name: "Tulsa", state: "Oklahoma", stateCode: "OK", country: "US", fmr: [680, 780, 950, 1280, 1520], rpp: 90, salesTax: 8.52, localIncomeTax: 0 },
  { id: "arlington-tx", name: "Arlington", state: "Texas", stateCode: "TX", country: "US", fmr: [920, 1050, 1280, 1680, 2100], rpp: 99, salesTax: 8.25, localIncomeTax: 0 },
  { id: "new-orleans-la", name: "New Orleans", state: "Louisiana", stateCode: "LA", country: "US", fmr: [880, 980, 1180, 1580, 1920], rpp: 95, salesTax: 9.45, localIncomeTax: 0 },
  { id: "honolulu-hi", name: "Honolulu", state: "Hawaii", stateCode: "HI", country: "US", fmr: [1580, 1780, 2180, 2880, 3480], rpp: 117, salesTax: 4.5, localIncomeTax: 0 },
  { id: "anchorage-ak", name: "Anchorage", state: "Alaska", stateCode: "AK", country: "US", fmr: [1050, 1180, 1420, 1880, 2280], rpp: 109, salesTax: 0, localIncomeTax: 0 },
  { id: "salt-lake-city-ut", name: "Salt Lake City", state: "Utah", stateCode: "UT", country: "US", fmr: [980, 1120, 1380, 1880, 2280], rpp: 102, salesTax: 7.75, localIncomeTax: 0 },
  { id: "pittsburgh-pa", name: "Pittsburgh", state: "Pennsylvania", stateCode: "PA", country: "US", fmr: [780, 920, 1120, 1480, 1780], rpp: 96, salesTax: 7.0, localIncomeTax: 3.0 },
  { id: "cincinnati-oh", name: "Cincinnati", state: "Ohio", stateCode: "OH", country: "US", fmr: [720, 850, 1020, 1380, 1680], rpp: 93, salesTax: 7.8, localIncomeTax: 2.1 },
  { id: "st-louis-mo", name: "St. Louis", state: "Missouri", stateCode: "MO", country: "US", fmr: [680, 820, 980, 1280, 1520], rpp: 92, salesTax: 9.68, localIncomeTax: 1.0 },
  { id: "orlando-fl", name: "Orlando", state: "Florida", stateCode: "FL", country: "US", fmr: [1080, 1220, 1450, 1880, 2280], rpp: 99, salesTax: 6.5, localIncomeTax: 0 },
  { id: "providence-ri", name: "Providence", state: "Rhode Island", stateCode: "RI", country: "US", fmr: [980, 1120, 1380, 1780, 2120], rpp: 102, salesTax: 7.0, localIncomeTax: 0 },
  { id: "richmond-va", name: "Richmond", state: "Virginia", stateCode: "VA", country: "US", fmr: [920, 1050, 1280, 1680, 1980], rpp: 97, salesTax: 6.0, localIncomeTax: 0 },
  { id: "buffalo-ny", name: "Buffalo", state: "New York", stateCode: "NY", country: "US", fmr: [720, 850, 1020, 1320, 1580], rpp: 93, salesTax: 8.75, localIncomeTax: 0 },
  { id: "rochester-ny", name: "Rochester", state: "New York", stateCode: "NY", country: "US", fmr: [780, 920, 1120, 1450, 1720], rpp: 94, salesTax: 8.0, localIncomeTax: 0 },
  { id: "hartford-ct", name: "Hartford", state: "Connecticut", stateCode: "CT", country: "US", fmr: [980, 1120, 1380, 1780, 2120], rpp: 102, salesTax: 6.35, localIncomeTax: 0 },
  { id: "boise-id", name: "Boise", state: "Idaho", stateCode: "ID", country: "US", fmr: [920, 1080, 1320, 1720, 2020], rpp: 100, salesTax: 6.0, localIncomeTax: 0 },
  { id: "madison-wi", name: "Madison", state: "Wisconsin", stateCode: "WI", country: "US", fmr: [880, 1020, 1250, 1620, 1920], rpp: 98, salesTax: 5.5, localIncomeTax: 0 },
  { id: "des-moines-ia", name: "Des Moines", state: "Iowa", stateCode: "IA", country: "US", fmr: [720, 850, 1020, 1380, 1680], rpp: 93, salesTax: 7.0, localIncomeTax: 0 },
  { id: "spokane-wa", name: "Spokane", state: "Washington", stateCode: "WA", country: "US", fmr: [780, 920, 1120, 1520, 1820], rpp: 95, salesTax: 9.3, localIncomeTax: 0 },
  { id: "lexington-ky", name: "Lexington", state: "Kentucky", stateCode: "KY", country: "US", fmr: [720, 820, 980, 1280, 1520], rpp: 92, salesTax: 6.0, localIncomeTax: 0 },
  { id: "greensboro-nc", name: "Greensboro", state: "North Carolina", stateCode: "NC", country: "US", fmr: [780, 880, 1050, 1380, 1680], rpp: 93, salesTax: 6.75, localIncomeTax: 0 },
  { id: "knoxville-tn", name: "Knoxville", state: "Tennessee", stateCode: "TN", country: "US", fmr: [780, 880, 1050, 1320, 1580], rpp: 93, salesTax: 9.25, localIncomeTax: 0 },
  { id: "chattanooga-tn", name: "Chattanooga", state: "Tennessee", stateCode: "TN", country: "US", fmr: [720, 820, 980, 1280, 1520], rpp: 91, salesTax: 9.25, localIncomeTax: 0 },
  { id: "savannah-ga", name: "Savannah", state: "Georgia", stateCode: "GA", country: "US", fmr: [880, 1020, 1220, 1620, 1920], rpp: 95, salesTax: 7.0, localIncomeTax: 0 },
  { id: "charleston-sc", name: "Charleston", state: "South Carolina", stateCode: "SC", country: "US", fmr: [1180, 1380, 1680, 2180, 2580], rpp: 101, salesTax: 9.0, localIncomeTax: 0 },
  { id: "wichita-ks", name: "Wichita", state: "Kansas", stateCode: "KS", country: "US", fmr: [620, 720, 880, 1180, 1420], rpp: 89, salesTax: 7.5, localIncomeTax: 0 },
  { id: "long-beach-ca", name: "Long Beach", state: "California", stateCode: "CA", country: "US", fmr: [1280, 1520, 1880, 2480, 2980], rpp: 112, salesTax: 10.25, localIncomeTax: 0 },
  { id: "bakersfield-ca", name: "Bakersfield", state: "California", stateCode: "CA", country: "US", fmr: [780, 920, 1120, 1520, 1880], rpp: 96, salesTax: 8.25, localIncomeTax: 0 },
  { id: "el-paso-tx", name: "El Paso", state: "Texas", stateCode: "TX", country: "US", fmr: [620, 720, 880, 1180, 1420], rpp: 88, salesTax: 8.25, localIncomeTax: 0 },
  { id: "birmingham-al-us", name: "Birmingham", state: "Alabama", stateCode: "AL", country: "US", fmr: [720, 820, 980, 1280, 1520], rpp: 92, salesTax: 10.0, localIncomeTax: 0 },
  { id: "norfolk-va", name: "Norfolk", state: "Virginia", stateCode: "VA", country: "US", fmr: [980, 1120, 1320, 1780, 2180], rpp: 101, salesTax: 6.0, localIncomeTax: 0 },
  { id: "baton-rouge-la", name: "Baton Rouge", state: "Louisiana", stateCode: "LA", country: "US", fmr: [720, 820, 980, 1320, 1580], rpp: 91, salesTax: 10.45, localIncomeTax: 0 },
  { id: "durham-nc", name: "Durham", state: "North Carolina", stateCode: "NC", country: "US", fmr: [1020, 1180, 1420, 1880, 2280], rpp: 98, salesTax: 7.5, localIncomeTax: 0 },
  { id: "reno-nv", name: "Reno", state: "Nevada", stateCode: "NV", country: "US", fmr: [920, 1080, 1320, 1780, 2120], rpp: 100, salesTax: 8.27, localIncomeTax: 0 },
  // ── Europe ──
  { id: "london", name: "London", state: "", stateCode: "", country: "GB", fmr: [1600, 2100, 2800, 3600, 4500], rpp: 132, salesTax: 20, localIncomeTax: 0 },
  { id: "paris", name: "Paris", state: "", stateCode: "", country: "FR", fmr: [1400, 1800, 2400, 3100, 3900], rpp: 118, salesTax: 20, localIncomeTax: 0 },
  { id: "berlin", name: "Berlin", state: "", stateCode: "", country: "DE", fmr: [950, 1300, 1700, 2200, 2800], rpp: 105, salesTax: 19, localIncomeTax: 0 },
  { id: "munich", name: "Munich", state: "", stateCode: "", country: "DE", fmr: [1200, 1600, 2100, 2700, 3400], rpp: 115, salesTax: 19, localIncomeTax: 0 },
  { id: "amsterdam", name: "Amsterdam", state: "", stateCode: "", country: "NL", fmr: [1400, 1800, 2300, 2900, 3600], rpp: 118, salesTax: 21, localIncomeTax: 0 },
  { id: "zurich", name: "Zurich", state: "", stateCode: "", country: "CH", fmr: [1800, 2300, 3000, 3800, 4700], rpp: 135, salesTax: 7.7, localIncomeTax: 0 },
  { id: "vienna", name: "Vienna", state: "", stateCode: "", country: "AT", fmr: [900, 1200, 1600, 2100, 2700], rpp: 102, salesTax: 20, localIncomeTax: 0 },
  { id: "madrid", name: "Madrid", state: "", stateCode: "", country: "ES", fmr: [900, 1200, 1600, 2100, 2700], rpp: 98, salesTax: 21, localIncomeTax: 0 },
  { id: "barcelona", name: "Barcelona", state: "", stateCode: "", country: "ES", fmr: [1000, 1350, 1750, 2250, 2850], rpp: 102, salesTax: 21, localIncomeTax: 0 },
  { id: "rome", name: "Rome", state: "", stateCode: "", country: "IT", fmr: [950, 1300, 1700, 2200, 2800], rpp: 100, salesTax: 22, localIncomeTax: 0 },
  { id: "milan", name: "Milan", state: "", stateCode: "", country: "IT", fmr: [1100, 1500, 1950, 2500, 3200], rpp: 108, salesTax: 22, localIncomeTax: 0 },
  { id: "dublin", name: "Dublin", state: "", stateCode: "", country: "IE", fmr: [1300, 1700, 2200, 2800, 3500], rpp: 115, salesTax: 23, localIncomeTax: 0 },
  { id: "lisbon", name: "Lisbon", state: "", stateCode: "", country: "PT", fmr: [900, 1200, 1600, 2100, 2700], rpp: 95, salesTax: 23, localIncomeTax: 0 },
  { id: "copenhagen", name: "Copenhagen", state: "", stateCode: "", country: "DK", fmr: [1400, 1800, 2300, 2900, 3600], rpp: 120, salesTax: 25, localIncomeTax: 0 },
  { id: "stockholm", name: "Stockholm", state: "", stateCode: "", country: "SE", fmr: [1300, 1700, 2200, 2800, 3500], rpp: 118, salesTax: 25, localIncomeTax: 0 },
  { id: "oslo", name: "Oslo", state: "", stateCode: "", country: "NO", fmr: [1500, 1900, 2400, 3000, 3800], rpp: 125, salesTax: 25, localIncomeTax: 0 },
  { id: "helsinki", name: "Helsinki", state: "", stateCode: "", country: "FI", fmr: [1100, 1450, 1900, 2400, 3000], rpp: 112, salesTax: 24, localIncomeTax: 0 },
  { id: "brussels", name: "Brussels", state: "", stateCode: "", country: "BE", fmr: [1000, 1350, 1750, 2250, 2850], rpp: 105, salesTax: 21, localIncomeTax: 0 },
  { id: "prague", name: "Prague", state: "", stateCode: "", country: "CZ", fmr: [700, 950, 1250, 1600, 2000], rpp: 88, salesTax: 21, localIncomeTax: 0 },
  { id: "warsaw", name: "Warsaw", state: "", stateCode: "", country: "PL", fmr: [650, 900, 1200, 1550, 1950], rpp: 82, salesTax: 23, localIncomeTax: 0 },
  { id: "budapest", name: "Budapest", state: "", stateCode: "", country: "HU", fmr: [600, 850, 1150, 1500, 1900], rpp: 78, salesTax: 27, localIncomeTax: 0 },
  { id: "edinburgh", name: "Edinburgh", state: "", stateCode: "", country: "GB", fmr: [950, 1300, 1650, 2100, 2600], rpp: 98, salesTax: 20, localIncomeTax: 0 },
  { id: "manchester-gb", name: "Manchester", state: "", stateCode: "", country: "GB", fmr: [900, 1200, 1500, 1900, 2400], rpp: 95, salesTax: 20, localIncomeTax: 0 },
  { id: "hamburg", name: "Hamburg", state: "", stateCode: "", country: "DE", fmr: [1000, 1350, 1750, 2250, 2850], rpp: 105, salesTax: 19, localIncomeTax: 0 },
  { id: "frankfurt", name: "Frankfurt", state: "", stateCode: "", country: "DE", fmr: [1100, 1450, 1900, 2450, 3100], rpp: 108, salesTax: 19, localIncomeTax: 0 },
  { id: "geneva", name: "Geneva", state: "", stateCode: "", country: "CH", fmr: [1900, 2400, 3100, 3900, 4800], rpp: 138, salesTax: 7.7, localIncomeTax: 0 },
  { id: "athens", name: "Athens", state: "", stateCode: "", country: "GR", fmr: [650, 900, 1200, 1600, 2050], rpp: 85, salesTax: 24, localIncomeTax: 0 },
  { id: "lyon", name: "Lyon", state: "", stateCode: "", country: "FR", fmr: [1100, 1450, 1900, 2450, 3050], rpp: 105, salesTax: 20, localIncomeTax: 0 },
  // ── Asia ──
  { id: "tokyo", name: "Tokyo", state: "", stateCode: "", country: "JP", fmr: [650, 850, 1150, 1550, 1950], rpp: 112, salesTax: 10, localIncomeTax: 0 },
  { id: "osaka", name: "Osaka", state: "", stateCode: "", country: "JP", fmr: [550, 750, 1000, 1350, 1750], rpp: 100, salesTax: 10, localIncomeTax: 0 },
  { id: "seoul", name: "Seoul", state: "", stateCode: "", country: "KR", fmr: [700, 850, 1100, 1450, 1850], rpp: 105, salesTax: 10, localIncomeTax: 0 },
  { id: "busan", name: "Busan", state: "", stateCode: "", country: "KR", fmr: [500, 650, 850, 1150, 1500], rpp: 88, salesTax: 10, localIncomeTax: 0 },
  { id: "beijing", name: "Beijing", state: "", stateCode: "", country: "CN", fmr: [800, 1100, 1500, 2000, 2600], rpp: 95, salesTax: 13, localIncomeTax: 0 },
  { id: "shanghai", name: "Shanghai", state: "", stateCode: "", country: "CN", fmr: [900, 1300, 1800, 2400, 3100], rpp: 108, salesTax: 13, localIncomeTax: 0 },
  { id: "shenzhen", name: "Shenzhen", state: "", stateCode: "", country: "CN", fmr: [850, 1250, 1700, 2300, 3000], rpp: 105, salesTax: 13, localIncomeTax: 0 },
  { id: "hong-kong", name: "Hong Kong", state: "", stateCode: "", country: "HK", fmr: [1800, 2400, 3200, 4200, 5300], rpp: 128, salesTax: 0, localIncomeTax: 0 },
  { id: "singapore-city", name: "Singapore", state: "", stateCode: "", country: "SG", fmr: [2200, 2800, 3600, 4500, 5600], rpp: 125, salesTax: 9, localIncomeTax: 0 },
  { id: "taipei", name: "Taipei", state: "", stateCode: "", country: "TW", fmr: [700, 950, 1300, 1750, 2250], rpp: 92, salesTax: 5, localIncomeTax: 0 },
  { id: "bangkok", name: "Bangkok", state: "", stateCode: "", country: "TH", fmr: [400, 550, 750, 1000, 1300], rpp: 55, salesTax: 7, localIncomeTax: 0 },
  { id: "kuala-lumpur", name: "Kuala Lumpur", state: "", stateCode: "", country: "MY", fmr: [450, 600, 800, 1050, 1350], rpp: 62, salesTax: 6, localIncomeTax: 0 },
  { id: "jakarta", name: "Jakarta", state: "", stateCode: "", country: "ID", fmr: [350, 500, 700, 950, 1250], rpp: 52, salesTax: 11, localIncomeTax: 0 },
  { id: "manila", name: "Manila", state: "", stateCode: "", country: "PH", fmr: [300, 450, 650, 900, 1200], rpp: 48, salesTax: 12, localIncomeTax: 0 },
  { id: "ho-chi-minh-city", name: "Ho Chi Minh City", state: "", stateCode: "", country: "VN", fmr: [350, 500, 700, 950, 1250], rpp: 50, salesTax: 10, localIncomeTax: 0 },
  { id: "hanoi", name: "Hanoi", state: "", stateCode: "", country: "VN", fmr: [300, 450, 650, 850, 1100], rpp: 48, salesTax: 10, localIncomeTax: 0 },
  { id: "mumbai", name: "Mumbai", state: "", stateCode: "", country: "IN", fmr: [400, 550, 800, 1100, 1500], rpp: 55, salesTax: 18, localIncomeTax: 0 },
  { id: "new-delhi", name: "New Delhi", state: "", stateCode: "", country: "IN", fmr: [350, 500, 700, 950, 1300], rpp: 52, salesTax: 18, localIncomeTax: 0 },
  { id: "bangalore", name: "Bangalore", state: "", stateCode: "", country: "IN", fmr: [400, 550, 750, 1050, 1400], rpp: 54, salesTax: 18, localIncomeTax: 0 },
  { id: "dubai", name: "Dubai", state: "", stateCode: "", country: "AE", fmr: [1400, 1800, 2400, 3200, 4000], rpp: 118, salesTax: 5, localIncomeTax: 0 },
  { id: "abu-dhabi", name: "Abu Dhabi", state: "", stateCode: "", country: "AE", fmr: [1300, 1700, 2300, 3000, 3800], rpp: 115, salesTax: 5, localIncomeTax: 0 },
  { id: "doha", name: "Doha", state: "", stateCode: "", country: "QA", fmr: [1200, 1600, 2100, 2800, 3600], rpp: 112, salesTax: 0, localIncomeTax: 0 },
  { id: "riyadh", name: "Riyadh", state: "", stateCode: "", country: "SA", fmr: [800, 1100, 1500, 2000, 2600], rpp: 88, salesTax: 15, localIncomeTax: 0 },
  { id: "tel-aviv", name: "Tel Aviv", state: "", stateCode: "", country: "IL", fmr: [1400, 1900, 2500, 3300, 4200], rpp: 115, salesTax: 18, localIncomeTax: 0 },
  { id: "istanbul", name: "Istanbul", state: "", stateCode: "", country: "TR", fmr: [500, 700, 950, 1300, 1700], rpp: 72, salesTax: 20, localIncomeTax: 0 },
  { id: "kyoto", name: "Kyoto", state: "", stateCode: "", country: "JP", fmr: [600, 800, 1050, 1400, 1800], rpp: 98, salesTax: 10, localIncomeTax: 0 },
  { id: "guangzhou", name: "Guangzhou", state: "", stateCode: "", country: "CN", fmr: [750, 1050, 1450, 1950, 2500], rpp: 92, salesTax: 13, localIncomeTax: 0 },
  // ── Oceania ──
  { id: "sydney", name: "Sydney", state: "", stateCode: "", country: "AU", fmr: [1600, 2100, 2700, 3400, 4200], rpp: 118, salesTax: 10, localIncomeTax: 0 },
  { id: "melbourne", name: "Melbourne", state: "", stateCode: "", country: "AU", fmr: [1400, 1850, 2400, 3000, 3800], rpp: 112, salesTax: 10, localIncomeTax: 0 },
  { id: "auckland", name: "Auckland", state: "", stateCode: "", country: "NZ", fmr: [1300, 1700, 2200, 2800, 3500], rpp: 108, salesTax: 15, localIncomeTax: 0 },
  { id: "brisbane", name: "Brisbane", state: "", stateCode: "", country: "AU", fmr: [1300, 1750, 2250, 2900, 3600], rpp: 105, salesTax: 10, localIncomeTax: 0 },
  { id: "perth", name: "Perth", state: "", stateCode: "", country: "AU", fmr: [1200, 1600, 2100, 2700, 3400], rpp: 102, salesTax: 10, localIncomeTax: 0 },
  // ── Americas (non-US) ──
  { id: "toronto", name: "Toronto", state: "", stateCode: "", country: "CA", fmr: [1400, 1850, 2400, 3100, 3900], rpp: 108, salesTax: 13, localIncomeTax: 0 },
  { id: "vancouver", name: "Vancouver", state: "", stateCode: "", country: "CA", fmr: [1500, 2000, 2600, 3300, 4100], rpp: 112, salesTax: 12, localIncomeTax: 0 },
  { id: "montreal", name: "Montreal", state: "", stateCode: "", country: "CA", fmr: [1000, 1350, 1750, 2250, 2850], rpp: 95, salesTax: 15, localIncomeTax: 0 },
  { id: "mexico-city", name: "Mexico City", state: "", stateCode: "", country: "MX", fmr: [550, 750, 1000, 1350, 1750], rpp: 72, salesTax: 16, localIncomeTax: 0 },
  { id: "sao-paulo", name: "São Paulo", state: "", stateCode: "", country: "BR", fmr: [600, 850, 1150, 1550, 2000], rpp: 78, salesTax: 17, localIncomeTax: 0 },
  { id: "buenos-aires", name: "Buenos Aires", state: "", stateCode: "", country: "AR", fmr: [400, 600, 850, 1200, 1600], rpp: 58, salesTax: 21, localIncomeTax: 0 },
  { id: "bogota", name: "Bogotá", state: "", stateCode: "", country: "CO", fmr: [350, 500, 700, 950, 1250], rpp: 52, salesTax: 19, localIncomeTax: 0 },
  { id: "santiago", name: "Santiago", state: "", stateCode: "", country: "CL", fmr: [550, 750, 1050, 1400, 1800], rpp: 78, salesTax: 19, localIncomeTax: 0 },
  { id: "lima", name: "Lima", state: "", stateCode: "", country: "PE", fmr: [450, 650, 900, 1250, 1650], rpp: 62, salesTax: 18, localIncomeTax: 0 },
  { id: "panama-city", name: "Panama City", state: "", stateCode: "", country: "PA", fmr: [800, 1100, 1500, 2000, 2600], rpp: 85, salesTax: 7, localIncomeTax: 0 },
  // ── Africa ──
  { id: "cape-town", name: "Cape Town", state: "", stateCode: "", country: "ZA", fmr: [550, 800, 1100, 1500, 2000], rpp: 68, salesTax: 15, localIncomeTax: 0 },
  { id: "johannesburg", name: "Johannesburg", state: "", stateCode: "", country: "ZA", fmr: [500, 750, 1050, 1400, 1850], rpp: 65, salesTax: 15, localIncomeTax: 0 },
  { id: "nairobi", name: "Nairobi", state: "", stateCode: "", country: "KE", fmr: [450, 650, 900, 1250, 1650], rpp: 58, salesTax: 16, localIncomeTax: 0 },
  { id: "lagos", name: "Lagos", state: "", stateCode: "", country: "NG", fmr: [400, 600, 900, 1300, 1800], rpp: 55, salesTax: 7.5, localIncomeTax: 0 },
  { id: "cairo", name: "Cairo", state: "", stateCode: "", country: "EG", fmr: [350, 550, 800, 1150, 1550], rpp: 52, salesTax: 14, localIncomeTax: 0 },
  { id: "accra", name: "Accra", state: "", stateCode: "", country: "GH", fmr: [400, 600, 850, 1200, 1600], rpp: 55, salesTax: 15, localIncomeTax: 0 },
  { id: "casablanca", name: "Casablanca", state: "", stateCode: "", country: "MA", fmr: [450, 650, 900, 1250, 1650], rpp: 58, salesTax: 20, localIncomeTax: 0 },
  { id: "durban", name: "Durban", state: "", stateCode: "", country: "ZA", fmr: [400, 600, 850, 1150, 1550], rpp: 55, salesTax: 15, localIncomeTax: 0 },
  // ── Europe (additional) ──
  { id: "glasgow", name: "Glasgow", state: "", stateCode: "", country: "GB", fmr: [800, 1100, 1400, 1800, 2250], rpp: 90, salesTax: 20, localIncomeTax: 0 },
  { id: "cologne", name: "Cologne", state: "", stateCode: "", country: "DE", fmr: [950, 1300, 1700, 2200, 2800], rpp: 102, salesTax: 19, localIncomeTax: 0 },
  { id: "rotterdam", name: "Rotterdam", state: "", stateCode: "", country: "NL", fmr: [1200, 1550, 2000, 2550, 3200], rpp: 108, salesTax: 21, localIncomeTax: 0 },
  { id: "krakow", name: "Krakow", state: "", stateCode: "", country: "PL", fmr: [500, 700, 950, 1250, 1600], rpp: 72, salesTax: 23, localIncomeTax: 0 },
  { id: "bucharest", name: "Bucharest", state: "", stateCode: "", country: "RO", fmr: [500, 700, 950, 1250, 1600], rpp: 70, salesTax: 19, localIncomeTax: 0 },
  { id: "belgrade", name: "Belgrade", state: "", stateCode: "", country: "RS", fmr: [400, 550, 750, 1000, 1300], rpp: 62, salesTax: 20, localIncomeTax: 0 },
  { id: "zagreb", name: "Zagreb", state: "", stateCode: "", country: "HR", fmr: [500, 700, 950, 1250, 1600], rpp: 72, salesTax: 25, localIncomeTax: 0 },
  // ── Asia (additional) ──
  { id: "nagoya", name: "Nagoya", state: "", stateCode: "", country: "JP", fmr: [600, 800, 1050, 1400, 1800], rpp: 98, salesTax: 10, localIncomeTax: 0 },
  { id: "chengdu", name: "Chengdu", state: "", stateCode: "", country: "CN", fmr: [550, 800, 1100, 1500, 2000], rpp: 78, salesTax: 13, localIncomeTax: 0 },
  { id: "chennai", name: "Chennai", state: "", stateCode: "", country: "IN", fmr: [250, 400, 600, 850, 1150], rpp: 45, salesTax: 18, localIncomeTax: 0 },
  { id: "hyderabad", name: "Hyderabad", state: "", stateCode: "", country: "IN", fmr: [280, 420, 650, 900, 1200], rpp: 48, salesTax: 18, localIncomeTax: 0 },
  { id: "dhaka", name: "Dhaka", state: "", stateCode: "", country: "BD", fmr: [200, 350, 500, 700, 950], rpp: 38, salesTax: 15, localIncomeTax: 0 },
  { id: "karachi", name: "Karachi", state: "", stateCode: "", country: "PK", fmr: [180, 320, 480, 700, 950], rpp: 36, salesTax: 18, localIncomeTax: 0 },
  { id: "phnom-penh", name: "Phnom Penh", state: "", stateCode: "", country: "KH", fmr: [300, 450, 650, 900, 1200], rpp: 46, salesTax: 10, localIncomeTax: 0 },
  { id: "muscat", name: "Muscat", state: "", stateCode: "", country: "OM", fmr: [700, 950, 1300, 1700, 2200], rpp: 85, salesTax: 5, localIncomeTax: 0 },
  { id: "kuwait-city", name: "Kuwait City", state: "", stateCode: "", country: "KW", fmr: [900, 1200, 1600, 2100, 2700], rpp: 92, salesTax: 0, localIncomeTax: 0 },
  // ── Americas (additional) ──
  { id: "rio-de-janeiro", name: "Rio de Janeiro", state: "", stateCode: "", country: "BR", fmr: [500, 750, 1050, 1400, 1850], rpp: 72, salesTax: 17, localIncomeTax: 0 },
  { id: "guadalajara", name: "Guadalajara", state: "", stateCode: "", country: "MX", fmr: [450, 650, 900, 1250, 1600], rpp: 65, salesTax: 16, localIncomeTax: 0 },
  { id: "monterrey", name: "Monterrey", state: "", stateCode: "", country: "MX", fmr: [550, 800, 1100, 1500, 1950], rpp: 70, salesTax: 16, localIncomeTax: 0 },
  { id: "medellin", name: "Medellín", state: "", stateCode: "", country: "CO", fmr: [300, 450, 650, 900, 1200], rpp: 48, salesTax: 19, localIncomeTax: 0 },
  { id: "calgary", name: "Calgary", state: "", stateCode: "", country: "CA", fmr: [1100, 1450, 1900, 2500, 3100], rpp: 100, salesTax: 5, localIncomeTax: 0 },
  { id: "ottawa", name: "Ottawa", state: "", stateCode: "", country: "CA", fmr: [1050, 1400, 1800, 2350, 2950], rpp: 98, salesTax: 13, localIncomeTax: 0 },
];

function lifestyleDedupeKey(c: CityData): string {
  const n = c.name.toLowerCase().replace(/\s+city$/i, "").trim();
  return c.country === "US" ? `${c.stateCode}|${n}` : `${c.country}|${n}`;
}

const _coreDedupeKeys = new Set(LIFESTYLE_CORE_CITIES.map(lifestyleDedupeKey));

const _coreAndGenerated: CityData[] = [
  ...LIFESTYLE_CORE_CITIES,
  ...GENERATED_LIFESTYLE_CITIES.filter((g) => !_coreDedupeKeys.has(lifestyleDedupeKey(g))),
];

const _priorKeys = new Set(_coreAndGenerated.map(lifestyleDedupeKey));

/** Core + GeoNames-generated + Numbeo top/bottom 100 (expensive / least expensive) global cities. */
export const CITIES: CityData[] = [
  ..._coreAndGenerated,
  ...COL_EXTREME_LIFESTYLE_CITIES.filter((c) => !_priorKeys.has(lifestyleDedupeKey(c))),
];

/**
 * Resolve a city by id for the lifestyle API. Numbeo “extreme” rows share a dedupe key with
 * core/generated cities (e.g. Zurich) and are omitted from `CITIES`, but their ids still exist
 * in `COL_EXTREME_LIFESTYLE_CITIES` — this function finds those too.
 */
export function findLifestyleCityById(id: string): CityData | undefined {
  return (
    CITIES.find((c) => c.id === id) ??
    COL_EXTREME_LIFESTYLE_CITIES.find((c) => c.id === id)
  );
}

/* ── Income dropdown levels ───────────────────────────────────── */

export const INCOME_LEVELS = [
  { value: 20000, label: "$20,000" },
  { value: 30000, label: "$30,000" },
  { value: 40000, label: "$40,000" },
  { value: 50000, label: "$50,000" },
  { value: 60000, label: "$60,000" },
  { value: 70000, label: "$70,000" },
  { value: 80000, label: "$80,000" },
  { value: 90000, label: "$90,000" },
  { value: 100000, label: "$100,000" },
  { value: 150000, label: "$150,000" },
  { value: 200000, label: "$200,000" },
  { value: 250000, label: "$250,000" },
  { value: 300000, label: "$300,000" },
  { value: 350000, label: "$350,000" },
  { value: 400000, label: "$400,000" },
  { value: 500000, label: "$500,000" },
];

/* ── Federal tax brackets 2026 (single filer) ────────────────── */

interface TaxBracket { min: number; max: number; rate: number }

const FEDERAL_BRACKETS: TaxBracket[] = [
  { min: 0, max: 11925, rate: 0.10 },
  { min: 11925, max: 48475, rate: 0.12 },
  { min: 48475, max: 103350, rate: 0.22 },
  { min: 103350, max: 197300, rate: 0.24 },
  { min: 197300, max: 250525, rate: 0.32 },
  { min: 250525, max: 626350, rate: 0.35 },
  { min: 626350, max: Infinity, rate: 0.37 },
];

const STANDARD_DEDUCTION = 15700;

/* ── State income tax (simplified — top marginal / flat) ──────── */

const STATE_TAX: Record<string, { type: "flat" | "graduated"; rates: TaxBracket[] }> = {
  AL: { type: "flat", rates: [{ min: 0, max: Infinity, rate: 0.05 }] },
  AK: { type: "flat", rates: [] },
  AZ: { type: "flat", rates: [{ min: 0, max: Infinity, rate: 0.025 }] },
  CA: { type: "graduated", rates: [
    { min: 0, max: 10412, rate: 0.01 }, { min: 10412, max: 24684, rate: 0.02 },
    { min: 24684, max: 38959, rate: 0.04 }, { min: 38959, max: 54081, rate: 0.06 },
    { min: 54081, max: 68350, rate: 0.08 }, { min: 68350, max: 349137, rate: 0.093 },
    { min: 349137, max: 418961, rate: 0.103 }, { min: 418961, max: 698271, rate: 0.113 },
    { min: 698271, max: Infinity, rate: 0.123 },
  ]},
  CO: { type: "flat", rates: [{ min: 0, max: Infinity, rate: 0.044 }] },
  CT: { type: "flat", rates: [{ min: 0, max: Infinity, rate: 0.05 }] },
  DC: { type: "graduated", rates: [
    { min: 0, max: 10000, rate: 0.04 }, { min: 10000, max: 40000, rate: 0.06 },
    { min: 40000, max: 60000, rate: 0.065 }, { min: 60000, max: 250000, rate: 0.085 },
    { min: 250000, max: 500000, rate: 0.0925 }, { min: 500000, max: 1000000, rate: 0.0975 },
    { min: 1000000, max: Infinity, rate: 0.1075 },
  ]},
  FL: { type: "flat", rates: [] },
  GA: { type: "flat", rates: [{ min: 0, max: Infinity, rate: 0.0549 }] },
  HI: { type: "flat", rates: [{ min: 0, max: Infinity, rate: 0.0825 }] },
  IA: { type: "flat", rates: [{ min: 0, max: Infinity, rate: 0.038 }] },
  ID: { type: "flat", rates: [{ min: 0, max: Infinity, rate: 0.058 }] },
  IL: { type: "flat", rates: [{ min: 0, max: Infinity, rate: 0.0495 }] },
  IN: { type: "flat", rates: [{ min: 0, max: Infinity, rate: 0.0305 }] },
  KS: { type: "flat", rates: [{ min: 0, max: Infinity, rate: 0.057 }] },
  KY: { type: "flat", rates: [{ min: 0, max: Infinity, rate: 0.04 }] },
  LA: { type: "flat", rates: [{ min: 0, max: Infinity, rate: 0.0425 }] },
  MA: { type: "flat", rates: [{ min: 0, max: Infinity, rate: 0.05 }] },
  MD: { type: "graduated", rates: [
    { min: 0, max: 1000, rate: 0.02 }, { min: 1000, max: 2000, rate: 0.03 },
    { min: 2000, max: 3000, rate: 0.04 }, { min: 3000, max: 100000, rate: 0.0475 },
    { min: 100000, max: 125000, rate: 0.05 }, { min: 125000, max: 150000, rate: 0.0525 },
    { min: 150000, max: 250000, rate: 0.055 }, { min: 250000, max: Infinity, rate: 0.0575 },
  ]},
  MI: { type: "flat", rates: [{ min: 0, max: Infinity, rate: 0.0425 }] },
  MN: { type: "graduated", rates: [
    { min: 0, max: 31690, rate: 0.0535 }, { min: 31690, max: 104090, rate: 0.068 },
    { min: 104090, max: 193240, rate: 0.0785 }, { min: 193240, max: Infinity, rate: 0.0985 },
  ]},
  MO: { type: "flat", rates: [{ min: 0, max: Infinity, rate: 0.048 }] },
  NC: { type: "flat", rates: [{ min: 0, max: Infinity, rate: 0.045 }] },
  NE: { type: "graduated", rates: [
    { min: 0, max: 3700, rate: 0.0246 }, { min: 3700, max: 22170, rate: 0.0351 },
    { min: 22170, max: 35730, rate: 0.0501 }, { min: 35730, max: Infinity, rate: 0.0584 },
  ]},
  NM: { type: "graduated", rates: [
    { min: 0, max: 5500, rate: 0.017 }, { min: 5500, max: 11000, rate: 0.032 },
    { min: 11000, max: 16000, rate: 0.047 }, { min: 16000, max: 210000, rate: 0.049 },
    { min: 210000, max: Infinity, rate: 0.059 },
  ]},
  NV: { type: "flat", rates: [] },
  NY: { type: "graduated", rates: [
    { min: 0, max: 8500, rate: 0.04 }, { min: 8500, max: 11700, rate: 0.045 },
    { min: 11700, max: 13900, rate: 0.0525 }, { min: 13900, max: 80650, rate: 0.0585 },
    { min: 80650, max: 215400, rate: 0.0625 }, { min: 215400, max: 1077550, rate: 0.0685 },
    { min: 1077550, max: 5000000, rate: 0.0965 }, { min: 5000000, max: Infinity, rate: 0.109 },
  ]},
  OH: { type: "graduated", rates: [
    { min: 0, max: 26050, rate: 0 }, { min: 26050, max: 100000, rate: 0.02765 },
    { min: 100000, max: Infinity, rate: 0.035 },
  ]},
  OK: { type: "graduated", rates: [
    { min: 0, max: 1000, rate: 0.0025 }, { min: 1000, max: 2500, rate: 0.0075 },
    { min: 2500, max: 3750, rate: 0.0175 }, { min: 3750, max: 4900, rate: 0.0275 },
    { min: 4900, max: 7200, rate: 0.0375 }, { min: 7200, max: Infinity, rate: 0.0475 },
  ]},
  OR: { type: "graduated", rates: [
    { min: 0, max: 4300, rate: 0.0475 }, { min: 4300, max: 10750, rate: 0.0675 },
    { min: 10750, max: 125000, rate: 0.0875 }, { min: 125000, max: Infinity, rate: 0.099 },
  ]},
  PA: { type: "flat", rates: [{ min: 0, max: Infinity, rate: 0.0307 }] },
  RI: { type: "graduated", rates: [
    { min: 0, max: 73450, rate: 0.0375 }, { min: 73450, max: 166950, rate: 0.0475 },
    { min: 166950, max: Infinity, rate: 0.0599 },
  ]},
  SC: { type: "graduated", rates: [
    { min: 0, max: 3460, rate: 0 }, { min: 3460, max: 17330, rate: 0.03 },
    { min: 17330, max: Infinity, rate: 0.064 },
  ]},
  TN: { type: "flat", rates: [] },
  TX: { type: "flat", rates: [] },
  UT: { type: "flat", rates: [{ min: 0, max: Infinity, rate: 0.0465 }] },
  VA: { type: "graduated", rates: [
    { min: 0, max: 3000, rate: 0.02 }, { min: 3000, max: 5000, rate: 0.03 },
    { min: 5000, max: 17000, rate: 0.05 }, { min: 17000, max: Infinity, rate: 0.0575 },
  ]},
  WA: { type: "flat", rates: [] },
  WI: { type: "graduated", rates: [
    { min: 0, max: 14320, rate: 0.035 }, { min: 14320, max: 28640, rate: 0.044 },
    { min: 28640, max: 315310, rate: 0.053 }, { min: 315310, max: Infinity, rate: 0.0765 },
  ]},
  WY: { type: "flat", rates: [] },
};

/* ── Tax computation ──────────────────────────────────────────── */

function bracketTax(taxableIncome: number, brackets: TaxBracket[]): number {
  let tax = 0;
  for (const b of brackets) {
    if (taxableIncome <= b.min) break;
    const taxable = Math.min(taxableIncome, b.max) - b.min;
    tax += taxable * b.rate;
  }
  return tax;
}

export interface TaxBreakdown {
  grossIncome: number;
  federalTax: number;
  stateTax: number;
  localTax: number;
  fica: number;
  totalTax: number;
  netIncome: number;
  effectiveRate: number;
}

export function computeTaxes(grossIncome: number, stateCode: string, localRate: number, country = "US"): TaxBreakdown {
  if (country !== "US") {
    const estimatedRate = 0.30;
    const totalTax = Math.round(grossIncome * estimatedRate);
    return {
      grossIncome,
      federalTax: totalTax,
      stateTax: 0,
      localTax: 0,
      fica: 0,
      totalTax,
      netIncome: grossIncome - totalTax,
      effectiveRate: grossIncome > 0 ? (totalTax / grossIncome) * 100 : 0,
    };
  }

  const federalTaxable = Math.max(0, grossIncome - STANDARD_DEDUCTION);
  const federalTax = bracketTax(federalTaxable, FEDERAL_BRACKETS);

  const stateInfo = STATE_TAX[stateCode];
  const stateTax = stateInfo ? bracketTax(grossIncome, stateInfo.rates) : 0;

  const localTax = grossIncome * (localRate / 100);

  const ssWage = Math.min(grossIncome, 176100);
  const fica = ssWage * 0.0620 + grossIncome * 0.0145;

  const totalTax = federalTax + stateTax + localTax + fica;
  const netIncome = grossIncome - totalTax;
  const effectiveRate = grossIncome > 0 ? (totalTax / grossIncome) * 100 : 0;

  return { grossIncome, federalTax, stateTax, localTax, fica, totalTax, netIncome, effectiveRate };
}

/* ── Budget breakdown ─────────────────────────────────────────── */

/** National monthly baseline per household member (BLS-derived rough averages) */
const BASELINE_MONTHLY = {
  food: 350,
  transportation: 400,
  healthcare: 250,
  utilities: 120,
  insurance: 100,
  personal: 80,
};

export interface BudgetBreakdown {
  taxes: TaxBreakdown;
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
  lifestyleTier: "struggling" | "tight" | "modest" | "comfortable" | "affluent";
  tierColor: string;
}

function bedroomsForHousehold(size: number): number {
  if (size <= 1) return 1;
  if (size <= 2) return 1;
  if (size <= 3) return 2;
  if (size <= 4) return 2;
  return 3;
}

const BR_LABELS = ["Studio", "1 BR", "2 BR", "3 BR", "4 BR"];

export function computeBudget(city: CityData, grossIncome: number, householdSize: number): BudgetBreakdown {
  const taxes = computeTaxes(grossIncome, city.stateCode, city.localIncomeTax, city.country);
  const monthlyNet = taxes.netIncome / 12;

  const brIdx = bedroomsForHousehold(householdSize);
  const rent = city.fmr[brIdx];
  const rentBedrooms = BR_LABELS[brIdx];

  const costScale = city.rpp / 100;
  const sizeScale = 1 + (householdSize - 1) * 0.4;

  const food = Math.round(BASELINE_MONTHLY.food * costScale * sizeScale);
  const transportation = Math.round(BASELINE_MONTHLY.transportation * costScale);
  const healthcare = Math.round(BASELINE_MONTHLY.healthcare * costScale * sizeScale);
  const utilities = Math.round(BASELINE_MONTHLY.utilities * costScale);
  const insurance = Math.round(BASELINE_MONTHLY.insurance * sizeScale);
  const personal = Math.round(BASELINE_MONTHLY.personal * costScale * sizeScale);

  const totalEssentials = rent + food + transportation + healthcare + utilities + insurance + personal;
  const discretionary = Math.max(0, monthlyNet - totalEssentials);

  const discretionaryRatio = monthlyNet > 0 ? discretionary / monthlyNet : 0;
  let lifestyleTier: BudgetBreakdown["lifestyleTier"];
  let tierColor: string;
  if (monthlyNet < totalEssentials * 0.85) {
    lifestyleTier = "struggling"; tierColor = "#ef4444";
  } else if (discretionaryRatio < 0.10) {
    lifestyleTier = "tight"; tierColor = "#f97316";
  } else if (discretionaryRatio < 0.20) {
    lifestyleTier = "modest"; tierColor = "#eab308";
  } else if (discretionaryRatio < 0.35) {
    lifestyleTier = "comfortable"; tierColor = "#22c55e";
  } else {
    lifestyleTier = "affluent"; tierColor = "#3b82f6";
  }

  const savingsCapacity = Math.max(0, discretionary * 0.5);

  return {
    taxes, monthlyNet, rent, rentBedrooms,
    food, transportation, healthcare, utilities, insurance, personal,
    totalEssentials, discretionary, savingsCapacity,
    lifestyleTier, tierColor,
  };
}
