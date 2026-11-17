import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import api from '../../api/client'
import DashLayout from '../../components/DashLayout'
import Icon from '../../components/Icon'
import Pagination from '../../components/Pagination'
import { PageHead, EmptyState, CourseStatus } from '../../components/Dash'
import { ConfirmModal, ErrorState, LoadingBlock, StatStrip } from '../../components/PanelKit'

const PAGE_SIZE = 12

const TABS = [
  { id: 'all', label: 'Barchasi', icon: 'book', tone: 'gray' },
  { id: 'published', label: 'Nashrda', icon: 'globe', tone: 'green' },
  { id: 'pending', label: 'Moderatsiyada', icon: 'clock', tone: 'amber' },
  { id: 'draft', label: 'Qoralama', icon: 'pen', tone: 'blue' },
  { id: 'rejected', label: 'Rad etilgan', icon: 'alert', tone: 'red' },
]

const SORTS = [
  { id: 'new', label: 'Avval yangilari' },
  { id: 'students', label: "O'quvchilar soni" },
  { id: 'rating', label: 'Reyting' },
  { id: 'title', label: 'Nomi (A–Z)' },
]

const css = `
  .tcr-flat { padding: 0; }
  .tcr-min { min-width: 0; }
  .tcr-bar { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; margin-bottom: 18px; }
  .tcr-bar .search-box { flex: 1 1 260px; }
  .tcr-bar .search-box .input { width: 100%; }
  .tcr-bar .select { width: auto; flex: 0 1 210px; height: 42px; }
  .tcr-count { font-family: var(--font-mono); font-size: 11px; text-transform: uppercase; letter-spacing: .08em; color: var(--text-3); margin-left: auto; white-space: nowrap; }
  .tcr-count b { color: var(--text); }

  .tcr-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(360px, 1fr)); gap: 16px; }
  .tcr-card {
    display: flex; flex-direction: column; background: var(--white); border: 1.5px solid var(--border);
    border-radius: var(--r-card); overflow: hidden; transition: border-color .16s ease, box-shadow .16s ease, transform .16s ease;
  }
  .tcr-card:hover { border-color: var(--line); box-shadow: var(--hard); transform: translate(-2px, -2px); }
  .tcr-main { display: grid; grid-template-columns: 96px minmax(0, 1fr); gap: 16px; padding: 16px 18px 14px; align-items: start; color: inherit; }
  .tcr-main .thumb { width: 96px; height: 74px; aspect-ratio: auto; font-size: 34px; border-radius: 14px; }
  .tcr-title { font-family: var(--font-display); font-weight: 700; font-size: 17px; letter-spacing: -0.025em; line-height: 1.22; color: var(--text); display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; overflow-wrap: anywhere; }
  .tcr-top { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-bottom: 7px; }
  .tcr-top .coord { margin-left: auto; }
  .tcr-facts { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); border-top: 1.5px dashed var(--border); }
  .tcr-fact { padding: 11px 18px; border-left: 1.5px dashed var(--border); min-width: 0; }
  .tcr-fact:first-child { border-left: none; }
  .tcr-fact b { display: flex; align-items: center; gap: 6px; font-family: var(--font-display); font-size: 18px; font-weight: 800; letter-spacing: -0.03em; line-height: 1; color: var(--text); }
  .tcr-fact b svg { color: #F5A300; }
  .tcr-fact span { display: block; font-family: var(--font-mono); font-size: 9.5px; text-transform: uppercase; letter-spacing: .09em; color: var(--text-3); margin-top: 5px; }
  .tcr-foot { display: flex; align-items: center; gap: 4px; padding: 9px 12px; border-top: 1.5px dashed var(--border); background: var(--paper); margin-top: auto; }
  .tcr-foot .btn { margin-right: auto; }
  .tcr-note { margin: 0 18px 14px; padding: 9px 12px; border-radius: 12px; font-size: 12.5px; line-height: 1.45; font-weight: 600; display: flex; gap: 8px; align-items: flex-start; }
  .tcr-note svg { flex-shrink: 0; margin-top: 2px; }
  .tcr-note.red { background: var(--red-50); color: var(--red-600); }
  .tcr-note.amber { background: var(--amber-50); color: var(--amber-600); }
  .tcr-warn { display: flex; gap: 10px; align-items: flex-start; padding: 12px 14px; border-radius: 14px; background: var(--amber-50); color: var(--amber-600); font-size: 13px; font-weight: 600; line-height: 1.5; }
  .tcr-warn svg { flex-shrink: 0; margin-top: 2px; }

  @media (max-width: 860px) { .tcr-grid { grid-template-columns: 1fr; } }
  @media (max-width: 520px) {
    .tcr-main { grid-template-columns: 68px minmax(0, 1fr); gap: 12px; padding: 14px; }
    .tcr-main .thumb { width: 68px; height: 56px; font-size: 26px; }
    .tcr-top .coord { display: none; }
    .tcr-fact { padding: 10px 12px; }
    .tcr-bar .select { flex: 1 1 100%; }
    .tcr-count { margin-left: 0; }
  }
`

function fmtDate(v) {
  const d = new Date(v)
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString('uz-UZ')
}

export default function TeacherCourses() {
  const qc = useQueryClient()
  const [page, setPage] = useState(1)
  const [tab, setTab] = useState('all')
  const [q, setQ] = useState('')
  const [sort, setSort] = useState('new')
  const [target, setTarget] = useState(null)

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['my-teaching'],
    queryFn: () => api.get('/courses/?mine=1&page_size=100').then(r => r.data.results || r.data),
  })
  const allCourses = useMemo(() => (Array.isArray(data) ? data : []), [data])

  const counts = useMemo(() => {
    const c = { all: allCourses.length }
    for (const t of TABS.slice(1)) c[t.id] = allCourses.filter(x => x.status === t.id).length
    return c
  }, [allCourses])

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase()
    const list = allCourses
      .filter(c => tab === 'all' || c.status === tab)
      .filter(c => !needle || (c.title || '').toLowerCase().includes(needle))
    const sorted = [...list]
    if (sort === 'students') sorted.sort((a, b) => (b.students_count || 0) - (a.students_count || 0))
    else if (sort === 'rating') sorted.sort((a, b) => (b.rating_avg || 0) - (a.rating_avg || 0))
    else if (sort === 'title') sorted.sort((a, b) => (a.title || '').localeCompare(b.title || '', 'uz'))
    else sorted.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    return sorted
  }, [allCourses, tab, q, sort])

  const total = filtered.length
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const cur = Math.min(page, pages)
  const courses = filtered.slice((cur - 1) * PAGE_SIZE, cur * PAGE_SIZE)

  const del = useMutation({
    mutationFn: (slug) => api.delete(`/courses/${slug}/`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-teaching'] })
      qc.invalidateQueries({ queryKey: ['teacher-students'] })
      qc.invalidateQueries({ queryKey: ['teacher-reviews'] })
      toast.success("Kurs o'chirildi")
      setTarget(null)
    },
    onError: (err) => toast.error(err.response?.data?.detail || "Kursni o'chirib bo'lmadi"),
  })

  function switchTab(id) { setTab(id); setPage(1) }
  const filtering = Boolean(q.trim()) || tab !== 'all'

  return (
    <DashLayout kind="teacher">
      <style>{css}</style>
      <PageHead title="Mening kurslarim"
        sub={isLoading || isError ? "Kurslaringizni yarating, tahrirlang va moderatsiyaga yuboring" : `Jami ${allCourses.length} ta kurs · ${counts.published || 0} tasi nashrda`}>
        <Link to="/teacher/courses/new" className="btn btn-primary"><Icon name="plus" size={15} /> Yangi kurs</Link>
      </PageHead>

      {isLoading ? (
        <LoadingBlock />
      ) : isError ? (
        <ErrorState title="Kurslarni yuklab bo'lmadi" onRetry={() => refetch()} />
      ) : allCourses.length === 0 ? (
        <div className="card tcr-flat">
          <EmptyState icon="book" title="Hozircha kurslar yo'q"
            sub="Birinchi kursingizni yarating — video darslar, testlar va materiallar qo'shing."
            action={<Link to="/teacher/courses/new" className="btn btn-primary btn-sm"><Icon name="plus" size={13} /> Kurs yaratish</Link>} />
        </div>
      ) : (
        <>
          <StatStrip items={TABS.map(t => ({
            label: t.label, value: counts[t.id] || 0, icon: t.icon, tone: t.tone,
            active: tab === t.id, onClick: () => switchTab(t.id),
          }))} />

          <div className="tcr-bar">
            <div className="search-box">
              <Icon name="search" size={15} />
              <input className="input" placeholder="Kurs nomi bo'yicha qidirish…" value={q} aria-label="Kurs qidirish"
                onChange={e => { setQ(e.target.value); setPage(1) }} />
            </div>
            <select className="select" value={sort} aria-label="Saralash"
              onChange={e => { setSort(e.target.value); setPage(1) }}>
              {SORTS.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
            {filtering && (
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setQ(''); switchTab('all') }}>
                <Icon name="x" size={13} /> Tozalash
              </button>
            )}
            <span className="tcr-count">Topildi: <b>{total}</b></span>
          </div>

          {courses.length === 0 ? (
            <div className="card tcr-flat">
              <EmptyState icon="search" title="Hech narsa topilmadi"
                sub="Filtr yoki qidiruv so'zini o'zgartirib ko'ring."
                action={<button type="button" className="btn btn-secondary btn-sm" onClick={() => { setQ(''); switchTab('all') }}>Filtrni tozalash</button>} />
            </div>
          ) : (
            <div className="tcr-grid">
              {courses.map(c => (
                <article key={c.id} className="tcr-card">
                  <Link to={`/teacher/courses/${c.slug}/edit`} className="tcr-main">
                    <div className={`thumb thumb-${c.thumb_color || 'slate'}`}>{c.thumb_emoji}</div>
                    <div className="tcr-min">
                      <div className="tcr-top">
                        <CourseStatus status={c.status} />
                        <span className="coord">{fmtDate(c.created_at)}</span>
                      </div>
                      <div className="tcr-title">{c.title}</div>
                    </div>
                  </Link>
                  {c.status === 'rejected' && (
                    <div className="tcr-note red"><Icon name="alert" size={14} /> Moderator kursni rad etdi. Izohni ko'rish va tuzatish uchun kursni oching.</div>
                  )}
                  {c.status === 'draft' && (
                    <div className="tcr-note amber"><Icon name="pen" size={14} /> Qoralama — o'quvchilarga ko'rinmaydi. Tayyor bo'lgach moderatsiyaga yuboring.</div>
                  )}
                  <div className="tcr-facts">
                    <div className="tcr-fact"><b>{c.lessons_count || 0}</b><span>Dars</span></div>
                    <div className="tcr-fact"><b>{c.students_count || 0}</b><span>O'quvchi</span></div>
                    <div className="tcr-fact">
                      <b>{c.rating_count > 0 ? <><Icon name="starF" size={14} /> {Number(c.rating_avg || 0).toFixed(1)}</> : '—'}</b>
                      <span>{c.rating_count > 0 ? `${c.rating_count} sharh` : 'Reyting'}</span>
                    </div>
                  </div>
                  <div className="tcr-foot">
                    <Link to={`/teacher/courses/${c.slug}/edit`} className="btn btn-secondary btn-sm"><Icon name="edit" size={13} /> Tahrirlash</Link>
                    <Link to={`/teacher/courses/${c.slug}/stats`} className="icon-btn" title="Statistika" aria-label="Statistika"><Icon name="chart" size={15} /></Link>
                    <Link to={`/courses/${c.slug}`} className="icon-btn" title="Saytda ko'rish" aria-label="Saytda ko'rish"><Icon name="eye" size={15} /></Link>
                    <button type="button" className="icon-btn danger" title="O'chirish" aria-label="O'chirish" onClick={() => setTarget(c)}>
                      <Icon name="trash" size={15} />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
          <Pagination page={cur} pageSize={PAGE_SIZE} total={total} onChange={setPage} />
        </>
      )}

      <ConfirmModal
        open={!!target}
        title="Kursni o'chirish"
        text={target ? `"${target.title}" kursi barcha bo'lim va darslari bilan butunlay o'chiriladi. Bu amalni ortga qaytarib bo'lmaydi.` : ''}
        confirmLabel="Ha, o'chirish"
        busy={del.isPending}
        onConfirm={() => del.mutate(target.slug)}
        onClose={() => setTarget(null)}>
        {target?.students_count > 0 && (
          <div className="tcr-warn">
            <Icon name="alert" size={15} />
            <span>Bu kursga {target.students_count} nafar o'quvchi yozilgan — ularning jarayoni ham yo'qoladi.</span>
          </div>
        )}
      </ConfirmModal>
    </DashLayout>
  )
}
