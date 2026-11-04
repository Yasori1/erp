import type { Session } from './LoginPage'

// Vite environment variable validation and default for API URL
const apiUrlEnv = import.meta.env.VITE_API_URL ?? 'http://localhost:5220'
const apiUrlPattern = /^(http|https):\/\/[^ "]+$/
if (!apiUrlPattern.test(apiUrlEnv))
{
    throw new Error(
        'Invalid VITE_API_URL environment variable. ' +
        'Expected format: http://host:port or https://host:port. ' +
        'Example: $env:VITE_API_URL = "https://api.flooring-saas.com";'
    )
}

export const apiUrl = apiUrlEnv

type DemoRole = { id: string; code: string; name: string; permissions: string[]; isSystemRole: boolean }
type DemoUser = { id: string; email: string; displayName: string; role: string; isActive: boolean; approvalAreaLimitM2: number; approvalForeignCurrencyLimit: number; inviteToken?: string; inviteExpiresAtUtc?: string; passwordHash?: string; inviteAcceptedAtUtc?: string }
const roleStorageKey = 'hutec_frontend_demo_roles'
const userStorageKey = 'hutec_frontend_demo_users'
const customerStorageKey = 'hutec_frontend_demo_customers'
const quoteStorageKey = 'hutec_frontend_demo_quotes'
const accountChangeStorageKey = 'hutec_frontend_demo_account_change_requests'
const demoPermissions = ['workspace.read', 'customers.read', 'customers.write', 'projects.read', 'quotes.read', 'quotes.read.all', 'quotes.write', 'quotes.approve', 'products.read', 'products.write', 'stock.read', 'stock.write', 'rates.read', 'analytics.read', 'easyquote.use', 'discounts.manage', 'settings.manage', 'users.manage']
const initialDemoRoles: DemoRole[] = [
  { id: 'demo-role-owner', code: 'FounderGeneralManager', name: 'Kurucu / Genel Müdür', permissions: demoPermissions, isSystemRole: true },
  { id: 'demo-role-sales', code: 'Sales', name: 'Satış temsilcisi', permissions: ['workspace.read', 'customers.read', 'quotes.read', 'quotes.write', 'projects.read', 'easyquote.use'], isSystemRole: true },
  { id: 'demo-role-field', code: 'Field', name: 'Saha personeli', permissions: ['workspace.read', 'customers.read', 'quotes.read', 'projects.read', 'products.read', 'stock.read'], isSystemRole: true },
]
const initialDemoUsers: DemoUser[] = [
  { id: 'demo-owner', email: 'admin@artemisproje.com', displayName: 'Kurucu Genel Müdür', role: 'FounderGeneralManager', isActive: true, approvalAreaLimitM2: 100000, approvalForeignCurrencyLimit: 100000 },
  { id: 'demo-sales', email: 'satis@artemisproje.com', displayName: 'Satış Temsilcisi', role: 'Sales', isActive: true, approvalAreaLimitM2: 1000, approvalForeignCurrencyLimit: 1000 },
  { id: 'demo-field', email: 'saha@artemisproje.com', displayName: 'Saha Personeli', role: 'Field', isActive: true, approvalAreaLimitM2: 1000, approvalForeignCurrencyLimit: 1000 },
]

async function hashDemoPassword(password: string) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(password))
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('')
}


export async function completeDemoInvite(token: string, password: string) {
  if (!import.meta.env.DEV) throw new Error('Demo davetleri yalnızca geliştirme ortamında kullanılabilir.')
  const users = readDemoList<DemoUser>(userStorageKey, initialDemoUsers)
  const user = users.find(item => item.inviteToken === token)
  if (!user || !user.inviteExpiresAtUtc || new Date(user.inviteExpiresAtUtc) <= new Date()) throw new Error('Davet bağlantısı geçersiz veya süresi dolmuş.')

  const updated: DemoUser = {
    ...user,
    isActive: true,
    passwordHash: await hashDemoPassword(password),
    inviteAcceptedAtUtc: new Date().toISOString(),
    inviteToken: undefined,
    inviteExpiresAtUtc: undefined,
  }
  writeDemoList(userStorageKey, users.map(item => item.id === user.id ? updated : item))
  return { email: updated.email }
}

function readDemoList<T>(key: string, fallback: T[]): T[] {
  try {
    const stored = localStorage.getItem(key)
    if (!stored) return fallback
    const value: unknown = JSON.parse(stored)
    return Array.isArray(value) ? value as T[] : fallback
  } catch {
    return fallback
  }
}

function writeDemoList<T>(key: string, value: T[]) {
  localStorage.setItem(key, JSON.stringify(value))
}

async function demoRequest<T>(session: Session, path: string, init: RequestInit): Promise<T> {
  const method = (init.method ?? 'GET').toUpperCase()
  const payload = init.body ? JSON.parse(String(init.body)) as Record<string, unknown> : {}
  const roles = readDemoList(roleStorageKey, initialDemoRoles)
  const users = readDemoList(userStorageKey, initialDemoUsers)
  const accountChangeRequests = readDemoList<{
    id: string
    userId: string
    requestedEmail?: string
    requestedDisplayName?: string
    requestedPasswordHash?: string
    requestedAtUtc: string
    status: string
  }>(accountChangeStorageKey, [])
  const canManageAccountChanges = session.user.role === 'Admin' ||
    session.user.role === 'FounderGeneralManager' ||
    session.user.permissions.includes('users.manage')

  if (path === '/api/auth/me' && method === 'GET') return session.user as T
  if (path === '/api/auth/profile' && method === 'PUT') {
    const email = String(payload.email ?? '').trim().toLowerCase()
    const displayName = String(payload.displayName ?? '').trim()
    if (!displayName || !email) throw new Error('Ad soyad ve e-posta zorunludur.')
    if (users.some(item => item.id !== session.user.id && item.email.toLowerCase() === email)) {
      throw new Error('Bu e-posta adresi başka bir hesapta kullanılıyor.')
    }
    const storedUser = users.find(item => item.id === session.user.id)
    const updatedUser: DemoUser = {
      ...(storedUser ?? {
        id: session.user.id,
        email: session.user.email,
        displayName: session.user.displayName,
        role: session.user.role,
        isActive: true,
        approvalAreaLimitM2: 1000,
        approvalForeignCurrencyLimit: 1000,
      }),
      email,
      displayName,
      passwordHash: storedUser?.passwordHash ?? await hashDemoPassword('frontend-demo'),
    }
    if (!canManageAccountChanges) {
      if (accountChangeRequests.some(item => item.userId === session.user.id && item.status === 'Pending')) {
        throw new Error('Bekleyen hesap değişikliği talebiniz sonuçlanmadan yeni talep oluşturamazsınız.')
      }
      writeDemoList(accountChangeStorageKey, [...accountChangeRequests, {
        id: crypto.randomUUID(),
        userId: session.user.id,
        requestedEmail: email,
        requestedDisplayName: displayName,
        requestedAtUtc: new Date().toISOString(),
        status: 'Pending',
      }])
      return { user: null, approvalRequired: true, message: 'Profil değişikliği yönetici onayına gönderildi.' } as T
    }
    writeDemoList(userStorageKey, storedUser
      ? users.map(item => item.id === updatedUser.id ? updatedUser : item)
      : [...users, updatedUser])
    return { user: { ...session.user, email, displayName }, approvalRequired: false, message: 'Profil bilgileriniz kaydedildi.' } as T
  }
  if (path === '/api/auth/change-password' && method === 'PUT') {
    const storedUser = users.find(item => item.id === session.user.id)
    const currentPassword = String(payload.currentPassword ?? '')
    const newPassword = String(payload.newPassword ?? '')
    const currentPasswordHash = storedUser?.passwordHash
    const currentPasswordValid = currentPasswordHash
      ? currentPasswordHash === await hashDemoPassword(currentPassword)
      : session.user.id === 'demo-owner' && currentPassword === 'frontend-demo'
    if (!currentPasswordValid) throw new Error('Mevcut şifre yanlış.')
    if (newPassword.length < 8) throw new Error('Yeni şifre en az 8 karakter olmalıdır.')
    if (newPassword === currentPassword) throw new Error('Yeni şifre mevcut şifreden farklı olmalıdır.')
    if (!canManageAccountChanges) {
      if (accountChangeRequests.some(item => item.userId === session.user.id && item.status === 'Pending')) {
        throw new Error('Bekleyen hesap değişikliği talebiniz sonuçlanmadan yeni talep oluşturamazsınız.')
      }
      writeDemoList(accountChangeStorageKey, [...accountChangeRequests, {
        id: crypto.randomUUID(),
        userId: session.user.id,
        requestedPasswordHash: await hashDemoPassword(newPassword),
        requestedAtUtc: new Date().toISOString(),
        status: 'Pending',
      }])
      return { user: null, approvalRequired: true, message: 'Şifre değişikliği yönetici onayına gönderildi.' } as T
    }
    const updatedUser: DemoUser = {
      ...(storedUser ?? {
        id: session.user.id,
        email: session.user.email,
        displayName: session.user.displayName,
        role: session.user.role,
        isActive: true,
        approvalAreaLimitM2: 1000,
        approvalForeignCurrencyLimit: 1000,
      }),
      passwordHash: await hashDemoPassword(newPassword),
    }
    writeDemoList(userStorageKey, storedUser
      ? users.map(item => item.id === updatedUser.id ? updatedUser : item)
      : [...users, updatedUser])
    return { user: null, approvalRequired: false, message: 'Şifreniz değiştirildi.' } as T
  }
  if (path === '/api/management/account-change-requests' && method === 'GET') {
    if (!canManageAccountChanges) throw new Error('Bu işlem için yönetici yetkisi gerekir.')
    return accountChangeRequests.filter(item => item.status === 'Pending').map(item => {
      const user = users.find(candidate => candidate.id === item.userId)
      return {
        id: item.id,
        userId: item.userId,
        currentEmail: user?.email ?? 'Bilinmeyen hesap',
        currentDisplayName: user?.displayName ?? 'Bilinmeyen kullanıcı',
        requestedEmail: item.requestedEmail ?? null,
        requestedDisplayName: item.requestedDisplayName ?? null,
        hasPasswordChange: Boolean(item.requestedPasswordHash),
        requestedAtUtc: item.requestedAtUtc,
      }
    }) as T
  }
  const accountChangeAction = path.match(/^\/api\/management\/account-change-requests\/([^/]+)\/(approve|reject)$/)
  if (accountChangeAction && method === 'POST') {
    if (!canManageAccountChanges) throw new Error('Bu işlem için yönetici yetkisi gerekir.')
    const request = accountChangeRequests.find(item => item.id === accountChangeAction[1] && item.status === 'Pending')
    if (!request) throw new Error('Bekleyen talep bulunamadı.')
    const user = users.find(item => item.id === request.userId)
    if (!user) throw new Error('Talep sahibi bulunamadı.')
    if (accountChangeAction[2] === 'approve') {
      if (request.requestedEmail && users.some(item => item.id !== user.id && item.email.toLowerCase() === request.requestedEmail?.toLowerCase())) {
        throw new Error('Talep edilen e-posta başka bir hesapta kullanılıyor.')
      }
      const updatedUser = {
        ...user,
        ...(request.requestedEmail ? { email: request.requestedEmail } : {}),
        ...(request.requestedDisplayName ? { displayName: request.requestedDisplayName } : {}),
        ...(request.requestedPasswordHash ? { passwordHash: request.requestedPasswordHash } : {}),
      }
      writeDemoList(userStorageKey, users.map(item => item.id === user.id ? updatedUser : item))
    }
    writeDemoList(accountChangeStorageKey, accountChangeRequests.map(item =>
      item.id === request.id ? { ...item, status: accountChangeAction[2] === 'approve' ? 'Approved' : 'Rejected' } : item))
    return undefined as T
  }
  if (path === '/api/workspace/customers' && method === 'GET') return readDemoList(customerStorageKey, []) as T
  if (path === '/api/workspace/customers' && method === 'POST') {
    const customer = {
      id: crypto.randomUUID(),
      companyName: String(payload.companyName ?? ''),
      contactName: String(payload.contactName ?? ''),
      email: String(payload.email ?? ''),
      phone: String(payload.phone ?? ''),
      status: String(payload.status ?? 'Lead'),
      tenantId: 'demo-tenant',
      createdAtUtc: new Date().toISOString(),
    }
    if (!customer.companyName.trim()) throw new Error('Firma adı zorunludur.')
    const customers = readDemoList<typeof customer>(customerStorageKey, [])
    writeDemoList(customerStorageKey, [customer, ...customers])
    return customer as T
  }
  if (path === '/api/workspace/quotes' && method === 'POST') {
    const quote = {
      id: crypto.randomUUID(),
      quoteNumber: String(payload.quoteNumber ?? ''),
      areaM2: Number(payload.areaM2 ?? 0),
      total: Number(payload.total ?? 0),
      currency: String(payload.currency ?? 'TRY'),
      assignedToUserId: session.user.id,
      requiresManagementApproval: false,
      approvalStatus: 'NotRequired',
      status: 'Draft',
      customerId: payload.customerId ?? null,
      productSystemName: String(payload.productSystemName ?? ''),
      estimateLow: Number(payload.estimateLow ?? payload.total ?? 0),
      estimateHigh: Number(payload.estimateHigh ?? payload.total ?? 0),
      location: String(payload.location ?? ''),
      includeShipping: Boolean(payload.includeShipping),
      includeLabor: Boolean(payload.includeLabor),
      createdAtUtc: new Date().toISOString(),
    }
    if (!quote.quoteNumber || quote.areaM2 <= 0) throw new Error('Teklif numarası ve geçerli uygulama alanı zorunludur.')
    const quotes = readDemoList<typeof quote>(quoteStorageKey, [])
    writeDemoList(quoteStorageKey, [quote, ...quotes])
    return quote as T
  }
  if (path === '/api/workspace/easy-quote' && method === 'POST') {
    const areaM2 = Number(payload.areaM2 ?? 0)
    if (areaM2 <= 0) throw new Error("Alan 0'dan büyük olmalıdır.")
    const productSystemName = String(payload.productSystemName ?? '')
    const history = readDemoList<{ productSystemName: string; currency: string; areaM2: number; total: number }>(quoteStorageKey, [])
      .filter(item => item.productSystemName === productSystemName && item.currency === 'TRY' && item.areaM2 > 0 && item.total > 0)
    const averagePerM2 = history.length > 0
      ? history.reduce((total, item) => total + item.total / item.areaM2, 0) / history.length
      : 660
    const location = String(payload.location ?? '')
    const locationFactor = location.toLowerCase() === 'istanbul' ? 1.16
      : location.toLowerCase() === 'manisa' ? 1.08
        : location.toLowerCase() === 'bornova' ? 1.02
          : 1
    const shipping = payload.includeShipping ? Math.max(3500, areaM2 * 18) : 0
    const laborAdjustment = payload.includeLabor ? 0 : -(areaM2 * averagePerM2 * 0.25)
    const estimate = areaM2 * averagePerM2 * locationFactor + shipping + laborAdjustment
    return {
      low: Math.round(estimate * 0.94),
      high: Math.round(estimate * 1.06),
      averagePerM2: Math.round(averagePerM2 * locationFactor),
      historicalQuoteCount: history.length,
      isHistoricalDataAvailable: history.length > 0,
    } as T
  }
  if (path === '/api/management/roles' && method === 'GET') return roles as T
  if (path === '/api/management/users' && method === 'GET') return users as T

  if (path === '/api/management/users' && method === 'POST') {
    const role = roles.find(item => item.code === payload.roleCode)
    if (!role || role.code === 'FounderGeneralManager') throw new Error('Personel için geçerli bir rol seçin.')
    if (users.some(item => item.email.toLowerCase() === String(payload.email ?? '').toLowerCase())) throw new Error('Bu e-posta adresi zaten kayıtlı.')
    const inviteToken = `${crypto.randomUUID()}${crypto.randomUUID().replaceAll('-', '')}`
    const user: DemoUser = {
      id: crypto.randomUUID(),
      email: String(payload.email ?? ''),
      displayName: String(payload.displayName ?? ''),
      role: role.code,
      isActive: false,
      approvalAreaLimitM2: Number(payload.areaLimitM2 ?? 1000),
      approvalForeignCurrencyLimit: Number(payload.foreignCurrencyLimit ?? 1000),
      inviteToken,
      inviteExpiresAtUtc: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
    }
    writeDemoList(userStorageKey, [...users, user])
    return user as T
  }

  if (path === '/api/management/roles' && method === 'POST') {
    const role: DemoRole = { id: crypto.randomUUID(), code: `custom-${crypto.randomUUID().replaceAll('-', '')}`, name: String(payload.name ?? ''), permissions: [], isSystemRole: false }
    writeDemoList(roleStorageKey, [...roles, role])
    return role as T
  }

  const permissionRoute = path.match(/^\/api\/management\/roles\/([^/]+)\/permissions$/)
  if (permissionRoute && method === 'PUT') {
    const code = decodeURIComponent(permissionRoute[1])
    const role = roles.find(item => item.code === code)
    if (!role) throw new Error('Seçilen rol bulunamadı.')
    const updated = { ...role, permissions: payload.permissions as string[] }
    writeDemoList(roleStorageKey, roles.map(item => item.code === code ? updated : item))
    return updated as T
  }

  const roleRoute = path.match(/^\/api\/management\/users\/([^/]+)\/role$/)
  if (roleRoute && method === 'PUT') {
    const user = users.find(item => item.id === roleRoute[1])
    const role = roles.find(item => item.code === payload.roleCode)
    if (!user || !role) throw new Error('Personel veya rol bulunamadı.')
    const updated = { ...user, role: role.code }
    writeDemoList(userStorageKey, users.map(item => item.id === user.id ? updated : item))
    return updated as T
  }

  const limitsRoute = path.match(/^\/api\/management\/users\/([^/]+)\/approval-limits$/)
  if (limitsRoute && method === 'PUT') {
    const user = users.find(item => item.id === limitsRoute[1])
    if (!user) throw new Error('Personel bulunamadı.')
    const updated = { ...user, approvalAreaLimitM2: Number(payload.areaLimitM2), approvalForeignCurrencyLimit: Number(payload.foreignCurrencyLimit) }
    writeDemoList(userStorageKey, users.map(item => item.id === user.id ? updated : item))
    return undefined as T
  }

  throw new Error('Bu işlem frontend demo modunda desteklenmiyor.')
}

export async function apiRequest<T>(session: Session, path: string, init: RequestInit = {}): Promise<T> {
  if (session.mode === 'demo') return demoRequest<T>(session, path, init)

  const headers = new Headers(init.headers)
  headers.set('Authorization', `Bearer ${session.accessToken}`)
  if (init.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json')

  const response = await fetch(`${apiUrl}${path}`, { ...init, headers })
  if (!response.ok) {
    const payload = await response.json().catch(() => null) as { message?: string } | null
    if (response.status === 401) {
      sessionStorage.removeItem('hutec_session')
      window.dispatchEvent(new Event('hutec-session-expired'))
      throw new Error('Oturum doğrulanamadı. API yeniden başlatıldıysa tekrar giriş yapın.')
    }
    throw new Error(payload?.message ?? `İstek tamamlanamadı (${response.status}).`)
  }
  if (response.status === 204) return undefined as T
  return response.json() as Promise<T>
}

export function getDemoInvite(token: string) {
  const user = readDemoList<DemoUser>(userStorageKey, initialDemoUsers).find(item => item.inviteToken === token)
  if (!user || !user.inviteExpiresAtUtc || new Date(user.inviteExpiresAtUtc) <= new Date()) return null
  const role = readDemoList(roleStorageKey, initialDemoRoles).find(item => item.code === user.role)
  return { displayName: user.displayName, email: user.email, roleName: role?.name ?? user.role, expiresAtUtc: user.inviteExpiresAtUtc }
}