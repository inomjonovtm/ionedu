import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import api from '../api/client'
import Layout from '../components/Layout'
import Icon from '../components/Icon'
import Pagination from '../components/Pagination'
import FilterBar from '../components/FilterBar'
import PageHeader from '../components/PageHeader'
import { useAuth } from '../store/auth'

const PAGE_SIZE = 12

const styles = `
  .tests-hero {
    padding: 48px 0 40px;
    border-bottom: 1px solid var(--border-2);
  }
  .test-card {
    display: flex; flex-direction: column; gap: 14px;
    padding: 24px;
    height: 100%;
  }
  .test-card .head { display: flex; align-items: flex-start; gap: 14px; }
  .test-card .ic {
    width: 48px; height: 48px; border-radius: 13px; flex-shrink: 0;
    background: var(--blue-50); color: var(--blue-600);
    display: flex; align-items: center; justify-content: center;
  }
  .test-card .ttl {
    font-family: var(--font-display); font-weight: 700; font-size: 16px;
    line-height: 1.35; color: var(--text);
  }
  .test-card .desc {
    font-size: 13.5px; color: var(--text-3); line-height: 1.55;
    display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
    flex: 1;
  }
  .test-card .meta {
    display: flex; gap: 14px; flex-wrap: wrap;
    font-size: 12.5px; color: var(--text-3);
    padding-top: 14px; border-top: 1px solid var(--border-2);
  }
  .test-card .meta span { display: inline-flex; align-items: center; gap: 5px; }
  .tests-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
  @media (max-width: 1024px) { .tests-grid { grid-template-columns: repeat(2, 1fr); } }
  @media (max-width: 680px) { .tests-grid { grid-template-columns: 1fr; } }
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
      <div className="container">
        <PageHeader eyebrow="Testlar" title="Bilim testlari"
          subtitle="O'qituvchilar tayyorlagan mustaqil testlar bilan bilimingizni sinab ko'ring. Natijalaringiz profilingizda saqlanadi." />
      </div>

      <div className="container" style={{ padding: '32px 24px 80px' }}>
        <FilterBar search={search} onSearch={setSearch} placeholder="Test nomi bo'yicha qidirish…"
          count={total}
          onClear={search || category ? () => { setSearch(''); setCategory('') } : null}>
          <select className="select" value={category} onChange={e => setCategory(e.target.value)}>
            <option value="">Barcha kategoriyalar</option>
            {cats.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
          </select>
        </FilterBar>

        {isLoading ? (
          <div className="loading-state"><span className="spinner" />Testlar yuklanmoqda…</div>
        ) : tests.length === 0 ? (
          <div className="card" style={{ padding: 60, textAlign: 'center', color: 'var(--text-3)' }}>
            <Icon name="fileText" size={36} style={{ color: 'var(--text-4)', margin: '0 auto 12px' }} />
            <div style={{ fontWeight: 600, color: 'var(--text-2)', marginBottom: 4 }}>Testlar topilmadi</div>
            <div className="text-sm">Qidiruv yoki filtrlarni o'zgartirib ko'ring</div>
          </div>
        ) : (
          <div className="tests-grid">
            {tests.map((t, idx) => (
              <div key={t.id} className={`card card-hover test-card fade-up-d${Math.min(idx % 3 + 1, 4)}`}>
                <div className="head">
                  <div className="ic"><Icon name="fileText" size={22} /></div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div className="ttl">{t.title}</div>
                    {t.category && <span className="badge badge-blue mt-1" style={{ fontSize: 11 }}>{t.category.icon} {t.category.name}</span>}
                  </div>
                </div>
                <div className="desc">{t.description || 'Bilimingizni sinab ko\'rish uchun test.'}</div>
                <div className="meta">
                  <span><Icon name="fileText" size={13} /> {t.question_count} savol</span>
                  {t.time_limit_minutes && <span><Icon name="clock" size={13} /> {t.time_limit_minutes} daq</span>}
                  <span><Icon name="checkC" size={13} /> {t.pass_percent}% o'tish</span>
                  {t.attempt_count > 0 && <span><Icon name="users" size={13} /> {t.attempt_count} urinish</span>}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {t.created_by && (
                    <span className="text-xs text-muted" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, flex: 1, minWidth: 0 }}>
                      <span className="avatar" style={{ width: 22, height: 22, fontSize: 9 }}>{t.created_by.initials}</span>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.created_by.display_name}</span>
                    </span>
                  )}
                  {t.my_best && (
                    <span className={`badge badge-${t.my_best.passed ? 'green' : 'amber'}`} style={{ fontSize: 11 }}>
                      Eng yaxshi: {Math.round(t.my_best.score_percent)}%
                    </span>
                  )}
                </div>
                <button className="btn btn-primary btn-block" onClick={() => startTest(t)} disabled={t.question_count === 0}>
                  {t.my_best ? 'Qayta topshirish' : 'Boshlash'} <Icon name="arrowR" size={14} />
                </button>
              </div>
            ))}
          </div>
        )}

        <Pagination page={page} pageSize={PAGE_SIZE} total={total} onChange={setPage} />
      </div>
    </Layout>
  )
}
