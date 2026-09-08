import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { BarChart3, Calculator, CheckCircle2, ChevronDown, Clock3, FileCheck2, RefreshCw, RotateCcw, Sparkles, TrendingUp } from 'lucide-react'
import './analytics.css'
import type { CreateType } from './ModulePage'

const productRates = [
  { name: 'Self-leveling epoksi', code: 'KAT-EP 302', product: 485, labor: 175, average: 660, projects: 18 },
  { name: 'Hijyenik poliüretan', code: 'KAT-PU 180', product: 620, labor: 210, average: 830, projects: 11 },
  { name: 'Endüstriyel epoksi', code: 'KAT-IND 450', product: 710, labor: 260, average: 970, projects: 9 },
]
const monthlyData = [430, 510, 470, 620, 580, 740, 690, 860, 810, 930, 880, 1020]

export default function AnalyticsPage({ onCreate }: { onCreate: (type: CreateType) => void }) {
  const [period, setPeriod] = useState<'month' | 'year'>('month')
  const [area, setArea] = useState('235')
  const [product, setProduct] = useState('Self-leveling epoksi')
  const [discount, setDiscount] = useState('0')
  const selectedProduct = productRates.find(item => item.name === product) ?? productRates[0]
  const estimate = useMemo(() => {
    const subtotal = Number(area || 0) * selectedProduct.average
    return subtotal * (1 - Number(discount || 0) / 100)
  }, [area, discount, selectedProduct])
  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (event.target instanceof Element && event.target.closest('.calculator-button')) onCreate('quote')
    }
    document.addEventListener('click', handleClick)
    return () => document.removeEventListener('click', handleClick)
  }, [onCreate])

  return <><PageHeader /><div className="analytics-tabs"><button className={period === 'month' ? 'tab-active' : ''} onClick={() => setPeriod('month')}>Aylık görünüm</button><button className={period === 'year' ? 'tab-active' : ''} onClick={() => setPeriod('year')}>Yıllık özet</button><button className="analytics-export"><RefreshCw size={13} /> Veriyi yenile</button></div><section className="analytics-kpis"><AnalyticsKpi icon={<TrendingUp size={18} />} label="Toplam teklif hacmi" value={period === 'month' ? '₺1,84M' : '₺14,62M'} change="%18,4" detail={period === 'month' ? 'geçen aya göre' : 'geçen yıla göre'} tone="orange" /><AnalyticsKpi icon={<FileCheck2 size={18} />} label="Onaylanan teklifler" value={period === 'month' ? '18' : '146'} change="%75" detail="onay oranı" tone="green" /><AnalyticsKpi icon={<RotateCcw size={18} />} label="Revizyon sayısı" value={period === 'month' ? '7' : '54'} change="-%8,2" detail="geçen döneme göre" tone="blue" /><AnalyticsKpi icon={<Clock3 size={18} />} label="Ortalama dönüş" value="2,4 gün" change="-%12" detail="daha hızlı" tone="violet" /></section><section className="analytics-grid"><section className="panel analytics-chart-panel"><div className="panel-heading"><div><h2>Teklif hacmi</h2><p>{period === 'month' ? 'Son 12 ayın aylık toplamı' : 'Yıllık karşılaştırma'}</p></div><button className="select-button">TRY <ChevronDown size={13} /></button></div><div className="analytics-chart"><div className="analytics-y"><span>₺1,2M</span><span>₺900K</span><span>₺600K</span><span>₺300K</span><span>₺0</span></div><div className="bars">{monthlyData.map((value, index) => <div className="bar-column" key={index}><div className="bar-value">{value >= 1000 ? '1,02M' : `${value}K`}</div><div className="bar" style={{ height: `${value / 1.2}%` }} /><small>{['Eki', 'Kas', 'Ara', 'Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl'][index]}</small></div>)}</div></div></section><section className="panel approval-panel"><div className="panel-heading"><div><h2>Teklif dağılımı</h2><p>{period === 'month' ? 'Bu ay' : 'Bu yıl'}</p></div><button className="more-button">•••</button></div><div className="approval-donut"><div><strong>24</strong><span>toplam teklif</span></div></div><div className="approval-legend"><Legend color="green" label="Onaylandı" value="18 · %75" /><Legend color="orange" label="Onay bekliyor" value="4 · %17" /><Legend color="blue" label="Revizyonda" value="2 · %8" /></div></section></section><section className="analytics-grid lower"><section className="panel rate-panel"><div className="panel-heading"><div><h2>Ürün & işçilik ortalamaları</h2><p>Son tamamlanan projelerden hesaplanır</p></div><button className="icon-text-button"><BarChart3 size={14} /> Detaylı rapor</button></div><div className="rate-table"><div className="rate-row rate-head"><span>Ürün sistemi</span><span>Ürün / m²</span><span>İşçilik / m²</span><span>Ortalama / m²</span></div>{productRates.map(item => <div className="rate-row" key={item.code}><span><strong>{item.name}</strong><small>{item.code} · {item.projects} proje</small></span><b>₺{item.product}</b><b>₺{item.labor}</b><strong>₺{item.average}</strong></div>)}</div></section><section className="panel calculator-panel"><div className="panel-heading"><div><h2>Hızlı yaklaşık teklif</h2><p>İlk görüşmede kaba fiyat verin</p></div><div className="calculator-badge"><Calculator size={15} /></div></div><label>Ürün sistemi<select value={product} onChange={event => setProduct(event.target.value)}>{productRates.map(item => <option key={item.name}>{item.name}</option>)}</select></label><div className="calculator-fields"><label>Alan (m²)<input type="number" min="0" value={area} onChange={event => setArea(event.target.value)} /></label><label>İndirim (%)<input type="number" min="0" max="100" value={discount} onChange={event => setDiscount(event.target.value)} /></label></div><div className="estimate-result"><div><small>Yaklaşık toplam</small><strong>₺{Math.round(estimate).toLocaleString('tr-TR')}</strong></div><span>₺{selectedProduct.average} / m²</span></div><div className="estimate-note"><Sparkles size={14} /> Nakliye, kat koşulları ve saha keşfi ayrıca netleştirilir.</div><button className="primary-button calculator-button"><CheckCircle2 size={15} /> Teklife aktar</button></section></section></>
}
function PageHeader() { return <section className="module-header analytics-heading"><div><p className="eyebrow">YÖNETİM / SATIŞ ZEKÂSI</p><h1>Analizler</h1><p className="heading-sub">Teklif performansını, fiyat referanslarını ve hızlı yaklaşık değerleri takip edin.</p></div><div className="analytics-live"><i /> Canlı veriler · 08 Eyl 2026</div></section> }
function AnalyticsKpi({ icon, label, value, change, detail, tone }: { icon: ReactNode; label: string; value: string; change: string; detail: string; tone: string }) { return <article className="analytics-kpi"><div className={`analytics-kpi-icon ${tone}`}>{icon}</div><small>{label}</small><strong>{value}</strong><p><span className={change.startsWith('-') ? 'down' : ''}>{change}</span> {detail}</p></article> }
function Legend({ color, label, value }: { color: string; label: string; value: string }) { return <div className="legend-row"><span className={`legend-dot ${color}`} /> <span>{label}</span><strong>{value}</strong></div> }
