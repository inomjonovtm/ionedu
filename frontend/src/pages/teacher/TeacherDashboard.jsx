import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import api, { absUrl } from '../../api/client'
import DashLayout from '../../components/DashLayout'
import Icon from '../../components/Icon'
import { PageHead, Panel, EmptyState, CourseStatus, Stars } from '../../components/Dash'
import { ErrorState, LoadingBlock } from '../../components/PanelKit'
import { useAuth } from '../../store/auth'

const css = `
  .tdb-top { display: grid; grid-template-columns: minmax(0, 1.55fr) minmax(0, 1fr); gap: 20px; margin-bottom: 20px; align-items: stretch; }

  .tdb-min { min-width: 0; }
  .tdb-grow { flex: 1; min-width: 0; }

  .tdb-hero {
    position: relative; overflow: hidden; background: var(--ink); color: #B7C0D8;
    border-radius: 26px; padding: 26px 28px 24px; display: flex; flex-direction: column; gap: 22px;
  }
  .tdb-hero::before { content: ''; position: absolute; inset: 0; background-image: var(--topo); background-size: 520px 360px; filter: invert(1); opacity: .5; pointer-events: none; }
  html[data-theme="dark"] .tdb-hero::before { filter: none; opacity: 1; }
  .tdb-hero > * { position: relative; }
  .tdb-hero-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; }
  .tdb-hero .coord { color: #8C99BC; }
  .tdb-hero h2 { color: #fff; font-size: 27px; font-weight: 800; letter-spacing: -0.04em; line-height: 1.12; margin-top: 10px; max-width: 460px; }
  .tdb-hero h2 em { font-style: normal; color: var(--sun); }
  .tdb-hero p { font-size: 14px; margin-top: 8px; max-width: 440px; line-height: 1.55; }
  .tdb-stamp {
    width: 62px; height: 62px; flex-shrink: 0; border-radius: 18px; background: var(--sun); color: #14213D;
    display: flex; align-items: center; justify-content: center; transform: rotate(6deg); border: 2px solid #14213D;
  }
  .tdb-nums { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); border-top: 1.5px dashed rgba(255,255,255,.2); padding-top: 18px; margin-top: auto; }
  .tdb-num { padding: 0 14px; border-left: 1.5px dashed rgba(255,255,255,.16); min-width: 0; }
  .tdb-num:first-child { padding-left: 0; border-left: none; }
  .tdb-num b { display: block; font-family: var(--font-display); font-size: 30px; font-weight: 800; letter-spacing: -0.05em; line-height: 1; color: #fff; }
  .tdb-num b small { font-size: 15px; color: #8C99BC; }
  .tdb-num span { display: block; font-family: var(--font-mono); font-size: 10px; text-transform: uppercase; letter-spacing: .09em; margin-top: 7px; color: #8C99BC; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .tdb-num.hot b { color: var(--sun); }

  .tdb-next { background: var(--white); border: 2px solid var(--line); border-radius: var(--r-card); box-shadow: var(--hard); padding: 20px 20px 10px; display: flex; flex-direction: column; }
  .tdb-next-h { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-bottom: 8px; }
  .tdb-next-h h3 { font-size: 17px; }
  .tdb-next-h .coord { text-transform: uppercase; }
  .tdb-step { display: flex; align-items: center; gap: 12px; padding: 12px 0; border-top: 1.5px dashed var(--border); color: inherit; }
  .tdb-step:first-of-type { border-top: none; }
  .tdb-step .ico { width: 36px; height: 36px; border-radius: 12px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; }
  .tdb-step .tx { flex: 1; min-width: 0; }
  .tdb-step .tx b { display: block; font-size: 13.5px; font-weight: 700; color: var(--text); line-height: 1.3; }
  .tdb-step .tx span { display: block; font-size: 12.5px; color: var(--text-3); line-height: 1.4; margin-top: 2px; }
  .tdb-step .go { color: var(--text-4); flex-shrink: 0; transition: transform .14s ease, color .14s ease; }
  a.tdb-step:hover .go { color: var(--text); transform: translateX(3px); }

  .tdb-grid { display: grid; grid-template-columns: minmax(0, 1.55fr) minmax(0, 1fr); gap: 20px; align-items: start; }
  .tdb-side { display: flex; flex-direction: column; gap: 20px; min-width: 0; }

  .tdb-course { display: grid; grid-template-columns: 58px minmax(0, 1fr) auto; gap: 14px; align-items: center; padding: 14px 20px; border-bottom: 1.5px dashed var(--border-2); }
  .tdb-course:last-child { border-bottom: none; }
  .tdb-course .thumb { width: 58px; height: 44px; font-size: 22px; border-radius: 12px; aspect-ratio: auto; }
  .tdb-course .ttl { font-weight: 700; font-size: 14px; color: var(--text); line-height: 1.3; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; display: block; }
  .tdb-course .ttl:hover { text-decoration: underline; text-underline-offset: 3px; }
  .tdb-meta { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; margin-top: 5px; font-size: 12.5px; color: var(--text-3); font-weight: 600; }
  .tdb-meta span { display: inline-flex; align-items: center; gap: 5px; }
  .tdb-meta .star svg { color: #F5A300; }
  .tdb-acts { display: flex; gap: 2px; }

  .tdb-stu { display: flex; align-items: center; gap: 12px; padding: 12px 20px; border-bottom: 1.5px dashed var(--border-2); }
  .tdb-stu:last-child { border-bottom: none; }
  .tdb-stu .avatar { width: 36px; height: 36px; border-radius: 12px; font-size: 12px; }
  .tdb-stu .nm { font-size: 13.5px; font-weight: 700; color: var(--text); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .tdb-stu .cr { font-size: 12px; color: var(--text-3); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .tdb-route { width: 84px; flex-shrink: 0; }
  .tdb-route .progress { height: 7px; }
  .tdb-route .pc { font-family: var(--font-mono); font-size: 10.5px; color: var(--text-3); text-align: right; margin-top: 4px; }
  .tdb-route .pc.done { color: var(--green-700); font-weight: 700; }

  .tdb-rev { padding: 14px 20px; border-bottom: 1.5px dashed var(--border-2); }
  .tdb-rev:last-child { border-bottom: none; }
  .tdb-rev-h { display: flex; align-items: center; gap: 10px; }
  .tdb-rev-h .avatar { width: 28px; height: 28px; border-radius: 10px; font-size: 10px; }
  .tdb-rev-h b { flex: 1; min-width: 0; font-size: 13px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .tdb-rev p { font-size: 13px; color: var(--text-2); margin-top: 7px; line-height: 1.5; overflow-wrap: anywhere; }
  .tdb-rev .cr { font-size: 11.5px; color: var(--text-3); margin-top: 6px; }

  @media (max-width: 1180px) {
    .tdb-top, .tdb-grid { grid-template-columns: 1fr; }
  }
  @media (max-width: 640px) {
    .tdb-hero { padding: 22px 20px 20px; border-radius: 22px; }
    .tdb-hero h2 { font-size: 22px !important; }
    .tdb-stamp { width: 50px; height: 50px; border-radius: 15px; }
    .tdb-nums { grid-template-columns: repeat(2, minmax(0, 1fr)); row-gap: 16px; }
    .tdb-num:nth-child(odd) { padding-left: 0; border-left: none; }
    .tdb-course { grid-template-columns: 48px minmax(0, 1fr); padding: 14px 16px; }
    .tdb-course .thumb { width: 48px; height: 38px; font-size: 19px; }
    .tdb-acts { grid-column: 1 / -1; justify-content: flex-end; margin-top: -4px; }
    .tdb-stu, .tdb-rev { padding-left: 16px; padding-right: 16px; }
  }
`

function Avatar({ u }) {
  return (
    <div className="avatar avatar-blue">
      {u?.avatar ? <img src={absUrl(u.avatar)} alt="" /> : (u?.initials || '?')}
    </div>
  )
}

/** Build the "next steps" list out of what we already know about the teacher's courses. */
function buildSteps({ courses, reviews, students }) {
  const by = (s) => courses.filter(c => c.status === s)
  const rejected = by('rejected'), drafts = by('draft'), pending = by('pending'), published = by('published')
  const steps = []
  if (courses.length === 0) {
    steps.push({ icon: 'plus', tone: 'amber', to: '/teacher/courses/new', title: 'Birinchi kursingizni yarating', sub: "Bo'limlar, video darslar va testlar qo'shing." })
    return steps
  }
  if (rejected.length) {
    const c = rejected[0]
    steps.push({ icon: 'alert', tone: 'red', to: `/teacher/courses/${c.slug}/edit`, title: `${rejected.length} ta kurs rad etilgan`, sub: `"${c.title}" — izohni ko'rib, tuzatib qayta yuboring.` })
  }
  if (drafts.length) {
    const c = drafts[0]
    steps.push({ icon: 'pen', tone: 'amber', to: `/teacher/courses/${c.slug}/edit`, title: `${drafts.length} ta qoralama kutmoqda`, sub: `"${c.title}" kursini yakunlab, moderatsiyaga yuboring.` })
  }
  if (pending.length) {
    steps.push({ icon: 'clock', tone: 'blue', to: '/teacher/courses', title: `${pending.length} ta kurs moderatsiyada`, sub: 'Admin tasdiqlagach ommaviy katalogga chiqadi.' })
  }
  const empty = published.find(c => !c.lessons_count)
  if (empty) {
    steps.push({ icon: 'video', tone: 'violet', to: `/teacher/courses/${empty.slug}/edit`, title: "Nashrdagi kursda dars yo'q", sub: `"${empty.title}" kursiga darslar qo'shing.` })
  }
  if (published.length && students.length && reviews.length === 0) {
    steps.push({ icon: 'star', tone: 'amber', to: '/teacher/students', title: "Hali sharh yo'q", sub: "O'quvchilardan kursni baholashni so'rang." })
  }
  if (steps.length === 0) {
    steps.push({ icon: 'checkC', tone: 'green', title: 'Hammasi joyida', sub: "Kutilayotgan ish yo'q. Yangi kurs yoki test qo'shishingiz mumkin." })
    steps.push({ icon: 'fileText', tone: 'blue', to: '/teacher/tests', title: 'Testlar bilan mustahkamlang', sub: "Mavzular bo'yicha yangi test tuzing." })
  }
  return steps.slice(0, 4)
}

export default function TeacherDashboard() {
  const { user } = useAuth()
  const coursesQ = useQuery({
    queryKey: ['my-teaching'],
    queryFn: () => api.get('/courses/?mine=1&page_size=100').then(r => r.data.results || r.data),
  })
  const studentsQ = useQuery({
    queryKey: ['teacher-students'],
    queryFn: () => api.get('/teacher/students/').then(r => r.data),
  })
  const reviewsQ = useQuery({
    queryKey: ['teacher-reviews'],
    queryFn: () => api.get('/teacher/reviews/').then(r => r.data),
  })
  const courses = Array.isArray(coursesQ.data) ? coursesQ.data : []
  const students = Array.isArray(studentsQ.data) ? studentsQ.data : []
  const reviews = Array.isArray(reviewsQ.data) ? reviewsQ.data : []

  const totalStudents = courses.reduce((s, c) => s + (c.students_count || 0), 0)
  // Average from the reviews themselves; otherwise weight course averages by their review count.
  const ratedCount = courses.reduce((s, c) => s + (c.rating_count || 0), 0)
  const avgRating = reviews.length
    ? (reviews.reduce((s, r) => s + (r.rating || 0), 0) / reviews.length).toFixed(1)
    : ratedCount
      ? (courses.reduce((s, c) => s + (c.rating_avg || 0) * (c.rating_count || 0), 0) / ratedCount).toFixed(1)
      : '—'
  const reviewCount = reviews.length || ratedCount

  const publishedCount = courses.filter(c => c.status === 'published').length
  const pendingCount = courses.filter(c => c.status === 'pending').length
  const firstName = (user?.full_name || user?.display_name || '').trim().split(/\s+/)[0] || 'Ustoz'
  const steps = buildSteps({ courses, reviews, students })
  const today = new Date().toLocaleDateString('uz-UZ', { day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <DashLayout kind="teacher">
      <style>{css}</style>
      <PageHead title="Boshqaruv paneli" sub="Kurslaringiz va o'quvchilaringizning umumiy holati">
        <Link to="/teacher/courses" className="btn btn-secondary"><Icon name="book" size={15} /> Kurslarim</Link>
        <Link to="/teacher/courses/new" className="btn btn-primary"><Icon name="plus" size={15} /> Yangi kurs</Link>
      </PageHead>

      <div className="tdb-top">
        <section className="tdb-hero fade-up">
          <div className="tdb-hero-top">
            <div className="tdb-min">
              <span className="coord">{today} · 41.31°N 69.24°E</span>
              <h2>Salom, <em>{firstName}</em>!</h2>
              <p>
                {coursesQ.isLoading ? "Ma'lumotlar yuklanmoqda…"
                  : courses.length === 0 ? "Xaritangiz hali bo'sh — birinchi kursingiz bilan yo'lni boshlang."
                  : totalStudents > 0 ? `Bugun ${totalStudents} nafar o'quvchi siz bilan dunyoni o'rganmoqda.`
                  : "Kurslaringiz tayyor — birinchi o'quvchilaringizni kutamiz."}
              </p>
            </div>
            <span className="tdb-stamp" aria-hidden="true"><Icon name="compass" size={28} /></span>
          </div>
          <div className="tdb-nums">
            <div className="tdb-num"><b>{totalStudents}</b><span>O'quvchi</span></div>
            <div className="tdb-num"><b>{publishedCount}<small> / {courses.length}</small></b><span>Nashrdagi kurs</span></div>
            <div className="tdb-num"><b>{avgRating}</b><span>Reyting · {reviewCount} sharh</span></div>
            <div className={`tdb-num ${pendingCount > 0 ? 'hot' : ''}`}><b>{pendingCount}</b><span>Moderatsiyada</span></div>
          </div>
        </section>

        <section className="tdb-next fade-up-d1">
          <div className="tdb-next-h">
            <h3>Keyingi qadamlar</h3>
            <span className="coord">Marshrut</span>
          </div>
          {coursesQ.isLoading ? (
            <LoadingBlock bare />
          ) : coursesQ.isError ? (
            <ErrorState bare onRetry={() => coursesQ.refetch()} />
          ) : steps.map((s, i) => {
            const body = (
              <>
                <span className={`ico tone-${s.tone}`}><Icon name={s.icon} size={16} /></span>
                <span className="tx"><b>{s.title}</b><span>{s.sub}</span></span>
                {s.to && <Icon name="arrowR" size={15} className="go" />}
              </>
            )
            return s.to
              ? <Link key={i} to={s.to} className="tdb-step">{body}</Link>
              : <div key={i} className="tdb-step">{body}</div>
          })}
        </section>
      </div>

      <div className="tdb-grid">
        <Panel title="Mening kurslarim" count={courses.length} to="/teacher/courses">
          {coursesQ.isLoading ? (
            <LoadingBlock bare />
          ) : coursesQ.isError ? (
            <ErrorState bare onRetry={() => coursesQ.refetch()} />
          ) : courses.length === 0 ? (
            <EmptyState
              icon="book"
              title="Hozircha kurslar yo'q"
              sub="Birinchi kursingizni yarating — video darslar, testlar va materiallar qo'shing."
              action={<Link to="/teacher/courses/new" className="btn btn-primary btn-sm"><Icon name="plus" size={13} /> Kurs yaratish</Link>}
            />
          ) : courses.slice(0, 6).map(c => (
            <div key={c.id} className="tdb-course">
              <div className={`thumb thumb-${c.thumb_color || 'slate'}`}>{c.thumb_emoji}</div>
              <div className="tdb-min">
                <Link to={`/teacher/courses/${c.slug}/edit`} className="ttl">{c.title}</Link>
                <div className="tdb-meta">
                  <CourseStatus status={c.status} />
                  <span><Icon name="playC" size={13} /> {c.lessons_count || 0} dars</span>
                  <span><Icon name="users" size={13} /> {c.students_count || 0}</span>
                  {c.rating_count > 0 && <span className="star"><Icon name="starF" size={12} /> {Number(c.rating_avg || 0).toFixed(1)}</span>}
                </div>
              </div>
              <div className="tdb-acts">
                <Link to={`/teacher/courses/${c.slug}/stats`} className="icon-btn" title="Statistika" aria-label="Statistika"><Icon name="chart" size={15} /></Link>
                <Link to={`/teacher/courses/${c.slug}/edit`} className="icon-btn" title="Tahrirlash" aria-label="Tahrirlash"><Icon name="edit" size={15} /></Link>
              </div>
            </div>
          ))}
        </Panel>

        <div className="tdb-side">
          <Panel title="So'nggi o'quvchilar" to="/teacher/students">
            {studentsQ.isLoading ? (
              <LoadingBlock bare />
            ) : studentsQ.isError ? (
              <ErrorState bare onRetry={() => studentsQ.refetch()} />
            ) : students.length === 0 ? (
              <EmptyState small icon="users" title="Hozircha o'quvchilar yo'q"
                sub="Kursingiz nashr etilgach, yozilgan o'quvchilar shu yerda ko'rinadi." />
            ) : students.slice(0, 5).map(s => {
              const pct = Math.min(100, Math.max(0, Math.round(s.progress_percent || 0)))
              return (
                <div key={s.id} className="tdb-stu">
                  <Avatar u={s.student} />
                  <div className="tdb-grow">
                    <div className="nm">{s.student?.display_name}</div>
                    <div className="cr">{s.course_title}</div>
                  </div>
                  <div className="tdb-route">
                    <div className="progress"><div className="progress-fill" style={{ width: `${pct}%` }} /></div>
                    <div className={`pc ${pct >= 100 ? 'done' : ''}`}>{pct}%</div>
                  </div>
                </div>
              )
            })}
          </Panel>

          <Panel title="Oxirgi sharhlar" to="/teacher/reviews">
            {reviewsQ.isLoading ? (
              <LoadingBlock bare />
            ) : reviewsQ.isError ? (
              <ErrorState bare onRetry={() => reviewsQ.refetch()} />
            ) : reviews.length === 0 ? (
              <EmptyState small icon="star" title="Hozircha sharhlar yo'q"
                sub="O'quvchilar kursingizni baholaganda shu yerda ko'rinadi." />
            ) : reviews.slice(0, 4).map(r => (
              <div key={r.id} className="tdb-rev">
                <div className="tdb-rev-h">
                  <Avatar u={r.student} />
                  <b>{r.student?.display_name}</b>
                  <Stars value={r.rating} />
                </div>
                {r.comment && <p>{r.comment.slice(0, 120)}{r.comment.length > 120 ? '…' : ''}</p>}
                <div className="cr">{r.course_title}</div>
              </div>
            ))}
          </Panel>
        </div>
      </div>
    </DashLayout>
  )
}
