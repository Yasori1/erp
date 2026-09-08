import { Check, X } from 'lucide-react'

export type ResourceAction = 'customer' | 'system' | 'rate'
const config = {
  customer: { eyebrow: 'CRM / MÜŞTERİ', title: 'Yeni müşteri', description: 'Müşteri kaydını çalışma alanına ekleyin.', action: 'Müşteriyi kaydet', fields: ['Firma adı', 'İletişim kişisi', 'E-posta'] },
  system: { eyebrow: 'PLM / ÜRÜN SİSTEMİ', title: 'Yeni ürün sistemi', description: 'Katmanlı zemin sisteminizi tanımlayın.', action: 'Sistemi kaydet', fields: ['Sistem adı', 'Katman kompozisyonu', 'Sarfiyat (kg / m²)'] },
  rate: { eyebrow: 'FİNANS / DÖVİZ', title: 'Manuel kur girişi', description: 'Tekliflerde kullanılacak kuru sabitleyin.', action: 'Kuru kaydet', fields: ['Para birimi', 'Kur değeri', 'Geçerlilik tarihi'] },
} as const

export default function ResourceActionModal({ type, onClose }: { type: ResourceAction; onClose: () => void }) {
  const item = config[type]
  return <div className="modal-backdrop"><div className="modal"><div className="modal-heading"><div><p className="eyebrow">{item.eyebrow}</p><h2>{item.title}</h2><p>{item.description}</p></div><button className="icon-button" onClick={onClose} aria-label="Kapat"><X size={18} /></button></div>{item.fields.map(field => <label key={field}>{field}<input placeholder={field} /></label>)}<button className="primary-button modal-submit" onClick={onClose}><Check size={16} /> {item.action}</button></div></div>
}
