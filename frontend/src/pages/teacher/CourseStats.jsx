import { useMemo, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import api, { absUrl } from '../../api/client'
import DashLayout from '../../components/DashLayout'
import Icon from '../../components/Icon'
import Pagination from '../../components/Pagination'
import { PageHead, Panel, EmptyState, CourseStatus, Stars } from '../../components/Dash'
import { ErrorState, LoadingBlock } from '../../components/PanelKit'
import { useAuth } from '../../store/auth'

const PAGE_SIZE = 15

const FILTERS = [
  { id: 'all', label: 'Barchasi' },
  { id: 'active', label: 'Jarayonda' },
  { id: 'done', label: 'Tugatgan' },
]

const BUCKETS = [
  { label: '0–24%', test: p => p < 25, color: 'var(--coral)' },
  { label: '25–49%', test: p => p >= 25 && p < 50, color: 'var(--sun)' },
  { label: '50–74%', test: p => p >= 50 && p < 75, color: 'var(--sea)' },
  { label: '75–99%', test: p => p >= 75 && p < 100, color: 'var(--violet)' },
  { label: '100%', test: p => p >= 100, color: 'var(--green-600)' },
]

const css = `
  .cst-top { display: grid; grid-template-columns: minmax(0, 1.25fr) minmax(0, 1fr); gap: 20px; margin-bottom: 20px; align-items: stretch; }

  .cst-route { background: var(--white); border: 2px solid var(--line); border-radius: var(--r-card); box-shadow: var(--hard); padding: 22px 24px; display: flex; flex-direction: column; gap: 22px; }
  .cst-id { display: flex; align-items: center; gap: 14px; min-width: 0; }
  .cst-id .thumb { width: 64px; height: 52px; aspect-ratio: auto; font-size: 26px; border-radius: 14px; flex-shrink: 0; transform: rotate(-3deg); border: 1.5px solid var(--line); }
  .cst-min { min-width: 0; }
  .cst-status { margin-left: auto; flex-shrink: 0; }
  .cst-id h3 { font-size: 18px; line-height: 1.2; overflow-wrap: anywhere; }
  .cst-id .coord { display: block; margin-top: 5px; text-transform: uppercase; }
  .cst-stops { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); position: relative; margin-top: auto; }
  .cst-stops::before { content: ''; position: absolute; left: 18px; right: 18px; top: 17px; border-top: 2px dashed var(--border); }
  .cst-stop { position: relative; min-width: 0; padding-right: 8px; }
  .cst-stop .dot { width: 36px; height: 36px; border-radius: 12px; display: flex; align-items: center; justify-content: center; border: 1.5px solid var(--line); color: #14213D; }
  .cst-stop .d1 { background: var(--sea-soft); color: var(--blue-600); }
  .cst-stop .d2 { background: var(--sun); }
  .cst-stop .d3 { background: var(--green-200); }
  .cst-stop .d4 { background: var(--coral); }
  html[data-theme="dark"] .cst-stop .d3 { color: var(--text); }
  .cst-stop b { display: block; font-family: var(--font-display); font-size: 28px; font-weight: 800; letter-spacing: -0.05em; line-height: 1; margin-top: 12px; color: var(--text); }
  .cst-stop span { display: block; font-family: var(--font-mono); font-size: 10px; text-transform: uppercase; letter-spacing: .08em; color: var(--text-3); margin-top: 6px; }
  .cst-stop small { display: block; font-size: 11.5px; color: var(--text-4); margin-top: 2px; font-weight: 600; }

  .cst-chart { background: var(--white); border: 1.5px solid var(--border); border-radius: var(--r-card); padding: 20px 22px; display: flex; flex-direction: column; }
  .cst-chart-h { display: flex; align-items: baseline; justify-content: space-between; gap: 10px; margin-bottom: 4px; }
  .cst-chart-h h3 { font-size: 16px; }
  .cst-chart-h b { font-family: var(--font-display); font-size: 22px; font-weight: 800; letter-spacing: -0.04em; }
  .cst-chart p { font-size: 12.5px; color: var(--text-3); margin-bottom: 14px; }
  .cst-bars { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 10px; align-items: end; flex: 1; min-height: 130px; border-bottom: 1.5px solid var(--border); }
  .cst-col { display: flex; flex-direction: column; align-items: center; justify-content: flex-end; height: 100%; gap: 6px; }
  .cst-col i { font-style: normal; font-family: var(--font-mono); font-size: 11px; font-weight: 600; color: var(--text-2); }
  .cst-col .bar { width: 100%; max-width: 54px; min-height: 4px; border-radius: 9px 9px 0 0; }
  .cst-xs { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 10px; margin-top: 8px; }
  .cst-xs span { text-align: center; font-family: var(--font-mono); font-size: 10px; color: var(--text-3); white-space: nowrap; }
  .cst-rate { display: flex; align-items: center; gap: 10px; margin-top: 14px; padding-top: 13px; border-top: 1.5px dashed var(--border); font-size: 13px; color: var(--text-3); font-weight: 600; flex-wrap: wrap; }
  .cst-rate b { color: var(--text); font-family: var(--font-display); font-size: 16px; }

  .cst-bar { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; margin-bottom: 16px; }
  .cst-bar .search-box { flex: 1 1 240px; }
  .cst-bar .search-box .input { width: 100%; }
  .cst-bar .seg-tabs button .n { margin-left: 6px; }

  .cst-head, .cst-row { display: grid; grid-template-columns: minmax(0, 1.6fr) 200px 96px 104px 96px; gap: 14px; align-items: center; padding: 0 20px; }
  .cst-head { background: var(--bg-soft); border-bottom: 1.5px solid var(--border); height: 40px; font-family: var(--font-mono); font-size: 10.5px; font-weight: 600; text-transform: uppercase; letter-spacing: .09em; color: var(--text-3); }
  .cst-head .r { text-align: right; }
  .cst-row { padding-top: 13px; padding-bottom: 13px; border-bottom: 1.5px dashed var(--border-2); transition: background .12s ease; }
  .cst-row:last-child { border-bottom: none; }
  .cst-row:hover { background: var(--paper); }
  .cst-who { display: flex; align-items: center; gap: 12px; min-width: 0; color: inherit; }
  .cst-who .avatar { width: 38px; height: 38px; border-radius: 12px; font-size: 12px; }
  .cst-who .nm { font-weight: 700; font-size: 14px; color: var(--text); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  a.cst-who:hover .nm { text-decoration: underline; text-underline-offset: 3px; }
  .cst-who .ct { font-family: var(--font-mono); font-size: 11px; color: var(--text-3); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .cst-prog-l { display: flex; align-items: center; gap: 10px; }
  .cst-prog-l .progress { flex: 1; height: 8px; }
  .cst-prog-l .pc { font-family: var(--font-mono); font-size: 11.5px; color: var(--text-3); width: 38px; text-align: right; flex-shrink: 0; }
  .cst-prog-l .pc.done { color: var(--green-700); font-weight: 700; }
  .cst-les { font-size: 11.5px; color: var(--text-3); margin-top: 4px; }
  .cst-date { font-size: 12.5px; color: var(--text-3); white-space: nowrap; text-align: right; }
  .cst-none { color: var(--text-4); }
  .cst-lbl { display: none; }

  @media (max-width: 1180px) { .cst-top { grid-template-columns: 1fr; } }
  @media (max-width: 900px) {
    .cst-head { display: none; }
    .cst-row { grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 10px 14px; padding: 14px 16px; }
    .cst-row > :nth-child(1), .cst-row > :nth-child(2) { grid-column: 1 / -1; }
    .cst-date { text-align: right; grid-column: 1 / -1; text-align: left; }
    .cst-lbl { display: inline; font-family: var(--font-mono); font-size: 10px; text-transform: uppercase; letter-spacing: .08em; color: var(--text-4); margin-right: 6px; }
    .cst-cell { display: flex; align-items: center; flex-wrap: wrap; }
  }
  @media (max-width: 560px) {
    .cst-route { padding: 18px; }
    .cst-stops { grid-template-columns: repeat(2, minmax(0, 1fr)); row-gap: 18px; }
    .cst-stops::before { display: none; }
    .cst-bar .seg-tabs { width: 100%; }
    .cst-bar .seg-tabs button { flex: 1; padding: 7px 8px; }
  }
`

function fmtDate(v) {
  const d = new Date(v)
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString('uz-UZ')
}
const clampPct = (v) => Math.min(100, Math.max(0, Math.round(Number(v) || 0)))

export default function CourseStats() {
  const { slug } = useParams()
  const { user } = useAuth()
  const { pathname } = useLocation()
  // The page is mounted under both panels; follow the URL so an admin opening it
  // from the teacher panel keeps the teacher shell and its back links.
  const inAdmin = pathname.startsWith('/admin-panel')
  const isAdmin = user?.role === 'admin'
  const kind = inAdmin ? 'admin' : 'teacher'
  const base = inAdmin ? '/admin-panel' : '/teacher'

  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [page, setPage] = useState(1)

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['course-students', slug],
    queryFn: () => api.get(`/courses/${slug}/students/`).then(r => r.data),
    retry: (count, err) => ![403, 404].includes(err?.response?.status) && count < 2,
  })

  const course = data?.course
  const stats = data?.stats || {}
  const all = useMemo(() => (Array.isArray(data?.students) ? data.students : []), [data])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return all
      .filter(s => filter === 'all' || (filter === 'done' ? s.completed : !s.completed))
      .filter(s => !q
        || (s.student?.display_name || '').toLowerCase().includes(q)
        || (s.student?.phone || '').toLowerCase().includes(q)
        || (s.student?.email || '').toLowerCase().includes(q))
  }, [all, filter, search])

  const total = filtered.length
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const cur = Math.min(page, pages)
  const rows = filtered.slice((cur - 1) * PAGE_SIZE, cur * PAGE_SIZE)

  const counts = useMemo(() => ({
    all: all.length,
    active: all.filter(s => !s.completed).length,
    done: all.filter(s => s.completed).length,
  }), [all])

  const buckets = useMemo(() => BUCKETS.map(b => all.filter(s => b.test(Number(s.progress_percent) || 0)).length), [all])
  const maxBucket = Math.max(1, ...buckets)
  const started = all.filter(s => (s.lessons_done || 0) > 0 || (Number(s.progress_percent) || 0) > 0).length
  const nStudents = stats.students ?? all.length
  const share = (n) => (nStudents ? `${Math.round((n / nStudents) * 100)}%` : '—')
  const lessonsTotal = stats.lessons_total ?? 0

  const crumbs = (
    <div className="breadcrumb">
      <Link to={`${base}/courses`}>{inAdmin ? 'Kurslar' : 'Kurslarim'}</Link>
      <span className="sep">/</span>
      <span>{course?.title || slug}</span>
      <span className="sep">/</span>
      <span>Statistika</span>
    </div>
  )

  if (isLoading || isError) {
    const status = error?.response?.status
    return (
      <DashLayout kind={kind}>
        {crumbs}
        <PageHead title="Kurs statistikasi" sub="Kurs o'quvchilari ro'yxati va o'zlashtirish statistikasi">
          <Link to={`${base}/courses`} className="btn btn-secondary"><Icon name="arrowL" size={15} /> Kurslarga qaytish</Link>
        </PageHead>
        {isLoading ? <LoadingBlock /> : (
          <ErrorState
            title={status === 404 ? 'Kurs topilmadi' : status === 403 ? "Bu kurs statistikasini ko'rishga ruxsat yo'q" : "Statistikani yuklab bo'lmadi"}
            sub={status === 404 ? "Kurs o'chirilgan yoki manzil noto'g'ri bo'lishi mumkin."
              : status === 403 ? 'Statistikani faqat kurs muallifi va administrator ko\'ra oladi.' : undefined}
            onRetry={status === 404 || status === 403 ? undefined : () => refetch()} />
        )}
      </DashLayout>
    )
  }

  return (
    <DashLayout kind={kind}>
      <style>{css}</style>
      {crumbs}

      <PageHead
        title={course?.title || 'Kurs statistikasi'}
        sub="Kurs o'quvchilari ro'yxati va o'zlashtirish statistikasi">
        <Link to={`/courses/${slug}`} className="btn btn-secondary"><Icon name="eye" size={15} /> Ko'rish</Link>
        <Link to={`${base}/courses/${slug}/edit`} className="btn btn-primary"><Icon name="edit" size={15} /> Tahrirlash</Link>
      </PageHead>

      <div className="cst-top">
        <section className="cst-route fade-up">
          <div className="cst-id">
            <div className={`thumb thumb-${course?.thumb_color || 'slate'}`}>{course?.thumb_emoji}</div>
            <div className="cst-min">
              <h3>O'quvchilar yo'li</h3>
              <span className="coord">{lessonsTotal} ta dars · yozilishdan sertifikatgacha</span>
            </div>
            {course && <span className="cst-status"><CourseStatus status={course.status} /></span>}
          </div>
          <div className="cst-stops">
            <div className="cst-stop">
              <span className="dot d1"><Icon name="users" size={16} /></span>
              <b>{nStudents}</b><span>Yozilgan</span><small>jami</small>
            </div>
            <div className="cst-stop">
              <span className="dot d2"><Icon name="play" size={15} /></span>
              <b>{started}</b><span>Boshlagan</span><small>{share(started)}</small>
            </div>
            <div className="cst-stop">
              <span className="dot d3"><Icon name="checkC" size={16} /></span>
              <b>{stats.completed ?? 0}</b><span>Tugatgan</span><small>{share(stats.completed ?? 0)}</small>
            </div>
            <div className="cst-stop">
              <span className="dot d4"><Icon name="award" size={16} /></span>
              <b>{stats.certificates ?? 0}</b><span>Sertifikat</span><small>{share(stats.certificates ?? 0)}</small>
            </div>
          </div>
        </section>

        <section className="cst-chart fade-up-d1">
          <div className="cst-chart-h">
            <h3>Jarayon taqsimoti</h3>
            <b>{stats.avg_progress ?? 0}%</b>
          </div>
          <p>O'quvchilar kursning qaysi qismida — o'rtacha jarayon o'ngda.</p>
          <div className="cst-bars" role="img" aria-label="O'quvchilarning jarayon bo'yicha taqsimoti">
            {BUCKETS.map((b, i) => (
              <div key={b.label} className="cst-col" title={`${b.label}: ${buckets[i]} nafar`}>
                <i>{buckets[i]}</i>
                <div className="bar" style={{ height: `${(buckets[i] / maxBucket) * 78}%`, background: buckets[i] ? b.color : 'var(--border)' }} />
              </div>
            ))}
          </div>
          <div className="cst-xs">{BUCKETS.map(b => <span key={b.label}>{b.label}</span>)}</div>
          <div className="cst-rate">
            {stats.rating_count ? (
              <><Stars value={Math.round(stats.rating_avg)} size={14} /> <b>{Number(stats.rating_avg).toFixed(1)}</b> {stats.rating_count} ta sharh asosida</>
            ) : (
              <><Icon name="star" size={14} /> Bu kurs hali baholanmagan</>
            )}
          </div>
        </section>
      </div>

      {all.length > 0 && (
        <div className="cst-bar">
          <div className="search-box">
            <Icon name="search" size={15} />
            <input className="input" placeholder="Ism, telefon yoki email…" value={search} aria-label="Qidirish"
              onChange={e => { setSearch(e.target.value); setPage(1) }} />
          </div>
          <div className="seg-tabs">
            {FILTERS.map(f => (
              <button key={f.id} type="button" className={filter === f.id ? 'on' : ''}
                onClick={() => { setFilter(f.id); setPage(1) }}>
                {f.label}<span className="n">{counts[f.id]}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <Panel title="O'quvchilar" count={total}>
        {rows.length === 0 ? (
          all.length > 0 ? (
            <EmptyState small icon="search" title="Hech narsa topilmadi" sub="Filtr yoki qidiruvni o'zgartirib ko'ring."
              action={<button type="button" className="btn btn-secondary btn-sm" onClick={() => { setSearch(''); setFilter('all'); setPage(1) }}>Filtrni tozalash</button>} />
          ) : (
            <EmptyState icon="users" title="Hozircha o'quvchilar yo'q"
              sub={course?.status === 'published'
                ? "Kursga yozilgan o'quvchilar va ularning jarayoni shu yerda ko'rinadi."
                : "Kurs hali nashr etilmagan — nashrdan so'ng yozilgan o'quvchilar shu yerda ko'rinadi."} />
          )
        ) : (
          <>
            <div className="cst-head">
              <span>O'quvchi</span><span>Jarayon</span><span>Baho</span><span>Sertifikat</span><span className="r">Yozilgan</span>
            </div>
            {rows.map(s => {
              const pct = clampPct(s.progress_percent)
              const contact = s.student?.email || s.student?.phone
              const who = (
                <>
                  <div className="avatar avatar-blue">
                    {s.student?.avatar ? <img src={absUrl(s.student.avatar)} alt="" /> : (s.student?.initials || '?')}
                  </div>
                  <div className="cst-min">
                    <div className="nm">{s.student?.display_name || "Noma'lum"}</div>
                    {contact && <div className="ct">{contact}</div>}
                  </div>
                </>
              )
              return (
                <div key={s.id} className="cst-row">
                  {isAdmin && inAdmin && s.student?.id
                    ? <Link to={`/admin-panel/users/${s.student.id}`} className="cst-who" title="Foydalanuvchi sahifasi">{who}</Link>
                    : <div className="cst-who">{who}</div>}
                  <div>
                    <div className="cst-prog-l">
                      <div className="progress"><div className="progress-fill" style={{ width: `${pct}%` }} /></div>
                      <span className={`pc ${s.completed ? 'done' : ''}`}>{pct}%</span>
                    </div>
                    <div className="cst-les">{Math.min(s.lessons_done || 0, lessonsTotal || s.lessons_done || 0)}/{lessonsTotal} dars</div>
                  </div>
                  <div className="cst-cell">
                    <span className="cst-lbl">Baho</span>
                    {s.rating ? <Stars value={s.rating} size={12} /> : <span className="cst-none">—</span>}
                  </div>
                  <div className="cst-cell">
                    <span className="cst-lbl">Sertifikat</span>
                    {s.certificate ? (
                      <Link to={`/certificate/${s.certificate.unique_id}`} className="badge badge-green"
                        title={`${Math.round(s.certificate.score_percent)}% — ${fmtDate(s.certificate.issued_at)}`}>
                        <Icon name="award" size={11} /> {Math.round(s.certificate.score_percent)}%
                      </Link>
                    ) : <span className="cst-none">—</span>}
                  </div>
                  <div className="cst-date"><span className="cst-lbl">Yozilgan</span>{fmtDate(s.enrolled_at)}</div>
                </div>
              )
            })}
          </>
        )}
      </Panel>
      <Pagination page={cur} pageSize={PAGE_SIZE} total={total} onChange={setPage} />
    </DashLayout>
  )
}
