import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import api, { absUrl } from '../../api/client'
import DashLayout from '../../components/DashLayout'
import Icon from '../../components/Icon'
import Pagination from '../../components/Pagination'
import { PageHead, Panel, EmptyState } from '../../components/Dash'
import { ErrorState, LoadingBlock, StatStrip } from '../../components/PanelKit'

const PAGE_SIZE = 15

const STATES = [
  { id: 'all', label: 'Barchasi' },
  { id: 'active', label: 'Jarayonda' },
  { id: 'done', label: 'Tugatgan' },
]

const css = `
  .tst-flat { padding: 0; }
  .tst-min { min-width: 0; }
  .tst-layout { display: grid; grid-template-columns: minmax(0, 1fr) 300px; gap: 20px; align-items: start; }
  .tst-side { position: sticky; top: 20px; }

  .tst-bar { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; margin-bottom: 16px; }
  .tst-bar .search-box { flex: 1 1 240px; }
  .tst-bar .search-box .input { width: 100%; }

  .tst-head, .tst-row { display: grid; grid-template-columns: minmax(0, 1.5fr) minmax(0, 1.1fr) 170px 96px; gap: 14px; align-items: center; padding: 0 20px; }
  .tst-head { background: var(--bg-soft); border-bottom: 1.5px solid var(--border); height: 40px; font-family: var(--font-mono); font-size: 10.5px; font-weight: 600; text-transform: uppercase; letter-spacing: .09em; color: var(--text-3); }
  .tst-head .r { text-align: right; }
  .tst-row { padding-top: 13px; padding-bottom: 13px; border-bottom: 1.5px dashed var(--border-2); transition: background .12s ease; }
  .tst-row:last-child { border-bottom: none; }
  .tst-row:hover { background: var(--paper); }
  .tst-who { display: flex; align-items: center; gap: 12px; min-width: 0; }
  .tst-who .avatar { width: 38px; height: 38px; border-radius: 12px; font-size: 12px; }
  .tst-who .nm { font-weight: 700; font-size: 14px; color: var(--text); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .tst-who .ct { font-family: var(--font-mono); font-size: 11px; color: var(--text-3); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .tst-course { font-size: 13.5px; font-weight: 600; color: var(--text-2); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  a.tst-course:hover { color: var(--text); text-decoration: underline; text-underline-offset: 3px; }
  .tst-prog { display: flex; align-items: center; gap: 10px; }
  .tst-prog .progress { flex: 1; height: 8px; }
  .tst-prog .pc { font-family: var(--font-mono); font-size: 11.5px; color: var(--text-3); width: 38px; text-align: right; flex-shrink: 0; }
  .tst-prog .pc.done { color: var(--green-700); font-weight: 700; }
  .tst-date { font-size: 12.5px; color: var(--text-3); white-space: nowrap; text-align: right; }
  .tst-lbl { display: none; }

  .tst-cr { display: block; width: 100%; text-align: left; padding: 12px 18px; border-bottom: 1.5px dashed var(--border-2); transition: background .12s ease; }
  .tst-cr:last-child { border-bottom: none; }
  .tst-cr:hover { background: var(--paper); }
  .tst-cr.on { background: var(--sun-soft); }
  .tst-cr-top { display: flex; align-items: baseline; justify-content: space-between; gap: 10px; }
  .tst-cr-top b { font-size: 13px; font-weight: 700; color: var(--text); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; min-width: 0; }
  .tst-cr-top span { font-family: var(--font-mono); font-size: 11px; color: var(--text-3); flex-shrink: 0; }
  .tst-cr .progress { height: 6px; margin-top: 8px; }
  .tst-cr small { display: block; font-size: 11.5px; color: var(--text-3); margin-top: 5px; }

  @media (max-width: 1180px) {
    .tst-layout { grid-template-columns: 1fr; }
    .tst-side { position: static; order: -1; }
    .tst-side .tst-crs { display: flex; overflow-x: auto; }
    .tst-cr { min-width: 220px; border-bottom: none; border-right: 1.5px dashed var(--border-2); }
  }
  @media (max-width: 768px) {
    .tst-head { display: none; }
    .tst-row { grid-template-columns: 1fr; gap: 9px; padding: 14px 16px; }
    .tst-date { text-align: left; }
    .tst-lbl { display: inline; font-family: var(--font-mono); font-size: 10px; text-transform: uppercase; letter-spacing: .08em; color: var(--text-4); margin-right: 6px; }
    .tst-course { white-space: normal; }
    .tst-bar .seg-tabs { width: 100%; }
    .tst-bar .seg-tabs button { flex: 1; }
  }
`

function fmtDate(v) {
  const d = new Date(v)
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString('uz-UZ')
}
const clampPct = (v) => Math.min(100, Math.max(0, Math.round(Number(v) || 0)))
const isDone = (e) => Boolean(e.completed) || (Number(e.progress_percent) || 0) >= 100

export default function TeacherStudents() {
  const [page, setPage] = useState(1)
  const [q, setQ] = useState('')
  const [state, setState] = useState('all')
  const [course, setCourse] = useState('')

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['teacher-students'],
    queryFn: () => api.get('/teacher/students/').then(r => r.data),
  })
  const all = useMemo(() => (Array.isArray(data) ? data : []), [data])

  const byCourse = useMemo(() => {
    const m = new Map()
    for (const e of all) {
      const key = e.course_slug || e.course_title
      const it = m.get(key) || { key, title: e.course_title, n: 0, sum: 0, done: 0 }
      it.n += 1; it.sum += Number(e.progress_percent) || 0; if (isDone(e)) it.done += 1
      m.set(key, it)
    }
    return [...m.values()].sort((a, b) => b.n - a.n)
  }, [all])

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return all
      .filter(e => !course || (e.course_slug || e.course_title) === course)
      .filter(e => state === 'all' || (state === 'done' ? isDone(e) : !isDone(e)))
      .filter(e => !needle
        || (e.student?.display_name || '').toLowerCase().includes(needle)
        || (e.student?.email || '').toLowerCase().includes(needle)
        || (e.student?.phone || '').toLowerCase().includes(needle)
        || (e.course_title || '').toLowerCase().includes(needle))
  }, [all, q, state, course])

  const total = filtered.length
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const cur = Math.min(page, pages)
  const list = filtered.slice((cur - 1) * PAGE_SIZE, cur * PAGE_SIZE)

  const uniqueStudents = useMemo(() => new Set(all.map(e => e.student?.id)).size, [all])
  const avgProgress = all.length
    ? Math.round(all.reduce((s, e) => s + (Number(e.progress_percent) || 0), 0) / all.length)
    : 0
  const finished = all.filter(isDone).length
  const filtering = Boolean(q.trim()) || state !== 'all' || Boolean(course)
  const reset = () => { setQ(''); setState('all'); setCourse(''); setPage(1) }

  return (
    <DashLayout kind="teacher">
      <style>{css}</style>
      <PageHead title="O'quvchilarim"
        sub={isLoading || isError ? "Kurslaringizga yozilgan o'quvchilar va ularning jarayoni" : `${uniqueStudents} nafar o'quvchi · ${byCourse.length} ta kursda`} />

      {isLoading ? (
        <LoadingBlock />
      ) : isError ? (
        <ErrorState title="O'quvchilar ro'yxatini yuklab bo'lmadi" onRetry={() => refetch()} />
      ) : all.length === 0 ? (
        <div className="card tst-flat">
          <EmptyState icon="users" title="Hozircha o'quvchilar yo'q"
            sub="Kursingiz nashr etilgach, yozilgan o'quvchilar va ularning jarayoni shu yerda ko'rinadi."
            action={<Link to="/teacher/courses" className="btn btn-secondary btn-sm"><Icon name="book" size={13} /> Kurslarimga o'tish</Link>} />
        </div>
      ) : (
        <>
          <StatStrip items={[
            { label: "O'quvchilar", value: uniqueStudents, icon: 'users', tone: 'blue' },
            { label: 'Kursga yozilishlar', value: all.length, icon: 'bookmark', tone: 'violet' },
            { label: "O'rtacha jarayon", value: `${avgProgress}%`, icon: 'zap', tone: 'amber' },
            { label: 'Kursni tugatgan', value: finished, icon: 'award', tone: 'green' },
          ]} />

          <div className="tst-layout">
            <div className="tst-min">
              <div className="tst-bar">
                <div className="search-box">
                  <Icon name="search" size={15} />
                  <input className="input" placeholder="Ism, aloqa yoki kurs bo'yicha…" value={q} aria-label="Qidirish"
                    onChange={e => { setQ(e.target.value); setPage(1) }} />
                </div>
                <div className="seg-tabs">
                  {STATES.map(s => (
                    <button key={s.id} type="button" className={state === s.id ? 'on' : ''}
                      onClick={() => { setState(s.id); setPage(1) }}>{s.label}</button>
                  ))}
                </div>
                {filtering && (
                  <button type="button" className="btn btn-ghost btn-sm" onClick={reset}><Icon name="x" size={13} /> Tozalash</button>
                )}
              </div>

              <Panel title="Ro'yxat" count={total}>
                {list.length === 0 ? (
                  <EmptyState small icon="search" title="Hech narsa topilmadi" sub="Filtr yoki qidiruv so'zini o'zgartirib ko'ring."
                    action={<button type="button" className="btn btn-secondary btn-sm" onClick={reset}>Filtrni tozalash</button>} />
                ) : (
                  <>
                    <div className="tst-head">
                      <span>O'quvchi</span><span>Kurs</span><span>Jarayon</span><span className="r">Yozilgan</span>
                    </div>
                    {list.map(e => {
                      const pct = clampPct(e.progress_percent)
                      const contact = e.student?.email || e.student?.phone
                      return (
                        <div key={e.id} className="tst-row">
                          <div className="tst-who">
                            <div className="avatar avatar-blue">
                              {e.student?.avatar ? <img src={absUrl(e.student.avatar)} alt="" /> : (e.student?.initials || '?')}
                            </div>
                            <div className="tst-min">
                              <div className="nm">{e.student?.display_name || "Noma'lum"}</div>
                              {contact && <div className="ct">{contact}</div>}
                            </div>
                          </div>
                          {e.course_slug
                            ? <Link to={`/teacher/courses/${e.course_slug}/stats`} className="tst-course" title="Kurs statistikasi"><span className="tst-lbl">Kurs</span>{e.course_title}</Link>
                            : <span className="tst-course"><span className="tst-lbl">Kurs</span>{e.course_title}</span>}
                          <div className="tst-prog">
                            <div className="progress"><div className="progress-fill" style={{ width: `${pct}%` }} /></div>
                            <span className={`pc ${isDone(e) ? 'done' : ''}`}>{pct}%</span>
                          </div>
                          <div className="tst-date"><span className="tst-lbl">Yozilgan</span>{fmtDate(e.enrolled_at)}</div>
                        </div>
                      )
                    })}
                  </>
                )}
              </Panel>
              <Pagination page={cur} pageSize={PAGE_SIZE} total={total} onChange={setPage} />
            </div>

            <aside className="tst-side">
              <Panel title="Kurslar bo'yicha" count={byCourse.length}>
                <div className="tst-crs">
                  {byCourse.map(c => {
                    const avg = Math.round(c.sum / c.n)
                    return (
                      <button key={c.key} type="button" className={`tst-cr ${course === c.key ? 'on' : ''}`}
                        aria-pressed={course === c.key}
                        onClick={() => { setCourse(course === c.key ? '' : c.key); setPage(1) }}>
                        <div className="tst-cr-top"><b>{c.title}</b><span>{c.n} nafar</span></div>
                        <div className="progress"><div className="progress-fill" style={{ width: `${avg}%` }} /></div>
                        <small>O'rtacha {avg}% · {c.done} tasi tugatgan</small>
                      </button>
                    )
                  })}
                </div>
              </Panel>
            </aside>
          </div>
        </>
      )}
    </DashLayout>
  )
}
