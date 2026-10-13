export type Country = 'India' | 'Bhutan' | 'Nepal' | 'Thailand'
export type Service = 'Package' | 'Visa' | 'Passport' | 'Air ticket'
export const SERVICES: Service[] = ['Package', 'Visa', 'Passport', 'Air ticket']

// All money fields (price, cost, fee, fare, commission) are whole Myanmar kyat (MMK).
export interface Customer { id?: number; name: string; phone: string; township: string; passportExpiry: string }
/** stops: itinerary places in visiting order (names from DESTINATIONS). */
export interface Pkg { id: string; name: string; country: Country; days: number; price: number; cost: number; stops: string[] }
export type BookingStatus = 'enquiry' | 'confirmed' | 'completed' | 'cancelled'
export interface Booking {
  id?: number; customerId: number; packageId: string; destination: string
  departDate: string; pax: number; status: BookingStatus; createdAt: string
}
export interface Case {
  id?: number; customerId: number; kind: string; stage: string
  appliedAt: string; decidedAt?: string; fee: number; cost: number; deadline?: string
}
export interface Ticket {
  id?: number; customerId: number; direction: 'Inbound' | 'Outbound'
  from: string; to: string; airline: string; date: string; fare: number; commission: number
}
export interface Data {
  customers: Customer[]; packages: Pkg[]; bookings: Booking[]
  visas: Case[]; passports: Case[]; tickets: Ticket[]
}

export const VISA_STAGES = ['Enquiry', 'Documents', 'Submitted', 'Approved', 'Rejected', 'Delivered']
export const VISA_KINDS: Country[] = ['India', 'Nepal', 'Thailand', 'Bhutan']
export const PASSPORT_STAGES = ['Enquiry', 'Documents', 'Submitted', 'Ready', 'Collected']
export const PASSPORT_KINDS = ['New', 'Renewal', 'Lost', 'Damaged']

export interface Place { name: string; country: Country | 'Myanmar'; lat: number; lng: number; code?: string }
export const DESTINATIONS: Place[] = [
  // Buddhist circuit (India)
  { name: 'Bodh Gaya', country: 'India', lat: 24.7, lng: 84.99, code: 'GAY' },
  { name: 'Rajgir', country: 'India', lat: 25.03, lng: 85.42 },
  { name: 'Nalanda', country: 'India', lat: 25.14, lng: 85.44 },
  { name: 'Vaishali', country: 'India', lat: 25.99, lng: 85.13 },
  { name: 'Kushinagar', country: 'India', lat: 26.74, lng: 83.89 },
  { name: 'Sravasti', country: 'India', lat: 27.52, lng: 82.05 },
  { name: 'Sarnath', country: 'India', lat: 25.38, lng: 83.02 },
  { name: 'Varanasi', country: 'India', lat: 25.32, lng: 82.97, code: 'VNS' },
  // Northern India (15-day itinerary) and gateways
  { name: 'Delhi', country: 'India', lat: 28.61, lng: 77.21, code: 'DEL' },
  { name: 'Dharamshala', country: 'India', lat: 32.22, lng: 76.32 },
  { name: 'Agra', country: 'India', lat: 27.18, lng: 78.02 },
  { name: 'Lucknow', country: 'India', lat: 26.85, lng: 80.95 },
  { name: 'Kolkata', country: 'India', lat: 22.57, lng: 88.36, code: 'CCU' },
  // Nepal
  { name: 'Lumbini', country: 'Nepal', lat: 27.47, lng: 83.28 },
  { name: 'Kapilavastu', country: 'Nepal', lat: 27.57, lng: 83.05 },
  { name: 'Kathmandu', country: 'Nepal', lat: 27.72, lng: 85.32, code: 'KTM' },
  // Thailand
  { name: 'Bangkok', country: 'Thailand', lat: 13.76, lng: 100.5, code: 'BKK' },
  { name: 'Pattaya', country: 'Thailand', lat: 12.93, lng: 100.88 },
  // Bhutan (supported service; no 2024 demo bookings)
  { name: 'Paro', country: 'Bhutan', lat: 27.43, lng: 89.41, code: 'PBH' },
  { name: 'Thimphu', country: 'Bhutan', lat: 27.47, lng: 89.64 },
  { name: 'Punakha', country: 'Bhutan', lat: 27.59, lng: 89.86 },
]
export const ORIGINS: Place[] = [
  { name: 'Yangon', country: 'Myanmar', lat: 16.87, lng: 96.2, code: 'RGN' },
  // Rakhine is a state; plotted at its capital, Sittwe.
  { name: 'Rakhine', country: 'Myanmar', lat: 20.15, lng: 92.9, code: 'AKY' },
  { name: 'Mandalay', country: 'Myanmar', lat: 21.97, lng: 96.08, code: 'MDL' },
  { name: 'Taunggyi', country: 'Myanmar', lat: 20.78, lng: 97.04 },
  { name: 'Pyay', country: 'Myanmar', lat: 18.82, lng: 95.22 },
]
export const placeByName = (n: string) => [...DESTINATIONS, ...ORIGINS].find((p) => p.name === n)
