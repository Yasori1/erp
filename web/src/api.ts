import type { Session } from './LoginPage'

export const apiUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:5220'

type DemoRole = { id: string; code: string; name: string; permissions: string[]; isSystemRole: boolean }
type DemoUser = { id: string; email: string; displayName: string; role: string; isActive: boolean; approvalAreaLimitM2: number; approvalForeignCurrencyLimit: number }
const roleStorageKey = 'hutec_frontend_demo_roles'
const userStorageKey = 'hutec_frontend_demo_users'
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

export function createDemoSession(): Session {
  if (!import.meta.env.DEV) throw new Error('Demo oturumu yalnızca geliştirme ortamında kullanılabilir.')
  return {
    accessToken: 'frontend-demo',
    mode: 'demo',
    user: {
      id: 'demo-owner',
      email: 'admin@artemisproje.com',
      displayName: 'Demo Kurucu',
      role: 'FounderGeneralManager',
      roleName: 'Kurucu / Genel Müdür',
      permissions: demoPermissions,
    },
  }
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

  if (path === '/api/auth/me' && method === 'GET') return session.user as T
  if (path === '/api/management/roles' && method === 'GET') return roles as T
  if (path === '/api/management/users' && method === 'GET') return users as T

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
    throw new Error(payload?.message ?? `İstek tamamlanamadı (${response.status}).`)
  }
  if (response.status === 204) return undefined as T
  return response.json() as Promise<T>
}