import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import api from '../../api/client'
import DashLayout from '../../components/DashLayout'
import Icon from '../../components/Icon'
import FileInput from '../../components/FileInput'
import Pagination from '../../components/Pagination'
import FilterBar from '../../components/FilterBar'
import { PageHead, Panel, EmptyState } from '../../components/Dash'

const PAGE_SIZE = 12

const EMPTY_FORM = {
  title: '', description: '', resource_type: 'pdf', grade_level: 'all',
  external_url: '', file: null, category: '',
}

export default function AdminResources() {
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(null)   // resource id being edited, or null = create
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [form, setForm] = useState(EMPTY_FORM)

  function openNew() {
    setEditing(null); setForm(EMPTY_FORM); setOpen(true)
  }
  function openEdit(r) {
    setEditing(r.id)
    setForm({
      title: r.title || '', description: r.description || '',
      resource_type: r.resource_type || 'pdf', grade_level: r.grade_level || 'all',
      external_url: r.external_url || '', file: null, category: r.category || '',
    })
    setOpen(true)
  }

  const { data: cats = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.get('/categories/').then(r => r.data.results || r.data),
  })
  const { data } = useQuery({
    queryKey: ['admin-resources'],
    queryFn: () => api.get('/resources/?page_size=200').then(r => r.data),
  })
  const all = data?.results || data || []
  const q = search.trim().toLowerCase()
  const filtered = all
    .filter(r => !typeFilter || r.resource_type === typeFilter)
    .filter(r => !q || (r.title || '').toLowerCase().includes(q) || (r.description || '').toLowerCase().includes(q))
  const total = filtered.length
  const list = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const create = useMutation({
    mutationFn: () => {
      const fd = new FormData()
      Object.entries(form).forEach(([k, v]) => { if (v !== '' && v !== null) fd.append(k, v) })
      const headers = { 'Content-Type': 'multipart/form-data' }
      return editing
        ? api.patch(`/resources/${editing}/`, fd, { headers })
        : api.post('/resources/', fd, { headers })
    },
    onSuccess: () => {
      qc.invalidateQueries(['admin-resources'])
      toast.success(editing ? 'Saqlandi' : "Resurs qo'shildi")
      setOpen(false)
      setEditing(null)
      setForm(EMPTY_FORM)
    },
    onError: (e) => {
      const d = e.response?.data
      const msg = typeof d === 'object' && d
        ? (Object.values(d).flat()[0] || JSON.stringify(d))
        : (d || "Xatolik")
      toast.error(String(msg).slice(0, 200))
    },
  })

  const del = useMutation({
    mutationFn: (id) => api.delete(`/resources/${id}/`),
    onSuccess: () => { qc.invalidateQueries(['admin-resources']); toast.success("O'chirildi") },
  })

  return (
    <DashLayout kind="admin">
      <PageHead title="Resurslar" sub={`${all.length} ta yuklab olinadigan resurs`}>
        <button className="btn btn-primary" onClick={openNew}>
          <Icon name="plus" size={15} /> Resurs qo'shish
        </button>
      </PageHead>

      {all.length > 0 && (
        <FilterBar search={search} onSearch={v => { setSearch(v); setPage(1) }}
          placeholder="Resurs qidirish…" count={total}>
          <select className="select" value={typeFilter}
            onChange={e => { setTypeFilter(e.target.value); setPage(1) }}>
            <option value="">Barcha turlar</option>
            <option value="pdf">PDF</option>
            <option value="video">Video</option>
            <option value="map">Karta</option>
            <option value="doc">Hujjat</option>
            <option value="link">Havola</option>
          </select>
        </FilterBar>
      )}

      <Panel title="Barcha resurslar" count={total}>
        {list.length === 0 ? (
          all.length > 0 ? (
            <EmptyState small icon="search" title="Hech narsa topilmadi" sub="Filtr yoki qidiruvni o'zgartirib ko'ring." />
          ) : (
            <EmptyState icon="file" title="Hozircha resurslar yo'q"
              sub="PDF, video, karta va boshqa materiallarni yuklang — o'quvchilar ularni Resurslar bo'limida topadi."
              action={<button className="btn btn-primary btn-sm" onClick={openNew}><Icon name="plus" size={13} /> Resurs qo'shish</button>} />
          )
        ) : (
          <table className="table">
            <thead><tr><th>Nomi</th><th>Turi</th><th>Sinf</th><th>Yuklab olindi</th><th></th></tr></thead>
            <tbody>
              {list.map(r => (
                <tr key={r.id}>
                  <td><strong>{r.title}</strong><div className="text-xs text-muted">{r.description?.slice(0, 60)}</div></td>
                  <td><span className="badge badge-gray">{r.resource_type}</span></td>
                  <td className="text-sm">{r.grade_level}</td>
                  <td className="text-sm text-muted">{r.download_count || 0}</td>
                  <td>
                    <div className="row-actions" style={{ opacity: 1 }}>
                      <button className="icon-btn" title="Tahrirlash" onClick={() => openEdit(r)}>
                        <Icon name="edit" size={15} />
                      </button>
                      <button className="icon-btn" title="O'chirish" onClick={() => { if (confirm("O'chirish?")) del.mutate(r.id) }}>
                        <Icon name="trash" size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Panel>

      <Pagination page={page} pageSize={PAGE_SIZE} total={total} onChange={setPage} />

      {open && (
        <div
          style={{
            position: 'fixed', inset: 0, background: 'rgba(12,17,14,0.45)',
            backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
            padding: '40px 16px', zIndex: 100, overflowY: 'auto',
          }}
          onClick={() => setOpen(false)}
        >
          <div
            style={{
              width: '100%', maxWidth: 460, background: 'var(--white)',
              borderRadius: 20,
              boxShadow: 'var(--shadow-pop)',
              display: 'flex', flexDirection: 'column',
              maxHeight: 'calc(100vh - 80px)',
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header (sticky) */}
            <div style={{
              padding: '18px 22px', borderBottom: '1px solid var(--border-2)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              flexShrink: 0,
            }}>
              <h3 style={{ fontSize: 16, fontWeight: 650, letterSpacing: '-0.02em' }}>{editing ? 'Resursni tahrirlash' : 'Yangi resurs'}</h3>
              <button className="icon-btn" onClick={() => setOpen(false)}><Icon name="x" size={18} /></button>
            </div>

            {/* Scrollable body */}
            <div style={{ padding: '18px 22px', overflowY: 'auto', flex: 1 }}>
              <div className="field">
                <label className="label">Nomi</label>
                <input className="input" autoFocus value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                  placeholder="Masalan, DTM namuna testlari" />
              </div>
              <div className="field">
                <label className="label">Tavsif</label>
                <textarea className="textarea" rows={2} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="field">
                  <label className="label">Turi</label>
                  <select className="select" value={form.resource_type} onChange={e => setForm({ ...form, resource_type: e.target.value })}>
                    <option value="pdf">PDF</option>
                    <option value="video">Video</option>
                    <option value="map">Karta</option>
                    <option value="doc">Hujjat</option>
                    <option value="link">Havola</option>
                  </select>
                </div>
                <div className="field">
                  <label className="label">Sinf darajasi</label>
                  <select className="select" value={form.grade_level} onChange={e => setForm({ ...form, grade_level: e.target.value })}>
                    <option value="all">Barchasi</option>
                    <option value="5-6">5–6 sinf</option>
                    <option value="7-8">7–8 sinf</option>
                    <option value="9-10">9–10 sinf</option>
                    <option value="11">11-sinf (DTM)</option>
                  </select>
                </div>
              </div>
              <div className="field">
                <label className="label">Kategoriya</label>
                <select className="select" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                  <option value="">— Tanlash —</option>
                  {cats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="field">
                <label className="label">Fayl{editing ? " (yangi fayl tanlasangiz eskisi almashadi)" : ''}</label>
                <FileInput onPick={f => setForm({ ...form, file: f })} compact hint="PDF, DOCX, MP4, ZIP — 50MB gacha" />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '4px 0 8px', color: 'var(--text-3)', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.06 }}>
                <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                yoki
                <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
              </div>
              <div className="field" style={{ marginBottom: 0 }}>
                <label className="label">Tashqi havola</label>
                <input className="input" value={form.external_url} onChange={e => setForm({ ...form, external_url: e.target.value })} placeholder="https://..." />
              </div>
            </div>

            {/* Footer (sticky) */}
            <div style={{
              padding: '14px 22px', borderTop: '1px solid var(--border-2)',
              display: 'flex', gap: 8, justifyContent: 'flex-end',
              background: 'var(--bg-soft)', borderRadius: '0 0 20px 20px',
              flexShrink: 0,
            }}>
              <button className="btn btn-secondary btn-sm" onClick={() => setOpen(false)}>Bekor</button>
              <button className="btn btn-primary btn-sm" onClick={() => create.mutate()}
                disabled={create.isPending || !form.title.trim() || (!editing && !form.file && !form.external_url)}>
                {create.isPending ? 'Saqlanmoqda…' : (editing ? 'Saqlash' : "Qo'shish")}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashLayout>
  )
}
