import { useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import api from '../../api/client'
import DashLayout from '../../components/DashLayout'
import Icon from '../../components/Icon'
import { PageHead } from '../../components/Dash'
import { ErrorState, LoadingBlock, ConfirmModal } from '../../components/PanelKit'

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
const KEYS = Object.keys(EMPTY)

const SOCIALS = [
  { key: 'telegram_url', label: 'Telegram', icon: 'twitter', base: 'https://t.me/', placeholder: 'https://t.me/ionedu' },
  { key: 'instagram_url', label: 'Instagram', icon: 'instagram', base: 'https://instagram.com/', placeholder: 'https://instagram.com/ionedu' },
  { key: 'youtube_url', label: 'YouTube', icon: 'youtube', base: 'https://youtube.com/@', placeholder: 'https://youtube.com/@ionedu' },
  { key: 'facebook_url', label: 'Facebook', icon: 'globe', base: 'https://facebook.com/', placeholder: 'https://facebook.com/ionedu' },
]

/** "@ionedu" → full profile link, "t.me/ionedu" → "https://t.me/ionedu". Backend only accepts full URLs. */
function normUrl(value, base) {
  const t = (value || '').trim()
  if (!t) return ''
  if (/^https?:\/\//i.test(t)) return t
  if (/^@[\w.]+$/.test(t) || /^\w+$/.test(t)) return base + t.replace(/^@/, '')
  return `https://${t}`
}

const pick = (obj) => Object.fromEntries(KEYS.map(k => [k, obj?.[k] ?? EMPTY[k]]))
const errText = (e) => (Array.isArray(e) ? e.join(' ') : String(e))

function fmtDate(iso) {
  if (!iso) return null
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? null : d.toLocaleString('uz-UZ', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const css = `
  .ase-grid { display: grid; grid-template-columns: minmax(0, 1fr) 340px; gap: 20px; align-items: start; }
  .ase-sheet { background: var(--white); border: 1.5px solid var(--border); border-radius: var(--r-card); }
  .ase-sec { display: grid; grid-template-columns: 200px minmax(0, 1fr); gap: 28px; padding: 26px 26px 12px; }
  .ase-sec + .ase-sec { border-top: 1.5px dashed var(--border); }
  .ase-sec-info .no { font-family: var(--font-mono); font-size: 11px; letter-spacing: 0.1em; color: var(--text-3); display: inline-flex; align-items: center; gap: 8px; }
  .ase-sec-info .no i { width: 26px; height: 26px; border-radius: 9px; border: 1.5px solid var(--line); display: inline-flex; align-items: center; justify-content: center; font-style: normal; color: #14213D; transform: rotate(-4deg); }
  .ase-sec-info .no i.c1 { background: var(--sun); }
  .ase-sec-info .no i.c2 { background: #C9DCFF; }
  .ase-sec-info .no i.c3 { background: var(--coral); }
  .ase-sec-info h3 { font-size: 18px; margin-top: 12px; }
  .ase-sec-info p { font-size: 13px; color: var(--text-3); margin-top: 6px; line-height: 1.5; }
  .ase-two { display: grid; grid-template-columns: 1fr 1fr; gap: 0 14px; }
  .ase-in-wrap { position: relative; }
  .ase-in-wrap > svg { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: var(--text-4); pointer-events: none; }
  .ase-in-wrap .input { padding-left: 40px; }
  .ase-bad { border-color: var(--red-600) !important; }
  .ase-count { float: right; font-family: var(--font-mono); font-size: 10.5px; color: var(--text-4); }

  .ase-side { display: flex; flex-direction: column; gap: 16px; position: sticky; top: 20px; }
  .ase-save { background: var(--white); border: 2px solid var(--line); border-radius: var(--r-card); box-shadow: var(--hard); padding: 18px; }
  .ase-save .st { display: flex; align-items: center; gap: 9px; font-size: 13.5px; font-weight: 700; color: var(--text); }
  .ase-save .st .dot { width: 10px; height: 10px; border-radius: 999px; background: var(--green-600); flex-shrink: 0; }
  .ase-save .st .dot.dirty { background: var(--sun); outline: 1.5px solid var(--line); }
  .ase-save .when { font-family: var(--font-mono); font-size: 10.5px; letter-spacing: 0.04em; color: var(--text-3); margin: 6px 0 14px 19px; }
  .ase-save .btns { display: flex; gap: 8px; }
  .ase-save .btns .btn-primary { flex: 1; }

  .ase-prev { background: var(--ink); color: #B7C0D8; border-radius: var(--r-card); padding: 20px; position: relative; overflow: hidden; }
  .ase-prev::before { content: ''; position: absolute; inset: 0; background-image: var(--topo); background-size: 420px 290px; filter: invert(1); opacity: .4; pointer-events: none; }
  html[data-theme="dark"] .ase-prev::before { filter: none; opacity: 1; }
  .ase-prev > * { position: relative; }
  .ase-prev .tag { font-family: var(--font-mono); font-size: 10px; letter-spacing: 0.12em; text-transform: uppercase; color: var(--sun); }
  .ase-prev .nm { font-family: var(--font-display); font-weight: 800; font-size: 24px; letter-spacing: -0.04em; color: #fff; margin-top: 12px; overflow-wrap: anywhere; line-height: 1.1; }
  .ase-prev .about { font-size: 12.5px; line-height: 1.55; margin-top: 8px; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
  .ase-prev ul { list-style: none; margin-top: 14px; padding-top: 14px; border-top: 1.5px dashed rgba(255,255,255,.18); display: flex; flex-direction: column; gap: 8px; }
  .ase-prev li { display: flex; align-items: center; gap: 9px; font-size: 12.5px; color: #fff; min-width: 0; }
  .ase-prev li svg { color: var(--sun); flex-shrink: 0; }
  .ase-prev li span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .ase-prev li.off span { color: #7887AD; }
  .ase-prev .soc { display: flex; gap: 7px; flex-wrap: wrap; margin-top: 14px; }
  .ase-prev .soc a, .ase-prev .soc span { width: 34px; height: 34px; border-radius: 11px; display: inline-flex; align-items: center; justify-content: center; background: var(--sun); color: #14213D; }
  .ase-prev .soc span { background: rgba(255,255,255,.08); color: #7887AD; }

  @media (max-width: 1180px) {
    .ase-grid { grid-template-columns: 1fr; }
    .ase-side { position: static; }
    .ase-form { padding-bottom: 8px; }
    .ase-save { position: fixed; left: 12px; right: 12px; bottom: 12px; z-index: 40; padding: 12px 14px; display: flex; align-items: center; gap: 12px; }
    .ase-save .when { display: none; }
    .ase-save .st { flex: 1; min-width: 0; }
    .ase-save .btns { flex-shrink: 0; }
    .ase-save .btns .btn-primary { flex: none; }
    .ase-wrap { padding-bottom: 84px; }
  }
  @media (max-width: 768px) {
    .ase-sec { grid-template-columns: 1fr; gap: 16px; padding: 20px 16px 6px; }
    .ase-sec-info h3 { margin-top: 8px; }
    .ase-two { grid-template-columns: 1fr; }
    .ase-save .st span.lbl { display: none; }
  }
`

function Field({ label, value, onChange, onBlur, error, type = 'text', placeholder = '', hint, icon, maxLength, required }) {
  const input = (
    <input className={`input ${error ? 'ase-bad' : ''}`} type={type} value={value || ''} onChange={onChange} onBlur={onBlur}
      placeholder={placeholder} maxLength={maxLength} aria-invalid={!!error} />
  )
  return (
    <div className="field">
      <label className="label">{label}{required && ' *'}</label>
      {icon ? <div className="ase-in-wrap"><Icon name={icon} size={15} />{input}</div> : input}
      {error && <div className="field-error">{errText(error)}</div>}
      {!error && hint && <div className="field-hint">{hint}</div>}
    </div>
  )
}

export default function AdminSettings() {
  const qc = useQueryClient()
  const [s, setS] = useState(EMPTY)
  const [saved, setSaved] = useState(null)       // last values known to be on the server
  const [updatedAt, setUpdatedAt] = useState(null)
  const [errors, setErrors] = useState({})
  const [busy, setBusy] = useState(false)
  const [phase, setPhase] = useState('loading')  // loading | ready | error
  const [askReset, setAskReset] = useState(false)

  function fetchSettings() {
    return api.get('/admin/settings/')
      .then(r => {
        const v = pick(r.data)
        setS(v); setSaved(v); setUpdatedAt(r.data?.updated_at || null); setPhase('ready')
      })
      .catch(() => setPhase('error'))
  }
  useEffect(() => { fetchSettings() }, [])

  const dirty = !!saved && KEYS.some(k => (s[k] || '') !== (saved[k] || ''))

  // Warn before closing the tab with unsaved changes
  useEffect(() => {
    if (!dirty) return undefined
    const h = (e) => { e.preventDefault(); e.returnValue = '' }
    window.addEventListener('beforeunload', h)
    return () => window.removeEventListener('beforeunload', h)
  }, [dirty])

  const set = (k) => (e) => {
    setS(prev => ({ ...prev, [k]: e.target.value }))
    if (errors[k]) setErrors(prev => ({ ...prev, [k]: null }))
  }
  const fixUrl = (k, base) => () => setS(prev => ({ ...prev, [k]: normUrl(prev[k], base) }))

  function validate(v) {
    const e = {}
    if (!v.site_name) e.site_name = 'Sayt nomini kiriting'
    if (!v.contact_email) e.contact_email = 'Email manzilini kiriting'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.contact_email)) e.contact_email = "Email manzili noto'g'ri"
    SOCIALS.forEach(({ key }) => {
      if (v[key] && !/^https?:\/\/[^\s/]+\.[^\s]+$/i.test(v[key])) e[key] = "To'liq havola kiriting (https://…)"
    })
    return e
  }

  async function submit(e) {
    e.preventDefault()
    if (busy) return
    const payload = {
      ...s,
      site_name: s.site_name.trim(),
      contact_email: s.contact_email.trim(),
      contact_phone: s.contact_phone.trim(),
      address: s.address.trim(),
    }
    SOCIALS.forEach(({ key, base }) => { payload[key] = normUrl(s[key], base) })
    setS(payload)
    const local = validate(payload)
    if (Object.keys(local).length) {
      setErrors(local)
      toast.error("Ba'zi maydonlarda xatolik bor")
      return
    }
    setBusy(true)
    setErrors({})
    try {
      const { data } = await api.put('/admin/settings/', payload)
      const v = pick(data)
      setS(v); setSaved(v); setUpdatedAt(data?.updated_at || null)
      // Footer and Contact page read the same record
      qc.invalidateQueries({ queryKey: ['site-settings'] })
      toast.success('Sozlamalar saqlandi')
    } catch (err) {
      const d = err.response?.data
      if (d && typeof d === 'object' && !d.detail) {
        setErrors(d)
        toast.error("Ba'zi maydonlarda xatolik bor")
      } else {
        toast.error(d?.detail || 'Saqlashda xatolik')
      }
    } finally { setBusy(false) }
  }

  const F = (label, k, extra = {}) => (
    <Field label={label} value={s[k]} onChange={set(k)} error={errors[k]} {...extra} />
  )
  const when = fmtDate(updatedAt)

  return (
    <DashLayout kind="admin">
      <style>{css}</style>
      <PageHead title="Sozlamalar"
        sub="Sayt nomi, aloqa ma'lumotlari va ijtimoiy tarmoqlar — footer va «Aloqa» sahifasida ko'rinadi." />

      {phase === 'loading' ? (
        <LoadingBlock label="Sozlamalar yuklanmoqda…" />
      ) : phase === 'error' ? (
        <ErrorState title="Sozlamalarni yuklab bo'lmadi"
          sub="Joriy qiymatlar olinmaguncha forma ochilmaydi — aks holda ular tasodifan ustidan yozilishi mumkin."
          onRetry={() => { setPhase('loading'); fetchSettings() }} />
      ) : (
        <div className="ase-wrap">
          <div className="ase-grid">
            <form id="ase-form" className="ase-sheet ase-form fade-up" onSubmit={submit} noValidate>
              <section className="ase-sec">
                <div className="ase-sec-info">
                  <span className="no"><i className="c1">1</i> UMUMIY</span>
                  <h3>Sayt haqida</h3>
                  <p>Nom brauzer sarlavhasi va footerda, tavsif esa footer ostida chiqadi.</p>
                </div>
                <div>
                  {F('Sayt nomi', 'site_name', { maxLength: 80, required: true })}
                  <div className="field">
                    <label className="label">
                      Qisqa tavsif
                      <span className="ase-count">{(s.about_text || '').length} belgi</span>
                    </label>
                    <textarea className="textarea" rows={4} value={s.about_text || ''} onChange={set('about_text')}
                      placeholder="Platforma haqida bir-ikki jumla…" />
                    {errors.about_text && <div className="field-error">{errText(errors.about_text)}</div>}
                  </div>
                </div>
              </section>

              <section className="ase-sec">
                <div className="ase-sec-info">
                  <span className="no"><i className="c2">2</i> ALOQA</span>
                  <h3>Aloqa ma'lumotlari</h3>
                  <p>O'quvchi va ota-onalar siz bilan shu manzillar orqali bog'lanadi.</p>
                </div>
                <div>
                  <div className="ase-two">
                    {F('Email', 'contact_email', { type: 'email', icon: 'mail', required: true })}
                    {F('Telefon', 'contact_phone', { placeholder: '+998 90 123 45 67', icon: 'phone', maxLength: 30 })}
                  </div>
                  {F('Manzil', 'address', { placeholder: 'Toshkent sh., …', icon: 'mapPin', maxLength: 200 })}
                </div>
              </section>

              <section className="ase-sec">
                <div className="ase-sec-info">
                  <span className="no"><i className="c3">3</i> TARMOQLAR</span>
                  <h3>Ijtimoiy tarmoqlar</h3>
                  <p>Bo'sh qoldirilgan tarmoq saytda ko'rsatilmaydi. «@nom» yozsangiz, havolaga o'zimiz aylantiramiz.</p>
                </div>
                <div className="ase-two">
                  {SOCIALS.map(sc => (
                    <Field key={sc.key} label={sc.label} value={s[sc.key]} onChange={set(sc.key)}
                      onBlur={fixUrl(sc.key, sc.base)} error={errors[sc.key]} placeholder={sc.placeholder}
                      icon={sc.icon} maxLength={200} />
                  ))}
                </div>
              </section>
            </form>

            <aside className="ase-side">
              <div className="ase-save">
                <div className="st">
                  <span className={`dot ${dirty ? 'dirty' : ''}`} />
                  {dirty ? "Saqlanmagan o'zgarishlar" : <span><span className="lbl">Hammasi </span>saqlangan</span>}
                </div>
                <div className="when">{when ? `OXIRGI YANGILANISH · ${when}` : 'HALI SAQLANMAGAN'}</div>
                <div className="btns">
                  <button type="submit" form="ase-form" className="btn btn-primary" disabled={busy || !dirty}>
                    <Icon name="check" size={15} /> {busy ? 'Saqlanmoqda…' : 'Saqlash'}
                  </button>
                  <button type="button" className="btn btn-secondary" disabled={busy || !dirty}
                    onClick={() => setAskReset(true)} title="O'zgarishlarni bekor qilish" aria-label="O'zgarishlarni bekor qilish">
                    <Icon name="rotate" size={15} />
                  </button>
                </div>
              </div>

              <div className="ase-prev">
                <span className="tag">Saytda ko'rinishi</span>
                <div className="nm">{s.site_name || 'Sayt nomi'}</div>
                {s.about_text && <p className="about">{s.about_text}</p>}
                <ul>
                  <li className={s.contact_email ? '' : 'off'}><Icon name="mail" size={14} /><span>{s.contact_email || 'email kiritilmagan'}</span></li>
                  <li className={s.contact_phone ? '' : 'off'}><Icon name="phone" size={14} /><span>{s.contact_phone || 'telefon kiritilmagan'}</span></li>
                  <li className={s.address ? '' : 'off'}><Icon name="mapPin" size={14} /><span>{s.address || 'manzil kiritilmagan'}</span></li>
                </ul>
                <div className="soc">
                  {SOCIALS.map(sc => s[sc.key]
                    ? <a key={sc.key} href={normUrl(s[sc.key], sc.base)} target="_blank" rel="noreferrer" title={`${sc.label} — ochish`}><Icon name={sc.icon} size={15} /></a>
                    : <span key={sc.key} title={`${sc.label} — kiritilmagan`}><Icon name={sc.icon} size={15} /></span>)}
                </div>
              </div>
            </aside>
          </div>
        </div>
      )}

      <ConfirmModal open={askReset} tone="sun" icon="rotate"
        title="O'zgarishlar bekor qilinsinmi?"
        text="Forma oxirgi saqlangan holatiga qaytadi."
        confirmLabel="Ha, qaytarish" cancelLabel="Davom etish"
        onClose={() => setAskReset(false)}
        onConfirm={() => { setS(saved); setErrors({}); setAskReset(false) }} />
    </DashLayout>
  )
}
