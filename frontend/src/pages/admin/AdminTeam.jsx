import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import api, { absUrl } from '../../api/client'
import DashLayout from '../../components/DashLayout'
import Icon from '../../components/Icon'
import FilterBar from '../../components/FilterBar'
import { PageHead, EmptyState } from '../../components/Dash'

export default function AdminTeam() {
  const qc = useQueryClient()
  const [editing, setEditing] = useState(null) // null | 'new' | member object
  const [search, setSearch] = useState('')

  const { data: all = [], isLoading } = useQuery({
    queryKey: ['admin-team'],
    queryFn: () => api.get('/admin/team/').then(r => r.data.results || r.data),
  })
  const q = search.trim().toLowerCase()
  const members = all.filter(m => !q
    || (m.full_name || '').toLowerCase().includes(q)
    || (m.position || '').toLowerCase().includes(q))

  const refresh = () => qc.invalidateQueries(['admin-team'])

  const del = useMutation({
    mutationFn: (id) => api.delete(`/admin/team/${id}/`),
    onSuccess: () => { refresh(); toast.success("O'chirildi") },
    onError: () => toast.error("O'chirib bo'lmadi"),
  })

  async function move(idx, dir) {
    const target = idx + dir
    if (target < 0 || target >= all.length) return
    const arr = [...all]
    const [it] = arr.splice(idx, 1)
    arr.splice(target, 0, it)
    await Promise.all(arr.map((m, i) => api.patch(`/admin/team/${m.id}/`, { order: i })))
    refresh()
  }

  return (
    <DashLayout kind="admin">
      <PageHead title="Jamoa" sub={`"Biz haqimizda" sahifasida ko'rinadigan jamoa a'zolari — ${all.length} kishi`}>
        {!editing && (
          <button className="btn btn-primary" onClick={() => setEditing('new')}>
            <Icon name="plus" size={15} /> A'zo qo'shish
          </button>
        )}
      </PageHead>

      {editing && (
        <MemberForm member={editing === 'new' ? null : editing}
          nextOrder={all.length}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); refresh() }} />
      )}

      {all.length > 0 && (
        <FilterBar search={search} onSearch={setSearch}
          placeholder="Ism yoki lavozim bo'yicha qidirish…" count={members.length} />
      )}

      {isLoading ? (
        <div className="loading-state"><span className="spinner" />Yuklanmoqda…</div>
      ) : all.length === 0 && !editing ? (
        <div className="card" style={{ padding: 0 }}>
          <EmptyState icon="users" title="Hozircha jamoa a'zolari yo'q"
            sub={`Birinchi a'zoni qo'shing — "Biz haqimizda" sahifasidagi Jamoa bo'limida ko'rinadi.`}
            action={<button className="btn btn-primary btn-sm" onClick={() => setEditing('new')}><Icon name="plus" size={13} /> A'zo qo'shish</button>} />
        </div>
      ) : members.length === 0 ? (
        <div className="card" style={{ padding: 0 }}>
          <EmptyState small icon="search" title="Hech narsa topilmadi" sub="Qidiruv so'zini o'zgartirib ko'ring." />
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {members.map((m) => {
            const idx = all.findIndex(x => x.id === m.id)
            return (
              <div key={m.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', opacity: m.is_active ? 1 : 0.55 }}>
                <div className="avatar avatar-blue" style={{ width: 48, height: 48, fontSize: 16, overflow: 'hidden', flexShrink: 0 }}>
                  {m.photo ? <img src={absUrl(m.photo)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : m.initials}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 620, fontSize: 14.5 }}>{m.full_name}</div>
                  <div className="text-xs text-muted">{m.position}</div>
                </div>
                {!m.is_active && <span className="badge badge-gray">Yashirin</span>}
                <button className="icon-btn" disabled={idx === 0} style={{ opacity: idx === 0 ? 0.3 : 1 }}
                  onClick={() => move(idx, -1)} title="Yuqoriga"><Icon name="chevU" size={15} /></button>
                <button className="icon-btn" disabled={idx === all.length - 1} style={{ opacity: idx === all.length - 1 ? 0.3 : 1 }}
                  onClick={() => move(idx, 1)} title="Pastga"><Icon name="chevD" size={15} /></button>
                <button className="icon-btn" onClick={() => setEditing(m)} title="Tahrirlash"><Icon name="edit" size={15} /></button>
                <button className="icon-btn" title="O'chirish"
                  onClick={() => { if (confirm(`${m.full_name}ni jamoadan o'chirishni tasdiqlaysizmi?`)) del.mutate(m.id) }}>
                  <Icon name="trash" size={15} />
                </button>
              </div>
            )
          })}
        </div>
      )}
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
  const [preview, setPreview] = useState(member?.photo ? absUrl(member.photo) : null)
  const [busy, setBusy] = useState(false)

  const up = (k, v) => setForm({ ...form, [k]: v })

  function pickPhoto(file) {
    if (!file) return
    setPhoto(file)
    const reader = new FileReader()
    reader.onload = e => setPreview(e.target.result)
    reader.readAsDataURL(file)
  }

  async function save(e) {
    e.preventDefault()
    setBusy(true)
    try {
      const fd = new FormData()
      Object.entries(form).forEach(([k, v]) => fd.append(k, v))
      if (photo) fd.append('photo', photo)
      if (!member) fd.append('order', nextOrder)
      const headers = { 'Content-Type': 'multipart/form-data' }
      if (member?.id) await api.patch(`/admin/team/${member.id}/`, fd, { headers })
      else await api.post('/admin/team/', fd, { headers })
      toast.success('Saqlandi')
      onSaved()
    } catch { toast.error('Saqlashda xatolik') }
    finally { setBusy(false) }
  }

  return (
    <form onSubmit={save} className="card" style={{ padding: 24, marginBottom: 20, border: '1.5px solid var(--green-300)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
        <strong style={{ fontFamily: 'var(--font-display)', fontSize: 16 }}>
          {member ? "A'zoni tahrirlash" : "Yangi jamoa a'zosi"}
        </strong>
        <button type="button" className="icon-btn" onClick={onClose}><Icon name="x" size={16} /></button>
      </div>

      <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <label style={{ cursor: 'pointer', textAlign: 'center', flexShrink: 0 }}>
          <div className="avatar avatar-blue" style={{ width: 96, height: 96, fontSize: 28, overflow: 'hidden', margin: '0 auto' }}>
            {preview
              ? <img src={preview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <Icon name="camera" size={28} />}
          </div>
          <div className="text-xs text-muted mt-2">Rasm tanlash</div>
          <input type="file" accept="image/*" hidden onChange={e => pickPhoto(e.target.files?.[0])} />
        </label>

        <div style={{ flex: 1, minWidth: 260 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="field">
              <label className="label">Ism familiya *</label>
              <input className="input" autoFocus value={form.full_name} onChange={e => up('full_name', e.target.value)}
                placeholder="Masalan, Aziz Karimov" required />
            </div>
            <div className="field">
              <label className="label">Lavozim *</label>
              <input className="input" value={form.position} onChange={e => up('position', e.target.value)}
                placeholder="Masalan, Asoschisi va rahbar" required />
            </div>
          </div>
          <div className="field">
            <label className="label">Qisqa tavsif</label>
            <textarea className="textarea" rows={2} maxLength={300} value={form.bio} onChange={e => up('bio', e.target.value)}
              placeholder="Bir-ikki jumlada — nimaga mas'ul, tajribasi…" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="field">
              <label className="label">Telegram (ixtiyoriy)</label>
              <input className="input" type="url" value={form.telegram} onChange={e => up('telegram', e.target.value)}
                placeholder="https://t.me/..." />
            </div>
            <div className="field">
              <label className="label">LinkedIn (ixtiyoriy)</label>
              <input className="input" type="url" value={form.linkedin} onChange={e => up('linkedin', e.target.value)}
                placeholder="https://linkedin.com/in/..." />
            </div>
          </div>
          <label className="checkbox">
            <input type="checkbox" checked={form.is_active} onChange={e => up('is_active', e.target.checked)} />
            Saytda ko'rsatilsin
          </label>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
        <button type="button" className="btn btn-secondary" onClick={onClose}>Bekor</button>
        <button className="btn btn-primary" disabled={busy || !form.full_name.trim() || !form.position.trim()}>
          {busy ? 'Saqlanmoqda…' : 'Saqlash'}
        </button>
      </div>
    </form>
  )
}
