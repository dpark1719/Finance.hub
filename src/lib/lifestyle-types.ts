/**
 * Shared types for the lifestyle calculator.
 */

export interface CityData {
  id: string;
  name: string;
  state: string;
  stateCode: string;
  /** ISO 3166-1 alpha-2 country code */
  country: string;
  /** Monthly rent by bedroom count [studio, 1BR, 2BR, 3BR, 4BR] in USD */
  fmr: [number, number, number, number, number];
  /** Cost-of-living index relative to US national avg (100) */
  rpp: number;
  /** Combined sales / VAT tax rate (%) */
  salesTax: number;
  /** City-level income tax rate (%) — most cities = 0 */
  localIncomeTax: number;
  /**
   * Optional: what geographic area HUD FMR / rent estimate applies to, and where similar
   * rents are realistic (shown in Lifestyle rent breakdown).
   */
  rentAreaNote?: string;
}
