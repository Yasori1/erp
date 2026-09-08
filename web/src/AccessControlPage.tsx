import { useEffect, useState } from 'react'
import { Check, ChevronRight, LockKeyhole, Save, ShieldCheck, SlidersHorizontal, Users } from 'lucide-react'
import './access.css'
import './access-fix.css'

type Permission = { key: string; label: string; group: string }
type Role = { code: string; name: string; description: string; color: string; permissions: string[]; areaLimit: number; currencyLimit: number }
const permissions: Permission[] = [
  { key: 'customers.read', label: 'Müşterileri görüntüleme', group: 'CRM' }, { key: 'customers.write', label: 'Müşteri ekleme ve düzenleme', group: 'CRM' },
  { key: 'quotes.read', label: 'Teklifleri görüntüleme', group: 'Teklifler' }, { key: 'quotes.write', label: 'Teklif oluşturma ve revize etme', group: 'Teklifler' }, { key: 'quotes.approve', label: 'Teklif onaylama', group: 'Teklifler' },
  { key: 'products.read', label: 'Ürün ve sistemleri görüntüleme', group: 'Ürün & sistem' }, { key: 'products.write', label: 'Ürün ve sistem düzenleme', group: 'Ürün & sistem' },
  { key: 'stock.read', label: 'Stokları görüntüleme', group: 'Depo & satın alma' }, { key: 'stock.write', label: 'Stok miktarlarını güncelleme', group: 'Depo & satın alma' },
  { key: 'analytics.read', label: 'Analizleri görüntüleme', group: 'Analizler' }, { key: 'users.manage', label: 'Personel ve izin yönetimi', group: 'Yönetim' },
]
const initialRoles: Role[] = [
  { code: 'FounderGeneralManager', name: 'Kurucu / Genel Müdür', description: 'Sistemde tam yetki', color: 'gold', permissions: permissions.map(item => item.key), areaLimit: 100000, currencyLimit: 100000 },
  { code: 'SalesManager', name: 'Satış Müdürü', description: 'Satış ekibi ve teklif yönetimi', color: 'blue', permissions: ['customers.read', 'customers.write', 'quotes.read', 'quotes.write', 'products.read', 'stock.read', 'analytics.read'], areaLimit: 1000, currencyLimit: 1000 },
  { code: 'SalesRepresentative', name: 'Satış Temsilcisi', description: 'Müşteri ve kendi teklif akışı', color: 'orange', permissions: ['customers.read', 'customers.write', 'quotes.read', 'quotes.write', 'products.read', 'stock.read'], areaLimit: 1000, currencyLimit: 1000 },
  { code: 'StockProcurement', name: 'Stok / Satın Alma Sorumlusu', description: 'Ürün, tedarikçi ve depo', color: 'green', permissions: ['products.read', 'products.write', 'stock.read', 'stock.write', 'quotes.read', 'analytics.read'], areaLimit: 1000, currencyLimit: 1000 },
  { code: 'OperationsManager', name: 'Yönetici / Operasyon', description: 'Operasyon takibi ve genel analiz', color: 'violet', permissions: ['customers.read', 'quotes.read', 'products.read', 'stock.read', 'analytics.read'], areaLimit: 1000, currencyLimit: 1000 },
]

export default function AccessControlPage() {
  const [roles, setRoles] = useState<Role[]>(() => {
    const stored = localStorage.getItem('hutec_role_matrix')
    return stored ? JSON.parse(stored) as Role[] : initialRoles
  })
  const [selectedCode, setSelectedCode] = useState(initialRoles[0].code)
  const [saved, setSaved] = useState(false)
  const selected = roles.find(role => role.code === selectedCode) ?? roles[0]
  useEffect(() => {
    localStorage.setItem('hutec_role_matrix', JSON.stringify(roles))
  }, [roles])
  const togglePermission = (key: string) => setRoles(current => current.map(role => role.code !== selected.code ? role : { ...role, permissions: role.permissions.includes(key) ? role.permissions.filter(item => item !== key) : [...role.permissions, key] }))
  const updateLimit = (field: 'areaLimit' | 'currencyLimit', value: string) => setRoles(current => current.map(role => role.code !== selected.code ? role : { ...role, [field]: Number(value) || 0 }))
  return <><section className="module-header"><div><p className="eyebrow">YÖNETİM / ERİŞİM KONTROLÜ</p><h1>Roller & yetkiler</h1><p className="heading-sub">Hangi personelin hangi iş akışına erişeceğini ve onay sınırlarını yönetin.</p></div><button className="primary-button" onClick={() => { setSaved(true); window.setTimeout(() => setSaved(false), 2200) }}><Save size={16} /> {saved ? 'Kaydedildi' : 'Değişiklikleri kaydet'}</button></section><div className="access-notice"><ShieldCheck size={17} /><div><strong>Yetkiler tenant bazında uygulanır</strong><p>Bir roldeki değişiklik yalnızca Artemis Proje çalışma alanını etkiler. Genel Müdür rolü her zaman tam erişime sahiptir.</p></div></div><div className="access-layout"><section className="panel role-list-panel"><div className="access-panel-title"><div><h2>Roller</h2><p>5 rol tanımlı</p></div><Users size={18} /></div>{roles.map(role => <button className={role.code === selected.code ? 'role-list-item selected' : 'role-list-item'} key={role.code} onClick={() => { setSelectedCode(role.code); setSaved(false) }}><span className={`role-color ${role.color}`} /><span><strong>{role.name}</strong><small>{role.description}</small></span><ChevronRight size={15} /></button>)}</section><section className="panel permission-panel"><div className="access-panel-title"><div><h2>{selected.name}</h2><p>Rol izinleri ve teklif onay limiti</p></div><span className="permission-count">{selected.permissions.length}/{permissions.length} izin</span></div><div className="limit-grid"><label>Alan onay eşiği (m²)<input type="number" value={selected.areaLimit} onChange={event => updateLimit('areaLimit', event.target.value)} /><small>Bu alanın üzerindeki teklifler yönetime düşer.</small></label><label>Döviz onay eşiği (USD / EUR)<input type="number" value={selected.currencyLimit} onChange={event => updateLimit('currencyLimit', event.target.value)} /><small>Bu tutarın üzerindeki döviz teklifleri yönetime düşer.</small></label></div><div className="permission-groups">{Array.from(new Set(permissions.map(item => item.group))).map(group => <div className="permission-group" key={group}><h3>{group}</h3>{permissions.filter(item => item.group === group).map(permission => <label className="permission-row" key={permission.key}><span><strong>{permission.label}</strong><small>{permission.key}</small></span><input type="checkbox" checked={selected.permissions.includes(permission.key)} onChange={() => togglePermission(permission.key)} /><i><Check size={12} /></i></label>)}</div>)}</div></section></div><div className="quick-quote-access"><LockKeyhole size={16} /><div><strong>Kolay Teklif herkes için açık</strong><p>Personellerin hızlı yaklaşık fiyat alması için bu özellik rol izninden bağımsız kullanılabilir. Kesin teklif ve onay akışı yine normal yetkilere tabidir.</p></div><SlidersHorizontal size={16} /></div></>
}
