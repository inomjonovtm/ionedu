import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import api, { absUrl } from '../api/client'
import Layout from '../components/Layout'
import Icon from '../components/Icon'
import Pagination from '../components/Pagination'
import FilterBar from '../components/FilterBar'
import PageHeader from '../components/PageHeader'

const PAGE_SIZE = 12

const TYPE_META = {
  pdf: { icon: 'fileText', cls: 'res-pdf', label: 'PDF', badge: 'red' },
  video: { icon: 'video', cls: 'res-video', label: 'Video', badge: 'blue' },
  map: { icon: 'map', cls: 'res-map', label: 'Karta', badge: 'green' },
  doc: { icon: 'file', cls: 'res-doc', label: 'Hujjat', badge: 'amber' },
  link: { icon: 'link', cls: 'res-link', label: 'Havola', badge: 'gray' },
}

const styles = `
  .res-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
  .res-card { display: flex; flex-direction: column; background: var(--white); border: 1px solid var(--border); border-radius: 12px; padding: 20px; transition: all .2s; }
  .res-card:hover { border-color: var(--green-300); box-shadow: var(--shadow-hover); transform: translateY(-4px); }
  .res-icon { width: 48px; height: 48px; border-radius: 10px; display: flex; align-items: center; justify-content: center; margin-bottom: 16px; }
  .res-pdf { background: var(--red-50); color: var(--red-600); }
  .res-video { background: var(--blue-50); color: var(--blue-600); }
  .res-map { background: var(--green-50); color: var(--green-600); }
  .res-doc { background: var(--amber-50); color: var(--amber-600); }
  .res-link { background: #EDE9FE; color: #5B21B6; }
  .res-card h4 { font-family: var(--font-display); font-size: 16px; line-height: 1.3; margin-bottom: 8px; min-height: 40px; }
  .res-meta { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; margin-bottom: 14px; }
  .res-foot { margin-top: auto; padding-top: 14px; border-top: 1px solid var(--border-2); display: flex; justify-content: space-between; align-items: center; font-size: 13px; color: var(--text-3); }
  .res-action { display: inline-flex; align-items: center; gap: 6px; color: var(--green-600); font-weight: 600; font-size: 13px; }
  @media (max-width: 1024px) { .res-grid { grid-template-columns: repeat(2, 1fr); } }
  @media (max-width: 640px) { .res-grid { grid-template-columns: 1fr; } }
`

export default function Resources() {
  const [type, setType] = useState('')
  const [search, setSearch] = useState('')
  const [grade, setGrade] = useState('')
  const [category, setCategory] = useState('')
  const [page, setPage] = useState(1)

  useEffect(() => { setPage(1) }, [type, search, grade, category])

  const { data: cats = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.get('/categories/').then(r => r.data.results || r.data),
  })

  const { data, isLoading } = useQuery({
    queryKey: ['resources-all'],
    queryFn: () => api.get('/resources/?page_size=200').then(r => r.data),
  })
  const all = data?.results || data || []

  const q = search.trim().toLowerCase()
  const filtered = all
    .filter(r => !type || r.resource_type === type)
    .filter(r => !grade || r.grade_level === grade)
    .filter(r => !category || String(r.category?.id ?? r.category) === String(category))
    .filter(r => !q || (r.title || '').toLowerCase().includes(q) || (r.description || '').toLowerCase().includes(q))

  const total = filtered.length
  const list = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <Layout>
      <style>{styles}</style>
      <div className="container">
        <PageHeader eyebrow="Resurslar" title="O'quv resurslari"
          subtitle="Atlaslar, xaritalar, qo'llanmalar va boshqalar" />

        <FilterBar search={search} onSearch={setSearch} placeholder="Resurs nomi yoki tavsifi…"
          count={total}
          tabs={[{ id: '', label: 'Hammasi' }, ...Object.entries(TYPE_META).map(([k, m]) => ({ id: k, label: m.label }))]}
          tab={type} onTab={setType}
          onClear={(search || grade || category || type) ? () => { setSearch(''); setGrade(''); setCategory(''); setType('') } : null}>
          <select className="select" value={grade} onChange={e => setGrade(e.target.value)}>
            <option value="">Barcha sinflar</option>
            <option value="all">Umumiy</option>
            <option value="5-6">5–6 sinf</option>
            <option value="7-8">7–8 sinf</option>
            <option value="9-10">9–10 sinf</option>
            <option value="11">11-sinf (DTM)</option>
          </select>
          <select className="select" value={category} onChange={e => setCategory(e.target.value)}>
            <option value="">Barcha kategoriyalar</option>
            {cats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </FilterBar>

        {isLoading ? (
          <div className="loading-state"><span className="spinner" />Yuklanmoqda…</div>
        ) : list.length === 0 ? (
          <div className="card" style={{ padding: 60, textAlign: 'center', color: 'var(--text-3)' }}>
            Resurslar topilmadi. Filtr yoki qidiruvni o'zgartirib ko'ring.
          </div>
        ) : (
          <>
          <div className="res-grid">
            {list.map(r => {
              const m = TYPE_META[r.resource_type] || TYPE_META.doc
              const url = r.file ? absUrl(r.file) : r.external_url
              return (
                <div key={r.id} className="res-card">
                  <div className={`res-icon ${m.cls}`}><Icon name={m.icon} size={22} /></div>
                  <div className="res-meta">
                    <span className={`badge badge-${m.badge}`}>{m.label}</span>
                    <span className="badge badge-gray">{r.grade_level}</span>
                  </div>
                  <h4>{r.title}</h4>
                  <p className="text-sm text-muted">{r.description?.slice(0, 80)}</p>
                  <div className="res-foot">
                    <span>{r.file_size_mb ? `${r.file_size_mb} MB` : (r.page_count ? `${r.page_count} bet` : '—')}</span>
                    {url ? (
                      <a href={url} target="_blank" rel="noreferrer" className="res-action"
                         onClick={() => api.post(`/resources/${r.id}/increment_download/`).catch(()=>{})}>
                        Ochish <Icon name="arrowR" size={12} />
                      </a>
                    ) : <span className="text-muted">Mavjud emas</span>}
                  </div>
                </div>
              )
            })}
          </div>
          <div style={{ paddingBottom: 60 }}>
            <Pagination page={page} pageSize={PAGE_SIZE} total={total} onChange={setPage} />
          </div>
          </>
        )}
      </div>
    </Layout>
  )
}
