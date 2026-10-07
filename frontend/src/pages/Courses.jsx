import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import api from '../api/client'
import Layout from '../components/Layout'
import CourseCard from '../components/CourseCard'
import Pagination from '../components/Pagination'
import FilterBar from '../components/FilterBar'
import PageHeader from '../components/PageHeader'

const PAGE_SIZE = 12

const styles = `
  .catalog-body { padding: 8px 0 80px; }
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

  return (
    <Layout>
      <style>{styles}</style>
      <div className="container">
        <PageHeader eyebrow="Kurslar" title="Barcha kurslar"
          subtitle={`${total} ta kurs orasidan o'zingizga mosini toping`} />

        <div className="catalog-body">
          <FilterBar search={search} onSearch={setSearch} placeholder="Kurs nomi yoki tavsifi bo'yicha qidirish…"
            count={total}
            onClear={(search || level || categoryId) ? () => { setLevel(''); setCategoryId(''); setSearch('') } : null}>
            <select className="select" value={categoryId} onChange={e => setCategoryId(e.target.value)}>
              <option value="">Barcha kategoriyalar</option>
              {cats.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
            </select>
            <select className="select" value={level} onChange={e => setLevel(e.target.value)}>
              <option value="">Barcha darajalar</option>
              <option value="beginner">Boshlang'ich</option>
              <option value="intermediate">O'rta</option>
              <option value="advanced">Murakkab</option>
            </select>
            <select className="select" value={sort} onChange={e => setSort(e.target.value)}>
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
            <div className="card" style={{ textAlign: 'center', padding: 60, color: 'var(--text-3)' }}>
              Kurslar topilmadi. Filtrlarni o'zgartirib ko'ring yoki <Link to="/courses" onClick={(e) => { e.preventDefault(); setLevel(''); setCategoryId(''); setSearch('') }} style={{ color: 'var(--green-600)' }}>filtrlarni tozalang</Link>.
            </div>
          ) : (
            <>
              <div className="grid grid-3">
                {courses.map(c => <CourseCard key={c.id} course={c} showProgress />)}
              </div>
              <Pagination page={page} pageSize={PAGE_SIZE} total={total} onChange={setPage} />
            </>
          )}
        </div>
      </div>
    </Layout>
  )
}
