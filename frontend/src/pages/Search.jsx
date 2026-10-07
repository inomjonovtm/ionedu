import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import api from '../api/client'
import Layout from '../components/Layout'
import Icon from '../components/Icon'
import Pagination from '../components/Pagination'

const PAGE_SIZE = 10

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

  return (
    <Layout>
      <div className="container">
        <div style={{ padding: '48px 0 32px', maxWidth: 720, margin: '0 auto' }}>
          <form onSubmit={submit} style={{ position: 'relative', marginBottom: 12 }}>
            <Icon name="search" size={22} style={{ position: 'absolute', left: 20, top: '50%', transform: 'translateY(-50%)', color: 'var(--green-600)' }} />
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Qidirish..."
              style={{ width: '100%', height: 56, padding: '0 20px 0 56px', border: '1px solid var(--border)', borderRadius: 12, fontSize: 18 }}
            />
          </form>
          {q && !isLoading && <div className="text-sm text-muted"><strong style={{ color: 'var(--text)' }}>"{q}"</strong> bo'yicha {counts.courses + counts.tests + counts.teachers + counts.resources} ta natija</div>}
        </div>

        {q && isLoading && <div className="loading-state"><span className="spinner" />Qidirilmoqda…</div>}

        {q && !isLoading && (
          <>
            <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid var(--border)', margin: '32px 0 28px', overflowX: 'auto' }}>
              {['courses', 'tests', 'teachers', 'resources'].map(t => (
                <button key={t} onClick={() => setTab(t)}
                  className="text-sm" style={{
                    padding: '12px 18px', fontWeight: 500, color: tab === t ? 'var(--green-600)' : 'var(--text-3)',
                    borderBottom: tab === t ? '2px solid var(--green-600)' : '2px solid transparent',
                    marginBottom: -1, whiteSpace: 'nowrap',
                  }}>
                  {t === 'courses' ? 'Kurslar' : t === 'tests' ? 'Testlar' : t === 'teachers' ? "O'qituvchilar" : 'Resurslar'} ({counts[t]})
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingBottom: 80 }}>
              {activeList.length === 0 && (
                <div className="card" style={{ padding: 60, textAlign: 'center', color: 'var(--text-3)' }}>Natija yo'q</div>
              )}

              {tab === 'tests' && pageList.map(t => (
                <Link key={t.id} to="/tests" className="card card-hover" style={{ display: 'flex', gap: 16, padding: 20 }}>
                  <div style={{ width: 60, height: 60, borderRadius: 12, background: 'var(--blue-50)', color: 'var(--blue-600)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon name="fileText" size={24} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <span className="badge badge-blue">Test{t.category ? ` · ${t.category.name}` : ''}</span>
                    <h3 style={{ fontSize: 16, fontFamily: 'var(--font-display)', margin: '4px 0' }}>{t.title}</h3>
                    <p className="text-sm text-muted">{t.question_count} savol · o'tish bali {t.pass_percent}%{t.time_limit_minutes ? ` · ${t.time_limit_minutes} daq` : ''}</p>
                  </div>
                  <Icon name="chevR" size={18} style={{ color: 'var(--text-3)', alignSelf: 'center' }} />
                </Link>
              ))}

              {tab === 'courses' && pageList.map(c => (
                <Link key={c.id} to={`/courses/${c.slug}`} className="card card-hover" style={{ display: 'flex', gap: 16, padding: 20 }}>
                  <div className={`thumb thumb-${c.thumb_color}`} style={{ width: 100, height: 70, fontSize: 28, flexShrink: 0 }}>{c.thumb_emoji}</div>
                  <div style={{ flex: 1 }}>
                    {c.category && <span className="badge badge-blue">Kurs · {c.category.name}</span>}
                    <h3 style={{ fontSize: 16, fontFamily: 'var(--font-display)', margin: '4px 0' }}>{c.title}</h3>
                    <p className="text-sm">{c.description?.slice(0, 140)}</p>
                  </div>
                </Link>
              ))}

              {tab === 'teachers' && pageList.map(t => (
                <Link key={t.id} to={`/teachers/${t.id}`} className="card card-hover" style={{ display: 'flex', gap: 16, padding: 20 }}>
                  <div className="avatar avatar-amber" style={{ width: 60, height: 60, fontSize: 20 }}>{t.initials}</div>
                  <div style={{ flex: 1 }}>
                    <span className="badge badge-amber">O'qituvchi</span>
                    <h3 style={{ fontSize: 16, margin: '4px 0' }}>{t.display_name}</h3>
                    <p className="text-sm">{t.bio?.slice(0, 120)}</p>
                  </div>
                </Link>
              ))}

              {tab === 'resources' && pageList.map(r => (
                <div key={r.id} className="card card-hover" style={{ display: 'flex', gap: 16, padding: 20 }}>
                  <div style={{ width: 60, height: 60, borderRadius: 10, background: 'var(--red-50)', color: 'var(--red-600)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon name="fileText" size={22} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <span className="badge badge-red">Resurs</span>
                    <h3 style={{ fontSize: 16, margin: '4px 0' }}>{r.title}</h3>
                    <p className="text-sm">{r.description?.slice(0, 140)}</p>
                  </div>
                </div>
              ))}

              <Pagination page={page} pageSize={PAGE_SIZE} total={activeList.length} onChange={setPage} />
            </div>
          </>
        )}
      </div>
    </Layout>
  )
}
