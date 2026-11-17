import { useState, useEffect } from 'react'
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

const GRADES = { all: 'Umumiy', '5-6': '5–6 sinf', '7-8': '7–8 sinf', '9-10': '9–10 sinf', '11': '11-sinf' }

const styles = `
  .res-body { padding-bottom: 80px; }

  /* Type picker — a shelf of coloured folders */
  .res-shelf { display: grid; grid-template-columns: 1.35fr repeat(5, minmax(0, 1fr)); gap: 12px; margin-bottom: 22px; }
  .res-tile {
    position: relative; display: flex; flex-direction: column; justify-content: space-between; gap: 22px;
    min-width: 0; text-align: left; padding: 14px 14px 12px; border-radius: 20px;
    border: 2px solid transparent; color: #14213D;
    transition: transform .15s ease, box-shadow .15s ease, border-color .15s ease;
  }
  .res-tile:hover { transform: translate(-2px, -2px); border-color: var(--line); box-shadow: var(--hard); }
  .res-tile.on { border-color: var(--line); box-shadow: var(--hard); transform: translate(-2px, -2px) rotate(-1.5deg); }
  .res-tile .top { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
  .res-tile .n { font-family: var(--font-mono); font-size: 11px; font-weight: 600; background: rgba(255,255,255,.7); border-radius: 999px; padding: 1px 8px; }
  .res-tile .lb { font-family: var(--font-display); font-weight: 800; font-size: 19px; letter-spacing: -0.03em; line-height: 1.1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .res-tile.res-all { background: var(--ink); color: #fff; }
  .res-tile.res-all .n { background: var(--sun); color: #14213D; }
  .res-tile.res-all.on { box-shadow: 4px 4px 0 var(--sun); }
  .res-pdf { background: #FF9D88; } .res-video { background: #9DBDFF; } .res-map { background: #8FE0B4; }
  .res-doc { background: var(--sun); } .res-link { background: #C4B6FF; }

  /* File rows */
  .res-list { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; }
  .res-row {
    display: grid; grid-template-columns: auto minmax(0, 1fr); gap: 16px; align-items: start; min-width: 0;
    background: var(--white); border: 1.5px solid var(--border); border-radius: 20px; padding: 16px;
    transition: border-color .16s ease, box-shadow .16s ease, transform .16s ease;
  }
  .res-row:hover { border-color: var(--line); box-shadow: var(--hard); transform: translate(-2px, -2px); }
  .res-ico {
    width: 56px; height: 64px; border-radius: 6px 16px 14px 14px; flex-shrink: 0; color: #14213D;
    border: 1.5px solid #14213D; display: flex; align-items: center; justify-content: center;
    transform: rotate(-4deg); transition: transform .2s ease;
  }
  .res-row:hover .res-ico { transform: rotate(3deg); }
  .res-info { min-width: 0; display: flex; flex-direction: column; height: 100%; }
  .res-kind { display: flex; flex-wrap: wrap; gap: 4px 10px; font-family: var(--font-mono); font-size: 10.5px; font-weight: 600; letter-spacing: .08em; text-transform: uppercase; color: var(--text-3); }
  .res-kind span + span::before { content: '·'; margin-right: 10px; color: var(--text-4); }
  .res-row h3 { font-size: 17.5px; letter-spacing: -0.025em; line-height: 1.25; margin: 5px 0 4px; overflow-wrap: anywhere; }
  .res-row p { font-size: 13.5px; line-height: 1.5; color: var(--text-3); display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
  .res-foot { display: flex; align-items: center; justify-content: space-between; gap: 10px; flex-wrap: wrap; margin-top: auto; padding-top: 12px; }
  .res-size { font-family: var(--font-mono); font-size: 11.5px; color: var(--text-3); }
  .res-none { font-size: 12.5px; font-weight: 600; color: var(--text-4); }

  .res-empty { background: var(--white); border: 1.5px solid var(--border); border-radius: var(--r-card); }

  @media (max-width: 1024px) {
    .res-shelf { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  }
  @media (max-width: 768px) {
    .res-shelf { display: flex; overflow-x: auto; gap: 10px; padding: 4px 4px 10px; margin: 0 -4px 14px; scrollbar-width: none; }
    .res-shelf::-webkit-scrollbar { display: none; }
    .res-tile { flex: 0 0 132px; gap: 14px; border-radius: 17px; }
    .res-tile .lb { font-size: 16.5px; }
    .res-tile:hover, .res-tile.on { transform: none; box-shadow: var(--hard-sm); }
    .res-list { grid-template-columns: minmax(0, 1fr); }
    .res-row { padding: 14px; gap: 13px; }
    .res-ico { width: 46px; height: 54px; }
  }
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
  const typeCount = k => all.filter(r => r.resource_type === k).length

  return (
    <Layout>
      <style>{styles}</style>
      <div className="container res-body">
        <PageHeader eyebrow="Resurslar" title="O'quv resurslari"
          subtitle="Atlaslar, xaritalar, qo'llanmalar va boshqalar" />

        <div className="res-shelf" role="tablist" aria-label="Resurs turi">
          <button type="button" role="tab" aria-selected={type === ''} onClick={() => setType('')}
            className={`res-tile res-all ${type === '' ? 'on' : ''}`}>
            <span className="top"><Icon name="folder" size={22} /><span className="n">{all.length}</span></span>
            <span className="lb">Hammasi</span>
          </button>
          {Object.entries(TYPE_META).map(([k, m]) => (
            <button type="button" role="tab" key={k} aria-selected={type === k} onClick={() => setType(k)}
              className={`res-tile ${m.cls} ${type === k ? 'on' : ''}`}>
              <span className="top"><Icon name={m.icon} size={22} /><span className="n">{typeCount(k)}</span></span>
              <span className="lb">{m.label}</span>
            </button>
          ))}
        </div>

        <FilterBar search={search} onSearch={setSearch} placeholder="Resurs nomi yoki tavsifi…"
          count={total}
          onClear={(search || grade || category || type) ? () => { setSearch(''); setGrade(''); setCategory(''); setType('') } : null}>
          <select className="select" value={grade} onChange={e => setGrade(e.target.value)} aria-label="Sinf">
            <option value="">Barcha sinflar</option>
            <option value="all">Umumiy</option>
            <option value="5-6">5–6 sinf</option>
            <option value="7-8">7–8 sinf</option>
            <option value="9-10">9–10 sinf</option>
            <option value="11">11-sinf (DTM)</option>
          </select>
          <select className="select" value={category} onChange={e => setCategory(e.target.value)} aria-label="Kategoriya">
            <option value="">Barcha kategoriyalar</option>
            {cats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </FilterBar>

        {isLoading ? (
          <div className="loading-state"><span className="spinner" />Yuklanmoqda…</div>
        ) : list.length === 0 ? (
          <div className="res-empty empty-state">
            <div className="es-ico"><Icon name="folder" size={24} /></div>
            <div className="es-title">Resurslar topilmadi</div>
            <div className="es-sub">Filtr yoki qidiruvni o'zgartirib ko'ring.</div>
          </div>
        ) : (
          <>
            <div className="res-list">
              {list.map(r => {
                const m = TYPE_META[r.resource_type] || TYPE_META.doc
                const url = r.file ? absUrl(r.file) : r.external_url
                const size = r.file_size_mb ? `${r.file_size_mb} MB` : (r.page_count ? `${r.page_count} bet` : '—')
                return (
                  <article key={r.id} className="res-row">
                    <div className={`res-ico ${m.cls}`}><Icon name={m.icon} size={24} /></div>
                    <div className="res-info">
                      <div className="res-kind">
                        <span>{m.label}</span>
                        {r.grade_level && <span>{GRADES[r.grade_level] || r.grade_level}</span>}
                      </div>
                      <h3>{r.title}</h3>
                      <p>{r.description?.slice(0, 80)}</p>
                      <div className="res-foot">
                        <span className="res-size">{size}</span>
                        {url ? (
                          <a href={url} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm"
                            onClick={() => api.post(`/resources/${r.id}/increment_download/`).catch(() => {})}>
                            Ochish <Icon name="arrowR" size={13} />
                          </a>
                        ) : <span className="res-none">Mavjud emas</span>}
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
            <Pagination page={page} pageSize={PAGE_SIZE} total={total} onChange={setPage} />
          </>
        )}
      </div>
    </Layout>
  )
}
