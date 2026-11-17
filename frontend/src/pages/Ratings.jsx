import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import api from '../api/client'
import Layout from '../components/Layout'
import Icon from '../components/Icon'
import Pagination from '../components/Pagination'

const PAGE_SIZE = 15

const TABS = [
  { id: 'students', label: "O'quvchilar", icon: 'users' },
  { id: 'teachers', label: "O'qituvchilar", icon: 'grad' },
  { id: 'courses', label: 'Kurslar', icon: 'book' },
]

const MEDAL = { 1: '🥇', 2: '🥈', 3: '🥉' }

const styles = `
  .rt-min { min-width: 0; }
  .rt-grow { flex: 1; }
  .rt-page { padding-bottom: 90px; }

  /* ── Hero ── */
  .rt-hero { display: flex; align-items: flex-end; justify-content: space-between; gap: 28px; flex-wrap: wrap; padding: 54px 0 30px; }
  .rt-hero h1 { font-size: 56px; line-height: 1; letter-spacing: -0.045em; margin-top: 18px; }
  .rt-hero p { font-size: 16.5px; color: var(--text-3); margin-top: 14px; max-width: 470px; line-height: 1.55; }
  .rt-tabs { display: flex; gap: 10px; flex-wrap: wrap; }
  .rt-tab {
    display: inline-flex; align-items: center; gap: 9px; height: 50px; padding: 0 18px; border-radius: 16px;
    background: var(--white); border: 2px solid var(--line); font-weight: 700; font-size: 14.5px; color: var(--text);
    transition: transform .14s ease, box-shadow .14s ease, background .14s ease;
  }
  .rt-tab:hover { transform: translate(-2px, -2px); box-shadow: var(--hard); }
  .rt-tab.on { background: var(--sun); color: #14213D; box-shadow: var(--hard); transform: translate(-2px, -2px) rotate(-1.5deg); }

  /* ── Podium ── */
  .rt-podium {
    display: grid; grid-template-columns: 1fr 1.12fr 1fr; gap: 18px; align-items: end;
    padding: 34px 30px 0; margin-bottom: 34px; border-radius: 28px;
    border: 2px solid var(--line); background-color: var(--white); background-image: var(--topo); background-size: 520px 360px;
    box-shadow: var(--hard-lg); overflow: hidden;
  }
  .rt-pod { display: flex; flex-direction: column; align-items: center; text-align: center; min-width: 0; color: inherit; }
  .rt-pod.p1 { order: 2; } .rt-pod.p2 { order: 1; } .rt-pod.p3 { order: 3; }
  .rt-pod-face { position: relative; margin-bottom: 12px; transition: transform .18s ease; }
  a.rt-pod:hover .rt-pod-face { transform: translateY(-5px) rotate(-3deg); }
  .rt-pod-av {
    width: 84px; height: 84px; border-radius: 24px; border: 2px solid var(--line); overflow: hidden;
    display: flex; align-items: center; justify-content: center; color: #14213D;
    font-family: var(--font-display); font-weight: 800; font-size: 28px; letter-spacing: -.03em;
  }
  .rt-pod.p1 .rt-pod-av { width: 108px; height: 108px; border-radius: 30px; font-size: 38px; background: var(--sun); }
  .rt-pod.p2 .rt-pod-av { background: #9DBDFF; } .rt-pod.p3 .rt-pod-av { background: #FF9D88; }
  .rt-pod-medal {
    position: absolute; right: -14px; top: -14px; width: 40px; height: 40px; border-radius: 999px;
    background: var(--white); border: 2px solid var(--line); box-shadow: var(--hard-sm);
    display: flex; align-items: center; justify-content: center; font-size: 21px; transform: rotate(12deg);
  }
  .rt-pod.p1 .rt-pod-medal { width: 48px; height: 48px; font-size: 26px; }
  .rt-pod-name { font-family: var(--font-display); font-weight: 700; font-size: 18px; letter-spacing: -0.03em; line-height: 1.2; max-width: 100%; overflow: hidden; text-overflow: ellipsis; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
  .rt-pod.p1 .rt-pod-name { font-size: 22px; }
  .rt-pod-sub { font-size: 12.5px; color: var(--text-3); margin-top: 3px; font-weight: 600; max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .rt-pod-block {
    width: 100%; margin-top: 16px; border: 2px solid var(--line); border-bottom: none; border-radius: 20px 20px 0 0;
    display: flex; flex-direction: column; align-items: center; justify-content: flex-start; padding: 16px 10px; color: #14213D;
  }
  .rt-pod.p1 .rt-pod-block { height: 170px; background: var(--sun); }
  .rt-pod.p2 .rt-pod-block { height: 124px; background: #9DBDFF; }
  .rt-pod.p3 .rt-pod-block { height: 94px; background: #FF9D88; }
  .rt-pod-val { font-family: var(--font-display); font-weight: 800; font-size: 34px; letter-spacing: -0.05em; line-height: 1; }
  .rt-pod.p1 .rt-pod-val { font-size: 46px; }
  .rt-pod-unit { font-family: var(--font-mono); font-size: 10px; font-weight: 700; letter-spacing: .12em; text-transform: uppercase; margin-top: 6px; opacity: .8; }
  .rt-pod-no { margin-top: auto; font-family: var(--font-display); font-weight: 800; font-size: 26px; opacity: .28; line-height: 1; }

  /* ── Toolbar ── */
  .rt-bar { display: flex; align-items: center; gap: 14px; flex-wrap: wrap; margin-bottom: 18px; }
  .rt-bar h3 { font-size: 24px; letter-spacing: -0.035em; }
  .rt-search { position: relative; margin-left: auto; width: 300px; max-width: 100%; }
  .rt-search > svg { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: var(--text-3); pointer-events: none; }
  .rt-search .input { padding-left: 40px; padding-right: 36px; height: 44px; }
  .rt-search button { position: absolute; right: 8px; top: 50%; transform: translateY(-50%); display: flex; padding: 6px; color: var(--text-3); }
  .rt-search button:hover { color: var(--text); }

  /* ── Route list: a dashed trail with numbered stops ── */
  .rt-route { position: relative; display: flex; flex-direction: column; gap: 10px; }
  .rt-route::before { content: ''; position: absolute; left: 23px; top: 24px; bottom: 24px; border-left: 2px dashed var(--border); }
  .rt-stop { position: relative; display: grid; grid-template-columns: 48px 1fr; gap: 14px; align-items: center; color: inherit; }
  .rt-no {
    position: relative; z-index: 1; width: 48px; height: 48px; border-radius: 999px;
    background: var(--paper); border: 2px solid var(--border); color: var(--text-3);
    display: flex; align-items: center; justify-content: center;
    font-family: var(--font-mono); font-weight: 700; font-size: 13.5px; transition: all .16s ease;
  }
  .rt-no.medal { background: var(--white); border-color: var(--line); font-size: 22px; box-shadow: var(--hard-sm); }
  .rt-card {
    display: grid; grid-template-columns: 1fr auto auto; gap: 18px; align-items: center; min-width: 0;
    background: var(--white); border: 1.5px solid var(--border); border-radius: 18px; padding: 12px 20px 12px 14px;
    transition: border-color .16s ease, box-shadow .16s ease, transform .16s ease;
  }
  .rt-stop:hover .rt-card { border-color: var(--line); box-shadow: var(--hard); transform: translate(-2px, -2px); }
  .rt-stop:hover .rt-no:not(.medal) { background: var(--sun); border-color: var(--line); color: #14213D; }
  .rt-who { display: flex; align-items: center; gap: 12px; min-width: 0; }
  .rt-who .pic { width: 42px; height: 42px; border-radius: 13px; flex-shrink: 0; }
  .rt-who .thumb.pic { aspect-ratio: 1; font-size: 19px; }
  .rt-who .name { font-weight: 700; font-size: 15px; line-height: 1.25; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .rt-who .meta { font-size: 12.5px; color: var(--text-3); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .rt-extra { font-family: var(--font-mono); font-size: 11.5px; font-weight: 600; color: var(--text-3); letter-spacing: .03em; white-space: nowrap; display: inline-flex; align-items: center; gap: 5px; }
  .rt-extra svg { color: #F5A300; }
  .rt-val { min-width: 76px; text-align: right; font-family: var(--font-display); font-weight: 800; font-size: 22px; letter-spacing: -0.04em; line-height: 1; }
  .rt-val small { display: block; font-family: var(--font-mono); font-size: 9.5px; font-weight: 600; letter-spacing: .12em; text-transform: uppercase; color: var(--text-4); margin-top: 4px; }

  @media (max-width: 768px) {
    .rt-hero { padding: 30px 0 22px; }
    .rt-hero h1 { font-size: 36px; }
    .rt-tabs { gap: 8px; width: 100%; }
    .rt-tab { height: 44px; padding: 0 13px; font-size: 13.5px; border-radius: 14px; flex: 1; justify-content: center; }
    .rt-tab svg { display: none; }
    .rt-podium { padding: 22px 12px 0; gap: 8px; box-shadow: var(--hard); border-radius: 22px; }
    .rt-pod-av { width: 58px; height: 58px; border-radius: 18px; font-size: 20px; }
    .rt-pod.p1 .rt-pod-av { width: 72px; height: 72px; border-radius: 22px; font-size: 26px; }
    .rt-pod-medal, .rt-pod.p1 .rt-pod-medal { width: 32px; height: 32px; font-size: 17px; right: -10px; top: -10px; }
    .rt-pod-name, .rt-pod.p1 .rt-pod-name { font-size: 14px; }
    .rt-pod-sub { display: none; }
    .rt-pod-val { font-size: 24px; } .rt-pod.p1 .rt-pod-val { font-size: 30px; }
    .rt-pod.p1 .rt-pod-block { height: 136px; } .rt-pod.p2 .rt-pod-block { height: 104px; } .rt-pod.p3 .rt-pod-block { height: 84px; }
    .rt-search { width: 100%; margin-left: 0; }
    .rt-route::before { left: 18px; }
    .rt-stop { grid-template-columns: 38px 1fr; gap: 10px; }
    .rt-no { width: 38px; height: 38px; font-size: 12px; }
    .rt-no.medal { font-size: 18px; }
    .rt-card { grid-template-columns: 1fr auto; gap: 10px; padding: 11px 14px 11px 11px; }
    .rt-extra { display: none; }
    .rt-val { min-width: 0; font-size: 19px; }
  }
`

/* Presentation-only view of one leaderboard row, shared by podium + list. */
function describe(tab, row) {
  if (tab === 'courses') {
    return {
      to: `/courses/${row.slug}`,
      name: row.title,
      meta: row.teacher?.display_name,
      extra: <><Icon name="starF" size={13} /> {row.rating_avg || 0}</>,
      value: row.students_count,
      unit: "O'quvchi",
      pic: <div className={`thumb thumb-${row.thumb_color} pic`}>{row.thumb_emoji}</div>,
      face: row.thumb_emoji,
    }
  }
  const isTeacher = tab === 'teachers'
  return {
    to: isTeacher ? `/teachers/${row.id}` : null,
    name: row.display_name,
    meta: row.city || (isTeacher ? `${row.students_count ?? 0} o'quvchi` : `${row.completed_count ?? 0} kurs tugatilgan`),
    extra: isTeacher ? `${row.course_count ?? 0} kurs` : `${row.certificates_count ?? 0} sertifikat`,
    value: isTeacher ? (Number(row.avg_rating) || 0).toFixed(1) : (row.score ?? 0),
    unit: isTeacher ? 'Reyting' : 'Ball',
    pic: <div className="avatar avatar-blue pic">{row.initials}</div>,
    face: row.initials,
  }
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

  // First page without a search: the first three climb the podium, the rest follow the trail.
  const podium = !q && page === 1 && data.length >= 3 ? data.slice(0, 3) : []
  const trail = data.slice(podium.length)

  return (
    <Layout>
      <style>{styles}</style>
      <div className="container rt-page">
        <header className="rt-hero">
          <div className="fade-up">
            <span className="eyebrow">Reyting</span>
            <h1>Cho'qqiga kim <span className="mark-sun">birinchi</span>?</h1>
            <p>Eng faol o'quvchilar, o'qituvchilar va mashhur kurslar</p>
          </div>
          <div className="rt-tabs fade-up-d1" role="tablist">
            {TABS.map(t => (
              <button key={t.id} type="button" role="tab" aria-selected={tab === t.id}
                className={`rt-tab ${tab === t.id ? 'on' : ''}`} onClick={() => setTab(t.id)}>
                <Icon name={t.icon} size={17} /> {t.label}
              </button>
            ))}
          </div>
        </header>

        {!isLoading && podium.length === 3 && (
          <div className="rt-podium fade-up">
            {podium.map(({ row }, i) => {
              const d = describe(tab, row)
              const Box = d.to ? Link : 'div'
              return (
                <Box key={row.id} {...(d.to ? { to: d.to } : {})} className={`rt-pod p${i + 1}`}>
                  <div className="rt-pod-face">
                    <div className="rt-pod-av">{d.face}</div>
                    <span className="rt-pod-medal">{MEDAL[i + 1]}</span>
                  </div>
                  <div className="rt-pod-name">{d.name}</div>
                  <div className="rt-pod-sub">{d.meta}</div>
                  <div className="rt-pod-block">
                    <div className="rt-pod-val">{d.value}</div>
                    <div className="rt-pod-unit">{d.unit}</div>
                    <div className="rt-pod-no">{i + 1}</div>
                  </div>
                </Box>
              )
            })}
          </div>
        )}

        <div className="rt-bar">
          <h3>{q ? 'Qidiruv natijalari' : "To'liq jadval"}</h3>
          <span className="coord">TOPILDI: {total}</span>
          <div className="rt-search">
            <Icon name="search" size={16} />
            <input className="input" value={search} onChange={e => setSearch(e.target.value)}
              placeholder={tab === 'courses' ? 'Kurs qidirish…' : "Ism bo'yicha qidirish…"} aria-label="Qidirish" />
            {search && <button type="button" onClick={() => setSearch('')} title="Tozalash"><Icon name="x" size={14} /></button>}
          </div>
        </div>

        {isLoading ? (
          <div className="loading-state"><span className="spinner" />Yuklanmoqda…</div>
        ) : data.length === 0 ? (
          <div className="card">
            <div className="empty-state">
              <div className="es-ico"><Icon name="trophy" size={22} /></div>
              <div className="es-title">{q ? 'Hech narsa topilmadi' : "Hozircha ma'lumotlar yo'q"}</div>
              <div className="es-sub">{q ? `"${search}" bo'yicha hech narsa topilmadi` : "Birinchi natijalar paydo bo'lishi bilan jadval to'ladi."}</div>
            </div>
          </div>
        ) : trail.length > 0 && (
          <div className="rt-route fade-up">
            {trail.map(({ row, rank }) => {
              const d = describe(tab, row)
              const Row = d.to ? Link : 'div'
              return (
                <Row key={row.id} {...(d.to ? { to: d.to } : {})} className="rt-stop">
                  <span className={`rt-no ${rank <= 3 ? 'medal' : ''}`}>{rank <= 3 ? MEDAL[rank] : rank}</span>
                  <div className="rt-card">
                    <div className="rt-who">
                      {d.pic}
                      <div className="rt-min">
                        <div className="name">{d.name}</div>
                        <div className="meta">{d.meta}</div>
                      </div>
                    </div>
                    <div className="rt-extra">{d.extra}</div>
                    <div className="rt-val">{d.value}<small>{d.unit}</small></div>
                  </div>
                </Row>
              )
            })}
          </div>
        )}
        <Pagination page={page} pageSize={PAGE_SIZE} total={total} onChange={setPage} />
      </div>
    </Layout>
  )
}
