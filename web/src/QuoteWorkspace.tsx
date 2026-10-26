import { ClipboardList, Mail, Phone, Plus } from 'lucide-react'
import { loadQuotes, type SavedQuote } from './commercialData'
import type { CreateType } from './ModulePage'
import './commercial.css'

export default function QuoteWorkspace({ onCreate, fallback }: { onCreate: (type: CreateType) => void; fallback: React.ReactNode }) {
  const quotes = loadQuotes()
  if (quotes.length === 0) return <>{fallback}</>
  return <>
    <section className="module-header"><div><p className="eyebrow">TEKLİFLER / ÇALIŞMA ALANI</p><h1>Teklifler</h1><p className="heading-sub">Kaydedilen teklifleri, iletişim bilgilerini ve uygulanan iskonto oranlarını takip edin.</p></div><button className="primary-button" onClick={() => onCreate('quote')}><Plus size={16} /> Yeni teklif</button></section>
    <div className="saved-quote-list">{quotes.map(quote => <QuoteRow key={quote.id} quote={quote} />)}</div>
  </>
}

function QuoteRow({ quote }: { quote: SavedQuote }) {
  return <article className="saved-quote"><div className="saved-quote-main"><div className="quote-number"><ClipboardList size={16} /><span>{quote.quoteNumber}</span></div><h2>{quote.customerName}</h2><p>{quote.productSystemName} · {quote.areaM2.toLocaleString('tr-TR')} m² · {quote.salesChannel === 'Dealer' ? 'Bayi' : 'Perakende'}</p><div className="quote-contact"><span><Mail size={13} />{quote.contactEmail || 'E-posta eklenmedi'}</span><span><Phone size={13} />{quote.contactPhone || 'Telefon eklenmedi'}</span></div></div><div className="saved-quote-total"><small>{quote.status}</small><strong>{quote.total.toLocaleString('tr-TR', { style: 'currency', currency: quote.currency, maximumFractionDigits: 2 })}</strong><span>Liste fiyatı {quote.baseTotal.toLocaleString('tr-TR', { style: 'currency', currency: quote.currency, maximumFractionDigits: 2 })}</span><span>Bayi/perakende %{quote.channelDiscountPercent} + kişisel %{quote.personalDiscountPercent}</span></div></article>
}