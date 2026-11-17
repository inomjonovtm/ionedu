import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import api from '../api/client'
import Layout from '../components/Layout'
import CourseCard from '../components/CourseCard'
import Pagination from '../components/Pagination'
import FilterBar from '../components/FilterBar'
import PageHeader from '../components/PageHeader'
import Icon from '../components/Icon'

const PAGE_SIZE = 12

const LEVELS = [
  { id: '', label: 'Hammasi' },
  { id: 'beginner', label: "Boshlang'ich" },
  { id: 'intermediate', label: "O'rta" },
  { id: 'advanced', label: 'Murakkab' },
]

const styles = `
  .cat-wrap { display: grid; grid-template-columns: 264px minmax(0, 1fr); gap: 32px; align-items: start; padding-bottom: 80px; }

  /* Legend — the map key on the left */
  .cat-legend { position: sticky; top: 96px; min-width: 0; background: var(--white); border: 2px solid var(--line); border-radius: var(--r-card); box-shadow: var(--hard); padding: 18px 14px 14px; }
  .cat-legend-head { display: flex; align-items: center; justify-content: space-between; padding: 0 6px 12px; border-bottom: 1.5px dashed var(--border); margin-bottom: 10px; }
  .cat-legend-head h2 { font-size: 19px; }
  .cat-lbl { font-family: var(--font-mono); font-size: 10.5px; font-weight: 600; letter-spacing: .12em; text-transform: uppercase; color: var(--text-4); padding: 10px 6px 8px; }
  .cat-list { display: flex; flex-direction: column; gap: 2px; }
  .cat-item {
    display: flex; align-items: center; gap: 10px; width: 100%; text-align: left;
    padding: 7px 8px; border-radius: 12px; font-size: 14px; font-weight: 650; color: var(--text-2);
    transition: background .12s ease, color .12s ease;
  }
  .cat-item .em { width: 30px; height: 30px; border-radius: 10px; background: var(--bg-soft); display: flex; align-items: center; justify-content: center; font-size: 15px; flex-shrink: 0; }
  .cat-item .nm { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; min-width: 0; }
  .cat-item:hover { background: var(--bg-soft); color: var(--text); }
  .cat-item.on { background: var(--sun); color: #14213D; }
  .cat-item.on .em { background: #fff; }
  .cat-levels { display: flex; flex-wrap: wrap; gap: 6px; padding: 0 4px 4px; }
  .cat-levels .chip { height: 32px; padding: 0 12px; cursor: pointer; }

  .cat-main { min-width: 0; }
  .cat-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 22px; }
  .cat-cell { min-width: 0; }
  .cat-feature { grid-column: 1 / -1; }
  .cat-feature .cc { flex-direction: row; gap: 8px; border: 2px solid var(--line); box-shadow: var(--hard); }
  .cat-feature .cc .cc-thumb { width: 46%; aspect-ratio: auto; min-height: 250px; font-size: 96px; }
  .cat-feature .cc .cc-body { padding: 20px 16px 10px 18px; }
  .cat-feature .cc .cc-title { font-size: 30px; line-height: 1.08; letter-spacing: -0.04em; -webkit-line-clamp: 3; }
  .cat-feature .cc .cc-teacher { margin-top: 14px; font-size: 14px; }

  .cat-empty { background: var(--white); border: 1.5px solid var(--border); border-radius: var(--r-card); }

  @media (max-width: 1024px) {
    .cat-wrap { grid-template-columns: minmax(0, 1fr); gap: 18px; }
    .cat-legend { position: static; box-shadow: none; border: none; background: none; padding: 0; }
    .cat-legend-head, .cat-lbl { display: none; }
    .cat-list { flex-direction: row; overflow-x: auto; gap: 8px; padding: 3px 3px 10px; scrollbar-width: none; }
    .cat-list::-webkit-scrollbar { display: none; }
    .cat-item { width: auto; flex-shrink: 0; background: var(--white); border: 1.5px solid var(--line); border-radius: 999px; padding: 4px 14px 4px 5px; }
    .cat-item .em { width: 26px; height: 26px; border-radius: 999px; }
    .cat-levels { flex-wrap: nowrap; overflow-x: auto; padding: 3px; scrollbar-width: none; }
    .cat-levels::-webkit-scrollbar { display: none; }
    .cat-levels .chip { flex-shrink: 0; }
  }
  @media (max-width: 768px) {
    .cat-grid { grid-template-columns: minmax(0, 1fr); gap: 18px; }
    .cat-feature .cc { flex-direction: column; gap: 0; }
    .cat-feature .cc .cc-thumb { width: 100%; aspect-ratio: 16 / 9; min-height: 0; font-size: 64px; }
    .cat-feature .cc .cc-body { padding: 14px 8px 4px; }
    .cat-feature .cc .cc-title { font-size: 22px; }
  }
`

export default function Courses() {
  const [sp, setSp] = useSearchParams()
  const [search, setSearch] = useState(sp.get('q') || '')
  const [level, setLevel] = useState(sp.get('level') || '')
  const [categoryId, setCategoryId] = useState(sp.get('category') || '')
  const [sort, setSort] = useState(sp.get('ordering') || '-avg_rating')
  const [page, setPage] = useState(Number(sp.get('page')) || 1)

  // Reset to page 1 when filters change
  useEffect(() => { setPage(1) }, [search, level, categoryId, sort])

  // Debounced search → URL
  useEffect(() => {
    const t = setTimeout(() => {
      const next = new URLSearchParams()
      if (search) next.set('q', search)
      if (level) next.set('level', level)
      if (categoryId) next.set('category', categoryId)
      if (sort) next.set('ordering', sort)
      if (page > 1) next.set('page', String(page))
      setSp(next, { replace: true })
    }, 300)
    return () => clearTimeout(t)
  }, [search, level, categoryId, sort, page, setSp])

  const { data: cats = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.get('/categories/').then(r => r.data.results || r.data),
  })

  const params = new URLSearchParams()
  params.set('status', 'published')
  if (search) params.set('search', search)
  if (level) params.set('level', level)
  if (categoryId) params.set('category', categoryId)
  if (sort) params.set('ordering', sort)
  params.set('page', String(page))
  params.set('page_size', String(PAGE_SIZE))

  const { data, isLoading } = useQuery({
    queryKey: ['courses', params.toString()],
    queryFn: () => api.get(`/courses/?${params.toString()}`).then(r => r.data),
  })

  const courses = data?.results || data || []
  const total = data?.count ?? courses.length

  const hasFilters = !!(search || level || categoryId)
  const clearAll = () => { setLevel(''); setCategoryId(''); setSearch('') }
  // The first card of the first page becomes a wide "featured" sticker.
  const featureFirst = page === 1 && courses.length >= 3

  return (
    <Layout>
      <style>{styles}</style>
      <div className="container">
        <PageHeader eyebrow="Kurslar" title="Barcha kurslar"
          subtitle={`${total} ta kurs orasidan o'zingizga mosini toping`} />

        <div className="cat-wrap">
          <aside className="cat-legend" aria-label="Filtrlar">
            <div className="cat-legend-head">
              <h2>Legenda</h2>
              <span className="coord">FILTR</span>
            </div>
            <div className="cat-lbl">Yo'nalish</div>
            <div className="cat-list">
              <button type="button" className={`cat-item ${categoryId === '' ? 'on' : ''}`} onClick={() => setCategoryId('')}>
                <span className="em">🧭</span><span className="nm">Barcha kategoriyalar</span>
              </button>
              {cats.map(c => (
                <button type="button" key={c.id} className={`cat-item ${String(categoryId) === String(c.id) ? 'on' : ''}`}
                  onClick={() => setCategoryId(String(c.id))}>
                  <span className="em">{c.icon || '📍'}</span><span className="nm">{c.name}</span>
                </button>
              ))}
            </div>
            <div className="cat-lbl">Daraja</div>
            <div className="cat-levels">
              {LEVELS.map(l => (
                <button type="button" key={l.id} className={`chip ${level === l.id ? 'on' : ''}`} onClick={() => setLevel(l.id)}>{l.label}</button>
              ))}
            </div>
          </aside>

          <div className="cat-main">
            <FilterBar search={search} onSearch={setSearch} placeholder="Kurs nomi yoki tavsifi bo'yicha qidirish…"
              count={total}
              onClear={hasFilters ? clearAll : null}>
              <select className="select" value={sort} onChange={e => setSort(e.target.value)} aria-label="Saralash">
                <option value="-avg_rating">Eng yuqori reyting</option>
                <option value="-created_at">Yangi qo'shilgan</option>
                <option value="created_at">Eski</option>
                <option value="title">Nomi (A-Z)</option>
                <option value="-title">Nomi (Z-A)</option>
              </select>
            </FilterBar>

            {isLoading ? (
              <div className="loading-state"><span className="spinner" />Kurslar yuklanmoqda…</div>
            ) : courses.length === 0 ? (
              <div className="cat-empty empty-state">
                <div className="es-ico"><Icon name="compass" size={24} /></div>
                <div className="es-title">Bu hududda kurs topilmadi</div>
                <div className="es-sub">Filtrlarni o'zgartirib ko'ring yoki barchasini tozalang.</div>
                <Link to="/courses" className="btn btn-accent btn-sm" onClick={(e) => { e.preventDefault(); clearAll() }}>Filtrlarni tozalash</Link>
              </div>
            ) : (
              <>
                <div className="cat-grid">
                  {courses.map((c, i) => (
                    <div key={c.id} className={`cat-cell ${featureFirst && i === 0 ? 'cat-feature' : ''}`}>
                      <CourseCard course={c} showProgress />
                    </div>
                  ))}
                </div>
                <Pagination page={page} pageSize={PAGE_SIZE} total={total} onChange={setPage} />
              </>
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}
