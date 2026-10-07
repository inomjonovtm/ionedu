import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import api from '../../api/client'
import DashLayout from '../../components/DashLayout'
import Icon from '../../components/Icon'
import Pagination from '../../components/Pagination'
import FilterBar from '../../components/FilterBar'
import { PageHead, StatCard, Panel, EmptyState, CourseStatus, Stars } from '../../components/Dash'
import { useAuth } from '../../store/auth'

const PAGE_SIZE = 15

const FILTERS = [
  { id: 'all', label: 'Barchasi' },
  { id: 'active', label: 'Jarayonda' },
  { id: 'done', label: 'Tugatgan' },
]

export default function CourseStats() {
  const { slug } = useParams()
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'
  const base = isAdmin ? '/admin-panel' : '/teacher'

  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['course-students', slug],
    queryFn: () => api.get(`/courses/${slug}/students/`).then(r => r.data),
  })

  const course = data?.course
  const stats = data?.stats || {}
  const all = data?.students || []

  const q = search.trim().toLowerCase()
  const filtered = useMemo(() => all
    .filter(s => filter === 'all' || (filter === 'done' ? s.completed : !s.completed))
    .filter(s => !q
      || (s.student?.display_name || '').toLowerCase().includes(q)
      || (s.student?.phone || '').toLowerCase().includes(q)
      || (s.student?.email || '').toLowerCase().includes(q)),
  [all, filter, q])

  const total = filtered.length
  const rows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const counts = useMemo(() => ({
    all: all.length,
    active: all.filter(s => !s.completed).length,
    done: all.filter(s => s.completed).length,
  }), [all])

  if (isLoading) {
    return (
      <DashLayout kind={isAdmin ? 'admin' : 'teacher'}>
        <div className="loading-state"><span className="spinner" />Yuklanmoqda…</div>
      </DashLayout>
    )
  }

  return (
    <DashLayout kind={isAdmin ? 'admin' : 'teacher'}>
      <div className="breadcrumb">
        <Link to={`${base}/courses`}>Kurslar</Link>
        <span className="sep">/</span>
        <span>{course?.title || slug}</span>
        <span className="sep">/</span>
        <span>Statistika</span>
      </div>

      <PageHead
        title={
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 12 }}>
            {course?.title || 'Kurs statistikasi'}
            {course && <CourseStatus status={course.status} />}
          </span>
        }
        sub="Kurs o'quvchilari ro'yxati va o'zlashtirish statistikasi">
        <Link to={`/courses/${slug}`} className="btn btn-secondary"><Icon name="eye" size={15} /> Ko'rish</Link>
        <Link to={`${base}/courses/${slug}/edit`} className="btn btn-primary"><Icon name="edit" size={15} /> Tahrirlash</Link>
      </PageHead>

      <div className="kpi-grid">
        <StatCard icon="users" value={stats.students ?? 0} label="O'quvchilar" tone="blue" delay={0} />
        <StatCard icon="zap" value={`${stats.avg_progress ?? 0}%`} label="O'rtacha jarayon"
          hint={`${stats.lessons_total ?? 0} ta dars`} tone="green" delay={1} />
        <StatCard icon="award" value={stats.completed ?? 0} label="Kursni tugatganlar"
          hint={`${stats.certificates ?? 0} ta sertifikat`} tone="amber" delay={2} />
        <StatCard icon="starF" value={stats.rating_count ? stats.rating_avg : '—'} label="O'rtacha baho"
          hint={`${stats.rating_count ?? 0} ta sharh`} tone={stats.rating_count ? 'green' : 'gray'} delay={3} />
      </div>

      {all.length > 0 && (
        <FilterBar search={search} onSearch={v => { setSearch(v); setPage(1) }}
          placeholder="Ism yoki telefon…" count={total}
          tabs={FILTERS.map(f => ({ id: f.id, label: f.label, n: counts[f.id] }))}
          tab={filter} onTab={id => { setFilter(id); setPage(1) }} />
      )}

      <Panel title="O'quvchilar" count={total}>
        {rows.length === 0 ? (
          all.length > 0 ? (
            <EmptyState small icon="search" title="Hech narsa topilmadi" sub="Filtr yoki qidiruvni o'zgartirib ko'ring." />
          ) : (
            <EmptyState icon="users" title="Hozircha o'quvchilar yo'q"
              sub="Kursga yozilgan o'quvchilar va ularning jarayoni shu yerda ko'rinadi." />
          )
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>O'quvchi</th>
                <th>Jarayon</th>
                <th>Baho</th>
                <th>Sertifikat</th>
                <th>Yozilgan</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(s => (
                <tr key={s.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div className="avatar avatar-blue" style={{ width: 34, height: 34, fontSize: 12 }}>{s.student?.initials}</div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 13.5 }}>{s.student?.display_name}</div>
                        {(s.student?.email || s.student?.phone) && <div className="text-xs text-muted font-mono">{s.student.email || s.student.phone}</div>}
                      </div>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div className="progress" style={{ height: 4, width: 110 }}>
                        <div className="progress-fill" style={{ width: `${s.progress_percent}%` }} />
                      </div>
                      <span className="text-xs font-mono" style={{ color: s.completed ? 'var(--green-700)' : 'var(--text-3)' }}>
                        {Math.round(s.progress_percent)}%
                      </span>
                    </div>
                    <div className="text-xs text-muted mt-1">
                      {s.lessons_done}/{stats.lessons_total ?? 0} dars
                    </div>
                  </td>
                  <td>{s.rating ? <Stars value={s.rating} size={12} /> : <span className="text-muted">—</span>}</td>
                  <td>
                    {s.certificate ? (
                      <Link to={`/certificate/${s.certificate.unique_id}`} className="badge badge-green"
                        title={`${Math.round(s.certificate.score_percent)}% — ${new Date(s.certificate.issued_at).toLocaleDateString('uz-UZ')}`}>
                        <Icon name="award" size={11} /> {Math.round(s.certificate.score_percent)}%
                      </Link>
                    ) : <span className="text-muted">—</span>}
                  </td>
                  <td className="text-sm text-muted">{new Date(s.enrolled_at).toLocaleDateString('uz-UZ')}</td>
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
