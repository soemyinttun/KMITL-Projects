export type Country = 'India' | 'Bhutan'
export type Service = 'Package' | 'Visa' | 'Passport' | 'Air ticket'
export const SERVICES: Service[] = ['Package', 'Visa', 'Passport', 'Air ticket']

export interface Customer { id?: number; name: string; phone: string; township: string; passportExpiry: string }
export interface Pkg { id: string; name: string; country: Country; days: number; price: number; cost: number }
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
export const PASSPORT_STAGES = ['Enquiry', 'Documents', 'Submitted', 'Ready', 'Collected']
export const PASSPORT_KINDS = ['New', 'Renewal', 'Lost', 'Damaged']

export interface Place { name: string; country: Country | 'Myanmar'; lat: number; lng: number; code?: string }
export const DESTINATIONS: Place[] = [
  { name: 'Delhi', country: 'India', lat: 28.61, lng: 77.21, code: 'DEL' },
  { name: 'Agra', country: 'India', lat: 27.18, lng: 78.02 },
  { name: 'Jaipur', country: 'India', lat: 26.91, lng: 75.79 },
  { name: 'Varanasi', country: 'India', lat: 25.32, lng: 82.97 },
  { name: 'Bodh Gaya', country: 'India', lat: 24.7, lng: 84.99 },
  { name: 'Kolkata', country: 'India', lat: 22.57, lng: 88.36, code: 'CCU' },
  { name: 'Darjeeling', country: 'India', lat: 27.04, lng: 88.26, code: 'IXB' },
  { name: 'Mumbai', country: 'India', lat: 19.08, lng: 72.88 },
  { name: 'Goa', country: 'India', lat: 15.5, lng: 73.83 },
  { name: 'Kochi', country: 'India', lat: 9.93, lng: 76.27 },
  { name: 'Paro', country: 'Bhutan', lat: 27.43, lng: 89.41, code: 'PBH' },
  { name: 'Thimphu', country: 'Bhutan', lat: 27.47, lng: 89.64 },
  { name: 'Punakha', country: 'Bhutan', lat: 27.59, lng: 89.86 },
  { name: 'Bumthang', country: 'Bhutan', lat: 27.55, lng: 90.75 },
]
export const ORIGINS: Place[] = [
  { name: 'Yangon', country: 'Myanmar', lat: 16.87, lng: 96.2, code: 'RGN' },
  { name: 'Mandalay', country: 'Myanmar', lat: 21.97, lng: 96.08, code: 'MDL' },
  { name: 'Naypyidaw', country: 'Myanmar', lat: 19.76, lng: 96.08, code: 'NYT' },
  { name: 'Taunggyi', country: 'Myanmar', lat: 20.78, lng: 97.04 },
  { name: 'Mawlamyine', country: 'Myanmar', lat: 16.49, lng: 97.63 },
  { name: 'Bago', country: 'Myanmar', lat: 17.34, lng: 96.48 },
  { name: 'Pathein', country: 'Myanmar', lat: 16.78, lng: 94.73 },
]
export const placeByName = (n: string) => [...DESTINATIONS, ...ORIGINS].find((p) => p.name === n)
