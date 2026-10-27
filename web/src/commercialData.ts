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
  status?: 'Keşif' | 'Planlama' | 'Planlandı' | 'Uygulamada' | 'Tamamlandı'
  assignedTo?: string
  siteAddress?: string
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
  approvalReason?: string
  revision?: number
  assignedTo?: string
  projectAddress?: string
}

export type InventoryItem = {
  id: string
  sku: string
  name: string
  unit: string
  onHand: number
  minimum: number
  unitCost: number
}

export type StockMovement = {
  id: string
  itemId: string
  itemName: string
  type: 'Giriş' | 'Çıkış' | 'Düzeltme'
  quantity: number
  unit: string
  reference: string
  note: string
  createdAt: string
}

export type PurchaseOrder = {
  id: string
  number: string
  supplier: string
  itemId: string
  itemName: string
  quantity: number
  unit: string
  unitCost: number
  status: 'Taslak' | 'Sipariş verildi' | 'Teslim alındı' | 'İptal'
  expectedAt: string
  createdAt: string
}

export type Receivable = {
  id: string
  quoteId: string
  quoteNumber: string
  customerName: string
  amount: number
  paidAmount: number
  currency: string
  dueAt: string
  createdAt: string
}

export type ProjectUpdate = {
  id: string
  projectId: string
  projectName: string
  author: string
  note: string
  createdAt: string
}

export type CustomerActivity = {
  id: string
  customerId: string
  customerName: string
  type: 'Görüşme' | 'E-posta' | 'Not'
  note: string
  createdAt: string
}

export type AuditEvent = {
  id: string
  actor: string
  action: string
  target: string
  detail: string
  createdAt: string
}

export type ProductSystem = {
  id: string
  code: string
  name: string
  description: string
  layers: string
  coverageKgPerM2: number
  materialCostPerM2: number
  laborCostPerM2: number
  isActive: boolean
}

const initialCustomers: CommercialCustomer[] = [
  { id: 'customer-dora', name: 'Dora Lojistik', contact: 'Selin Aksoy', email: 'selin.aksoy@doralojistik.com', phone: '+90 212 555 01 24', city: 'İstanbul', status: 'Aktif', dealerDiscountPercent: 10, retailDiscountPercent: 5, personalDiscountPercent: 0 },
  { id: 'customer-atlas', name: 'Atlas Gıda', contact: 'Murat Demir', email: 'murat.demir@atlasgida.com', phone: '+90 262 555 02 18', city: 'Kocaeli', status: 'Aktif', dealerDiscountPercent: 12, retailDiscountPercent: 5, personalDiscountPercent: 2 },
  { id: 'customer-mavi', name: 'Mavi Makine', contact: 'Burak Kaya', email: 'burak.kaya@mavimakine.com', phone: '+90 224 555 03 42', city: 'Bursa', status: 'Teklif aşaması', dealerDiscountPercent: 10, retailDiscountPercent: 5, personalDiscountPercent: 0 },
  { id: 'customer-kuzey', name: 'Kuzey Depo', contact: 'Aslı Özkan', email: 'asli.ozkan@kuzeydepo.com', phone: '+90 312 555 04 16', city: 'Ankara', status: 'Pasif', dealerDiscountPercent: 10, retailDiscountPercent: 5, personalDiscountPercent: 0 },
]

const initialProjects: CommercialProject[] = [
  { id: 'project-dora-depo', customerId: 'customer-dora', name: 'Dora Lojistik depo kaplaması', areaM2: 1200, status: 'Planlandı', assignedTo: 'Saha Personeli', dealerDiscountPercent: null, retailDiscountPercent: null, personalDiscountPercent: null },
  { id: 'project-atlas-uretim', customerId: 'customer-atlas', name: 'Atlas Gıda üretim alanı', areaM2: 840, status: 'Uygulamada', assignedTo: 'Saha Personeli', dealerDiscountPercent: 14, retailDiscountPercent: null, personalDiscountPercent: 3 },
  { id: 'project-mavi-fabrika', customerId: 'customer-mavi', name: 'Mavi Makine fabrika zemini', areaM2: 2400, status: 'Keşif', dealerDiscountPercent: null, retailDiscountPercent: null, personalDiscountPercent: null },
]

const initialInventory: InventoryItem[] = [
  { id: 'item-resin', sku: 'EPX-RES-001', name: 'Epoksi reçine A', unit: 'kg', onHand: 420, minimum: 120, unitCost: 185 },
  { id: 'item-hardener', sku: 'PU-HAR-002', name: 'PU sertleştirici B', unit: 'kg', onHand: 84, minimum: 100, unitCost: 245 },
  { id: 'item-silica', sku: 'AGG-SIL-004', name: 'Silis agregası 0.4 mm', unit: 'kg', onHand: 1240, minimum: 300, unitCost: 12 },
  { id: 'item-pigment', sku: 'PIG-RAL-735', name: 'Pigment RAL 7035', unit: 'kg', onHand: 18, minimum: 25, unitCost: 310 },
]

const initialProductSystems: ProductSystem[] = [
  { id: 'system-epoxy', code: 'KAT-EP 302', name: 'KAT-EP 302 · Self-leveling epoksi', description: 'Self-leveling epoksi sistem', layers: 'Astar · Ara kat · Son kat', coverageKgPerM2: 1.8, materialCostPerM2: 485, laborCostPerM2: 175, isActive: true },
  { id: 'system-pu', code: 'KAT-PU 180', name: 'KAT-PU 180 · Hijyenik poliüretan', description: 'Hijyenik poliüretan sistem', layers: 'Astar · PU ara kat · Top coat', coverageKgPerM2: 2.2, materialCostPerM2: 620, laborCostPerM2: 210, isActive: true },
  { id: 'system-industry', code: 'KAT-IND 450', name: 'KAT-IND 450 · Ağır yük endüstriyel', description: 'Ağır yük endüstriyel sistem', layers: 'Primer · Harç · Seal coat', coverageKgPerM2: 3.5, materialCostPerM2: 710, laborCostPerM2: 260, isActive: true },
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
  saveList('hutec_customers', customers)
}

export function loadProjects() {
  return readList('hutec_projects', initialProjects)
}

export function saveProjects(projects: CommercialProject[]) {
  saveList('hutec_projects', projects)
}

export function loadQuotes() {
  return readList<SavedQuote>('hutec_quotes', [])
}

export function saveQuote(quote: SavedQuote) {
  const quotes = loadQuotes()
  saveList('hutec_quotes', [quote, ...quotes])
}

export function saveQuotes(quotes: SavedQuote[]) {
  saveList('hutec_quotes', quotes)
}

function saveList<T>(key: string, value: T[]) {
  localStorage.setItem(key, JSON.stringify(value))
  window.dispatchEvent(new Event('hutec-demo-data-changed'))
}

export function loadInventory() {
  return readList('hutec_inventory', initialInventory)
}

export function saveInventory(items: InventoryItem[]) {
  saveList('hutec_inventory', items)
}

export function loadProductSystems() {
  return readList('hutec_product_systems', initialProductSystems)
}

export function saveProductSystems(systems: ProductSystem[]) {
  saveList('hutec_product_systems', systems)
}

export function loadStockMovements() {
  return readList<StockMovement>('hutec_stock_movements', [])
}

export function saveStockMovements(movements: StockMovement[]) {
  saveList('hutec_stock_movements', movements)
}

export function loadPurchaseOrders() {
  return readList<PurchaseOrder>('hutec_purchase_orders', [])
}

export function savePurchaseOrders(orders: PurchaseOrder[]) {
  saveList('hutec_purchase_orders', orders)
}

export function loadReceivables() {
  return readList<Receivable>('hutec_receivables', [])
}

export function saveReceivables(receivables: Receivable[]) {
  saveList('hutec_receivables', receivables)
}

export function loadProjectUpdates() {
  return readList<ProjectUpdate>('hutec_project_updates', [])
}

export function saveProjectUpdates(updates: ProjectUpdate[]) {
  saveList('hutec_project_updates', updates)
}

export function loadCustomerActivities() {
  return readList<CustomerActivity>('hutec_customer_activities', [])
}

export function saveCustomerActivities(activities: CustomerActivity[]) {
  saveList('hutec_customer_activities', activities)
}

export function loadAuditEvents() {
  return readList<AuditEvent>('hutec_audit_events', [])
}

export function recordAudit(action: string, target: string, detail: string, actor = 'Demo Kurucu') {
  const event: AuditEvent = { id: crypto.randomUUID(), actor, action, target, detail, createdAt: new Date().toISOString() }
  saveList('hutec_audit_events', [event, ...loadAuditEvents()].slice(0, 500))
}

export function refreshDemoData() {
  window.dispatchEvent(new Event('hutec-demo-data-changed'))
}