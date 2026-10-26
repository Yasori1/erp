export type DiscountRates = {
  dealerDiscountPercent: number
  retailDiscountPercent: number
  personalDiscountPercent: number
}

export type CommercialCustomer = DiscountRates & {
  id: string
  name: string
  contact: string
  email: string
  phone: string
  city: string
  status: string
}

export type CommercialProject = {
  id: string
  customerId: string
  name: string
  areaM2: number
  startDate?: string
  dealerDiscountPercent: number | null
  retailDiscountPercent: number | null
  personalDiscountPercent: number | null
}

export type SavedQuote = {
  id: string
  quoteNumber: string
  customerId: string
  projectId: string
  customerName: string
  contactEmail: string
  contactPhone: string
  productSystemName: string
  areaM2: number
  currency: string
  salesChannel: 'Dealer' | 'Retail'
  baseTotal: number
  channelDiscountPercent: number
  personalDiscountPercent: number
  total: number
  status: string
  createdAt: string
}

const initialCustomers: CommercialCustomer[] = [
  { id: 'customer-dora', name: 'Dora Lojistik', contact: 'Selin Aksoy', email: 'selin.aksoy@doralojistik.com', phone: '+90 212 555 01 24', city: 'İstanbul', status: 'Aktif', dealerDiscountPercent: 10, retailDiscountPercent: 5, personalDiscountPercent: 0 },
  { id: 'customer-atlas', name: 'Atlas Gıda', contact: 'Murat Demir', email: 'murat.demir@atlasgida.com', phone: '+90 262 555 02 18', city: 'Kocaeli', status: 'Aktif', dealerDiscountPercent: 12, retailDiscountPercent: 5, personalDiscountPercent: 2 },
  { id: 'customer-mavi', name: 'Mavi Makine', contact: 'Burak Kaya', email: 'burak.kaya@mavimakine.com', phone: '+90 224 555 03 42', city: 'Bursa', status: 'Teklif aşaması', dealerDiscountPercent: 10, retailDiscountPercent: 5, personalDiscountPercent: 0 },
  { id: 'customer-kuzey', name: 'Kuzey Depo', contact: 'Aslı Özkan', email: 'asli.ozkan@kuzeydepo.com', phone: '+90 312 555 04 16', city: 'Ankara', status: 'Pasif', dealerDiscountPercent: 10, retailDiscountPercent: 5, personalDiscountPercent: 0 },
]

const initialProjects: CommercialProject[] = [
  { id: 'project-dora-depo', customerId: 'customer-dora', name: 'Dora Lojistik depo kaplaması', areaM2: 1200, dealerDiscountPercent: null, retailDiscountPercent: null, personalDiscountPercent: null },
  { id: 'project-atlas-uretim', customerId: 'customer-atlas', name: 'Atlas Gıda üretim alanı', areaM2: 840, dealerDiscountPercent: 14, retailDiscountPercent: null, personalDiscountPercent: 3 },
  { id: 'project-mavi-fabrika', customerId: 'customer-mavi', name: 'Mavi Makine fabrika zemini', areaM2: 2400, dealerDiscountPercent: null, retailDiscountPercent: null, personalDiscountPercent: null },
]

function readList<T>(key: string, fallback: T[]): T[] {
  try {
    const stored = localStorage.getItem(key)
    if (!stored) return fallback
    const parsed: unknown = JSON.parse(stored)
    return Array.isArray(parsed) ? parsed as T[] : fallback
  } catch {
    return fallback
  }
}

export function loadCustomers() {
  return readList('hutec_customers', initialCustomers)
}

export function saveCustomers(customers: CommercialCustomer[]) {
  localStorage.setItem('hutec_customers', JSON.stringify(customers))
}

export function loadProjects() {
  return readList('hutec_projects', initialProjects)
}

export function saveProjects(projects: CommercialProject[]) {
  localStorage.setItem('hutec_projects', JSON.stringify(projects))
}

export function loadQuotes() {
  return readList<SavedQuote>('hutec_quotes', [])
}

export function saveQuote(quote: SavedQuote) {
  const quotes = loadQuotes()
  localStorage.setItem('hutec_quotes', JSON.stringify([quote, ...quotes]))
}