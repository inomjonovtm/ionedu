import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import api, { absUrl } from '../api/client'
import Layout from '../components/Layout'
import Icon from '../components/Icon'
import Pagination from '../components/Pagination'

const PAGE_SIZE = 12

const TONES = ['sun', 'sea', 'leaf', 'coral', 'violet']

const css = `
  .tc-min { min-width: 0; }
  .tc-grow { flex: 1; }
  .tch-page { padding-bottom: 90px; }

  /* ── Hero: headline left, search "sticker" right ── */
  .tch-hero { display: grid; grid-template-columns: 1.25fr 1fr; gap: 40px; align-items: end; padding: 54px 0 36px; }
  .tch-hero h1 { font-size: 56px; line-height: 1; letter-spacing: -0.045em; margin-top: 18px; }
  .tch-hero p { font-size: 16.5px; color: var(--text-3); margin-top: 16px; max-width: 480px; line-height: 1.55; }
  .tch-find {
    background: var(--white); border: 2px solid var(--line); border-radius: 22px;
    box-shadow: var(--hard); padding: 18px; transform: rotate(.6deg);
  }
  .tch-find-top { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-bottom: 12px; }
  .tch-find-top .lbl { font-family: var(--font-mono); font-size: 10.5px; font-weight: 600; letter-spacing: .12em; text-transform: uppercase; color: var(--text-3); }
  .tch-find-top .cnt { font-family: var(--font-mono); font-size: 11px; font-weight: 700; background: var(--sun); color: #14213D; border-radius: 999px; padding: 2px 10px; }
  .tch-search { position: relative; }
  .tch-search > svg { position: absolute; left: 15px; top: 50%; transform: translateY(-50%); color: var(--text-3); pointer-events: none; }
  .tch-search .input { height: 50px; padding-left: 44px; padding-right: 40px; font-weight: 600; }
  .tch-search button { position: absolute; right: 10px; top: 50%; transform: translateY(-50%); display: flex; padding: 6px; color: var(--text-3); border-radius: 8px; }
  .tch-search button:hover { color: var(--text); background: var(--bg-soft); }
  .tch-find .hint { font-size: 12.5px; color: var(--text-3); margin-top: 12px; display: flex; align-items: center; gap: 7px; }

  /* ── Feature: the top-rated teacher ── */
  .tch-feature {
    display: grid; grid-template-columns: 220px 1fr auto; gap: 30px; align-items: center;
    background: var(--sun); color: #14213D; border: 2px solid var(--line); border-radius: 26px;
    box-shadow: var(--hard-lg); padding: 26px 30px; margin-bottom: 30px; position: relative; overflow: hidden;
    background-image: var(--topo); background-size: 520px 360px;
    transition: transform .16s ease, box-shadow .16s ease;
  }
  .tch-feature:hover { transform: translate(-2px, -2px); }
  .tch-feature .ph {
    width: 220px; aspect-ratio: 1; border-radius: 22px; overflow: hidden; border: 2px solid #14213D;
    background: #fff; color: #14213D; transform: rotate(-3deg);
    display: flex; align-items: center; justify-content: center;
    font-family: var(--font-display); font-weight: 800; font-size: 72px; letter-spacing: -.04em;
  }
  .tch-feature .ph img { width: 100%; height: 100%; object-fit: cover; }
  .tch-feature .kick { font-family: var(--font-mono); font-size: 11px; font-weight: 700; letter-spacing: .12em; text-transform: uppercase; }
  .tch-feature h2 { font-size: 40px; letter-spacing: -0.04em; line-height: 1.02; color: #14213D; margin: 10px 0 8px; }
  .tch-feature .spec { font-size: 15.5px; font-weight: 600; opacity: .8; max-width: 460px; line-height: 1.5; }
  .tch-feature .nums { display: flex; gap: 10px; flex-wrap: wrap; margin-top: 20px; }
  .tch-feature .nums span {
    display: inline-flex; align-items: center; gap: 7px; height: 36px; padding: 0 14px;
    background: #fff; color: #14213D; border: 1.5px solid #14213D; border-radius: 999px; font-size: 13.5px; font-weight: 700;
  }
  .tch-feature .go {
    width: 58px; height: 58px; border-radius: 18px; background: #14213D; color: #fff;
    display: flex; align-items: center; justify-content: center; flex-shrink: 0;
  }

  /* ── Directory: horizontal "passport" rows in two columns ── */
  .tch-list-head { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; margin-bottom: 16px; }
  .tch-list-head h3 { font-size: 24px; letter-spacing: -0.035em; }
  .tch-list { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  .tch-row {
    display: grid; grid-template-columns: 84px 1fr; gap: 18px; align-items: center;
    background: var(--white); border: 1.5px solid var(--border); border-radius: 22px; padding: 16px 18px 16px 16px;
    transition: border-color .16s ease, box-shadow .16s ease, transform .16s ease;
  }
  .tch-row:hover { border-color: var(--line); box-shadow: var(--hard); transform: translate(-2px, -2px); }
  .tch-av {
    width: 84px; height: 84px; border-radius: 20px; overflow: hidden; border: 1.5px solid var(--line); color: #14213D;
    display: flex; align-items: center; justify-content: center;
    font-family: var(--font-display); font-weight: 800; font-size: 26px; letter-spacing: -.03em;
    transition: transform .2s ease;
  }
  .tch-row:hover .tch-av { transform: rotate(-4deg); }
  .tch-av img { width: 100%; height: 100%; object-fit: cover; }
  .tch-av.sun { background: var(--sun); } .tch-av.sea { background: #9DBDFF; } .tch-av.leaf { background: #8FE0B4; }
  .tch-av.coral { background: #FF9D88; } .tch-av.violet { background: #C4B6FF; }
  .tch-main { min-width: 0; }
  .tch-top { display: flex; align-items: center; gap: 10px; }
  .tch-name { font-family: var(--font-display); font-size: 19px; font-weight: 700; letter-spacing: -0.03em; line-height: 1.2; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .tch-rate { margin-left: auto; flex-shrink: 0; display: inline-flex; align-items: center; gap: 5px; font-family: var(--font-mono); font-size: 12px; font-weight: 700; background: var(--sun-soft); color: var(--text); border-radius: 8px; padding: 3px 8px; }
  .tch-rate svg { color: #F5A300; }
  .tch-spec { font-size: 13.5px; color: var(--text-3); margin-top: 4px; line-height: 1.45; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
  .tch-meta { display: flex; align-items: center; gap: 14px; margin-top: 12px; padding-top: 11px; border-top: 1.5px dashed var(--border); font-family: var(--font-mono); font-size: 11px; font-weight: 600; letter-spacing: .06em; text-transform: uppercase; color: var(--text-3); }
  .tch-meta b { color: var(--text); font-weight: 700; font-size: 13px; margin-right: 4px; }
  .tch-meta .arr { margin-left: auto; color: var(--text-4); display: flex; transition: transform .16s ease, color .16s ease; }
  .tch-row:hover .tch-meta .arr { color: var(--text); transform: translateX(3px); }

  @media (max-width: 980px) {
    .tch-hero { grid-template-columns: 1fr; gap: 24px; align-items: start; }
    .tch-feature { grid-template-columns: 150px 1fr; }
    .tch-feature .ph { width: 150px; font-size: 52px; }
    .tch-feature .go { display: none; }
    .tch-feature h2 { font-size: 32px; }
  }
  @media (max-width: 768px) {
    .tch-hero { padding: 30px 0 24px; }
    .tch-hero h1 { font-size: 36px; }
    .tch-find { transform: none; }
    .tch-list { grid-template-columns: 1fr; }
    .tch-feature { grid-template-columns: 1fr; gap: 18px; padding: 22px; box-shadow: var(--hard); }
    .tch-feature .ph { width: 110px; font-size: 38px; border-radius: 18px; }
    .tch-feature h2 { font-size: 28px; }
  }
  @media (max-width: 420px) {
    .tch-row { grid-template-columns: 64px 1fr; gap: 14px; padding: 14px; }
    .tch-av { width: 64px; height: 64px; border-radius: 16px; font-size: 20px; }
  }
`

function spec(t, n = 90) {
  return t.specialty || t.bio?.slice(0, n) || "Geografiya o'qituvchisi"
}

export default function Teachers() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')

  useEffect(() => { setPage(1) }, [search])

  const { data: allData = [], isLoading } = useQuery({
    queryKey: ['teachers-all'],
    queryFn: () => api.get('/teachers/?page_size=200').then(r => r.data.results || r.data),
  })

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    const base = q
      ? allData.filter(t =>
        (t.full_name || '').toLowerCase().includes(q)
        || (t.display_name || '').toLowerCase().includes(q)
        || (t.bio || '').toLowerCase().includes(q)
        || (t.email || '').toLowerCase().includes(q))
      : allData
    // Eng yuqori reytingdagi o'qituvchilar birinchi
    return [...base].sort((a, b) =>
      (b.avg_rating ?? 0) - (a.avg_rating ?? 0)
      || (b.students_count ?? 0) - (a.students_count ?? 0))
  }, [allData, search])

  const total = filtered.length
  const data = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  // The top-rated teacher gets the big sticker on the first, unfiltered page.
  const showFeature = page === 1 && !search.trim() && data.length > 1
  const feature = showFeature ? data[0] : null
  const list = showFeature ? data.slice(1) : data

  return (
    <Layout>
      <style>{css}</style>
      <div className="container tch-page">
        <header className="tch-hero">
          <div className="fade-up">
            <span className="eyebrow">O'qituvchilar</span>
            <h1>Yo'l ko'rsatuvchi <span className="mark-sun">ustozlar</span></h1>
            <p>Geografiyani sevdirib o'rgatadigan mutaxassislar. Eng yuqori reytingdagilar ro'yxat boshida.</p>
          </div>
          <div className="tch-find fade-up-d1">
            <div className="tch-find-top">
              <span className="lbl">Ustoz qidirish</span>
              <span className="cnt">{total} ta</span>
            </div>
            <div className="tch-search">
              <Icon name="search" size={17} />
              <input className="input" value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Ism yoki soha bo'yicha…" aria-label="O'qituvchi qidirish" />
              {search && (
                <button type="button" onClick={() => setSearch('')} title="Tozalash"><Icon name="x" size={15} /></button>
              )}
            </div>
            <div className="hint"><Icon name="compass" size={14} /> {total} ta mutaxassis · reyting bo'yicha saralangan</div>
          </div>
        </header>

        {isLoading ? (
          <div className="loading-state"><span className="spinner" />Yuklanmoqda…</div>
        ) : total === 0 ? (
          <div className="card">
            <div className="empty-state">
              <div className="es-ico"><Icon name="grad" size={22} /></div>
              <div className="es-title">{search ? "O'qituvchi topilmadi" : "Hozircha o'qituvchilar yo'q"}</div>
              <div className="es-sub">
                {search ? `"${search}" bo'yicha hech kim chiqmadi. Boshqa so'z bilan urinib ko'ring.` : "Tez orada bu yerda ustozlar paydo bo'ladi."}
              </div>
              {search && <button className="btn btn-secondary btn-sm" onClick={() => setSearch('')}>Qidiruvni tozalash</button>}
            </div>
          </div>
        ) : (
          <>
            {feature && (
              <Link to={`/teachers/${feature.id}`} className="tch-feature fade-up">
                <div className="ph">
                  {feature.avatar ? <img src={absUrl(feature.avatar)} alt={feature.display_name} /> : feature.initials}
                </div>
                <div className="tc-min">
                  <div className="kick">№ 1 · Eng yuqori reyting</div>
                  <h2>{feature.display_name}</h2>
                  <div className="spec">{spec(feature, 140)}</div>
                  <div className="nums">
                    <span><Icon name="starF" size={14} /> {(feature.avg_rating ?? 0).toFixed(1)}</span>
                    <span><Icon name="book" size={14} /> {feature.course_count ?? 0} kurs</span>
                    <span><Icon name="users" size={14} /> {feature.students_count ?? 0} o'quvchi</span>
                  </div>
                </div>
                <span className="go"><Icon name="arrowR" size={24} /></span>
              </Link>
            )}

            <div className="tch-list-head">
              <h3>{search.trim() ? 'Qidiruv natijalari' : 'Barcha ustozlar'}</h3>
              <span className="coord">{(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} / {total}</span>
            </div>

            <div className="tch-list">
              {list.map((t, i) => (
                <Link key={t.id} to={`/teachers/${t.id}`} className="tch-row">
                  <div className={`tch-av ${TONES[i % TONES.length]}`}>
                    {t.avatar ? <img src={absUrl(t.avatar)} alt={t.display_name} /> : t.initials}
                  </div>
                  <div className="tch-main">
                    <div className="tch-top">
                      <div className="tch-name">{t.display_name}</div>
                      <span className="tch-rate"><Icon name="starF" size={12} /> {(t.avg_rating ?? 0).toFixed(1)}</span>
                    </div>
                    <div className="tch-spec">{spec(t, 64)}</div>
                    <div className="tch-meta">
                      <span><b>{t.course_count ?? 0}</b>Kurs</span>
                      <span><b>{t.students_count ?? 0}</b>O'quvchi</span>
                      <span className="arr"><Icon name="arrowR" size={16} /></span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
        <Pagination page={page} pageSize={PAGE_SIZE} total={total} onChange={setPage} />
      </div>
    </Layout>
  )
}
