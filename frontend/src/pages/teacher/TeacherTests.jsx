import { useState } from 'react'
import { Link, useLocation, useSearchParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import api from '../../api/client'
import DashLayout from '../../components/DashLayout'
import Icon from '../../components/Icon'
import Confirm from '../../components/Confirm'
import TestEditor from '../../components/builder/TestEditor'
import { PageHead, EmptyState } from '../../components/Dash'

/* Standalone tests (the public "Testlar" catalog) — list + full editor.
   Course tests are edited inside the course studio. */

const css = `
  .tt-bar { display: flex; gap: 10px; flex-wrap: wrap; align-items: center; margin-bottom: 16px; }
  .tt-bar .search-box { flex: 1 1 260px; } .tt-bar .search-box .input { width: 100%; }
  .tt-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(330px, 1fr)); gap: 16px; }
  .tt-card { background: var(--white); border: 1.5px solid var(--border); border-radius: 22px; padding: 18px; display: flex; flex-direction: column; gap: 12px; transition: border-color .14s ease, box-shadow .14s ease, transform .14s ease; cursor: pointer; }
  .tt-card:hover { border-color: var(--line); box-shadow: var(--hard); transform: translate(-2px, -2px); }
  .tt-card-top { display: flex; align-items: flex-start; gap: 12px; }
  .tt-ico { width: 46px; height: 46px; border-radius: 15px; border: 1.5px solid var(--line); background: #DAD0FF; color: #14213D; display: flex; align-items: center; justify-content: center; flex-shrink: 0; transform: rotate(-4deg); font-size: 22px; }
  .tt-card h3 { font-size: 18px; line-height: 1.2; }
  .tt-desc { font-size: 13.5px; color: var(--text-3); line-height: 1.5; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
  .tt-meta { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
  .tt-meta div { background: var(--bg-soft); border-radius: 12px; padding: 9px 10px; }
  .tt-meta b { display: block; font-family: var(--font-display); font-size: 19px; font-weight: 800; letter-spacing: -.03em; line-height: 1; }
  .tt-meta span { font-size: 11.5px; color: var(--text-3); font-weight: 600; }
  .tt-foot { display: flex; align-items: center; gap: 6px; margin-top: auto; padding-top: 12px; border-top: 1.5px dashed var(--border); }
  .tt-foot .sp { flex: 1; }
  .tt-edit-head { display: flex; align-items: center; gap: 14px; flex-wrap: wrap; margin-bottom: 18px; }
  .tt-edit-head h1 { font-size: 28px; min-width: 0; overflow: hidden; text-overflow: ellipsis; }
  .tt-back { width: 42px; height: 42px; border-radius: 13px; border: 1.5px solid var(--border); background: var(--white); display: inline-flex; align-items: center; justify-content: center; color: var(--text-2); flex-shrink: 0; }
  .tt-back:hover { border-color: var(--line); color: var(--text); }
  .tt-panel { background: var(--white); border: 1.5px solid var(--border); border-radius: 22px; padding: 22px; }
  @media (max-width: 640px) { .tt-panel { padding: 14px; } .tt-grid { grid-template-columns: 1fr; } }
`

function CreateModal({ onClose, onCreated }) {
  const [title, setTitle] = useState('')
  const [busy, setBusy] = useState(false)
  async function submit(e) {
    e.preventDefault()
    if (!title.trim()) return
    setBusy(true)
    try {
      const { data } = await api.post('/tests/', { title: title.trim(), is_public: false, pass_percent: 60 })
      toast.success('Test yaratildi — endi savollar qo\'shing')
      onCreated(data.id)
    } catch (err) {
      toast.error(err.response?.data?.title?.[0] || err.response?.data?.detail || 'Test yaratib bo\'lmadi')
    } finally { setBusy(false) }
  }
  return (
    <div className="modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}>
      <form className="modal" onSubmit={submit}>
        <h3 style={{ fontSize: 22, marginBottom: 4 }}>Yangi test</h3>
        <p className="text-sm text-muted" style={{ marginBottom: 18 }}>
          Test avval yopiq holda yaratiladi. Savollarni qo'shib bo'lgach, sozlamalardan ommaga ochasiz.
        </p>
        <div className="field">
          <label className="label">Test nomi</label>
          <input className="input" value={title} onChange={e => setTitle(e.target.value)} autoFocus maxLength={200}
            placeholder="Masalan: Dunyo poytaxtlari — 20 savol" />
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button type="button" className="btn btn-secondary" onClick={onClose}>Bekor qilish</button>
          <button type="submit" className="btn btn-primary" disabled={busy || !title.trim()}>{busy ? 'Yaratilmoqda…' : 'Yaratish'}</button>
        </div>
      </form>
    </div>
  )
}

export default function TeacherTests() {
  const qc = useQueryClient()
  const loc = useLocation()
  const kind = loc.pathname.startsWith('/admin-panel') ? 'admin' : 'teacher'
  const [params, setParams] = useSearchParams()
  const editId = params.get('test')
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [creating, setCreating] = useState(false)
  const [toDelete, setToDelete] = useState(null)
  const [busy, setBusy] = useState(false)

  const { data: tests = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['my-standalone-tests'],
    queryFn: () => api.get('/tests/mine/').then(r => r.data.results || r.data),
  })

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ['my-standalone-tests'] })
    qc.invalidateQueries({ queryKey: ['standalone-tests'] })
  }
  const open = (id) => setParams(id ? { test: String(id) } : {})

  async function duplicate(t) {
    try {
      await api.post(`/tests/${t.id}/duplicate/`)
      toast.success('Test nusxalandi'); refresh()
    } catch { toast.error("Nusxalab bo'lmadi") }
  }
  async function togglePublic(t) {
    if (!t.is_public && !t.question_count) return toast.error("Savolsiz testni ommaga ochib bo'lmaydi")
    try {
      await api.patch(`/tests/${t.id}/`, { is_public: !t.is_public })
      toast.success(t.is_public ? 'Test yopildi' : 'Test ommaga ochildi'); refresh()
    } catch { toast.error("Holatni o'zgartirib bo'lmadi") }
  }
  async function remove() {
    setBusy(true)
    try {
      await api.delete(`/tests/${toDelete.id}/`)
      toast.success("Test o'chirildi"); setToDelete(null); refresh()
    } catch { toast.error("O'chirib bo'lmadi") }
    finally { setBusy(false) }
  }

  /* ── editor view ── */
  if (editId) {
    const current = tests.find(t => String(t.id) === editId)
    return (
      <DashLayout kind={kind}>
        <style>{css}</style>
        <div className="tt-edit-head">
          <button className="tt-back" onClick={() => open(null)} aria-label="Testlarga qaytish"><Icon name="arrowL" size={18} /></button>
          <h1>{current?.title || 'Test'}</h1>
          {current && <span className={`badge badge-${current.is_public ? 'green' : 'gray'}`}>{current.is_public ? 'Ommaga ochiq' : 'Yopiq'}</span>}
        </div>
        <div className="tt-panel">
          <TestEditor key={editId} testId={Number(editId)} standalone onChanged={refresh} />
        </div>
      </DashLayout>
    )
  }

  /* ── list view ── */
  const q = search.trim().toLowerCase()
  const shown = tests.filter(t =>
    (filter === 'all' || (filter === 'public' ? t.is_public : !t.is_public))
    && (!q || t.title.toLowerCase().includes(q) || (t.description || '').toLowerCase().includes(q)))
  const nPublic = tests.filter(t => t.is_public).length

  return (
    <DashLayout kind={kind}>
      <style>{css}</style>
      <PageHead title="Testlar" sub="«Testlar» katalogi uchun mustaqil testlar. Kurs ichidagi testlar kurs studiyasida tahrirlanadi.">
        <button className="btn btn-primary" onClick={() => setCreating(true)}><Icon name="plus" size={16} /> Yangi test</button>
      </PageHead>

      <div className="tt-bar">
        <div className="search-box">
          <Icon name="search" size={16} />
          <input className="input" value={search} onChange={e => setSearch(e.target.value)} placeholder="Test nomi bo'yicha qidirish…" />
        </div>
        <div className="seg-tabs">
          {[['all', 'Hammasi', tests.length], ['public', 'Ochiq', nPublic], ['private', 'Yopiq', tests.length - nPublic]].map(([id, label, n]) => (
            <button key={id} className={filter === id ? 'on' : ''} onClick={() => setFilter(id)}>{label}<span className="n">{n}</span></button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="loading-state"><span className="spinner" />Yuklanmoqda…</div>
      ) : isError ? (
        <div className="card"><EmptyState icon="alert" title="Testlarni yuklab bo'lmadi"
          action={<button className="btn btn-secondary btn-sm" onClick={() => refetch()}>Qayta urinish</button>} /></div>
      ) : shown.length === 0 ? (
        <div className="card">
          <EmptyState icon="fileText" title={tests.length ? 'Hech narsa topilmadi' : "Hali test yo'q"}
            sub={tests.length ? "Qidiruv yoki filtrni o'zgartirib ko'ring." : "Birinchi testingizni yarating: savollarni qo'lda kiriting yoki tayyor matndan import qiling."}
            action={!tests.length && <button className="btn btn-primary btn-sm" onClick={() => setCreating(true)}><Icon name="plus" size={13} /> Test yaratish</button>} />
        </div>
      ) : (
        <div className="tt-grid">
          {shown.map(t => (
            <div key={t.id} className="tt-card" onClick={() => open(t.id)}>
              <div className="tt-card-top">
                <span className="tt-ico">{t.category?.icon || <Icon name="fileText" size={20} />}</span>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <h3>{t.title}</h3>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 7 }}>
                    <span className={`badge badge-${t.is_public ? 'green' : 'gray'}`}>{t.is_public ? 'Ommaga ochiq' : 'Yopiq'}</span>
                    {t.category && <span className="badge badge-blue">{t.category.name}</span>}
                    {!t.question_count && <span className="badge badge-amber">Savol yo'q</span>}
                    {kind === 'admin' && t.created_by && <span className="badge badge-gray">{t.created_by.display_name}</span>}
                  </div>
                </div>
              </div>
              {t.description && <div className="tt-desc">{t.description}</div>}
              <div className="tt-meta">
                <div><b>{t.question_count}</b><span>savol</span></div>
                <div><b>{t.time_limit_minutes || '∞'}</b><span>{t.time_limit_minutes ? 'daqiqa' : 'vaqt'}</span></div>
                <div><b>{t.attempt_count}</b><span>urinish</span></div>
              </div>
              <div className="tt-foot" onClick={e => e.stopPropagation()}>
                <button className="btn btn-primary btn-sm" onClick={() => open(t.id)}><Icon name="edit" size={13} /> Tahrirlash</button>
                <span className="sp" />
                <button className="icon-btn" title={t.is_public ? 'Yopish' : 'Ommaga ochish'} onClick={() => togglePublic(t)}>
                  <Icon name={t.is_public ? 'lock' : 'globe'} size={15} />
                </button>
                {t.question_count > 0 && <Link to={`/tests/${t.id}/take`} target="_blank" className="icon-btn" title="Sinab ko'rish"><Icon name="play" size={15} /></Link>}
                <button className="icon-btn" title="Nusxalash" onClick={() => duplicate(t)}><Icon name="file" size={15} /></button>
                <button className="icon-btn danger" title="O'chirish" onClick={() => setToDelete(t)}><Icon name="trash" size={15} /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {creating && <CreateModal onClose={() => setCreating(false)} onCreated={(id) => { setCreating(false); refresh(); open(id) }} />}
      {toDelete && (
        <Confirm danger title="Testni o'chirish" confirmLabel="O'chirish" busy={busy}
          text={`«${toDelete.title}» testi ${toDelete.question_count} ta savoli${toDelete.attempt_count ? ` va ${toDelete.attempt_count} ta urinish natijasi` : ''} bilan birga o'chiriladi.`}
          onConfirm={remove} onClose={() => setToDelete(null)} />
      )}
    </DashLayout>
  )
}
