import { useState, type FormEvent } from 'react'
import { ArrowRight, Box, LockKeyhole, ShieldCheck } from 'lucide-react'
import { completeDemoInvite, getDemoInvite } from './api'
import './auth.css'
import './invite.css'

export default function InviteAcceptancePage({ token }: { token: string }) {
  const [invite] = useState(() => getDemoInvite(token))
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [accepted, setAccepted] = useState(false)
  const [loading, setLoading] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    if (password.length < 12) {
      setError('Şifre en az 12 karakter olmalıdır.')
      return
    }
    if (password !== confirmPassword) {
      setError('Şifreler eşleşmiyor.')
      return
    }

    setLoading(true)
    try {
      await completeDemoInvite(token, password)
      window.history.replaceState({}, '', window.location.pathname)
      setAccepted(true)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Davet kabul edilemedi.')
    } finally {
      setLoading(false)
    }
  }

  return <main className="auth-shell"><section className="auth-visual"><div className="auth-brand"><span className="brand-mark"><Box size={22} /></span><strong>Hutec</strong></div><div className="auth-visual-copy"><p className="eyebrow">EKİBE GÜVENLİ KATILIM</p><h1>Çalışma alanına<br /><em>hoş geldin.</em></h1><p>Davetli kullanıcı hesabınızı oluşturun ve ekibinizin çalışma alanına katılın.</p></div><div className="auth-visual-footer"><ShieldCheck size={16} /> Kişisel hesabınız rol izinleriyle korunur</div></section><section className="auth-panel"><div className="auth-form-wrap"><div className="mobile-brand"><span className="brand-mark"><Box size={20} /></span><strong>Hutec</strong></div>{accepted ? <div className="auth-heading"><p className="eyebrow">HESAP ETKİNLEŞTİRİLDİ</p><h2>Hazırsınız, {invite?.displayName}</h2><p>{invite?.email} adresiyle artemis-proje çalışma alanından giriş yapabilirsiniz.</p><button className="auth-submit invite-return" onClick={() => { sessionStorage.removeItem('hutec_session'); window.location.href = '/' }}>Giriş ekranına dön <ArrowRight size={17} /></button></div> : !invite ? <div className="auth-heading"><p className="eyebrow">PERSONEL DAVETİ</p><h2>Bağlantı geçersiz</h2><p>Davet bağlantısının süresi dolmuş veya daha önce kullanılmış olabilir.</p><button className="auth-submit invite-return" onClick={() => { window.location.href = '/' }}>Giriş ekranına dön <ArrowRight size={17} /></button></div> : <><div className="auth-heading"><p className="eyebrow">PERSONEL DAVETİ</p><h2>Hesabını etkinleştir</h2><p>{invite.displayName} · {invite.email}<br />{invite.roleName} rolü</p><p className="invite-demo-note">Bu bağlantı demo önizlemesine aittir; sadece bu tarayıcıda geçerlidir.</p></div><form onSubmit={submit}><label>Yeni şifre<input type="password" autoComplete="new-password" minLength={12} required value={password} onChange={event => setPassword(event.target.value)} /><small>En az 12 karakter</small></label><label>Şifreyi doğrula<input type="password" autoComplete="new-password" minLength={12} required value={confirmPassword} onChange={event => setConfirmPassword(event.target.value)} /></label>{error && <div className="auth-error" role="alert">{error}</div>}<button className="auth-submit" disabled={loading}>{loading ? 'Hesap etkinleştiriliyor...' : 'Hesabı etkinleştir'}{!loading && <ArrowRight size={17} />}</button></form><div className="auth-security"><LockKeyhole size={15} /><span>Şifreniz demo tarayıcısında özetlenerek saklanır.</span></div></>}</div></section></main>
}
