import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '../../api/client'
import DashLayout from '../../components/DashLayout'
import Pagination from '../../components/Pagination'
import FilterBar from '../../components/FilterBar'
import { PageHead, Panel, EmptyState, StatCard } from '../../components/Dash'

const PAGE_SIZE = 15

export default function TeacherStudents() {
  const [page, setPage] = useState(1)
  const [q, setQ] = useState('')
  const { data } = useQuery({
    queryKey: ['teacher-students'],
    queryFn: () => api.get('/teacher/students/').then(r => r.data),
  })
  const all = data || []

  const filtered = useMemo(() => all.filter(e =>
    !q.trim()
    || e.student?.display_name?.toLowerCase().includes(q.trim().toLowerCase())
    || e.course_title?.toLowerCase().includes(q.trim().toLowerCase())
  ), [all, q])

  const total = filtered.length
  const list = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const avgProgress = all.length
    ? Math.round(all.reduce((s, e) => s + (e.progress_percent || 0), 0) / all.length)
    : 0
  const finished = all.filter(e => e.progress_percent >= 100).length

  return (
    <DashLayout kind="teacher">
      <PageHead title="O'quvchilarim" sub="Kurslaringizga yozilgan o'quvchilar va ularning jarayoni" />

      <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <StatCard icon="users" value={all.length} label="Jami o'quvchilar" tone="blue" delay={0} />
        <StatCard icon="zap" value={`${avgProgress}%`} label="O'rtacha jarayon" tone="green" delay={1} />
        <StatCard icon="award" value={finished} label="Kursni tugatganlar" tone="amber" delay={2} />
      </div>

      <FilterBar search={q} onSearch={v => { setQ(v); setPage(1) }}
        placeholder="O'quvchi yoki kurs bo'yicha qidirish…" count={total} />

      <Panel title="O'quvchilar" count={total}>
        {list.length === 0 ? (
          q ? (
            <EmptyState icon="search" title="Hech narsa topilmadi" sub="Qidiruv so'zini o'zgartirib ko'ring." />
          ) : (
            <EmptyState icon="users" title="Hozircha o'quvchilar yo'q"
              sub="Kursingiz nashr etilgach, yozilgan o'quvchilar shu yerda ko'rinadi." />
          )
        ) : (
          <table className="table">
            <thead><tr><th>O'quvchi</th><th>Kurs</th><th>Jarayon</th><th>Yozilgan sana</th></tr></thead>
            <tbody>
              {list.map(e => (
                <tr key={e.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div className="avatar avatar-blue" style={{ width: 34, height: 34, fontSize: 12 }}>{e.student?.initials}</div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 13.5 }}>{e.student?.display_name}</div>
                        {(e.student?.email || e.student?.phone) && <div className="text-xs text-muted font-mono">{e.student.email || e.student.phone}</div>}
                      </div>
                    </div>
                  </td>
                  <td className="text-sm">{e.course_title}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div className="progress" style={{ height: 4, width: 110 }}>
                        <div className="progress-fill" style={{ width: `${e.progress_percent}%` }} />
                      </div>
                      <span className="text-xs font-mono" style={{ color: e.progress_percent >= 100 ? 'var(--green-700)' : 'var(--text-3)' }}>
                        {Math.round(e.progress_percent)}%
                      </span>
                    </div>
                  </td>
                  <td className="text-sm text-muted">{new Date(e.enrolled_at).toLocaleDateString('uz-UZ')}</td>
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
