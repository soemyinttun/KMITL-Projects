/**
 * Inputs for the 2024 demo dataset. Every price, cost and fee here is an ESTIMATE in Myanmar kyat;
 * replace with SSM Travel & Tours' real figures and re-run `npm run generate:dataset`.
 */
import type { Pkg } from '../../src/types.ts'

export const YEAR = 2024
/** Total profit (price − cost) across all services for the year, in kyat. */
export const TARGET_PROFIT = 15_302_000
export const LAKH = 100_000
/** Display-only exchange-rate estimate, MMK per USD. */
export const FX_ESTIMATE = 4500

/** Share of the year's profit earned in each month (%), Jan..Dec. Peak: Apr, May, Sep–Dec. */
export const MONTH_WEIGHTS = [4, 4, 5, 13, 12, 3, 3, 4, 11, 14, 14, 13]
export const PEAK_MONTHS = [4, 5, 9, 10, 11, 12]

/** Per-month profit shares by service. Packages fill toward the cap (~76% in practice); air tickets take the remainder. */
export const PACKAGE_SHARE_CAP = 0.84
export const PASSPORT_SHARE = 0.06
export const VISA_SHARE = 0.03

export const PACKAGES: Pkg[] = [
  {
    id: 'IN5', name: 'India 5-Day · Bodh Gaya', country: 'India', days: 5, price: 1_800_000, cost: 1_692_000,
    stops: ['Bodh Gaya', 'Rajgir', 'Nalanda'],
  },
  {
    id: 'IN8', name: 'India 8-Day · Buddhist Circuit', country: 'India', days: 8, price: 2_800_000, cost: 2_632_000,
    stops: ['Bodh Gaya', 'Rajgir', 'Nalanda', 'Vaishali', 'Kushinagar', 'Lumbini', 'Kapilavastu', 'Sravasti', 'Sarnath', 'Varanasi'],
  },
  {
    id: 'IN12', name: 'India 12-Day · Kathmandu to Varanasi', country: 'India', days: 12, price: 3_800_000, cost: 3_572_000,
    stops: ['Kathmandu', 'Lumbini', 'Sravasti', 'Kushinagar', 'Vaishali', 'Rajgir', 'Bodh Gaya', 'Sarnath', 'Varanasi'],
  },
  {
    id: 'IN15', name: 'India 15-Day · Dharamshala & Circuit', country: 'India', days: 15, price: 4_800_000, cost: 4_512_000,
    stops: ['Delhi', 'Dharamshala', 'Agra', 'Lucknow', 'Sravasti', 'Lumbini', 'Kushinagar', 'Vaishali', 'Nalanda', 'Rajgir', 'Bodh Gaya', 'Varanasi', 'Sarnath'],
  },
  {
    id: 'TH5', name: 'Thailand 5-Day · Bangkok & Pattaya', country: 'Thailand', days: 5, price: 1_500_000, cost: 1_410_000,
    stops: ['Bangkok', 'Pattaya'],
  },
]

/** Booking's headline destination (shown in lists and the Revenue "Destination" view). */
export const MAIN_DESTINATION: Record<string, string> = {
  IN5: 'Bodh Gaya', IN8: 'Bodh Gaya', IN12: 'Lumbini', IN15: 'Dharamshala', TH5: 'Bangkok',
}

/**
 * Order India packages are offered in each month (repeating). Yields roughly 8-day ≈ 12-day > 5-day > 15-day.
 */
export const INDIA_PACKAGE_BAG = ['IN8', 'IN12', 'IN5', 'IN8', 'IN12', 'IN15', 'IN8', 'IN12', 'IN5', 'IN12', 'IN8']

/** The two Thailand trips of the year: [month, pax]. April = Songkran/Thingyan, October = Thadingyut holidays. */
export const THAILAND_TRIPS: [number, number][] = [[4, 4], [10, 5]]

/** Customer origins and how many customers come from each (ranked Yangon > Rakhine > Mandalay > Taunggyi > Pyay). */
export const ORIGIN_CUSTOMERS: [string, number][] = [['Yangon', 32], ['Rakhine', 14], ['Mandalay', 10], ['Taunggyi', 8], ['Pyay', 6]]
/** Which origin each successive customer comes from (repeating, 25 slots = 11/5/4/3/2 ≈ 44/20/16/12/8%). */
export const ORIGIN_CYCLE = [
  'Yangon', 'Rakhine', 'Yangon', 'Mandalay', 'Yangon', 'Taunggyi', 'Yangon', 'Rakhine', 'Yangon', 'Pyay',
  'Yangon', 'Mandalay', 'Yangon', 'Rakhine', 'Yangon', 'Taunggyi', 'Yangon', 'Mandalay', 'Rakhine', 'Yangon',
  'Mandalay', 'Rakhine', 'Taunggyi', 'Yangon', 'Pyay',
]

/** Visa services: [kind, fee charged, cost (government fee + processing)]; profit = fee − cost. */
export const VISA_TYPES: [string, number, number][] = [
  ['India', 160_000, 145_000], // India e-Visa
  ['India', 160_000, 145_000],
  ['India', 160_000, 145_000],
  ['Nepal', 190_000, 172_000], // Nepal visa (Lumbini / Kathmandu legs)
]
/** Passport services: [kind, fee charged, cost]. */
export const PASSPORT_TYPES: [string, number, number][] = [
  ['Renewal', 180_000, 145_000],
  ['New', 220_000, 180_000],
  ['Renewal', 180_000, 145_000],
  ['Lost', 260_000, 215_000],
  ['Damaged', 240_000, 200_000],
]

/** Stand-alone air tickets sold (package prices already include flights). Fares one-way, kyat. */
export const TICKET_ROUTES: { from: string; to: string; direction: 'Inbound' | 'Outbound'; airline: string; fare: number }[] = [
  { from: 'Yangon', to: 'Bodh Gaya', direction: 'Outbound', airline: 'Myanmar Airways Intl', fare: 900_000 },
  { from: 'Yangon', to: 'Kolkata', direction: 'Outbound', airline: 'IndiGo', fare: 800_000 },
  { from: 'Yangon', to: 'Delhi', direction: 'Outbound', airline: 'Air India', fare: 1_300_000 },
  { from: 'Varanasi', to: 'Yangon', direction: 'Inbound', airline: 'Air India', fare: 1_100_000 },
  { from: 'Yangon', to: 'Kathmandu', direction: 'Outbound', airline: 'Thai Airways', fare: 1_600_000 },
  { from: 'Kolkata', to: 'Yangon', direction: 'Inbound', airline: 'IndiGo', fare: 800_000 },
  { from: 'Yangon', to: 'Bangkok', direction: 'Outbound', airline: 'Bangkok Airways', fare: 650_000 },
  { from: 'Bodh Gaya', to: 'Yangon', direction: 'Inbound', airline: 'Myanmar Airways Intl', fare: 900_000 },
]

export const MALE_PREFIX = ['U', 'Ko']
export const FEMALE_PREFIX = ['Daw', 'Ma']
export const MALE_SYLLABLES = ['Aung', 'Kyaw', 'Zaw', 'Htet', 'Naing', 'Win', 'Myo', 'Thant', 'Soe', 'Thura', 'Ye', 'Lin', 'Hein', 'Nay', 'Phyo', 'Min', 'Tun', 'Zin', 'Oo', 'Hla']
export const FEMALE_SYLLABLES = ['Khin', 'Su', 'Hnin', 'May', 'Thiri', 'Ei', 'Phyu', 'Nandar', 'Moe', 'Yin', 'Thandar', 'Wai', 'Mon', 'Myat', 'Nwe', 'Cho', 'Sandar', 'Thet', 'Hlaing', 'Aye']
