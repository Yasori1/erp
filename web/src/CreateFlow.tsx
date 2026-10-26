import { useState } from 'react'
import { ArrowLeft, ArrowRight, Check, MapPin, Ruler, Sparkles, UserRound, X } from 'lucide-react'
import type { CreateType } from './ModulePage'
import { loadCustomers, loadProjects, loadQuotes, saveProjects, saveQuote, type CommercialProject, type SavedQuote } from './commercialData'
import './flow.css'

export default function CreateFlow({ type, onClose }: { type: CreateType; onClose: () => void }) {
  const [step, setStep] = useState(1)
  const [saved, setSaved] = useState(false)
  const [customerId, setCustomerId] = useState('')
  const [projectId, setProjectId] = useState('')
  const [projectName, setProjectName] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [area, setArea] = useState('')
  const [currency, setCurrency] = useState('TRY')
  const [total, setTotal] = useState('')
  const [salesChannel, setSalesChannel] = useState<'Dealer' | 'Retail'>('Dealer')
  const [personalDiscount, setPersonalDiscount] = useState('')
  const [productSystemName, setProductSystemName] = useState('')
  const [projectStart, setProjectStart] = useState('')
  const customers = loadCustomers()
  const projects = loadProjects()
  const quotes = loadQuotes()
  const customer = customers.find(item => item.id === customerId)
  const project = projects.find(item => item.id === projectId && item.customerId === customerId)
  const isQuote = type === 'quote'
  const title = isQuote ? 'Yeni teklif oluştur' : 'Yeni proje oluştur'
  const steps = isQuote ? ['Müşteri', 'Alan & sistem', 'Fiyatlandırma'] : ['Müşteri', 'Saha bilgileri', 'Planlama']
  const rateKey = salesChannel === 'Dealer' ? 'dealerDiscountPercent' : 'retailDiscountPercent'
  const channelDiscount = project?.[rateKey] ?? customer?.[rateKey] ?? (salesChannel === 'Dealer' ? 10 : 5)
  const defaultPersonalDiscount = project?.personalDiscountPercent ?? customer?.personalDiscountPercent ?? 0
  const appliedPersonalDiscount = personalDiscount === '' ? defaultPersonalDiscount : Number(personalDiscount)
  const baseTotal = Number(total) || 0
  const quoteTotal = Math.round(baseTotal * (1 - channelDiscount / 100) * (1 - appliedPersonalDiscount / 100) * 100) / 100
  const requiresApproval = Number(area) > 1000 || ((currency === 'USD' || currency === 'EUR') && quoteTotal >= 1000)

  function selectCustomer(id: string) {
    const selected = customers.find(item => item.id === id)
    setCustomerId(id)
    setProjectId('')
    setContactEmail(selected?.email ?? '')
    setContactPhone(selected?.phone ?? '')
    setPersonalDiscount('')
  }

  function selectProject(id: string) {
    const selected = projects.find(item => item.id === id)
    setProjectId(id)
    if (selected) setArea(String(selected.areaM2))
    setPersonalDiscount('')
  }

  function save() {
    if (!customer) return
    if (isQuote) {
      const quoteNumber = `TK-${new Date().getFullYear()}-${String(quotes.length + 1).padStart(4, '0')}`
      const quote: SavedQuote = {
        id: crypto.randomUUID(),
        quoteNumber,
        customerId,
        projectId,
        customerName: customer.name,
        contactEmail,
        contactPhone,
        productSystemName,
        areaM2: Number(area),
        currency,
        salesChannel,
        baseTotal,
        channelDiscountPercent: channelDiscount,
        personalDiscountPercent: appliedPersonalDiscount,
        total: quoteTotal,
        status: requiresApproval ? 'Yönetim onayı bekliyor' : 'Taslak',
        createdAt: new Date().toISOString(),
      }
      saveQuote(quote)
    } else {
      const newProject: CommercialProject = {
        id: crypto.randomUUID(),
        customerId,
        name: projectName.trim(),
        areaM2: Number(area),
        startDate: projectStart || undefined,
        dealerDiscountPercent: null,
        retailDiscountPercent: null,
        personalDiscountPercent: null,
      }
      saveProjects([newProject, ...projects])
      window.dispatchEvent(new Event('commercial-project-created'))
    }
    setSaved(true)
  }

  if (saved) return <div className="modal-backdrop"><div className="modal success-modal"><div className="success-icon"><Check size={25} /></div><h2>{isQuote ? 'Teklif taslağı hazır' : 'Proje kaydı oluşturuldu'}</h2><p>{isQuote ? 'Teklif çalışma alanından fiyatlandırmaya devam edebilirsiniz.' : 'Proje artık saha operasyonları listesinde görünecek.'}</p><button className="primary-button" onClick={onClose}>Çalışma alanına dön</button></div></div>

  return <div className="modal-backdrop"><div className="modal create-flow">
    <div className="modal-heading"><div><p className="eyebrow">{isQuote ? 'TEKLİF SİHİRBAZI' : 'PROJE KAYDI'}</p><h2>{title}</h2></div><button className="icon-button" onClick={onClose} aria-label="Kapat"><X size={18} /></button></div>
    <div className="flow-steps">{steps.map((label, index) => <div className={step === index + 1 ? 'flow-step active' : step > index + 1 ? 'flow-step done' : 'flow-step'} key={label}><span>{step > index + 1 ? <Check size={12} /> : index + 1}</span><small>{label}</small></div>)}</div>
    <div className="flow-form">
      {step === 1 && <><label>Müşteri veya firma<select required value={customerId} onChange={event => selectCustomer(event.target.value)}><option value="">Müşteri seçin</option>{customers.map(item => <option value={item.id} key={item.id}>{item.name}</option>)}</select><small><UserRound size={12} /> Yeni müşteri eklemek için CRM ekranını kullanın.</small></label>{isQuote ? <><label>Proje<select value={projectId} onChange={event => selectProject(event.target.value)}><option value="">Projeye bağlama</option>{projects.filter(item => item.customerId === customerId).map(item => <option value={item.id} key={item.id}>{item.name}</option>)}</select></label><label>İletişim e-postası<input type="email" value={contactEmail} onChange={event => setContactEmail(event.target.value)} placeholder="musteri@firma.com" /></label><label>Telefon numarası<input type="tel" value={contactPhone} onChange={event => setContactPhone(event.target.value)} placeholder="+90 5xx xxx xx xx" /></label></> : <label>Proje adı<input required value={projectName} onChange={event => setProjectName(event.target.value)} placeholder="Örn. Dora Lojistik depo kaplaması" /></label>}</>}
      {step === 2 && (isQuote ? <><label>Uygulama alanı (m²)<div className="input-with-icon"><Ruler size={15} /><input required min="0.1" type="number" value={area} onChange={event => setArea(event.target.value)} placeholder="0" /></div></label><label>Para birimi<select value={currency} onChange={event => setCurrency(event.target.value)}><option>TRY</option><option>USD</option><option>EUR</option></select></label><label>Liste fiyatı<div className="input-with-icon"><input required min="0" type="number" value={total} onChange={event => setTotal(event.target.value)} placeholder="0" /></div></label><label>Satış kanalı<select value={salesChannel} onChange={event => setSalesChannel(event.target.value as 'Dealer' | 'Retail')}><option value="Dealer">Bayi</option><option value="Retail">Perakende</option></select><small>Uygulanan kanal indirimi: %{channelDiscount}</small></label><label>Ürün sistemi<select required value={productSystemName} onChange={event => setProductSystemName(event.target.value)}><option value="">Sistem seçin</option><option>KAT-EP 302 · Self-leveling epoksi</option><option>KAT-PU 180 · Hijyenik poliüretan</option><option>KAT-IND 450 · Ağır yük endüstriyel</option></select></label></> : <><label>Saha adresi<div className="input-with-icon"><MapPin size={15} /><input placeholder="Adres" /></div></label><label>Metraj (m²)<input required min="0.1" type="number" value={area} onChange={event => setArea(event.target.value)} placeholder="0" /></label></>)}
      {step === 3 && <><div className="flow-summary"><Sparkles size={18} /><div><strong>{requiresApproval ? 'Yönetim onayı gerekecek' : isQuote ? 'Fiyatlandırma hazır' : 'Planlama hazır'}</strong><p>{requiresApproval ? '1000 m² üzeri veya son teklif tutarı 1000 USD/EUR ve üzeri teklifler yönetim onayına düşer.' : isQuote ? 'Teklif, müşteri/proje oranları ile hesaplandı.' : 'Saha ekibi, başlangıç tarihi ve uygulama notları kaydedilecek.'}</p></div></div>{isQuote ? <><label>Kişisel indirim (%)<input min="0" max="100" step="0.1" type="number" value={personalDiscount} placeholder={String(defaultPersonalDiscount)} onChange={event => setPersonalDiscount(event.target.value)} /><small>Varsayılan kişisel indirim: %{defaultPersonalDiscount}</small></label><div className="flow-summary"><div><strong>Uygulanacak toplam</strong><p>Liste {baseTotal.toLocaleString('tr-TR')} {currency} · bayi/perakende %{channelDiscount} · kişisel %{appliedPersonalDiscount}</p><strong>{quoteTotal.toLocaleString('tr-TR', { style: 'currency', currency, maximumFractionDigits: 2 })}</strong></div></div></> : <label>Planlanan başlangıç<input type="date" value={projectStart} onChange={event => setProjectStart(event.target.value)} /></label>}</>}
    </div>
    <div className="flow-footer"><button className="outline-button" onClick={step === 1 ? onClose : () => setStep(step - 1)}>{step === 1 ? 'Vazgeç' : <><ArrowLeft size={14} /> Geri</>}</button>{step < 3 ? <button className="primary-button" disabled={!customer || (step === 1 && !isQuote && !projectName.trim()) || (step === 2 && isQuote && (!area || !total || !productSystemName)) || (step === 2 && !isQuote && !area)} onClick={() => setStep(step + 1)}>Devam <ArrowRight size={15} /></button> : <button className="primary-button" disabled={isQuote && (!area || !total || !productSystemName)} onClick={save}><Check size={15} /> {isQuote ? 'Teklifi kaydet' : 'Projeyi kaydet'}</button>}</div>
  </div></div>
}
