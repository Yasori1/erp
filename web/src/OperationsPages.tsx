import { useEffect, useState, type FormEvent } from 'react'
import { ArrowDownToLine, Check, CircleDollarSign, Plus, Wallet } from 'lucide-react'
import { loadInventory, loadProductSystems, loadPurchaseOrders, loadQuotes, loadReceivables, loadStockMovements, recordAudit, saveInventory, saveProductSystems, savePurchaseOrders, saveReceivables, saveStockMovements, type ProductSystem, type PurchaseOrder, type Receivable, type StockMovement } from './commercialData'
import './business-pages.css'

type InventoryTab = 'stock' | 'purchase'
type ExchangeRate = { code: string; name: string; value: number; updatedAt: string }
const ratesKey = 'hutec_demo_exchange_rates'
const defaultRates: ExchangeRate[] = [
  { code: 'USD', name: 'ABD doları', value: 33.982, updatedAt: '' },
  { code: 'EUR', name: 'Euro', value: 37.452, updatedAt: '' },
  { code: 'GBP', name: 'İngiliz sterlini', value: 44.318, updatedAt: '' },
]

export function ProductSystemsPage() {
  const [systems, setSystems] = useState(loadProductSystems)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ code: '', name: '', description: '', layers: '', coverage: '', materialCost: '', laborCost: '' })
  const [error, setError] = useState('')

  useEffect(() => {
    const refresh = () => setSystems(loadProductSystems())
    window.addEventListener('hutec-demo-data-changed', refresh)
    return () => window.removeEventListener('hutec-demo-data-changed', refresh)
  }, [])

  function createSystem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const code = form.code.trim().toUpperCase()
    if (systems.some(system => system.code.toLowerCase() === code.toLowerCase())) {
      setError('Bu sistem kodu zaten kullanılıyor.')
      return
    }
    const system: ProductSystem = { id: crypto.randomUUID(), code, name: `${code} · ${form.name.trim()}`, description: form.description.trim(), layers: form.layers.trim(), coverageKgPerM2: Number(form.coverage), materialCostPerM2: Number(form.materialCost), laborCostPerM2: Number(form.laborCost), isActive: true }
    const next = [system, ...systems]
    saveProductSystems(next)
    recordAudit('Ürün sistemi oluşturuldu', system.code, `${system.name} · ${system.materialCostPerM2 + system.laborCostPerM2} TRY/m²`)
    setSystems(next)
    setForm({ code: '', name: '', description: '', layers: '', coverage: '', materialCost: '', laborCost: '' })
    setShowForm(false)
    setError('')
  }

  function toggleSystem(system: ProductSystem) {
    const next = systems.map(item => item.id === system.id ? { ...item, isActive: !item.isActive } : item)
    saveProductSystems(next)
    recordAudit(system.isActive ? 'Ürün sistemi pasife alındı' : 'Ürün sistemi etkinleştirildi', system.code, system.name)
    setSystems(next)
  }

  return <><section className="module-header"><div><p className="eyebrow">ÜRÜN / MALİYET YÖNETİMİ</p><h1>Ürün sistemleri</h1><p className="heading-sub">Katman reçeteleri, sarfiyat ve m² bazında maliyet.</p></div><button className="primary-button" onClick={() => setShowForm(value => !value)}><Plus size={16} /> Yeni sistem</button></section>{error && <p className="role-message error" role="alert">{error}</p>}{showForm && <form className="employee-create-form" onSubmit={createSystem}><label>Sistem kodu<input required maxLength={30} value={form.code} onChange={event => setForm(current => ({ ...current, code: event.target.value }))} placeholder="KAT-EP 500" /></label><label>Sistem adı<input required value={form.name} onChange={event => setForm(current => ({ ...current, name: event.target.value }))} /></label><label>Açıklama<input value={form.description} onChange={event => setForm(current => ({ ...current, description: event.target.value }))} /></label><label>Katman reçetesi<input required value={form.layers} onChange={event => setForm(current => ({ ...current, layers: event.target.value }))} placeholder="Astar · Ara kat · Son kat" /></label><label>Sarfiyat (kg/m²)<input required type="number" min="0" step="0.01" value={form.coverage} onChange={event => setForm(current => ({ ...current, coverage: event.target.value }))} /></label><label>Malzeme maliyeti (TRY/m²)<input required type="number" min="0" step="0.01" value={form.materialCost} onChange={event => setForm(current => ({ ...current, materialCost: event.target.value }))} /></label><label>İşçilik maliyeti (TRY/m²)<input required type="number" min="0" step="0.01" value={form.laborCost} onChange={event => setForm(current => ({ ...current, laborCost: event.target.value }))} /></label><div className="employee-form-actions"><small>Demo katalog kaydı; ERP/API bağlantısı henüz yok.</small><button className="primary-button"><Check size={15} /> Sistemi kaydet</button></div></form>}<section className="product-system-grid">{systems.map(system => <article className="panel product-system-card" key={system.id}><div className="product-system-top"><span className="quote-id">{system.code}</span><button className={`employee-status ${system.isActive ? 'active' : 'pending'}`} onClick={() => toggleSystem(system)}>{system.isActive ? 'Aktif' : 'Pasif'}</button></div><h2>{system.name}</h2><p>{system.description}</p><small>{system.layers}</small><div className="product-system-costs"><span>Sarfiyat <b>{system.coverageKgPerM2} kg/m²</b></span><span>Malzeme <b>{system.materialCostPerM2} TRY/m²</b></span><span>İşçilik <b>{system.laborCostPerM2} TRY/m²</b></span><strong>Toplam {system.materialCostPerM2 + system.laborCostPerM2} TRY/m²</strong></div></article>)}</section>{systems.length === 0 && <p className="empty-state">Henüz ürün sistemi yok.</p>}</>
}

function loadRates(): ExchangeRate[] {
  try {
    const saved = localStorage.getItem(ratesKey)
    return saved ? JSON.parse(saved) as ExchangeRate[] : defaultRates
  } catch {
    return defaultRates
  }
}

export function InventoryPage() {
  const [tab, setTab] = useState<InventoryTab>('stock')
  const [items, setItems] = useState(loadInventory)
  const [movements, setMovements] = useState(loadStockMovements)
  const [orders, setOrders] = useState(loadPurchaseOrders)
  const [showMovement, setShowMovement] = useState(false)
  const [showOrder, setShowOrder] = useState(false)
  const [movementForm, setMovementForm] = useState({ itemId: '', type: 'Giriş' as 'Giriş' | 'Çıkış', quantity: '', reference: '', note: '' })
  const [orderForm, setOrderForm] = useState({ supplier: '', itemId: '', quantity: '', unitCost: '', expectedAt: '' })
  const [error, setError] = useState('')

  useEffect(() => {
    const refresh = () => { setItems(loadInventory()); setMovements(loadStockMovements()); setOrders(loadPurchaseOrders()) }
    window.addEventListener('hutec-demo-data-changed', refresh)
    return () => window.removeEventListener('hutec-demo-data-changed', refresh)
  }, [])

  const lowStock = items.filter(item => item.onHand <= item.minimum).length
  const inventoryValue = items.reduce((sum, item) => sum + item.onHand * item.unitCost, 0)

  function createMovement(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const item = items.find(value => value.id === movementForm.itemId)
    const quantity = Number(movementForm.quantity)
    if (!item || quantity <= 0) return
    if (movementForm.type === 'Çıkış' && item.onHand < quantity) {
      setError('Stok çıkışı mevcut miktarı aşamaz.')
      return
    }
    const updatedItem = { ...item, onHand: item.onHand + (movementForm.type === 'Giriş' ? quantity : -quantity) }
    const movement: StockMovement = { id: crypto.randomUUID(), itemId: item.id, itemName: item.name, type: movementForm.type, quantity, unit: item.unit, reference: movementForm.reference.trim(), note: movementForm.note.trim(), createdAt: new Date().toISOString() }
    saveInventory(items.map(value => value.id === item.id ? updatedItem : value))
    saveStockMovements([movement, ...movements])
    recordAudit(`Stok ${movementForm.type.toLocaleLowerCase('tr')}`, item.name, `${quantity} ${item.unit}${movement.reference ? ` · ${movement.reference}` : ''}`)
    setMovementForm({ itemId: '', type: 'Giriş', quantity: '', reference: '', note: '' })
    setShowMovement(false)
    setError('')
  }

  function createOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const item = items.find(value => value.id === orderForm.itemId)
    const quantity = Number(orderForm.quantity)
    const unitCost = Number(orderForm.unitCost)
    if (!item || !orderForm.supplier.trim() || quantity <= 0 || unitCost < 0) return
    const order: PurchaseOrder = { id: crypto.randomUUID(), number: `SA-${new Date().getFullYear()}-${String(orders.length + 1).padStart(4, '0')}`, supplier: orderForm.supplier.trim(), itemId: item.id, itemName: item.name, quantity, unit: item.unit, unitCost, status: 'Sipariş verildi', expectedAt: orderForm.expectedAt, createdAt: new Date().toISOString() }
    savePurchaseOrders([order, ...orders])
    recordAudit('Satın alma siparişi oluşturuldu', order.number, `${order.supplier} · ${quantity} ${item.unit} ${item.name}`)
    setOrderForm({ supplier: '', itemId: '', quantity: '', unitCost: '', expectedAt: '' })
    setShowOrder(false)
  }

  function receiveOrder(order: PurchaseOrder) {
    const item = items.find(value => value.id === order.itemId)
    if (!item || order.status !== 'Sipariş verildi') return
    const updatedOrder = { ...order, status: 'Teslim alındı' as const }
    const updatedItem = { ...item, onHand: item.onHand + order.quantity, unitCost: order.unitCost }
    const movement: StockMovement = { id: crypto.randomUUID(), itemId: item.id, itemName: item.name, type: 'Giriş', quantity: order.quantity, unit: item.unit, reference: order.number, note: order.supplier, createdAt: new Date().toISOString() }
    saveInventory(items.map(value => value.id === item.id ? updatedItem : value))
    saveStockMovements([movement, ...movements])
    savePurchaseOrders(orders.map(value => value.id === order.id ? updatedOrder : value))
    recordAudit('Satın alma teslim alındı', order.number, `${order.quantity} ${item.unit} ${item.name}`)
  }

  return <><section className="module-header"><div><p className="eyebrow">OPERASYON / DEPO</p><h1>Stok ve satın alma</h1><p className="heading-sub">Malzeme hareketlerini, düşük stokları ve tedarik siparişlerini izleyin.</p></div><div className="role-header-actions">{tab === 'stock' ? <button className="primary-button" onClick={() => setShowMovement(value => !value)}><Plus size={16} /> Stok hareketi</button> : <button className="primary-button" onClick={() => setShowOrder(value => !value)}><Plus size={16} /> Satın alma siparişi</button>}</div></section>
    <div className="module-tabs business-tabs"><button className={tab === 'stock' ? 'tab-active' : ''} onClick={() => setTab('stock')}>Stok durumu</button><button className={tab === 'purchase' ? 'tab-active' : ''} onClick={() => setTab('purchase')}>Satın alma <b>{orders.filter(order => order.status === 'Sipariş verildi').length}</b></button></div>
    {error && <p className="role-message error" role="alert">{error}</p>}
    {showMovement && tab === 'stock' && <form className="employee-create-form" onSubmit={createMovement}><label>Malzeme<select required value={movementForm.itemId} onChange={event => setMovementForm(current => ({ ...current, itemId: event.target.value }))}><option value="">Malzeme seçin</option>{items.map(item => <option value={item.id} key={item.id}>{item.name} ({item.onHand} {item.unit})</option>)}</select></label><label>Hareket türü<select value={movementForm.type} onChange={event => setMovementForm(current => ({ ...current, type: event.target.value as 'Giriş' | 'Çıkış' }))}><option>Giriş</option><option>Çıkış</option></select></label><label>Miktar<input required min="0.01" step="0.01" type="number" value={movementForm.quantity} onChange={event => setMovementForm(current => ({ ...current, quantity: event.target.value }))} /></label><label>Referans<input value={movementForm.reference} onChange={event => setMovementForm(current => ({ ...current, reference: event.target.value }))} placeholder="İş emri / fatura" /></label><label>Not<input value={movementForm.note} onChange={event => setMovementForm(current => ({ ...current, note: event.target.value }))} /></label><div className="employee-form-actions"><small>Çıkış miktarı mevcut stoktan düşülür.</small><button className="primary-button"><Check size={15} /> Hareketi kaydet</button></div></form>}
    {showOrder && tab === 'purchase' && <form className="employee-create-form" onSubmit={createOrder}><label>Tedarikçi<input required value={orderForm.supplier} onChange={event => setOrderForm(current => ({ ...current, supplier: event.target.value }))} /></label><label>Malzeme<select required value={orderForm.itemId} onChange={event => setOrderForm(current => ({ ...current, itemId: event.target.value }))}><option value="">Malzeme seçin</option>{items.map(item => <option value={item.id} key={item.id}>{item.name} ({item.unit})</option>)}</select></label><label>Miktar<input required min="0.01" step="0.01" type="number" value={orderForm.quantity} onChange={event => setOrderForm(current => ({ ...current, quantity: event.target.value }))} /></label><label>Birim maliyet<input required min="0" step="0.01" type="number" value={orderForm.unitCost} onChange={event => setOrderForm(current => ({ ...current, unitCost: event.target.value }))} /></label><label>Beklenen teslimat<input type="date" value={orderForm.expectedAt} onChange={event => setOrderForm(current => ({ ...current, expectedAt: event.target.value }))} /></label><div className="employee-form-actions"><small>Sipariş teslim alındığında stok otomatik artar.</small><button className="primary-button"><Check size={15} /> Sipariş oluştur</button></div></form>}
    {tab === 'stock' ? <><div className="module-stats"><Stat label="Stok değeri" value={inventoryValue.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 })} change={`${items.length} kalem`} tone="blue" /><Stat label="Kritik kalem" value={String(lowStock)} change="Minimum seviyenin altında" tone={lowStock ? 'red' : 'green'} /><Stat label="Son hareket" value={movements[0] ? new Date(movements[0].createdAt).toLocaleDateString('tr-TR') : 'Henüz yok'} change={movements[0]?.itemName ?? 'Hareket kaydı'} tone="orange" /></div><section className="panel module-panel"><div className="panel-heading"><div><h2>Malzeme listesi</h2><p>Minimum miktar uyarısı aktif</p></div></div><div className="table-scroll"><table><thead><tr><th>SKU</th><th>Malzeme</th><th>Mevcut</th><th>Minimum</th><th>Birim maliyet</th><th>Durum</th></tr></thead><tbody>{items.map(item => <tr key={item.id}><td>{item.sku}</td><td><strong>{item.name}</strong></td><td>{item.onHand.toLocaleString('tr-TR')} {item.unit}</td><td>{item.minimum} {item.unit}</td><td>{item.unitCost.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</td><td><span className={`employee-status ${item.onHand <= item.minimum ? 'pending' : 'active'}`}>{item.onHand <= item.minimum ? 'Kritik stok' : 'Normal'}</span></td></tr>)}</tbody></table></div></section><section className="panel module-panel"><div className="panel-heading"><div><h2>Son stok hareketleri</h2></div></div><MovementTable movements={movements.slice(0, 8)} /></section></> : <section className="panel module-panel"><div className="panel-heading"><div><h2>Satın alma siparişleri</h2><p>Teslim alındığında envantere işlenir</p></div></div><div className="table-scroll"><table><thead><tr><th>Sipariş</th><th>Tedarikçi</th><th>Malzeme</th><th>Miktar</th><th>Beklenen</th><th>Durum</th><th /></tr></thead><tbody>{orders.map(order => <tr key={order.id}><td><strong>{order.number}</strong></td><td>{order.supplier}</td><td>{order.itemName}</td><td>{order.quantity} {order.unit}</td><td>{order.expectedAt || 'Belirtilmedi'}</td><td>{order.status}</td><td>{order.status === 'Sipariş verildi' && <button className="outline-button" onClick={() => receiveOrder(order)}><ArrowDownToLine size={14} /> Teslim al</button>}</td></tr>)}</tbody></table></div>{orders.length === 0 && <p className="empty-state">Henüz satın alma siparişi yok.</p>}</section>}</>
}

export function FinancePage() {
  const [receivables, setReceivables] = useState(loadReceivables)
  const [quotes] = useState(loadQuotes)
  const [amounts, setAmounts] = useState<Record<string, string>>({})
  const [rates, setRates] = useState(loadRates)
  const [error, setError] = useState('')
  useEffect(() => { const refresh = () => setReceivables(loadReceivables()); window.addEventListener('hutec-demo-data-changed', refresh); return () => window.removeEventListener('hutec-demo-data-changed', refresh) }, [])
  const outstanding = receivables.reduce((sum, item) => sum + Math.max(0, item.amount - item.paidAmount), 0)
  const paid = receivables.reduce((sum, item) => sum + item.paidAmount, 0)

  function createFromApprovedQuotes() {
    const knownQuotes = new Set(receivables.map(item => item.quoteId))
    const newRows: Receivable[] = quotes.filter(quote => quote.status === 'Onaylandı' && !knownQuotes.has(quote.id)).map(quote => ({ id: crypto.randomUUID(), quoteId: quote.id, quoteNumber: quote.quoteNumber, customerName: quote.customerName, amount: quote.total, paidAmount: 0, currency: quote.currency, dueAt: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10), createdAt: new Date().toISOString() }))
    if (!newRows.length) { setError('Yeni alacağa dönüştürülecek onaylı teklif yok.'); return }
    saveReceivables([...newRows, ...receivables])
    newRows.forEach(row => recordAudit('Tahsilat kaydı oluşturuldu', row.quoteNumber, row.customerName))
    setError('')
  }

  function collect(event: FormEvent<HTMLFormElement>, receivable: Receivable) {
    event.preventDefault()
    const amount = Number(amounts[receivable.id] ?? 0)
    const remaining = receivable.amount - receivable.paidAmount
    if (amount <= 0 || amount > remaining) { setError('Tahsilat tutarı kalan alacaktan büyük veya sıfır olamaz.'); return }
    const updated = { ...receivable, paidAmount: receivable.paidAmount + amount }
    saveReceivables(receivables.map(item => item.id === receivable.id ? updated : item))
    recordAudit('Tahsilat alındı', receivable.quoteNumber, `${amount} ${receivable.currency} · ${receivable.customerName}`)
    setAmounts(current => ({ ...current, [receivable.id]: '' }))
    setError('')
  }

  function saveRate(event: FormEvent<HTMLFormElement>, code: string, value: string) {
    event.preventDefault()
    const numericValue = Number(value)
    if (numericValue <= 0) return
    const next = rates.map(rate => rate.code === code ? { ...rate, value: numericValue, updatedAt: new Date().toISOString() } : rate)
    localStorage.setItem(ratesKey, JSON.stringify(next))
    window.dispatchEvent(new Event('hutec-demo-data-changed'))
    recordAudit('Döviz kuru güncellendi', code, String(numericValue))
    setRates(next)
  }

  return <><section className="module-header"><div><p className="eyebrow">FİNANS / CARİ HESAP</p><h1>Tahsilat ve döviz</h1><p className="heading-sub">Onaylı tekliflerden alacak oluşturun, kısmi tahsilatları izleyin ve demo kurlarını düzenleyin.</p></div><button className="primary-button" onClick={createFromApprovedQuotes}><Plus size={16} /> Onaylı tekliflerden alacak oluştur</button></section>{error && <p className="role-message error" role="alert">{error}</p>}<div className="module-stats"><Stat label="Açık alacak" value={outstanding.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 })} change={`${receivables.length} kayıt`} tone="orange" /><Stat label="Tahsil edilen" value={paid.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 })} change="Demo tahsilat toplamı" tone="green" /><Stat label="Vadesi geçmiş" value={String(receivables.filter(item => item.amount > item.paidAmount && item.dueAt < new Date().toISOString().slice(0, 10)).length)} change="Takip gerekli" tone="red" /></div><section className="panel module-panel"><div className="panel-heading"><div><h2>Alacak ve tahsilat</h2><p>Teklifler onaylandığında alacağa dönüştürülür</p></div><Wallet size={18} /></div><div className="table-scroll"><table><thead><tr><th>Teklif</th><th>Müşteri</th><th>Tutar</th><th>Tahsil edilen</th><th>Vade</th><th>Tahsilat</th></tr></thead><tbody>{receivables.map(item => <tr key={item.id}><td>{item.quoteNumber}</td><td>{item.customerName}</td><td>{item.amount.toLocaleString('tr-TR', { style: 'currency', currency: item.currency })}</td><td>{item.paidAmount.toLocaleString('tr-TR', { style: 'currency', currency: item.currency })}</td><td>{item.dueAt}</td><td>{item.paidAmount < item.amount && <form className="collection-form" onSubmit={event => collect(event, item)}><input required aria-label={`${item.quoteNumber} tahsilat tutarı`} type="number" min="0.01" step="0.01" max={item.amount - item.paidAmount} value={amounts[item.id] ?? ''} onChange={event => setAmounts(current => ({ ...current, [item.id]: event.target.value }))} /><button className="icon-button" aria-label={`${item.quoteNumber} tahsilatı kaydet`}><Check size={16} /></button></form>}</td></tr>)}</tbody></table></div>{receivables.length === 0 && <p className="empty-state">Tahsilat kaydı yok. Önce bir teklifi onaylayın.</p>}</section><section className="panel module-panel"><div className="panel-heading"><div><h2>Döviz referans kurları</h2><p>Demo kurları yerel çalışma alanında saklanır.</p></div><CircleDollarSign size={18} /></div><div className="rate-edit-list">{rates.map(rate => <form key={rate.code} onSubmit={event => saveRate(event, rate.code, String(new FormData(event.currentTarget).get('rate')))}><div><strong>{rate.code}</strong><small>{rate.name}</small></div><input name="rate" aria-label={`${rate.code} kuru`} type="number" min="0.0001" step="0.0001" defaultValue={rate.value} /><span>TRY</span><button className="icon-button" aria-label={`${rate.code} kurunu kaydet`}><Check size={16} /></button></form>)}</div></section></>
}

function MovementTable({ movements }: { movements: StockMovement[] }) {
  return <div className="table-scroll"><table><thead><tr><th>Tarih</th><th>Hareket</th><th>Malzeme</th><th>Miktar</th><th>Referans</th></tr></thead><tbody>{movements.map(item => <tr key={item.id}><td>{new Date(item.createdAt).toLocaleString('tr-TR')}</td><td>{item.type}</td><td>{item.itemName}</td><td>{item.quantity} {item.unit}</td><td>{item.reference || '—'}</td></tr>)}</tbody></table>{movements.length === 0 && <p className="empty-state">Henüz stok hareketi yok.</p>}</div>
}

function Stat({ label, value, change, tone }: { label: string; value: string; change: string; tone: string }) {
  return <div className="module-stat"><span className={`stat-dot ${tone}`} /><div><small>{label}</small><strong>{value}</strong><p>{change}</p></div></div>
}

