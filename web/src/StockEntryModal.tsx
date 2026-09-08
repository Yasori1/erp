import { useState } from 'react'
import { Check, Package, X } from 'lucide-react'

export default function StockEntryModal({ onClose }: { onClose: () => void }) {
  const [saved, setSaved] = useState(false)
  if (saved) return <div className="modal-backdrop"><div className="modal success-modal"><div className="success-icon"><Check size={25} /></div><h2>Stok girişi hazır</h2><p>Malzeme miktarı depo hareketlerine eklenecek.</p><button className="primary-button" onClick={onClose}>Stok ekranına dön</button></div></div>
  return <div className="modal-backdrop"><div className="modal"><div className="modal-heading"><div><p className="eyebrow">DEPO / STOK HAREKETİ</p><h2>Yeni stok girişi</h2><p>Depoya gelen malzemeyi kaydedin.</p></div><button className="icon-button" onClick={onClose} aria-label="Kapat"><X size={18} /></button></div><label>Ürün veya malzeme<select defaultValue=""><option value="" disabled>Ürün seçin</option><option>Epoksi reçine A</option><option>PU sertleştirici B</option><option>Silis agregası 0.4 mm</option></select></label><label>Miktar<input type="number" placeholder="0" /></label><label>Birim<select defaultValue="kg"><option>kg</option><option>adet</option><option>litre</option></select></label><label>Tedarikçi<input placeholder="Tedarikçi adı" /></label><button className="primary-button modal-submit" onClick={() => setSaved(true)}><Package size={16} /> Stok girişini kaydet</button></div></div>
}
