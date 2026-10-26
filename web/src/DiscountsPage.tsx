import { useState } from 'react'
import { Percent, Plus, Save } from 'lucide-react'
import { loadCustomers, loadProjects, saveCustomers, saveProjects, type CommercialCustomer, type CommercialProject } from './commercialData'
import type { CreateType } from './ModulePage'
import './commercial.css'

type Tab = 'customers' | 'projects'

export default function DiscountsPage({ initialTab = 'customers' }: { initialTab?: Tab }) {
  const [tab, setTab] = useState<Tab>(initialTab)
  const [customers, setCustomers] = useState(loadCustomers)
  const [projects, setProjects] = useState(loadProjects)
  const [saved, setSaved] = useState(false)

  function updateCustomer(id: string, field: keyof CommercialCustomer, value: string) {
    setCustomers(current => current.map(customer => customer.id === id
      ? { ...customer, [field]: field.endsWith('Percent') ? Number(value) || 0 : value }
      : customer))
    setSaved(false)
  }

  function updateProject(id: string, field: keyof CommercialProject, value: string) {
    setProjects(current => current.map(project => project.id === id
      ? { ...project, [field]: value === '' ? null : Number(value) || 0 }
      : project))
    setSaved(false)
  }

  function persist() {
    saveCustomers(customers)
    saveProjects(projects)
    setSaved(true)
  }

  const createProject = () => window.dispatchEvent(new CustomEvent<CreateType>('create-project'))

  return <>
    <section className="module-header"><div><p className="eyebrow">TİCARİ KURALLAR</p><h1>Müşteri ve proje iskontoları</h1><p className="heading-sub">Bayi, perakende ve kişisel oranları kayıt bazında yönetin.</p></div><button className="primary-button" onClick={tab === 'projects' ? createProject : persist}>{tab === 'projects' ? <Plus size={16} /> : <Save size={16} />}{tab === 'projects' ? 'Yeni proje' : saved ? 'Kaydedildi' : 'Değişiklikleri kaydet'}</button></section>
    <div className="module-tabs"><button className={tab === 'customers' ? 'tab-active' : ''} onClick={() => setTab('customers')}>Müşteri oranları</button><button className={tab === 'projects' ? 'tab-active' : ''} onClick={() => setTab('projects')}>Proje oranları</button></div>
    <div className="discount-intro"><Percent size={18} /><p>Proje için özel oran girilmezse müşterinin oranı kullanılır. Yeni teklif oluşturulurken oranlar o teklif için sabitlenir.</p></div>
    {tab === 'customers' ? <section className="panel module-panel commercial-table"><div className="panel-heading"><div><h2>Müşteri fiyat koşulları</h2><p>Varsayılan kanal ve kişisel indirim oranları</p></div></div><div className="table-scroll"><table><thead><tr><th>Müşteri / iletişim</th><th>Bayi (%)</th><th>Perakende (%)</th><th>Kişisel (%)</th></tr></thead><tbody>{customers.map(customer => <tr key={customer.id}><td><strong>{customer.name}</strong><small>{customer.contact} · {customer.email} · {customer.phone}</small></td><td><RateInput label={`${customer.name} bayi indirimi`} value={customer.dealerDiscountPercent} onChange={value => updateCustomer(customer.id, 'dealerDiscountPercent', value)} /></td><td><RateInput label={`${customer.name} perakende indirimi`} value={customer.retailDiscountPercent} onChange={value => updateCustomer(customer.id, 'retailDiscountPercent', value)} /></td><td><RateInput label={`${customer.name} kişisel indirimi`} value={customer.personalDiscountPercent} onChange={value => updateCustomer(customer.id, 'personalDiscountPercent', value)} /></td></tr>)}</tbody></table></div></section> : <section className="project-rate-list">{projects.map(project => {
      const customer = customers.find(item => item.id === project.customerId)
      return <article className="project-rate-row" key={project.id}><div className="project-rate-heading"><div><span className="quote-id">{customer?.name ?? 'Müşteri seçilmemiş'}</span><h2>{project.name}</h2></div><span>{project.areaM2.toLocaleString('tr-TR')} m²</span></div><div className="project-rate-fields"><RateInput label="Bayi indirimi" value={project.dealerDiscountPercent} inherited={customer?.dealerDiscountPercent ?? 10} onChange={value => updateProject(project.id, 'dealerDiscountPercent', value)} allowInherit /><RateInput label="Perakende indirimi" value={project.retailDiscountPercent} inherited={customer?.retailDiscountPercent ?? 5} onChange={value => updateProject(project.id, 'retailDiscountPercent', value)} allowInherit /><RateInput label="Kişisel indirim" value={project.personalDiscountPercent} inherited={customer?.personalDiscountPercent ?? 0} onChange={value => updateProject(project.id, 'personalDiscountPercent', value)} allowInherit /></div></article>
    })}{projects.length === 0 && <p className="empty-state">Henüz proje yok. Yeni proje oluşturarak oran tanımlayabilirsiniz.</p>}</section>}
  </>
}

function RateInput({ label, value, inherited, onChange, allowInherit = false }: { label: string; value: number | null; inherited?: number; onChange: (value: string) => void; allowInherit?: boolean }) {
  return <label className="rate-field"><span>{label}</span><span className="rate-input-wrap"><input aria-label={label} type="number" min="0" max="100" step="0.1" value={value ?? ''} placeholder={allowInherit ? `${inherited ?? 0}` : '0'} onChange={event => onChange(event.target.value)} /><b>%</b></span>{allowInherit && <small>{value === null ? `Müşteri oranı kullanılır: %${inherited ?? 0}` : 'Bu proje için özel oran'}</small>}</label>
}