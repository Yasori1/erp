import { useMemo, useState } from 'react'
import { Calculator, CheckCircle2, MapPin, Package, Ruler, Sparkles, Truck, UserRound } from 'lucide-react'
import './easyquote.css'

const systems = [{ name: 'Tatami', average: 365, material: 245, labor: 120 }, { name: 'Self-leveling epoksi', average: 660, material: 485, labor: 175 }, { name: 'Hijyenik poliüretan', average: 830, material: 620, labor: 210 }, { name: 'Endüstriyel epoksi', average: 970, material: 710, labor: 260 }]
const locations = [{ name: 'Karşıyaka', factor: 1 }, { name: 'Bornova', factor: 1.02 }, { name: 'Manisa', factor: 1.08 }, { name: 'İstanbul', factor: 1.16 }]

export default function EasyQuotePage() {
  const [system, setSystem] = useState('Tatami')
  const [area, setArea] = useState('235')
  const [location, setLocation] = useState('Karşıyaka')
  const [shipping, setShipping] = useState(true)
  const [labor, setLabor] = useState(true)
  const selected = systems.find(item => item.name === system) ?? systems[0]
  const selectedLocation = locations.find(item => item.name === location) ?? locations[0]
  const estimate = useMemo(() => {
    const squareMeters = Number(area) || 0
    const base = squareMeters * selected.average * selectedLocation.factor
    const shippingCost = shipping ? Math.max(3500, squareMeters * 18) : 0
    const laborAdjustment = labor ? 0 : -(squareMeters * selected.labor)
    const total = base + shippingCost + laborAdjustment
    return { low: Math.round(total * .94), high: Math.round(total * 1.06) }
  }, [area, labor, selected, selectedLocation, shipping])
  return <><section className="module-header easy-heading"><div><p className="eyebrow">SATIŞ ARAÇLARI / HIZLI HESAP</p><h1>Kolay Teklif</h1><p className="heading-sub">Telefonda gelen ilk fiyat sorusuna saniyeler içinde yaklaşık aralık verin.</p></div><div className="easy-trust"><Sparkles size={15} /> Geçmiş teklif ortalamalarıyla hesaplanır</div></section><div className="easy-layout"><section className="panel easy-form-panel"><div className="easy-panel-title"><div className="easy-icon"><Calculator size={20} /></div><div><h2>Yaklaşık fiyatı hesapla</h2><p>Bilgileri girin, sistem geçmiş verilerden aralık çıkarsın.</p></div></div><div className="easy-fields"><label><span><Package size={13} /> Ürün / sistem</span><select value={system} onChange={event => setSystem(event.target.value)}>{systems.map(item => <option key={item.name}>{item.name}</option>)}</select></label><label><span><Ruler size={13} /> Uygulama alanı (m²)</span><input type="number" min="1" value={area} onChange={event => setArea(event.target.value)} /></label><label><span><MapPin size={13} /> Lokasyon</span><select value={location} onChange={event => setLocation(event.target.value)}>{locations.map(item => <option key={item.name}>{item.name}</option>)}</select></label></div><div className="easy-toggles"><label><input type="checkbox" checked={shipping} onChange={event => setShipping(event.target.checked)} /><span><Truck size={15} /><b>Nakliye dahil</b><small>Yaklaşık lojistik payı ekle</small></span><i /></label><label><input type="checkbox" checked={labor} onChange={event => setLabor(event.target.checked)} /><span><UserRound size={15} /><b>İşçilik dahil</b><small>Ortalama ekip maliyetini ekle</small></span><i /></label></div><div className="easy-source"><CheckCircle2 size={15} /><span>Bu hesap, geçmişteki {system} tekliflerinden alınan ortalama değerleri kullanır.</span></div></section><aside className="panel easy-result-panel"><div className="result-label">TAHMİNİ FİYAT ARALIĞI</div><div className="result-range">₺{estimate.low.toLocaleString('tr-TR')}<span>–</span>₺{estimate.high.toLocaleString('tr-TR')}</div><p className="result-caption">{area || 0} m² · {system} · {location}</p><div className="result-breakdown"><div><small>Ortalama m²</small><strong>₺{Math.round(selected.average * selectedLocation.factor)}</strong></div><div><small>Ürün / m²</small><strong>₺{selected.material}</strong></div><div><small>İşçilik / m²</small><strong>{labor ? `₺${selected.labor}` : 'Hariç'}</strong></div></div><div className="result-warning"><Sparkles size={15} /><p>Bu fiyat geçmiş veriler ve ortalama değerler üzerinden yaklaşık olarak hesaplanmıştır, kesin teklif değildir.</p></div><button className="primary-button easy-create"><Calculator size={15} /> Teklife dönüştür</button></aside></div><section className="easy-bottom"><div><h2>Bu araç ne için?</h2><p>Müşteri telefonda “235 m² Tatami, Karşıyaka, nakliye ve işçilik dahil yaklaşık ne olur?” diye sorduğunda hızlı ve tutarlı bir referans vermek için.</p></div><div className="easy-flow"><span>01 <b>Bilgiyi gir</b></span><span>02 <b>Aralığı gör</b></span><span>03 <b>Teklife aktar</b></span></div></section></>
}
