import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useQueries, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import api, { absUrl } from '../../api/client'
import DashLayout from '../../components/DashLayout'
import Icon from '../../components/Icon'
import Pagination from '../../components/Pagination'
import FilterBar from '../../components/FilterBar'
import { PageHead, EmptyState } from '../../components/Dash'
import { ConfirmModal, FormModal, ErrorState, LoadingBlock, StatStrip } from '../../components/PanelKit'

const PAGE_SIZE = 12

const TABS = [
  { id: 'pending', label: 'Moderatsiyada', icon: 'clock', tone: 'amber' },
  { id: 'published', label: 'Nashrda', icon: 'checkC', tone: 'green' },
  { id: 'rejected', label: 'Rad etilgan', icon: 'x', tone: 'red' },
  { id: 'draft', label: 'Qoralama', icon: 'pen', tone: 'gray' },
]

const EMPTY_TEXT = {
  pending: ["Navbat bo'sh", "Yangi kurs moderatsiyaga yuborilganda shu yerda ko'rinadi."],
  published: ["Nashr etilgan kurslar yo'q", "Tasdiqlangan kurslar katalogda va shu yerda ko'rinadi."],
  rejected: ["Rad etilgan kurslar yo'q", "Rad etilgan kurslar muallif tuzatguncha shu yerda turadi."],
  draft: ["Qoralamalar yo'q", "O'qituvchilar hali yubormagan kurslar shu yerda ko'rinadi."],
}

const LEVELS = { beginner: "Boshlang'ich", intermediate: "O'rta", advanced: 'Yuqori' }

const errText = (err, fallback) => err?.response?.data?.detail || fallback
const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('uz-UZ') : '—')

export default function AdminCourses() {
  const qc = useQueryClient()
  const [tab, setTab] = useState('pending')
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [debounced, setDebounced] = useState('')
  const [rejecting, setRejecting] = useState(null)   // course being rejected
  const [rejectNote, setRejectNote] = useState('')
  const [approving, setApproving] = useState(null)   // course awaiting publish confirmation
  const [deleting, setDeleting] = useState(null)     // course awaiting delete confirmation

  useEffect(() => {
    const t = setTimeout(() => { setDebounced(search.trim()); setPage(1) }, 350)
    return () => clearTimeout(t)
  }, [search])

  const params = new URLSearchParams({
    status: tab, page: String(page), page_size: String(PAGE_SIZE), ordering: '-created_at',
  })
  if (debounced) params.set('search', debounced)

  const { data, isLoading, isError, isFetching, refetch } = useQuery({
    queryKey: ['admin-courses', tab, params.toString()],
    queryFn: () => api.get(`/courses/?${params.toString()}`).then(r => r.data),
    placeholderData: keepPreviousData,
  })
  const courses = data?.results || (Array.isArray(data) ? data : [])
  const total = data?.count ?? courses.length

  // Per-status totals for the strip (count only — one row per request).
  const countQs = useQueries({
    queries: TABS.map(t => ({
      queryKey: ['admin-courses', 'count', t.id],
      queryFn: () => api.get(`/courses/?status=${t.id}&page_size=1`).then(r => r.data?.count ?? 0),
    })),
  })

  // The item leaves the current list after approve / reject / delete —
  // step back a page when it was the last row, otherwise the API answers 404.
  function afterRemove() {
    if (courses.length <= 1 && page > 1) setPage(page - 1)
    qc.invalidateQueries()
  }

  const approve = useMutation({
    mutationFn: (slug) => api.post(`/admin/courses/${slug}/approve/`),
    onSuccess: () => { afterRemove(); setApproving(null); toast.success('Kurs tasdiqlandi va nashr etildi') },
    onError: (err) => toast.error(errText(err, 'Tasdiqlashda xatolik')),
  })
  const reject = useMutation({
    mutationFn: ({ slug, note }) => api.post(`/admin/courses/${slug}/reject/`, { note }),
    onSuccess: () => {
      afterRemove()
      toast.success('Kurs rad etildi — muallifga xabar yuborildi')
      setRejecting(null); setRejectNote('')
    },
    onError: (err) => toast.error(errText(err, 'Rad etishda xatolik')),
  })
  const del = useMutation({
    mutationFn: (slug) => api.delete(`/courses/${slug}/`),
    onSuccess: () => { afterRemove(); setDeleting(null); toast.success("Kurs o'chirildi") },
    onError: (err) => toast.error(errText(err, "O'chirib bo'lmadi")),
  })

  function switchTab(id) { setTab(id); setPage(1) }
  function clearSearch() { setSearch(''); setDebounced(''); setPage(1) }

  const pendingCount = countQs[0]?.data
  const [emptyTitle, emptySub] = EMPTY_TEXT[tab]

  return (
    <DashLayout kind="admin">
      <style>{css}</style>
      <PageHead title="Kurslar"
        sub={pendingCount > 0
          ? `${pendingCount} ta kurs moderatsiyani kutmoqda — ko'rib chiqing va qaror qiling`
          : "Kurslarni ko'rib chiqing, tasdiqlang yoki o'zingiz yarating"}>
        <Link to="/admin-panel/courses/new" className="btn btn-primary">
          <Icon name="plus" size={15} /> Yangi kurs
        </Link>
      </PageHead>

      <StatStrip items={TABS.map((t, i) => ({
        label: t.label, icon: t.icon, tone: t.tone,
        value: countQs[i]?.data ?? '—',
        active: tab === t.id,
        onClick: () => switchTab(t.id),
      }))} />

      <FilterBar search={search} onSearch={setSearch} placeholder="Kurs nomi yoki muallif bo'yicha…"
        count={isLoading ? null : total} onClear={search ? clearSearch : null} />

      {isLoading ? (
        <LoadingBlock />
      ) : isError ? (
        <ErrorState title="Kurslarni yuklab bo'lmadi" onRetry={() => refetch()} />
      ) : courses.length === 0 ? (
        <div className="card acr-empty">
          {debounced
            ? <EmptyState icon="search" title="Hech narsa topilmadi" sub={`"${debounced}" bo'yicha bu bo'limda kurs yo'q.`}
                action={<button className="btn btn-secondary btn-sm" onClick={clearSearch}>Qidiruvni tozalash</button>} />
            : <EmptyState icon={tab === 'pending' ? 'checkC' : 'book'} title={emptyTitle} sub={emptySub} />}
        </div>
      ) : (
        <div className={`acr-list ${isFetching ? 'busy' : ''}`}>
          {courses.map(c => (
            <article key={c.id} className={`acr-row ${tab === 'pending' ? 'pending' : ''}`}>
              <Link to={`/courses/${c.slug}`} className={`thumb thumb-${c.thumb_color || 'slate'} acr-thumb`} title="Kursni ko'rish">
                {c.thumbnail ? <img src={absUrl(c.thumbnail)} alt="" /> : c.thumb_emoji}
              </Link>

              <div className="acr-main">
                <Link to={`/courses/${c.slug}`} className="acr-title">{c.title}</Link>
                <div className="acr-meta">
                  <span><Icon name="user" size={13} /> {c.teacher?.display_name || "Muallif yo'q"}</span>
                  {c.category?.name && <span><Icon name="grid" size={13} /> {c.category.name}</span>}
                  {LEVELS[c.level] && <span><Icon name="target" size={13} /> {LEVELS[c.level]}</span>}
                </div>
                <div className="acr-facts">
                  <span><b>{c.lessons_count ?? 0}</b> dars</span>
                  <span><b>{c.students_count ?? 0}</b> o'quvchi</span>
                  {c.rating_count > 0 && <span><b>{Number(c.rating_avg || 0).toFixed(1)}</b> reyting</span>}
                  <span>{fmtDate(c.created_at)}</span>
                </div>
                {tab === 'pending' && (c.lessons_count ?? 0) === 0 && (
                  <div className="acr-warn"><Icon name="alert" size={13} /> Kursda hali birorta dars yo'q</div>
                )}
              </div>

              <div className="acr-side">
                {(tab === 'pending' || tab === 'rejected') && (
                  <div className="acr-decide">
                    <button className="btn btn-accent btn-sm" onClick={() => setApproving(c)}>
                      <Icon name="check" size={14} /> Tasdiqlash
                    </button>
                    {tab === 'pending' && (
                      <button className="btn btn-danger btn-sm" onClick={() => { setRejecting(c); setRejectNote('') }}>
                        <Icon name="x" size={14} /> Rad etish
                      </button>
                    )}
                  </div>
                )}
                <div className="acr-tools">
                  <Link to={`/admin-panel/courses/${c.slug}/stats`} className="icon-btn" title="Statistika" aria-label="Statistika"><Icon name="chart" size={16} /></Link>
                  <Link to={`/courses/${c.slug}`} className="icon-btn" title="Ko'rish" aria-label="Ko'rish"><Icon name="eye" size={16} /></Link>
                  <Link to={`/admin-panel/courses/${c.slug}/edit`} className="icon-btn" title="Tahrirlash" aria-label="Tahrirlash"><Icon name="edit" size={16} /></Link>
                  <button className="icon-btn danger" title="O'chirish" aria-label="O'chirish" onClick={() => setDeleting(c)}>
                    <Icon name="trash" size={16} />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {!isError && <Pagination page={page} pageSize={PAGE_SIZE} total={total} onChange={setPage} />}

      <ConfirmModal open={!!approving} tone="sun" icon="checkC"
        title="Kursni nashr etish"
        text={approving ? `"${approving.title}" katalogda barcha o'quvchilarga ochiladi va muallifga bildirishnoma yuboriladi.` : ''}
        confirmLabel="Tasdiqlash va nashr etish" busy={approve.isPending}
        onConfirm={() => approve.mutate(approving.slug)} onClose={() => setApproving(null)} />

      <ConfirmModal open={!!deleting}
        title="Kursni butunlay o'chirish"
        text={deleting ? `"${deleting.title}" barcha bo'lim va darslari bilan o'chiriladi. Bu amalni ortga qaytarib bo'lmaydi.` : ''}
        confirmLabel="Ha, o'chirish" busy={del.isPending}
        onConfirm={() => del.mutate(deleting.slug)} onClose={() => setDeleting(null)}>
        {deleting?.students_count > 0 && (
          <div className="acr-danger-note">
            <Icon name="alert" size={15} />
            <span>Bu kursga <b>{deleting.students_count}</b> ta o'quvchi yozilgan — ularning natijalari ham yo'qoladi.</span>
          </div>
        )}
      </ConfirmModal>

      {rejecting && (
        <FormModal title="Kursni rad etish" icon="x" tone="danger"
          sub={`"${rejecting.title}" — sabab muallifga yuboriladi.`}
          onClose={() => { if (!reject.isPending) setRejecting(null) }}
          onSubmit={() => { if (rejectNote.trim()) reject.mutate({ slug: rejecting.slug, note: rejectNote.trim() }) }}
          footer={(
            <>
              <button type="button" className="btn btn-secondary" disabled={reject.isPending} onClick={() => setRejecting(null)}>Bekor qilish</button>
              <button type="submit" className="btn btn-danger" disabled={!rejectNote.trim() || reject.isPending}>
                {reject.isPending ? 'Yuborilmoqda…' : 'Rad etish'}
              </button>
            </>
          )}>
          <div className="field">
            <label className="label" htmlFor="acr-note">Rad etish sababi *</label>
            <textarea id="acr-note" className="textarea" rows={4} autoFocus value={rejectNote} maxLength={1000}
              onChange={e => setRejectNote(e.target.value)}
              placeholder="Masalan: videolar sifati past, tavsif yetarli emas…" />
            <div className="field-hint">Muallif kursni tuzatib, qayta yuborishi mumkin.</div>
          </div>
        </FormModal>
      )}
    </DashLayout>
  )
}

const css = `
  .acr-empty { padding: 0; }
  .acr-list { display: flex; flex-direction: column; gap: 12px; transition: opacity .15s ease; }
  .acr-list.busy { opacity: .6; }

  .acr-row {
    display: grid; grid-template-columns: 132px minmax(0, 1fr) auto; gap: 18px; align-items: center;
    background: var(--white); border: 1.5px solid var(--border); border-radius: var(--r-card); padding: 12px 18px 12px 12px;
    transition: border-color .15s ease, box-shadow .15s ease, transform .15s ease;
  }
  .acr-row:hover { border-color: var(--line); box-shadow: var(--hard-sm); transform: translate(-1px, -1px); }
  .acr-row.pending { border-left: 6px solid var(--sun); }

  .acr-thumb { width: 132px; aspect-ratio: 16 / 10; font-size: 38px; border-radius: 14px; }
  .acr-thumb img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; z-index: 2; }

  .acr-main { min-width: 0; display: flex; flex-direction: column; gap: 7px; }
  .acr-title {
    font-family: var(--font-display); font-size: 17.5px; font-weight: 700; letter-spacing: -0.025em; line-height: 1.25;
    color: var(--text); overflow-wrap: anywhere;
  }
  .acr-title:hover { text-decoration: underline; text-underline-offset: 3px; }
  .acr-meta { display: flex; flex-wrap: wrap; gap: 4px 14px; font-size: 13px; font-weight: 600; color: var(--text-2); }
  .acr-meta span { display: inline-flex; align-items: center; gap: 5px; min-width: 0; }
  .acr-meta svg { color: var(--text-4); flex-shrink: 0; }
  .acr-facts { display: flex; flex-wrap: wrap; gap: 4px 14px; font-family: var(--font-mono); font-size: 11px; letter-spacing: 0.04em; text-transform: uppercase; color: var(--text-3); }
  .acr-facts b { color: var(--text); font-weight: 600; }
  .acr-warn {
    align-self: flex-start; display: inline-flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 700;
    background: var(--coral-soft); color: var(--red-600); border-radius: 8px; padding: 3px 9px;
  }

  .acr-side { display: flex; flex-direction: column; align-items: flex-end; gap: 10px; }
  .acr-decide { display: flex; gap: 8px; }
  .acr-tools { display: flex; gap: 2px; }

  .acr-danger-note {
    display: flex; gap: 10px; align-items: flex-start; font-size: 13px; line-height: 1.5; color: var(--red-600);
    background: var(--red-50); border: 1.5px dashed var(--red-600); border-radius: 14px; padding: 11px 13px;
  }
  .acr-danger-note svg { flex-shrink: 0; margin-top: 2px; }

  @media (max-width: 900px) {
    .acr-row { grid-template-columns: 96px minmax(0, 1fr); gap: 12px 14px; padding: 12px; align-items: start; }
    .acr-thumb { width: 96px; font-size: 28px; }
    .acr-side {
      grid-column: 1 / -1; flex-direction: row; align-items: center; justify-content: space-between; flex-wrap: wrap;
      padding-top: 10px; border-top: 1.5px dashed var(--border);
    }
    .acr-tools { margin-left: auto; }
  }
  @media (max-width: 480px) {
    .acr-row { grid-template-columns: 72px minmax(0, 1fr); }
    .acr-thumb { width: 72px; font-size: 22px; border-radius: 12px; }
    .acr-title { font-size: 15.5px; }
    .acr-decide { width: 100%; }
    .acr-decide .btn { flex: 1; }
  }
`
