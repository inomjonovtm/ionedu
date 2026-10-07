import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import api, { absUrl } from '../api/client'
import Layout from '../components/Layout'
import Icon from '../components/Icon'
import Pagination from '../components/Pagination'
import FilterBar from '../components/FilterBar'
import PageHeader from '../components/PageHeader'

const PAGE_SIZE = 12

const css = `
  .tch-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 22px; }
  @media (max-width: 900px) { .tch-grid { grid-template-columns: repeat(2, 1fr); } }
  @media (max-width: 560px) { .tch-grid { grid-template-columns: 1fr; } }

  .tch-card {
    position: relative; overflow: hidden; display: flex; flex-direction: column;
    background: var(--white); border: 1px solid var(--border); border-radius: 20px;
    transition: transform .2s ease, box-shadow .2s ease, border-color .2s ease;
  }
  .tch-card:hover { transform: translateY(-5px); box-shadow: var(--shadow-hover); border-color: var(--green-200); }
  .tch-top {
    height: 88px; position: relative;
    background:
      radial-gradient(120% 130% at 50% -30%, var(--green-100), transparent 60%),
      linear-gradient(135deg, var(--green-50), var(--bg-soft));
    border-bottom: 1px solid var(--border-2);
  }
  .tch-top::after {
    content: ''; position: absolute; inset: 0;
    background-image:
      linear-gradient(rgba(14,131,69,.05) 1px, transparent 1px),
      linear-gradient(90deg, rgba(14,131,69,.05) 1px, transparent 1px);
    background-size: 22px 22px;
    -webkit-mask-image: linear-gradient(180deg, #000, transparent);
    mask-image: linear-gradient(180deg, #000, transparent);
  }
  .tch-av {
    width: 92px; height: 92px; border-radius: 999px; margin: -46px auto 0; position: relative; z-index: 1;
    overflow: hidden; display: flex; align-items: center; justify-content: center;
    font-family: var(--font-display); font-weight: 700; font-size: 28px;
    background: var(--green-100); color: var(--green-800);
    box-shadow: 0 0 0 5px var(--white), 0 10px 24px -10px rgba(12,17,14,.35);
  }
  .tch-av img { width: 100%; height: 100%; object-fit: cover; }
  .tch-body { padding: 16px 22px 22px; text-align: center; flex: 1; display: flex; flex-direction: column; }
  .tch-name { font-size: 17.5px; font-weight: 700; letter-spacing: -0.02em; }
  .tch-spec { font-size: 13.5px; color: var(--text-3); margin-top: 5px; line-height: 1.5; flex: 1; }
  .tch-rate {
    display: inline-flex; align-items: center; gap: 6px; align-self: center;
    margin: 14px 0 16px; padding: 5px 12px; border-radius: 999px;
    background: var(--amber-50); box-shadow: inset 0 0 0 1px #F2E0C4;
    font-size: 13px; font-weight: 700; color: var(--amber-600);
  }
  .tch-rate .stars { display: inline-flex; gap: 1px; color: #F59E0B; }
  .tch-stats {
    display: grid; grid-template-columns: 1fr 1fr; gap: 0;
    border-top: 1px solid var(--border-2); padding-top: 16px;
  }
  .tch-stat { text-align: center; }
  .tch-stat + .tch-stat { border-left: 1px solid var(--border-2); }
  .tch-stat .v { font-family: var(--font-mono); font-weight: 700; font-size: 18px; color: var(--text); line-height: 1; }
  .tch-stat .l { font-size: 11px; color: var(--text-3); margin-top: 5px; }
`

function Stars({ value = 0 }) {
  const full = Math.round(value)
  return (
    <span className="stars">
      {Array.from({ length: 5 }).map((_, i) => (
        <Icon key={i} name="starF" size={12} style={{ color: i < full ? '#F59E0B' : 'var(--border)' }} />
      ))}
    </span>
  )
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

  return (
    <Layout>
      <style>{css}</style>
      <div className="container">
        <PageHeader eyebrow="O'qituvchilar" title="O'qituvchilar"
          subtitle={`${total} ta mutaxassis · eng yuqori reytingdagilar birinchi`} />

        <FilterBar search={search} onSearch={setSearch}
          placeholder="O'qituvchi ismi yoki sohasi bo'yicha qidirish…" count={total} />

        {isLoading ? (
          <div className="loading-state"><span className="spinner" />Yuklanmoqda…</div>
        ) : total === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: 60, color: 'var(--text-3)' }}>
            {search ? `"${search}" bo'yicha o'qituvchi topilmadi` : "Hozircha o'qituvchilar yo'q"}
          </div>
        ) : (
          <div className="tch-grid">
            {data.map(t => (
              <Link key={t.id} to={`/teachers/${t.id}`} className="tch-card">
                <div className="tch-top" />
                <div className="tch-av">
                  {t.avatar ? <img src={absUrl(t.avatar)} alt={t.display_name} /> : t.initials}
                </div>
                <div className="tch-body">
                  <div className="tch-name">{t.display_name}</div>
                  <div className="tch-spec">
                    {t.specialty || t.bio?.slice(0, 64) || "Geografiya o'qituvchisi"}
                  </div>
                  <span className="tch-rate">
                    <Stars value={t.avg_rating ?? 0} />
                    {(t.avg_rating ?? 0).toFixed(1)}
                  </span>
                  <div className="tch-stats">
                    <div className="tch-stat">
                      <div className="v">{t.course_count ?? 0}</div>
                      <div className="l">Kurs</div>
                    </div>
                    <div className="tch-stat">
                      <div className="v">{t.students_count ?? 0}</div>
                      <div className="l">O'quvchi</div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
        <div style={{ paddingBottom: 80 }}>
          <Pagination page={page} pageSize={PAGE_SIZE} total={total} onChange={setPage} />
        </div>
      </div>
    </Layout>
  )
}
