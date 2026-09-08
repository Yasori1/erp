import { useState } from 'react'
import { Building2, Check, X } from 'lucide-react'
import './workspace-modal.css'

export type Workspace = { id: string; name: string; slug: string; subtitle: string; initials: string }

export default function WorkspaceModal({ onClose, onCreated }: { onClose: () => void; onCreated: (workspace: Workspace) => void }) {
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [city, setCity] = useState('')
  const submit = () => {
    if (!name.trim() || !slug.trim()) return
    const workspace = { id: crypto.randomUUID(), name: name.trim(), slug: slug.trim().toLowerCase().replace(/\s+/g, '-'), subtitle: city.trim() || 'Zemin uygulama firması', initials: name.trim().slice(0, 2).toUpperCase() }
    onCreated(workspace)
  }
  return <div className="modal-backdrop"><div className="modal workspace-modal"><div className="modal-heading"><div><p className="eyebrow">HUTEC / ÇALIŞMA ALANI</p><h2>Yeni firma ekle</h2><p>Firmanız için ayrı ve izole bir çalışma alanı oluşturun.</p></div><button className="icon-button" onClick={onClose} aria-label="Kapat"><X size={18} /></button></div><div className="workspace-form-icon"><Building2 size={20} /></div><label>Firma adı<input value={name} onChange={event => setName(event.target.value)} placeholder="Örn. Artemis Proje" /></label><label>Çalışma alanı kodu<input value={slug} onChange={event => setSlug(event.target.value)} placeholder="artemis-proje" /><small>Girişte kullanılacak benzersiz firma kodu.</small></label><label>Şehir / kısa tanım<input value={city} onChange={event => setCity(event.target.value)} placeholder="İzmir · Zemin uygulama" /></label><div className="workspace-modal-note"><Check size={14} /> Yeni firma verileri mevcut firmalardan tamamen izole edilir.</div><button className="primary-button modal-submit" onClick={submit} disabled={!name.trim() || !slug.trim()}><Building2 size={16} /> Firmayı ekle</button></div></div>
}
