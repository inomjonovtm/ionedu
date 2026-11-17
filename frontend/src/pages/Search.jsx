import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import api from '../api/client'
import Layout from '../components/Layout'
import Icon from '../components/Icon'
import Pagination from '../components/Pagination'

const PAGE_SIZE = 10

const TABS = [
  { id: 'courses', label: 'Kurslar', icon: 'book' },
  { id: 'tests', label: 'Testlar', icon: 'fileText' },
  { id: 'teachers', label: "O'qituvchilar", icon: 'grad' },
  { id: 'resources', label: 'Resurslar', icon: 'folder' },
]

const SUGGEST = ['Materiklar', 'Iqlim', "O'zbekiston", 'Okeanlar', 'Xaritalar', 'Aholi']

const css = `
  .sr-hero { position: relative; padding: 46px 0 30px; }
  .sr-hero::before {
    content: ''; position: absolute; top: 0; bottom: 0; right: 0; width: min(520px, 55%);
    background-image: var(--topo); background-size: 520px 360px;
    -webkit-mask-image: linear-gradient(to left, #000 15%, transparent);
    mask-image: linear-gradient(to left, #000 15%, transparent);
    pointer-events: none;
  }
  .sr-hero > * { position: relative; }
  .sr-top { display: flex; align-items: center; gap: 14px; margin-bottom: 18px; }
  .sr-top i { flex: 1; border-top: 2px dashed var(--border); }
  .sr-title { font-size: 56px; letter-spacing: -0.045em; line-height: 1; margin-bottom: 26px; }
  .sr-form {
    display: flex; align-items: center; gap: 10px; max-width: 760px;
    background: var(--white); border: 2px solid var(--line); border-radius: 20px;
    box-shadow: var(--hard); padding: 8px 8px 8px 18px;
    transition: box-shadow .15s ease, transform .15s ease;
  }
  .sr-form:focus-within { box-shadow: 6px 6px 0 var(--sun); transform: translate(-1px, -1px); }
  .sr-form > svg { color: var(--text-3); flex-shrink: 0; }
  .sr-form input { flex: 1; min-width: 0; height: 50px; border: none; outline: none; background: none; font-size: 18px; font-weight: 600; color: var(--text); }
  .sr-form input::placeholder { color: var(--text-4); font-weight: 500; }
  .sr-form .btn { height: 50px; flex-shrink: 0; }
  .sr-sum { margin-top: 18px; font-size: 14.5px; font-weight: 500; color: var(--text-3); }
  .sr-sum strong { color: var(--text); font-weight: 800; }
  .sr-quick { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; margin-top: 18px; }
  .sr-quick .ql { font-family: var(--font-mono); font-size: 10.5px; font-weight: 600; letter-spacing: .1em; text-transform: uppercase; color: var(--text-4); margin-right: 4px; }
  .sr-quick .chip { cursor: pointer; }

  .sr-wrap { display: grid; grid-template-columns: 232px minmax(0, 1fr); gap: 32px; align-items: start; padding: 10px 0 80px; }
  .sr-nav { position: sticky; top: 96px; display: flex; flex-direction: column; gap: 6px; min-width: 0; }
  .sr-tab {
    display: flex; align-items: center; gap: 10px; width: 100%; text-align: left;
    padding: 10px 12px; border-radius: 15px; border: 1.5px solid transparent;
    font-size: 14.5px; font-weight: 700; color: var(--text-2);
    transition: background .13s ease, border-color .13s ease, transform .13s ease, box-shadow .13s ease;
  }
  .sr-tab:hover { background: var(--bg-soft); color: var(--text); }
  .sr-tab.on { background: var(--white); border-color: var(--line); color: var(--text); box-shadow: var(--hard-sm); transform: translate(-1px, -1px); }
  .sr-tab .ti { width: 32px; height: 32px; border-radius: 10px; background: var(--bg-soft); display: flex; align-items: center; justify-content: center; flex-shrink: 0; color: var(--text-2); }
  .sr-tab.on .ti { background: var(--sun); color: #14213D; }
  .sr-tab .lb { flex: 1; min-width: 0; }
  .sr-tab .n { font-family: var(--font-mono); font-size: 11px; font-weight: 600; color: var(--text-3); }
  .sr-tab.on .n { color: var(--text); }

  .sr-list { display: flex; flex-direction: column; gap: 12px; min-width: 0; }
  .sr-item {
    display: grid; grid-template-columns: auto minmax(0, 1fr) auto; align-items: center; gap: 18px;
    background: var(--white); border: 1.5px solid var(--border); border-radius: 20px; padding: 14px 18px 14px 14px;
    transition: border-color .16s ease, box-shadow .16s ease, transform .16s ease;
  }
  a.sr-item:hover { border-color: var(--line); box-shadow: var(--hard); transform: translate(-2px, -2px); }
  .sr-item .sr-thumb { width: 112px; aspect-ratio: 4 / 3; border-radius: 14px; font-size: 34px; }
  .sr-ico { width: 60px; height: 60px; border-radius: 17px; display: flex; align-items: center; justify-content: center; border: 1.5px solid #14213D; color: #14213D; transform: rotate(-4deg); }
  .sr-ico.sea { background: #9DBDFF; } .sr-ico.coral { background: #FF9D88; }
  .sr-item .avatar { width: 60px; height: 60px; font-size: 20px; border: 1.5px solid var(--line); }
  .sr-kind { font-family: var(--font-mono); font-size: 10.5px; font-weight: 600; letter-spacing: .1em; text-transform: uppercase; color: var(--text-3); }
  .sr-item h3 { font-size: 18px; letter-spacing: -0.025em; line-height: 1.25; margin: 4px 0; overflow-wrap: anywhere; }
  .sr-item p { font-size: 13.5px; line-height: 1.5; color: var(--text-3); display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
  .sr-go { width: 36px; height: 36px; border-radius: 12px; border: 1.5px solid var(--border); display: flex; align-items: center; justify-content: center; color: var(--text-2); transition: background .15s ease, border-color .15s ease, color .15s ease; }
  a.sr-item:hover .sr-go { background: var(--sun); border-color: #14213D; color: #14213D; }

  .sr-empty { background: var(--white); border: 1.5px solid var(--border); border-radius: var(--r-card); }
  .sr-idle { padding: 20px 0 90px; }
  .sr-idle .sr-empty { border-style: dashed; background: none; }

  @media (max-width: 900px) {
    .sr-wrap { grid-template-columns: minmax(0, 1fr); gap: 16px; }
    .sr-nav { position: static; flex-direction: row; overflow-x: auto; padding: 3px 3px 6px; scrollbar-width: none; }
    .sr-nav::-webkit-scrollbar { display: none; }
    .sr-tab { width: auto; flex-shrink: 0; padding: 6px 12px 6px 6px; border-color: var(--border); background: var(--white); }
    .sr-tab .ti { width: 28px; height: 28px; border-radius: 9px; }
  }
  @media (max-width: 768px) {
    .sr-hero { padding: 28px 0 20px; }
    .sr-title { font-size: 36px; margin-bottom: 18px; }
    .sr-form { padding: 6px 6px 6px 14px; border-radius: 17px; }
    .sr-form input { height: 44px; font-size: 16px; }
    .sr-form .btn { height: 44px; padding: 0 14px; }
    .sr-item { gap: 12px; padding: 12px; border-radius: 18px; }
    .sr-item .sr-thumb { width: 76px; font-size: 26px; }
    .sr-ico, .sr-item .avatar { width: 48px; height: 48px; border-radius: 14px; font-size: 16px; }
    .sr-item .avatar { border-radius: 999px; }
    .sr-item h3 { font-size: 16px; }
    .sr-go { display: none; }
  }
`

export default function Search() {
  const [sp, setSp] = useSearchParams()
  const q = sp.get('q') || ''
  const [input, setInput] = useState(q)
  const [tab, setTab] = useState('courses')
  const [page, setPage] = useState(1)

  useEffect(() => { setPage(1) }, [tab, q])

  const { data, isLoading } = useQuery({
    queryKey: ['search', q],
    queryFn: () => api.get(`/search/?q=${encodeURIComponent(q)}`).then(r => r.data),
    enabled: !!q,
  })

  function submit(e) {
    e.preventDefault()
    setSp({ q: input })
  }

  const lists = data || { courses: [], teachers: [], resources: [], tests: [] }
  const counts = {
    courses: lists.courses?.length || 0,
    tests: lists.tests?.length || 0,
    teachers: lists.teachers?.length || 0,
    resources: lists.resources?.length || 0,
  }
  const activeList = lists[tab] || []
  const pageList = activeList.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const totalFound = counts.courses + counts.tests + counts.teachers + counts.resources

  return (
    <Layout>
      <style>{css}</style>
      <div className="container">
        <div className="sr-hero">
          <div className="sr-top">
            <span className="eyebrow">Qidiruv</span>
            <i aria-hidden="true" />
            <span className="coord">41.31°N · 69.24°E</span>
          </div>
          <h1 className="sr-title fade-up">Nimani <span className="mark-sun">izlaymiz?</span></h1>
          <form onSubmit={submit} className="sr-form fade-up-d1" role="search">
            <Icon name="search" size={22} />
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Kurs, test, o'qituvchi, resurs…"
              aria-label="Qidirish"
            />
            <button type="submit" className="btn btn-primary">Izlash</button>
          </form>
          {q && !isLoading ? (
            <div className="sr-sum">
              <strong>“{q}”</strong> bo'yicha <strong>{totalFound}</strong> ta natija
            </div>
          ) : !q && (
            <div className="sr-quick">
              <span className="ql">Tez qidiruv</span>
              {SUGGEST.map(s => (
                <button key={s} type="button" className="chip" onClick={() => { setInput(s); setSp({ q: s }) }}>{s}</button>
              ))}
            </div>
          )}
        </div>

        {!q && (
          <div className="sr-idle">
            <div className="sr-empty empty-state">
              <div className="es-ico"><Icon name="compass" size={24} /></div>
              <div className="es-title">Xaritadan joy tanlang</div>
              <div className="es-sub">Kalit so'zni yozing — kurslar, testlar, o'qituvchilar va resurslar orasidan topamiz.</div>
            </div>
          </div>
        )}

        {q && isLoading && <div className="loading-state"><span className="spinner" />Qidirilmoqda…</div>}

        {q && !isLoading && (
          <div className="sr-wrap">
            <div className="sr-nav" role="tablist" aria-label="Natija turlari">
              {TABS.map(t => (
                <button key={t.id} type="button" role="tab" aria-selected={tab === t.id}
                  onClick={() => setTab(t.id)} className={`sr-tab ${tab === t.id ? 'on' : ''}`}>
                  <span className="ti"><Icon name={t.icon} size={16} /></span>
                  <span className="lb">{t.label}</span>
                  <span className="n">{counts[t.id]}</span>
                </button>
              ))}
            </div>

            <div className="sr-list">
              {activeList.length === 0 && (
                <div className="sr-empty empty-state">
                  <div className="es-ico"><Icon name="search" size={22} /></div>
                  <div className="es-title">Natija yo'q</div>
                  <div className="es-sub">Bu bo'limda hech narsa topilmadi. Boshqa so'z bilan urinib ko'ring.</div>
                </div>
              )}

              {tab === 'tests' && pageList.map(t => (
                <Link key={t.id} to="/tests" className="sr-item">
                  <div className="sr-ico sea"><Icon name="fileText" size={24} /></div>
                  <div>
                    <span className="sr-kind">Test{t.category ? ` · ${t.category.name}` : ''}</span>
                    <h3>{t.title}</h3>
                    <p>{t.question_count} savol · o'tish bali {t.pass_percent}%{t.time_limit_minutes ? ` · ${t.time_limit_minutes} daq` : ''}</p>
                  </div>
                  <span className="sr-go"><Icon name="arrowR" size={16} /></span>
                </Link>
              ))}

              {tab === 'courses' && pageList.map(c => (
                <Link key={c.id} to={`/courses/${c.slug}`} className="sr-item">
                  <div className={`thumb thumb-${c.thumb_color || 'blue'} sr-thumb`}><span>{c.thumb_emoji || '🌍'}</span></div>
                  <div>
                    <span className="sr-kind">Kurs{c.category ? ` · ${c.category.name}` : ''}</span>
                    <h3>{c.title}</h3>
                    <p>{c.description?.slice(0, 140)}</p>
                  </div>
                  <span className="sr-go"><Icon name="arrowR" size={16} /></span>
                </Link>
              ))}

              {tab === 'teachers' && pageList.map(t => (
                <Link key={t.id} to={`/teachers/${t.id}`} className="sr-item">
                  <div className="avatar avatar-amber">{t.initials}</div>
                  <div>
                    <span className="sr-kind">O'qituvchi</span>
                    <h3>{t.display_name}</h3>
                    <p>{t.bio?.slice(0, 120)}</p>
                  </div>
                  <span className="sr-go"><Icon name="arrowR" size={16} /></span>
                </Link>
              ))}

              {tab === 'resources' && pageList.map(r => (
                <div key={r.id} className="sr-item">
                  <div className="sr-ico coral"><Icon name="folder" size={24} /></div>
                  <div>
                    <span className="sr-kind">Resurs</span>
                    <h3>{r.title}</h3>
                    <p>{r.description?.slice(0, 140)}</p>
                  </div>
                </div>
              ))}

              <Pagination page={page} pageSize={PAGE_SIZE} total={activeList.length} onChange={setPage} />
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
