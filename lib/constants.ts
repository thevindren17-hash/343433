export const BRANDS = [
  "Apple",
  "Samsung",
  "Honor",
  "OPPO",
  "Xiaomi",
  "OnePlus",
  "Nothing Phone",
  "Huawei",
  "Google Pixel",
  "Asus",
  "Nokia",
  "Sony",
  "LG",
  "Realme",
  "Vivo",
] as const;

export const BRANCHES = [
  "Ang Mo Kio",
  "Bedok",
  "Bishan",
  "Boon Lay",
  "Bukit Panjang",
  "Chinatown",
  "Geylang",
  "Hougang",
  "Jurong",
  "Marine Parade",
  "Pasir Ris",
  "Potong Pasir",
  "Punggol",
  "Serangoon",
  "Tampines",
  "Woodlands",
  "Yishun",
] as const;

export type Brand = (typeof BRANDS)[number];
export type Branch = (typeof BRANCHES)[number];

export const MISTER_MOBILE_UEN = "200814549W";

// Pricing multipliers for the "Pricing Power" calculation
export const PRICING_MULTIPLIERS = {
  screen_status: {
    Flawless: 1.0,
    Scratched: 0.85,
    Cracked: 0.62,
  },
  battery_percentage: {
    excellent: { min: 85, multiplier: 1.0 },
    good: { min: 70, multiplier: 0.92 },
    fair: { min: 55, multiplier: 0.82 },
    poor: { min: 0, multiplier: 0.68 },
  },
  lock_status: {
    unlocked: 1.0,
    locked: 0.60,
  },
  oem_verification: {
    oem: 1.0,
    non_oem: 0.90,
  },
  functionality: {
    deduction_per_failure: 0.05,
  },
  // "Pricing Power" — bulk channel advantage over C2C platforms
  pricing_power_premium: 1.15,
  // Quote valid for 48 hours
  quote_validity_hours: 48,
} as const;
