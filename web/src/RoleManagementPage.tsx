import { useEffect, useState, type FormEvent } from 'react'
import { Check, Download, FileSpreadsheet, FileText, FileType2, Plus, Save, ShieldCheck, Users } from 'lucide-react'
import type { Session } from './LoginPage'
import { apiRequest } from './api'
import { exportEmployees, type EmployeeExportRow } from './employeeExports'
import './role-management.css'

type Permission = { key: string; label: string; group: string }
type Role = { id: string; code: string; name: string; permissions: string[]; isSystemRole: boolean }
type ManagedUser = { id: string; email: string; displayName: string; role: string; isActive: boolean; approvalAreaLimitM2: number; approvalForeignCurrencyLimit: number }
type UserSettings = { role: string; areaLimit: string; foreignLimit: string }

const permissions: Permission[] = [
  { key: 'workspace.read', label: 'Genel bakışı görüntüleme', group: 'Çalışma alanı' },
  { key: 'customers.read', label: 'Müşterileri görüntüleme', group: 'CRM' },
  { key: 'customers.write', label: 'Müşteri oluşturma ve düzenleme', group: 'CRM' },
  { key: 'projects.read', label: 'Projeleri görüntüleme', group: 'Projeler' },
  { key: 'quotes.read', label: 'Kendi tekliflerini görüntüleme', group: 'Teklifler' },
  { key: 'quotes.read.all', label: 'Tüm teklifleri görüntüleme', group: 'Teklifler' },
  { key: 'quotes.write', label: 'Teklif oluşturma ve düzenleme', group: 'Teklifler' },
  { key: 'quotes.approve', label: 'Teklif onaylama', group: 'Teklifler' },
  { key: 'products.read', label: 'Ürün sistemlerini görüntüleme', group: 'Operasyon' },
  { key: 'products.write', label: 'Ürün sistemlerini düzenleme', group: 'Operasyon' },
  { key: 'stock.read', label: 'Stokları görüntüleme', group: 'Operasyon' },
  { key: 'stock.write', label: 'Stok hareketi kaydetme', group: 'Operasyon' },
  { key: 'rates.read', label: 'Döviz kurlarını görüntüleme', group: 'Finans' },
  { key: 'analytics.read', label: 'Analizleri görüntüleme', group: 'Finans' },
  { key: 'easyquote.use', label: 'Kolay Teklif aracını kullanma', group: 'Finans' },
  { key: 'discounts.manage', label: 'Müşteri ve proje iskontolarını yönetme', group: 'Finans' },
  { key: 'settings.manage', label: 'Çalışma alanı ayarlarını yönetme', group: 'Yönetim' },
  { key: 'users.manage', label: 'Personel ve rolleri yönetme', group: 'Yönetim' },
]

export default function RoleManagementPage({ session }: { session: Session }) {
  const [roles, setRoles] = useState<Role[]>([])
  const [users, setUsers] = useState<ManagedUser[]>([])
  const [userSettings, setUserSettings] = useState<Record<string, UserSettings>>({})
  const [selectedCode, setSelectedCode] = useState('')
  const [createName, setCreateName] = useState('')
  const [creating, setCreating] = useState(false)
  const [addingUser, setAddingUser] = useState(false)
  const [exportOpen, setExportOpen] = useState(false)
  const [newUser, setNewUser] = useState({ displayName: '', email: '', role: '', areaLimit: '1000', foreignLimit: '1000' })
  const [inviteUrl, setInviteUrl] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const selected = roles.find(role => role.code === selectedCode)

  useEffect(() => {
    let active = true
    async function load() {
      setLoading(true)
      try {
        const [roleData, userData] = await Promise.all([
          apiRequest<Role[]>(session, '/api/management/roles'),
          apiRequest<ManagedUser[]>(session, '/api/management/users'),
        ])
        if (!active) return
        setRoles(roleData)
        setUsers(userData)
        setUserSettings(Object.fromEntries(userData.map(user => [user.id, {
          role: user.role,
          areaLimit: String(user.approvalAreaLimitM2),
          foreignLimit: String(user.approvalForeignCurrencyLimit),
        }])))
        setSelectedCode(current => roleData.some(role => role.code === current)
          ? current
          : roleData.find(role => role.code === session.user.role)?.code ?? roleData[0]?.code ?? '')
      } catch (requestError) {
        if (active) setError(requestError instanceof Error ? requestError.message : 'Yönetim verileri alınamadı.')
      } finally {
        if (active) setLoading(false)
      }
    }
    void load()
    return () => { active = false }
  }, [session])

  function togglePermission(permission: string) {
    if (!selected || selected.code === 'FounderGeneralManager') return
    setRoles(current => current.map(role => role.code !== selected.code ? role : {
      ...role,
      permissions: role.permissions.includes(permission)
        ? role.permissions.filter(item => item !== permission)
        : [...role.permissions, permission],
    }))
    setMessage('')
  }

  async function savePermissions() {
    if (!selected || selected.code === 'FounderGeneralManager') return
    setSaving(true)
    setError('')
    try {
      const updated = await apiRequest<Role>(session, `/api/management/roles/${encodeURIComponent(selected.code)}/permissions`, {
        method: 'PUT',
        body: JSON.stringify({ permissions: selected.permissions }),
      })
      setRoles(current => current.map(role => role.code === updated.code ? updated : role))
      setMessage('Rol izinleri kaydedildi. Yeni izinler kullanıcıların sonraki girişinde etkinleşir.')
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Rol izinleri kaydedilemedi.')
    } finally {
      setSaving(false)
    }
  }

  async function createRole(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setError('')
    try {
      const role = await apiRequest<Role>(session, '/api/management/roles', {
        method: 'POST',
        body: JSON.stringify({ name: createName, permissions: [] }),
      })
      setRoles(current => [...current, role].sort((left, right) => left.name.localeCompare(right.name, 'tr')))
      setSelectedCode(role.code)
      setCreateName('')
      setCreating(false)
      setMessage('Rol oluşturuldu. Personel atamadan önce izinlerini belirleyin.')
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Rol oluşturulamadı.')
    } finally {
      setSaving(false)
    }
  }

  async function saveUser(user: ManagedUser) {
    const pending = userSettings[user.id]
    if (!pending || user.role === 'FounderGeneralManager') return
    setSaving(true)
    setError('')
    try {
      let updatedUser = user
      if (pending.role !== user.role) {
        updatedUser = await apiRequest<ManagedUser>(session, `/api/management/users/${user.id}/role`, {
          method: 'PUT',
          body: JSON.stringify({ roleCode: pending.role }),
        })
      }
      if (Number(pending.areaLimit) !== updatedUser.approvalAreaLimitM2 || Number(pending.foreignLimit) !== updatedUser.approvalForeignCurrencyLimit) {
        await apiRequest<void>(session, `/api/management/users/${user.id}/approval-limits`, {
          method: 'PUT',
          body: JSON.stringify({ areaLimitM2: Number(pending.areaLimit), foreignCurrencyLimit: Number(pending.foreignLimit) }),
        })
        updatedUser = { ...updatedUser, approvalAreaLimitM2: Number(pending.areaLimit), approvalForeignCurrencyLimit: Number(pending.foreignLimit) }
      }
      setUsers(current => current.map(item => item.id === user.id ? updatedUser : item))
      setUserSettings(current => ({ ...current, [user.id]: { ...pending, role: updatedUser.role } }))
      setMessage(`${user.displayName} için rol ve onay sınırları kaydedildi. Rol değişikliği sonraki girişinde etkinleşir.`)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Personel bilgileri kaydedilemedi.')
    } finally {
      setSaving(false)
    }
  }

  async function createUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (session.mode !== 'demo') {
      setError('Gerçek kullanıcı oluşturma API’si henüz hazır değil. Bu form demo önizlemesinde çalışır.')
      return
    }
    if (!roles.some(role => role.code === newUser.role && role.code !== 'FounderGeneralManager')) {
      setError('Personel için kurucu olmayan bir rol seçin.')
      return
    }

    setSaving(true)
    setError('')
    try {
      const created = await apiRequest<ManagedUser & { inviteToken?: string }>(session, '/api/management/users', {
        method: 'POST',
        body: JSON.stringify({
          displayName: newUser.displayName.trim(),
          email: newUser.email.trim(),
          roleCode: newUser.role,
          areaLimitM2: Number(newUser.areaLimit),
          foreignCurrencyLimit: Number(newUser.foreignLimit),
        }),
      })
      setUsers(current => [...current, created])
      setUserSettings(current => ({ ...current, [created.id]: { role: created.role, areaLimit: String(created.approvalAreaLimitM2), foreignLimit: String(created.approvalForeignCurrencyLimit) } }))
      if (created.inviteToken) {
        const invite = new URL(window.location.href)
        invite.searchParams.set('invite', created.inviteToken)
        setInviteUrl(invite.toString())
      }
      setNewUser({ displayName: '', email: '', role: '', areaLimit: '1000', foreignLimit: '1000' })
      setAddingUser(false)
      setMessage(created.inviteToken ? 'Personel kaydı oluşturuldu. Davet bağlantısı 48 saat geçerlidir; e-posta gönderilmedi.' : 'Personel kaydı oluşturuldu.')
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Personel kaydı oluşturulamadı.')
    } finally {
      setSaving(false)
    }
  }

  async function downloadEmployees(format: 'pdf' | 'xlsx' | 'docx') {
    setError('')
    try {
      const rows: EmployeeExportRow[] = users.map(user => ({
        displayName: user.displayName,
        email: user.email,
        roleName: roles.find(role => role.code === user.role)?.name ?? user.role,
        status: user.isActive ? 'Aktif' : 'Kurulum bekliyor',
        areaLimit: userSettings[user.id] ? Number(userSettings[user.id].areaLimit) : user.approvalAreaLimitM2,
        foreignLimit: userSettings[user.id] ? Number(userSettings[user.id].foreignLimit) : user.approvalForeignCurrencyLimit,
      }))
      await exportEmployees(format, rows)
      setExportOpen(false)
      setMessage(`Personel listesi ${format.toUpperCase()} olarak indirildi.`)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Personel listesi dışa aktarılamadı.')
    }
  }

  async function copyInvite() {
    try {
      await navigator.clipboard.writeText(inviteUrl)
      setMessage('Davet bağlantısı panoya kopyalandı.')
    } catch {
      setError('Bağlantı kopyalanamadı. Metin alanındaki davet bağlantısını elle kopyalayın.')
    }
  }

  const groups = [...new Set(permissions.map(permission => permission.group))]

  return <>
    <section className="module-header">
      <div><p className="eyebrow">YÖNETİM / ERİŞİM KONTROLÜ</p><h1>Roller ve personel</h1><p className="heading-sub">Kurucu hesabıyla ekip rollerini, erişimleri ve teklif onay sınırlarını yönetin.</p></div>
      <div className="role-header-actions"><button className="outline-button" disabled={session.mode !== 'demo'} title={session.mode === 'demo' ? 'Önizlemede personel kaydı ekle' : 'Kullanıcı oluşturma API’si henüz hazır değil'} onClick={() => setAddingUser(value => !value)}><Users size={15} /> Personel ekle</button><button className="primary-button" onClick={() => setCreating(value => !value)}><Plus size={16} /> Yeni rol</button></div>
    </section>
    <div className="access-notice"><ShieldCheck size={17} /><div><strong>Kurucu hesabı korunuyor</strong><p>{session.mode === 'demo' ? 'Önizleme verileri yalnızca bu tarayıcıda saklanır. Kurucu rolü başka personele atanamaz.' : 'Kurucu rolü değiştirilemez ve başka personele atanamaz. Diğer rol ve izin değişiklikleri bu çalışma alanına kaydedilir.'}</p></div></div>
    {error && <p className="role-message error" role="alert">{error}</p>}
    {message && <p className="role-message success" role="status">{message}</p>}
    {inviteUrl && <section className="invite-link-panel"><div><strong>Personel davet bağlantısı</strong><small>Demo bağlantısı bu tarayıcıda çalışır ve 48 saat sonra geçersiz olur.</small></div><div><input aria-label="Davet bağlantısı" readOnly value={inviteUrl} onFocus={event => event.currentTarget.select()} /><button className="outline-button" onClick={() => void copyInvite()}>Bağlantıyı kopyala</button><button className="icon-button" aria-label="Davet bağlantısını kapat" onClick={() => setInviteUrl('')}>×</button></div></section>}
    {creating && <form className="role-create-form" onSubmit={createRole}><label>Yeni rol adı<input required minLength={2} maxLength={80} value={createName} onChange={event => setCreateName(event.target.value)} placeholder="Örn. Saha Ekip Lideri" /></label><button className="primary-button" disabled={saving}><Check size={15} /> Rolü oluştur</button></form>}
    {addingUser && session.mode === 'demo' && <form className="employee-create-form" onSubmit={createUser}><label>Ad soyad<input required maxLength={120} value={newUser.displayName} onChange={event => setNewUser(current => ({ ...current, displayName: event.target.value }))} placeholder="Personel adı" /></label><label>Kurumsal e-posta<input required type="email" maxLength={180} value={newUser.email} onChange={event => setNewUser(current => ({ ...current, email: event.target.value }))} placeholder="ad@firma.com" /></label><label>Rol<select required value={newUser.role} onChange={event => setNewUser(current => ({ ...current, role: event.target.value }))}><option value="">Rol seçin</option>{roles.filter(role => role.code !== 'FounderGeneralManager').map(role => <option value={role.code} key={role.code}>{role.name}</option>)}</select></label><label>Alan onay sınırı (m²)<input required type="number" min="0" value={newUser.areaLimit} onChange={event => setNewUser(current => ({ ...current, areaLimit: event.target.value }))} /></label><label>Döviz onay sınırı<input required type="number" min="0" value={newUser.foreignLimit} onChange={event => setNewUser(current => ({ ...current, foreignLimit: event.target.value }))} /></label><div className="employee-form-actions"><small>Demo daveti 48 saat geçerlidir; e-posta otomatik gönderilmez.</small><button className="primary-button" disabled={saving}><Check size={15} /> Davet bağlantısı oluştur</button></div></form>}
    {addingUser && session.mode !== 'demo' && <p className="role-message">Gerçek kullanıcı davet endpoint’i henüz eklenmedi; bu alan demo önizlemesinde kullanılabilir.</p>}
    {loading ? <p className="empty-state">Rol ve personel bilgileri yükleniyor...</p> : <>
      <div className="role-admin-layout">
        <section className="panel role-admin-list"><div className="role-admin-title"><div><h2>Roller</h2><p>{roles.length} tanımlı rol</p></div><Users size={18} /></div>{roles.map(role => <button className={role.code === selectedCode ? 'role-admin-item selected' : 'role-admin-item'} key={role.code} onClick={() => { setSelectedCode(role.code); setMessage('') }}><span><strong>{role.name}</strong><small>{role.isSystemRole ? 'Sistem rolü' : 'Özel rol'}</small></span><b>{role.permissions.length}</b></button>)}</section>
        <section className="panel role-admin-permissions"><div className="role-admin-title"><div><h2>{selected?.name ?? 'Rol seçin'}</h2><p>{session.mode === 'demo' ? 'Önizleme verileri tarayıcıda saklanır' : 'Yetkiler API üzerinden saklanır'}</p></div><span className="permission-count">{selected?.permissions.length ?? 0}/{permissions.length}</span></div>
          {selected?.code === 'FounderGeneralManager' && <p className="role-locked-note">Kurucu hesabı tam erişime sahiptir ve değiştirilemez.</p>}
          {selected && groups.map(group => <fieldset className="permission-group" key={group} disabled={selected.code === 'FounderGeneralManager'}><legend>{group}</legend>{permissions.filter(permission => permission.group === group).map(permission => <label className="permission-choice" key={permission.key}><input type="checkbox" checked={selected.permissions.includes(permission.key)} onChange={() => togglePermission(permission.key)} /><span>{permission.label}</span></label>)}</fieldset>)}
          {selected && selected.code !== 'FounderGeneralManager' && <button className="primary-button role-save-button" disabled={saving} onClick={() => void savePermissions()}><Save size={15} /> {saving ? 'Kaydediliyor...' : 'İzinleri kaydet'}</button>}
        </section>
      </div>
      <section className="panel user-admin-panel"><div className="role-admin-title"><div><h2>Personel erişimi</h2><p>{users.length} personel kaydı</p></div><div className="employee-export"><button className="outline-button" aria-expanded={exportOpen} onClick={() => setExportOpen(value => !value)}><Download size={15} /> Dışa aktar</button>{exportOpen && <div className="employee-export-menu" role="menu"><button role="menuitem" onClick={() => void downloadEmployees('pdf')}><FileText size={15} /> PDF</button><button role="menuitem" onClick={() => void downloadEmployees('xlsx')}><FileSpreadsheet size={15} /> Excel (.xlsx)</button><button role="menuitem" onClick={() => void downloadEmployees('docx')}><FileType2 size={15} /> Word (.docx)</button></div>}</div></div><div className="table-scroll"><table><thead><tr><th>Personel</th><th>E-posta</th><th>Rol</th><th>Durum</th><th>Alan onay sınırı (m²)</th><th>Döviz onay sınırı</th><th /></tr></thead><tbody>{users.map(user => {
        const pending = userSettings[user.id]
        return <tr key={user.id}>
          <td><strong>{user.displayName}</strong></td>
          <td>{user.email}</td>
          <td><select aria-label={`${user.displayName} rolü`} disabled={user.role === 'FounderGeneralManager'} value={pending?.role ?? user.role} onChange={event => setUserSettings(current => ({ ...current, [user.id]: { ...current[user.id], role: event.target.value } }))}>{roles.filter(role => user.role === 'FounderGeneralManager' || role.code !== 'FounderGeneralManager').map(role => <option key={role.code} value={role.code}>{role.name}</option>)}</select></td>
          <td><span className={`employee-status ${user.isActive ? 'active' : 'pending'}`}>{user.isActive ? 'Aktif' : 'Kurulum bekliyor'}</span></td>
          <td><input aria-label={`${user.displayName} alan onay sınırı`} type="number" min="0" value={pending?.areaLimit ?? ''} disabled={user.role === 'FounderGeneralManager'} onChange={event => setUserSettings(current => ({ ...current, [user.id]: { ...current[user.id], areaLimit: event.target.value } }))} /></td>
          <td><input aria-label={`${user.displayName} döviz onay sınırı`} type="number" min="0" value={pending?.foreignLimit ?? ''} disabled={user.role === 'FounderGeneralManager'} onChange={event => setUserSettings(current => ({ ...current, [user.id]: { ...current[user.id], foreignLimit: event.target.value } }))} /></td>
          <td><button className="icon-button" aria-label={`${user.displayName} kaydet`} disabled={saving || user.role === 'FounderGeneralManager'} onClick={() => void saveUser(user)}><Save size={16} /></button></td>
        </tr>
      })}</tbody></table></div>{users.length === 0 && <p className="empty-state">Bu çalışma alanında kullanıcı bulunamadı.</p>}</section>
    </>}
  </>
}