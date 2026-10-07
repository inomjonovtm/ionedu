import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import api from '../../api/client'
import DashLayout from '../../components/DashLayout'
import Icon from '../../components/Icon'
import Pagination from '../../components/Pagination'
import FilterBar from '../../components/FilterBar'
import { PageHead, Panel, EmptyState, CourseStatus } from '../../components/Dash'

const PAGE_SIZE = 12

const TABS = [
  { id: 'all', label: 'Barchasi' },
  { id: 'published', label: 'Nashrda' },
  { id: 'pending', label: 'Moderatsiyada' },
  { id: 'draft', label: 'Qoralama' },
  { id: 'rejected', label: 'Rad etilgan' },
]

export default function TeacherCourses() {
  const qc = useQueryClient()
  const [page, setPage] = useState(1)
  const [tab, setTab] = useState('all')
  const [q, setQ] = useState('')

  const { data: allCourses = [] } = useQuery({
    queryKey: ['my-teaching'],
    queryFn: () => api.get('/courses/?mine=1&page_size=200').then(r => r.data.results || r.data),
  })

  const counts = useMemo(() => {
    const c = { all: allCourses.length }
    for (const t of TABS.slice(1)) c[t.id] = allCourses.filter(x => x.status === t.id).length
    return c
  }, [allCourses])

  const filtered = useMemo(() => allCourses
    .filter(c => tab === 'all' || c.status === tab)
    .filter(c => !q.trim() || c.title.toLowerCase().includes(q.trim().toLowerCase())),
  [allCourses, tab, q])

  const total = filtered.length
  const courses = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const del = useMutation({
    mutationFn: (slug) => api.delete(`/courses/${slug}/`),
    onSuccess: () => { qc.invalidateQueries(['my-teaching']); toast.success("O'chirildi") },
    onError: () => toast.error("O'chirib bo'lmadi"),
  })

  function switchTab(id) { setTab(id); setPage(1) }

  return (
    <DashLayout kind="teacher">
      <PageHead title="Mening kurslarim" sub={`Jami ${allCourses.length} ta kurs`}>
        <Link to="/teacher/courses/new" className="btn btn-primary"><Icon name="plus" size={15} /> Yangi kurs</Link>
      </PageHead>

      <FilterBar search={q} onSearch={v => { setQ(v); setPage(1) }} placeholder="Kurs qidirish…"
        count={total}
        tabs={TABS.map(t => ({ id: t.id, label: t.label, n: counts[t.id] }))}
        tab={tab} onTab={switchTab} />

      <Panel title="Kurslar" count={total}>
        {courses.length === 0 ? (
          q || tab !== 'all' ? (
            <EmptyState icon="search" title="Hech narsa topilmadi"
              sub="Filtr yoki qidiruv so'zini o'zgartirib ko'ring." />
          ) : (
            <EmptyState icon="book" title="Hozircha kurslar yo'q"
              sub="Birinchi kursingizni yarating — video darslar, testlar va materiallar qo'shing."
              action={<Link to="/teacher/courses/new" className="btn btn-primary btn-sm"><Icon name="plus" size={13} /> Kurs yaratish</Link>} />
          )
        ) : (
          <table className="table">
            <thead><tr><th>Kurs</th><th>O'quvchi</th><th>Reyting</th><th>Holat</th><th>Sana</th><th></th></tr></thead>
            <tbody>
              {courses.map(c => (
                <tr key={c.id}>
                  <td>
                    <Link to={`/teacher/courses/${c.slug}/edit`} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div className={`thumb thumb-${c.thumb_color}`} style={{ width: 48, height: 32, fontSize: 18, borderRadius: 8 }}>{c.thumb_emoji}</div>
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--text)', fontSize: 13.5 }}>{c.title}</div>
                        <div className="text-xs text-muted">{c.lessons_count} dars</div>
                      </div>
                    </Link>
                  </td>
                  <td className="font-mono text-sm">{c.students_count || 0}</td>
                  <td><span className="rating text-sm"><Icon name="starF" size={12} /> {c.rating_avg || 0}</span></td>
                  <td><CourseStatus status={c.status} /></td>
                  <td className="text-sm text-muted">{new Date(c.created_at).toLocaleDateString('uz-UZ')}</td>
                  <td>
                    <div className="row-actions">
                      <Link to={`/teacher/courses/${c.slug}/stats`} className="icon-btn" title="Statistika"><Icon name="chart" size={15} /></Link>
                      <Link to={`/teacher/courses/${c.slug}/edit`} className="icon-btn" title="Tahrirlash"><Icon name="edit" size={15} /></Link>
                      <Link to={`/courses/${c.slug}`} className="icon-btn" title="Ko'rish"><Icon name="eye" size={15} /></Link>
                      <button className="icon-btn" title="O'chirish"
                        onClick={() => { if (confirm(`"${c.title}" kursini o'chirishni tasdiqlaysizmi?`)) del.mutate(c.slug) }}>
                        <Icon name="trash" size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Panel>
      <Pagination page={page} pageSize={PAGE_SIZE} total={total} onChange={setPage} />
    </DashLayout>
  )
}
