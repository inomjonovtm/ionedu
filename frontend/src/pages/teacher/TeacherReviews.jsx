import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import api, { absUrl } from '../../api/client'
import DashLayout from '../../components/DashLayout'
import Icon from '../../components/Icon'
import Pagination from '../../components/Pagination'
import { PageHead, EmptyState, Stars } from '../../components/Dash'
import { ErrorState, LoadingBlock } from '../../components/PanelKit'

const PAGE_SIZE = 10

const css = `
  .trv-flat { padding: 0; }
  .trv-min { min-width: 0; }
  .trv-layout { display: grid; grid-template-columns: 320px minmax(0, 1fr); gap: 20px; align-items: start; }
  .trv-side { position: sticky; top: 20px; display: flex; flex-direction: column; gap: 16px; }

  .trv-score { position: relative; overflow: hidden; background: var(--ink); color: #B7C0D8; border-radius: 24px; padding: 24px 24px 22px; }
  .trv-score::before { content: ''; position: absolute; inset: 0; background-image: var(--topo); background-size: 420px 290px; filter: invert(1); opacity: .5; pointer-events: none; }
  html[data-theme="dark"] .trv-score::before { filter: none; opacity: 1; }
  .trv-score > * { position: relative; }
  .trv-score .coord { color: #8C99BC; text-transform: uppercase; }
  .trv-big { display: flex; align-items: flex-end; gap: 10px; margin-top: 12px; }
  .trv-big b { font-family: var(--font-display); font-size: 68px; font-weight: 800; letter-spacing: -0.06em; line-height: .86; color: #fff; }
  .trv-big span { font-family: var(--font-mono); font-size: 13px; color: #8C99BC; padding-bottom: 4px; }
  .trv-score .stars-row { margin-top: 14px; color: var(--sun); }
  .trv-score p { font-size: 13px; margin-top: 8px; }

  .trv-dist { background: var(--white); border: 1.5px solid var(--border); border-radius: var(--r-card); padding: 14px 10px 10px; }
  .trv-dist h4 { font-family: var(--font-mono); font-size: 10.5px; font-weight: 600; text-transform: uppercase; letter-spacing: .1em; color: var(--text-3); padding: 0 10px 8px; }
  .trv-bar { display: flex; align-items: center; gap: 10px; width: 100%; padding: 7px 10px; border-radius: 11px; font-size: 12px; color: var(--text-3); transition: background .12s ease; }
  .trv-bar:hover { background: var(--bg-soft); }
  .trv-bar.on { background: var(--sun-soft); color: var(--text); }
  .trv-bar .lbl { display: inline-flex; align-items: center; gap: 4px; width: 30px; font-family: var(--font-mono); font-weight: 600; color: var(--text-2); }
  .trv-bar .lbl svg { color: #F5A300; }
  .trv-bar .track { flex: 1; height: 9px; background: var(--bg-soft); border: 1.5px solid var(--border); border-radius: 999px; overflow: hidden; }
  .trv-bar .fill { display: block; height: 100%; background: var(--sun); border-radius: 999px; }
  .trv-bar .cnt { width: 26px; text-align: right; font-family: var(--font-mono); font-size: 11px; }

  .trv-bar-row { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; margin-bottom: 16px; }
  .trv-bar-row .search-box { flex: 1 1 240px; }
  .trv-bar-row .search-box .input { width: 100%; }
  .trv-bar-row .select { width: auto; flex: 0 1 230px; height: 42px; }
  .trv-count { font-family: var(--font-mono); font-size: 11px; text-transform: uppercase; letter-spacing: .08em; color: var(--text-3); white-space: nowrap; }
  .trv-count b { color: var(--text); }

  .trv-feed { display: flex; flex-direction: column; gap: 12px; }
  .trv-card { background: var(--white); border: 1.5px solid var(--border); border-radius: var(--r-card); padding: 18px 20px; }
  .trv-card.low { border-left: 5px solid var(--coral); }
  .trv-card-h { display: flex; align-items: center; gap: 12px; }
  .trv-card-h .avatar { width: 40px; height: 40px; border-radius: 13px; font-size: 13px; }
  .trv-card-h .nm { font-weight: 700; font-size: 14px; color: var(--text); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .trv-card-h .dt { font-size: 12px; color: var(--text-3); }
  .trv-rate { margin-left: auto; display: inline-flex; align-items: center; gap: 8px; flex-shrink: 0; }
  .trv-rate b { font-family: var(--font-display); font-size: 17px; font-weight: 800; }
  .trv-text { font-size: 14px; color: var(--text-2); line-height: 1.6; margin-top: 12px; white-space: pre-line; overflow-wrap: anywhere; }
  .trv-text.none { color: var(--text-4); font-style: italic; }
  .trv-foot { display: flex; align-items: center; gap: 7px; margin-top: 12px; padding-top: 11px; border-top: 1.5px dashed var(--border); font-size: 12.5px; font-weight: 600; color: var(--text-3); min-width: 0; }
  .trv-foot span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

  @media (max-width: 1100px) {
    .trv-layout { grid-template-columns: 1fr; }
    .trv-side { position: static; display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1.2fr); }
  }
  @media (max-width: 640px) {
    .trv-side { grid-template-columns: 1fr; }
    .trv-big b { font-size: 54px; }
    .trv-card { padding: 16px; }
    .trv-rate b { display: none; }
    .trv-bar-row .select { flex: 1 1 100%; }
  }
`

function fmtDate(v) {
  const d = new Date(v)
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString('uz-UZ', { day: 'numeric', month: 'long', year: 'numeric' })
}

export default function TeacherReviews() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [ratingFilter, setRatingFilter] = useState(0)
  const [course, setCourse] = useState('')

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['teacher-reviews'],
    queryFn: () => api.get('/teacher/reviews/').then(r => r.data),
  })
  const all = useMemo(() => (Array.isArray(data) ? data : []), [data])

  const courseTitles = useMemo(() => [...new Set(all.map(r => r.course_title).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'uz')), [all])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return all
      .filter(r => !ratingFilter || r.rating === ratingFilter)
      .filter(r => !course || r.course_title === course)
      .filter(r => !q
        || (r.comment || '').toLowerCase().includes(q)
        || (r.student?.display_name || '').toLowerCase().includes(q)
        || (r.course_title || '').toLowerCase().includes(q))
  }, [all, search, ratingFilter, course])

  const total = filtered.length
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const cur = Math.min(page, pages)
  const list = filtered.slice((cur - 1) * PAGE_SIZE, cur * PAGE_SIZE)

  const avgNum = all.length ? all.reduce((s, r) => s + (r.rating || 0), 0) / all.length : 0
  const dist = useMemo(() => {
    const d = [0, 0, 0, 0, 0]
    for (const r of all) if (r.rating >= 1 && r.rating <= 5) d[r.rating - 1]++
    return d
  }, [all])
  const withText = all.filter(r => (r.comment || '').trim()).length
  const filtering = Boolean(search.trim()) || ratingFilter > 0 || Boolean(course)
  const reset = () => { setSearch(''); setRatingFilter(0); setCourse(''); setPage(1) }

  return (
    <DashLayout kind="teacher">
      <style>{css}</style>
      <PageHead title="Sharhlar"
        sub={isLoading || isError ? "O'quvchilarning kurslaringizga qo'ygan baholari va fikrlari" : `${all.length} ta baho · ${withText} tasida yozma fikr bor`} />

      {isLoading ? (
        <LoadingBlock />
      ) : isError ? (
        <ErrorState title="Sharhlarni yuklab bo'lmadi" onRetry={() => refetch()} />
      ) : all.length === 0 ? (
        <div className="card trv-flat">
          <EmptyState icon="star" title="Hozircha sharhlar yo'q"
            sub="O'quvchilar kursingizni baholaganda fikrlari shu yerda ko'rinadi."
            action={<Link to="/teacher/courses" className="btn btn-secondary btn-sm"><Icon name="book" size={13} /> Kurslarimga o'tish</Link>} />
        </div>
      ) : (
        <div className="trv-layout">
          <aside className="trv-side">
            <div className="trv-score fade-up">
              <span className="coord">O'rtacha baho</span>
              <div className="trv-big"><b>{avgNum.toFixed(1)}</b><span>/ 5</span></div>
              <Stars value={Math.round(avgNum)} size={17} />
              <p>{all.length} ta sharh asosida</p>
            </div>

            <div className="trv-dist fade-up-d1">
              <h4>Baholar taqsimoti</h4>
              {[5, 4, 3, 2, 1].map(n => (
                <button key={n} type="button" className={`trv-bar ${ratingFilter === n ? 'on' : ''}`}
                  aria-pressed={ratingFilter === n} title={`Faqat ${n} baholi sharhlar`}
                  onClick={() => { setRatingFilter(ratingFilter === n ? 0 : n); setPage(1) }}>
                  <span className="lbl">{n} <Icon name="starF" size={11} /></span>
                  <span className="track"><span className="fill" style={{ width: `${(dist[n - 1] / all.length) * 100}%` }} /></span>
                  <span className="cnt">{dist[n - 1]}</span>
                </button>
              ))}
            </div>
          </aside>

          <div className="trv-min">
            <div className="trv-bar-row">
              <div className="search-box">
                <Icon name="search" size={15} />
                <input className="input" placeholder="Sharh, o'quvchi yoki kurs…" value={search} aria-label="Qidirish"
                  onChange={e => { setSearch(e.target.value); setPage(1) }} />
              </div>
              {courseTitles.length > 1 && (
                <select className="select" value={course} aria-label="Kurs"
                  onChange={e => { setCourse(e.target.value); setPage(1) }}>
                  <option value="">Barcha kurslar</option>
                  {courseTitles.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              )}
              {filtering && (
                <button type="button" className="btn btn-ghost btn-sm" onClick={reset}><Icon name="x" size={13} /> Tozalash</button>
              )}
              <span className="trv-count">Topildi: <b>{total}</b></span>
            </div>

            {list.length === 0 ? (
              <div className="card trv-flat">
                <EmptyState small icon="search" title="Hech narsa topilmadi" sub="Filtr yoki qidiruvni o'zgartirib ko'ring."
                  action={<button type="button" className="btn btn-secondary btn-sm" onClick={reset}>Filtrni tozalash</button>} />
              </div>
            ) : (
              <div className="trv-feed">
                {list.map(r => (
                  <article key={r.id} className={`trv-card ${r.rating <= 2 ? 'low' : ''}`}>
                    <div className="trv-card-h">
                      <div className="avatar avatar-blue">
                        {r.student?.avatar ? <img src={absUrl(r.student.avatar)} alt="" /> : (r.student?.initials || '?')}
                      </div>
                      <div className="trv-min">
                        <div className="nm">{r.student?.display_name || "Noma'lum"}</div>
                        <div className="dt">{fmtDate(r.created_at)}</div>
                      </div>
                      <div className="trv-rate"><Stars value={r.rating} size={14} /><b>{r.rating}</b></div>
                    </div>
                    {(r.comment || '').trim()
                      ? <p className="trv-text">{r.comment}</p>
                      : <p className="trv-text none">Yozma fikr qoldirilmagan.</p>}
                    <div className="trv-foot"><Icon name="book" size={13} /><span>{r.course_title}</span></div>
                  </article>
                ))}
              </div>
            )}
            <Pagination page={cur} pageSize={PAGE_SIZE} total={total} onChange={setPage} />
          </div>
        </div>
      )}
    </DashLayout>
  )
}
