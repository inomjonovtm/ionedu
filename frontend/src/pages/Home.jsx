import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import api from '../api/client'
import Layout from '../components/Layout'
import CourseCard from '../components/CourseCard'
import Icon from '../components/Icon'

const heroStyles = `
  /* ── Hero — centered, editorial ── */
  .hero { padding: 96px 0 64px; position: relative; }
  .hero-inner { max-width: 880px; margin: 0 auto; text-align: center; position: relative; z-index: 1; }
  .hero-eyebrow {
    display: inline-flex; align-items: center; gap: 10px;
    padding: 7px 16px 7px 8px;
    background: var(--white); border: 1px solid var(--border); border-radius: 999px;
    font-family: var(--font-mono); font-size: 11.5px; letter-spacing: 0.06em;
    color: var(--text-2); margin-bottom: 32px;
    box-shadow: 0 1px 2px rgba(12,17,14,0.04);
  }
  .hero-eyebrow .pill {
    background: var(--green-50); color: var(--green-700);
    box-shadow: inset 0 0 0 1px var(--green-100);
    border-radius: 999px; padding: 2px 10px; font-size: 10.5px; font-weight: 600;
    letter-spacing: 0.08em;
  }
  .hero h1 {
    font-size: clamp(40px, 6.4vw, 72px);
    line-height: 1.02; letter-spacing: -0.045em; font-weight: 700;
  }
  .hero h1 .accent { color: var(--green-600); }
  .hero-sub {
    font-size: 17.5px; color: var(--text-3); margin: 26px auto 0;
    max-width: 560px; line-height: 1.6;
  }
  .hero-ctas { margin-top: 38px; display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; }
  .hero-trust {
    margin-top: 36px; display: flex; align-items: center; justify-content: center;
    gap: 12px; font-size: 13.5px; color: var(--text-3);
  }
  .avatar-stack { display: flex; }
  .avatar-stack .avatar { width: 30px; height: 30px; border: 2px solid var(--paper); margin-left: -9px; font-size: 11px; }
  .avatar-stack .avatar:first-child { margin-left: 0; }

  /* ── Product window — CSS-built lesson player mock ── */
  .hero-stage { position: relative; max-width: 1020px; margin: 72px auto 0; }
  .hero-stage::before {
    content: '';
    position: absolute; inset: -8% -12% -20%;
    background: radial-gradient(ellipse 60% 55% at 50% 42%, rgba(14, 131, 69, 0.10), transparent 70%);
    pointer-events: none;
  }
  .app-window {
    position: relative; z-index: 1;
    background: var(--white);
    border: 1px solid var(--border);
    border-radius: 18px;
    box-shadow: 0 1px 2px rgba(12,17,14,.04), 0 32px 80px -32px rgba(12,17,14,.16);
    overflow: hidden;
  }
  .aw-bar {
    display: flex; align-items: center; gap: 14px;
    padding: 12px 18px; border-bottom: 1px solid var(--border-2);
  }
  .aw-dots { display: flex; gap: 6px; }
  .aw-dots span { width: 10px; height: 10px; border-radius: 999px; background: var(--border); }
  .aw-url {
    flex: 1; max-width: 320px; margin: 0 auto;
    display: flex; align-items: center; justify-content: center; gap: 7px;
    height: 28px; background: var(--bg-soft); border-radius: 8px;
    font-family: var(--font-mono); font-size: 11.5px; color: var(--text-3);
  }
  .aw-body { display: grid; grid-template-columns: 280px 1fr; min-height: 380px; }
  .aw-side { border-right: 1px solid var(--border-2); padding: 18px 14px; text-align: left; }
  .aw-side-title {
    font-family: var(--font-mono); font-size: 10px; letter-spacing: 0.12em;
    text-transform: uppercase; color: var(--text-4); padding: 0 8px 12px;
  }
  .aw-lesson {
    display: flex; align-items: center; gap: 10px;
    padding: 9px 10px; border-radius: 10px; font-size: 13px; color: var(--text-2);
  }
  .aw-lesson .tick {
    width: 18px; height: 18px; border-radius: 999px; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
  }
  .aw-lesson.done .tick { background: var(--green-100); color: var(--green-700); }
  .aw-lesson.now { background: var(--green-50); color: var(--green-800); font-weight: 560; }
  .aw-lesson.now .tick { background: var(--green-600); color: white; }
  .aw-lesson.next { color: var(--text-4); }
  .aw-lesson.next .tick { border: 1.5px dashed var(--border); }
  .aw-lesson .dur { margin-left: auto; font-family: var(--font-mono); font-size: 10.5px; color: var(--text-4); }

  .aw-mainpane { padding: 20px 24px; text-align: left; display: flex; flex-direction: column; gap: 16px; }
  .aw-video {
    position: relative; flex: 1; min-height: 230px; border-radius: 14px; overflow: hidden;
    background:
      radial-gradient(circle at 78% 18%, rgba(135, 207, 166, 0.28), transparent 42%),
      radial-gradient(circle at 12% 88%, rgba(14, 131, 69, 0.22), transparent 46%),
      linear-gradient(150deg, #122B1E 0%, #0C110E 100%);
    display: flex; align-items: center; justify-content: center;
  }
  .aw-video .topo { position: absolute; inset: 0; opacity: .35; }
  .aw-play {
    position: relative; z-index: 1;
    width: 60px; height: 60px; border-radius: 999px;
    background: rgba(255,255,255,0.96); color: var(--ink);
    display: flex; align-items: center; justify-content: center;
    box-shadow: 0 12px 32px -8px rgba(0,0,0,0.4);
  }
  .aw-play svg { margin-left: 3px; }
  .aw-video .vbadge {
    position: absolute; left: 14px; top: 14px; z-index: 1;
    font-family: var(--font-mono); font-size: 10.5px; letter-spacing: .08em;
    color: rgba(255,255,255,.85); background: rgba(255,255,255,.12);
    border: 1px solid rgba(255,255,255,.18); border-radius: 999px; padding: 4px 11px;
    backdrop-filter: blur(4px);
  }
  .aw-video .vtime {
    position: absolute; right: 14px; bottom: 14px; z-index: 1;
    font-family: var(--font-mono); font-size: 11px; color: rgba(255,255,255,.85);
  }
  .aw-meta { display: flex; align-items: center; justify-content: space-between; gap: 16px; }
  .aw-meta h3 { font-size: 16px; letter-spacing: -0.02em; }
  .aw-meta .crumbs { font-family: var(--font-mono); font-size: 10.5px; color: var(--text-4); letter-spacing: .06em; text-transform: uppercase; margin-bottom: 4px; }
  .aw-progress { display: flex; align-items: center; gap: 12px; }
  .aw-progress .bar { flex: 1; height: 5px; background: var(--border-2); border-radius: 999px; overflow: hidden; }
  .aw-progress .bar i { display: block; height: 100%; width: 64%; background: var(--green-600); border-radius: 999px; }
  .aw-progress .pct { font-family: var(--font-mono); font-size: 11.5px; color: var(--text-3); }

  /* floating chips */
  .hero-chip {
    position: absolute; z-index: 2;
    display: flex; align-items: center; gap: 10px;
    background: var(--white); border: 1px solid var(--border); border-radius: 14px;
    padding: 11px 15px;
    box-shadow: 0 20px 48px -20px rgba(12,17,14,0.22);
    animation: chipFloat 7s ease-in-out infinite;
  }
  .hero-chip .ic {
    width: 32px; height: 32px; border-radius: 9px; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
  }
  .hero-chip .t1 { font-size: 12.5px; font-weight: 600; color: var(--text); line-height: 1.25; }
  .hero-chip .t2 { font-family: var(--font-mono); font-size: 10.5px; color: var(--text-4); margin-top: 1px; }
  .hero-chip.c1 { top: 8%; left: -56px; animation-delay: -1.5s; }
  .hero-chip.c2 { bottom: 14%; right: -52px; animation-delay: -4s; }
  @keyframes chipFloat { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-9px); } }

  /* ── Stats strip ── */
  .stats { border-top: 1px solid var(--border-2); border-bottom: 1px solid var(--border-2); margin-top: 88px; background: var(--white); }
  .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); }
  .stats-grid > div { padding: 36px 16px; text-align: center; }
  .stats-grid > div + div { border-left: 1px solid var(--border-2); }
  .stat-value { font-family: var(--font-mono); font-weight: 560; font-size: 36px; letter-spacing: -0.04em; line-height: 1; color: var(--text); }
  .stat-value .plus { color: var(--green-600); }
  .stat-label { font-size: 12.5px; color: var(--text-3); margin-top: 10px; }

  /* ── Section heads ── */
  .sec-head { display: flex; align-items: end; justify-content: space-between; margin-bottom: 40px; gap: 24px; }

  /* ── Steps ── */
  .steps { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
  .step {
    position: relative; background: var(--white); border: 1px solid var(--border);
    border-radius: var(--r-card); padding: 28px 26px 26px;
    transition: border-color .2s, box-shadow .2s, transform .2s;
  }
  .step:hover { border-color: #D8DCD7; box-shadow: var(--shadow-hover); transform: translateY(-3px); }
  .step-num {
    font-family: var(--font-mono); font-size: 12px; letter-spacing: .1em;
    color: var(--green-700); background: var(--green-50);
    box-shadow: inset 0 0 0 1px var(--green-100);
    border-radius: 999px; padding: 5px 13px; display: inline-block; margin-bottom: 20px;
  }
  .step h3 { font-size: 18px; margin-bottom: 8px; letter-spacing: -0.02em; }
  .step p { color: var(--text-3); font-size: 14px; line-height: 1.6; }

  /* ── Promo strip ── */
  .promo-strip {
    display: flex; align-items: center; gap: 22px; flex-wrap: wrap;
    background: var(--white); border: 1px solid var(--border);
    border-radius: var(--r-card); padding: 26px 30px;
  }
  .promo-strip .ic {
    width: 52px; height: 52px; border-radius: 14px; flex-shrink: 0;
    background: var(--green-50); color: var(--green-700);
    box-shadow: inset 0 0 0 1px var(--green-100);
    display: flex; align-items: center; justify-content: center;
  }

  /* ── Teachers ── */
  .teachers-scroll { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 20px; }
  .teacher-card {
    background: var(--white); border: 1px solid var(--border); border-radius: var(--r-card);
    padding: 28px 20px 24px; text-align: center;
    transition: border-color .2s, box-shadow .2s, transform .2s;
  }
  .teacher-card:hover { border-color: #D8DCD7; box-shadow: var(--shadow-hover); transform: translateY(-3px); }
  .teacher-card .avatar { width: 64px; height: 64px; font-size: 20px; margin: 0 auto 16px; }
  .teacher-card h4 { font-size: 15.5px; margin-bottom: 3px; letter-spacing: -0.015em; }
  .teacher-card .subject { font-size: 13px; color: var(--text-3); margin-bottom: 16px; }
  .teacher-card .meta {
    display: flex; justify-content: center; gap: 14px;
    font-family: var(--font-mono); font-size: 11px; color: var(--text-3);
    padding-top: 14px; border-top: 1px solid var(--border-2);
  }
  .teacher-card .meta strong { color: var(--text); font-weight: 560; }

  /* ── Dark CTA panel ── */
  .cta-banner {
    position: relative; overflow: hidden;
    background: var(--ink);
    border-radius: 24px; padding: 80px 56px; text-align: center;
  }
  .cta-banner::before {
    content: '';
    position: absolute; inset: 0;
    background:
      radial-gradient(ellipse 55% 65% at 50% 110%, rgba(14, 131, 69, 0.35), transparent 70%),
      radial-gradient(ellipse 40% 40% at 85% -10%, rgba(135, 207, 166, 0.12), transparent 70%);
    pointer-events: none;
  }
  .cta-banner > * { position: relative; z-index: 1; }
  .cta-banner .cta-eyebrow {
    font-family: var(--font-mono); font-size: 11px; letter-spacing: .16em;
    text-transform: uppercase; color: var(--green-300); margin-bottom: 18px; display: block;
  }
  .cta-banner h2 {
    font-size: clamp(30px, 4.4vw, 46px); line-height: 1.08; letter-spacing: -0.035em;
    max-width: 640px; margin: 0 auto; color: #fff; font-weight: 680;
  }
  .cta-banner p { color: #A8B1AA; font-size: 16px; margin: 18px auto 36px; max-width: 480px; }
  .cta-banner .btn-light {
    display: inline-flex; align-items: center; gap: 9px;
    height: 50px; padding: 0 30px; border-radius: 999px;
    background: #fff; color: var(--ink); font-weight: 580; font-size: 15px;
    transition: transform .15s ease, box-shadow .2s ease;
  }
  .cta-banner .btn-light:hover { transform: translateY(-2px); box-shadow: 0 16px 40px -12px rgba(0,0,0,0.5); }

  @media (max-width: 1140px) {
    .hero-chip { display: none; }
  }
  @media (max-width: 1024px) {
    .stats-grid { grid-template-columns: repeat(2, 1fr); }
    .stats-grid > div:nth-child(3) { border-left: none; }
    .stats-grid > div:nth-child(n+3) { border-top: 1px solid var(--border-2); }
    .steps { grid-template-columns: 1fr; }
    .teachers-scroll { grid-template-columns: repeat(2, 1fr); }
    .aw-side { display: none; }
    .aw-body { grid-template-columns: 1fr; }
  }
  @media (max-width: 640px) {
    .hero { padding: 64px 0 40px; }
    .hero-stage { margin-top: 48px; }
    .teachers-scroll { grid-template-columns: 1fr; }
    .cta-banner { padding: 56px 24px; border-radius: 20px; }
    .aw-mainpane { padding: 14px; }
  }
`

const MOCK_LESSONS = [
  { t: 'Kirish: Geografiya fani', d: '08:24', s: 'done' },
  { t: "Yer yuzasining tuzilishi", d: '12:10', s: 'done' },
  { t: 'Materiklar va okeanlar', d: '15:42', s: 'now' },
  { t: 'Iqlim mintaqalari', d: '11:05', s: 'next' },
  { t: 'Xaritalar bilan ishlash', d: '09:30', s: 'next' },
]

export default function Home() {
  const { data: courses = [] } = useQuery({
    queryKey: ['featured-courses'],
    queryFn: () => api.get('/courses/?status=published').then(r => r.data.results || r.data),
  })
  const { data: teachers = [] } = useQuery({
    queryKey: ['featured-teachers'],
    queryFn: () => api.get('/teachers/').then(r => r.data.results || r.data),
  })
  const { data: stats = {} } = useQuery({
    queryKey: ['home-stats'],
    queryFn: () => api.get('/stats/').then(r => r.data).catch(() => ({})),
  })

  // Bosh sahifada eng yuqori reytingdagilar birinchi chiqadi
  const featured = [...(courses || [])]
    .sort((a, b) => (b.rating_avg ?? 0) - (a.rating_avg ?? 0) || (b.rating_count ?? 0) - (a.rating_count ?? 0))
    .slice(0, 6)
  const topTeachers = [...(teachers || [])]
    .sort((a, b) => (b.avg_rating ?? 0) - (a.avg_rating ?? 0))
    .slice(0, 4)

  return (
    <Layout>
      <style>{heroStyles}</style>

      {/* ── Hero ── */}
      <section className="hero">
        <div className="container">
          <div className="hero-inner fade-up">
            <div className="hero-eyebrow">
              <span className="pill">YANGI</span>
              2026-yil o'quv dasturi tayyor
            </div>
            <h1>Geografiyani <span className="accent">professional</span> darajada o'rganing</h1>
            <p className="hero-sub">
              Video darslar, interaktiv testlar va rasmiy sertifikatlar — DTM va
              Prezident maktabiga tayyorgarlik uchun yagona platforma.
            </p>
            <div className="hero-ctas">
              <Link to="/auth/register" className="btn btn-primary btn-lg">
                Bepul boshlash <Icon name="arrowR" size={16} />
              </Link>
              <Link to="/courses" className="btn btn-secondary btn-lg">
                <Icon name="play" size={14} /> Kurslarni ko'rish
              </Link>
            </div>
            {stats.students > 0 && (
              <div className="hero-trust">
                <div className="avatar-stack">
                  <span className="avatar">AB</span>
                  <span className="avatar avatar-blue">MK</span>
                  <span className="avatar avatar-amber">DS</span>
                  <span className="avatar avatar-violet">NX</span>
                </div>
                <span><strong style={{ color: 'var(--text)' }}>{stats.students}</strong> o'quvchi allaqachon o'rganmoqda</span>
              </div>
            )}
          </div>

          {/* Product window */}
          <div className="hero-stage fade-up-d2">
            <div className="app-window">
              <div className="aw-bar">
                <div className="aw-dots"><span /><span /><span /></div>
                <div className="aw-url"><Icon name="lock" size={11} /> ionedu.uz/learn</div>
                <div style={{ width: 42 }} />
              </div>
              <div className="aw-body">
                <div className="aw-side">
                  <div className="aw-side-title">Kurs dasturi</div>
                  {MOCK_LESSONS.map((l, i) => (
                    <div key={i} className={`aw-lesson ${l.s}`}>
                      <span className="tick">
                        {l.s === 'done' && <Icon name="check" size={11} />}
                        {l.s === 'now' && <Icon name="play" size={9} fill />}
                      </span>
                      {l.t}
                      <span className="dur">{l.d}</span>
                    </div>
                  ))}
                </div>
                <div className="aw-mainpane">
                  <div className="aw-video">
                    <svg className="topo" viewBox="0 0 600 300" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
                      <g fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="1">
                        <path d="M-20 240 C 90 180, 170 270, 290 210 S 480 150, 640 200" />
                        <path d="M-20 200 C 100 140, 190 230, 310 170 S 500 110, 640 160" />
                        <path d="M-20 160 C 110 100, 210 190, 330 130 S 520 70, 640 120" />
                        <path d="M-20 120 C 120 60, 230 150, 350 90 S 540 30, 640 80" />
                      </g>
                    </svg>
                    <span className="vbadge">3-DARS · VIDEO</span>
                    <div className="aw-play"><Icon name="play" size={22} fill /></div>
                    <span className="vtime">15:42</span>
                  </div>
                  <div className="aw-meta">
                    <div>
                      <div className="crumbs">Geografiya · Boshlang'ich kurs</div>
                      <h3>Materiklar va okeanlar</h3>
                    </div>
                    <span className="badge badge-green">Davom etmoqda</span>
                  </div>
                  <div className="aw-progress">
                    <div className="bar"><i /></div>
                    <span className="pct">64% · 12 darsdan 8 tasi</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="hero-chip c1">
              <span className="ic" style={{ background: 'var(--green-50)', color: 'var(--green-700)', boxShadow: 'inset 0 0 0 1px var(--green-100)' }}>
                <Icon name="award" size={16} />
              </span>
              <div>
                <div className="t1">Sertifikat berildi</div>
                <div className="t2">KURS YAKUNLANDI</div>
              </div>
            </div>
            <div className="hero-chip c2">
              <span className="ic" style={{ background: 'var(--blue-50)', color: 'var(--blue-600)', boxShadow: 'inset 0 0 0 1px #DFE9F8' }}>
                <Icon name="checkC" size={16} />
              </span>
              <div>
                <div className="t1">Test natijasi — 92%</div>
                <div className="t2">15/16 TO'G'RI JAVOB</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="stats">
        <div className="container stats-grid">
          <div><div className="stat-value">{stats.students ?? 0}<span className="plus">+</span></div><div className="stat-label">O'quvchilar</div></div>
          <div><div className="stat-value">{stats.courses ?? 0}<span className="plus">+</span></div><div className="stat-label">Kurslar</div></div>
          <div><div className="stat-value">{stats.teachers ?? 0}<span className="plus">+</span></div><div className="stat-label">O'qituvchilar</div></div>
          <div><div className="stat-value">{stats.certificates ?? 0}<span className="plus">+</span></div><div className="stat-label">Sertifikatlar</div></div>
        </div>
      </section>

      {/* ── Featured courses ── */}
      <section className="py-20">
        <div className="container">
          <div className="sec-head">
            <div>
              <div className="eyebrow mb-3">Mashhur kurslar</div>
              <h2 className="section-title">O'quvchilar tanlovi</h2>
            </div>
            <Link to="/courses" className="btn btn-ghost">Barchasi <Icon name="arrowR" size={14} /></Link>
          </div>
          {featured.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: 60, color: 'var(--text-3)' }}>
              Hozircha kurslar yo'q. <Link to="/auth/register" style={{ color: 'var(--green-600)' }}>O'qituvchi sifatida ro'yxatdan o'ting</Link> va birinchi kurs muallifi bo'ling.
            </div>
          ) : (
            <div className="grid grid-3">
              {featured.map(c => <CourseCard key={c.id} course={c} />)}
            </div>
          )}
        </div>
      </section>

      {/* ── Tests promo ── */}
      <section style={{ padding: '0 0 88px' }}>
        <div className="container">
          <div className="promo-strip">
            <div className="ic"><Icon name="fileText" size={24} /></div>
            <div style={{ flex: 1, minWidth: 220 }}>
              <h3 style={{ fontSize: 18, marginBottom: 4, letterSpacing: '-0.02em' }}>Bilimingizni sinab ko'ring</h3>
              <p className="text-muted text-sm">O'qituvchilar tayyorlagan mustaqil testlar — natijalaringiz profilingizda saqlanadi.</p>
            </div>
            <Link to="/tests" className="btn btn-primary">
              Testlarga o'tish <Icon name="arrowR" size={14} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="py-20" style={{ background: 'var(--white)', borderTop: '1px solid var(--border-2)', borderBottom: '1px solid var(--border-2)' }}>
        <div className="container">
          <div className="sec-head" style={{ marginBottom: 44 }}>
            <div>
              <div className="eyebrow mb-3">Qanday ishlaydi</div>
              <h2 className="section-title">Uch oddiy qadam</h2>
              <p className="section-sub">Ro'yxatdan o'tib, kurslarni tanlang va o'rganishni boshlang.</p>
            </div>
          </div>
          <div className="steps">
            {[
              ['01', "Ro'yxatdan o'ting", "Bepul akkaunt yarating va o'zingizga mos kurslarni toping."],
              ['02', "Kurslarni o'rganing", "Video darslar, interaktiv testlar va o'qituvchidan jonli yordam."],
              ['03', "Sertifikat oling", "Kursni yakunlab, rasmiy sertifikatga ega bo'ling."],
            ].map(([n, t, p]) => (
              <div key={n} className="step">
                <div className="step-num">{n}</div>
                <h3>{t}</h3>
                <p>{p}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Teachers ── */}
      <section className="py-20">
        <div className="container">
          <div className="sec-head">
            <div>
              <div className="eyebrow mb-3">O'qituvchilarimiz</div>
              <h2 className="section-title">Eng yaxshi mutaxassislar</h2>
            </div>
            <Link to="/teachers" className="btn btn-ghost">Barchasi <Icon name="arrowR" size={14} /></Link>
          </div>
          {topTeachers.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: 40, color: 'var(--text-3)' }}>
              O'qituvchilar tez orada qo'shiladi.
            </div>
          ) : (
            <div className="teachers-scroll">
              {topTeachers.map(t => (
                <Link key={t.id} to={`/teachers/${t.id}`} className="teacher-card">
                  <div className="avatar">{t.initials}</div>
                  <h4>{t.display_name}</h4>
                  <div className="subject">{t.specialty || t.bio?.slice(0, 40) || 'Geografiya'}</div>
                  <div className="meta">
                    <span><strong>{t.course_count ?? 0}</strong> KURS</span>
                    <span><strong>{(t.avg_rating ?? 0).toFixed(1)}</strong> REYTING</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ padding: '24px 0 104px' }}>
        <div className="container">
          <div className="cta-banner">
            <span className="cta-eyebrow">Ionedu · 2026</span>
            <h2>Geografiya sayohatingizni bugun boshlang</h2>
            <p>Birinchi kurs — bepul. Ionedu jamoasiga qo'shiling.</p>
            <Link to="/auth/register" className="btn-light">
              Bepul ro'yxatdan o'tish <Icon name="arrowR" size={16} />
            </Link>
          </div>
        </div>
      </section>
    </Layout>
  )
}
