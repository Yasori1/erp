import { useState, type FormEvent } from 'react'
import { KeyRound, UserRound, X } from 'lucide-react'
import type { Session } from './LoginPage'
import { apiRequest } from './api'
import './profile-settings.css'

type SettingsSection = 'profile' | 'account'
type AccountChangeSubmission = {
  user: Session['user'] | null
  approvalRequired: boolean
  message: string
}

export default function ProfileSettingsModal({ session, section, onClose, onProfileUpdated }: {
  session: Session
  section: SettingsSection
  onClose: () => void
  onProfileUpdated: (user: Session['user']) => void
}) {
  const [displayName, setDisplayName] = useState(session.user.displayName)
  const [email, setEmail] = useState(session.user.email)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function submitProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      const result = await apiRequest<AccountChangeSubmission>(session, '/api/auth/profile', {
        method: 'PUT',
        body: JSON.stringify({ displayName, email }),
      })
      if (result.user) onProfileUpdated(result.user)
      setSuccess(result.message)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Profil bilgileri kaydedilemedi.')
    } finally {
      setSaving(false)
    }
  }

  async function submitPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')
    if (newPassword !== confirmPassword) {
      setError('Yeni şifreler birbiriyle eşleşmiyor.')
      setSaving(false)
      return
    }

    try {
      const result = await apiRequest<AccountChangeSubmission>(session, '/api/auth/change-password', {
        method: 'PUT',
        body: JSON.stringify({ currentPassword, newPassword }),
      })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setSuccess(result.message)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Şifre değiştirilemedi.')
    } finally {
      setSaving(false)
    }
  }

  const isProfile = section === 'profile'

  return (
    <div className="account-modal-backdrop" onMouseDown={event => {
      if (event.target === event.currentTarget && !saving) onClose()
    }}>
      <section className="account-modal" role="dialog" aria-modal="true" aria-labelledby="account-modal-title">
        <header className="account-modal-heading">
          <div className="account-modal-icon">{isProfile ? <UserRound size={19} /> : <KeyRound size={19} />}</div>
          <div>
            <p className="eyebrow">{isProfile ? 'KİŞİSEL BİLGİLER' : 'GÜVENLİK'}</p>
            <h2 id="account-modal-title">{isProfile ? 'Profil bilgileri' : 'Hesap ayarları'}</h2>
          </div>
          <button type="button" className="icon-button" onClick={onClose} aria-label="Kapat" disabled={saving}><X size={18} /></button>
        </header>

        {isProfile ? (
          <form onSubmit={event => void submitProfile(event)}>
            <label>Ad soyad
              <input required minLength={2} maxLength={120} value={displayName} onChange={event => setDisplayName(event.target.value)} />
            </label>
            <label>E-posta adresi
              <input required type="email" maxLength={255} autoComplete="email" value={email} onChange={event => setEmail(event.target.value)} />
            </label>
            <p className="account-modal-hint">E-posta değişikliği sonraki girişlerde yeni adresinizi kullanmanızı gerektirir.</p>
            {error && <div className="auth-error" role="alert">{error}</div>}
            {success && <div className="account-modal-success" role="status">{success}</div>}
            <footer className="account-modal-actions">
              <button type="button" className="secondary-button" onClick={onClose} disabled={saving}>Kapat</button>
              <button type="submit" className="primary-button" disabled={saving}>{saving ? 'Kaydediliyor...' : 'Değişiklikleri kaydet'}</button>
            </footer>
          </form>
        ) : (
          <form onSubmit={event => void submitPassword(event)}>
            <label>Mevcut şifre
              <input required type="password" autoComplete="current-password" value={currentPassword} onChange={event => setCurrentPassword(event.target.value)} />
            </label>
            <label>Yeni şifre
              <input required type="password" minLength={8} maxLength={128} autoComplete="new-password" value={newPassword} onChange={event => setNewPassword(event.target.value)} />
            </label>
            <label>Yeni şifreyi tekrar girin
              <input required type="password" minLength={8} maxLength={128} autoComplete="new-password" value={confirmPassword} onChange={event => setConfirmPassword(event.target.value)} />
            </label>
            <p className="account-modal-hint">Şifreniz en az 8 karakter olmalıdır.</p>
            {error && <div className="auth-error" role="alert">{error}</div>}
            {success && <div className="account-modal-success" role="status">{success}</div>}
            <footer className="account-modal-actions">
              <button type="button" className="secondary-button" onClick={onClose} disabled={saving}>Kapat</button>
              <button type="submit" className="primary-button" disabled={saving}>{saving ? 'Güncelleniyor...' : 'Şifreyi değiştir'}</button>
            </footer>
          </form>
        )}
      </section>
    </div>
  )
}
