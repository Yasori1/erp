import { useEffect, useState } from 'react'
import { Calculator, CheckCircle2, MapPin, Package, Ruler, Sparkles, Truck, UserRound } from 'lucide-react'
import CustomerModal, { type Customer } from './CustomerModal'
import QuoteConfirmModal from './QuoteConfirmModal'
import type { Session } from './LoginPage'
import { apiRequest } from './api'
import './easyquote.css'
import './easyquote-flow.css'

const systems = ['Tatami', 'Self-leveling epoksi', 'Hijyenik poliüretan', 'Endüstriyel epoksi']

const locations = ['Karşıyaka', 'Bornova', 'Manisa', 'İstanbul']

type EasyQuoteEstimate = {
  low: number
  high: number
  averagePerM2: number
  historicalQuoteCount: number
  isHistoricalDataAvailable: boolean
}

type EasyQuoteRequest = {
  productSystemName: string
  areaM2: number
  location: string
  includeShipping: boolean
  includeLabor: boolean
}

type EasyQuoteResult = {
  requestKey: string
  estimate?: EasyQuoteEstimate
  error?: string
}

type QuoteDraft = {
  estimate: EasyQuoteEstimate
  area: string
  system: string
  location: string
  shipping: boolean
  labor: boolean
}

type QuoteConfirmData = Omit<QuoteDraft, 'area'> & {
  area: number
  customer: Customer
}

type CustomerRecord = {
  id: string
  companyName: string
  contactName: string
  email: string
  phone: string
  status: string
}

export default function EasyQuotePage({ session }: { session: Session }) {
  const [system, setSystem] = useState('Tatami')
  const [area, setArea] = useState('235')
  const [location, setLocation] = useState('Karşıyaka')
  const [shipping, setShipping] = useState(true)
  const [labor, setLabor] = useState(true)
  const [estimateResult, setEstimateResult] = useState<EasyQuoteResult | null>(null)

  const [customerModalOpen, setCustomerModalOpen] = useState(false)
  const [quoteTemp, setQuoteTemp] = useState<QuoteDraft | null>(null)
  const [quoteConfirmOpen, setQuoteConfirmOpen] = useState(false)
  const [confirmData, setConfirmData] = useState<QuoteConfirmData | null>(null)

  const areaM2 = Number(area)
  const estimateRequest: EasyQuoteRequest = {
    productSystemName: system,
    areaM2,
    location,
    includeShipping: shipping,
    includeLabor: labor,
  }
  const estimateRequestKey = JSON.stringify(estimateRequest)
  const validArea = Number.isFinite(areaM2) && areaM2 > 0

  useEffect(() => {
    if (!validArea) return
    let active = true
    const timeoutId = window.setTimeout(() => {
      void apiRequest<EasyQuoteEstimate>(session, '/api/workspace/easy-quote', {
        method: 'POST',
        body: estimateRequestKey,
      }).then(result => {
        if (active) setEstimateResult({ requestKey: estimateRequestKey, estimate: result })
      }).catch(requestError => {
        if (active) setEstimateResult({
          requestKey: estimateRequestKey,
          error: requestError instanceof Error ? requestError.message : 'Fiyat hesaplanamadı.',
        })
      })
    }, 250)

    return () => {
      active = false
      window.clearTimeout(timeoutId)
    }
  }, [estimateRequestKey, session, validArea])

  const currentEstimateResult = estimateResult?.requestKey === estimateRequestKey ? estimateResult : null
  const estimate = currentEstimateResult?.estimate ?? null
  const estimateError = currentEstimateResult?.error ?? ''
  const estimateLoading = validArea && currentEstimateResult === null

  const handleConvertToQuote = () => {
    if (!estimate) return
    setQuoteTemp({
      estimate,
      area,
      system,
      location,
      shipping,
      labor
    })
    setCustomerModalOpen(true)
  }

  const handleCustomerConfirm = async (customer: Customer) => {
    if (!quoteTemp) return

    let savedCustomer = customer
    if (!customer.id) {
      const record = await apiRequest<CustomerRecord>(session, '/api/workspace/easy-quote/customers', {
        method: 'POST',
        body: JSON.stringify({
          companyName: customer.name,
          contactName: customer.contactName ?? '',
          email: customer.email ?? '',
          phone: customer.phone ?? '',
          status: customer.status ?? 'Lead',
        }),
      })
      savedCustomer = {
        id: record.id,
        name: record.companyName,
        contactName: record.contactName,
        email: record.email,
        phone: record.phone,
        status: record.status,
      }
    }

    setConfirmData({
      customer: savedCustomer,
      system: quoteTemp.system,
      area: Number(quoteTemp.area),
      location: quoteTemp.location,
      estimate: quoteTemp.estimate,
      shipping: quoteTemp.shipping,
      labor: quoteTemp.labor
    })
    setCustomerModalOpen(false)
    setQuoteConfirmOpen(true)
  }

  return (
    <>
      <section className="module-header easy-heading">
        <div>
          <p className="eyebrow">SATIŞ ARAÇLARI / HIZLI HESAP</p>
          <h1>Kolay Teklif</h1>
          <p className="heading-sub">
            Telefonda gelen ilk fiyat sorusuna saniyeler içinde yaklaşık aralık verin.
          </p>
        </div>
        <div className="easy-trust">
          <Sparkles size={15} />{' '}
          Geçmiş teklif ortalamalarıyla hesaplanır
        </div>
      </section>

      <div className="easy-layout">
        <section className="panel easy-form-panel">
          <div className="easy-panel-title">
            <div className="easy-icon">
              <Calculator size={20} />
            </div>
            <div>
              <h2>Yaklaşık fiyatı hesapla</h2>
              <p>Bilgileri girin, sistem geçmiş verilerden aralık çıkarsın.</p>
            </div>
          </div>

          <div className="easy-fields">
            <label>
              <span>
                <Package size={13} />{''}
                Ürün / sistem
              </span>
              <select
                value={system}
                onChange={event => setSystem(event.target.value)}
              >
                {systems.map(item => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </label>

            <label>
              <span>
                <Ruler size={13} />{''}
                Uygulama alanı (m²)
              </span>
              <input
                type="number"
                min="1"
                value={area}
                onChange={event => setArea(event.target.value)}
              />
            </label>

            <label>
              <span>
                <MapPin size={13} />{''}
                Lokasyon
              </span>
              <select
                value={location}
                onChange={event => setLocation(event.target.value)}
              >
                {locations.map(item => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="easy-toggles">
            <label>
              <input
                type="checkbox"
                checked={shipping}
                onChange={event => setShipping(event.target.checked)}
              />
              <span>
                <Truck size={15} />
                <b>Nakliye dahil</b>
                <small>Yaklaşık lojistik payı ekle</small>
              </span>
              <i />
            </label>

            <label>
              <input
                type="checkbox"
                checked={labor}
                onChange={event => setLabor(event.target.checked)}
              />
              <span>
                <UserRound size={15} />
                <b>İşçilik dahil</b>
                <small>Ortalama ekip maliyetini ekle</small>
              </span>
              <i />
            </label>
          </div>

          <div className="easy-source">
            <CheckCircle2 size={15} />
            <span>
              {!validArea
                ? 'Geçerli bir uygulama alanı girin.'
                : estimateLoading
                ? 'Geçmiş teklifler inceleniyor...'
                : estimateError
                  ? 'Fiyat hesaplaması başarısız oldu.'
                  : estimate?.isHistoricalDataAvailable
                    ? `${estimate.historicalQuoteCount} geçmiş ${system} teklifine göre hesaplandı.`
                    : estimate
                      ? 'Bu sistem için geçmiş teklif bulunamadı; başlangıç tahmini kullanılıyor.'
                      : 'Fiyat hesaplaması bekleniyor.'}
            </span>
          </div>
        </section>

        <aside className="panel easy-result-panel">
          <div className="result-label">TAHMİNİ FİYAT ARALIĞI</div>

          <div className="result-range">
            {estimateLoading ? 'Hesaplanıyor...' : estimate ? `₺${estimate.low.toLocaleString('tr-TR')}` : '—'}
            <span>-</span>
            {estimateLoading ? '...' : estimate ? `₺${estimate.high.toLocaleString('tr-TR')}` : '—'}
          </div>

          {estimateError && <p className="auth-error" role="alert">{estimateError}</p>}

          <p className="result-caption">{area || 0} m² · {system} · {location}</p>

          <div className="result-breakdown">
            <div>
              <small>Ortalama m²</small>
              <strong>{estimate ? `₺${Math.round(estimate.averagePerM2).toLocaleString('tr-TR')}` : '—'}</strong>
            </div>
            <div>
              <small>Geçmiş teklif</small>
              <strong>{estimate?.historicalQuoteCount ?? '—'}</strong>
            </div>
            <div>
              <small>Nakliye / işçilik</small>
              <strong>{shipping ? 'Nakliye dahil' : 'Nakliye hariç'} · {labor ? 'işçilik dahil' : 'işçilik hariç'}</strong>
            </div>
          </div>

          <div className="result-warning">
            <Sparkles size={15} />
            <p>Bu fiyat API tarafından geçmiş teklif verileri üzerinden yaklaşık olarak hesaplanmıştır, kesin teklif değildir.</p>
          </div>

          <button className="primary-button easy-create" onClick={handleConvertToQuote} disabled={Number(area) <= 0 || !estimate || estimateLoading}>
            <Calculator size={15} />{''}
            Teklife dönüştür
          </button>
        </aside>
      </div>

      <section className="easy-bottom">
        <div>
          <h2>Bu araç ne için?</h2>
          <p>
            Müşteri telefonda "235 m² Tatami, Karşıyaka, nakliye ve işçilik dahil yaklaşık ne olur?"
            diye sorduğunda hızlı ve tutarlı bir referans vermek için.
          </p>
        </div>

        <div className="easy-flow">
          <span>
            01 <b>Bilgiyi gir</b>
          </span>
          <span>
            02 <b>Aralığı gör</b>
          </span>
          <span>
            03 <b>Teklife aktar</b>
          </span>
        </div>
      </section>

      {/* Customer Modal */}
      {customerModalOpen && (
        <CustomerModal
          session={session}
          onClose={() => setCustomerModalOpen(false)}
          onConfirm={handleCustomerConfirm}
        />
      )}

      {/* Quote Confirm Modal */}
      {quoteConfirmOpen && confirmData && (
        <QuoteConfirmModal
          session={session}
          data={confirmData}
          onClose={() => setQuoteConfirmOpen(false)}
          onConfirm={() => {
            setQuoteConfirmOpen(false)
            setConfirmData(null)
            setQuoteTemp(null)
          }}
        />
      )}
    </>
  )
}