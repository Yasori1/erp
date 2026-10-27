import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Check, ClipboardList, Plus, Search, UserRound } from 'lucide-react'
import type { CreateType } from './ModulePage'
import { loadAuditEvents, loadCustomerActivities, loadCustomers, loadProjectUpdates, loadProjects, loadQuotes, recordAudit, saveCustomerActivities, saveCustomers, saveProjectUpdates, saveProjects, saveQuotes, type CustomerActivity, type ProjectUpdate, type SavedQuote } from './commercialData'
import './business-pages.css'

export function CustomerCrmPage() {
  const [customers, setCustomers] = useState(loadCustomers)
  const [activities, setActivities] = useState(loadCustomerActivities)
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', contact: '', email: '', phone: '', city: '' })
  const [activityNote, setActivityNote] = useState('')
  const [activityType, setActivityType] = useState<CustomerActivity['type']>('Görüşme')

  useEffect(() => {
    const refresh = () => { setCustomers(loadCustomers()); setActivities(loadCustomerActivities()) }
    window.addEventListener('hutec-demo-data-changed', refresh)
    return () => window.removeEventListener('hutec-demo-data-changed', refresh)
  }, [])

  const filtered = useMemo(() => customers.filter(item => `${item.name} ${item.contact} ${item.email} ${item.city}`.toLocaleLowerCase('tr').includes(search.toLocaleLowerCase('tr'))), [customers, search])
  const selectedCustomer = customers.find(item => item.id === selectedId) ?? filtered[0]
  const customerActivities = activities.filter(item => item.customerId === selectedCustomer?.id)

  function createCustomer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (customers.some(item => item.email.toLowerCase() === form.email.trim().toLowerCase())) return
    const customer = { id: crypto.randomUUID(), ...form, name: form.name.trim(), status: 'Aktif', dealerDiscountPercent: 10, retailDiscountPercent: 5, personalDiscountPercent: 0 }
    const next = [customer, ...customers]
    saveCustomers(next)
    recordAudit('Müşteri oluşturuldu', customer.name, `${customer.contact} · ${customer.email}`)
    setCustomers(next)
    setSelectedId(customer.id)
    setShowForm(false)
    setForm({ name: '', contact: '', email: '', phone: '', city: '' })
  }

  function addActivity(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedCustomer || !activityNote.trim()) return
    const activity: CustomerActivity = { id: crypto.randomUUID(), customerId: selectedCustomer.id, customerName: selectedCustomer.name, type: activityType, note: activityNote.trim(), createdAt: new Date().toISOString() }
    saveCustomerActivities([activity, ...activities])
    recordAudit(`Müşteri ${activityType.toLocaleLowerCase('tr')} kaydedildi`, selectedCustomer.name, activityNote.trim())
    setActivityNote('')
  }

  return <>
    <section className="module-header"><div><p className="eyebrow">CRM / MÜ�?TERİLER</p><h1>Müşteri ilişkileri</h1><p className="heading-sub">Müşteri kartları, görüşmeler ve satış geçmişi.</p></div><button className="primary-button" onClick={() => setShowForm(value => !value)}><Plus size={16} /> Yeni müşteri</button></section>
    <div className="business-toolbar"><label className="module-search"><Search size={16} /><input placeholder="Müşteri, kişi veya şehir ara" value={search} onChange={event => setSearch(event.target.value)} /></label><span>{customers.length} müşteri</span></div>
    {showForm && <form className="business-form" onSubmit={createCustomer}><label>Firma adı<input required value={form.name} onChange={event => setForm(current => ({ ...current, name: event.target.value }))} /></label><label>İletişim kişisi<input required value={form.contact} onChange={event => setForm(current => ({ ...current, contact: event.target.value }))} /></label><label>E-posta<input required type="email" value={form.email} onChange={event => setForm(current => ({ ...current, email: event.target.value }))} /></label><label>Telefon<input required type="tel" value={form.phone} onChange={event => setForm(current => ({ ...current, phone: event.target.value }))} /></label><label>�?ehir<input value={form.city} onChange={event => setForm(current => ({ ...current, city: event.target.value }))} /></label><button className="primary-button">Müşteriyi kaydet</button></form>}
    <div className="business-split"><section className="panel module-panel"><div className="panel-heading"><div><h2>Müşteri listesi</h2><p>Seçilen müşteri kartı ve aktivite geçmişi</p></div></div><div className="table-scroll"><table><thead><tr><th>Firma</th><th>İletişim</th><th>Telefon</th><th>�?ehir</th><th>Durum</th></tr></thead><tbody>{filtered.map(customer => <tr key={customer.id} className={selectedCustomer?.id === customer.id ? 'business-selected-row' : ''} onClick={() => setSelectedId(customer.id)}><td><button className="business-row-link">{customer.name}</button></td><td>{customer.contact}<small>{customer.email}</small></td><td>{customer.phone}</td><td>{customer.city || '—'}</td><td>{customer.status}</td></tr>)}</tbody></table></div>{filtered.length === 0 && <p className="empty-state">Eşleşen müşteri yok.</p>}</section>
      <section className="panel business-detail"><div className="business-detail-heading"><UserRound size={18} /><div><h2>{selectedCustomer?.name ?? 'Müşteri seçin'}</h2><p>{selectedCustomer?.contact ?? 'Müşteri detayları'}</p></div></div>{selectedCustomer && <><div className="business-contact"><span>{selectedCustomer.email}</span><span>{selectedCustomer.phone}</span></div><form className="activity-form" onSubmit={addActivity}><div className="activity-form-row"><select aria-label="Aktivite türü" value={activityType} onChange={event => setActivityType(event.target.value as CustomerActivity['type'])}><option>Görüşme</option><option>E-posta</option><option>Not</option></select><button className="icon-button" aria-label="Aktivite kaydet"><Check size={16} /></button></div><textarea required placeholder="Görüşme veya takip notu ekle" value={activityNote} onChange={event => setActivityNote(event.target.value)} /></form><div className="activity-list">{customerActivities.map(activity => <article key={activity.id}><strong>{activity.type}</strong><time>{new Date(activity.createdAt).toLocaleString('tr-TR')}</time><p>{activity.note}</p></article>)}{customerActivities.length === 0 && <p className="empty-state">Henüz aktivite yok.</p>}</div></>}</section></div>
  </>
}

export function QuotesWorkflowPage({ onCreate }: { onCreate: (type: CreateType) => void }) {
  const [quotes, setQuotes] = useState(loadQuotes)
  const [filter, setFilter] = useState('Tümü')
  const [rejecting, setRejecting] = useState('')
  const [reason, setReason] = useState('')
  useEffect(() => { const refresh = () => setQuotes(loadQuotes()); window.addEventListener('hutec-demo-data-changed', refresh); return () => window.removeEventListener('hutec-demo-data-changed', refresh) }, [])
  const filters = ['Tümü', 'Taslak', 'Yönetim onayı bekliyor', 'Onaylandı', 'Reddedildi', 'Revizyonda']
  const filtered = filter === 'Tümü' ? quotes : quotes.filter(quote => quote.status === filter)

  function changeStatus(quote: SavedQuote, status: string, approvalReason = '') {
    const updated = { ...quote, status, approvalReason, revision: status === 'Revizyonda' ? (quote.revision ?? 0) + 1 : quote.revision }
    saveQuotes(quotes.map(item => item.id === quote.id ? updated : item))
    recordAudit(`Teklif ${status.toLocaleLowerCase('tr')}`, quote.quoteNumber, approvalReason || quote.customerName)
    setQuotes(current => current.map(item => item.id === quote.id ? updated : item))
    setRejecting('')
    setReason('')
  }

  return <><section className="module-header"><div><p className="eyebrow">SATI�? / TEKLİFLER</p><h1>Teklif çalışma alanı</h1><p className="heading-sub">Teklifleri hazırlayın, onaylayın, revizyona alın ve projeye dönüştürün.</p></div><button className="primary-button" onClick={() => onCreate('quote')}><Plus size={16} /> Yeni teklif</button></section>
    <div className="module-tabs business-tabs">{filters.map(item => <button key={item} className={filter === item ? 'tab-active' : ''} onClick={() => setFilter(item)}>{item}{item === 'Yönetim onayı bekliyor' && <b>{quotes.filter(quote => quote.status === item).length}</b>}</button>)}</div>
    <section className="quote-workflow-list">{filtered.map(quote => <article className="panel quote-workflow-card" key={quote.id}><div className="quote-workflow-main"><div className="quote-workflow-meta"><span className="quote-id">{quote.quoteNumber}</span><span>{new Date(quote.createdAt).toLocaleDateString('tr-TR')}</span><span>Rev. {quote.revision ?? 1}</span></div><h2>{quote.customerName}</h2><p>{quote.productSystemName} · {quote.areaM2.toLocaleString('tr-TR')} m² · {quote.salesChannel === 'Dealer' ? 'Bayi' : 'Perakende'}</p><div className="business-contact"><span>{quote.contactEmail || 'E-posta yok'}</span><span>{quote.contactPhone || 'Telefon yok'}</span></div>{quote.approvalReason && <p className="quote-reject-reason">Gerekçe: {quote.approvalReason}</p>}</div><div className="quote-workflow-total"><span className={`status ${quote.status === 'Onaylandı' ? 'green' : quote.status === 'Reddedildi' ? 'red' : quote.status.includes('bekliyor') ? 'amber' : 'slate'}`}><i />{quote.status}</span><strong>{quote.total.toLocaleString('tr-TR', { style: 'currency', currency: quote.currency, maximumFractionDigits: 2 })}</strong><small>Liste: {quote.baseTotal.toLocaleString('tr-TR', { style: 'currency', currency: quote.currency, maximumFractionDigits: 2 })}</small></div>{quote.status === 'Yönetim onayı bekliyor' && <div className="quote-workflow-actions"><button className="primary-button" onClick={() => changeStatus(quote, 'Onaylandı')}><Check size={15} /> Onayla</button><button className="outline-button" onClick={() => setRejecting(quote.id)}>Reddet</button><button className="outline-button" onClick={() => changeStatus(quote, 'Revizyonda')}>Revizyona gönder</button></div>}{rejecting === quote.id && <form className="quote-reject-form" onSubmit={event => { event.preventDefault(); if (reason.trim()) changeStatus(quote, 'Reddedildi', reason.trim()) }}><textarea required placeholder="Ret gerekçesi" value={reason} onChange={event => setReason(event.target.value)} /><button className="primary-button">Red kararını kaydet</button><button type="button" className="outline-button" onClick={() => setRejecting('')}>Vazgeç</button></form>}</article>)}{filtered.length === 0 && <p className="empty-state">Bu durumda teklif yok.</p>}</section>
  </>
}

export function ApprovedQuotesToProjects() {
  const [quotes, setQuotes] = useState(loadQuotes)
  const [projects, setProjects] = useState(loadProjects)
  useEffect(() => {
    const refresh = () => { setQuotes(loadQuotes()); setProjects(loadProjects()) }
    window.addEventListener('hutec-demo-data-changed', refresh)
    return () => window.removeEventListener('hutec-demo-data-changed', refresh)
  }, [])
  const approvedQuotes = quotes.filter(quote => quote.status === 'Onaylandı')

  function createProject(quote: SavedQuote) {
    const linked = projects.find(project => project.id === quote.projectId)
    if (linked) {
      const next = projects.map(project => project.id === linked.id ? { ...project, status: 'Planlama' as const } : project)
      saveProjects(next)
      setProjects(next)
      recordAudit('Onaylı teklif projeye aktarıldı', quote.quoteNumber, linked.name)
      return
    }
    const project = { id: crypto.randomUUID(), customerId: quote.customerId, name: `${quote.customerName} · ${quote.productSystemName}`, areaM2: quote.areaM2, status: 'Planlama' as const, siteAddress: quote.projectAddress, dealerDiscountPercent: null, retailDiscountPercent: null, personalDiscountPercent: null }
    const next = [project, ...projects]
    saveProjects(next)
    setProjects(next)
    recordAudit('Onaylı teklif projeye aktarıldı', quote.quoteNumber, project.name)
  }

  return <section className="panel module-panel"><div className="panel-heading"><div><h2>Sahaya aktarılabilir teklifler</h2><p>Onaylanan teklifi proje planlamasına alın</p></div></div>{approvedQuotes.length ? <div className="approved-transfer-list">{approvedQuotes.map(quote => <article key={quote.id}><div><strong>{quote.quoteNumber} · {quote.customerName}</strong><small>{quote.productSystemName} · {quote.areaM2.toLocaleString('tr-TR')} m²</small></div><button className="outline-button" onClick={() => createProject(quote)}>{projects.some(project => project.id === quote.projectId) ? 'Projeyi planlamaya al' : 'Proje oluştur'}</button></article>)}</div> : <p className="empty-state">Önce teklif onaylandığında burada proje oluşturabilirsiniz.</p>}</section>
}

export function ProjectsWorkflowPage({ onCreate }: { onCreate: (type: CreateType) => void }) {
  const [projects, setProjects] = useState(loadProjects)
  const [updates, setUpdates] = useState(loadProjectUpdates)
  const [customers] = useState(loadCustomers)
  const [selectedId, setSelectedId] = useState('')
  const [note, setNote] = useState('')
  useEffect(() => { const refresh = () => { setProjects(loadProjects()); setUpdates(loadProjectUpdates()) }; window.addEventListener('hutec-demo-data-changed', refresh); return () => window.removeEventListener('hutec-demo-data-changed', refresh) }, [])
  const selected = projects.find(project => project.id === selectedId) ?? projects[0]

  function updateProject(id: string, patch: Partial<(typeof projects)[number]>, action: string) {
    const next = projects.map(project => project.id === id ? { ...project, ...patch } : project)
    saveProjects(next)
    const project = next.find(item => item.id === id)
    if (project) recordAudit(action, project.name, String(patch.status ?? patch.assignedTo ?? 'Proje güncellendi'))
    setProjects(next)
  }

  function addSiteNote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selected || !note.trim()) return
    const update: ProjectUpdate = { id: crypto.randomUUID(), projectId: selected.id, projectName: selected.name, author: 'Demo Kurucu', note: note.trim(), createdAt: new Date().toISOString() }
    saveProjectUpdates([update, ...updates])
    recordAudit('Saha günlüğü eklendi', selected.name, note.trim())
    setNote('')
  }

  return <><section className="module-header"><div><p className="eyebrow">OPERASYON / SAHA</p><h1>Projeler</h1><p className="heading-sub">Proje aşamalarını, saha sorumlularını ve günlük notlarını yönetin.</p></div><button className="primary-button" onClick={() => onCreate('project')}><Plus size={16} /> Yeni proje</button></section><div className="business-split projects-split"><section className="panel module-panel"><div className="panel-heading"><div><h2>Aktif projeler</h2><p>{projects.length} proje</p></div></div><div className="table-scroll"><table><thead><tr><th>Proje</th><th>Müşteri</th><th>Metraj</th><th>Aşama</th></tr></thead><tbody>{projects.map(project => <tr key={project.id} className={selected?.id === project.id ? 'business-selected-row' : ''} onClick={() => setSelectedId(project.id)}><td><button className="business-row-link">{project.name}</button></td><td>{customers.find(item => item.id === project.customerId)?.name ?? '—'}</td><td>{project.areaM2.toLocaleString('tr-TR')} m²</td><td>{project.status ?? 'Keşif'}</td></tr>)}</tbody></table></div></section>{selected && <section className="panel business-detail"><div className="business-detail-heading"><ClipboardList size={18} /><div><h2>{selected.name}</h2><p>{customers.find(item => item.id === selected.customerId)?.name}</p></div></div><label className="business-field">Proje aşaması<select value={selected.status ?? 'Keşif'} onChange={event => updateProject(selected.id, { status: event.target.value as typeof selected.status }, 'Proje aşaması güncellendi')}><option>Keşif</option><option>Planlama</option><option>Planlandı</option><option>Uygulamada</option><option>Tamamlandı</option></select></label><label className="business-field">Saha sorumlusu<input value={selected.assignedTo ?? ''} placeholder="Personel adı" onChange={event => updateProject(selected.id, { assignedTo: event.target.value }, 'Saha sorumlusu güncellendi')} /></label><form className="activity-form" onSubmit={addSiteNote}><textarea required placeholder="Saha günlüğü / uygulama notu" value={note} onChange={event => setNote(event.target.value)} /><button className="primary-button">Saha notu ekle</button></form><div className="activity-list">{updates.filter(item => item.projectId === selected.id).map(item => <article key={item.id}><strong>{item.author}</strong><time>{new Date(item.createdAt).toLocaleString('tr-TR')}</time><p>{item.note}</p></article>)}{updates.filter(item => item.projectId === selected.id).length === 0 && <p className="empty-state">Saha günlüğü boş.</p>}</div></section>}</div></>
}

export function AuditLogPage() {
  const [events, setEvents] = useState(loadAuditEvents)
  useEffect(() => { const refresh = () => setEvents(loadAuditEvents()); window.addEventListener('hutec-demo-data-changed', refresh); return () => window.removeEventListener('hutec-demo-data-changed', refresh) }, [])
  return <><section className="module-header"><div><p className="eyebrow">YÖNETİM / DENETİM</p><h1>İşlem geçmişi</h1><p className="heading-sub">Demo çalışma alanındaki müşteri, teklif ve proje değişiklikleri.</p></div></section><section className="panel module-panel"><div className="table-scroll"><table><thead><tr><th>Zaman</th><th>Kullanıcı</th><th>İşlem</th><th>Kayıt</th><th>Detay</th></tr></thead><tbody>{events.map(event => <tr key={event.id}><td>{new Date(event.createdAt).toLocaleString('tr-TR')}</td><td>{event.actor}</td><td>{event.action}</td><td>{event.target}</td><td>{event.detail}</td></tr>)}</tbody></table></div>{events.length === 0 && <p className="empty-state">Henüz işlem yok.</p>}</section></>
}
