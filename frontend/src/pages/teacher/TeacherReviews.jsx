import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '../../api/client'
import DashLayout from '../../components/DashLayout'
import Pagination from '../../components/Pagination'
import FilterBar from '../../components/FilterBar'
import { PageHead, Panel, EmptyState, Stars } from '../../components/Dash'

const PAGE_SIZE = 10

const css = `
  .rv-summary {
    display: grid; grid-template-columns: 200px 1fr; gap: 28px;
    background: var(--white); border: 1px solid var(--border);
    border-radius: var(--r-card); padding: 24px 28px; margin-bottom: 20px;
    align-items: center;
  }
  .rv-big { text-align: center; }
  .rv-big .num { font-family: var(--font-mono); font-size: 44px; font-weight: 560; letter-spacing: -0.04em; line-height: 1; }
  .rv-big .sub { font-size: 12.5px; color: var(--text-3); margin-top: 8px; }
  .rv-bars { display: flex; flex-direction: column; gap: 7px; }
  .rv-bar { display: flex; align-items: center; gap: 10px; font-size: 12px; color: var(--text-3); }
  .rv-bar .lbl { width: 12px; text-align: right; font-family: var(--font-mono); }
  .rv-bar .track { flex: 1; height: 6px; background: var(--border-2); border-radius: 999px; overflow: hidden; }
  .rv-bar .fill { height: 100%; background: #E5A50A; border-radius: 999px; }
  .rv-bar .cnt { width: 28px; font-family: var(--font-mono); font-size: 11px; }
  @media (max-width: 640px) { .rv-summary { grid-template-columns: 1fr; gap: 18px; } }
`

export default function TeacherReviews() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [ratingFilter, setRatingFilter] = useState('')
  const { data } = useQuery({
    queryKey: ['teacher-reviews'],
    queryFn: () => api.get('/teacher/reviews/').then(r => r.data),
  })
  const all = data || []

  const q = search.trim().toLowerCase()
  const filtered = useMemo(() => all
    .filter(r => !ratingFilter || r.rating === Number(ratingFilter))
    .filter(r => !q
      || (r.comment || '').toLowerCase().includes(q)
      || (r.student?.display_name || '').toLowerCase().includes(q)
      || (r.course_title || '').toLowerCase().includes(q)),
  [all, q, ratingFilter])

  const total = filtered.length
  const list = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const avg = all.length ? (all.reduce((s, r) => s + r.rating, 0) / all.length).toFixed(1) : '0.0'

  const dist = useMemo(() => {
    const d = [0, 0, 0, 0, 0]
    for (const r of all) if (r.rating >= 1 && r.rating <= 5) d[r.rating - 1]++
    return d
  }, [all])
  const maxD = Math.max(1, ...dist)

  return (
    <DashLayout kind="teacher">
      <style>{css}</style>
      <PageHead title="Sharhlar" sub="O'quvchilaringiz qoldirgan baholar va fikrlar" />

      {total > 0 && (
        <div className="rv-summary fade-up">
          <div className="rv-big">
            <div className="num">{avg}</div>
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: 8 }}>
              <Stars value={Math.round(parseFloat(avg))} size={15} />
            </div>
            <div className="sub">{total} ta sharh asosida</div>
          </div>
          <div className="rv-bars">
            {[5, 4, 3, 2, 1].map(n => (
              <div key={n} className="rv-bar">
                <span className="lbl">{n}</span>
                <div className="track"><div className="fill" style={{ width: `${(dist[n - 1] / maxD) * 100}%` }} /></div>
                <span className="cnt">{dist[n - 1]}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {all.length > 0 && (
        <FilterBar search={search} onSearch={v => { setSearch(v); setPage(1) }}
          placeholder="Sharh, o'quvchi yoki kurs…" count={total}>
          <select className="select" value={ratingFilter}
            onChange={e => { setRatingFilter(e.target.value); setPage(1) }}>
            <option value="">Barcha baholar</option>
            {[5, 4, 3, 2, 1].map(n => <option key={n} value={n}>{'★'.repeat(n)} ({dist[n - 1]})</option>)}
          </select>
        </FilterBar>
      )}

      <Panel title="Barcha sharhlar" count={total}>
        {list.length === 0 ? (
          all.length > 0 ? (
            <EmptyState small icon="search" title="Hech narsa topilmadi" sub="Filtr yoki qidiruvni o'zgartirib ko'ring." />
          ) : (
            <EmptyState icon="star" title="Hozircha sharhlar yo'q"
              sub="O'quvchilar kursingizni baholaganda fikrlari shu yerda ko'rinadi." />
          )
        ) : (
          <div>
            {list.map(r => (
              <div key={r.id} className="row-line" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 8, padding: '16px 20px' }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <div className="avatar avatar-blue" style={{ width: 34, height: 34, fontSize: 12 }}>{r.student?.initials}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 13.5 }}>{r.student?.display_name}</div>
                    <div className="text-xs text-muted">
                      {r.course_title} · {new Date(r.created_at).toLocaleDateString('uz-UZ')}
                    </div>
                  </div>
                  <Stars value={r.rating} size={13} />
                </div>
                {r.comment && <p className="text-sm" style={{ color: 'var(--text-2)', margin: 0, paddingLeft: 46 }}>{r.comment}</p>}
              </div>
            ))}
          </div>
        )}
      </Panel>
      <Pagination page={page} pageSize={PAGE_SIZE} total={total} onChange={setPage} />
    </DashLayout>
  )
}
