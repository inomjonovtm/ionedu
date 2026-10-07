import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import api from '../api/client'
import Layout from '../components/Layout'
import Icon from '../components/Icon'
import Pagination from '../components/Pagination'
import FilterBar from '../components/FilterBar'
import PageHeader from '../components/PageHeader'

const PAGE_SIZE = 15

const styles = `
  .leaderboard { background: var(--white); border: 1px solid var(--border); border-radius: 14px; overflow: hidden; }
  .lb-head { display: grid; grid-template-columns: 60px 1fr 130px 100px; padding: 12px 24px; background: var(--bg-soft); border-bottom: 1px solid var(--border); font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-3); }
  .lb-row { display: grid; grid-template-columns: 60px 1fr 130px 100px; align-items: center; padding: 14px 24px; border-bottom: 1px solid var(--border-2); transition: background .12s; }
  .lb-row:last-child { border-bottom: none; }
  .lb-row:hover { background: var(--bg-soft); }
  .lb-rank { font-family: var(--font-mono); font-weight: 560; font-size: 14px; color: var(--text-4); }
  .lb-medal { width: 30px; height: 30px; border-radius: 999px; display: inline-flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 560; font-family: var(--font-mono); }
  .lb-medal.m1 { background: #FEF3C7; color: #92400E; box-shadow: 0 0 0 1.5px #FDE68A; }
  .lb-medal.m2 { background: #F1F5F9; color: #475569; box-shadow: 0 0 0 1.5px #E2E8F0; }
  .lb-medal.m3 { background: #FFEDD5; color: #9A3412; box-shadow: 0 0 0 1.5px #FED7AA; }
  .lb-user { display: flex; align-items: center; gap: 12px; min-width: 0; }
  .lb-user .name { font-weight: 600; font-size: 14px; }
  .lb-user .meta { font-size: 12px; color: var(--text-3); }
  .points-cell { font-family: var(--font-display); font-weight: 700; font-size: 16px; color: var(--green-600); }
  @media (max-width: 640px) {
    .lb-head, .lb-row { grid-template-columns: 44px 1fr 90px; padding: 12px 14px; }
    .lb-head > :nth-child(3), .lb-row > :nth-child(3) { display: none; }
  }
`

function Rank({ n }) {
  if (n <= 3) return <span className={`lb-medal m${n}`}>{n}</span>
  return <span className="lb-rank">{n}</span>
}

export default function Ratings() {
  const [tab, setTab] = useState('students')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const { data: allRows = [], isLoading } = useQuery({
    queryKey: ['ratings', tab],
    queryFn: () => api.get(`/ratings/${tab}/`).then(r => r.data),
  })

  useEffect(() => { setPage(1); setSearch('') }, [tab])
  useEffect(() => { setPage(1) }, [search])

  // Keep the original rank even when searching
  const ranked = useMemo(() => allRows.map((row, i) => ({ row, rank: row.rank || i + 1 })), [allRows])
  const q = search.trim().toLowerCase()
  const filtered = useMemo(() => ranked.filter(({ row }) =>
    !q
    || (row.display_name || '').toLowerCase().includes(q)
    || (row.title || '').toLowerCase().includes(q)
    || (row.teacher?.display_name || '').toLowerCase().includes(q)
  ), [ranked, q])

  const total = filtered.length
  const data = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const headCols = tab === 'students'
    ? ['#', "O'quvchi", 'Sertifikatlar', 'Ball']
    : tab === 'teachers'
      ? ['#', "O'qituvchi", 'Kurslar', 'Reyting']
      : ['#', 'Kurs', 'Reyting', "O'quvchilar"]

  return (
    <Layout>
      <style>{styles}</style>
      <div className="container">
        <PageHeader eyebrow="Reyting" title="Reyting jadvali"
          subtitle="Eng faol o'quvchilar, o'qituvchilar va mashhur kurslar" />

        <FilterBar search={search} onSearch={setSearch}
          placeholder={tab === 'courses' ? 'Kurs qidirish…' : "Ism bo'yicha qidirish…"}
          count={total}
          tabs={[
            { id: 'students', label: "O'quvchilar" },
            { id: 'teachers', label: "O'qituvchilar" },
            { id: 'courses', label: 'Kurslar' },
          ]}
          tab={tab} onTab={setTab} />

        {isLoading ? (
          <div className="loading-state"><span className="spinner" />Yuklanmoqda…</div>
        ) : data.length === 0 ? (
          <div className="card" style={{ padding: 60, textAlign: 'center', color: 'var(--text-3)', marginBottom: 80 }}>
            {q ? `"${search}" bo'yicha hech narsa topilmadi` : "Hozircha ma'lumotlar yo'q"}
          </div>
        ) : (
          <div className="leaderboard fade-up">
            <div className="lb-head">
              <span>{headCols[0]}</span><span>{headCols[1]}</span><span>{headCols[2]}</span>
              <span style={{ textAlign: 'right' }}>{headCols[3]}</span>
            </div>
            {data.map(({ row, rank }) => {
              if (tab === 'courses') {
                return (
                  <Link key={row.id} to={`/courses/${row.slug}`} className="lb-row" style={{ textDecoration: 'none' }}>
                    <Rank n={rank} />
                    <div className="lb-user">
                      <div className={`thumb thumb-${row.thumb_color}`} style={{ width: 40, height: 40, aspectRatio: '1/1', fontSize: 18, flexShrink: 0 }}>{row.thumb_emoji}</div>
                      <div style={{ minWidth: 0 }}>
                        <div className="name" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.title}</div>
                        <div className="meta">{row.teacher?.display_name}</div>
                      </div>
                    </div>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 14 }}>
                      <Icon name="starF" size={13} style={{ color: '#F59E0B' }} /> {row.rating_avg || 0}
                    </div>
                    <div className="points-cell" style={{ textAlign: 'right' }}>{row.students_count}</div>
                  </Link>
                )
              }
              const isTeacher = tab === 'teachers'
              const Row = isTeacher ? Link : 'div'
              return (
                <Row key={row.id} {...(isTeacher ? { to: `/teachers/${row.id}` } : {})}
                  className="lb-row" style={{ textDecoration: 'none' }}>
                  <Rank n={rank} />
                  <div className="lb-user">
                    <div className="avatar avatar-blue" style={{ width: 38, height: 38 }}>{row.initials}</div>
                    <div style={{ minWidth: 0 }}>
                      <div className="name">{row.display_name}</div>
                      <div className="meta">{row.city || (isTeacher ? `${row.students_count ?? 0} o'quvchi` : `${row.completed_count ?? 0} kurs tugatilgan`)}</div>
                    </div>
                  </div>
                  <div style={{ fontSize: 14, color: 'var(--text-2)' }}>
                    {isTeacher ? `${row.course_count ?? 0} kurs` : `${row.certificates_count ?? 0} sertifikat`}
                  </div>
                  <div className="points-cell" style={{ textAlign: 'right' }}>
                    {isTeacher
                      ? (Number(row.avg_rating) || 0).toFixed(1)
                      : (row.score ?? 0)}
                  </div>
                </Row>
              )
            })}
          </div>
        )}
        <div style={{ paddingBottom: 80 }}>
          <Pagination page={page} pageSize={PAGE_SIZE} total={total} onChange={setPage} />
        </div>
      </div>
    </Layout>
  )
}
