import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import api from '../../api/client'
import DashLayout from '../../components/DashLayout'
import Icon from '../../components/Icon'
import { PageHead } from '../../components/Dash'

const EMPTY = {
  site_name: 'Ionedu',
  contact_email: 'info@ionedu.uz',
  contact_phone: '',
  address: '',
  telegram_url: '',
  instagram_url: '',
  youtube_url: '',
  facebook_url: '',
  about_text: '',
}

function Field({ label, value, onChange, error, type = 'text', placeholder = '', hint }) {
  return (
    <div className="field">
      <label className="label">{label}</label>
      <input className="input" type={type} value={value || ''} onChange={onChange} placeholder={placeholder}
        style={error ? { borderColor: 'var(--red-600)' } : undefined} />
      {error && <div className="text-xs mt-1" style={{ color: 'var(--red-600)' }}>{String(error)}</div>}
      {!error && hint && <div className="text-xs text-muted mt-1">{hint}</div>}
    </div>
  )
}

export default function AdminSettings() {
  const [s, setS] = useState(EMPTY)
  const [errors, setErrors] = useState({})
  const [busy, setBusy] = useState(false)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    api.get('/admin/settings/')
      .then(r => setS(prev => ({ ...prev, ...r.data })))
      .catch(() => {})
      .finally(() => setLoaded(true))
  }, [])

  const set = (k) => (e) => {
    setS({ ...s, [k]: e.target.value })
    if (errors[k]) setErrors({ ...errors, [k]: null })
  }

  async function submit(e) {
    e.preventDefault()
    setBusy(true)
    setErrors({})
    try {
      const { data } = await api.put('/admin/settings/', s)
      setS(prev => ({ ...prev, ...data }))
      toast.success('Sozlamalar saqlandi')
    } catch (err) {
      const d = err.response?.data
      if (d && typeof d === 'object') {
        setErrors(d)
        toast.error("Ba'zi maydonlarda xatolik bor")
      } else {
        toast.error('Saqlashda xatolik')
      }
    } finally { setBusy(false) }
  }

  const F = (label, k, extra = {}) => (
    <Field label={label} value={s[k]} onChange={set(k)} error={errors[k]} {...extra} />
  )

  return (
    <DashLayout kind="admin">
      <PageHead title="Sozlamalar"
        sub="Sayt nomi, aloqa ma'lumotlari va ijtimoiy tarmoqlar — footer va aloqa sahifasida ko'rinadi." />

      {!loaded ? (
        <div className="card" style={{ maxWidth: 720, padding: 40, textAlign: 'center', color: 'var(--text-3)' }}>Yuklanmoqda…</div>
      ) : (
        <form onSubmit={submit} style={{ maxWidth: 720, display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="card" style={{ padding: 28 }}>
            <h3 style={{ fontSize: 16, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Icon name="globe" size={16} style={{ color: 'var(--green-600)' }} /> Umumiy
            </h3>
            {F('Sayt nomi', 'site_name')}
            <div className="field">
              <label className="label">Sayt haqida</label>
              <textarea className="textarea" rows={4} value={s.about_text || ''} onChange={set('about_text')}
                placeholder="Platforma haqida qisqacha…" />
            </div>
          </div>

          <div className="card" style={{ padding: 28 }}>
            <h3 style={{ fontSize: 16, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Icon name="message" size={16} style={{ color: 'var(--green-600)' }} /> Aloqa ma'lumotlari
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {F('Email', 'contact_email', { type: 'email' })}
              {F('Telefon', 'contact_phone', { placeholder: '+998 90 123 45 67' })}
            </div>
            {F('Manzil', 'address', { placeholder: 'Toshkent sh., …' })}
          </div>

          <div className="card" style={{ padding: 28 }}>
            <h3 style={{ fontSize: 16, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Icon name="share" size={16} style={{ color: 'var(--green-600)' }} /> Ijtimoiy tarmoqlar
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {F('Telegram', 'telegram_url', { placeholder: 'https://t.me/...' })}
              {F('Instagram', 'instagram_url', { placeholder: 'https://instagram.com/...' })}
              {F('YouTube', 'youtube_url', { placeholder: 'https://youtube.com/...' })}
              {F('Facebook', 'facebook_url', { placeholder: 'https://facebook.com/...' })}
            </div>
            <div className="text-xs text-muted">Bo'sh qoldirilgan tarmoqlar saytda ko'rsatilmaydi.</div>
          </div>

          <div>
            <button className="btn btn-primary btn-lg" disabled={busy}>
              {busy ? 'Saqlanmoqda…' : 'Saqlash'}
            </button>
          </div>
        </form>
      )}
    </DashLayout>
  )
}
