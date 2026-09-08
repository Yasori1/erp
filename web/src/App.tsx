import { useEffect, useState, type ReactNode } from 'react'
import { ArrowRight, BarChart3, Bell, Box, Building2, Calculator, ChevronDown, CircleDollarSign, ClipboardList, Layers3, LayoutDashboard, LogOut, Menu, Package, Plus, Search, Settings2, ShieldCheck, Users, X } from 'lucide-react'
import './App.css'
import './flow.css'
import './popover.css'
import ModulePage, { type ModuleKey } from './ModulePage'
import CreateFlow from './CreateFlow'
import ResourceActionModal, { type ResourceAction } from './ResourceActionModal'
import LoginPage, { type Session } from './LoginPage'
import WorkspaceModal, { type Workspace } from './WorkspaceModal'

type NavKey = 'overview' | ModuleKey
type Role = 'Admin' | 'Sales' | 'Field'
const navItems: { key: NavKey; label: string; icon: typeof LayoutDashboard }[] = [
  { key: 'overview', label: 'Genel bakış', icon: LayoutDashboard },
  { key: 'customers', label: 'Müşteriler', icon: Users },
  { key: 'quotes', label: 'Teklifler', icon: ClipboardList },
  { key: 'systems', label: 'Ürün sistemleri', icon: Layers3 },
  { key: 'stock', label: 'Depo & stok', icon: Package },
  { key: 'analytics', label: 'Analizler', icon: BarChart3 },
  { key: 'access', label: 'Roller & yetkiler', icon: ShieldCheck },
  { key: 'easyQuote', label: 'Kolay Teklif', icon: Calculator },
]
const roleAccess: Record<Role, NavKey[]> = {
  Admin: ['overview', 'customers', 'quotes', 'systems', 'stock', 'analytics', 'easyQuote', 'projects', 'rates', 'settings', 'access'],
  Sales: ['overview', 'customers', 'quotes', 'analytics', 'easyQuote', 'projects', 'rates'],
  Field: ['overview', 'customers', 'quotes', 'easyQuote', 'projects', 'systems', 'stock'],
}
const roleLabels: Record<Role, string> = { Admin: 'Kurucu / Genel Müdür', Sales: 'Satış temsilcisi', Field: 'Saha personeli' }
const recentQuotes = [
  { id: 'TK-24091', client: 'Dora Lojistik', type: 'Self-leveling epoksi', value: '₺384.600', status: 'Onay bekliyor', tone: 'amber' },
  { id: 'TK-24090', client: 'Atlas Gıda', type: 'Hijyenik poliüretan', value: '₺218.400', status: 'Taslak', tone: 'slate' },
  { id: 'TK-24087', client: 'Mavi Makine', type: 'Endüstriyel epoksi', value: '₺726.000', status: 'Onaylandı', tone: 'green' },
  { id: 'TK-24083', client: 'Kuzey Depo', type: 'Astar + son kat', value: '₺142.800', status: 'Revizyonda', tone: 'blue' },
]

function App() {
  const [active, setActive] = useState<NavKey>('overview')
  const [session, setSession] = useState<Session | null>(() => {
    const stored = sessionStorage.getItem('hutec_session')
    return stored ? JSON.parse(stored) as Session : null
  })
  const [composer, setComposer] = useState<'quote' | 'project' | null>(null)
  const [resourceAction, setResourceAction] = useState<ResourceAction | null>(null)
  const [mobileNav, setMobileNav] = useState(false)
  const [search, setSearch] = useState('')
  const [workspaceOpen, setWorkspaceOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [workspaceModalOpen, setWorkspaceModalOpen] = useState(false)
  const [workspaces, setWorkspaces] = useState<Workspace[]>(() => JSON.parse(localStorage.getItem('hutec_workspaces') ?? '[{"id":"artemis-proje","name":"Artemis Proje","slug":"artemis-proje","subtitle":"Üretim & uygulama","initials":"AP"}]') as Workspace[])
  const [workspace, setWorkspace] = useState<Workspace>(() => JSON.parse(localStorage.getItem('hutec_active_workspace') ?? '{"id":"artemis-proje","name":"Artemis Proje","slug":"artemis-proje","subtitle":"Üretim & uygulama","initials":"AP"}') as Workspace)
  useEffect(() => {
    const createQuote = () => setComposer('quote')
    const createProject = () => setComposer('project')
    const createCustomer = () => setResourceAction('customer')
    const createSystem = () => setResourceAction('system')
    const createRate = () => setResourceAction('rate')
    window.addEventListener('create-quote', createQuote)
    window.addEventListener('create-project', createProject)
    window.addEventListener('create-customer', createCustomer)
    window.addEventListener('create-system', createSystem)
    window.addEventListener('create-rate', createRate)
    return () => {
      window.removeEventListener('create-quote', createQuote)
      window.removeEventListener('create-project', createProject)
      window.removeEventListener('create-customer', createCustomer)
      window.removeEventListener('create-system', createSystem)
      window.removeEventListener('create-rate', createRate)
    }
  }, [])
  if (!session && import.meta.env.PROD) return <LoginPage onLogin={setSession} />
  const effectiveSession = session ?? { accessToken: '', user: { displayName: 'Emre Yılmaz', role: 'Admin', permissions: [] } }
  const role: Role = effectiveSession.user.role === 'Admin' || effectiveSession.user.role === 'FounderGeneralManager' ? 'Admin' : effectiveSession.user.role === 'Field' ? 'Field' : 'Sales'
  const canAccess = (module: NavKey) => roleAccess[role].includes(module)
  const logout = () => { sessionStorage.removeItem('hutec_session'); setSession(null) }
  const selectWorkspace = (nextWorkspace: Workspace) => { setWorkspace(nextWorkspace); localStorage.setItem('hutec_active_workspace', JSON.stringify(nextWorkspace)); setWorkspaceOpen(false) }
  const addWorkspace = (nextWorkspace: Workspace) => { const next = [...workspaces, nextWorkspace]; setWorkspaces(next); localStorage.setItem('hutec_workspaces', JSON.stringify(next)); selectWorkspace(nextWorkspace); setWorkspaceModalOpen(false) }
  return <div className="app-shell">
    <aside className={mobileNav ? 'sidebar sidebar-open' : 'sidebar'}>
      <div className="brand-row"><div className="brand-mark"><Box size={21} strokeWidth={2.5} /></div><div><strong>Hutec</strong><span>ERP / Zemin sistemleri</span></div><button className="icon-button mobile-close" onClick={() => setMobileNav(false)} aria-label="Menüyü kapat"><X size={18} /></button></div>
      <div className="workspace-switcher" role="button" tabIndex={0} onClick={() => { setWorkspaceOpen(value => !value); setNotificationsOpen(false); setProfileOpen(false) }} onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') setWorkspaceOpen(value => !value) }}><div className="company-avatar">{workspace.initials}</div><div><strong>{workspace.name}</strong><span>{workspace.subtitle}</span></div><ChevronDown size={15} />{workspaceOpen && <div className="popover workspace-popover"><div className="popover-label">ÇALIŞMA ALANLARI</div>{workspaces.map(item => <button className={item.id === workspace.id ? 'workspace-option active' : 'workspace-option'} key={item.id} onClick={event => { event.stopPropagation(); selectWorkspace(item) }}><span className="company-avatar">{item.initials}</span><span><strong>{item.name}</strong><small>{item.id === workspace.id ? 'Aktif çalışma alanı' : item.subtitle}</small></span>{item.id === workspace.id && <ShieldCheck size={14} />}</button>)}<button className="popover-action" onClick={event => { event.stopPropagation(); setWorkspaceModalOpen(true); setWorkspaceOpen(false) }}><Plus size={14} /> Yeni firma ekle</button></div>}</div>
      <div className="role-badge"><ShieldCheck size={14} /><span>{roleLabels[role]}</span></div>
      <div className="nav-label">ÇALIŞMA ALANI</div>
      <nav>{navItems.filter(item => canAccess(item.key)).map(({ key, label, icon: Icon }) => <button key={key} className={active === key ? 'nav-item active' : 'nav-item'} onClick={() => { setActive(key); setMobileNav(false) }}><Icon size={18} /><span>{label}</span>{key === 'quotes' && <em>4</em>}</button>)}</nav>
      <div className="nav-label secondary-label">YÖNETİM</div>
      <nav>{canAccess('projects') && <button className={active === 'projects' ? 'nav-item active' : 'nav-item'} onClick={() => { setActive('projects'); setMobileNav(false) }}><Building2 size={18} /><span>Projeler</span></button>}{canAccess('rates') && <button className={active === 'rates' ? 'nav-item active' : 'nav-item'} onClick={() => { setActive('rates'); setMobileNav(false) }}><CircleDollarSign size={18} /><span>Döviz kurları</span></button>}{canAccess('settings') && <button className={active === 'settings' ? 'nav-item active' : 'nav-item'} onClick={() => { setActive('settings'); setMobileNav(false) }}><Settings2 size={18} /><span>Ayarlar</span></button>}</nav>
      <div className="sidebar-footer"><div className="secure-badge"><ShieldCheck size={17} /><span><strong>Verileriniz izole</strong><small>Tenant güvenliği aktif</small></span></div><div className="profile-wrap"><button className="profile" onClick={() => { setProfileOpen(value => !value); setWorkspaceOpen(false); setNotificationsOpen(false) }}><div className="profile-avatar">{effectiveSession.user.displayName.slice(0, 2).toUpperCase()}</div><div><strong>{effectiveSession.user.displayName}</strong><small>{roleLabels[role]}</small></div><ChevronDown size={15} /></button>{profileOpen && <div className="popover profile-popover"><button className="popover-action"><Users size={14} /> Profil bilgileri</button><button className="popover-action"><Settings2 size={14} /> Hesap ayarları</button><button className="popover-action danger" onClick={logout}><LogOut size={14} /> Güvenli çıkış</button></div>}</div></div>
    </aside>
    <main className="main-content">
      <header className="topbar"><button className="icon-button mobile-menu" onClick={() => setMobileNav(true)} aria-label="Menüyü aç"><Menu size={21} /></button><div className="crumb"><span>Artemis Proje</span><b>/</b><strong>{navItems.find(item => item.key === active)?.label}</strong></div><div className="top-actions"><div className="search-box"><Search size={17} /><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Ara..." /></div><div className="notification-wrap"><button className="icon-button" onClick={() => { setNotificationsOpen(value => !value); setWorkspaceOpen(false); setProfileOpen(false) }} aria-label="Bildirimler"><Bell size={18} /><i /></button>{notificationsOpen && <div className="popover notification-popover"><div className="notification-head"><strong>Bildirimler</strong><span>3 yeni</span></div><div className="notification-item"><span className="notification-dot amber" /><div><strong>Teklif onayı bekliyor</strong><small>TK-24091 · 4 dk önce</small></div></div><div className="notification-item"><span className="notification-dot blue" /><div><strong>Stok seviyesi kritik</strong><small>PU sertleştirici B · 1 saat önce</small></div></div><div className="notification-item"><span className="notification-dot green" /><div><strong>Yeni müşteri eklendi</strong><small>Mavi Makine · bugün</small></div></div><button className="popover-action">Tüm bildirimleri gör <ArrowRight size={14} /></button></div>}</div><button className="top-avatar" onClick={() => { setProfileOpen(value => !value); setWorkspaceOpen(false); setNotificationsOpen(false) }}>EY</button></div></header>
      <div className="page-content">
        {active !== 'overview' && canAccess(active) && <ModulePage module={active} onNavigate={setActive} onCreate={setComposer} />}
        {active === 'overview' && <>
        <section className="page-heading"><div><p className="eyebrow">08 EYLÜL 2026, SALI</p><h1>Günaydın, Emre <span>↗</span></h1><p className="heading-sub">Bugün işlerinizi ve saha akışınızı tek yerden takip edin.</p></div>{canAccess('quotes') && <button className="primary-button" onClick={() => setComposer('quote')}><Plus size={17} /> Yeni teklif</button>}</section>
        <section className="metric-grid"><Metric label="Aktif teklifler" value="24" delta="%12,5" context="geçen aya göre" icon={<ClipboardList size={19} />} tone="orange" /><Metric label="Teklif hacmi" value="₺1,84M" delta="%8,2" context="geçen aya göre" icon={<CircleDollarSign size={19} />} tone="blue" /><Metric label="Açık projeler" value="18" delta="3 yeni" context="bu hafta" icon={<Building2 size={19} />} tone="green" /><Metric label="Kritik stok" value="7" delta="Aksiyon gerekli" context="ürün" icon={<Package size={19} />} tone="red" /></section>
        <section className="dashboard-grid"><div className="panel activity-panel"><div className="panel-heading"><div><h2>Teklif akışı</h2><p>Son 30 günlük teklif performansı</p></div><button className="select-button">Son 30 gün <ChevronDown size={14} /></button></div><div className="chart-wrap"><div className="chart-y"><span>₺1M</span><span>₺750K</span><span>₺500K</span><span>₺250K</span><span>₺0</span></div><div className="chart"><div className="chart-grid"><i /><i /><i /><i /><i /></div><svg viewBox="0 0 700 230" preserveAspectRatio="none" role="img" aria-label="Teklif hacmi grafiği"><defs><linearGradient id="chartFill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#e8a25c" stopOpacity=".28" /><stop offset="100%" stopColor="#e8a25c" stopOpacity="0" /></linearGradient></defs><path d="M0 183 C46 175 69 190 108 151 S171 147 200 128 S254 145 286 116 S338 109 374 128 S422 96 457 88 S510 112 543 69 S600 66 633 46 S677 53 700 19 L700 230 L0 230 Z" fill="url(#chartFill)" /><path d="M0 183 C46 175 69 190 108 151 S171 147 200 128 S254 145 286 116 S338 109 374 128 S422 96 457 88 S510 112 543 69 S600 66 633 46 S677 53 700 19" fill="none" stroke="#d7863f" strokeWidth="3" vectorEffect="non-scaling-stroke" /></svg><div className="chart-x"><span>10 Ağu</span><span>17 Ağu</span><span>24 Ağu</span><span>31 Ağu</span><span>07 Eyl</span></div></div></div></div><div className="panel goals-panel"><div className="panel-heading"><div><h2>Aylık hedef</h2><p>Eylül 2026</p></div><button className="more-button" aria-label="Daha fazla seçenek">•••</button></div><div className="donut"><div><strong>%72</strong><span>hedef tamamlandı</span></div></div><div className="goal-numbers"><div><strong>₺2,4M</strong><span>Hedef</span></div><div><strong>₺1,73M</strong><span>Gerçekleşen</span></div></div><button className="text-button">Hedef detaylarını gör <span>→</span></button></div></section>
        <section className="panel quotes-panel"><div className="panel-heading"><div><h2>Son teklifler</h2><p>Ekibinizin son hareketleri</p></div><button className="outline-button">Tüm teklifleri gör <span>→</span></button></div><div className="table-scroll"><table><thead><tr><th>Teklif</th><th>Müşteri</th><th>Sistem</th><th>Tutar</th><th>Durum</th><th /></tr></thead><tbody>{recentQuotes.map(quote => <tr key={quote.id}><td><strong className="quote-id">{quote.id}</strong><small>Bugün, 09:42</small></td><td><strong>{quote.client}</strong></td><td>{quote.type}</td><td><strong>{quote.value}</strong></td><td><span className={`status ${quote.tone}`}><i />{quote.status}</span></td><td><button className="row-more" aria-label={`${quote.id} seçenekleri`}>•••</button></td></tr>)}</tbody></table></div></section>
        </>}
      </div>
      {composer && <CreateFlow type={composer} onClose={() => setComposer(null)} />}
      {resourceAction && <ResourceActionModal type={resourceAction} onClose={() => setResourceAction(null)} />}
      {workspaceModalOpen && <WorkspaceModal onClose={() => setWorkspaceModalOpen(false)} onCreated={addWorkspace} />}
    </main>
  </div>
}
function Metric({ label, value, delta, context, icon, tone }: { label: string; value: string; delta: string; context: string; icon: ReactNode; tone: string }) { return <div className="metric-card"><div className={`metric-icon ${tone}`}>{icon}</div><div className="metric-label">{label}</div><strong className="metric-value">{value}</strong><div className="metric-delta"><span className={tone === 'red' ? 'negative' : ''}>{delta}</span> {context}</div></div> }
export default App
