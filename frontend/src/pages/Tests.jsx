import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import api from '../api/client'
import Layout from '../components/Layout'
import Icon from '../components/Icon'
import Pagination from '../components/Pagination'
import FilterBar from '../components/FilterBar'
import PageHeader from '../components/PageHeader'
import { useAuth } from '../store/auth'

const PAGE_SIZE = 12

const STEPS = [
  { n: '01', t: 'Testni tanlang', s: "Mavzu yoki kategoriya bo'yicha" },
  { n: '02', t: 'Savollarga javob bering', s: 'Vaqtni kuzatib boring' },
  { n: '03', t: 'Natijani oling', s: 'U profilingizda saqlanadi' },
]

const styles = `
  .tq-body { padding-bottom: 80px; }

  /* How it works — three stops on a route */
  .tq-steps { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 0; margin-bottom: 28px; position: relative; }
  .tq-steps::before { content: ''; position: absolute; left: 20px; right: 20px; top: 21px; border-top: 2px dashed var(--border); }
  .tq-step { position: relative; display: flex; gap: 12px; align-items: flex-start; padding-right: 16px; min-width: 0; }
  .tq-step .n {
    width: 44px; height: 44px; border-radius: 14px; flex-shrink: 0;
    background: var(--white); border: 2px solid var(--line); color: var(--text);
    display: flex; align-items: center; justify-content: center;
    font-family: var(--font-mono); font-size: 12.5px; font-weight: 600;
  }
  .tq-step:first-child .n { background: var(--sun); color: #14213D; border-color: #14213D; transform: rotate(-5deg); }
  .tq-step .tx { background: var(--paper); padding: 0 10px 0 0; min-width: 0; }
  .tq-step .t { font-family: var(--font-display); font-weight: 700; font-size: 16px; letter-spacing: -0.02em; line-height: 1.25; }
  .tq-step .s { font-size: 13px; color: var(--text-3); margin-top: 2px; }

  /* Ticket cards */
  .tq-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 22px; }
  .tq {
    display: grid; grid-template-columns: 132px minmax(0, 1fr); min-width: 0;
    background: var(--white); border: 1.5px solid var(--border); border-radius: var(--r-card); overflow: hidden;
    transition: border-color .16s ease, box-shadow .16s ease, transform .16s ease;
  }
  .tq:hover { border-color: var(--line); box-shadow: var(--shadow-hover); transform: translate(-3px, -3px); }
  .tq-stub {
    position: relative; display: flex; flex-direction: column; justify-content: space-between; gap: 14px;
    padding: 18px 16px; color: #14213D; border-right: 2px dashed #14213D;
  }
  .tq-stub.c0 { background: var(--sun); } .tq-stub.c1 { background: #9DBDFF; } .tq-stub.c2 { background: #8FE0B4; }
  .tq-stub.c3 { background: #FF9D88; } .tq-stub.c4 { background: #C4B6FF; }
  .tq-stub .lb { font-family: var(--font-mono); font-size: 10px; font-weight: 600; letter-spacing: .12em; text-transform: uppercase; }
  .tq-stub .q { font-family: var(--font-display); font-size: 58px; font-weight: 800; letter-spacing: -0.06em; line-height: .9; }
  .tq-stub .ql { font-size: 13px; font-weight: 700; margin-top: 4px; }
  .tq-stub .tm { display: inline-flex; align-items: center; gap: 5px; font-family: var(--font-mono); font-size: 11px; font-weight: 600; white-space: nowrap; }

  .tq-main { display: flex; flex-direction: column; padding: 18px 20px 18px; min-width: 0; }
  .tq-cat { font-family: var(--font-mono); font-size: 10.5px; font-weight: 600; letter-spacing: .1em; text-transform: uppercase; color: var(--text-3); margin-bottom: 7px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .tq-title { font-size: 19px; line-height: 1.22; letter-spacing: -0.03em; overflow-wrap: anywhere; }
  .tq-desc {
    font-size: 13.5px; color: var(--text-3); line-height: 1.55; margin-top: 8px;
    display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
  }
  .tq-meta { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 12px; }
  .tq-meta span { display: inline-flex; align-items: center; gap: 5px; height: 26px; padding: 0 9px; border-radius: 9px; background: var(--bg-soft); font-size: 12px; font-weight: 650; color: var(--text-2); white-space: nowrap; max-width: 100%; }
  .tq-meta .who { background: none; padding: 0; color: var(--text-3); min-width: 0; }
  .tq-meta .who .avatar { width: 22px; height: 22px; font-size: 9px; }
  .tq-meta .who b { font-weight: 650; overflow: hidden; text-overflow: ellipsis; }
  .tq-foot { display: flex; align-items: center; justify-content: space-between; gap: 10px; flex-wrap: wrap; margin-top: auto; padding-top: 16px; }
  .tq-best { display: inline-flex; align-items: center; gap: 6px; font-family: var(--font-mono); font-size: 11px; font-weight: 600; letter-spacing: .04em; color: var(--text-3); }
  .tq-best strong { font-family: var(--font-display); font-size: 20px; font-weight: 800; letter-spacing: -0.04em; color: var(--amber-600); }
  .tq-best.ok strong { color: var(--green-700); }

  .tq-empty { background: var(--white); border: 1.5px solid var(--border); border-radius: var(--r-card); }

  @media (max-width: 1024px) { .tq-grid { grid-template-columns: minmax(0, 1fr); } }
  @media (max-width: 768px) {
    .tq-steps { grid-template-columns: minmax(0, 1fr); gap: 12px; }
    .tq-steps::before { left: 21px; right: auto; top: 10px; bottom: 10px; border-top: none; border-left: 2px dashed var(--border); }
    .tq-step .tx { background: none; padding-top: 2px; }
  }
  @media (max-width: 560px) {
    .tq { grid-template-columns: minmax(0, 1fr); }
    .tq-stub { flex-direction: row; align-items: center; padding: 12px 16px; border-right: none; border-bottom: 2px dashed #14213D; }
    .tq-stub .lb { display: none; }
    .tq-stub .qq { display: flex; align-items: baseline; gap: 6px; }
    .tq-stub .q { font-size: 34px; }
    .tq-foot .btn { flex: 1; }
  }
`

export default function Tests() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [debounced, setDebounced] = useState('')
  const [category, setCategory] = useState('')
  const [page, setPage] = useState(1)

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 350)
    return () => clearTimeout(t)
  }, [search])
  useEffect(() => { setPage(1) }, [debounced, category])

  const { data: cats = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.get('/categories/').then(r => r.data.results || r.data),
  })

  const params = new URLSearchParams({ page: String(page), page_size: String(PAGE_SIZE) })
  if (debounced) params.set('search', debounced)
  if (category) params.set('category', category)

  const { data, isLoading } = useQuery({
    queryKey: ['standalone-tests', params.toString()],
    queryFn: () => api.get(`/tests/standalone/?${params.toString()}`).then(r => r.data),
  })
  const tests = data?.results || []
  const total = data?.count ?? tests.length

  function startTest(t) {
    if (!user) { navigate('/auth/login'); return }
    navigate(`/tests/${t.id}/take`)
  }

  return (
    <Layout>
      <style>{styles}</style>
      <div className="container tq-body">
        <PageHeader eyebrow="Testlar" title="Bilim testlari"
          subtitle="O'qituvchilar tayyorlagan mustaqil testlar bilan bilimingizni sinab ko'ring. Natijalaringiz profilingizda saqlanadi." />

        <div className="tq-steps">
          {STEPS.map(s => (
            <div key={s.n} className="tq-step">
              <span className="n">{s.n}</span>
              <div className="tx"><div className="t">{s.t}</div><div className="s">{s.s}</div></div>
            </div>
          ))}
        </div>

        <FilterBar search={search} onSearch={setSearch} placeholder="Test nomi bo'yicha qidirish…"
          count={total}
          onClear={search || category ? () => { setSearch(''); setCategory('') } : null}>
          <select className="select" value={category} onChange={e => setCategory(e.target.value)} aria-label="Kategoriya">
            <option value="">Barcha kategoriyalar</option>
            {cats.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
          </select>
        </FilterBar>

        {isLoading ? (
          <div className="loading-state"><span className="spinner" />Testlar yuklanmoqda…</div>
        ) : tests.length === 0 ? (
          <div className="tq-empty empty-state">
            <div className="es-ico"><Icon name="fileText" size={24} /></div>
            <div className="es-title">Testlar topilmadi</div>
            <div className="es-sub">Qidiruv yoki filtrlarni o'zgartirib ko'ring</div>
          </div>
        ) : (
          <div className="tq-grid">
            {tests.map((t, idx) => (
              <article key={t.id} className={`tq fade-up-d${Math.min(idx % 2 + 1, 4)}`}>
                <div className={`tq-stub c${idx % 5}`}>
                  <span className="lb">Test № {String(t.id).padStart(3, '0')}</span>
                  <div className="qq">
                    <div className="q">{t.question_count}</div>
                    <div className="ql">savol</div>
                  </div>
                  <span className="tm">
                    <Icon name="clock" size={13} /> {t.time_limit_minutes ? `${t.time_limit_minutes} daq` : 'Vaqt cheksiz'}
                  </span>
                </div>
                <div className="tq-main">
                  {t.category && <div className="tq-cat">{t.category.icon} {t.category.name}</div>}
                  <h3 className="tq-title">{t.title}</h3>
                  <p className="tq-desc">{t.description || 'Bilimingizni sinab ko\'rish uchun test.'}</p>
                  <div className="tq-meta">
                    <span><Icon name="target" size={13} /> {t.pass_percent}% o'tish</span>
                    {t.attempt_count > 0 && <span><Icon name="users" size={13} /> {t.attempt_count} urinish</span>}
                    {t.created_by && (
                      <span className="who">
                        <span className="avatar">{t.created_by.initials}</span>
                        <b>{t.created_by.display_name}</b>
                      </span>
                    )}
                  </div>
                  <div className="tq-foot">
                    {t.my_best ? (
                      <span className={`tq-best ${t.my_best.passed ? 'ok' : ''}`}>
                        ENG YAXSHI <strong>{Math.round(t.my_best.score_percent)}%</strong>
                      </span>
                    ) : <span className="tq-best">YANGI SINOV</span>}
                    <button className={`btn btn-sm ${t.my_best ? 'btn-secondary' : 'btn-primary'}`} onClick={() => startTest(t)} disabled={t.question_count === 0}>
                      {t.my_best ? 'Qayta topshirish' : 'Boshlash'} <Icon name="arrowR" size={14} />
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        <Pagination page={page} pageSize={PAGE_SIZE} total={total} onChange={setPage} />
      </div>
    </Layout>
  )
}
