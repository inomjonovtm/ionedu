import { useRef, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import api, { absUrl } from '../../api/client'
import DashLayout from '../../components/DashLayout'
import Icon from '../../components/Icon'
import Pagination from '../../components/Pagination'
import FilterBar from '../../components/FilterBar'
import { PageHead, EmptyState } from '../../components/Dash'
import { ConfirmModal, FormModal, ErrorState, LoadingBlock, StatStrip } from '../../components/PanelKit'

const PAGE_SIZE = 12
const MAX_FILE_MB = 50

const TYPES = [
  { id: 'pdf', label: 'PDF', icon: 'fileText', tone: 'red' },
  { id: 'video', label: 'Video', icon: 'video', tone: 'violet' },
  { id: 'map', label: 'Karta', icon: 'map', tone: 'amber' },
  { id: 'doc', label: 'Hujjat', icon: 'file', tone: 'blue' },
  { id: 'link', label: 'Havola', icon: 'link', tone: 'gray' },
]
const TYPE_META = Object.fromEntries(TYPES.map(t => [t.id, t]))

const GRADES = [
  { id: 'all', label: 'Barcha sinflar' },
  { id: '5-6', label: '5–6 sinf' },
  { id: '7-8', label: '7–8 sinf' },
  { id: '9-10', label: '9–10 sinf' },
  { id: '11', label: '11-sinf (DTM)' },
]
const GRADE_LABEL = Object.fromEntries(GRADES.map(g => [g.id, g.label]))

const EMPTY_FORM = {
  title: '', description: '', resource_type: 'pdf', grade_level: 'all',
  external_url: '', file: null, category: '',
}

const css = `
  .ars-flat { padding: 0; }
  .ars-last { margin-bottom: 4px; }
  .ars-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; }
  .ars-card {
    display: flex; gap: 14px; align-items: flex-start; padding: 16px 16px 14px; min-width: 0;
    background: var(--white); border: 1.5px solid var(--border); border-radius: 20px;
    transition: border-color .15s ease, box-shadow .15s ease, transform .15s ease;
  }
  .ars-card:hover { border-color: var(--line); box-shadow: var(--hard-sm); transform: translate(-1px, -1px); }
  .ars-tile {
    width: 50px; height: 50px; flex-shrink: 0; border-radius: 15px; border: 1.5px solid var(--line);
    display: flex; align-items: center; justify-content: center; transform: rotate(-4deg);
  }
  .ars-body { flex: 1; min-width: 0; }
  .ars-kind { font-family: var(--font-mono); font-size: 10px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: var(--text-3); }
  .ars-title { font-family: var(--font-display); font-size: 16.5px; font-weight: 700; letter-spacing: -0.02em; line-height: 1.25; color: var(--text); margin-top: 3px; overflow-wrap: anywhere; }
  .ars-desc { font-size: 13px; color: var(--text-3); line-height: 1.5; margin-top: 4px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; overflow-wrap: anywhere; }
  .ars-meta { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 10px; }
  .ars-foot {
    display: flex; align-items: center; justify-content: space-between; gap: 8px; flex-wrap: wrap;
    margin-top: 12px; padding-top: 10px; border-top: 1.5px dashed var(--border);
  }
  .ars-dl { display: inline-flex; align-items: center; gap: 6px; font-family: var(--font-mono); font-size: 11px; color: var(--text-3); white-space: nowrap; }
  .ars-acts { display: inline-flex; gap: 2px; margin-left: auto; }

  .ars-two { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .ars-drop {
    display: flex; align-items: center; gap: 12px; padding: 12px 14px;
    border: 1.5px dashed var(--border); border-radius: 14px; background: var(--bg-soft);
  }
  .ars-drop .txt { flex: 1; min-width: 0; }
  .ars-drop .ico { width: 38px; height: 38px; border-radius: 12px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; }
  .ars-drop .nm { font-size: 13.5px; font-weight: 700; color: var(--text); overflow-wrap: anywhere; line-height: 1.3; }
  .ars-drop .hint { font-size: 12px; color: var(--text-3); margin-top: 2px; }
  .ars-or { display: flex; align-items: center; gap: 12px; margin: 14px 0; font-family: var(--font-mono); font-size: 10.5px; letter-spacing: 0.12em; text-transform: uppercase; color: var(--text-3); }
  .ars-or::before, .ars-or::after { content: ''; flex: 1; border-top: 1.5px dashed var(--border); }

  @media (max-width: 1180px) { .ars-grid { grid-template-columns: 1fr; } }
  @media (max-width: 520px) {
    .ars-two { grid-template-columns: 1fr; gap: 0; }
    .ars-card { padding: 14px 12px 12px; gap: 11px; }
    .ars-tile { width: 42px; height: 42px; border-radius: 13px; }
    .ars-drop { flex-wrap: wrap; }
  }
`

// The API clamps page_size to 100, so walk every page instead of asking for "200".
async function fetchAll(url) {
  const out = []
  for (let page = 1; page <= 50; page += 1) {
    const { data } = await api.get(url, { params: { page, page_size: 100 } })
    if (Array.isArray(data)) return data
    out.push(...(data.results || []))
    if (!data.next) break
  }
  return out
}

function errText(e, fallback) {
  const d = e?.response?.data
  if (d && typeof d === 'object') {
    if (d.detail) return String(d.detail)
    const first = Object.values(d).flat()[0]
    return String(first || fallback).slice(0, 200)
  }
  return fallback
}

const fileName = (path) => decodeURIComponent(String(path || '').split('?')[0].split('/').pop() || '')

export default function AdminResources() {
  const qc = useQueryClient()
  const fileRef = useRef(null)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(null)   // resource being edited, or null = create
  const [toDelete, setToDelete] = useState(null)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [gradeFilter, setGradeFilter] = useState('')
  const [form, setForm] = useState(EMPTY_FORM)

  const up = (k, v) => setForm(f => ({ ...f, [k]: v }))

  function openNew() {
    setEditing(null); setForm(EMPTY_FORM); setOpen(true)
  }
  function openEdit(r) {
    setEditing(r)
    setForm({
      title: r.title || '', description: r.description || '',
      resource_type: r.resource_type || 'pdf', grade_level: r.grade_level || 'all',
      external_url: r.external_url || '', file: null, category: r.category || '',
    })
    setOpen(true)
  }
  function closeForm() {
    setOpen(false); setEditing(null); setForm(EMPTY_FORM)
  }

  const { data: cats = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.get('/categories/').then(r => r.data.results || r.data),
  })
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin-resources'],
    queryFn: () => fetchAll('/resources/'),
  })
  const all = Array.isArray(data) ? data : []

  const counts = all.reduce((acc, r) => { acc[r.resource_type] = (acc[r.resource_type] || 0) + 1; return acc }, {})
  const downloads = all.reduce((s, r) => s + (r.download_count || 0), 0)

  const q = search.trim().toLowerCase()
  const filtered = all
    .filter(r => !typeFilter || r.resource_type === typeFilter)
    .filter(r => !gradeFilter || r.grade_level === gradeFilter)
    .filter(r => !q || (r.title || '').toLowerCase().includes(q) || (r.description || '').toLowerCase().includes(q))
  const total = filtered.length
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const cur = Math.min(page, pages)
  const list = filtered.slice((cur - 1) * PAGE_SIZE, cur * PAGE_SIZE)
  const hasFilters = !!(q || typeFilter || gradeFilter)

  function invalidate() {
    qc.invalidateQueries({ queryKey: ['admin-resources'] })
    qc.invalidateQueries({ queryKey: ['resources-all'] })
  }

  const save = useMutation({
    mutationFn: () => {
      const fd = new FormData()
      fd.append('title', form.title.trim())
      fd.append('description', form.description.trim())
      fd.append('resource_type', form.resource_type)
      fd.append('grade_level', form.grade_level)
      fd.append('external_url', form.external_url.trim())
      fd.append('category', form.category || '')
      if (form.file) {
        fd.append('file', form.file)
        fd.append('file_size_mb', (form.file.size / 1048576).toFixed(2))
      }
      const headers = { 'Content-Type': 'multipart/form-data' }
      return editing
        ? api.patch(`/resources/${editing.id}/`, fd, { headers })
        : api.post('/resources/', fd, { headers })
    },
    onSuccess: () => {
      invalidate()
      toast.success(editing ? 'Resurs saqlandi' : "Resurs qo'shildi")
      closeForm()
    },
    onError: (e) => toast.error(errText(e, 'Saqlashda xatolik yuz berdi')),
  })

  const del = useMutation({
    mutationFn: (id) => api.delete(`/resources/${id}/`),
    onSuccess: () => { invalidate(); toast.success("Resurs o'chirildi"); setToDelete(null) },
    onError: (e) => toast.error(errText(e, "Resursni o'chirib bo'lmadi")),
  })

  function pickFile(f) {
    if (!f) return
    if (f.size > MAX_FILE_MB * 1048576) {
      toast.error(`Fayl ${MAX_FILE_MB} MB dan katta`)
      return
    }
    up('file', f)
  }

  function submit() {
    const url = form.external_url.trim()
    if (!form.title.trim()) { toast.error('Resurs nomini kiriting'); return }
    if (url && !/^https?:\/\//i.test(url)) { toast.error("Havola https:// bilan boshlanishi kerak"); return }
    if (!form.file && !url && !editing?.file) { toast.error('Fayl yuklang yoki tashqi havola kiriting'); return }
    save.mutate()
  }

  const setType = (id) => { setTypeFilter(id); setPage(1) }

  return (
    <DashLayout kind="admin">
      <style>{css}</style>
      <PageHead title="Resurslar"
        sub={isLoading ? 'Yuklab olinadigan materiallar kutubxonasi' : `${all.length} ta material · jami ${downloads} marta yuklab olingan`}>
        <button className="btn btn-primary" onClick={openNew}>
          <Icon name="plus" size={15} /> Resurs qo'shish
        </button>
      </PageHead>

      {isLoading ? (
        <LoadingBlock label="Resurslar yuklanmoqda…" />
      ) : isError ? (
        <ErrorState title="Resurslarni yuklab bo'lmadi" onRetry={refetch} />
      ) : all.length === 0 ? (
        <div className="card ars-flat">
          <EmptyState icon="folder" title="Hozircha resurslar yo'q"
            sub="PDF, video, karta va boshqa materiallarni yuklang — o'quvchilar ularni Resurslar bo'limida topadi."
            action={<button className="btn btn-primary btn-sm" onClick={openNew}><Icon name="plus" size={13} /> Resurs qo'shish</button>} />
        </div>
      ) : (
        <>
          <StatStrip items={[
            { label: 'Hammasi', value: all.length, icon: 'folder', tone: 'gray', onClick: () => setType(''), active: !typeFilter },
            ...TYPES.map(t => ({
              label: t.label, value: counts[t.id] || 0, icon: t.icon, tone: t.tone,
              onClick: () => setType(typeFilter === t.id ? '' : t.id), active: typeFilter === t.id,
            })),
          ]} />

          <FilterBar search={search} onSearch={v => { setSearch(v); setPage(1) }}
            placeholder="Nomi yoki tavsifi bo'yicha qidirish…" count={total}
            onClear={hasFilters ? () => { setSearch(''); setTypeFilter(''); setGradeFilter(''); setPage(1) } : null}>
            <select className="select" value={gradeFilter} aria-label="Sinf bo'yicha filtr"
              onChange={e => { setGradeFilter(e.target.value); setPage(1) }}>
              <option value="">Sinf: hammasi</option>
              {GRADES.map(g => <option key={g.id} value={g.id}>{g.label}</option>)}
            </select>
          </FilterBar>

          {list.length === 0 ? (
            <div className="card ars-flat">
              <EmptyState small icon="search" title="Hech narsa topilmadi" sub="Filtr yoki qidiruvni o'zgartirib ko'ring." />
            </div>
          ) : (
            <div className="ars-grid">
              {list.map(r => {
                const m = TYPE_META[r.resource_type] || TYPE_META.doc
                const href = r.file ? absUrl(r.file) : r.external_url
                return (
                  <article key={r.id} className="ars-card">
                    <span className={`ars-tile tone-${m.tone}`}><Icon name={m.icon} size={21} /></span>
                    <div className="ars-body">
                      <div className="ars-kind">{m.label} · {new Date(r.created_at).toLocaleDateString('uz-UZ')}</div>
                      <div className="ars-title">{r.title}</div>
                      {r.description && <div className="ars-desc">{r.description}</div>}
                      <div className="ars-meta">
                        <span className="badge badge-gray">{GRADE_LABEL[r.grade_level] || r.grade_level}</span>
                        {r.category_name && <span className="badge badge-blue">{r.category_name}</span>}
                        {r.file && r.file_size_mb > 0 && <span className="badge badge-gray">{r.file_size_mb} MB</span>}
                        {!r.file && r.external_url && <span className="badge badge-amber">Tashqi havola</span>}
                        {!href && <span className="badge badge-red">Manba yo'q</span>}
                      </div>
                      <div className="ars-foot">
                        <span className="ars-dl"><Icon name="download" size={13} /> {r.download_count || 0} yuklab olish</span>
                        <div className="ars-acts">
                          {href && (
                            <a className="icon-btn" href={href} target="_blank" rel="noopener noreferrer"
                              title="Ochish" aria-label="Ochish"><Icon name="eye" size={15} /></a>
                          )}
                          <button className="icon-btn" title="Tahrirlash" aria-label="Tahrirlash" onClick={() => openEdit(r)}>
                            <Icon name="edit" size={15} />
                          </button>
                          <button className="icon-btn danger" title="O'chirish" aria-label="O'chirish" onClick={() => setToDelete(r)}>
                            <Icon name="trash" size={15} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          )}

          <Pagination page={cur} pageSize={PAGE_SIZE} total={total} onChange={setPage} />
        </>
      )}

      {open && (
        <FormModal wide icon={editing ? 'edit' : 'upload'}
          title={editing ? 'Resursni tahrirlash' : 'Yangi resurs'}
          sub="Fayl yuklang yoki tashqi manbaga havola bering."
          onClose={() => { if (!save.isPending) closeForm() }}
          onSubmit={submit}
          footer={(
            <>
              <button type="button" className="btn btn-secondary" onClick={closeForm} disabled={save.isPending}>Bekor qilish</button>
              <button type="submit" className="btn btn-primary" disabled={save.isPending}>
                {save.isPending ? 'Saqlanmoqda…' : (editing ? 'Saqlash' : "Qo'shish")}
              </button>
            </>
          )}>
          <div className="field">
            <label className="label" htmlFor="ars-title">Nomi *</label>
            <input id="ars-title" className="input" autoFocus maxLength={200} value={form.title}
              onChange={e => up('title', e.target.value)} placeholder="Masalan, DTM namuna testlari" />
          </div>
          <div className="field">
            <label className="label" htmlFor="ars-desc">Tavsif</label>
            <textarea id="ars-desc" className="textarea" rows={2} value={form.description}
              onChange={e => up('description', e.target.value)} placeholder="Material nima haqida — bir-ikki jumla" />
          </div>
          <div className="ars-two">
            <div className="field">
              <label className="label" htmlFor="ars-type">Turi</label>
              <select id="ars-type" className="select" value={form.resource_type} onChange={e => up('resource_type', e.target.value)}>
                {TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
              </select>
            </div>
            <div className="field">
              <label className="label" htmlFor="ars-grade">Sinf darajasi</label>
              <select id="ars-grade" className="select" value={form.grade_level} onChange={e => up('grade_level', e.target.value)}>
                {GRADES.map(g => <option key={g.id} value={g.id}>{g.id === 'all' ? 'Barchasi' : g.label}</option>)}
              </select>
            </div>
          </div>
          <div className="field">
            <label className="label" htmlFor="ars-cat">Kategoriya</label>
            <select id="ars-cat" className="select" value={form.category} onChange={e => up('category', e.target.value)}>
              <option value="">— Kategoriyasiz —</option>
              {cats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <div className="label">Fayl</div>
          <div className="ars-drop">
            <span className="ico tone-blue"><Icon name="upload" size={17} /></span>
            <div className="txt">
              <div className="nm">
                {form.file ? form.file.name : (editing?.file ? fileName(editing.file) : 'Fayl tanlanmagan')}
              </div>
              <div className="hint">
                {form.file
                  ? `${(form.file.size / 1048576).toFixed(2)} MB${editing?.file ? ' · eski fayl almashtiriladi' : ''}`
                  : (editing?.file ? 'Joriy fayl — yangisini tanlasangiz almashadi' : `PDF, DOCX, MP4, ZIP — ${MAX_FILE_MB} MB gacha`)}
              </div>
            </div>
            {form.file && (
              <button type="button" className="icon-btn" title="Tanlovni bekor qilish" aria-label="Tanlovni bekor qilish"
                onClick={() => up('file', null)}><Icon name="x" size={15} /></button>
            )}
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => fileRef.current?.click()}>
              Fayl tanlash
            </button>
            <input ref={fileRef} type="file" hidden
              onChange={e => { pickFile(e.target.files?.[0]); e.target.value = '' }} />
          </div>

          <div className="ars-or">yoki</div>

          <div className="field ars-last">
            <label className="label" htmlFor="ars-url">Tashqi havola</label>
            <input id="ars-url" className="input" type="url" inputMode="url" value={form.external_url}
              onChange={e => up('external_url', e.target.value)} placeholder="https://..." />
            <div className="field-hint">Fayl ham, havola ham bo'lsa — o'quvchiga fayl beriladi.</div>
          </div>
        </FormModal>
      )}

      <ConfirmModal open={!!toDelete} title="Resursni o'chirish"
        text={toDelete ? `"${toDelete.title}" butunlay o'chiriladi va o'quvchilar uni endi ko'ra olmaydi. Bu amalni ortga qaytarib bo'lmaydi.` : ''}
        busy={del.isPending}
        onConfirm={() => del.mutate(toDelete.id)}
        onClose={() => setToDelete(null)} />
    </DashLayout>
  )
}
