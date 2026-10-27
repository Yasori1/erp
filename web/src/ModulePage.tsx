import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Archive, ArrowUpRight, Check, ChevronDown, CircleDollarSign, Download, Filter, Layers3, LockKeyhole, MoreHorizontal, Pencil, Plus, RefreshCw, Search, Settings2, ShieldCheck, SlidersHorizontal, Sparkles, UserPlus, Users, X } from 'lucide-react'
import './module.css'
import './settings.css'
import LiveAnalyticsPage from './LiveAnalyticsPage'
import { loadCustomers, loadProjects, saveCustomers, type CommercialCustomer } from './commercialData'
import DiscountsPage from './DiscountsPage'
import EasyQuotePage from './EasyQuotePage'
import RoleManagementPage from './RoleManagementPage'
import StockEntryModal from './StockEntryModal'
import type { Session } from './LoginPage'
import { ApprovedQuotesToProjects, AuditLogPage, CustomerCrmPage, ProjectsWorkflowPage, QuotesWorkflowPage } from './BusinessPages'
import { FinancePage, InventoryPage } from './OperationsPages'
import './business-pages.css'

export type ModuleKey = 'customers' | 'quotes' | 'systems' | 'stock' | 'projects' | 'rates' | 'settings' | 'analytics' | 'access' | 'easyQuote' | 'discounts' | 'audit'
export type CreateType = 'quote' | 'project'

type Customer = { name: string; contact: string; city: string; projects: number; value: string; status: string; initials: string }
const customers: Customer[] = [
  { name: 'Dora Lojistik', contact: 'Selin Aksoy', city: 'İstanbul', projects: 4, value: '₺1.240.000', status: 'Aktif', initials: 'DL' },
  { name: 'Atlas Gıda', contact: 'Murat Demir', city: 'Kocaeli', projects: 2, value: '₺486.400', status: 'Aktif', initials: 'AG' },
  { name: 'Mavi Makine', contact: 'Burak Kaya', city: 'Bursa', projects: 3, value: '₺926.000', status: 'Teklif aşaması', initials: 'MM' },
  { name: 'Kuzey Depo', contact: 'Aslı Özkan', city: 'Ankara', projects: 1, value: '₺142.800', status: 'Pasif', initials: 'KD' },
]
const products = [
  { name: 'KAT-EP 302', description: 'Self-leveling epoksi sistem', layers: 'Astar · Ara kat · Son kat', coverage: '1,8 kg / m²', stock: '420 kg', status: 'Yayında' },
  { name: 'KAT-PU 180', description: 'Hijyenik poliüretan sistem', layers: 'Astar · PU ara kat · Top coat', coverage: '2,2 kg / m²', stock: '84 kg', status: 'Düşük stok' },
  { name: 'KAT-IND 450', description: 'Ağır yük endüstriyel sistem', layers: 'Primer · Harç · Seal coat', coverage: '3,5 kg / m²', stock: '1.240 kg', status: 'Yayında' },
]

export default function ModulePage({ module, onNavigate, onCreate, session }: { module: ModuleKey; onNavigate: (module: ModuleKey) => void; onCreate: (type: CreateType) => void; session: Session }) {
  if (module === 'analytics') return <LiveAnalyticsPage onCreate={onCreate} />
  if (module === 'audit') return <AuditLogPage />
  if (module === 'access') return <RoleManagementPage session={session} />
  if (module === 'discounts') return <DiscountsPage />
  if (module === 'easyQuote') return <EasyQuotePage />
  if (module === 'customers') return <CustomerCrmPage />
  if (module === 'quotes') return <><QuotesWorkflowPage onCreate={onCreate} /><ApprovedQuotesToProjects /></>
  if (module === 'systems') return <SystemsPage />
  if (module === 'stock') return <InventoryPage />
  if (module === 'projects') return <ProjectsWorkflowPage onCreate={onCreate} />
  if (module === 'rates') return <FinancePage />
  return <SettingsPage onNavigate={onNavigate} />
}

function PageHeader({ eyebrow, title, description, action, icon, onAction }: { eyebrow: string; title: string; description: string; action?: string; icon?: ReactNode; onAction?: () => void }) {
  const eventName = action === 'Yeni teklif' ? 'create-quote' : action === 'Yeni proje' ? 'create-project' : action === 'Yeni müşteri' ? 'create-customer' : action === 'Yeni sistem' ? 'create-system' : action === 'Manuel kur gir' ? 'create-rate' : undefined
  return <section className="module-header"><div><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><p className="heading-sub">{description}</p></div>{action && <button className="primary-button" onClick={() => onAction ? onAction() : eventName && window.dispatchEvent(new CustomEvent(eventName))}><Plus size={17} /> {action}</button>}{icon && <div className="module-header-icon">{icon}</div>}</section>
}
function Toolbar({ search, onSearch, children }: { search: string; onSearch: (value: string) => void; children?: ReactNode }) {
  return <div className="module-toolbar"><div className="module-search"><Search size={16} /><input value={search} onChange={event => onSearch(event.target.value)} placeholder="Ara..." /></div><div className="toolbar-actions">{children}<button className="outline-button"><Filter size={14} /> Filtrele</button></div></div>
}
export function CommercialCustomersPage() {
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [customers, setCustomers] = useState(loadCustomers)
  const [form, setForm] = useState({ name: '', contact: '', email: '', phone: '', city: '' })
  const filtered = useMemo(() => customers.filter(item => `${item.name} ${item.contact} ${item.email}`.toLowerCase().includes(search.toLowerCase())), [customers, search])

  function createCustomer(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const customer: CommercialCustomer = {
      id: crypto.randomUUID(),
      ...form,
      status: 'Aktif',
      dealerDiscountPercent: 10,
      retailDiscountPercent: 5,
      personalDiscountPercent: 0,
    }
    const next = [customer, ...customers]
    saveCustomers(next)
    setCustomers(next)
    setForm({ name: '', contact: '', email: '', phone: '', city: '' })
    setShowForm(false)
  }

  return <><PageHeader eyebrow="CRM / MÜŞTERİLER" title="Müşteri ilişkileri" description="Müşteri iletişimini ve müşteri bazlı fiyat koşullarını yönetin." action="Yeni müşteri" onAction={() => setShowForm(true)} /><Toolbar search={search} onSearch={setSearch}><button className="select-button">Tüm müşteriler <ChevronDown size={14} /></button><button className="icon-text-button" onClick={() => setShowForm(true)}><UserPlus size={15} /> Hızlı kayıt</button></Toolbar><section className="panel module-panel"><div className="panel-heading"><div><h2>Müşteri listesi</h2><p>{customers.length} müşteri kayıtlı</p></div><button className="icon-text-button"><Download size={15} /> Dışa aktar</button></div><div className="table-scroll"><table><thead><tr><th>Firma</th><th>İletişim</th><th>E-posta</th><th>Telefon</th><th>Lokasyon</th><th>İskonto</th><th>Durum</th></tr></thead><tbody>{filtered.map(customer => <tr key={customer.id}><td><div className="table-person"><span className="mini-avatar">{customer.name.slice(0, 2).toUpperCase()}</span><strong>{customer.name}</strong></div></td><td>{customer.contact}</td><td>{customer.email}</td><td>{customer.phone}</td><td>{customer.city || '—'}</td><td><strong>Bayi %{customer.dealerDiscountPercent} · Perakende %{customer.retailDiscountPercent}</strong></td><td><span className={`status ${customer.status === 'Pasif' ? 'slate' : 'green'}`}><i />{customer.status}</span></td></tr>)}</tbody></table></div>{filtered.length === 0 && <p className="empty-state">Aramanızla eşleşen müşteri bulunamadı.</p>}</section>{showForm && <Modal title="Yeni müşteri" onClose={() => setShowForm(false)}><form onSubmit={createCustomer}><label>Firma adı<input required value={form.name} onChange={event => setForm({ ...form, name: event.target.value })} placeholder="Örn. Nova Endüstri" /></label><label>İletişim kişisi<input required value={form.contact} onChange={event => setForm({ ...form, contact: event.target.value })} placeholder="Ad soyad" /></label><label>E-posta<input required type="email" value={form.email} onChange={event => setForm({ ...form, email: event.target.value })} placeholder="ornek@firma.com" /></label><label>Telefon<input required type="tel" value={form.phone} onChange={event => setForm({ ...form, phone: event.target.value })} placeholder="+90 5xx xxx xx xx" /></label><label>Şehir<input value={form.city} onChange={event => setForm({ ...form, city: event.target.value })} placeholder="İstanbul" /></label><button className="primary-button modal-submit" type="submit"><Check size={16} /> Müşteriyi kaydet</button></form></Modal>}</>
}
export function ProjectsPage({ onCreate }: { onCreate: (type: CreateType) => void }) {
  const [projects, setProjects] = useState(loadProjects)
  const customers = loadCustomers()

  useEffect(() => {
    const refresh = () => setProjects(loadProjects())
    window.addEventListener('commercial-project-created', refresh)
    return () => window.removeEventListener('commercial-project-created', refresh)
  }, [])

  return <><PageHeader eyebrow="SAHA OPERASYONLARI" title="Projeler" description="Müşteri projelerini, metrajları ve proje bazlı fiyat koşullarını yönetin." action="Yeni proje" onAction={() => onCreate('project')} /><section className="panel module-panel"><div className="panel-heading"><div><h2>Proje listesi</h2><p>{projects.length} proje kayıtlı</p></div></div><div className="table-scroll"><table><thead><tr><th>Proje</th><th>Müşteri</th><th>Metraj</th><th>Başlangıç</th><th>Bayi indirimi</th><th>Perakende indirimi</th></tr></thead><tbody>{projects.map(project => {
    const customer = customers.find(item => item.id === project.customerId)
    return <tr key={project.id}><td><strong>{project.name}</strong></td><td>{customer?.name ?? 'Müşteri bulunamadı'}</td><td>{project.areaM2.toLocaleString('tr-TR')} m²</td><td>{project.startDate || 'Planlanmadı'}</td><td>{project.dealerDiscountPercent === null ? `Müşteri oranı (%${customer?.dealerDiscountPercent ?? 10})` : `%${project.dealerDiscountPercent}`}</td><td>{project.retailDiscountPercent === null ? `Müşteri oranı (%${customer?.retailDiscountPercent ?? 5})` : `%${project.retailDiscountPercent}`}</td></tr>
  })}</tbody></table></div>{projects.length === 0 && <p className="empty-state">Henüz proje yok. Yeni proje oluşturarak başlayın.</p>}</section></>
}
export function CustomersPage() {
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const filtered = useMemo(() => customers.filter(item => `${item.name} ${item.contact}`.toLowerCase().includes(search.toLowerCase())), [search])
  return <><PageHeader eyebrow="CRM / MÜŞTERİLER" title="Müşteri ilişkileri" description="Müşteri, iletişim kişisi ve teklif geçmişini yönetin." action="Yeni müşteri" /><Toolbar search={search} onSearch={setSearch}><button className="select-button">Tüm müşteriler <ChevronDown size={14} /></button><button className="icon-text-button" onClick={() => setShowForm(true)}><UserPlus size={15} /> Hızlı kayıt</button></Toolbar><div className="module-stats"><Stat label="Toplam müşteri" value="128" change="+8 bu ay" tone="green" /><Stat label="Aktif hesap" value="94" change="%73 oran" tone="blue" /><Stat label="Açık fırsat" value="₺2,84M" change="24 teklif" tone="orange" /></div><section className="panel module-panel"><div className="panel-heading"><div><h2>Müşteri listesi</h2><p>Personel yalnızca yetkili olduğu tenant verilerini görür</p></div><button className="icon-text-button"><Download size={15} /> Dışa aktar</button></div><div className="table-scroll"><table><thead><tr><th>Firma</th><th>İletişim</th><th>Lokasyon</th><th>Proje</th><th>Teklif</th><th>Toplam hacim</th><th>Durum</th><th /></tr></thead><tbody>{filtered.map((customer, index) => <tr key={customer.name}><td><div className="table-person"><span className="mini-avatar">{customer.initials}</span><strong>{customer.name}</strong></div></td><td>{customer.contact}</td><td>{customer.city}</td><td>{customer.projects}</td><td><strong>{[4, 2, 3, 1][index]}</strong></td><td><strong>{customer.value}</strong></td><td><span className={`status ${customer.status === 'Pasif' ? 'slate' : customer.status === 'Aktif' ? 'green' : 'amber'}`}><i />{customer.status}</span></td><td><button className="row-more" aria-label="Müşteri seçenekleri"><MoreHorizontal size={17} /></button></td></tr>)}</tbody></table></div></section>{showForm && <Modal title="Yeni müşteri" onClose={() => setShowForm(false)}><label>Firma adı<input placeholder="Örn. Nova Endüstri" /></label><label>İletişim kişisi<input placeholder="Ad soyad" /></label><label>E-posta<input type="email" placeholder="ornek@firma.com" /></label><button className="primary-button modal-submit" onClick={() => setShowForm(false)}><Check size={16} /> Müşteri oluştur</button></Modal>}</>
}
export function QuotesPage({ onCreate: _onCreate }: { onCreate: (type: CreateType) => void }) {
  const [tab, setTab] = useState('Tümü')
  const tabs = ['Tümü', 'Taslak', 'Onay bekliyor', 'Onaylandı']
  return <><PageHeader eyebrow="TEKLİFLER / ÇALIŞMA ALANI" title="Teklifler" description="Teklifleri hazırlayın, onaylayın ve müşteriye gönderin." action="Yeni teklif" /><div className="module-tabs">{tabs.map(item => <button className={tab === item ? 'tab-active' : ''} key={item} onClick={() => setTab(item)}>{item}{item === 'Onay bekliyor' && <b>4</b>}</button>)}</div><section className="panel module-panel"><div className="panel-heading"><div><h2>Teklif çalışma alanı</h2><p>Son güncellenen teklifler</p></div><button className="icon-text-button"><SlidersHorizontal size={15} /> Görünüm</button></div><div className="quote-cards">{['TK-24091', 'TK-24090', 'TK-24087'].map((id, index) => <article className="quote-card" key={id}><div className="quote-card-top"><span className="quote-id">{id}</span><button className="row-more" aria-label="Teklif seçenekleri"><MoreHorizontal size={17} /></button></div><h3>{['Dora Lojistik', 'Atlas Gıda', 'Mavi Makine'][index]}</h3><p>{['Self-leveling epoksi · 1.200 m²', 'Hijyenik poliüretan · 840 m²', 'Endüstriyel epoksi · 2.400 m²'][index]}</p><div className="quote-card-bottom"><strong>{['₺384.600', '₺218.400', '₺726.000'][index]}</strong><span className={`status ${['amber', 'slate', 'green'][index]}`}><i />{['Onay bekliyor', 'Taslak', 'Onaylandı'][index]}</span></div><div className="quote-progress"><i style={{ width: `${[68, 24, 100][index]}%` }} /></div></article>)}</div></section></>
}
function SystemsPage() { return <><PageHeader eyebrow="PLM / ÜRÜN YÖNETİMİ" title="Ürün sistemleri" description="Katman kompozisyonlarını, formülleri ve versiyonları yönetin." action="Yeni sistem" /><div className="system-highlight"><div className="highlight-icon"><Sparkles size={21} /></div><div><strong>Formül motoru hazır</strong><p>Metraj girildiğinde katman bazında malzeme ihtiyacını otomatik hesaplayın.</p></div><button className="text-button">Hesaplayıcıyı aç <ArrowUpRight size={15} /></button></div><section className="system-grid">{products.map(product => <article className="system-card" key={product.name}><div className="system-card-top"><div className="system-symbol"><Layers3 size={19} /></div><span className={`status ${product.status === 'Düşük stok' ? 'amber' : 'green'}`}><i />{product.status}</span></div><span className="quote-id">{product.name} · v3.2</span><h2>{product.description}</h2><p className="layer-list">{product.layers}</p><div className="system-meta"><div><small>Sarfiyat</small><strong>{product.coverage}</strong></div><div><small>Mevcut stok</small><strong>{product.stock}</strong></div></div><div className="system-actions"><button className="icon-text-button"><Pencil size={14} /> Düzenle</button><button className="row-more" aria-label="Sistem seçenekleri"><MoreHorizontal size={17} /></button></div></article>)}</section></> }
export function StockPage() { const [showEntry, setShowEntry] = useState(false); return <><PageHeader eyebrow="OPERASYON / DEPO" title="Depo & stok" description="Kritik seviyeleri izleyin, satın alma ihtiyacını erkenden görün." action="Stok girişi" onAction={() => setShowEntry(true)} /><div className="module-stats"><Stat label="Toplam stok değeri" value="₺486.240" change="+%4,2" tone="green" /><Stat label="Kritik ürün" value="7" change="Aksiyon gerekli" tone="red" /><Stat label="Bekleyen giriş" value="₺92.800" change="3 sipariş" tone="orange" /></div><section className="panel module-panel"><div className="panel-heading"><div><h2>Stok durumu</h2><p>Son senkronizasyon: bugün, 08:40</p></div><button className="icon-text-button"><RefreshCw size={14} /> Yenile</button></div><div className="stock-list">{['Epoksi reçine A', 'PU sertleştirici B', 'Silis agregası 0.4 mm', 'Pigment RAL 7035'].map((item, index) => <div className="stock-row" key={item}><div className="stock-product"><div className={`stock-icon stock-${index}`}><Archive size={17} /></div><div><strong>{item}</strong><small>{['EPX-RES-001', 'PU-HAR-002', 'AGG-SIL-004', 'PIG-RAL-735'][index]}</small></div></div><div className="stock-quantity"><strong>{['420 kg', '84 kg', '1.240 kg', '18 kg'][index]}</strong><div className="stock-bar"><i style={{ width: `${[78, 18, 64, 11][index]}%` }} /></div></div><span className={`status ${index === 1 || index === 3 ? 'amber' : 'green'}`}><i />{index === 1 || index === 3 ? 'Kritik' : 'Normal'}</span><button className="row-more" aria-label="Stok seçenekleri"><MoreHorizontal size={17} /></button></div>)}</div></section>{showEntry && <StockEntryModal onClose={() => setShowEntry(false)} />}</> }
export function RatesPage() { return <><PageHeader eyebrow="FİNANS / DÖVİZ" title="Döviz kurları" description="Canlı kurları izleyin ve teklifler için sabit kur tanımlayın." action="Manuel kur gir" /><div className="rate-source"><div className="rate-source-icon"><RefreshCw size={18} /></div><div><strong>TCMB bağlantısı aktif</strong><p>Son güncelleme: bugün, 09:15 · Otomatik yenileme açık</p></div><button className="icon-text-button"><RefreshCw size={14} /> Şimdi yenile</button></div><section className="rate-grid">{[['USD', '33,9820', '+%0,42', 'Dolar'], ['EUR', '37,4520', '+%0,18', 'Euro'], ['GBP', '44,3180', '-%0,12', 'Sterlin']].map(([code, value, change, label]) => <article className="rate-card" key={code}><div><span className="currency-code">{code}</span><small>{label}</small></div><strong>{value} ₺</strong><span className={change.startsWith('-') ? 'rate-down' : 'rate-up'}>{change}</span><div className="mini-chart"><i /></div></article>)}</section><section className="panel module-panel"><div className="panel-heading"><div><h2>Sabit kur tanımları</h2><p>Tekliflerde kullanılan özel kurlar</p></div><button className="outline-button">Geçmişi gör <ArrowUpRight size={14} /></button></div><p className="empty-state"><CircleDollarSign size={24} /> Henüz sabit kur tanımı bulunmuyor.</p></section></> }
function SettingsPage({ onNavigate }: { onNavigate: (module: ModuleKey) => void }) {
  const [tab, setTab] = useState<'company' | 'users' | 'security'>('company')
  return <><PageHeader eyebrow="YÖNETİM / AYARLAR" title="Çalışma alanı ayarları" description="Firma bilgileri, kullanıcılar ve güvenliği tek yerden yönetin." /><div className="settings-layout"><div className="settings-menu"><button className={tab === 'company' ? 'settings-active' : ''} onClick={() => setTab('company')}><BuildingIcon /> Firma bilgileri</button><button className={tab === 'users' ? 'settings-active' : ''} onClick={() => setTab('users')}><Users size={16} /> Kullanıcılar & roller</button><button onClick={() => onNavigate('access')}><ShieldCheck size={16} /> İzin matrisi</button><button className={tab === 'security' ? 'settings-active' : ''} onClick={() => setTab('security')}><LockKeyhole size={16} /> Güvenlik</button></div>{tab === 'company' && <CompanySettings />}{tab === 'users' && <UsersSettings />}{tab === 'security' && <SecuritySettings />}</div></>
}
function CompanySettings() { return <section className="panel settings-content"><div className="settings-title"><div className="company-avatar large">AP</div><div><h2>Artemis Proje</h2><p>Firma profil bilgileri</p></div><button className="icon-text-button"><Pencil size={14} /> Düzenle</button></div><div className="settings-fields"><label>Firma adı<strong>Artemis Proje Zemin Sistemleri A.Ş.</strong></label><label>Vergi numarası<strong>123 456 7890</strong></label><label>Varsayılan para birimi<strong>Türk Lirası (TRY)</strong></label><label>Teklif numara formatı<strong>TK-{new Date().getFullYear()}-####</strong></label></div><div className="tenant-notice"><ShieldCheck size={18} /><div><strong>Tenant izolasyonu aktif</strong><p>Bu çalışma alanının verileri yalnızca Artemis Proje kullanıcılarına açıktır.</p></div></div></section> }
function UsersSettings() { return <section className="panel settings-content"><div className="settings-title"><div><h2>Kullanıcılar & roller</h2><p>Çalışma alanındaki personel hesapları</p></div><button className="primary-button"><Plus size={15} /> Personel ekle</button></div><div className="user-list"><div className="user-row"><span className="mini-avatar">KG</span><div><strong>Kurucu Genel Müdür</strong><small>admin@artemisproje.com</small></div><b>Kurucu / Genel Müdür</b><span className="status green"><i />Aktif</span></div><div className="user-row"><span className="mini-avatar">ST</span><div><strong>Satış Temsilcisi</strong><small>satis@artemisproje.com</small></div><b>Satış Temsilcisi</b><span className="status green"><i />Aktif</span></div><div className="user-row"><span className="mini-avatar">SP</span><div><strong>Saha Personeli</strong><small>saha@artemisproje.com</small></div><b>Saha personeli</b><span className="status slate"><i />Davet bekliyor</span></div></div></section> }
function SecuritySettings() { return <section className="panel settings-content"><div className="settings-title"><div><h2>Güvenlik</h2><p>Oturum ve tenant güvenlik durumu</p></div><span className="security-live"><i />Koruma aktif</span></div><div className="security-grid"><div className="security-card"><ShieldCheck size={18} /><strong>Tenant izolasyonu</strong><p>Her sorgu JWT tenant claim'i ile sınırlandırılıyor.</p></div><div className="security-card"><LockKeyhole size={18} /><strong>JWT oturumları</strong><p>Token süresi ve aktif oturumlar merkezi olarak izlenir.</p></div><div className="security-card"><Users size={18} /><strong>Rol bazlı erişim</strong><p>Personel yalnızca kendisine açılan modüllere erişebilir.</p></div></div><div className="tenant-notice"><ShieldCheck size={18} /><div><strong>Güvenlik politikaları yürürlükte</strong><p>Token, şifre ve veritabanı bilgileri loglanmaz veya kaynak kodda tutulmaz.</p></div></div></section> }
function BuildingIcon() { return <Settings2 size={16} /> }
export function SimplePage({ title, description, action, eyebrow, icon }: { title: string; description: string; action: string; eyebrow: string; icon: ReactNode }) { return <><PageHeader eyebrow={eyebrow} title={title} description={description} action={action} icon={icon} /><section className="panel empty-module"><div className="empty-illustration">{icon}</div><h2>{title} çalışma alanı</h2><p>Bu modülün saha akışını buradan başlatabilirsiniz.</p><button className="primary-button"><Plus size={16} /> {action}</button></section></> }
function Stat({ label, value, change, tone }: { label: string; value: string; change: string; tone: string }) { return <div className="module-stat"><span className={`stat-dot ${tone}`} /><div><small>{label}</small><strong>{value}</strong><p>{change}</p></div></div> }
function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) { return <div className="modal-backdrop" onMouseDown={onClose}><div className="modal" onMouseDown={event => event.stopPropagation()}><div className="modal-heading"><div><h2>{title}</h2><p>Çalışma alanınıza yeni kayıt ekleyin.</p></div><button className="icon-button" onClick={onClose} aria-label="Kapat"><X size={18} /></button></div>{children}</div></div> }
