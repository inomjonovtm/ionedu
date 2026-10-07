import { Link } from 'react-router-dom'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import api, { absUrl } from '../../api/client'
import DashLayout from '../../components/DashLayout'
import Icon from '../../components/Icon'
import { PageHead, StatCard, Panel, EmptyState } from '../../components/Dash'

const MONTH_NAMES = ['Yan', 'Fev', 'Mar', 'Apr', 'May', 'Iyn', 'Iyl', 'Avg', 'Sen', 'Okt', 'Noy', 'Dek']

function monthLabel(ym) {
  const m = parseInt(ym.split('-')[1], 10)
  return MONTH_NAMES[m - 1] || ym
}

/** Minimal SVG multi-series line/area chart — no chart library needed. */
function TrendChart({ months = [], series = [] }) {
  const [hover, setHover] = useState(null)
  const W = 720, H = 220, PAD_L = 36, PAD_B = 26, PAD_T = 14, PAD_R = 10
  const innerW = W - PAD_L - PAD_R
  const innerH = H - PAD_T - PAD_B
  const maxVal = Math.max(1, ...series.flatMap(s => s.data))
  // round max up to a nice number
  const niceMax = Math.ceil(maxVal / 5) * 5 || 5
  const x = (i) => PAD_L + (months.length > 1 ? (i / (months.length - 1)) * innerW : innerW / 2)
  const y = (v) => PAD_T + innerH - (v / niceMax) * innerH

  const gridLines = [0, 0.25, 0.5, 0.75, 1].map(f => Math.round(niceMax * f))

  return (
    <div style={{ position: 'relative' }}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block' }}
        onMouseLeave={() => setHover(null)}>
        {gridLines.map(v => (
          <g key={v}>
            <line x1={PAD_L} x2={W - PAD_R} y1={y(v)} y2={y(v)} stroke="var(--border-2)" strokeWidth="1" />
            <text x={PAD_L - 8} y={y(v) + 4} textAnchor="end" fontSize="10" fill="var(--text-4)">{v}</text>
          </g>
        ))}
        {months.map((m, i) => (
          <text key={m} x={x(i)} y={H - 8} textAnchor="middle" fontSize="10" fill="var(--text-4)">
            {monthLabel(m)}
          </text>
        ))}
        {series.map(s => {
          const pts = s.data.map((v, i) => `${x(i)},${y(v)}`).join(' ')
          const area = `${PAD_L},${y(0)} ${pts} ${x(s.data.length - 1)},${y(0)}`
          return (
            <g key={s.name}>
              {s.fill && <polygon points={area} fill={s.color} opacity="0.08" />}
              <polyline points={pts} fill="none" stroke={s.color} strokeWidth="2.2"
                strokeLinejoin="round" strokeLinecap="round" />
              {s.data.map((v, i) => (
                <circle key={i} cx={x(i)} cy={y(v)} r={hover === i ? 4.5 : 3} fill="white"
                  stroke={s.color} strokeWidth="2" />
              ))}
            </g>
          )
        })}
        {/* hover hit areas */}
        {months.map((m, i) => (
          <rect key={`h-${m}`} x={x(i) - innerW / months.length / 2} y={PAD_T}
            width={innerW / months.length} height={innerH} fill="transparent"
            onMouseEnter={() => setHover(i)} />
        ))}
        {hover !== null && (
          <line x1={x(hover)} x2={x(hover)} y1={PAD_T} y2={PAD_T + innerH}
            stroke="var(--text-4)" strokeWidth="1" strokeDasharray="3 3" />
        )}
      </svg>
      {hover !== null && (
        <div style={{
          position: 'absolute', top: 0, left: `${(x(hover) / W) * 100}%`, transform: 'translateX(-50%)',
          background: 'var(--text)', color: 'white', borderRadius: 8, padding: '8px 12px',
          fontSize: 12, pointerEvents: 'none', whiteSpace: 'nowrap', zIndex: 5,
        }}>
          <div style={{ fontWeight: 700, marginBottom: 4 }}>{monthLabel(months[hover])}</div>
          {series.map(s => (
            <div key={s.name} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 8, height: 8, borderRadius: 99, background: s.color }} />
              {s.name}: <strong>{s.data[hover]}</strong>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function RoleDonut({ roles = {} }) {
  const data = [
    { label: "O'quvchilar", value: roles.students || 0, color: 'var(--blue-600)' },
    { label: "O'qituvchilar", value: roles.teachers || 0, color: 'var(--green-600)' },
    { label: 'Adminlar', value: roles.admins || 0, color: 'var(--amber-600)' },
  ]
  const total = data.reduce((s, d) => s + d.value, 0) || 1
  const C = 2 * Math.PI * 40
  let offset = 0
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
      <div style={{ position: 'relative', width: 110, height: 110, flexShrink: 0 }}>
        <svg viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)' }}>
          <circle cx="50" cy="50" r="40" fill="none" stroke="var(--border-2)" strokeWidth="12" />
          {data.map(d => {
            const len = (d.value / total) * C
            const el = (
              <circle key={d.label} cx="50" cy="50" r="40" fill="none" stroke={d.color} strokeWidth="12"
                strokeDasharray={`${len} ${C - len}`} strokeDashoffset={-offset}
                style={{ transition: 'stroke-dasharray .6s ease' }} />
            )
            offset += len
            return el
          })}
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 22, lineHeight: 1 }}>{total}</div>
          <div style={{ fontSize: 10, color: 'var(--text-3)' }}>jami</div>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13 }}>
        {data.map(d => (
          <div key={d.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 10, height: 10, borderRadius: 3, background: d.color }} />
            <span style={{ color: 'var(--text-2)', flex: 1 }}>{d.label}</span>
            <strong>{d.value}</strong>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function AdminDashboard() {
  const { data: stats = {} } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => api.get('/admin/stats/').then(r => r.data),
  })
  const { data: analytics } = useQuery({
    queryKey: ['admin-analytics'],
    queryFn: () => api.get('/admin/analytics/').then(r => r.data),
  })
  const { data: pending = [] } = useQuery({
    queryKey: ['admin-pending'],
    queryFn: () => api.get('/admin/courses/pending/').then(r => r.data),
  })
  const { data: recentUsers = [] } = useQuery({
    queryKey: ['admin-recent-users'],
    queryFn: () => api.get('/admin/users/?page_size=6').then(r => r.data?.results || []),
  })
  const { data: messagesData } = useQuery({
    queryKey: ['admin-contact-messages-recent'],
    queryFn: () => api.get('/admin/contact-messages/?page_size=5').then(r => r.data),
  })
  const messages = messagesData?.results || []

  const unreadMessages = messages.filter(m => !m.is_read).length

  return (
    <DashLayout kind="admin">
      <PageHead title="Boshqaruv paneli" sub="Platforma statistikasi va boshqaruv markazi">
        <Link to="/admin-panel/courses/new" className="btn btn-primary">
          <Icon name="plus" size={15} /> Yangi kurs
        </Link>
        <Link to="/admin-panel/settings" className="btn btn-secondary">
          <Icon name="settings" size={15} /> Sozlamalar
        </Link>
      </PageHead>

      {/* Top stats */}
      <div className="kpi-grid">
        <StatCard icon="users" value={stats.users_total ?? 0} label="Foydalanuvchilar" tone="blue" to="/admin-panel/users" delay={0} />
        <StatCard icon="book" value={stats.courses_published ?? 0} label="Faol kurslar" tone="green" to="/admin-panel/courses" delay={1} />
        <StatCard icon="award" value={stats.certificates_total ?? 0} label="Sertifikatlar" tone="amber" to="/admin-panel/certificates" delay={2} />
        <StatCard icon="clock" value={stats.courses_pending ?? 0} label="Moderatsiyada" tone={stats.courses_pending > 0 ? 'red' : 'gray'} to="/admin-panel/courses" delay={3} />
      </div>

      {/* Analytics row */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20, marginBottom: 20 }}>
        <Panel
          title="So'nggi 12 oy dinamikasi"
          flush={false}
          action={
            <div style={{ display: 'flex', gap: 14, fontSize: 12, color: 'var(--text-3)', flexWrap: 'wrap' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><span style={{ width: 8, height: 8, borderRadius: 99, background: 'var(--green-600)' }} /> Ro'yxat</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><span style={{ width: 8, height: 8, borderRadius: 99, background: 'var(--blue-600)' }} /> Yozilish</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><span style={{ width: 8, height: 8, borderRadius: 99, background: 'var(--amber-600)' }} /> Sertifikat</span>
            </div>
          }>
          {analytics ? (
            <TrendChart months={analytics.months} series={[
              { name: "Ro'yxatdan o'tish", data: analytics.registrations, color: 'var(--green-600)', fill: true },
              { name: 'Kursga yozilish', data: analytics.enrollments, color: 'var(--blue-600)' },
              { name: 'Sertifikatlar', data: analytics.certificates, color: 'var(--amber-600)' },
            ]} />
          ) : (
            <div className="loading-state" style={{ padding: 40 }}><span className="spinner" /></div>
          )}
        </Panel>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <Panel title="Foydalanuvchilar taqsimoti" flush={false}>
            <RoleDonut roles={analytics?.roles} />
          </Panel>
          <Panel title="Top kurslar" flush={false} style={{ flex: 1 }}>
            {(analytics?.top_courses || []).length === 0 ? (
              <div className="text-sm text-muted">Hozircha ma'lumot yo'q</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {analytics.top_courses.map((c, i) => {
                  const max = analytics.top_courses[0]?.n || 1
                  return (
                    <Link key={c.slug} to={`/courses/${c.slug}`} style={{ textDecoration: 'none' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                        <span style={{ color: 'var(--text-2)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{i + 1}. {c.title}</span>
                        <strong className="font-mono" style={{ flexShrink: 0, marginLeft: 8, fontWeight: 560 }}>{c.n}</strong>
                      </div>
                      <div className="progress" style={{ height: 4 }}>
                        <div className="progress-fill" style={{ width: `${(c.n / max) * 100}%` }} />
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </Panel>
        </div>
      </div>

      {/* Secondary cards */}
      <div className="two-col" style={{ marginBottom: 20 }}>
        <Panel title="Moderatsiyada kutilayotganlar" count={pending.length} to={pending.length > 0 ? '/admin-panel/courses' : undefined}>
          {pending.length === 0 ? (
            <EmptyState small icon="checkC" title="Kutilayotgan kurslar yo'q"
              sub="Yangi kurs moderatsiyaga yuborilganda shu yerda ko'rinadi." />
          ) : (
            <table className="table">
              <thead><tr><th>Kurs</th><th>Muallif</th><th>Sana</th></tr></thead>
              <tbody>
                {pending.slice(0, 5).map(c => (
                  <tr key={c.id}>
                    <td>
                      <Link to={`/courses/${c.slug}`} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div className={`thumb thumb-${c.thumb_color}`} style={{ width: 40, height: 28, fontSize: 14, borderRadius: 7 }}>{c.thumb_emoji}</div>
                        <strong style={{ fontSize: 13.5 }}>{c.title}</strong>
                      </Link>
                    </td>
                    <td className="text-sm">{c.teacher?.display_name}</td>
                    <td className="text-sm text-muted">{new Date(c.created_at).toLocaleDateString('uz-UZ')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Panel>

        <Panel title="Yangi xabarlar" count={unreadMessages} to="/admin-panel/messages">
          {messages.length === 0 ? (
            <EmptyState small icon="message" title="Hozircha xabar yo'q"
              sub="Aloqa formasidan kelgan xabarlar shu yerda ko'rinadi." />
          ) : (
            <div>
              {messages.map(m => (
                <div key={m.id} className="row-line" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 3, background: m.is_read ? 'transparent' : 'var(--green-50)' }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                    <strong style={{ fontSize: 13.5 }}>{m.name}</strong>
                    <span className="text-xs text-muted">· {new Date(m.created_at).toLocaleString('uz-UZ')}</span>
                  </div>
                  <div className="text-sm" style={{ color: 'var(--text-2)' }}>
                    <span style={{ fontWeight: 500 }}>{m.subject}</span> — {m.message?.slice(0, 80)}{m.message?.length > 80 ? '…' : ''}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Panel>
      </div>

      <Panel title="Yangi ro'yxatdan o'tganlar" to="/admin-panel/users">
        {recentUsers.length === 0 ? (
          <EmptyState small icon="users" title="Foydalanuvchilar yo'q" />
        ) : (
          <table className="table">
            <thead><tr><th>Foydalanuvchi</th><th>Email</th><th>Rol</th><th>Sana</th></tr></thead>
            <tbody>
              {recentUsers.map(u => (
                <tr key={u.id}>
                  <td>
                    <Link to={`/admin-panel/users/${u.id}`} style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--text)' }}>
                      <div className="avatar avatar-blue" style={{ width: 32, height: 32, fontSize: 11, overflow: 'hidden' }}>
                        {u.avatar ? <img src={absUrl(u.avatar)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : u.initials}
                      </div>
                      <strong style={{ fontSize: 13 }}>{u.display_name}</strong>
                    </Link>
                  </td>
                  <td className="text-sm font-mono">{u.email || u.phone}</td>
                  <td><span className={`badge badge-${u.role === 'admin' ? 'amber' : u.role === 'teacher' ? 'green' : 'blue'}`}>{u.role === 'admin' ? 'Admin' : u.role === 'teacher' ? "O'qituvchi" : "O'quvchi"}</span></td>
                  <td className="text-sm text-muted">{new Date(u.date_joined).toLocaleDateString('uz-UZ')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Panel>
    </DashLayout>
  )
}
