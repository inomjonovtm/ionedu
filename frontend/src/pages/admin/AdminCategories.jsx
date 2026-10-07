import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import api from '../../api/client'
import DashLayout from '../../components/DashLayout'
import Icon from '../../components/Icon'
import Pagination from '../../components/Pagination'
import FilterBar from '../../components/FilterBar'
import { PageHead, EmptyState } from '../../components/Dash'

const EMOJI_SUGGESTIONS = ['📘', '🌍', '🏔️', '🗺️', '🌋', '🌊', '🌾', '🌡️', '🧭', '⛰️', '🏙️', '🛰️']
const PAGE_SIZE = 12

export default function AdminCategories() {
  const qc = useQueryClient()
  const [editing, setEditing] = useState(null) // null | 'new' | category object
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  const { data: allCats = [], isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.get('/categories/').then(r => r.data.results || r.data),
  })
  const q = search.trim().toLowerCase()
  const filtered = allCats.filter(c => !q || (c.name || '').toLowerCase().includes(q))
  const total = filtered.length
  const cats = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const del = useMutation({
    mutationFn: (id) => api.delete(`/categories/${id}/`),
    onSuccess: () => { qc.invalidateQueries(['categories']); toast.success("O'chirildi") },
    onError: () => toast.error("O'chirib bo'lmadi — kategoriya kurslarda ishlatilayotgan bo'lishi mumkin"),
  })

  return (
    <DashLayout kind="admin">
      <PageHead title="Kategoriyalar" sub="Kurslar va testlar uchun yo'nalishlar — katalog filtrlarida ishlatiladi.">
        {!editing && (
          <button className="btn btn-primary" onClick={() => setEditing('new')}>
            <Icon name="plus" size={15} /> Yangi kategoriya
          </button>
        )}
      </PageHead>

      {editing && (
        <CategoryForm category={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); qc.invalidateQueries(['categories']) }} />
      )}

      {allCats.length > 0 && (
        <FilterBar search={search} onSearch={v => { setSearch(v); setPage(1) }}
          placeholder="Kategoriya qidirish…" count={total} />
      )}

      {isLoading ? (
        <div className="loading-state"><span className="spinner" />Yuklanmoqda…</div>
      ) : allCats.length > 0 && cats.length === 0 ? (
        <div className="card" style={{ padding: 0 }}>
          <EmptyState small icon="search" title="Hech narsa topilmadi" sub="Qidiruv so'zini o'zgartirib ko'ring." />
        </div>
      ) : cats.length === 0 ? (
        <div className="card" style={{ padding: 0 }}>
          <EmptyState icon="grid" title="Hozircha kategoriyalar yo'q"
            sub="Birinchi kategoriyani qo'shing — kurs va test yaratishda tanlanadi."
            action={<button className="btn btn-primary btn-sm" onClick={() => setEditing('new')}><Icon name="plus" size={13} /> Kategoriya qo'shish</button>} />
        </div>
      ) : (
        <>
        <div className="grid grid-3">
          {cats.map(c => (
            <div key={c.id} className="card card-hover" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{
                width: 46, height: 46, borderRadius: 13, background: 'var(--bg-soft)',
                boxShadow: 'inset 0 0 0 1px var(--border-2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0,
              }}>{c.icon || '📘'}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 620, letterSpacing: '-0.015em', fontSize: 14.5 }}>{c.name}</div>
                <div className="text-xs text-muted font-mono mt-1">
                  {c.course_count || 0} KURS · {c.test_count || 0} TEST
                </div>
              </div>
              <button className="icon-btn" onClick={() => setEditing(c)} title="Tahrirlash"><Icon name="edit" size={15} /></button>
              <button className="icon-btn" title="O'chirish"
                onClick={() => { if (confirm(`"${c.name}" kategoriyasini o'chirishni tasdiqlaysizmi?`)) del.mutate(c.id) }}>
                <Icon name="trash" size={15} />
              </button>
            </div>
          ))}
        </div>
        <Pagination page={page} pageSize={PAGE_SIZE} total={total} onChange={setPage} />
        </>
      )}
    </DashLayout>
  )
}

function CategoryForm({ category, onClose, onSaved }) {
  const [name, setName] = useState(category?.name || '')
  const [icon, setIcon] = useState(category?.icon || '📘')
  const [busy, setBusy] = useState(false)

  async function save(e) {
    e.preventDefault()
    setBusy(true)
    try {
      if (category?.id) await api.patch(`/categories/${category.id}/`, { name: name.trim(), icon })
      else await api.post('/categories/', { name: name.trim(), icon })
      toast.success('Saqlandi')
      onSaved()
    } catch (err) {
      const d = err.response?.data
      toast.error(d?.name?.[0] || 'Saqlashda xatolik')
    } finally { setBusy(false) }
  }

  return (
    <form onSubmit={save} className="card" style={{ padding: 24, marginBottom: 20, border: '1.5px solid var(--green-300)', maxWidth: 560 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <strong style={{ fontFamily: 'var(--font-display)', fontSize: 16 }}>
          {category ? 'Kategoriyani tahrirlash' : 'Yangi kategoriya'}
        </strong>
        <button type="button" className="icon-btn" onClick={onClose}><Icon name="x" size={16} /></button>
      </div>
      <div className="field">
        <label className="label">Nomi *</label>
        <input className="input" autoFocus value={name} onChange={e => setName(e.target.value)}
          placeholder="Masalan, Tabiiy geografiya" required />
      </div>
      <div className="field">
        <label className="label">Belgi (emoji)</label>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          {EMOJI_SUGGESTIONS.map(e => (
            <button key={e} type="button" onClick={() => setIcon(e)}
              style={{
                width: 40, height: 40, borderRadius: 9, fontSize: 20, cursor: 'pointer',
                border: `2px solid ${icon === e ? 'var(--green-600)' : 'var(--border)'}`,
                background: icon === e ? 'var(--green-50)' : 'white',
              }}>{e}</button>
          ))}
          <input className="input" value={icon} onChange={e => setIcon(e.target.value)}
            style={{ width: 70, textAlign: 'center', fontSize: 18 }} maxLength={4} />
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <button type="button" className="btn btn-secondary" onClick={onClose}>Bekor</button>
        <button className="btn btn-primary" disabled={busy || !name.trim()}>
          {busy ? 'Saqlanmoqda…' : 'Saqlash'}
        </button>
      </div>
    </form>
  )
}
