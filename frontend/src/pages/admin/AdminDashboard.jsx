import { Link } from 'react-router-dom'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import api, { absUrl } from '../../api/client'
import DashLayout from '../../components/DashLayout'
import Icon from '../../components/Icon'
import { PageHead, StatCard, Panel, EmptyState } from '../../components/Dash'
import { ErrorState, LoadingBlock } from '../../components/PanelKit'

const MONTH_NAMES = ['Yan', 'Fev', 'Mar', 'Apr', 'May', 'Iyn', 'Iyl', 'Avg', 'Sen', 'Okt', 'Noy', 'Dek']

function monthLabel(ym) {
  const [y, m] = String(ym || '').split('-')
  const name = MONTH_NAMES[parseInt(m, 10) - 1]
  return name ? `${name} ${y}` : String(ym || '')
}
const monthShort = (ym) => MONTH_NAMES[parseInt(String(ym).split('-')[1], 10) - 1] || ym

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('uz-UZ') : '—')
const fmtNum = (n) => Number(n ?? 0).toLocaleString('ru-RU')

const ROLE_META = {
  admin: ['amber', 'Admin'],
  teacher: ['green', "O'qituvchi"],
  student: ['blue', "O'quvchi"],
}

const SERIES = [
  { key: 'registrations', name: "Ro'yxatdan o'tish", short: "Ro'yxat", color: 'var(--sea)', fill: 'var(--sea-soft)' },
  { key: 'enrollments', name: 'Kursga yozilish', short: 'Yozilish', color: 'var(--violet)' },
  { key: 'certificates', name: 'Sertifikatlar', short: 'Sertifikat', color: 'var(--coral)' },
]

/** Axis step that yields 4 even, integer grid divisions. */
function niceStep(max) {
  const raw = Math.max(1, max) / 4
  const p = 10 ** Math.floor(Math.log10(raw))
  const f = raw / p
  const n = f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10
  return Math.max(1, Math.round(n * p))
}

/**
 * Flat multi-series line chart (hand-rolled SVG).
 * Values of the hovered / tapped month are shown in a readout row above the
 * plot instead of a floating tooltip, so nothing can overflow on small screens.
 */
function TrendChart({ months = [], series = [] }) {
  const last = Math.max(0, months.length - 1)
  const [picked, setPicked] = useState(null)
  const [off, setOff] = useState({})
  const active = picked === null || picked > last ? last : picked
  const shown = series.filter(s => !off[s.key])

  const W = 720, H = 240, PAD_L = 38, PAD_B = 28, PAD_T = 12, PAD_R = 14
  const innerW = W - PAD_L - PAD_R
  const innerH = H - PAD_T - PAD_B
  const maxVal = Math.max(1, ...shown.flatMap(s => s.data))
  const step = niceStep(maxVal)
  const top = step * 4
  const x = (i) => PAD_L + (months.length > 1 ? (i / last) * innerW : innerW / 2)
  const y = (v) => PAD_T + innerH - (v / top) * innerH
  const ticks = [0, 1, 2, 3, 4].map(k => k * step)

  function pick(e) {
    const box = e.currentTarget.getBoundingClientRect()
    if (!box.width || months.length < 2) return
    const px = ((e.clientX - box.left) / box.width) * W
    const i = Math.round(((px - PAD_L) / innerW) * last)
    setPicked(Math.min(last, Math.max(0, i)))
  }

  return (
    <div className="adb-trend">
      <div className="adb-readout">
        <span className="adb-readout-month">{monthLabel(months[active])}</span>
        {series.map(s => (
          <button type="button" key={s.key} className={`adb-legend ${off[s.key] ? 'off' : ''}`}
            onClick={() => setOff(o => ({ ...o, [s.key]: !o[s.key] }))}
            aria-pressed={!off[s.key]} title={off[s.key] ? "Ko'rsatish" : 'Yashirish'}>
            <i style={{ background: s.color }} />
            <span>{s.short}</span>
            <b>{fmtNum(s.data[active])}</b>
          </button>
        ))}
      </div>
      <div className="adb-chart-scroll">
        <svg viewBox={`0 0 ${W} ${H}`} className="adb-chart" role="img"
          aria-label="So'nggi 12 oy dinamikasi grafigi"
          onPointerMove={pick} onPointerDown={pick} onPointerLeave={e => { if (e.pointerType === 'mouse') setPicked(null) }}>
          {ticks.map(v => (
            <g key={v}>
              <line x1={PAD_L} x2={W - PAD_R} y1={y(v)} y2={y(v)} stroke="var(--border)"
                strokeWidth="1.2" strokeDasharray={v === 0 ? undefined : '4 5'} />
              <text x={PAD_L - 9} y={y(v) + 4} textAnchor="end" className="adb-axis">{v}</text>
            </g>
          ))}
          {months.map((m, i) => (
            <text key={m} x={x(i)} y={H - 8} textAnchor="middle"
              className={`adb-axis ${i === active ? 'on' : ''}`}>{monthShort(m)}</text>
          ))}
          <line x1={x(active)} x2={x(active)} y1={PAD_T} y2={PAD_T + innerH}
            stroke="var(--line)" strokeWidth="1.4" strokeDasharray="3 4" />
          {shown.map(s => {
            const pts = s.data.map((v, i) => `${x(i)},${y(v)}`).join(' ')
            return (
              <g key={s.key}>
                {s.fill && months.length > 1 && (
                  <polygon points={`${x(0)},${y(0)} ${pts} ${x(last)},${y(0)}`} fill={s.fill} opacity="0.55" />
                )}
                <polyline points={pts} fill="none" stroke={s.color} strokeWidth="2.6"
                  strokeLinejoin="round" strokeLinecap="round" />
                <circle cx={x(active)} cy={y(s.data[active] || 0)} r="5.5" fill="var(--white)"
                  stroke={s.color} strokeWidth="2.6" />
              </g>
            )
          })}
        </svg>
      </div>
    </div>
  )
}

/** Flat stacked bar of user roles — sits on the ink hero. */
function RoleBar({ students = 0, teachers = 0, admins = 0 }) {
  const data = [
    { label: "O'quvchilar", value: students, cls: 'st' },
    { label: "O'qituvchilar", value: teachers, cls: 'tc' },
    { label: 'Adminlar', value: admins, cls: 'ad' },
  ]
  const total = data.reduce((s, d) => s + d.value, 0)
  return (
    <div className="adb-roles">
      <div className="adb-rolebar" aria-hidden="true">
        {total === 0
          ? <span className="none" style={{ flex: 1 }} />
          : data.filter(d => d.value > 0).map(d => <span key={d.cls} className={d.cls} style={{ flex: d.value }} />)}
      </div>
      <div className="adb-rolelegend">
        {data.map(d => (
          <div key={d.cls}>
            <i className={d.cls} />
            <b>{fmtNum(d.value)}</b>
            <span>{d.label}{total > 0 && ` · ${Math.round((d.value / total) * 100)}%`}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function AdminDashboard() {
  const statsQ = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => api.get('/admin/stats/').then(r => r.data),
  })
  const analyticsQ = useQuery({
    queryKey: ['admin-analytics'],
    queryFn: () => api.get('/admin/analytics/').then(r => r.data),
  })
  const pendingQ = useQuery({
    queryKey: ['admin-pending'],
    queryFn: () => api.get('/admin/courses/pending/').then(r => r.data),
  })
  const usersQ = useQuery({
    queryKey: ['admin-recent-users'],
    queryFn: () => api.get('/admin/users/?page_size=6').then(r => r.data?.results || []),
  })
  const messagesQ = useQuery({
    queryKey: ['admin-contact-messages-recent'],
    queryFn: () => api.get('/admin/contact-messages/?page_size=5').then(r => r.data),
  })
  // Exact unread count (the "recent" list above is capped at 5 rows).
  const unreadQ = useQuery({
    queryKey: ['admin-contact-messages', 'unread-count'],
    queryFn: () => api.get('/admin/contact-messages/?unread=1&page_size=1').then(r => r.data?.count ?? 0),
  })

  const stats = statsQ.data || {}
  const analytics = analyticsQ.data
  const pending = Array.isArray(pendingQ.data) ? pendingQ.data : []
  const recentUsers = usersQ.data || []
  const messages = messagesQ.data?.results || []
  const unreadMessages = unreadQ.data ?? messages.filter(m => !m.is_read).length
  const pendingCount = pendingQ.isSuccess ? pending.length : (stats.courses_pending ?? 0)

  const regs = analytics?.registrations || []
  const regsThisMonth = regs.length ? regs[regs.length - 1] : null
  const topCourses = analytics?.top_courses || []
  const topMax = Math.max(1, ...topCourses.map(c => c.n || 0))

  const attentionLoading = pendingQ.isLoading || unreadQ.isLoading
  const attentionTotal = pendingCount + unreadMessages
  const today = new Date()
  const stamp = `${today.getFullYear()}.${String(today.getMonth() + 1).padStart(2, '0')}.${String(today.getDate()).padStart(2, '0')}`

  function retryAll() {
    [statsQ, analyticsQ, pendingQ, usersQ, messagesQ, unreadQ].forEach(q => { if (q.isError) q.refetch() })
  }

  return (
    <DashLayout kind="admin">
      <style>{css}</style>
      <PageHead title="Boshqaruv paneli" sub="Platforma holati, moderatsiya navbati va so'nggi faollik">
        <Link to="/admin-panel/settings" className="btn btn-secondary">
          <Icon name="sliders" size={15} /> Sozlamalar
        </Link>
        <Link to="/admin-panel/courses/new" className="btn btn-primary">
          <Icon name="plus" size={15} /> Yangi kurs
        </Link>
      </PageHead>

      {statsQ.isError && analyticsQ.isError ? (
        <ErrorState title="Statistikani yuklab bo'lmadi" onRetry={retryAll} />
      ) : (
        <>
          {/* ── Hero + needs attention ── */}
          <section className="adb-top">
            <div className="adb-hero fade-up">
              <div className="adb-hero-head">
                <span className="adb-tag"><Icon name="compass" size={13} /> Ionedu · umumiy xarita</span>
                <span className="coord adb-coord">{stamp} · 41.31°N 69.24°E</span>
              </div>
              <div className="adb-hero-num">
                <strong>{statsQ.isLoading ? '…' : fmtNum(stats.users_total)}</strong>
                <span>
                  ro'yxatdan o'tgan foydalanuvchi
                  {regsThisMonth !== null && <em>Bu oy +{fmtNum(regsThisMonth)} yangi</em>}
                </span>
              </div>
              <RoleBar students={stats.users_students} teachers={stats.users_teachers} admins={stats.users_admins} />
              <Link to="/admin-panel/users" className="adb-hero-link">
                Foydalanuvchilarni boshqarish <Icon name="arrowR" size={14} />
              </Link>
            </div>

            <div className={`adb-att fade-up-d1 ${attentionTotal > 0 ? 'hot' : ''}`}>
              <div className="adb-att-head">
                <span className="adb-att-pin"><Icon name={attentionTotal > 0 ? 'bell' : 'checkC'} size={17} /></span>
                <div>
                  <h3>Diqqat talab qiladi</h3>
                  <p>{attentionLoading ? 'Tekshirilmoqda…'
                    : attentionTotal > 0 ? `${attentionTotal} ta ish sizni kutmoqda` : "Hammasi joyida — navbat bo'sh"}</p>
                </div>
              </div>

              <Link to="/admin-panel/courses" className={`adb-att-row ${pendingCount > 0 ? 'on' : ''}`}>
                <span className="adb-att-n">{pendingQ.isLoading ? '·' : pendingCount}</span>
                <span className="adb-att-txt">
                  <b>Moderatsiyadagi kurslar</b>
                  <small>{pendingQ.isError ? "Yuklab bo'lmadi"
                    : pendingCount > 0
                      ? pending.slice(0, 2).map(c => c.title).join(', ') + (pendingCount > 2 ? ` va yana ${pendingCount - 2} ta` : '')
                      : "Ko'rib chiqilishi kerak bo'lgan kurs yo'q"}</small>
                </span>
                <Icon name="arrowR" size={15} />
              </Link>

              <Link to="/admin-panel/messages" className={`adb-att-row ${unreadMessages > 0 ? 'on' : ''}`}>
                <span className="adb-att-n">{unreadQ.isLoading ? '·' : unreadMessages}</span>
                <span className="adb-att-txt">
                  <b>O'qilmagan xabarlar</b>
                  <small>{unreadQ.isError && messagesQ.isError ? "Yuklab bo'lmadi"
                    : unreadMessages > 0
                      ? (messages.find(m => !m.is_read)?.subject || 'Aloqa formasidan yangi xabar')
                      : "Barcha xabarlar o'qilgan"}</small>
                </span>
                <Icon name="arrowR" size={15} />
              </Link>

              {pending.length > 0 && (
                <div className="adb-att-queue">
                  <div className="adb-mono">Navbatdagi kurslar</div>
                  {pending.slice(0, 3).map(c => (
                    <Link key={c.id} to={`/courses/${c.slug}`} className="adb-q">
                      <span className={`thumb thumb-${c.thumb_color || 'slate'} adb-q-thumb`}>{c.thumb_emoji}</span>
                      <span className="adb-q-txt">
                        <b>{c.title}</b>
                        <small>{c.teacher?.display_name || "Muallif ko'rsatilmagan"} · {fmtDate(c.created_at)}</small>
                      </span>
                      <Icon name="eye" size={14} />
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* ── KPIs ── */}
          <div className="kpi-grid">
            <StatCard icon="book" value={fmtNum(stats.courses_published)} label="Nashrdagi kurslar"
              hint={`Jami ${fmtNum(stats.courses_total)} ta kurs`} tone="green" to="/admin-panel/courses" delay={0} />
            <StatCard icon="grad" value={fmtNum(stats.enrollments_total)} label="Kursga yozilishlar"
              hint="Barcha kurslar bo'yicha" tone="blue" delay={1} />
            <StatCard icon="award" value={fmtNum(stats.certificates_total)} label="Sertifikatlar"
              hint="Berilgan sertifikatlar" tone="amber" to="/admin-panel/certificates" delay={2} />
            <StatCard icon="fileText" value={analytics ? fmtNum(analytics.attempts_total) : '…'} label="Test urinishlari"
              hint="Yakunlangan urinishlar" tone="violet" to="/admin-panel/tests" delay={3} />
          </div>

          {/* ── Trend + top courses ── */}
          <section className="adb-mid">
            <Panel title="So'nggi 12 oy dinamikasi" flush={false}
              action={<span className="adb-mono">Oyma-oy</span>}>
              {analyticsQ.isLoading ? (
                <LoadingBlock bare />
              ) : analyticsQ.isError || !analytics ? (
                <ErrorState bare title="Grafikni yuklab bo'lmadi" sub={null} onRetry={() => analyticsQ.refetch()} />
              ) : (
                <TrendChart months={analytics.months || []}
                  series={SERIES.map(s => ({ ...s, data: analytics[s.key] || [] }))} />
              )}
            </Panel>

            <Panel title="Eng ommabop kurslar" flush={false}
              action={<span className="adb-mono">Yozilishlar</span>}>
              {analyticsQ.isLoading ? (
                <LoadingBlock bare />
              ) : topCourses.length === 0 ? (
                <EmptyState small icon="book" title="Hozircha ma'lumot yo'q"
                  sub="Nashr etilgan kurslarga yozilishlar shu yerda ko'rinadi." />
              ) : (
                <ol className="adb-rank">
                  {topCourses.map((c, i) => (
                    <li key={c.slug}>
                      <Link to={`/courses/${c.slug}`}>
                        <span className={`adb-rank-n ${i === 0 ? 'first' : ''}`}>{i + 1}</span>
                        <span className="adb-rank-body">
                          <span className="adb-rank-title">{c.title}</span>
                          <span className="adb-rank-track"><i style={{ width: `${Math.max(3, ((c.n || 0) / topMax) * 100)}%` }} /></span>
                        </span>
                        <b>{fmtNum(c.n)}</b>
                      </Link>
                    </li>
                  ))}
                </ol>
              )}
            </Panel>
          </section>

          {/* ── Recent users + messages ── */}
          <section className="adb-bottom">
            <Panel title="Yangi ro'yxatdan o'tganlar" to="/admin-panel/users">
              {usersQ.isLoading ? (
                <LoadingBlock bare />
              ) : usersQ.isError ? (
                <ErrorState bare title="Ro'yxatni yuklab bo'lmadi" sub={null} onRetry={() => usersQ.refetch()} />
              ) : recentUsers.length === 0 ? (
                <EmptyState small icon="users" title="Foydalanuvchilar yo'q" />
              ) : (
                <div className="adb-users">
                  {recentUsers.map(u => {
                    const [tone, label] = ROLE_META[u.role] || ROLE_META.student
                    return (
                      <Link key={u.id} to={`/admin-panel/users/${u.id}`} className="row-line adb-user">
                        <span className="avatar avatar-blue adb-av">
                          {u.avatar ? <img src={absUrl(u.avatar)} alt="" /> : u.initials}
                        </span>
                        <span className="adb-user-txt">
                          <b>{u.display_name}</b>
                          <small>{u.email || u.phone || '—'}</small>
                        </span>
                        <span className={`badge badge-${tone}`}>{label}</span>
                        <span className="adb-user-date">{fmtDate(u.date_joined)}</span>
                      </Link>
                    )
                  })}
                </div>
              )}
            </Panel>

            <Panel title="So'nggi xabarlar" count={unreadMessages} to="/admin-panel/messages">
              {messagesQ.isLoading ? (
                <LoadingBlock bare />
              ) : messagesQ.isError ? (
                <ErrorState bare title="Xabarlarni yuklab bo'lmadi" sub={null} onRetry={() => messagesQ.refetch()} />
              ) : messages.length === 0 ? (
                <EmptyState small icon="message" title="Hozircha xabar yo'q"
                  sub="Aloqa formasidan kelgan xabarlar shu yerda ko'rinadi." />
              ) : (
                <div>
                  {messages.map(m => (
                    <Link key={m.id} to="/admin-panel/messages" className={`row-line adb-msg ${m.is_read ? '' : 'new'}`}>
                      <span className="adb-msg-dot" aria-hidden="true" />
                      <span className="adb-msg-txt">
                        <span className="adb-msg-top">
                          <b>{m.name}</b>
                          <small>{new Date(m.created_at).toLocaleString('uz-UZ', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</small>
                        </span>
                        <span className="adb-msg-body"><em>{m.subject}</em>{m.message ? ` — ${m.message}` : ''}</span>
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </Panel>
          </section>
        </>
      )}
    </DashLayout>
  )
}

const css = `
  .adb-mono { font-family: var(--font-mono); font-size: 10px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: var(--text-3); }

  /* ── top: ink hero + attention ── */
  .adb-top { display: grid; grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr); gap: 20px; margin-bottom: 20px; align-items: stretch; }
  .adb-hero {
    position: relative; overflow: hidden; background: var(--ink); color: #B7C0D8;
    border-radius: 26px; padding: 26px 28px 24px; display: flex; flex-direction: column; gap: 22px;
  }
  .adb-hero::before { content: ''; position: absolute; inset: 0; background-image: var(--topo); background-size: 520px 360px; filter: invert(1); opacity: .5; pointer-events: none; }
  html[data-theme="dark"] .adb-hero::before { filter: none; opacity: 1; }
  html[data-theme="dark"] .adb-hero { border: 1.5px solid var(--border); }
  .adb-hero > * { position: relative; }
  .adb-hero-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
  .adb-tag {
    display: inline-flex; align-items: center; gap: 7px; padding: 5px 12px 5px 9px; border-radius: 999px;
    background: var(--sun); color: #14213D; font-family: var(--font-mono); font-size: 10.5px; font-weight: 600;
    letter-spacing: 0.09em; text-transform: uppercase;
  }
  .adb-coord { color: #8E9BBD; }
  .adb-hero-num { display: flex; align-items: flex-end; gap: 16px; flex-wrap: wrap; }
  .adb-hero-num strong { font-family: var(--font-display); font-size: 76px; font-weight: 800; letter-spacing: -0.055em; line-height: .86; color: #fff; }
  .adb-hero-num span { display: flex; flex-direction: column; gap: 6px; font-size: 14.5px; font-weight: 600; color: #B7C0D8; padding-bottom: 4px; }
  .adb-hero-num em { font-style: normal; align-self: flex-start; font-family: var(--font-mono); font-size: 11px; letter-spacing: 0.05em; color: #14213D; background: var(--green-300); border-radius: 8px; padding: 2px 9px; }
  html[data-theme="dark"] .adb-hero-num em { color: #fff; }

  .adb-rolebar { display: flex; gap: 4px; height: 14px; }
  .adb-rolebar span { border-radius: 5px; min-width: 6px; }
  .adb-rolebar .none { background: rgba(255,255,255,.12); }
  .adb-roles .st { background: var(--sun); }
  .adb-roles .tc { background: var(--green-300); }
  .adb-roles .ad { background: var(--coral); }
  .adb-rolelegend { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; margin-top: 14px; }
  .adb-rolelegend > div { display: grid; grid-template-columns: auto 1fr; column-gap: 8px; align-items: center; min-width: 0; }
  .adb-rolelegend i { width: 10px; height: 10px; border-radius: 3px; }
  .adb-rolelegend b { font-family: var(--font-display); font-size: 20px; font-weight: 800; letter-spacing: -0.03em; color: #fff; line-height: 1.1; }
  .adb-rolelegend span { grid-column: 1 / -1; font-size: 12px; color: #B7C0D8; margin-top: 2px; }
  .adb-hero-link {
    align-self: flex-start; display: inline-flex; align-items: center; gap: 8px; margin-top: auto;
    font-size: 13.5px; font-weight: 700; color: #fff; padding-bottom: 3px; border-bottom: 1.5px dashed rgba(255,255,255,.4);
    transition: border-color .14s ease, color .14s ease;
  }
  .adb-hero-link:hover { color: var(--sun); border-color: var(--sun); }

  .adb-att { background: var(--white); border: 1.5px solid var(--border); border-radius: var(--r-card); padding: 20px; display: flex; flex-direction: column; gap: 10px; }
  .adb-att.hot { border: 2px solid var(--line); box-shadow: var(--hard); }
  .adb-att-head { display: flex; align-items: center; gap: 13px; margin-bottom: 6px; }
  .adb-att-pin {
    width: 42px; height: 42px; border-radius: 14px; flex-shrink: 0; display: flex; align-items: center; justify-content: center;
    background: var(--green-200); color: #14213D; border: 1.5px solid var(--line); transform: rotate(-5deg);
  }
  .adb-att.hot .adb-att-pin { background: var(--coral); }
  .adb-att-head h3 { font-size: 19px; letter-spacing: -0.03em; }
  .adb-att-head p { font-size: 13px; color: var(--text-3); margin-top: 3px; }
  .adb-att-row {
    display: flex; align-items: center; gap: 13px; padding: 11px 13px; border-radius: 16px;
    border: 1.5px solid var(--border); color: var(--text-3);
    transition: transform .14s ease, box-shadow .14s ease, border-color .14s ease, background .14s ease;
  }
  .adb-att-row:hover { border-color: var(--line); box-shadow: var(--hard-sm); transform: translate(-1px, -1px); color: var(--text); }
  .adb-att-row.on { background: var(--sun-soft); border-color: var(--line); color: var(--text); }
  .adb-att-n {
    min-width: 42px; height: 42px; padding: 0 8px; border-radius: 12px; flex-shrink: 0; display: flex; align-items: center; justify-content: center;
    font-family: var(--font-display); font-size: 21px; font-weight: 800; letter-spacing: -0.04em;
    background: var(--bg-soft); color: var(--text-3);
  }
  .adb-att-row.on .adb-att-n { background: var(--sun); color: #14213D; }
  .adb-att-txt { flex: 1; min-width: 0; display: flex; flex-direction: column; }
  .adb-att-txt b { font-size: 14px; font-weight: 700; color: var(--text); }
  .adb-att-txt small { font-size: 12.5px; color: var(--text-3); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .adb-att-queue { margin-top: 6px; padding-top: 14px; border-top: 1.5px dashed var(--border); display: flex; flex-direction: column; gap: 2px; }
  .adb-att-queue .adb-mono { margin-bottom: 6px; }
  .adb-q { display: flex; align-items: center; gap: 11px; padding: 7px 8px; margin: 0 -8px; border-radius: 12px; color: var(--text-4); transition: background .12s ease, color .12s ease; }
  .adb-q:hover { background: var(--paper); color: var(--text); }
  .adb-q-thumb { width: 44px; height: 32px; aspect-ratio: auto; border-radius: 9px; font-size: 16px; flex-shrink: 0; }
  .adb-q-txt { flex: 1; min-width: 0; display: flex; flex-direction: column; }
  .adb-q-txt b { font-size: 13.5px; font-weight: 700; color: var(--text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .adb-q-txt small { font-size: 12px; color: var(--text-3); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

  /* ── middle: chart + ranking ── */
  .adb-mid { display: grid; grid-template-columns: minmax(0, 1.75fr) minmax(0, 1fr); gap: 20px; margin-bottom: 20px; }
  .adb-readout { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-bottom: 14px; }
  .adb-readout-month {
    font-family: var(--font-mono); font-size: 11px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase;
    background: var(--ink); color: #fff; border-radius: 9px; padding: 6px 11px; margin-right: 4px;
  }
  .adb-legend {
    display: inline-flex; align-items: center; gap: 7px; height: 32px; padding: 0 11px; border-radius: 999px;
    border: 1.5px solid var(--border); background: var(--white); font-size: 12.5px; font-weight: 600; color: var(--text-2);
    transition: border-color .13s ease, opacity .13s ease;
  }
  .adb-legend:hover { border-color: var(--line); }
  .adb-legend i { width: 10px; height: 10px; border-radius: 3px; flex-shrink: 0; }
  .adb-legend b { font-family: var(--font-mono); font-weight: 600; color: var(--text); }
  .adb-legend.off { opacity: .45; }
  .adb-legend.off span { text-decoration: line-through; }
  .adb-chart-scroll { overflow-x: auto; margin: 0 -4px; padding: 0 4px; }
  .adb-chart { width: 100%; height: auto; display: block; touch-action: pan-y; cursor: crosshair; }
  .adb-axis { font-family: var(--font-mono); font-size: 10.5px; fill: var(--text-4); }
  .adb-axis.on { fill: var(--text); font-weight: 700; }

  .adb-rank { list-style: none; display: flex; flex-direction: column; gap: 4px; margin: -6px 0; }
  .adb-rank a { display: flex; align-items: center; gap: 12px; padding: 9px 8px; margin: 0 -8px; border-radius: 13px; transition: background .12s ease; }
  .adb-rank a:hover { background: var(--paper); }
  .adb-rank-n {
    width: 30px; height: 30px; border-radius: 10px; flex-shrink: 0; display: flex; align-items: center; justify-content: center;
    font-family: var(--font-mono); font-size: 12px; font-weight: 600; background: var(--bg-soft); color: var(--text-3);
  }
  .adb-rank-n.first { background: var(--sun); color: #14213D; border: 1.5px solid var(--line); transform: rotate(-5deg); }
  .adb-rank-body { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 6px; }
  .adb-rank-title { font-size: 13.5px; font-weight: 650; color: var(--text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .adb-rank-track { height: 6px; border-radius: 999px; background: var(--bg-soft); overflow: hidden; }
  .adb-rank-track i { display: block; height: 100%; border-radius: 999px; background: var(--line); }
  .adb-rank b { font-family: var(--font-mono); font-size: 12.5px; font-weight: 600; color: var(--text); flex-shrink: 0; }

  /* ── bottom ── */
  .adb-bottom { display: grid; grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr); gap: 20px; }
  .adb-user .adb-av { width: 38px; height: 38px; border-radius: 12px; font-size: 12px; }
  .adb-user-txt { flex: 1; min-width: 0; display: flex; flex-direction: column; }
  .adb-user-txt b { font-size: 14px; font-weight: 700; color: var(--text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .adb-user-txt small { font-family: var(--font-mono); font-size: 11.5px; color: var(--text-3); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .adb-user-date { font-family: var(--font-mono); font-size: 11.5px; color: var(--text-3); flex-shrink: 0; min-width: 76px; text-align: right; }

  .adb-msg { align-items: flex-start; }
  .adb-msg-dot { width: 9px; height: 9px; border-radius: 999px; margin-top: 6px; flex-shrink: 0; border: 1.5px solid var(--border); }
  .adb-msg.new .adb-msg-dot { background: var(--coral); border-color: var(--coral); }
  .adb-msg-txt { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
  .adb-msg-top { display: flex; align-items: baseline; justify-content: space-between; gap: 10px; }
  .adb-msg-top b { font-size: 13.5px; font-weight: 650; color: var(--text-2); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .adb-msg.new .adb-msg-top b { font-weight: 800; color: var(--text); }
  .adb-msg-top small { font-family: var(--font-mono); font-size: 11px; color: var(--text-4); flex-shrink: 0; }
  .adb-msg-body { font-size: 13px; color: var(--text-3); line-height: 1.45; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; overflow-wrap: anywhere; }
  .adb-msg-body em { font-style: normal; font-weight: 650; color: var(--text-2); }

  @media (max-width: 1180px) {
    .adb-top, .adb-mid, .adb-bottom { grid-template-columns: minmax(0, 1fr); }
  }
  @media (max-width: 640px) {
    .adb-hero { padding: 20px 18px; border-radius: 22px; gap: 18px; }
    .adb-hero-num strong { font-size: 56px; }
    .adb-rolelegend { grid-template-columns: minmax(0, 1fr); gap: 8px; }
    .adb-rolelegend > div { grid-template-columns: auto auto 1fr; }
    .adb-rolelegend span { grid-column: auto; margin-top: 0; }
    .adb-att { padding: 16px; }
    .adb-chart { min-width: 540px; }
    .adb-user-date { display: none; }
  }
`
