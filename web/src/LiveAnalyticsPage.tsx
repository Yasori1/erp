import { useEffect, useMemo, useState } from 'react'
import { BarChart3, Calculator, CheckCircle2, Clock3, FileCheck2, RotateCcw, TrendingUp } from 'lucide-react'
import { loadQuotes } from './commercialData'
import type { CreateType } from './ModulePage'
import './analytics.css'
import './live-analytics.css'

const referenceRates: Record<string, number> = {
  'KAT-EP 302 · Self-leveling epoksi': 660,
  'KAT-PU 180 · Hijyenik poliüretan': 830,
  'KAT-IND 450 · Ağır yük endüstriyel': 970,
}

export default function LiveAnalyticsPage({ onCreate }: { onCreate: (type: CreateType) => void }) {
  const [quotes, setQuotes] = useState(loadQuotes)
  const [period, setPeriod] = useState<'month' | 'year'>('month')
  const [area, setArea] = useState('235')
  const [product, setProduct] = useState(Object.keys(referenceRates)[0])
  const [discount, setDiscount] = useState('0')

  useEffect(() => {
    const refresh = () => setQuotes(loadQuotes())
    window.addEventListener('hutec-demo-data-changed', refresh)
    return () => window.removeEventListener('hutec-demo-data-changed', refresh)
  }, [])

  const monthly = useMemo(() => {
    const now = new Date()
    return Array.from({ length: 12 }, (_, index) => {
      const month = period === 'month' ? new Date(now.getFullYear(), now.getMonth() - 11 + index, 1) : new Date(now.getFullYear(), index, 1)
      const total = quotes.filter(quote => {
        const createdAt = new Date(quote.createdAt)
        return createdAt.getFullYear() === month.getFullYear() && createdAt.getMonth() === month.getMonth() && quote.currency === 'TRY'
      }).reduce((sum, quote) => sum + quote.total, 0)
      return { label: month.toLocaleDateString('tr-TR', { month: 'short' }), amount: total }
    })
  }, [period, quotes])

  const volume = quotes.filter(quote => {
    if (quote.status === 'Reddedildi') return false
    return period === 'month' || new Date(quote.createdAt).getFullYear() === new Date().getFullYear()
  }).reduce((sum, quote) => sum + quote.total, 0)
  const approved = quotes.filter(quote => quote.status === 'Onaylandı').length
  const approvalRate = quotes.length ? Math.round(approved / quotes.length * 100) : 0
  const revisions = quotes.filter(quote => quote.status === 'Revizyonda').length
  const pending = quotes.filter(quote => quote.status === 'Yönetim onayı bekliyor').length
  const historicalRate = quotes.filter(quote => quote.productSystemName === product && quote.areaM2 > 0).map(quote => quote.total / quote.areaM2)
  const averagePerM2 = historicalRate.length ? historicalRate.reduce((sum, value) => sum + value, 0) / historicalRate.length : referenceRates[product]
  const estimate = Number(area || 0) * averagePerM2 * (1 - Number(discount || 0) / 100)
  const maxAmount = Math.max(1, ...monthly.map(item => item.amount))

  return <>
    <section className="module-header analytics-heading"><div><p className="eyebrow">YÖNETİM / SATIŞ ZEKÂSI</p><h1>Analizler</h1><p className="heading-sub">Teklif performansı ve tarihsel fiyat referansları.</p></div><span className="live-data-badge"><i /> Demo kayıtlarından hesaplanıyor</span></section>
    <div className="analytics-tabs"><button className={period === 'month' ? 'tab-active' : ''} onClick={() => setPeriod('month')}>Son 12 ay</button><button className={period === 'year' ? 'tab-active' : ''} onClick={() => setPeriod('year')}>Yıllık toplam</button><button className="analytics-export" onClick={onCreate.bind(null, 'quote')}><Calculator size={13} /> Teklif oluştur</button></div>
    <section className="analytics-kpis"><AnalyticsKpi icon={<TrendingUp size={18} />} label="Teklif hacmi" value={volume.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 })} detail={`${quotes.length} teklif`} tone="orange" /><AnalyticsKpi icon={<FileCheck2 size={18} />} label="Onaylanan" value={String(approved)} detail={`%${approvalRate} onay oranı`} tone="green" /><AnalyticsKpi icon={<RotateCcw size={18} />} label="Revizyonda" value={String(revisions)} detail="teklif" tone="blue" /><AnalyticsKpi icon={<Clock3 size={18} />} label="Onay bekleyen" value={String(pending)} detail="yönetim kararı" tone="violet" /></section>
    <section className="analytics-grid"><section className="panel analytics-chart-panel"><div className="panel-heading"><div><h2>Aylık teklif hacmi</h2><p>{period === 'month' ? 'Son 12 ay · TRY kayıtları' : 'Bu yıl · TRY kayıtları'}</p></div><BarChart3 size={18} /></div><div className="live-month-chart">{monthly.map(item => <div className="live-month-column" key={item.label}><small>{item.amount ? `${Math.round(item.amount / 1000)}K` : '—'}</small><div className="live-month-track"><i style={{ height: `${item.amount / maxAmount * 100}%` }} /></div><span>{item.label}</span></div>)}</div>{quotes.length === 0 && <p className="empty-state">Grafik teklif kayıtları oluşturulduğunda dolar.</p>}</section>
      <section className="panel approval-panel"><div className="panel-heading"><div><h2>Fiyat referansı</h2><p>{historicalRate.length ? `${historicalRate.length} eşleşen tekliften ortalama` : 'Geçmiş eşleşme yok · demo referansı'}</p></div><Calculator size={18} /></div><div className="live-estimator"><label>Ürün sistemi<select value={product} onChange={event => setProduct(event.target.value)}>{Object.keys(referenceRates).map(item => <option key={item}>{item}</option>)}</select></label><label>Alan (m²)<input type="number" min="1" value={area} onChange={event => setArea(event.target.value)} /></label><label>İndirim (%)<input type="number" min="0" max="100" value={discount} onChange={event => setDiscount(event.target.value)} /></label><div className="live-estimate"><span>Tahmini teklif</span><strong>{estimate.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 })}</strong><small>{averagePerM2.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 })} / m² referans</small></div><button className="primary-button" onClick={() => onCreate('quote')}><CheckCircle2 size={15} /> Bu tahminle teklif oluştur</button></div></section></section>
  </>
}

function AnalyticsKpi({ icon, label, value, detail, tone }: { icon: React.ReactNode; label: string; value: string; detail: string; tone: string }) {
  return <article className="analytics-kpi"><div className={`analytics-kpi-icon ${tone}`}>{icon}</div><small>{label}</small><strong>{value}</strong><p>{detail}</p></article>
}
