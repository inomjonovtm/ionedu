import { useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import api, { absUrl } from '../api/client'
import Layout from '../components/Layout'
import Icon from '../components/Icon'
import Pagination from '../components/Pagination'
import { useAuth } from '../store/auth'

const REVIEWS_PAGE_SIZE = 10

const LEVELS = { beginner: "Boshlang'ich", intermediate: "O'rta", advanced: 'Murakkab' }

const styles = `
  .cd-min { min-width: 0; }
  .cd-grow { flex: 1; }
  .cd-crumb { padding: 26px 0 4px; }

  /* ── Hero: a dark atlas cover ── */
  .cd-hero {
    position: relative; overflow: hidden;
    display: grid; grid-template-columns: minmax(0, 1fr) 300px; gap: 20px 40px; align-items: center;
    background: var(--ink); color: #fff; border: 2px solid var(--line); border-radius: 28px;
    box-shadow: var(--hard-lg); padding: 40px 44px 0;
  }
  .cd-hero::before {
    content: ''; position: absolute; inset: 0; pointer-events: none;
    background-image: radial-gradient(rgba(255,255,255,.09) 1.2px, transparent 1.2px); background-size: 22px 22px;
  }
  .cd-hero > * { position: relative; min-width: 0; }
  .cd-tags { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 18px; }
  .cd-tag {
    display: inline-flex; align-items: center; gap: 6px; height: 28px; padding: 0 11px; border-radius: 999px;
    font-family: var(--font-mono); font-size: 10.5px; font-weight: 600; letter-spacing: .08em; text-transform: uppercase;
    border: 1.5px solid rgba(255,255,255,.35); color: #fff; white-space: nowrap;
  }
  .cd-tag.sun { background: var(--sun); color: #14213D; border-color: var(--sun); }
  .cd-hero h1 { color: #fff; font-size: 52px; line-height: 1.02; letter-spacing: -0.045em; overflow-wrap: anywhere; }
  .cd-lead {
    font-size: 16.5px; line-height: 1.6; color: #B7C0D8; margin-top: 16px; max-width: 600px;
    display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;
  }
  .cd-teacher { display: flex; align-items: center; gap: 12px; margin-top: 24px; flex-wrap: wrap; }
  .cd-teacher .avatar { width: 44px; height: 44px; font-size: 15px; border: 2px solid #fff; }
  .cd-teacher .nm { font-weight: 700; font-size: 14.5px; line-height: 1.2; }
  .cd-teacher .rl { font-family: var(--font-mono); font-size: 10.5px; letter-spacing: .1em; text-transform: uppercase; color: #8591B0; margin-top: 3px; }
  .cd-rate {
    display: inline-flex; align-items: center; gap: 6px; margin-left: 10px; height: 34px; padding: 0 12px;
    border-radius: 11px; background: rgba(255,255,255,.1); font-weight: 800; font-size: 14px;
  }
  .cd-rate svg { color: var(--sun); }
  .cd-rate em { font-style: normal; font-weight: 500; color: #B7C0D8; font-size: 13px; }

  .cd-art { display: flex; flex-direction: column; align-items: center; gap: 16px; }
  .cd-art .cd-tile {
    width: 100%; aspect-ratio: 1 / 1; border-radius: 30px; font-size: 120px;
    border: 2px solid #14213D; box-shadow: 8px 8px 0 var(--sun); transform: rotate(4deg);
    position: relative; overflow: hidden; display: flex; align-items: center; justify-content: center;
  }
  .cd-art .cd-tile img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
  .cd-art .coord { color: #8591B0; }

  .cd-stats {
    grid-column: 1 / -1; display: grid; grid-template-columns: repeat(4, minmax(0, 1fr));
    margin: 20px -44px 0; border-top: 1.5px dashed rgba(255,255,255,.2);
  }
  .cd-stat { padding: 20px 12px 22px 44px; border-right: 1.5px dashed rgba(255,255,255,.2); }
  .cd-stat:last-child { border-right: none; }
  .cd-stat .v { font-family: var(--font-display); font-size: 34px; font-weight: 800; letter-spacing: -0.05em; line-height: 1; color: #fff; }
  .cd-stat .l { display: flex; align-items: center; gap: 6px; margin-top: 8px; font-family: var(--font-mono); font-size: 10.5px; letter-spacing: .1em; text-transform: uppercase; color: #B7C0D8; }
  .cd-stat .l svg { color: var(--sun); flex-shrink: 0; }

  /* ── Body ── */
  .cd-layout { display: grid; grid-template-columns: minmax(0, 1fr) 360px; gap: 44px; padding: 44px 0 80px; align-items: start; }
  .cd-main { min-width: 0; }
  .cd-tabs { margin-bottom: 26px; max-width: 100%; }
  .cd-sec-head { display: flex; justify-content: space-between; align-items: flex-end; gap: 12px; flex-wrap: wrap; margin-bottom: 22px; }
  .cd-sec-head h2 { font-size: 30px; letter-spacing: -0.04em; }
  .cd-box { background: var(--white); border: 1.5px solid var(--border); border-radius: var(--r-card); }

  /* Curriculum — stops along a route */
  .cd-route { position: relative; }
  .cd-stop { position: relative; display: grid; grid-template-columns: 46px minmax(0, 1fr); gap: 16px; padding-bottom: 16px; }
  .cd-stop::before { content: ''; position: absolute; left: 22px; top: 46px; bottom: 0; border-left: 2px dashed var(--border); }
  .cd-stop:last-child::before { display: none; }
  .cd-num {
    width: 46px; height: 46px; border-radius: 15px; position: relative; z-index: 1;
    background: var(--white); color: var(--text); border: 2px solid var(--line);
    display: flex; align-items: center; justify-content: center;
    font-family: var(--font-mono); font-weight: 600; font-size: 13px;
    transition: background .15s ease, transform .15s ease;
  }
  .cd-stop.open .cd-num { background: var(--sun); color: #14213D; border-color: #14213D; transform: rotate(-5deg); box-shadow: var(--hard-sm); }
  .cd-sec { background: var(--white); border: 1.5px solid var(--border); border-radius: 18px; overflow: hidden; transition: border-color .15s ease; }
  .cd-stop.open .cd-sec, .cd-sec:hover { border-color: var(--line); }
  .cd-sec-btn { display: flex; align-items: center; gap: 12px; width: 100%; text-align: left; padding: 13px 16px; min-height: 46px; }
  .cd-sec-btn .tt { flex: 1; min-width: 0; font-family: var(--font-display); font-weight: 700; font-size: 17px; letter-spacing: -0.02em; line-height: 1.25; color: var(--text); }
  .cd-sec-btn .mt { font-family: var(--font-mono); font-size: 10.5px; letter-spacing: .06em; text-transform: uppercase; color: var(--text-3); white-space: nowrap; }
  .cd-sec-btn .chev { color: var(--text-3); transition: transform .2s ease; flex-shrink: 0; }
  .cd-stop.open .cd-sec-btn .chev { transform: rotate(180deg); }
  .cd-items { border-top: 1.5px dashed var(--border); padding: 6px; }
  .cd-item { display: flex; align-items: center; gap: 12px; padding: 9px 10px; border-radius: 12px; font-size: 14px; color: var(--text-2); min-width: 0; }
  a.cd-item:hover { background: var(--bg-soft); color: var(--text); }
  .cd-item .ico { width: 32px; height: 32px; border-radius: 10px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; background: var(--bg-soft); color: var(--text-3); }
  .cd-item.test .ico { background: var(--violet-soft); color: var(--violet); }
  .cd-item.done .ico { background: var(--green-100); color: var(--green-800); }
  .cd-item .nm { flex: 1; min-width: 0; font-weight: 600; line-height: 1.35; }
  .cd-item .kd { font-family: var(--font-mono); font-size: 9.5px; font-weight: 600; letter-spacing: .1em; text-transform: uppercase; color: var(--violet); margin-right: 8px; }
  .cd-item .free { margin-left: 8px; vertical-align: 1px; }
  .cd-item .dur { font-family: var(--font-mono); font-size: 11px; color: var(--text-3); white-space: nowrap; flex-shrink: 0; }
  .cd-item .lock { color: var(--text-4); flex-shrink: 0; }
  .cd-none { padding: 14px 12px; font-size: 13.5px; color: var(--text-3); }

  /* About */
  .cd-about p { font-size: 15.5px; line-height: 1.75; color: var(--text-2); white-space: pre-line; }
  .cd-guide { display: flex; gap: 16px; align-items: center; padding: 18px; margin-top: 28px; border-color: var(--line); box-shadow: var(--hard); flex-wrap: wrap; }
  .cd-guide .avatar { width: 60px; height: 60px; font-size: 20px; border: 2px solid var(--line); }
  .cd-guide .who { flex: 1; min-width: 160px; }
  .cd-guide .who small { display: block; font-family: var(--font-mono); font-size: 10.5px; letter-spacing: .1em; text-transform: uppercase; color: var(--text-3); margin-bottom: 4px; }
  .cd-guide .who strong { font-family: var(--font-display); font-size: 19px; letter-spacing: -0.02em; }

  /* Reviews */
  .cd-rev-top { display: grid; grid-template-columns: 190px minmax(0, 1fr); gap: 16px; margin-bottom: 20px; align-items: stretch; }
  .cd-score { background: var(--sun); color: #14213D; border: 2px solid var(--line); border-radius: var(--r-card); box-shadow: var(--hard); padding: 20px; display: flex; flex-direction: column; justify-content: center; transform: rotate(-2deg); }
  .cd-score .big { font-family: var(--font-display); font-size: 60px; font-weight: 800; letter-spacing: -0.06em; line-height: .95; }
  .cd-score .stars { display: flex; gap: 2px; margin: 10px 0 6px; }
  .cd-score small { font-family: var(--font-mono); font-size: 10.5px; letter-spacing: .08em; text-transform: uppercase; }
  .cd-form { padding: 18px; }
  .cd-form .pick { display: flex; align-items: center; gap: 4px; margin-bottom: 12px; color: #F5A300; }
  .cd-form .pick span { font-size: 13px; font-weight: 700; color: var(--text-2); margin-right: 8px; }
  .cd-form .pick button { display: flex; padding: 2px; color: inherit; transition: transform .12s ease; }
  .cd-form .pick button:hover { transform: scale(1.18) rotate(-8deg); }
  .cd-hint { padding: 20px; display: flex; align-items: center; gap: 12px; font-size: 14px; font-weight: 500; color: var(--text-3); }
  .cd-revs { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; }
  .cd-rev { padding: 18px; }
  .cd-rev .hd { display: flex; gap: 11px; align-items: center; margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1.5px dashed var(--border); }
  .cd-rev .hd .avatar { width: 38px; height: 38px; }
  .cd-rev .hd .nm { font-weight: 700; font-size: 14px; line-height: 1.2; }
  .cd-rev .hd .dt { font-family: var(--font-mono); font-size: 10.5px; color: var(--text-3); margin-top: 3px; }
  .cd-rev p { font-size: 14px; line-height: 1.6; color: var(--text-2); overflow-wrap: anywhere; }

  /* ── Enroll ticket ── */
  .cd-side { position: sticky; top: 96px; min-width: 0; }
  .cd-ticket { background: var(--white); border: 2px solid var(--line); border-radius: 24px; box-shadow: var(--hard); overflow: hidden; }
  .cd-ticket-top { padding: 20px 22px 22px; }
  .cd-ticket-lbl { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-bottom: 14px; }
  .cd-ticket-lbl span:first-child { font-family: var(--font-mono); font-size: 10.5px; font-weight: 600; letter-spacing: .12em; text-transform: uppercase; color: var(--text-3); }
  .cd-price { display: flex; align-items: center; gap: 12px; margin-bottom: 18px; flex-wrap: wrap; }
  .cd-price .p { font-family: var(--font-display); font-size: 44px; font-weight: 800; letter-spacing: -0.05em; line-height: 1; }
  .cd-ticket .btn + .btn { margin-top: 10px; }
  .cd-prog { margin-top: 16px; }
  .cd-prog .row { display: flex; justify-content: space-between; font-size: 12.5px; font-weight: 600; color: var(--text-3); margin-bottom: 7px; }
  .cd-prog .row strong { font-family: var(--font-mono); color: var(--green-700); }
  .cd-inc { list-style: none; display: flex; flex-direction: column; gap: 11px; padding: 20px 22px 22px; border-top: 2px dashed var(--border); background: var(--paper); }
  .cd-inc li { display: flex; align-items: center; gap: 11px; font-size: 14px; font-weight: 600; color: var(--text-2); }
  .cd-inc .i { width: 30px; height: 30px; border-radius: 10px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; background: var(--white); border: 1.5px solid var(--border); color: var(--text); }

  .cd-missing { padding-top: 60px; padding-bottom: 40px; }

  @media (max-width: 1024px) {
    .cd-hero { grid-template-columns: minmax(0, 1fr) 220px; padding: 32px 30px 0; gap: 16px 28px; }
    .cd-hero h1 { font-size: 42px; }
    .cd-art .cd-tile { font-size: 88px; border-radius: 24px; }
    .cd-stats { margin: 16px -30px 0; }
    .cd-stat { padding-left: 30px; }
    .cd-layout { grid-template-columns: minmax(0, 1fr); gap: 28px; padding-top: 32px; }
    .cd-side { position: static; order: -1; }
  }
  @media (max-width: 768px) {
    .cd-hero { grid-template-columns: minmax(0, 1fr); padding: 24px 20px 0; border-radius: 22px; box-shadow: var(--hard); }
    .cd-hero h1 { font-size: 32px; }
    .cd-lead { font-size: 15px; }
    .cd-art { order: -1; align-items: flex-start; }
    .cd-art .cd-tile { width: 96px; font-size: 48px; border-radius: 20px; box-shadow: 4px 4px 0 var(--sun); }
    .cd-art .coord { display: none; }
    .cd-rate { margin-left: 0; }
    .cd-stats { grid-template-columns: repeat(2, minmax(0, 1fr)); margin: 18px -20px 0; }
    .cd-stat { padding: 16px 10px 16px 20px; }
    .cd-stat:nth-child(2) { border-right: none; }
    .cd-stat:nth-child(-n+2) { border-bottom: 1.5px dashed rgba(255,255,255,.2); }
    .cd-stat .v { font-size: 28px; }
    .cd-sec-head h2 { font-size: 24px; }
    .cd-stop { grid-template-columns: 36px minmax(0, 1fr); gap: 10px; }
    .cd-stop::before { left: 17px; top: 36px; }
    .cd-num { width: 36px; height: 36px; border-radius: 12px; font-size: 11.5px; }
    .cd-sec-btn { flex-wrap: wrap; gap: 4px 10px; padding: 11px 12px; }
    .cd-sec-btn .tt { flex-basis: calc(100% - 30px); font-size: 15.5px; }
    .cd-sec-btn .mt { order: 3; }
    .cd-item { gap: 10px; padding: 8px 6px; }
    .cd-rev-top { grid-template-columns: minmax(0, 1fr); }
    .cd-score { transform: none; flex-direction: row; align-items: center; gap: 14px; flex-wrap: wrap; padding: 14px 18px; }
    .cd-score .big { font-size: 40px; }
    .cd-score .stars { margin: 0; }
    .cd-revs { grid-template-columns: minmax(0, 1fr); }
    .cd-inc { display: none; }
  }
`

// Ordered mix of lessons and tests for a section. The API sends `items`;
// older payloads only have separate `lessons` / `tests` arrays.
function sectionItems(section) {
  if (Array.isArray(section.items)) return section.items
  return [
    ...(section.lessons || []).map(l => ({ ...l, kind: 'lesson' })),
    ...(section.tests || []).map(t => ({ ...t, kind: 'test' })),
  ]
}

function CurriculumItem({ item, courseSlug, isEnrolled }) {
  const isTest = item.kind === 'test'
  const done = isTest ? item.is_passed : item.is_completed
  const cls = `cd-item ${isTest ? 'test' : ''} ${done ? 'done' : ''}`
  const inner = (
    <>
      <span className="ico"><Icon name={done ? 'check' : isTest ? 'fileText' : 'play'} size={15} /></span>
      <span className="nm">
        {isTest && <span className="kd">Test</span>}
        {item.title}
        {!isTest && !isEnrolled && item.is_free_preview && <span className="badge badge-green free">Bepul</span>}
      </span>
      <span className="dur">
        {isTest
          ? `${item.question_count ?? 0} savol${item.time_limit_minutes ? ` · ${item.time_limit_minutes} daq` : ''}`
          : `${item.duration_minutes ?? 0} daq`}
      </span>
      {!isEnrolled && !item.is_free_preview && <Icon name="lock" size={14} className="lock" />}
    </>
  )
  if (!isEnrolled) return <div className={cls}>{inner}</div>
  return (
    <Link to={isTest ? `/learn/${courseSlug}/test/${item.id}` : `/learn/${courseSlug}/${item.id}`} className={cls}>
      {inner}
    </Link>
  )
}

function AccordionSection({ section, idx, courseSlug, isEnrolled }) {
  const [open, setOpen] = useState(idx === 0)
  const items = sectionItems(section)
  return (
    <div className={`cd-stop ${open ? 'open' : ''}`}>
      <div className="cd-num">{String(idx + 1).padStart(2, '0')}</div>
      <div className="cd-sec">
        <button type="button" className="cd-sec-btn" onClick={() => setOpen(o => !o)} aria-expanded={open}>
          <span className="tt">{section.title}</span>
          <span className="mt">{section.lesson_count} dars · {section.test_count} test</span>
          <Icon name="chevD" size={18} className="chev" />
        </button>
        {open && (
          <div className="cd-items">
            {items.length === 0
              ? <div className="cd-none">Bu bo'limda hozircha dars yo'q</div>
              : items.map(it => (
                <CurriculumItem key={`${it.kind}-${it.id}`} item={it} courseSlug={courseSlug} isEnrolled={isEnrolled} />
              ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default function CourseDetail() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { user } = useAuth()

  const { data: course, isLoading } = useQuery({
    queryKey: ['course', slug],
    queryFn: () => api.get(`/courses/${slug}/`).then(r => r.data),
  })

  const [tab, setTab] = useState('curriculum')
  const [reviewText, setReviewText] = useState('')
  const [reviewRating, setReviewRating] = useState(5)
  const [reviewPage, setReviewPage] = useState(1)

  const enroll = useMutation({
    mutationFn: () => api.post(`/courses/${slug}/enroll/`).then(r => r.data),
    onSuccess: () => {
      toast.success('Kursga yozildingiz!')
      qc.invalidateQueries({ queryKey: ['course', slug] })
      qc.invalidateQueries({ queryKey: ['enrollments'] })
      const firstLesson = (course?.sections || []).flatMap(s => s.lessons || [])[0]
      if (firstLesson) navigate(`/learn/${slug}/${firstLesson.id}`)
    },
    onError: () => toast.error("Yozilishda xatolik"),
  })

  const { data: reviews = [] } = useQuery({
    queryKey: ['course-reviews', slug],
    queryFn: () => api.get(`/courses/${slug}/reviews/`).then(r => r.data),
    enabled: !!slug,
  })

  const postReview = useMutation({
    mutationFn: () => api.post(`/courses/${slug}/reviews/`, { rating: reviewRating, comment: reviewText }),
    onSuccess: () => {
      toast.success("Sharh saqlandi")
      setReviewText(''); setReviewRating(5)
      qc.invalidateQueries({ queryKey: ['course-reviews', slug] })
      qc.invalidateQueries({ queryKey: ['course', slug] })
    },
    onError: () => toast.error("Sharh saqlanmadi"),
  })

  if (isLoading) return <Layout><div className="loading-state"><span className="spinner" />Kurs yuklanmoqda…</div></Layout>
  if (!course) return (
    <Layout>
      <style>{styles}</style>
      <div className="container cd-missing">
        <div className="cd-box empty-state">
          <div className="es-ico"><Icon name="compass" size={24} /></div>
          <div className="es-title">Kurs topilmadi</div>
          <div className="es-sub">Bu manzilda kurs yo'q. Katalogdan boshqa kursni tanlang.</div>
          <Link to="/courses" className="btn btn-accent btn-sm">Kurslarga qaytish</Link>
        </div>
      </div>
    </Layout>
  )

  const totalLessons = course.lessons_count
  const totalTests = (course.sections || []).reduce((s, x) => s + (x.test_count || 0), 0)
  const hours = Math.round(course.total_duration_minutes / 60)

  // Where "continue" should land: first incomplete lesson, else first unpassed
  // test, else the first lesson (fallback for re-watching).
  const allLessons = (course.sections || []).flatMap(s => s.lessons || [])
  const allTests = (course.sections || []).flatMap(s => s.tests || [])
  const firstIncompleteLesson = allLessons.find(l => !l.is_completed)
  const firstUnpassedTest = allTests.find(t => !t.is_passed)
  const continueTo = firstIncompleteLesson
    ? `/learn/${course.slug}/${firstIncompleteLesson.id}`
    : firstUnpassedTest
      ? `/learn/${course.slug}/test/${firstUnpassedTest.id}`
      : allLessons[0] ? `/learn/${course.slug}/${allLessons[0].id}` : null
  const isCompleted = course.is_enrolled && (course.progress || 0) >= 100
  const pageReviews = reviews.slice((reviewPage - 1) * REVIEWS_PAGE_SIZE, reviewPage * REVIEWS_PAGE_SIZE)

  return (
    <Layout>
      <style>{styles}</style>
      <div className="container">
        <div className="cd-crumb">
          <div className="breadcrumb">
            <Link to="/">Bosh sahifa</Link><span className="sep">/</span>
            <Link to="/courses">Kurslar</Link><span className="sep">/</span>
            <span>{course.title}</span>
          </div>
        </div>

        <section className="cd-hero fade-up">
          <div>
            <div className="cd-tags">
              {course.category && <span className="cd-tag sun">{course.category.name}</span>}
              {LEVELS[course.level] && <span className="cd-tag">{LEVELS[course.level]}</span>}
              <span className="cd-tag"><Icon name="globe" size={12} /> O'zbek tilida</span>
            </div>
            <h1>{course.title}</h1>
            {course.description && <p className="cd-lead">{course.description}</p>}
            <div className="cd-teacher">
              <div className="avatar avatar-amber">{course.teacher?.initials}</div>
              <div>
                <div className="nm">{course.teacher?.display_name}</div>
                <div className="rl">O'qituvchi</div>
              </div>
              <div className="cd-rate">
                <Icon name="starF" size={15} /> {course.rating_avg || 0}
                <em>({course.rating_count} sharh)</em>
              </div>
            </div>
          </div>

          <div className="cd-art" aria-hidden="true">
            {course.thumbnail ? (
              <div className="cd-tile"><img src={absUrl(course.thumbnail)} alt="" /></div>
            ) : (
              <div className={`thumb thumb-${course.thumb_color || 'blue'} cd-tile`}><span>{course.thumb_emoji || '🌍'}</span></div>
            )}
            <span className="coord">41.31°N · 69.24°E</span>
          </div>

          <div className="cd-stats">
            <div className="cd-stat"><div className="v">{course.students_count}</div><div className="l"><Icon name="users" size={13} /> o'quvchi</div></div>
            <div className="cd-stat"><div className="v">{totalLessons}</div><div className="l"><Icon name="video" size={13} /> video dars</div></div>
            <div className="cd-stat"><div className="v">{totalTests}</div><div className="l"><Icon name="fileText" size={13} /> test</div></div>
            <div className="cd-stat"><div className="v">{hours}</div><div className="l"><Icon name="clock" size={13} /> soat</div></div>
          </div>
        </section>

        <div className="cd-layout">
          <div className="cd-main fade-up-d1">
            <div className="seg-tabs cd-tabs">
              {[['curriculum', 'Dastur'], ['about', 'Haqida'], ['reviews', `Sharhlar (${course.rating_count || 0})`]].map(([k, n]) => (
                <button key={k} type="button" onClick={() => setTab(k)} className={tab === k ? 'on' : ''}>{n}</button>
              ))}
            </div>

            {tab === 'curriculum' && (
              <div>
                <div className="cd-sec-head">
                  <h2>Kurs <span className="mark-sun">yo'nalishi</span></h2>
                  <span className="coord">{course.sections?.length} BO'LIM · {totalLessons} DARS · {totalTests} TEST</span>
                </div>
                {(course.sections || []).length === 0 ? (
                  <div className="cd-box empty-state empty-sm">
                    <div className="es-ico"><Icon name="map" size={20} /></div>
                    <div className="es-title">Hozircha bo'limlar yo'q</div>
                  </div>
                ) : (
                  <div className="cd-route">
                    {(course.sections || []).map((s, i) => (
                      <AccordionSection key={s.id} section={s} idx={i} courseSlug={course.slug} isEnrolled={course.is_enrolled} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {tab === 'about' && (
              <div className="cd-about">
                <div className="cd-sec-head"><h2>Kurs <span className="mark-sea">haqida</span></h2></div>
                <p>{course.description || "Tavsif kiritilmagan."}</p>
                <div className="card cd-guide">
                  <div className="avatar avatar-amber">{course.teacher?.initials}</div>
                  <div className="who">
                    <small>O'qituvchi</small>
                    <strong>{course.teacher?.display_name}</strong>
                  </div>
                  <Link to={`/teachers/${course.teacher?.id}`} className="btn btn-secondary btn-sm">Profilni ko'rish <Icon name="arrowR" size={14} /></Link>
                </div>
              </div>
            )}

            {tab === 'reviews' && (
              <div>
                <div className="cd-sec-head"><h2>Sharhlar va <span className="mark-coral">baholar</span></h2></div>
                <div className="cd-rev-top">
                  <div className="cd-score">
                    <div className="big">{course.rating_avg || 0}</div>
                    <div className="stars">
                      {[1, 2, 3, 4, 5].map(n => <Icon key={n} name={n <= Math.round(course.rating_avg || 0) ? 'starF' : 'star'} size={16} />)}
                    </div>
                    <small>{course.rating_count || 0} ta sharh</small>
                  </div>
                  {user && course.is_enrolled ? (
                    <div className="cd-box cd-form">
                      <div className="pick">
                        <span>Bahoyingiz:</span>
                        {[1, 2, 3, 4, 5].map(n => (
                          <button key={n} type="button" onClick={() => setReviewRating(n)} aria-label={`${n} yulduz`}>
                            <Icon name={n <= reviewRating ? 'starF' : 'star'} size={24} />
                          </button>
                        ))}
                      </div>
                      <textarea className="textarea" rows={3} value={reviewText} onChange={e => setReviewText(e.target.value)} placeholder="Fikringizni yozing…" />
                      <button className="btn btn-primary btn-sm mt-3" onClick={() => postReview.mutate()} disabled={postReview.isPending || !reviewText.trim()}>
                        {postReview.isPending ? 'Yuborilmoqda…' : "Sharh yuborish"}
                      </button>
                    </div>
                  ) : (
                    <div className="cd-box cd-hint">
                      <Icon name="comment" size={20} />
                      <span>Sharh qoldirish uchun kursga yoziling — fikringiz boshqa o'quvchilarga yo'l ko'rsatadi.</span>
                    </div>
                  )}
                </div>
                {reviews.length === 0 ? (
                  <div className="cd-box empty-state empty-sm">
                    <div className="es-ico"><Icon name="comment" size={20} /></div>
                    <div className="es-title">Hozircha sharhlar yo'q</div>
                  </div>
                ) : (
                  <>
                    <div className="cd-revs">
                      {pageReviews.map(r => (
                        <div key={r.id} className="cd-box cd-rev">
                          <div className="hd">
                            <div className="avatar avatar-blue">{r.student?.initials}</div>
                            <div className="cd-min cd-grow">
                              <div className="nm">{r.student?.display_name}</div>
                              <div className="dt">{new Date(r.created_at).toLocaleDateString('uz-UZ')}</div>
                            </div>
                            <span className="stars-row">
                              {[1, 2, 3, 4, 5].map(n => <Icon key={n} name={n <= r.rating ? 'starF' : 'star'} size={13} />)}
                            </span>
                          </div>
                          <p>{r.comment}</p>
                        </div>
                      ))}
                    </div>
                    <Pagination page={reviewPage} pageSize={REVIEWS_PAGE_SIZE} total={reviews.length} onChange={setReviewPage} />
                  </>
                )}
              </div>
            )}
          </div>

          <aside className="cd-side fade-up-d2">
            <div className="cd-ticket">
              <div className="cd-ticket-top">
                <div className="cd-ticket-lbl">
                  <span>Yo'l chiptasi</span>
                  <span className="coord">№ {String(course.id).padStart(4, '0')}</span>
                </div>
                <div className="cd-price">
                  <div className="p">Bepul</div>
                  <span className="badge badge-green">Hammaga ochiq</span>
                </div>

                {isCompleted ? (
                  <>
                    <Link to={`/learn/${course.slug}/complete`} className="btn btn-primary btn-lg btn-block">
                      <Icon name="award" size={16} /> Sertifikatni olish
                    </Link>
                    {continueTo && (
                      <Link to={continueTo} className="btn btn-secondary btn-block">
                        Darslarni qayta ko'rish
                      </Link>
                    )}
                  </>
                ) : course.is_enrolled ? (
                  continueTo ? (
                    <>
                      <Link to={continueTo} className="btn btn-primary btn-lg btn-block">
                        Davom etish <Icon name="arrowR" size={16} />
                      </Link>
                      {course.progress > 0 && (
                        <div className="cd-prog">
                          <div className="row"><span>Bosib o'tilgan yo'l</span><strong>{Math.round(course.progress)}%</strong></div>
                          <div className="progress"><div className="progress-fill" style={{ width: `${course.progress}%` }} /></div>
                        </div>
                      )}
                    </>
                  ) : (
                    <button className="btn btn-primary btn-lg btn-block" disabled>
                      Darslar hali qo'shilmagan
                    </button>
                  )
                ) : (
                  <button
                    className="btn btn-primary btn-lg btn-block"
                    onClick={() => user ? enroll.mutate() : navigate('/auth/login')}
                    disabled={enroll.isPending || allLessons.length === 0}
                  >
                    {enroll.isPending ? 'Yozilmoqda…' : allLessons.length === 0 ? "Darslar hali qo'shilmagan" : 'Kursga yozilish'} {allLessons.length > 0 && <Icon name="arrowR" size={16} />}
                  </button>
                )}
              </div>

              <ul className="cd-inc">
                <li><span className="i"><Icon name="clock" size={15} /></span> {hours} soat video kontent</li>
                <li><span className="i"><Icon name="video" size={15} /></span> {totalLessons} ta video dars</li>
                <li><span className="i"><Icon name="fileText" size={15} /></span> {totalTests} ta interaktiv test</li>
                <li><span className="i"><Icon name="award" size={15} /></span> Tugatgandan keyin sertifikat</li>
                <li><span className="i"><Icon name="phone" size={15} /></span> Mobil va kompyuterda</li>
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </Layout>
  )
}
