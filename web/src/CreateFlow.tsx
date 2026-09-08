import { useState } from 'react'
import { ArrowLeft, ArrowRight, Check, MapPin, Ruler, Sparkles, UserRound, X } from 'lucide-react'
import type { CreateType } from './ModulePage'
import './flow.css'

export default function CreateFlow({ type, onClose }: { type: CreateType; onClose: () => void }) {
  const [step, setStep] = useState(1)
  const [saved, setSaved] = useState(false)
  const [area, setArea] = useState('')
  const [currency, setCurrency] = useState('TRY')
  const [total, setTotal] = useState('')
  const isQuote = type === 'quote'
  const title = isQuote ? 'Yeni teklif oluştur' : 'Yeni proje oluştur'
  const steps = isQuote ? ['Müşteri', 'Alan & sistem', 'Fiyatlandırma'] : ['Müşteri', 'Saha bilgileri', 'Planlama']
  const requiresApproval = Number(area) > 1000 || ((currency === 'USD' || currency === 'EUR') && Number(total) >= 1000)

  if (saved) return <div className="modal-backdrop"><div className="modal success-modal"><div className="success-icon"><Check size={25} /></div><h2>{isQuote ? 'Teklif taslağı hazır' : 'Proje kaydı oluşturuldu'}</h2><p>{isQuote ? 'Teklif çalışma alanından fiyatlandırmaya devam edebilirsiniz.' : 'Proje artık saha operasyonları listesinde görünecek.'}</p><button className="primary-button" onClick={onClose}>Çalışma alanına dön</button></div></div>

  return <div className="modal-backdrop"><div className="modal create-flow">
    <div className="modal-heading"><div><p className="eyebrow">{isQuote ? 'TEKLİF SİHİRBAZI' : 'PROJE KAYDI'}</p><h2>{title}</h2></div><button className="icon-button" onClick={onClose} aria-label="Kapat"><X size={18} /></button></div>
    <div className="flow-steps">{steps.map((label, index) => <div className={step === index + 1 ? 'flow-step active' : step > index + 1 ? 'flow-step done' : 'flow-step'} key={label}><span>{step > index + 1 ? <Check size={12} /> : index + 1}</span><small>{label}</small></div>)}</div>
    <div className="flow-form">
      {step === 1 && <><label>Müşteri veya firma<input placeholder="Müşteri arayın..." /><small><UserRound size={12} /> Yeni müşteri eklemek için CRM ekranını kullanın.</small></label><label>Proje adı<input placeholder={isQuote ? 'Örn. Dora Lojistik depo kaplaması' : 'Örn. Dora Lojistik - Depo'} /></label></>}
      {step === 2 && (isQuote ? <><label>Uygulama alanı (m²)<div className="input-with-icon"><Ruler size={15} /><input type="number" value={area} onChange={event => setArea(event.target.value)} placeholder="0" /></div></label><label>Para birimi<select value={currency} onChange={event => setCurrency(event.target.value)}><option>TRY</option><option>USD</option><option>EUR</option></select></label><label>Teklif tutarı<div className="input-with-icon"><input type="number" value={total} onChange={event => setTotal(event.target.value)} placeholder="0" /></div></label><label>Ürün sistemi<select defaultValue=""><option value="" disabled>Sistem seçin</option><option>KAT-EP 302 · Self-leveling epoksi</option><option>KAT-PU 180 · Hijyenik poliüretan</option><option>KAT-IND 450 · Ağır yük endüstriyel</option></select></label></> : <><label>Saha adresi<div className="input-with-icon"><MapPin size={15} /><input placeholder="Adres" /></div></label><label>Metraj (m²)<input type="number" placeholder="0" /></label></>)}
      {step === 3 && <><div className="flow-summary"><Sparkles size={18} /><div><strong>{requiresApproval ? 'Yönetim onayı gerekecek' : isQuote ? 'Fiyatlandırma hazır' : 'Planlama hazır'}</strong><p>{requiresApproval ? '1000 m² üzeri veya 1000 USD/EUR ve üzeri teklifler yönetim onayına düşer.' : isQuote ? 'Eşik aşılmadı; taslak doğrudan hazırlanabilir.' : 'Saha ekibi, başlangıç tarihi ve uygulama notları kaydedilecek.'}</p></div></div><label>{isQuote ? 'Kâr marjı (%)' : 'Planlanan başlangıç'}<input type={isQuote ? 'number' : 'date'} placeholder={isQuote ? '25' : undefined} /></label></>}
    </div>
    <div className="flow-footer"><button className="outline-button" onClick={step === 1 ? onClose : () => setStep(step - 1)}>{step === 1 ? 'Vazgeç' : <><ArrowLeft size={14} /> Geri</>}</button>{step < 3 ? <button className="primary-button" onClick={() => setStep(step + 1)}>Devam <ArrowRight size={15} /></button> : <button className="primary-button" onClick={() => setSaved(true)}><Check size={15} /> Taslağı oluştur</button>}</div>
  </div></div>
}
