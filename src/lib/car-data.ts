export type CarType = "sedan" | "suv" | "truck" | "hatchback" | "luxury" | "sports" | "minivan" | "ev";
export type FuelType = "gas" | "hybrid" | "electric";

export interface CarModel {
  id: string;
  make: string;
  model: string;
  types: CarType[];
  fuel: FuelType;
  msrp: number;
  mpg: number;
  maintenanceTier: "low" | "medium" | "high";
  insuranceTier: "low" | "medium" | "high";
  years: [number, number];
}

export const CAR_TYPES: { value: CarType; label: string }[] = [
  { value: "sedan", label: "Sedan" },
  { value: "suv", label: "SUV / Crossover" },
  { value: "truck", label: "Truck" },
  { value: "hatchback", label: "Hatchback / Wagon" },
  { value: "luxury", label: "Luxury" },
  { value: "sports", label: "Sports" },
  { value: "minivan", label: "Minivan" },
  { value: "ev", label: "Electric (EV)" },
];

export const CARS: CarModel[] = [
  // ── Sedan ──
  { id: "civic", make: "Honda", model: "Civic", types: ["sedan"], fuel: "gas", msrp: 24950, mpg: 36, maintenanceTier: "low", insuranceTier: "low", years: [2016, 2026] },
  { id: "corolla", make: "Toyota", model: "Corolla", types: ["sedan"], fuel: "gas", msrp: 23500, mpg: 35, maintenanceTier: "low", insuranceTier: "low", years: [2014, 2026] },
  { id: "camry", make: "Toyota", model: "Camry", types: ["sedan"], fuel: "gas", msrp: 29500, mpg: 32, maintenanceTier: "low", insuranceTier: "low", years: [2015, 2026] },
  { id: "accord", make: "Honda", model: "Accord", types: ["sedan"], fuel: "gas", msrp: 29990, mpg: 32, maintenanceTier: "low", insuranceTier: "low", years: [2015, 2026] },
  { id: "mazda3-sedan", make: "Mazda", model: "Mazda3 Sedan", types: ["sedan"], fuel: "gas", msrp: 24070, mpg: 33, maintenanceTier: "low", insuranceTier: "low", years: [2017, 2026] },
  { id: "altima", make: "Nissan", model: "Altima", types: ["sedan"], fuel: "gas", msrp: 28900, mpg: 32, maintenanceTier: "low", insuranceTier: "low", years: [2016, 2026] },
  { id: "sonata", make: "Hyundai", model: "Sonata", types: ["sedan"], fuel: "gas", msrp: 28950, mpg: 32, maintenanceTier: "low", insuranceTier: "low", years: [2016, 2026] },
  { id: "elantra", make: "Hyundai", model: "Elantra", types: ["sedan"], fuel: "gas", msrp: 23000, mpg: 37, maintenanceTier: "low", insuranceTier: "low", years: [2017, 2026] },
  { id: "k5", make: "Kia", model: "K5", types: ["sedan"], fuel: "gas", msrp: 28990, mpg: 32, maintenanceTier: "low", insuranceTier: "low", years: [2021, 2026] },
  { id: "forte", make: "Kia", model: "Forte", types: ["sedan"], fuel: "gas", msrp: 20515, mpg: 35, maintenanceTier: "low", insuranceTier: "low", years: [2017, 2026] },
  { id: "sentra", make: "Nissan", model: "Sentra", types: ["sedan"], fuel: "gas", msrp: 21730, mpg: 33, maintenanceTier: "low", insuranceTier: "low", years: [2017, 2026] },
  { id: "jetta", make: "Volkswagen", model: "Jetta", types: ["sedan"], fuel: "gas", msrp: 23425, mpg: 36, maintenanceTier: "medium", insuranceTier: "low", years: [2016, 2026] },
  { id: "impreza-sedan", make: "Subaru", model: "Impreza", types: ["sedan"], fuel: "gas", msrp: 24995, mpg: 32, maintenanceTier: "low", insuranceTier: "low", years: [2017, 2026] },
  { id: "legacy", make: "Subaru", model: "Legacy", types: ["sedan"], fuel: "gas", msrp: 24895, mpg: 32, maintenanceTier: "low", insuranceTier: "low", years: [2015, 2026] },
  { id: "prius", make: "Toyota", model: "Prius", types: ["sedan"], fuel: "hybrid", msrp: 29795, mpg: 57, maintenanceTier: "low", insuranceTier: "low", years: [2016, 2026] },
  // ── SUV / Crossover ──
  { id: "rav4", make: "Toyota", model: "RAV4", types: ["suv"], fuel: "gas", msrp: 31460, mpg: 30, maintenanceTier: "low", insuranceTier: "low", years: [2015, 2026] },
  { id: "crv", make: "Honda", model: "CR-V", types: ["suv"], fuel: "hybrid", msrp: 32550, mpg: 30, maintenanceTier: "low", insuranceTier: "low", years: [2015, 2026] },
  { id: "cx5", make: "Mazda", model: "CX-5", types: ["suv"], fuel: "gas", msrp: 30650, mpg: 29, maintenanceTier: "low", insuranceTier: "low", years: [2017, 2026] },
  { id: "tucson", make: "Hyundai", model: "Tucson", types: ["suv"], fuel: "hybrid", msrp: 31550, mpg: 29, maintenanceTier: "low", insuranceTier: "low", years: [2016, 2026] },
  { id: "sportage", make: "Kia", model: "Sportage", types: ["suv"], fuel: "hybrid", msrp: 31290, mpg: 29, maintenanceTier: "low", insuranceTier: "low", years: [2017, 2026] },
  { id: "tiguan", make: "Volkswagen", model: "Tiguan", types: ["suv"], fuel: "gas", msrp: 31690, mpg: 27, maintenanceTier: "medium", insuranceTier: "low", years: [2018, 2026] },
  { id: "rogue", make: "Nissan", model: "Rogue", types: ["suv"], fuel: "gas", msrp: 31340, mpg: 33, maintenanceTier: "low", insuranceTier: "low", years: [2017, 2026] },
  { id: "forester", make: "Subaru", model: "Forester", types: ["suv"], fuel: "gas", msrp: 34695, mpg: 29, maintenanceTier: "low", insuranceTier: "low", years: [2015, 2026] },
  { id: "outback", make: "Subaru", model: "Outback", types: ["suv", "hatchback"], fuel: "gas", msrp: 33695, mpg: 29, maintenanceTier: "low", insuranceTier: "low", years: [2015, 2026] },
  { id: "highlander", make: "Toyota", model: "Highlander", types: ["suv"], fuel: "hybrid", msrp: 40570, mpg: 24, maintenanceTier: "low", insuranceTier: "medium", years: [2015, 2026] },
  { id: "pilot", make: "Honda", model: "Pilot", types: ["suv"], fuel: "gas", msrp: 40150, mpg: 23, maintenanceTier: "low", insuranceTier: "medium", years: [2016, 2026] },
  { id: "telluride", make: "Kia", model: "Telluride", types: ["suv"], fuel: "gas", msrp: 37990, mpg: 23, maintenanceTier: "low", insuranceTier: "medium", years: [2020, 2026] },
  { id: "palisade", make: "Hyundai", model: "Palisade", types: ["suv"], fuel: "gas", msrp: 37550, mpg: 23, maintenanceTier: "low", insuranceTier: "medium", years: [2020, 2026] },
  { id: "4runner", make: "Toyota", model: "4Runner", types: ["suv"], fuel: "gas", msrp: 42430, mpg: 21, maintenanceTier: "low", insuranceTier: "medium", years: [2015, 2026] },
  { id: "bronco", make: "Ford", model: "Bronco", types: ["suv"], fuel: "gas", msrp: 39725, mpg: 22, maintenanceTier: "medium", insuranceTier: "medium", years: [2021, 2026] },
  { id: "wrangler", make: "Jeep", model: "Wrangler", types: ["suv"], fuel: "gas", msrp: 34195, mpg: 22, maintenanceTier: "medium", insuranceTier: "medium", years: [2015, 2026] },
  { id: "grand-cherokee", make: "Jeep", model: "Grand Cherokee", types: ["suv"], fuel: "gas", msrp: 40935, mpg: 23, maintenanceTier: "medium", insuranceTier: "medium", years: [2015, 2026] },
  { id: "explorer", make: "Ford", model: "Explorer", types: ["suv"], fuel: "gas", msrp: 38095, mpg: 24, maintenanceTier: "medium", insuranceTier: "medium", years: [2016, 2026] },
  { id: "cx50", make: "Mazda", model: "CX-50", types: ["suv"], fuel: "gas", msrp: 31650, mpg: 28, maintenanceTier: "low", insuranceTier: "low", years: [2023, 2026] },
  // ── Truck ──
  { id: "f150", make: "Ford", model: "F-150", types: ["truck"], fuel: "gas", msrp: 38355, mpg: 22, maintenanceTier: "medium", insuranceTier: "medium", years: [2015, 2026] },
  { id: "silverado", make: "Chevrolet", model: "Silverado 1500", types: ["truck"], fuel: "gas", msrp: 38695, mpg: 22, maintenanceTier: "medium", insuranceTier: "medium", years: [2015, 2026] },
  { id: "ram1500", make: "Ram", model: "1500", types: ["truck"], fuel: "gas", msrp: 39840, mpg: 23, maintenanceTier: "medium", insuranceTier: "medium", years: [2015, 2026] },
  { id: "tacoma", make: "Toyota", model: "Tacoma", types: ["truck"], fuel: "gas", msrp: 33350, mpg: 24, maintenanceTier: "low", insuranceTier: "medium", years: [2016, 2026] },
  { id: "tundra", make: "Toyota", model: "Tundra", types: ["truck"], fuel: "gas", msrp: 42290, mpg: 20, maintenanceTier: "low", insuranceTier: "medium", years: [2016, 2026] },
  { id: "colorado", make: "Chevrolet", model: "Colorado", types: ["truck"], fuel: "gas", msrp: 31895, mpg: 24, maintenanceTier: "medium", insuranceTier: "medium", years: [2016, 2026] },
  { id: "ranger", make: "Ford", model: "Ranger", types: ["truck"], fuel: "gas", msrp: 34960, mpg: 24, maintenanceTier: "medium", insuranceTier: "medium", years: [2019, 2026] },
  { id: "frontier", make: "Nissan", model: "Frontier", types: ["truck"], fuel: "gas", msrp: 32650, mpg: 24, maintenanceTier: "low", insuranceTier: "medium", years: [2017, 2026] },
  { id: "maverick", make: "Ford", model: "Maverick", types: ["truck"], fuel: "gas", msrp: 28595, mpg: 30, maintenanceTier: "low", insuranceTier: "low", years: [2022, 2026] },
  { id: "santa-cruz", make: "Hyundai", model: "Santa Cruz", types: ["truck"], fuel: "gas", msrp: 28800, mpg: 27, maintenanceTier: "low", insuranceTier: "low", years: [2022, 2026] },
  { id: "ridgeline", make: "Honda", model: "Ridgeline", types: ["truck"], fuel: "gas", msrp: 41300, mpg: 22, maintenanceTier: "low", insuranceTier: "medium", years: [2017, 2026] },
  // ── Hatchback / Wagon ──
  { id: "civic-hatch", make: "Honda", model: "Civic Hatchback", types: ["hatchback"], fuel: "gas", msrp: 26700, mpg: 36, maintenanceTier: "low", insuranceTier: "low", years: [2017, 2026] },
  { id: "mazda3-hatch", make: "Mazda", model: "Mazda3 Hatchback", types: ["hatchback"], fuel: "gas", msrp: 26070, mpg: 32, maintenanceTier: "low", insuranceTier: "low", years: [2017, 2026] },
  { id: "corolla-hatch", make: "Toyota", model: "Corolla Hatchback", types: ["hatchback"], fuel: "gas", msrp: 24565, mpg: 35, maintenanceTier: "low", insuranceTier: "low", years: [2019, 2026] },
  { id: "golf", make: "Volkswagen", model: "Golf", types: ["hatchback"], fuel: "gas", msrp: 31790, mpg: 32, maintenanceTier: "medium", insuranceTier: "low", years: [2015, 2026] },
  { id: "gti", make: "Volkswagen", model: "Golf GTI", types: ["hatchback", "sports"], fuel: "gas", msrp: 32790, mpg: 30, maintenanceTier: "medium", insuranceTier: "medium", years: [2015, 2026] },
  { id: "impreza-hatch", make: "Subaru", model: "Impreza Hatchback", types: ["hatchback"], fuel: "gas", msrp: 26295, mpg: 32, maintenanceTier: "low", insuranceTier: "low", years: [2017, 2026] },
  { id: "crosstrek", make: "Subaru", model: "Crosstrek", types: ["hatchback", "suv"], fuel: "gas", msrp: 31095, mpg: 29, maintenanceTier: "low", insuranceTier: "low", years: [2018, 2026] },
  { id: "venue", make: "Hyundai", model: "Venue", types: ["hatchback", "suv"], fuel: "gas", msrp: 20985, mpg: 33, maintenanceTier: "low", insuranceTier: "low", years: [2020, 2026] },
  { id: "soul", make: "Kia", model: "Soul", types: ["hatchback"], fuel: "gas", msrp: 21715, mpg: 31, maintenanceTier: "low", insuranceTier: "low", years: [2016, 2026] },
  // ── Luxury ──
  { id: "3series", make: "BMW", model: "3 Series", types: ["luxury", "sedan"], fuel: "gas", msrp: 44900, mpg: 30, maintenanceTier: "high", insuranceTier: "high", years: [2016, 2026] },
  { id: "cclass", make: "Mercedes-Benz", model: "C-Class", types: ["luxury", "sedan"], fuel: "gas", msrp: 47400, mpg: 28, maintenanceTier: "high", insuranceTier: "high", years: [2016, 2026] },
  { id: "a4", make: "Audi", model: "A4", types: ["luxury", "sedan"], fuel: "gas", msrp: 42800, mpg: 29, maintenanceTier: "high", insuranceTier: "high", years: [2017, 2026] },
  { id: "is", make: "Lexus", model: "IS", types: ["luxury", "sedan", "sports"], fuel: "gas", msrp: 41560, mpg: 26, maintenanceTier: "medium", insuranceTier: "medium", years: [2016, 2026] },
  { id: "es", make: "Lexus", model: "ES", types: ["luxury", "sedan"], fuel: "gas", msrp: 43590, mpg: 30, maintenanceTier: "medium", insuranceTier: "medium", years: [2016, 2026] },
  { id: "rx", make: "Lexus", model: "RX", types: ["luxury", "suv"], fuel: "gas", msrp: 50920, mpg: 25, maintenanceTier: "medium", insuranceTier: "medium", years: [2016, 2026] },
  { id: "x3", make: "BMW", model: "X3", types: ["luxury", "suv"], fuel: "gas", msrp: 49600, mpg: 27, maintenanceTier: "high", insuranceTier: "high", years: [2018, 2026] },
  { id: "q5", make: "Audi", model: "Q5", types: ["luxury", "suv"], fuel: "gas", msrp: 47200, mpg: 27, maintenanceTier: "high", insuranceTier: "high", years: [2018, 2026] },
  { id: "glc", make: "Mercedes-Benz", model: "GLC", types: ["luxury", "suv"], fuel: "gas", msrp: 50000, mpg: 27, maintenanceTier: "high", insuranceTier: "high", years: [2018, 2026] },
  { id: "genesis-g70", make: "Genesis", model: "G70", types: ["luxury", "sedan", "sports"], fuel: "gas", msrp: 41150, mpg: 27, maintenanceTier: "medium", insuranceTier: "medium", years: [2019, 2026] },
  { id: "genesis-gv70", make: "Genesis", model: "GV70", types: ["luxury", "suv"], fuel: "gas", msrp: 44750, mpg: 25, maintenanceTier: "medium", insuranceTier: "medium", years: [2022, 2026] },
  { id: "acura-tlx", make: "Acura", model: "TLX", types: ["luxury", "sedan"], fuel: "gas", msrp: 40200, mpg: 27, maintenanceTier: "medium", insuranceTier: "medium", years: [2018, 2026] },
  { id: "acura-rdx", make: "Acura", model: "RDX", types: ["luxury", "suv"], fuel: "gas", msrp: 43850, mpg: 25, maintenanceTier: "medium", insuranceTier: "medium", years: [2018, 2026] },
  { id: "volvo-s60", make: "Volvo", model: "S60", types: ["luxury", "sedan"], fuel: "gas", msrp: 43350, mpg: 29, maintenanceTier: "high", insuranceTier: "medium", years: [2019, 2026] },
  { id: "volvo-xc60", make: "Volvo", model: "XC60", types: ["luxury", "suv"], fuel: "gas", msrp: 46450, mpg: 27, maintenanceTier: "high", insuranceTier: "medium", years: [2018, 2026] },
  { id: "5series", make: "BMW", model: "5 Series", types: ["luxury", "sedan"], fuel: "gas", msrp: 58900, mpg: 28, maintenanceTier: "high", insuranceTier: "high", years: [2017, 2026] },
  { id: "eclass", make: "Mercedes-Benz", model: "E-Class", types: ["luxury", "sedan"], fuel: "gas", msrp: 58950, mpg: 27, maintenanceTier: "high", insuranceTier: "high", years: [2017, 2026] },
  { id: "nx", make: "Lexus", model: "NX", types: ["luxury", "suv"], fuel: "gas", msrp: 42125, mpg: 33, maintenanceTier: "medium", insuranceTier: "medium", years: [2018, 2026] },
  { id: "x5", make: "BMW", model: "X5", types: ["luxury", "suv"], fuel: "gas", msrp: 65200, mpg: 23, maintenanceTier: "high", insuranceTier: "high", years: [2016, 2026] },
  { id: "gle", make: "Mercedes-Benz", model: "GLE", types: ["luxury", "suv"], fuel: "gas", msrp: 62150, mpg: 23, maintenanceTier: "high", insuranceTier: "high", years: [2016, 2026] },
  { id: "q7", make: "Audi", model: "Q7", types: ["luxury", "suv"], fuel: "gas", msrp: 60200, mpg: 22, maintenanceTier: "high", insuranceTier: "high", years: [2017, 2026] },
  { id: "gv80", make: "Genesis", model: "GV80", types: ["luxury", "suv"], fuel: "gas", msrp: 55550, mpg: 22, maintenanceTier: "medium", insuranceTier: "medium", years: [2021, 2026] },
  { id: "xc90", make: "Volvo", model: "XC90", types: ["luxury", "suv"], fuel: "gas", msrp: 58350, mpg: 23, maintenanceTier: "high", insuranceTier: "medium", years: [2016, 2026] },
  // ── Sports ──
  { id: "miata", make: "Mazda", model: "MX-5 Miata", types: ["sports"], fuel: "gas", msrp: 29990, mpg: 30, maintenanceTier: "medium", insuranceTier: "medium", years: [2016, 2026] },
  { id: "gr86", make: "Toyota", model: "GR86", types: ["sports"], fuel: "gas", msrp: 30300, mpg: 28, maintenanceTier: "medium", insuranceTier: "medium", years: [2022, 2026] },
  { id: "brz", make: "Subaru", model: "BRZ", types: ["sports"], fuel: "gas", msrp: 30600, mpg: 28, maintenanceTier: "medium", insuranceTier: "medium", years: [2022, 2026] },
  { id: "mustang", make: "Ford", model: "Mustang", types: ["sports"], fuel: "gas", msrp: 33515, mpg: 26, maintenanceTier: "medium", insuranceTier: "high", years: [2015, 2026] },
  { id: "camaro", make: "Chevrolet", model: "Camaro", types: ["sports"], fuel: "gas", msrp: 32995, mpg: 25, maintenanceTier: "medium", insuranceTier: "high", years: [2016, 2025] },
  { id: "supra", make: "Toyota", model: "GR Supra", types: ["sports", "luxury"], fuel: "gas", msrp: 46390, mpg: 28, maintenanceTier: "high", insuranceTier: "high", years: [2020, 2026] },
  { id: "wrx", make: "Subaru", model: "WRX", types: ["sports", "sedan"], fuel: "gas", msrp: 32155, mpg: 27, maintenanceTier: "medium", insuranceTier: "medium", years: [2015, 2026] },
  { id: "civic-si", make: "Honda", model: "Civic Si", types: ["sports", "sedan"], fuel: "gas", msrp: 30750, mpg: 31, maintenanceTier: "low", insuranceTier: "medium", years: [2017, 2026] },
  { id: "elantra-n", make: "Hyundai", model: "Elantra N", types: ["sports", "sedan"], fuel: "gas", msrp: 34715, mpg: 27, maintenanceTier: "medium", insuranceTier: "medium", years: [2022, 2026] },
  { id: "370z", make: "Nissan", model: "Z", types: ["sports"], fuel: "gas", msrp: 42970, mpg: 22, maintenanceTier: "medium", insuranceTier: "high", years: [2023, 2026] },
  // ── Minivan ──
  { id: "sienna", make: "Toyota", model: "Sienna", types: ["minivan"], fuel: "hybrid", msrp: 38060, mpg: 36, maintenanceTier: "low", insuranceTier: "low", years: [2015, 2026] },
  { id: "odyssey", make: "Honda", model: "Odyssey", types: ["minivan"], fuel: "gas", msrp: 39410, mpg: 22, maintenanceTier: "low", insuranceTier: "low", years: [2015, 2026] },
  { id: "pacifica", make: "Chrysler", model: "Pacifica", types: ["minivan"], fuel: "gas", msrp: 41735, mpg: 22, maintenanceTier: "medium", insuranceTier: "medium", years: [2017, 2026] },
  { id: "carnival", make: "Kia", model: "Carnival", types: ["minivan"], fuel: "gas", msrp: 34595, mpg: 22, maintenanceTier: "low", insuranceTier: "low", years: [2022, 2026] },
  { id: "grand-caravan", make: "Dodge", model: "Grand Caravan", types: ["minivan"], fuel: "gas", msrp: 39595, mpg: 22, maintenanceTier: "medium", insuranceTier: "medium", years: [2021, 2026] },
  // ── Electric (EV) ──
  { id: "model3", make: "Tesla", model: "Model 3", types: ["ev", "sedan", "luxury"], fuel: "electric", msrp: 40240, mpg: 132, maintenanceTier: "low", insuranceTier: "high", years: [2018, 2026] },
  { id: "modely", make: "Tesla", model: "Model Y", types: ["ev", "suv", "luxury"], fuel: "electric", msrp: 45990, mpg: 123, maintenanceTier: "low", insuranceTier: "high", years: [2020, 2026] },
  { id: "bolt-euv", make: "Chevrolet", model: "Bolt EUV", types: ["ev", "suv"], fuel: "electric", msrp: 28795, mpg: 115, maintenanceTier: "low", insuranceTier: "medium", years: [2022, 2025] },
  { id: "ioniq5", make: "Hyundai", model: "Ioniq 5", types: ["ev", "suv"], fuel: "electric", msrp: 44650, mpg: 114, maintenanceTier: "low", insuranceTier: "medium", years: [2022, 2026] },
  { id: "ioniq6", make: "Hyundai", model: "Ioniq 6", types: ["ev", "sedan"], fuel: "electric", msrp: 42450, mpg: 140, maintenanceTier: "low", insuranceTier: "medium", years: [2023, 2026] },
  { id: "ev6", make: "Kia", model: "EV6", types: ["ev", "suv"], fuel: "electric", msrp: 43975, mpg: 117, maintenanceTier: "low", insuranceTier: "medium", years: [2022, 2026] },
  { id: "ev9", make: "Kia", model: "EV9", types: ["ev", "suv"], fuel: "electric", msrp: 56395, mpg: 95, maintenanceTier: "low", insuranceTier: "medium", years: [2024, 2026] },
  { id: "id4", make: "Volkswagen", model: "ID.4", types: ["ev", "suv"], fuel: "electric", msrp: 41545, mpg: 104, maintenanceTier: "medium", insuranceTier: "medium", years: [2021, 2026] },
  { id: "mach-e", make: "Ford", model: "Mustang Mach-E", types: ["ev", "suv"], fuel: "electric", msrp: 44575, mpg: 100, maintenanceTier: "medium", insuranceTier: "medium", years: [2021, 2026] },
  { id: "leaf", make: "Nissan", model: "Leaf", types: ["ev", "hatchback"], fuel: "electric", msrp: 29280, mpg: 111, maintenanceTier: "low", insuranceTier: "low", years: [2016, 2025] },
  { id: "niro-ev", make: "Kia", model: "Niro EV", types: ["ev", "suv"], fuel: "electric", msrp: 40875, mpg: 113, maintenanceTier: "low", insuranceTier: "medium", years: [2019, 2026] },
  { id: "polestar2", make: "Polestar", model: "Polestar 2", types: ["ev", "sedan", "luxury"], fuel: "electric", msrp: 47800, mpg: 107, maintenanceTier: "medium", insuranceTier: "high", years: [2021, 2026] },
  { id: "ariya", make: "Nissan", model: "Ariya", types: ["ev", "suv"], fuel: "electric", msrp: 44950, mpg: 109, maintenanceTier: "low", insuranceTier: "medium", years: [2023, 2026] },
  { id: "solterra", make: "Subaru", model: "Solterra", types: ["ev", "suv"], fuel: "electric", msrp: 44995, mpg: 96, maintenanceTier: "low", insuranceTier: "medium", years: [2023, 2026] },
  { id: "bz4x", make: "Toyota", model: "bZ4X", types: ["ev", "suv"], fuel: "electric", msrp: 43070, mpg: 107, maintenanceTier: "low", insuranceTier: "medium", years: [2023, 2026] },
  { id: "equinox-ev", make: "Chevrolet", model: "Equinox EV", types: ["ev", "suv"], fuel: "electric", msrp: 34995, mpg: 119, maintenanceTier: "low", insuranceTier: "medium", years: [2024, 2026] },
  { id: "blazer-ev", make: "Chevrolet", model: "Blazer EV", types: ["ev", "suv"], fuel: "electric", msrp: 45995, mpg: 98, maintenanceTier: "medium", insuranceTier: "medium", years: [2024, 2026] },
];

/* ── Depreciation ────────────────────────────────────────────── */

const DEPRECIATION_CURVE: Record<number, number> = {
  0: 1.0,
  1: 0.80,
  2: 0.68,
  3: 0.58,
  4: 0.50,
  5: 0.43,
  6: 0.37,
  7: 0.32,
  8: 0.28,
  9: 0.25,
  10: 0.22,
};

const AVG_MILES_PER_YEAR = 12000;

export function usedCarPrice(msrp: number, ageYears: number, mileage?: number): number {
  const clampedAge = Math.max(0, Math.min(10, Math.round(ageYears)));
  const factor = DEPRECIATION_CURVE[clampedAge] ?? 0.20;
  let price = msrp * factor;
  if (mileage !== undefined) {
    const expectedMiles = ageYears * AVG_MILES_PER_YEAR;
    const mileageDiff = mileage - expectedMiles;
    const mileageAdjust = (mileageDiff / 10000) * -0.02;
    price *= Math.max(0.5, 1 + mileageAdjust);
  }
  return Math.round(Math.max(2000, price));
}

/* ── Ownership cost estimators ───────────────────────────────── */

const INSURANCE_BASE: Record<string, number> = { low: 120, medium: 165, high: 220 };
const MAINTENANCE_PCT: Record<string, number> = { low: 0.010, medium: 0.015, high: 0.022 };
const GAS_PRICE_PER_GALLON = 3.50;
const AVG_MONTHLY_MILES = 1000;
const ELECTRICITY_PER_KWH = 0.13;
const EV_KWH_PER_100MI = 30;

export interface OwnershipCosts {
  monthlyPayment: number;
  insurance: number;
  gas: number;
  maintenance: number;
  total: number;
}

export function loanPayment(principal: number, annualRate: number, termMonths: number): number {
  if (principal <= 0) return 0;
  if (termMonths <= 0) return principal;
  const r = annualRate / 100 / 12;
  if (r === 0) return principal / termMonths;
  return (principal * (r * (1 + r) ** termMonths)) / ((1 + r) ** termMonths - 1);
}

export function estimateOwnership(
  carPrice: number,
  downPayment: number,
  annualRate: number,
  termMonths: number,
  car: CarModel,
  isUsed: boolean,
): OwnershipCosts {
  const loanAmt = Math.max(0, carPrice - downPayment);
  const monthlyPayment = loanPayment(loanAmt, annualRate, termMonths);

  const insuranceBase = INSURANCE_BASE[car.insuranceTier];
  const insurance = Math.round(insuranceBase * (carPrice / 30000));

  let gas: number;
  if (car.types.includes("ev")) {
    gas = Math.round((AVG_MONTHLY_MILES / 100) * EV_KWH_PER_100MI * ELECTRICITY_PER_KWH);
  } else {
    gas = car.mpg > 0 ? Math.round((AVG_MONTHLY_MILES / car.mpg) * GAS_PRICE_PER_GALLON) : 150;
  }

  const maintPct = MAINTENANCE_PCT[car.maintenanceTier];
  const ageMultiplier = isUsed ? 1.3 : 1.0;
  const maintenance = Math.round((carPrice * maintPct * ageMultiplier) / 12);

  return {
    monthlyPayment: Math.round(monthlyPayment),
    insurance,
    gas,
    maintenance,
    total: Math.round(monthlyPayment) + insurance + gas + maintenance,
  };
}

/* ── Tier calculation ────────────────────────────────────────── */

export type CreditTier = "excellent" | "good" | "fair" | "poor";

const RATES: Record<CreditTier, { new: number; used: number }> = {
  excellent: { new: 5.5, used: 7.0 },
  good: { new: 7.0, used: 9.0 },
  fair: { new: 10.0, used: 14.0 },
  poor: { new: 14.0, used: 20.0 },
};

export function getRate(credit: CreditTier, isUsed: boolean): number {
  return isUsed ? RATES[credit].used : RATES[credit].new;
}

export interface AffordabilityTier {
  label: string;
  color: string;
  maxCarPrice: number;
  maxMonthlyPayment: number;
  loanAmount: number;
  rate: number;
}

export function computeTiers(
  annualIncome: number,
  monthlyDebts: number,
  downPayment: number,
  credit: CreditTier,
  termMonths: number,
): AffordabilityTier[] {
  const gross = annualIncome;
  const monthly = gross / 12;
  const rate = RATES[credit].new;
  const r = rate / 100 / 12;

  const maxLoanForPayment = (maxPay: number) => {
    if (r === 0) return maxPay * termMonths;
    return (maxPay * ((1 + r) ** termMonths - 1)) / (r * (1 + r) ** termMonths);
  };

  const tiers: [string, string, number, number][] = [
    ["Saving", "#22c55e", 0.10, 0.35],
    ["Recommended", "#3b82f6", 0.15, 0.50],
    ["Premium", "#f59e0b", 0.20, 0.75],
  ];

  return tiers.map(([label, color, paymentPct, incomePct]) => {
    const maxMonthlyPayment = Math.max(0, monthly * paymentPct - monthlyDebts * 0.3);
    const loanFromPayment = maxLoanForPayment(maxMonthlyPayment);
    const priceFromIncome = gross * incomePct;
    const maxCarPrice = Math.round(Math.min(loanFromPayment + downPayment, priceFromIncome));
    const loanAmount = Math.max(0, maxCarPrice - downPayment);
    return { label, color, maxCarPrice, maxMonthlyPayment: Math.round(maxMonthlyPayment), loanAmount: Math.round(loanAmount), rate };
  });
}

/* ── Helpers ──────────────────────────────────────────────────── */

export function uniqueMakes(): string[] {
  const set = new Set(CARS.map((c) => c.make));
  return [...set].sort();
}
