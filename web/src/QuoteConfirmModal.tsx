import { useState } from 'react'
import { Building2, Check, Mail, Phone, X } from 'lucide-react'
import type { Session } from './LoginPage'
import type { Customer } from './CustomerModal'
import { apiRequest } from './api'

type QuoteConfirmData = {
  customer: Customer
  system: string
  area: number
  location: string
  estimate: { low: number; high: number }
  shipping: boolean
  labor: boolean
}

type CreatedQuote = {
  quoteNumber: string
  total: number
  status: string
  approvalStatus: string
}

export default function QuoteConfirmModal({ session, onClose, data, onConfirm }: {
  session: Session
  onClose: () => void
  data: QuoteConfirmData
  onConfirm: () => void
}) {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [createdQuote, setCreatedQuote] = useState<CreatedQuote | null>(null)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    try {
      const quoteNumber = `TK-${Date.now()}`
      const quote = await apiRequest<CreatedQuote>(session, '/api/workspace/quotes', {
        method: 'POST',
        body: JSON.stringify({
          quoteNumber,
          customerId: data.customer.id,
          productSystemName: `${data.system} - ${data.location}`,
          areaM2: data.area,
          total: Math.round((data.estimate.low + data.estimate.high) / 2),
          marginPercent: 0,
          currency: 'TRY',
        }),
      })
      setCreatedQuote(quote)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Teklif kaydedilemedi.')
    } finally {
      setSaving(false)
    }
  }

  if (createdQuote) {
    return (
      <div className="modal-backdrop">
        <div className="modal success-modal" role="status">
          <div className="success-icon"><Check size={25} /></div>
          <h2>Teklif kaydedildi</h2>
          <p>{createdQuote.quoteNumber} numaralı teklif sisteme kaydedildi. Durum: {createdQuote.status}.</p>
          {createdQuote.approvalStatus === 'Pending' && <p>Teklif yönetici onayı bekliyor.</p>}
          <button className="primary-button" onClick={onConfirm}>Tamam</button>
        </div>
      </div>
    )
  }

  return (
    <div className="modal-backdrop">
      <div className="modal quote-confirm-modal">
        <div className="modal-heading">
          <div>
            <p className="eyebrow">TEKLİF ÖZETİ</p>
            <h2>Teklifi kaydet</h2>
            <p>Kontrol edip teklifi çalışma alanınıza kaydedin.</p>
          </div>
          <button className="icon-button" onClick={onClose} aria-label="Kapat" disabled={saving}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={event => void handleSubmit(event)}>
          <div className="confirm-section">
            <h3><Building2 size={16} /> Müşteri</h3>
            <div className="customer-summary">
              <strong>{data.customer.name}</strong>
              {data.customer.status && <span className="badge">{data.customer.status}</span>}
            </div>
            <div className="contact-info">
              {data.customer.email && <><Mail size={13} />{data.customer.email}</>}
              {data.customer.phone && <><Phone size={13} />{data.customer.phone}</>}
            </div>
          </div>

          <div className="quote-summary">
            <h3>Yaklaşık teklif</h3>
            <div className="summary-details">
              <span>{data.area} m² · {data.system} · {data.location}</span>
              <span>Nakliye {data.shipping ? 'dahil' : 'hariç'} · İşçilik {data.labor ? 'dahil' : 'hariç'}</span>
            </div>
            <div className="price-range">
              <span className="price-low">₺{data.estimate.low.toLocaleString('tr-TR')}</span>
              <span>–</span>
              <span className="price-high">₺{data.estimate.high.toLocaleString('tr-TR')}</span>
            </div>
            <p className="heading-sub">Sisteme aralığın orta değeri kaydedilir. E-posta gönderimi yapılmaz; lokasyon ve nakliye/işçilik tercihleri kayıtta ayrı alanlar olarak tutulmaz.</p>
          </div>

          {error && <div className="auth-error" role="alert">{error}</div>}

          <div className="modal-actions">
            <button type="button" className="secondary-button" onClick={onClose} disabled={saving}>
              <X size={15} /> İptal
            </button>
            <button type="submit" className="primary-button" disabled={saving}>
              <Check size={15} /> {saving ? 'Kaydediliyor...' : 'Teklifi kaydet'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
