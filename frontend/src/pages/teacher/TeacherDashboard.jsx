import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import api from '../../api/client'
import DashLayout from '../../components/DashLayout'
import Icon from '../../components/Icon'
import { PageHead, StatCard, Panel, EmptyState, CourseStatus, Stars } from '../../components/Dash'
import { useAuth } from '../../store/auth'

export default function TeacherDashboard() {
  const { user } = useAuth()
  const { data: courses = [] } = useQuery({
    queryKey: ['my-teaching'],
    queryFn: () => api.get('/courses/?mine=1').then(r => r.data.results || r.data),
  })
  const { data: students = [] } = useQuery({
    queryKey: ['teacher-students'],
    queryFn: () => api.get('/teacher/students/').then(r => r.data),
  })
  const { data: reviews = [] } = useQuery({
    queryKey: ['teacher-reviews'],
    queryFn: () => api.get('/teacher/reviews/').then(r => r.data),
  })

  const totalStudents = courses.reduce((s, c) => s + (c.students_count || 0), 0)
  const avgRating = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : (courses.length ? (courses.reduce((s, c) => s + (c.rating_avg || 0), 0) / courses.length).toFixed(1) : '—')

  const publishedCount = courses.filter(c => c.status === 'published').length
  const pendingCount = courses.filter(c => c.status === 'pending').length

  return (
    <DashLayout kind="teacher">
      <PageHead
        title={`Salom, ${user?.full_name?.split(' ')[0] || 'Ustoz'}`}
        sub="Kurslaringiz va o'quvchilaringizning umumiy holati">
        <Link to="/teacher/courses/new" className="btn btn-primary">
          <Icon name="plus" size={15} /> Yangi kurs
        </Link>
      </PageHead>

      <div className="kpi-grid">
        <StatCard icon="users" value={totalStudents} label="O'quvchilar" tone="blue" delay={0} />
        <StatCard icon="book" value={courses.length} label="Kurslarim" hint={`${publishedCount} tasi nashrda`} tone="green" delay={1} />
        <StatCard icon="starF" value={avgRating} label="O'rtacha reyting" hint={`${reviews.length} ta sharh`} tone="amber" delay={2} />
        <StatCard icon="clock" value={pendingCount} label="Moderatsiyada" tone={pendingCount > 0 ? 'red' : 'gray'} delay={3} />
      </div>

      {pendingCount > 0 && (
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '15px 20px', marginBottom: 20, borderColor: '#F2E8D4', background: 'var(--amber-50)' }}>
          <span className="sc-ico tone-amber" style={{ width: 34, height: 34, borderRadius: 10, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Icon name="clock" size={16} />
          </span>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ fontSize: 14, fontWeight: 600 }}>{pendingCount} ta kurs moderatsiyada</div>
            <div className="text-sm text-muted">Admin tasdiqlagandan keyin ommaviy katalogga chiqadi.</div>
          </div>
          <Link to="/teacher/courses" className="btn btn-secondary btn-sm">Ko'rish</Link>
        </div>
      )}

      <Panel title="Mening kurslarim" to="/teacher/courses" style={{ marginBottom: 20 }}>
        {courses.length === 0 ? (
          <EmptyState
            icon="book"
            title="Hozircha kurslar yo'q"
            sub="Birinchi kursingizni yarating — video darslar, testlar va materiallar qo'shing."
            action={<Link to="/teacher/courses/new" className="btn btn-primary btn-sm"><Icon name="plus" size={13} /> Kurs yaratish</Link>}
          />
        ) : (
          <table className="table">
            <thead><tr><th>Kurs</th><th>O'quvchilar</th><th>Reyting</th><th>Holat</th><th>Yaratilgan</th><th></th></tr></thead>
            <tbody>
              {courses.slice(0, 6).map(c => (
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
                    <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                      <Link to={`/teacher/courses/${c.slug}/stats`} className="icon-btn" title="Statistika"><Icon name="chart" size={15} /></Link>
                      <Link to={`/teacher/courses/${c.slug}/edit`} className="icon-btn" title="Tahrirlash"><Icon name="edit" size={15} /></Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Panel>

      <div className="two-col">
        <Panel title="So'nggi o'quvchilar" to="/teacher/students">
          {students.length === 0 ? (
            <EmptyState small icon="users" title="Hozircha o'quvchilar yo'q"
              sub="Kursingiz nashr etilgach, yozilgan o'quvchilar shu yerda ko'rinadi." />
          ) : (
            <div>
              {students.slice(0, 5).map(s => (
                <div key={s.id} className="row-line">
                  <div className="avatar avatar-blue" style={{ width: 32, height: 32, fontSize: 11 }}>{s.student?.initials}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 600 }}>{s.student?.display_name}</div>
                    <div className="text-xs text-muted">{s.course_title}</div>
                  </div>
                  <div style={{ width: 90, flexShrink: 0 }}>
                    <div className="progress" style={{ height: 4 }}><div className="progress-fill" style={{ width: `${s.progress_percent}%` }} /></div>
                    <div className="text-xs text-muted font-mono mt-1" style={{ textAlign: 'right' }}>{Math.round(s.progress_percent)}%</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Panel>

        <Panel title="Oxirgi sharhlar" to="/teacher/reviews">
          {reviews.length === 0 ? (
            <EmptyState small icon="star" title="Hozircha sharhlar yo'q"
              sub="O'quvchilar kursingizni baholaganda shu yerda ko'rinadi." />
          ) : (
            <div>
              {reviews.slice(0, 4).map(r => (
                <div key={r.id} className="row-line" style={{ alignItems: 'flex-start', flexDirection: 'column', gap: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%' }}>
                    <div className="avatar avatar-blue" style={{ width: 26, height: 26, fontSize: 10 }}>{r.student?.initials}</div>
                    <strong style={{ fontSize: 13, flex: 1 }}>{r.student?.display_name}</strong>
                    <Stars value={r.rating} />
                  </div>
                  <p className="text-sm" style={{ color: 'var(--text-2)', margin: 0 }}>
                    {r.comment?.slice(0, 100)}{r.comment?.length > 100 ? '…' : ''}
                  </p>
                  <div className="text-xs text-muted">{r.course_title}</div>
                </div>
              ))}
            </div>
          )}
        </Panel>
      </div>
    </DashLayout>
  )
}
