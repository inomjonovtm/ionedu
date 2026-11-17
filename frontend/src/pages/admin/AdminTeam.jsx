import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import api, { absUrl } from '../../api/client'
import DashLayout from '../../components/DashLayout'
import Icon from '../../components/Icon'
import { PageHead, EmptyState } from '../../components/Dash'
import { ConfirmModal, FormModal, ErrorState, LoadingBlock } from '../../components/PanelKit'

const TEAM_KEY = ['admin-team']
const MAX_PHOTO_MB = 5
const TONES = ['blue', 'amber', 'rose', 'violet', 'teal', 'green']
const tone = (id) => TONES[(Number(id) || 0) % TONES.length]
const pad = (n) => String(n).padStart(2, '0')

/** "@nom" yoki "t.me/nom" → to'liq havola (backend faqat to'liq URL qabul qiladi). */
function normUrl(value, base) {
  const t = (value || '').trim()
  if (!t) return ''
  if (/^https?:\/\//i.test(t)) return t
  if (/^@[\w.-]+$/.test(t) || /^[\w-]+$/.test(t)) return base + t.replace(/^@/, '')
  return `https://${t}`
}
const errText = (e) => (Array.isArray(e) ? e.join(' ') : String(e))

const css = `
  .atm-flat { padding: 0; }
  .atm-grid { display: grid; grid-template-columns: minmax(0, 1fr) 330px; gap: 20px; align-items: start; }
  .atm-tools { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; margin-bottom: 14px; }
  .atm-tools .search-box { flex: 1 1 240px; }
  .atm-tools .search-box .input { width: 100%; }
  .atm-note { display: flex; align-items: center; gap: 8px; font-size: 12.5px; color: var(--text-3); margin-bottom: 12px; }

  .atm-list { display: flex; flex-direction: column; gap: 10px; }
  .atm-row { display: grid; grid-template-columns: auto auto minmax(0, 1fr) auto auto; align-items: center; gap: 14px; padding: 12px 14px 12px 16px; background: var(--white); border: 1.5px solid var(--border); border-radius: 20px; transition: border-color .15s ease, box-shadow .15s ease, transform .15s ease; }
  .atm-row:hover { border-color: var(--line); box-shadow: var(--hard-sm); transform: translate(-1px, -1px); }
  .atm-row.off { background: var(--paper); border-style: dashed; }
  .atm-row.off .atm-ph, .atm-row.off .atm-who { opacity: .6; }
  .atm-no { font-family: var(--font-mono); font-size: 12px; font-weight: 600; color: var(--text-4); width: 22px; }
  .atm-ph { width: 52px; height: 52px; border-radius: 16px; font-size: 17px; }
  .atm-who { min-width: 0; }
  .atm-who b { display: flex; align-items: center; gap: 8px; font-size: 15px; font-weight: 700; color: var(--text); }
  .atm-who b span:first-child { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .atm-who .pos { font-size: 13px; color: var(--text-3); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; margin-top: 1px; }
  .atm-vis { display: flex; align-items: center; gap: 8px; font-family: var(--font-mono); font-size: 10px; text-transform: uppercase; letter-spacing: 0.08em; color: var(--text-3); }
  .atm-acts { display: flex; align-items: center; gap: 2px; padding-left: 10px; border-left: 1.5px dashed var(--border); }
  .atm-acts .icon-btn:disabled { opacity: .3; cursor: not-allowed; }

  .atm-side { position: sticky; top: 20px; display: flex; flex-direction: column; gap: 16px; }
  .atm-prev { background: var(--white); border: 2px solid var(--line); border-radius: var(--r-card); box-shadow: var(--hard); overflow: hidden; }
  .atm-prev-head { padding: 16px 18px; background-image: var(--topo); background-size: 420px 290px; border-bottom: 1.5px dashed var(--border); display: flex; align-items: flex-start; justify-content: space-between; gap: 10px; }
  .atm-prev-head .t { font-family: var(--font-mono); font-size: 10px; letter-spacing: 0.12em; text-transform: uppercase; color: var(--text-3); }
  .atm-prev-head h3 { font-size: 18px; margin-top: 4px; }
  .atm-prev-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; padding: 16px; }
  .atm-pc { text-align: center; padding: 14px 8px 12px; border: 1.5px solid var(--border); border-radius: 16px; min-width: 0; }
  .atm-pc .avatar { width: 54px; height: 54px; border-radius: 17px; font-size: 17px; margin: 0 auto 8px; border: 1.5px solid var(--line); }
  .atm-pc:nth-child(odd) .avatar { transform: rotate(-4deg); }
  .atm-pc:nth-child(even) .avatar { transform: rotate(3deg); }
  .atm-pc b { display: block; font-size: 12.5px; line-height: 1.25; color: var(--text); overflow-wrap: anywhere; }
  .atm-pc span { display: block; font-size: 11px; color: var(--text-3); margin-top: 3px; line-height: 1.3; overflow-wrap: anywhere; }
  .atm-prev-more { padding: 0 16px 16px; font-size: 12.5px; color: var(--text-3); text-align: center; }
  .atm-tip { display: flex; gap: 10px; font-size: 12.5px; line-height: 1.5; color: var(--text-3); padding: 14px 16px; border: 1.5px dashed var(--border); border-radius: 18px; }
  .atm-tip svg { flex-shrink: 0; margin-top: 2px; color: var(--text-2); }

  /* form */
  .atm-form { display: grid; grid-template-columns: 132px minmax(0, 1fr); gap: 22px; }
  .atm-photo { text-align: center; }
  .atm-photo label { cursor: pointer; display: block; }
  .atm-photo .frame { width: 116px; height: 116px; margin: 0 auto; border-radius: 26px; border: 2px dashed var(--border); background: var(--bg-soft); color: var(--text-3); display: flex; align-items: center; justify-content: center; overflow: hidden; transition: border-color .15s ease; }
  .atm-photo label:hover .frame { border-color: var(--line); }
  .atm-photo .frame.has { border: 2px solid var(--line); box-shadow: var(--hard-sm); transform: rotate(-3deg); }
  .atm-photo .frame img { width: 100%; height: 100%; object-fit: cover; }
  .atm-photo .pick { display: inline-block; font-size: 12.5px; font-weight: 700; color: var(--text-2); margin-top: 12px; text-decoration: underline; text-underline-offset: 3px; }
  .atm-photo .rm { display: block; margin: 6px auto 0; font-size: 12px; font-weight: 600; color: var(--red-600); }
  .atm-photo .rm:hover { text-decoration: underline; }
  .atm-two { display: grid; grid-template-columns: 1fr 1fr; gap: 0 12px; }
  .atm-count { float: right; font-family: var(--font-mono); font-size: 10.5px; color: var(--text-4); font-weight: 500; }
  .atm-show { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 12px 14px; background: var(--paper); border: 1.5px solid var(--border); border-radius: 14px; font-size: 13.5px; font-weight: 600; color: var(--text-2); margin-bottom: 6px; }
  .atm-bad { border-color: var(--red-600) !important; }

  @media (max-width: 1180px) {
    .atm-grid { grid-template-columns: 1fr; }
    .atm-side { position: static; }
    .atm-prev-grid { grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)); }
  }
  @media (max-width: 700px) {
    .atm-row { grid-template-columns: auto minmax(0, 1fr); gap: 10px 12px; padding: 14px; }
    .atm-no { display: none; }
    .atm-vis { grid-column: 1 / -1; justify-content: space-between; padding-top: 10px; border-top: 1.5px dashed var(--border); }
    .atm-acts { grid-column: 1 / -1; border-left: none; padding-left: 0; justify-content: space-between; }
    .atm-acts .icon-btn { flex: 1; border-color: var(--border); }
    .atm-who .pos { white-space: normal; }
    .atm-form { grid-template-columns: 1fr; gap: 14px; }
    .atm-two { grid-template-columns: 1fr; }
  }
`

export default function AdminTeam() {
  const qc = useQueryClient()
  const [editing, setEditing] = useState(null) // null | 'new' | member object
  const [search, setSearch] = useState('')
  const [toDelete, setToDelete] = useState(null)
  const [moving, setMoving] = useState(false)

  const { data: all = [], isLoading, isError, refetch } = useQuery({
    queryKey: TEAM_KEY,
    // default page size is 12 — ask for the maximum so the roster (and its order) is complete
    queryFn: () => api.get('/admin/team/?page_size=100').then(r => r.data.results || r.data),
  })
  const q = search.trim().toLowerCase()
  const members = all.filter(m => !q
    || (m.full_name || '').toLowerCase().includes(q)
    || (m.position || '').toLowerCase().includes(q))
  const visible = all.filter(m => m.is_active)
  const hiddenCount = all.length - visible.length

  const refresh = () => {
    qc.invalidateQueries({ queryKey: TEAM_KEY })
    qc.invalidateQueries({ queryKey: ['public-team'] })   // About page
  }

  const del = useMutation({
    mutationFn: (id) => api.delete(`/admin/team/${id}/`),
    onSuccess: () => { setToDelete(null); refresh(); toast.success("A'zo o'chirildi") },
    onError: (err) => toast.error(err.response?.data?.detail || "O'chirib bo'lmadi"),
  })

  const toggle = useMutation({
    mutationFn: (m) => api.patch(`/admin/team/${m.id}/`, { is_active: !m.is_active }),
    onMutate: (m) => {
      qc.setQueryData(TEAM_KEY, (old) => Array.isArray(old)
        ? old.map(x => x.id === m.id ? { ...x, is_active: !m.is_active } : x) : old)
    },
    onSuccess: (_r, m) => toast.success(m.is_active ? 'Saytdan yashirildi' : "Saytda ko'rsatiladi"),
    onError: (err) => toast.error(err.response?.data?.detail || "O'zgartirib bo'lmadi"),
    onSettled: refresh,
  })

  async function move(idx, dir) {
    const target = idx + dir
    if (moving || target < 0 || target >= all.length) return
    const arr = [...all]
    const [it] = arr.splice(idx, 1)
    arr.splice(target, 0, it)
    // Only members whose stored position actually changes are sent to the server
    const changed = arr.map((m, i) => ({ m, i })).filter(({ m, i }) => m.order !== i)
    setMoving(true)
    qc.setQueryData(TEAM_KEY, arr.map((m, i) => ({ ...m, order: i })))   // optimistic
    try {
      await Promise.all(changed.map(({ m, i }) => api.patch(`/admin/team/${m.id}/`, { order: i })))
    } catch {
      toast.error("Tartibni saqlab bo'lmadi")
    } finally {
      setMoving(false)
      refresh()
    }
  }

  return (
    <DashLayout kind="admin">
      <style>{css}</style>
      <PageHead title="Jamoa"
        sub={all.length
          ? `«Biz haqimizda» sahifasidagi jamoa — ${all.length} kishi${hiddenCount ? `, ${hiddenCount} tasi yashirin` : ''}`
          : '«Biz haqimizda» sahifasida ko\'rinadigan jamoa a\'zolari'}>
        <Link to="/about" className="btn btn-secondary" target="_blank" rel="noreferrer">
          <Icon name="eye" size={15} /> Saytda ko'rish
        </Link>
        <button type="button" className="btn btn-primary" onClick={() => setEditing('new')}>
          <Icon name="plus" size={15} /> A'zo qo'shish
        </button>
      </PageHead>

      {isLoading ? (
        <LoadingBlock label="Jamoa yuklanmoqda…" />
      ) : isError ? (
        <ErrorState title="Jamoa ro'yxatini yuklab bo'lmadi" onRetry={refetch} />
      ) : all.length === 0 ? (
        <div className="card atm-flat">
          <EmptyState icon="users" title="Hozircha jamoa a'zolari yo'q"
            sub="Birinchi a'zoni qo'shing — u «Biz haqimizda» sahifasidagi Jamoa bo'limida ko'rinadi."
            action={<button type="button" className="btn btn-primary btn-sm" onClick={() => setEditing('new')}><Icon name="plus" size={13} /> A'zo qo'shish</button>} />
        </div>
      ) : (
        <div className="atm-grid">
          <div>
            <div className="atm-tools">
              <div className="search-box">
                <Icon name="search" size={15} />
                <input className="input" placeholder="Ism yoki lavozim bo'yicha qidirish…" value={search}
                  onChange={e => setSearch(e.target.value)} aria-label="Jamoa a'zosini qidirish" />
              </div>
              <span className="coord">{q ? `TOPILDI · ${members.length}` : `TARTIB · 01–${pad(all.length)}`}</span>
            </div>
            {q && members.length > 0 && (
              <div className="atm-note"><Icon name="alert" size={13} /> Tartibni o'zgartirish uchun qidiruvni tozalang.</div>
            )}

            {members.length === 0 ? (
              <div className="card atm-flat">
                <EmptyState small icon="search" title="Hech kim topilmadi" sub="Qidiruv so'zini o'zgartirib ko'ring."
                  action={<button type="button" className="btn btn-secondary btn-sm" onClick={() => setSearch('')}>Qidiruvni tozalash</button>} />
              </div>
            ) : (
              <div className="atm-list">
                {members.map((m) => {
                  const idx = all.findIndex(x => x.id === m.id)
                  return (
                    <div key={m.id} className={`atm-row ${m.is_active ? '' : 'off'}`}>
                      <span className="atm-no">{pad(idx + 1)}</span>
                      <span className={`avatar avatar-${tone(m.id)} atm-ph`}>
                        {m.photo ? <img src={absUrl(m.photo)} alt="" /> : m.initials}
                      </span>
                      <div className="atm-who">
                        <b>
                          <span>{m.full_name}</span>
                          {!m.is_active && <span className="badge badge-gray">Yashirin</span>}
                        </b>
                        <div className="pos">{m.position}</div>
                      </div>
                      <div className="atm-vis">
                        <span>Saytda</span>
                        <label className="switch" title={m.is_active ? 'Saytdan yashirish' : "Saytda ko'rsatish"}>
                          <input type="checkbox" checked={!!m.is_active} disabled={toggle.isPending}
                            onChange={() => toggle.mutate(m)} aria-label={`${m.full_name} — saytda ko'rsatish`} />
                          <span />
                        </label>
                      </div>
                      <div className="atm-acts">
                        <button type="button" className="icon-btn" disabled={!!q || moving || idx === 0}
                          onClick={() => move(idx, -1)} title="Yuqoriga" aria-label="Yuqoriga surish"><Icon name="chevU" size={16} /></button>
                        <button type="button" className="icon-btn" disabled={!!q || moving || idx === all.length - 1}
                          onClick={() => move(idx, 1)} title="Pastga" aria-label="Pastga surish"><Icon name="chevD" size={16} /></button>
                        <button type="button" className="icon-btn" onClick={() => setEditing(m)} title="Tahrirlash" aria-label="Tahrirlash"><Icon name="edit" size={15} /></button>
                        <button type="button" className="icon-btn danger" onClick={() => setToDelete(m)} title="O'chirish" aria-label="O'chirish"><Icon name="trash" size={15} /></button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <aside className="atm-side">
            <div className="atm-prev">
              <div className="atm-prev-head">
                <div>
                  <span className="t">Saytda ko'rinishi</span>
                  <h3>Bizning jamoa</h3>
                </div>
                <span className="badge badge-amber">{visible.length} kishi</span>
              </div>
              {visible.length === 0 ? (
                <EmptyState small icon="eye" title="Hech kim ko'rsatilmayapti"
                  sub="Kamida bitta a'zoni «Saytda» holatiga o'tkazing." />
              ) : (
                <>
                  <div className="atm-prev-grid">
                    {visible.slice(0, 6).map(m => (
                      <div key={m.id} className="atm-pc">
                        <span className={`avatar avatar-${tone(m.id)}`}>
                          {m.photo ? <img src={absUrl(m.photo)} alt="" /> : m.initials}
                        </span>
                        <b>{m.full_name}</b>
                        <span>{m.position}</span>
                      </div>
                    ))}
                  </div>
                  {visible.length > 6 && <div className="atm-prev-more">va yana {visible.length - 6} kishi…</div>}
                </>
              )}
            </div>
            <div className="atm-tip">
              <Icon name="compass" size={15} />
              <span>Ro'yxatdagi tartib saytdagi tartib bilan bir xil. Strelkalar bilan a'zoni yuqoriga yoki pastga suring.</span>
            </div>
          </aside>
        </div>
      )}

      {editing && (
        <MemberForm key={editing === 'new' ? 'new' : editing.id}
          member={editing === 'new' ? null : editing}
          nextOrder={all.reduce((mx, m) => Math.max(mx, (m.order ?? 0) + 1), all.length)}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); refresh() }} />
      )}

      <ConfirmModal open={!!toDelete} busy={del.isPending}
        title="A'zo o'chirilsinmi?"
        text={toDelete ? `${toDelete.full_name} jamoa ro'yxatidan va «Biz haqimizda» sahifasidan butunlay o'chiriladi. Vaqtincha yashirish uchun «Saytda» tugmasidan foydalaning.` : ''}
        confirmLabel="Ha, o'chirish"
        onClose={() => setToDelete(null)}
        onConfirm={() => del.mutate(toDelete.id)} />
    </DashLayout>
  )
}

function MemberForm({ member, nextOrder, onClose, onSaved }) {
  const [form, setForm] = useState({
    full_name: member?.full_name || '',
    position: member?.position || '',
    bio: member?.bio || '',
    telegram: member?.telegram || '',
    linkedin: member?.linkedin || '',
    is_active: member?.is_active ?? true,
  })
  const [photo, setPhoto] = useState(null)
  const [removePhoto, setRemovePhoto] = useState(false)
  const [preview, setPreview] = useState(member?.photo ? absUrl(member.photo) : null)
  const [errors, setErrors] = useState({})
  const [busy, setBusy] = useState(false)

  const up = (k, v) => {
    setForm(prev => ({ ...prev, [k]: v }))
    if (errors[k]) setErrors(prev => ({ ...prev, [k]: null }))
  }

  function pickPhoto(file) {
    if (!file) return
    if (!file.type.startsWith('image/')) { toast.error('Faqat rasm fayli tanlang (JPG, PNG)'); return }
    if (file.size > MAX_PHOTO_MB * 1024 * 1024) { toast.error(`Rasm hajmi ${MAX_PHOTO_MB} MB dan oshmasin`); return }
    setPhoto(file); setRemovePhoto(false)
    const reader = new FileReader()
    reader.onload = e => setPreview(e.target.result)
    reader.readAsDataURL(file)
  }
  function clearPhoto() {
    setPhoto(null); setPreview(null)
    setRemovePhoto(!!member?.photo)
  }

  async function save() {
    if (busy) return
    const data = {
      ...form,
      full_name: form.full_name.trim(),
      position: form.position.trim(),
      bio: form.bio.trim(),
      telegram: normUrl(form.telegram, 'https://t.me/'),
      linkedin: normUrl(form.linkedin, 'https://linkedin.com/in/'),
    }
    const local = {}
    if (!data.full_name) local.full_name = 'Ism familiyani kiriting'
    if (!data.position) local.position = 'Lavozimni kiriting'
    if (Object.keys(local).length) { setErrors(local); return }
    setForm(data)
    setBusy(true)
    try {
      const fd = new FormData()
      Object.entries(data).forEach(([k, v]) => fd.append(k, v))
      if (photo) fd.append('photo', photo)
      else if (removePhoto) fd.append('photo', '')
      if (!member) fd.append('order', nextOrder)
      const headers = { 'Content-Type': 'multipart/form-data' }
      if (member?.id) await api.patch(`/admin/team/${member.id}/`, fd, { headers })
      else await api.post('/admin/team/', fd, { headers })
      toast.success(member ? "O'zgarishlar saqlandi" : "A'zo qo'shildi")
      onSaved()
    } catch (err) {
      const d = err.response?.data
      if (d && typeof d === 'object' && !d.detail) {
        setErrors(d)
        toast.error(d.photo ? `Rasm: ${errText(d.photo)}` : "Ba'zi maydonlarda xatolik bor")
      } else {
        toast.error(d?.detail || 'Saqlashda xatolik')
      }
    } finally { setBusy(false) }
  }

  const err = (k) => errors[k] && <div className="field-error">{errText(errors[k])}</div>

  return (
    <FormModal wide icon="users" tone="sun"
      title={member ? "A'zoni tahrirlash" : "Yangi jamoa a'zosi"}
      sub="Ma'lumotlar «Biz haqimizda» sahifasidagi kartochkada chiqadi."
      onClose={() => { if (!busy) onClose() }} onSubmit={save}
      footer={(
        <>
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={busy}>Bekor qilish</button>
          <button type="submit" className="btn btn-primary" disabled={busy}>
            <Icon name="check" size={15} /> {busy ? 'Saqlanmoqda…' : 'Saqlash'}
          </button>
        </>
      )}>
      <div className="atm-form">
        <div className="atm-photo">
          <label>
            <div className={`frame ${preview ? 'has' : ''}`}>
              {preview ? <img src={preview} alt="" /> : <Icon name="image" size={30} />}
            </div>
            <span className="pick">{preview ? 'Rasmni almashtirish' : 'Rasm tanlash'}</span>
            <input type="file" accept="image/*" hidden
              onChange={e => { pickPhoto(e.target.files?.[0]); e.target.value = '' }} />
          </label>
          {preview && <button type="button" className="rm" onClick={clearPhoto}>Olib tashlash</button>}
          {!preview && <div className="field-hint">JPG yoki PNG, {MAX_PHOTO_MB} MB gacha</div>}
        </div>

        <div>
          <div className="atm-two">
            <div className="field">
              <label className="label">Ism familiya *</label>
              <input className={`input ${errors.full_name ? 'atm-bad' : ''}`} autoFocus maxLength={120}
                value={form.full_name} onChange={e => up('full_name', e.target.value)} placeholder="Masalan, Aziz Karimov" />
              {err('full_name')}
            </div>
            <div className="field">
              <label className="label">Lavozim *</label>
              <input className={`input ${errors.position ? 'atm-bad' : ''}`} maxLength={160}
                value={form.position} onChange={e => up('position', e.target.value)} placeholder="Masalan, Asoschi va rahbar" />
              {err('position')}
            </div>
          </div>
          <div className="field">
            <label className="label">Qisqa tavsif <span className="atm-count">{form.bio.length}/300</span></label>
            <textarea className="textarea" rows={2} maxLength={300} value={form.bio} onChange={e => up('bio', e.target.value)}
              placeholder="Bir-ikki jumlada — nimaga mas'ul, tajribasi…" />
            {err('bio')}
          </div>
          <div className="atm-two">
            <div className="field">
              <label className="label">Telegram</label>
              <input className={`input ${errors.telegram ? 'atm-bad' : ''}`} maxLength={200} value={form.telegram}
                onChange={e => up('telegram', e.target.value)}
                onBlur={() => up('telegram', normUrl(form.telegram, 'https://t.me/'))}
                placeholder="@nom yoki https://t.me/…" />
              {err('telegram')}
            </div>
            <div className="field">
              <label className="label">LinkedIn</label>
              <input className={`input ${errors.linkedin ? 'atm-bad' : ''}`} maxLength={200} value={form.linkedin}
                onChange={e => up('linkedin', e.target.value)}
                onBlur={() => up('linkedin', normUrl(form.linkedin, 'https://linkedin.com/in/'))}
                placeholder="https://linkedin.com/in/…" />
              {err('linkedin')}
            </div>
          </div>
          <div className="atm-show">
            Saytda ko'rsatilsin
            <label className="switch">
              <input type="checkbox" checked={form.is_active} onChange={e => up('is_active', e.target.checked)}
                aria-label="Saytda ko'rsatilsin" />
              <span />
            </label>
          </div>
        </div>
      </div>
    </FormModal>
  )
}
