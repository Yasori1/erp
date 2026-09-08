import { useState } from 'react'
import { ArrowRight, Box, Eye, EyeOff, LockKeyhole, ShieldCheck } from 'lucide-react'
import './auth.css'

export type Session = { accessToken: string; user: { displayName: string; role: string; permissions: string[] } }

const apiUrl = import.meta.env.VITE_API_URL ?? 'https://localhost:7239'

export default function LoginPage({ onLogin }: { onLogin: (session: Session) => void }) {
  const [tenantSlug, setTenantSlug] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setError('')
    try {
      const response = await fetch(`${apiUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantSlug, email, password }),
      })
      const payload = await response.json().catch(() => null)
      if (!response.ok) {
        if (response.status >= 500) throw new Error('Hutec API veritabanına bağlanamıyor. API bağlantı ayarlarını kontrol edin.')
        throw new Error(payload?.message ?? 'Giriş bilgileri geçersiz.')
      }
      const session = { accessToken: payload.accessToken, user: payload.user }
      sessionStorage.setItem('hutec_session', JSON.stringify(session))
      onLogin(session)
    } catch (requestError) {
      setError(requestError instanceof TypeError ? 'Hutec sunucusuna ulaşılamadı. API adresini ve bağlantınızı kontrol edin.' : requestError instanceof Error ? requestError.message : 'Giriş işlemi tamamlanamadı.')
    } finally {
      setLoading(false)
    }
  }

  return <main className="auth-shell"><section className="auth-visual"><div className="auth-brand"><span className="brand-mark"><Box size={22} /></span><strong>Hutec</strong></div><div className="auth-visual-copy"><p className="eyebrow">ZEMİN SİSTEMLERİ İÇİN ERP</p><h1>Tekliften uygulamaya,<br /><em>tek bir çalışma alanı.</em></h1><p>Epoksi, endüstriyel kaplama ve saha operasyonlarınızı daha kontrollü yönetin.</p></div><div className="auth-visual-footer"><ShieldCheck size={16} /> Tenant izolasyonu ve rol bazlı güvenlik aktif</div></section><section className="auth-panel"><div className="auth-form-wrap"><div className="mobile-brand"><span className="brand-mark"><Box size={20} /></span><strong>Hutec</strong></div><div className="auth-heading"><p className="eyebrow">ÇALIŞMA ALANINA GİRİŞ</p><h2>Hoş geldiniz</h2><p>Hutec hesabınıza güvenli şekilde giriş yapın.</p></div><form onSubmit={submit}><label>Firma çalışma alanı<input value={tenantSlug} onChange={event => setTenantSlug(event.target.value)} placeholder="firma-slug" autoComplete="organization" required /><small>Yöneticinizin verdiği firma kodunu kullanın.</small></label><label>E-posta adresi<input type="email" value={email} onChange={event => setEmail(event.target.value)} placeholder="ad@firma.com" autoComplete="username" required /></label><label>Şifre<div className="password-field"><input type={showPassword ? 'text' : 'password'} value={password} onChange={event => setPassword(event.target.value)} placeholder="Şifrenizi girin" autoComplete="current-password" required /><button type="button" onClick={() => setShowPassword(value => !value)} aria-label={showPassword ? 'Şifreyi gizle' : 'Şifreyi göster'}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></div></label>{error && <div className="auth-error" role="alert">{error}</div>}<button className="auth-submit" disabled={loading}>{loading ? 'Giriş yapılıyor...' : 'Güvenli giriş'}{!loading && <ArrowRight size={17} />}</button></form><div className="auth-help"><LockKeyhole size={14} /> Şifrenizi mi unuttunuz? Yöneticinizle iletişime geçin.</div></div><footer className="auth-footer">© 2026 Hutec · Zemin operasyonları için tasarlandı</footer></section></main>
}
