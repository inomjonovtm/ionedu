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

const styles = `
  .course-layout { display: grid; grid-template-columns: 1fr 380px; gap: 48px; padding: 32px 0 80px; align-items: start; }
  .course-hero h1 { font-size: 38px; line-height: 1.15; letter-spacing: -0.025em; margin: 12px 0; }
  .course-hero .lead { font-size: 17px; color: var(--text-3); margin-bottom: 24px; max-width: 620px; }
  .teacher-row { display: flex; align-items: center; gap: 12px; padding: 16px 0; margin: 16px 0; border-top: 1px solid var(--border); border-bottom: 1px solid var(--border); }
  .teacher-row .avatar { width: 40px; height: 40px; font-size: 14px; }
  .teacher-row .name { font-weight: 600; font-size: 14px; }
  .teacher-row .role { font-size: 12px; color: var(--text-3); }
  .meta-row { display: flex; gap: 24px; flex-wrap: wrap; font-size: 13px; color: var(--text-3); margin-bottom: 32px; }
  .meta-row span { display: inline-flex; align-items: center; gap: 6px; }
  .meta-row strong { color: var(--text); font-weight: 600; }
  .tabs { display: flex; gap: 4px; border-bottom: 1px solid var(--border); margin-bottom: 28px; }
  .tab { padding: 12px 18px; font-size: 14px; font-weight: 500; color: var(--text-3); position: relative; cursor: pointer; }
  .tab.active { color: var(--green-600); }
  .tab.active::after { content: ''; position: absolute; left: 0; right: 0; bottom: -1px; height: 2px; background: var(--green-600); }
  .section-accordion { border: 1px solid var(--border); border-radius: 12px; overflow: hidden; margin-bottom: 12px; background: var(--white); }
  .acc-head { display: flex; align-items: center; gap: 12px; padding: 16px 20px; cursor: pointer; user-select: none; }
  .acc-num { width: 28px; height: 28px; border-radius: 9px; background: var(--green-50); color: var(--green-700); box-shadow: inset 0 0 0 1px var(--green-100); font-weight: 560; font-size: 12px; display: flex; align-items: center; justify-content: center; font-family: var(--font-mono); }
  .acc-title { font-weight: 600; font-size: 15px; flex: 1; }
  .acc-meta { font-size: 12px; color: var(--text-3); }
  .acc-body { border-top: 1px solid var(--border-2); }
  .lesson-item { display: flex; align-items: center; gap: 12px; padding: 12px 20px 12px 60px; border-bottom: 1px solid var(--border-2); font-size: 14px; }
  .lesson-item:last-child { border-bottom: none; }
  .lesson-item .ico { width: 28px; height: 28px; border-radius: 6px; display: flex; align-items: center; justify-content: center; color: var(--text-3); background: var(--bg-soft); }
  .lesson-item.test .ico { background: var(--green-50); color: var(--green-600); }
  .lesson-item .name { flex: 1; color: var(--text-2); }
  .lesson-item .dur { font-size: 12px; color: var(--text-3); }
  .course-sidebar { position: sticky; top: 88px; }
  .preview-frame { aspect-ratio: 16/9; border-radius: 12px 12px 0 0; background: linear-gradient(135deg, #DBEAFE, #BFDBFE); display: flex; align-items: center; justify-content: center; color: #1E40AF; font-size: 64px; }
  .sidebar-card { background: var(--white); border: 1px solid var(--border); border-radius: 12px; overflow: hidden; box-shadow: 0 8px 24px rgba(0,0,0,0.04); }
  .sidebar-body { padding: 24px; }
  .price-row { display: flex; align-items: baseline; gap: 12px; margin-bottom: 16px; }
  .price { font-family: var(--font-mono); font-size: 30px; font-weight: 560; letter-spacing: -0.04em; color: var(--text); }
  .includes { display: flex; flex-direction: column; gap: 12px; margin-top: 24px; padding-top: 24px; border-top: 1px solid var(--border-2); list-style: none; padding-left: 0; }
  .includes li { display: flex; align-items: center; gap: 10px; font-size: 14px; color: var(--text-2); }
  .includes .ico { color: var(--green-600); }
  @media (max-width: 1024px) { .course-layout { grid-template-columns: 1fr; } .course-sidebar { position: static; } }
`

function AccordionSection({ section, idx, courseSlug, isEnrolled }) {
  const [open, setOpen] = useState(idx === 0)
  return (
    <div className={`section-accordion ${open ? 'open' : ''}`}>
      <div className="acc-head" onClick={() => setOpen(o => !o)}>
        <div className="acc-num">{String(idx + 1).padStart(2, '0')}</div>
        <div className="acc-title">{section.title}</div>
        <div className="acc-meta">{section.lesson_count} dars · {section.test_count} test</div>
        <Icon name="chevD" size={18} style={{ color: 'var(--text-3)', transform: open ? 'rotate(180deg)' : '', transition: '.2s' }} />
      </div>
      {open && (
        <div className="acc-body">
          {section.lessons.map(l => (
            isEnrolled ? (
              <Link key={l.id} to={`/learn/${courseSlug}/${l.id}`} className="lesson-item" style={{ textDecoration: 'none' }}>
                <span className="ico"><Icon name="play" size={14} /></span>
                <span className="name">{l.title}</span>
                <span className="dur">{l.duration_minutes} daq</span>
              </Link>
            ) : (
              <div key={l.id} className={`lesson-item ${l.is_free_preview ? 'preview' : ''}`}>
                <span className="ico"><Icon name="play" size={14} /></span>
                <span className="name">{l.title}{l.is_free_preview && <span style={{ marginLeft: 10, padding: '2px 8px', background: 'var(--green-50)', color: 'var(--green-600)', fontSize: 11, fontWeight: 600, borderRadius: 999 }}>Bepul</span>}</span>
                <span className="dur">{l.duration_minutes} daq</span>
              </div>
            )
          ))}
          {section.tests?.map(t => (
            isEnrolled ? (
              <Link key={`t-${t.id}`} to={`/learn/${courseSlug}/test/${t.id}`} className="lesson-item test" style={{ textDecoration: 'none' }}>
                <span className="ico"><Icon name="fileText" size={14} /></span>
                <span className="name">Test: {t.title}</span>
                <span className="dur">{t.question_count} savol</span>
              </Link>
            ) : (
              <div key={`t-${t.id}`} className="lesson-item test">
                <span className="ico"><Icon name="fileText" size={14} /></span>
                <span className="name">Test: {t.title}</span>
                <span className="dur">{t.question_count} savol</span>
              </div>
            )
          ))}
        </div>
      )}
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
      qc.invalidateQueries(['course', slug])
      qc.invalidateQueries(['enrollments'])
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
      qc.invalidateQueries(['course-reviews', slug])
      qc.invalidateQueries(['course', slug])
    },
    onError: () => toast.error("Sharh saqlanmadi"),
  })

  if (isLoading) return <Layout><div className="loading-state"><span className="spinner" />Kurs yuklanmoqda…</div></Layout>
  if (!course) return <Layout><div style={{ padding: 80, textAlign: 'center' }}>Kurs topilmadi</div></Layout>

  const totalLessons = course.lessons_count
  const totalTests = (course.sections || []).reduce((s, x) => s + (x.test_count || 0), 0)

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

  return (
    <Layout>
      <style>{styles}</style>
      <div className="container">
        <div className="page-head">
          <div className="breadcrumb">
            <Link to="/">Bosh sahifa</Link><span className="sep">/</span>
            <Link to="/courses">Kurslar</Link><span className="sep">/</span>
            <span>{course.title}</span>
          </div>
        </div>

        <div className="course-layout">
          <div className="course-hero fade-up">
            {course.category && <span className="badge badge-blue">{course.category.name}</span>}
            <h1>{course.title}</h1>
            <p className="lead">{course.description}</p>

            <div className="teacher-row">
              <div className="avatar avatar-amber">{course.teacher?.initials}</div>
              <div style={{ flex: 1 }}>
                <div className="name">{course.teacher?.display_name}</div>
                <div className="role">O'qituvchi</div>
              </div>
              <div className="rating">
                <Icon name="starF" size={16} /> {course.rating_avg || 0}
                <span style={{ fontWeight: 400, color: 'var(--text-3)', marginLeft: 4 }}>({course.rating_count} sharh)</span>
              </div>
            </div>

            <div className="meta-row">
              <span><Icon name="users" size={14} /> <strong>{course.students_count}</strong> o'quvchi</span>
              <span><Icon name="video" size={14} /> <strong>{totalLessons}</strong> video dars</span>
              <span><Icon name="fileText" size={14} /> <strong>{totalTests}</strong> test</span>
              <span><Icon name="clock" size={14} /> <strong>{Math.round(course.total_duration_minutes / 60)}</strong> soat</span>
              <span><Icon name="globe" size={14} /> O'zbek tilida</span>
            </div>

            <div className="tabs">
              {[['curriculum', 'Dastur'], ['about', 'Haqida'], ['reviews', `Sharhlar (${course.rating_count || 0})`]].map(([k, n]) => (
                <button key={k} onClick={() => setTab(k)} className={`tab ${tab === k ? 'active' : ''}`}>{n}</button>
              ))}
            </div>

            {tab === 'curriculum' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end', marginBottom: 16 }}>
                  <h3 style={{ fontSize: 20 }}>Kurs dasturi</h3>
                  <span className="text-sm text-muted">{course.sections?.length} bo'lim · {totalLessons} dars · {totalTests} test</span>
                </div>
                {(course.sections || []).length === 0 ? (
                  <div className="card" style={{ padding: 40, textAlign: 'center', color: 'var(--text-3)' }}>Hozircha bo'limlar yo'q</div>
                ) : (course.sections || []).map((s, i) => (
                  <AccordionSection key={s.id} section={s} idx={i} courseSlug={course.slug} isEnrolled={course.is_enrolled} />
                ))}
              </div>
            )}

            {tab === 'about' && (
              <div style={{ fontSize: 15, lineHeight: 1.7, color: 'var(--text-2)' }}>
                <h3 style={{ fontSize: 18, marginBottom: 12 }}>Kurs haqida</h3>
                <p style={{ whiteSpace: 'pre-line' }}>{course.description || "Tavsif kiritilmagan."}</p>
                <h3 style={{ fontSize: 18, margin: '24px 0 12px' }}>O'qituvchi</h3>
                <div className="card" style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                  <div className="avatar avatar-amber" style={{ width: 56, height: 56, fontSize: 18 }}>{course.teacher?.initials}</div>
                  <div>
                    <div style={{ fontWeight: 600 }}>{course.teacher?.display_name}</div>
                    <Link to={`/teachers/${course.teacher?.id}`} className="text-sm" style={{ color: 'var(--green-600)' }}>Profilni ko'rish →</Link>
                  </div>
                </div>
              </div>
            )}

            {tab === 'reviews' && (
              <div>
                <h3 style={{ fontSize: 18, marginBottom: 16 }}>Sharhlar va baholar</h3>
                {user && course.is_enrolled && (
                  <div className="card" style={{ marginBottom: 16 }}>
                    <div style={{ marginBottom: 10 }}>
                      <span style={{ display: 'inline-flex', gap: 4, color: '#F59E0B' }}>
                        {[1, 2, 3, 4, 5].map(n => (
                          <button key={n} type="button" onClick={() => setReviewRating(n)} style={{ background: 'none', padding: 0 }}>
                            <Icon name={n <= reviewRating ? 'starF' : 'star'} size={22} />
                          </button>
                        ))}
                      </span>
                    </div>
                    <textarea className="textarea" rows={3} value={reviewText} onChange={e => setReviewText(e.target.value)} placeholder="Fikringizni yozing…" />
                    <button className="btn btn-primary btn-sm mt-3" onClick={() => postReview.mutate()} disabled={postReview.isPending || !reviewText.trim()}>
                      {postReview.isPending ? 'Yuborilmoqda…' : "Sharh yuborish"}
                    </button>
                  </div>
                )}
                {reviews.length === 0 ? (
                  <div className="card" style={{ padding: 40, textAlign: 'center', color: 'var(--text-3)' }}>Hozircha sharhlar yo'q</div>
                ) : (
                  <>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {reviews.slice((reviewPage - 1) * REVIEWS_PAGE_SIZE, reviewPage * REVIEWS_PAGE_SIZE).map(r => (
                        <div key={r.id} className="card">
                          <div style={{ display: 'flex', gap: 12, marginBottom: 10, alignItems: 'center' }}>
                            <div className="avatar avatar-blue">{r.student?.initials}</div>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontWeight: 600 }}>{r.student?.display_name}</div>
                              <div className="text-xs text-muted">{new Date(r.created_at).toLocaleDateString('uz-UZ')}</div>
                            </div>
                            <span style={{ display: 'inline-flex', gap: 2, color: '#F59E0B' }}>
                              {[1, 2, 3, 4, 5].map(n => <Icon key={n} name={n <= r.rating ? 'starF' : 'star'} size={14} />)}
                            </span>
                          </div>
                          <p className="text-sm" style={{ color: 'var(--text-2)' }}>{r.comment}</p>
                        </div>
                      ))}
                    </div>
                    <Pagination page={reviewPage} pageSize={REVIEWS_PAGE_SIZE} total={reviews.length} onChange={setReviewPage} />
                  </>
                )}
              </div>
            )}
          </div>

          <aside className="course-sidebar fade-up-d2">
            <div className="sidebar-card">
              {course.thumbnail ? (
                <div style={{ aspectRatio: '16/9', overflow: 'hidden' }}>
                  <img src={absUrl(course.thumbnail)} alt={course.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              ) : (
                <div className="preview-frame">{course.thumb_emoji || '🌍'}</div>
              )}
              <div className="sidebar-body">
                <div className="price-row">
                  <div className="price">Bepul</div>
                  <span className="badge badge-green">Hammaga ochiq</span>
                </div>

                {isCompleted ? (
                  <>
                    <Link to={`/learn/${course.slug}/complete`} className="btn btn-primary btn-lg btn-block">
                      <Icon name="award" size={16} /> Sertifikatni olish
                    </Link>
                    {continueTo && (
                      <Link to={continueTo} className="btn btn-secondary btn-block" style={{ marginTop: 10 }}>
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
                        <div style={{ marginTop: 14 }}>
                          <div className="progress"><div className="progress-fill" style={{ width: `${course.progress}%` }} /></div>
                          <div className="text-xs text-muted mt-1" style={{ textAlign: 'right' }}>{Math.round(course.progress)}% tugatildi</div>
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

                <ul className="includes">
                  <li><Icon name="checkC" size={18} /> {Math.round(course.total_duration_minutes / 60)} soat video kontent</li>
                  <li><Icon name="checkC" size={18} /> {totalLessons} ta video dars</li>
                  <li><Icon name="checkC" size={18} /> {totalTests} ta interaktiv test</li>
                  <li><Icon name="checkC" size={18} /> Tugatgandan keyin sertifikat</li>
                  <li><Icon name="checkC" size={18} /> Mobil va kompyuterda</li>
                </ul>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </Layout>
  )
}
