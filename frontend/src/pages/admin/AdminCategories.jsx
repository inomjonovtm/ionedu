import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import api from '../../api/client'
import DashLayout from '../../components/DashLayout'
import Icon from '../../components/Icon'
import Pagination from '../../components/Pagination'
import { PageHead, EmptyState } from '../../components/Dash'
import { ConfirmModal, FormModal, ErrorState, LoadingBlock } from '../../components/PanelKit'

const EMOJI_SUGGESTIONS = ['📘', '🌍', '🏔️', '🗺️', '🌋', '🌊', '🌾', '🌡️', '🧭', '⛰️', '🏙️', '🛰️']
const TILE_COLORS = ['green', 'blue', 'amber', 'rose', 'teal', 'violet']
const PAGE_SIZE = 12

const SORTS = [
  { id: 'name', label: 'Alifbo' },
  { id: 'courses', label: "Kurslar soni" },
]

export default function AdminCategories() {
  const qc = useQueryClient()
  const [editing, setEditing] = useState(null) // null | 'new' | category object
  const [deleting, setDeleting] = useState(null)
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState('name')
  const [page, setPage] = useState(1)

  const { data: allCats = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.get('/categories/').then(r => r.data.results || r.data),
  })

  const q = search.trim().toLowerCase()
  const filtered = allCats
    .filter(c => !q || (c.name || '').toLowerCase().includes(q))
    .sort((a, b) => sort === 'courses'
      ? (b.course_count || 0) - (a.course_count || 0) || (a.name || '').localeCompare(b.name || '')
      : (a.name || '').localeCompare(b.name || ''))
  const total = filtered.length
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const cur = Math.min(page, pages)
  const cats = filtered.slice((cur - 1) * PAGE_SIZE, cur * PAGE_SIZE)

  const courseSum = allCats.reduce((s, c) => s + (c.course_count || 0), 0)
  const testSum = allCats.reduce((s, c) => s + (c.test_count || 0), 0)
  const unused = allCats.filter(c => !c.course_count && !c.test_count)
  const maxCourses = Math.max(1, ...allCats.map(c => c.course_count || 0))
  const biggest = allCats.reduce((best, c) => ((c.course_count || 0) > (best?.course_count || 0) ? c : best), null)

  const del = useMutation({
    mutationFn: (id) => api.delete(`/categories/${id}/`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['categories'] })
      setDeleting(null)
      toast.success("Kategoriya o'chirildi")
    },
    onError: (err) => toast.error(err?.response?.data?.detail || "Kategoriyani o'chirib bo'lmadi"),
  })

  return (
    <DashLayout kind="admin">
      <style>{css}</style>
      <PageHead title="Kategoriyalar"
        sub={isLoading || isError
          ? "Kurslar va testlar uchun yo'nalishlar — katalog filtrlarida ishlatiladi."
          : `${allCats.length} ta yo'nalish — kurs va testlar katalogidagi filtrlarda ko'rinadi`}>
        <button className="btn btn-primary" onClick={() => setEditing('new')}>
          <Icon name="plus" size={15} /> Yangi kategoriya
        </button>
      </PageHead>

      {isLoading ? (
        <LoadingBlock />
      ) : isError ? (
        <ErrorState title="Kategoriyalarni yuklab bo'lmadi" onRetry={() => refetch()} />
      ) : allCats.length === 0 ? (
        <div className="card act-flat">
          <EmptyState icon="grid" title="Hozircha kategoriyalar yo'q"
            sub="Birinchi kategoriyani qo'shing — kurs va test yaratishda tanlanadi."
            action={<button className="btn btn-primary btn-sm" onClick={() => setEditing('new')}><Icon name="plus" size={13} /> Kategoriya qo'shish</button>} />
        </div>
      ) : (
        <div className="act-layout">
          <div className="act-main">
            <div className="act-bar">
              <div className="search-box act-search">
                <Icon name="search" size={15} />
                <input className="input" value={search} placeholder="Kategoriya qidirish…" aria-label="Kategoriya qidirish"
                  onChange={e => { setSearch(e.target.value); setPage(1) }} />
              </div>
              <div className="seg-tabs" role="tablist" aria-label="Saralash">
                {SORTS.map(s => (
                  <button key={s.id} type="button" className={sort === s.id ? 'on' : ''}
                    onClick={() => { setSort(s.id); setPage(1) }}>{s.label}</button>
                ))}
              </div>
            </div>

            {cats.length === 0 ? (
              <div className="card act-flat">
                <EmptyState small icon="search" title="Hech narsa topilmadi" sub={`"${search.trim()}" nomli kategoriya yo'q.`}
                  action={<button className="btn btn-secondary btn-sm" onClick={() => setSearch('')}>Qidiruvni tozalash</button>} />
              </div>
            ) : (
              <div className="act-grid">
                {cats.map(c => {
                  const empty = !c.course_count && !c.test_count
                  return (
                    <div key={c.id} className="act-card">
                      <div className="act-card-top">
                        <span className={`thumb thumb-${TILE_COLORS[c.id % TILE_COLORS.length]} act-ico`}><span>{c.icon || '📘'}</span></span>
                        <div className="act-card-tools">
                          <button className="icon-btn" onClick={() => setEditing(c)} title="Tahrirlash" aria-label={`${c.name} — tahrirlash`}><Icon name="edit" size={15} /></button>
                          <button className="icon-btn danger" onClick={() => setDeleting(c)} title="O'chirish" aria-label={`${c.name} — o'chirish`}><Icon name="trash" size={15} /></button>
                        </div>
                      </div>
                      <div className="act-name">{c.name}</div>
                      <div className="act-slug">/{c.slug}</div>
                      <div className="act-track"><i style={{ width: `${((c.course_count || 0) / maxCourses) * 100}%` }} /></div>
                      <div className="act-counts">
                        <span><b>{c.course_count || 0}</b> kurs</span>
                        <span><b>{c.test_count || 0}</b> test</span>
                        {empty && <span className="badge badge-gray">Bo'sh</span>}
                      </div>
                    </div>
                  )
                })}
                <button type="button" className="act-add" onClick={() => setEditing('new')}>
                  <span><Icon name="plus" size={20} /></span>
                  Yangi kategoriya
                </button>
              </div>
            )}
            <Pagination page={cur} pageSize={PAGE_SIZE} total={total} onChange={setPage} />
          </div>

          <aside className="act-side">
            <div className="act-legend">
              <div className="act-legend-head">
                <span className="act-mono">Xarita afsonasi</span>
                <Icon name="compass" size={16} />
              </div>
              <dl>
                <div><dt>Kategoriyalar</dt><dd>{allCats.length}</dd></div>
                <div><dt>Biriktirilgan kurslar</dt><dd>{courseSum}</dd></div>
                <div><dt>Biriktirilgan testlar</dt><dd>{testSum}</dd></div>
              </dl>
              {biggest?.course_count > 0 && (
                <div className="act-legend-top">
                  <span className="act-mono">Eng katta yo'nalish</span>
                  <b>{biggest.icon || '📘'} {biggest.name}</b>
                  <small>{biggest.course_count} ta kurs</small>
                </div>
              )}
            </div>

            {unused.length > 0 && (
              <div className="act-note">
                <b><Icon name="alert" size={14} /> {unused.length} ta bo'sh kategoriya</b>
                <p>Ularda kurs ham, test ham yo'q — katalog filtrida bo'sh natija beradi:</p>
                <div className="act-note-list">
                  {unused.slice(0, 6).map(c => (
                    <button key={c.id} type="button" className="chip" onClick={() => setEditing(c)}>{c.icon} {c.name}</button>
                  ))}
                  {unused.length > 6 && <span className="act-mono">+{unused.length - 6}</span>}
                </div>
              </div>
            )}
          </aside>
        </div>
      )}

      {editing && (
        <CategoryForm category={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); qc.invalidateQueries({ queryKey: ['categories'] }) }} />
      )}

      <ConfirmModal open={!!deleting}
        title="Kategoriyani o'chirish"
        text={deleting ? `"${deleting.name}" kategoriyasi butunlay o'chiriladi. Bu amalni ortga qaytarib bo'lmaydi.` : ''}
        confirmLabel="Ha, o'chirish" busy={del.isPending}
        onConfirm={() => del.mutate(deleting.id)} onClose={() => setDeleting(null)}>
        {deleting && (deleting.course_count > 0 || deleting.test_count > 0) && (
          <div className="act-warn">
            <Icon name="alert" size={15} />
            <span>
              <b>{deleting.course_count || 0}</b> ta kurs va <b>{deleting.test_count || 0}</b> ta test kategoriyasiz qoladi
              (o'zlari o'chirilmaydi).
            </span>
          </div>
        )}
      </ConfirmModal>
    </DashLayout>
  )
}

function CategoryForm({ category, onClose, onSaved }) {
  const [name, setName] = useState(category?.name || '')
  const [icon, setIcon] = useState(category?.icon || '📘')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function save() {
    if (!name.trim() || busy) return
    setBusy(true); setError('')
    const body = { name: name.trim(), icon: icon.trim() || '📘' }
    try {
      if (category?.id) await api.patch(`/categories/${category.id}/`, body)
      else await api.post('/categories/', body)
      toast.success(category ? 'Kategoriya yangilandi' : "Kategoriya qo'shildi")
      onSaved()
    } catch (err) {
      const d = err.response?.data
      const nameErr = Array.isArray(d?.name) ? d.name[0] : d?.name
      if (nameErr) setError(String(nameErr))
      toast.error(nameErr ? 'Nomni tekshiring' : (d?.icon?.[0] || d?.detail || 'Saqlashda xatolik'))
    } finally { setBusy(false) }
  }

  return (
    <FormModal title={category ? 'Kategoriyani tahrirlash' : 'Yangi kategoriya'} icon="grid"
      sub="Nom va belgi katalog filtrlarida ko'rinadi."
      onClose={() => { if (!busy) onClose() }} onSubmit={save}
      footer={(
        <>
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={busy}>Bekor qilish</button>
          <button type="submit" className="btn btn-primary" disabled={busy || !name.trim()}>
            {busy ? 'Saqlanmoqda…' : 'Saqlash'}
          </button>
        </>
      )}>
      <div className="act-preview">
        <span className="thumb thumb-amber act-ico"><span>{icon.trim() || '📘'}</span></span>
        <div>
          <div className="act-name">{name.trim() || 'Kategoriya nomi'}</div>
          <div className="act-mono">Ko'rinishi</div>
        </div>
      </div>
      <div className="field">
        <label className="label" htmlFor="act-name">Nomi *</label>
        <input id="act-name" className="input" autoFocus value={name} maxLength={80}
          onChange={e => { setName(e.target.value); setError('') }}
          placeholder="Masalan, Tabiiy geografiya" required />
        {error && <div className="field-error">{error}</div>}
      </div>
      <div className="field">
        <label className="label" htmlFor="act-icon">Belgi (emoji)</label>
        <div className="act-emojis">
          {EMOJI_SUGGESTIONS.map(e => (
            <button key={e} type="button" className={icon === e ? 'on' : ''} onClick={() => setIcon(e)} aria-pressed={icon === e}>{e}</button>
          ))}
        </div>
        <div className="act-custom">
          <input id="act-icon" className="input" value={icon} onChange={e => setIcon(e.target.value)} maxLength={8}
            aria-label="Boshqa emoji" />
          <span className="field-hint">yoki o'zingiz boshqa emoji kiriting</span>
        </div>
      </div>
    </FormModal>
  )
}

const css = `
  .act-flat { padding: 0; }
  .act-mono { font-family: var(--font-mono); font-size: 10px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: var(--text-3); }

  .act-layout { display: grid; grid-template-columns: minmax(0, 1fr) 290px; gap: 22px; align-items: start; }
  .act-main { min-width: 0; }
  .act-bar { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; margin-bottom: 16px; }
  .act-search { flex: 1 1 220px; max-width: 340px; }
  .act-search .input { width: 100%; }

  .act-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(210px, 1fr)); gap: 14px; }
  .act-card {
    background: var(--white); border: 1.5px solid var(--border); border-radius: var(--r-card); padding: 14px 16px 16px;
    display: flex; flex-direction: column; min-width: 0;
    transition: border-color .15s ease, box-shadow .15s ease, transform .15s ease;
  }
  .act-card:hover { border-color: var(--line); box-shadow: var(--hard); transform: translate(-2px, -2px); }
  .act-card-top { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 14px; }
  .act-card-tools { display: flex; gap: 2px; margin: -4px -6px 0 0; }
  .act-ico {
    width: 54px; height: 54px; aspect-ratio: auto; flex-shrink: 0; border-radius: 16px; font-size: 26px;
    border: 1.5px solid var(--line); transform: rotate(-4deg);
  }
  .act-name { font-family: var(--font-display); font-size: 17px; font-weight: 700; letter-spacing: -0.025em; line-height: 1.2; color: var(--text); overflow-wrap: anywhere; }
  .act-slug { font-family: var(--font-mono); font-size: 11px; color: var(--text-4); margin-top: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .act-track { height: 6px; border-radius: 999px; background: var(--bg-soft); overflow: hidden; margin: 14px 0 10px; }
  .act-track i { display: block; height: 100%; border-radius: 999px; background: var(--line); }
  .act-counts { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; margin-top: auto; font-family: var(--font-mono); font-size: 11px; letter-spacing: 0.05em; text-transform: uppercase; color: var(--text-3); }
  .act-counts b { font-weight: 600; color: var(--text); }
  .act-counts .badge { margin-left: auto; font-family: var(--font-body); text-transform: none; letter-spacing: 0; }

  .act-add {
    min-height: 150px; border: 1.5px dashed var(--border); border-radius: var(--r-card); background: transparent;
    display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px;
    font-size: 13.5px; font-weight: 700; color: var(--text-3); transition: border-color .15s ease, color .15s ease, background .15s ease;
  }
  .act-add span { width: 42px; height: 42px; border-radius: 13px; background: var(--bg-soft); display: flex; align-items: center; justify-content: center; }
  .act-add:hover { border-color: var(--line); color: var(--text); background: var(--white); }
  .act-add:hover span { background: var(--sun); color: #14213D; }

  .act-side { position: sticky; top: 20px; display: flex; flex-direction: column; gap: 14px; }
  .act-legend { background: var(--ink); color: #B7C0D8; border-radius: var(--r-card); padding: 20px; position: relative; overflow: hidden; }
  html[data-theme="dark"] .act-legend { border: 1.5px solid var(--border); }
  .act-legend-head { display: flex; align-items: center; justify-content: space-between; color: var(--sun); margin-bottom: 14px; }
  .act-legend .act-mono { color: var(--sun); }
  .act-legend dl > div { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; padding: 10px 0; border-bottom: 1.5px dashed rgba(255,255,255,.16); }
  .act-legend dl > div:last-child { border-bottom: none; }
  .act-legend dt { font-size: 13px; font-weight: 600; }
  .act-legend dd { font-family: var(--font-display); font-size: 24px; font-weight: 800; letter-spacing: -0.04em; color: #fff; line-height: 1; }
  .act-legend-top { margin-top: 8px; padding: 13px 14px; border-radius: 15px; background: rgba(255,255,255,.08); display: flex; flex-direction: column; gap: 4px; }
  .act-legend-top .act-mono { color: #B7C0D8; }
  .act-legend-top b { font-size: 15px; color: #fff; overflow-wrap: anywhere; }
  .act-legend-top small { font-size: 12px; }

  .act-note { background: var(--white); border: 1.5px solid var(--border); border-radius: var(--r-card); padding: 16px 18px; }
  .act-note > b { display: flex; align-items: center; gap: 7px; font-size: 13.5px; color: var(--text); }
  .act-note > b svg { color: var(--amber-600); }
  .act-note p { font-size: 12.5px; color: var(--text-3); margin: 6px 0 11px; line-height: 1.5; }
  .act-note-list { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; }
  .act-note-list .chip { height: 30px; padding: 0 11px; font-size: 12.5px; max-width: 100%; overflow: hidden; text-overflow: ellipsis; }

  .act-warn {
    display: flex; gap: 10px; align-items: flex-start; font-size: 13px; line-height: 1.5; color: var(--text-2);
    background: var(--sun-soft); border: 1.5px dashed var(--amber-600); border-radius: 14px; padding: 11px 13px;
  }
  .act-warn svg { flex-shrink: 0; margin-top: 2px; color: var(--amber-600); }

  /* form */
  .act-preview { display: flex; align-items: center; gap: 14px; padding: 12px 14px; margin-bottom: 18px; border: 1.5px dashed var(--border); border-radius: 16px; background: var(--paper); }
  .act-preview .act-name { margin-bottom: 4px; }
  .act-emojis { display: grid; grid-template-columns: repeat(6, 1fr); gap: 8px; }
  .act-emojis button {
    height: 46px; border-radius: 13px; font-size: 22px; background: var(--white); border: 1.5px solid var(--border);
    transition: border-color .13s ease, background .13s ease, transform .13s ease, box-shadow .13s ease;
  }
  .act-emojis button:hover { border-color: var(--line); }
  .act-emojis button.on { background: var(--sun); border-color: var(--line); box-shadow: var(--hard-sm); transform: translate(-1px, -1px); }
  .act-custom { display: flex; align-items: center; gap: 12px; margin-top: 10px; }
  .act-custom .input { width: 84px; text-align: center; font-size: 19px; flex-shrink: 0; }
  .act-custom .field-hint { margin-top: 0; }

  @media (max-width: 1100px) {
    .act-layout { grid-template-columns: minmax(0, 1fr); }
    .act-side { position: static; }
  }
  @media (max-width: 560px) {
    .act-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
    .act-card { padding: 12px; }
    .act-ico { width: 46px; height: 46px; font-size: 22px; }
    .act-name { font-size: 15px; }
    .act-search { max-width: none; }
    .act-add { min-height: 110px; }
  }
`
