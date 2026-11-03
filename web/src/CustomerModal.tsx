import { useEffect, useState } from 'react'
import { Plus, X, Mail, Phone, Building2, CheckCircle2 } from 'lucide-react'
import type { Session } from './LoginPage'
import { apiRequest } from './api'

export type Customer = {
  id?: string
  name: string
  contactName?: string
  email?: string
  phone?: string
  status?: string
}

type CustomerRecord = {
  id: string
  companyName: string
  contactName: string
  email: string
  phone: string
  status: string
}

export default function CustomerModal({ session, onClose, onConfirm }: {
  session: Session
  onClose: () => void
  onConfirm: (customer: Customer) => Promise<void>
}) {
  const [mode, setMode] = useState<'select' | 'add'>('select')
  const [customers, setCustomers] = useState<Customer[]>([])
  const [name, setName] = useState('')
  const [contactName, setContactName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const status = 'Lead'
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    void apiRequest<CustomerRecord[]>(session, '/api/workspace/customers')
      .then(records => {
        if (active) {
          setCustomers(records.map(record => ({
            id: record.id,
            name: record.companyName,
            contactName: record.contactName,
            email: record.email,
            phone: record.phone,
            status: record.status,
          })))
        }
      })
      .catch(requestError => {
        if (active) setError(requestError instanceof Error ? requestError.message : 'Müşteriler yüklenemedi.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => { active = false }
  }, [session])

  const handleConfirm = async (customer: Customer) => {
    setSaving(true)
    setError('')
    try {
      await onConfirm(customer)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Müşteri işlemi tamamlanamadı.')
    } finally {
      setSaving(false)
    }
  }

  const handleAdd = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    await handleConfirm({ name: name.trim(), contactName: contactName.trim(), email: email.trim(), phone: phone.trim(), status })
  }

  return (
    <div className="modal-backdrop">
      <div className="modal customer-modal">
        <div className="modal-heading">
          <div>
            <p className="eyebrow">MÜŞTERİ SEÇİMİ</p>
            <h2>Kolay Teklif için Firma</h2>
            <p>Teklifin bağlanacağı müşteriyi seçin veya yeni firma ekleyin.</p>
          </div>
          <button className="icon-button" onClick={onClose} aria-label="Kapat" disabled={saving}>
            <X size={18} />
          </button>
        </div>

        <div className="customer-actions">
          <button
            className={`action-button ${mode === 'select' ? 'active' : ''}`}
            onClick={() => { setMode('select'); setError('') }}
            disabled={saving}
          >
            <Building2 size={16} />
            Mevcut firmalar
          </button>
          <button
            className={`action-button ${mode === 'add' ? 'active' : ''}`}
            onClick={() => { setMode('add'); setError('') }}
            disabled={saving}
          >
            <Plus size={16} />
            Yeni firma ekle
          </button>
        </div>

        {error && <div className="auth-error" role="alert">{error}</div>}
        {mode === 'select' ? (
          <div className="customer-list">
            {loading ? <p className="empty-state">Müşteriler yükleniyor...</p> : customers.map(customer => (
              <button
                key={customer.id}
                className="customer-card"
                onClick={() => void handleConfirm(customer)}
                disabled={saving}
              >
                <div className="customer-info">
                  <Building2 size={20} />
                  <div>
                    <strong>{customer.name}</strong>
                    <div className="customer-contact">
                      {customer.email && <><Mail size={13} />{customer.email}</>}
                      {customer.phone && <><Phone size={13} />{customer.phone}</>}
                    </div>
                    <span className="status badge">{customer.status}</span>
                  </div>
                </div>
                <CheckCircle2 size={20} />
              </button>
            ))}
            {!loading && customers.length === 0 && !error && (
              <p className="empty-state">Henüz müşteri yok. Yeni firma ekleyerek başlayın.</p>
            )}
          </div>
        ) : (
          <form className="customer-form" onSubmit={handleAdd}>
            <label>
              Firma adı<span className="required">*</span>
              <input
                type="text"
                value={name}
                onChange={event => setName(event.target.value)}
                placeholder="Örn: Çelik Metal"
                required
                maxLength={200}
              />
            </label>

            <label>
              İletişim kişisi
              <input
                type="text"
                value={contactName}
                onChange={event => setContactName(event.target.value)}
                placeholder="Yetkili kişi"
                maxLength={200}
              />
            </label>

            <label>
              E-posta
              <input
                type="email"
                value={email}
                onChange={event => setEmail(event.target.value)}
                placeholder="ornek@firma.com"
                maxLength={254}
              />
            </label>

            <label>
              Telefon
              <input
                type="tel"
                value={phone}
                onChange={event => setPhone(event.target.value)}
                placeholder="+90 555 123 45 67"
                maxLength={50}
              />
            </label>

            <button className="secondary-button modal-submit" type="submit" disabled={saving || !name.trim()}>
              <Plus size={16} />
              {saving ? 'Kaydediliyor...' : 'Firmayı kaydet ve seç'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
