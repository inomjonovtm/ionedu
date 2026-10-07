import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import api, { absUrl } from '../../api/client'
import Navbar from '../../components/Navbar'
import Icon from '../../components/Icon'
import { useAuth } from '../../store/auth'
import { sanitizeHtml, isHtmlContent } from '../../api/richText'

function youtubeEmbed(url) {
  if (!url) return null
  const m = url.match(/(?:youtu\.be\/|v=)([\w-]{11})/)
  return m ? `https://www.youtube.com/embed/${m[1]}` : null
}

export default function LessonPlayer() {
  const { slug, lessonId } = useParams()
  const navigate = useNavigate()
  const qc = useQueryClient()

  const { data: course } = useQuery({
    queryKey: ['course', slug],
    queryFn: () => api.get(`/courses/${slug}/`).then(r => r.data),
  })

  const lesson = useMemo(() => {
    if (!course) return null
    for (const s of course.sections || []) {
      for (const l of s.lessons || []) {
        if (String(l.id) === String(lessonId)) return { ...l, sectionTitle: s.title }
      }
    }
    return null
  }, [course, lessonId])

  // Build a flat ordered list of ALL items (lessons + tests, in section order, lessons before tests)
  const ordered = useMemo(() => {
    if (!course) return []
    const out = []
    for (const s of course.sections || []) {
      for (const l of s.lessons || []) {
        out.push({ kind: 'lesson', id: l.id, lesson: l, sectionTitle: s.title, done: !!l.is_completed })
      }
      for (const t of s.tests || []) {
        out.push({ kind: 'test', id: t.id, test: t, sectionTitle: s.title, done: !!t.is_passed })
      }
    }
    return out
  }, [course])

  // Compute locked state — an item is locked if any earlier item is not done.
  // The course's own teacher and admins preview freely (never locked).
  const { user } = useAuth()
  const canBypass = useMemo(() => {
    if (!course || !user) return false
    return user.role === 'admin' || course.teacher?.id === user.id
  }, [course, user])

  const lockedSet = useMemo(() => {
    const set = new Set()
    let blocked = false
    for (const it of ordered) {
      if (blocked) set.add(`${it.kind}-${it.id}`)
      if (!it.done) blocked = true
    }
    return set
  }, [ordered])

  const isLocked = (kind, id) => !canBypass && lockedSet.has(`${kind}-${id}`)

  const lessonItems = ordered.filter(it => it.kind === 'lesson').map(it => it.lesson)
  const idx = lessonItems.findIndex(l => String(l.id) === String(lessonId))
  const prev = idx > 0 ? lessonItems[idx - 1] : null
  const lessonLocked = isLocked('lesson', Number(lessonId))

  // After completing a lesson we DON'T auto-advance — we ask first. This holds the
  // next curriculum item ({ kind, id, title }) to offer in the confirmation modal.
  const [nextPrompt, setNextPrompt] = useState(null)
  // Is the current lesson the very last item in the whole curriculum?
  const curOrderedIdx = ordered.findIndex(it => it.kind === 'lesson' && String(it.id) === String(lessonId))
  const isLastItem = curOrderedIdx >= 0 && curOrderedIdx === ordered.length - 1

  // Admin/o'qituvchi preview rejimi: bir xil "keyingisiga o'tasizmi?" modali
  // chiqadi, lekin hech qanday progress/sertifikat yozilmaydi — faqat navigatsiya.
  function promptNextPreview() {
    const nextItem = ordered[curOrderedIdx + 1]
    if (!nextItem) { toast("Bu kursdagi oxirgi bo'lim"); return }
    setNextPrompt({
      kind: nextItem.kind, id: nextItem.id,
      title: nextItem.kind === 'lesson' ? nextItem.lesson.title : nextItem.test.title,
      preview: true,
    })
  }

  // Redirect away from a locked lesson if accessed via URL
  useEffect(() => {
    if (!course || !lesson || canBypass) return
    if (lessonLocked) {
      toast.error("Avval oldingi darslarni va testlarni tugating")
      // Navigate to first incomplete or first lesson
      const firstIncomplete = ordered.find(it => !it.done)
      if (firstIncomplete) {
        if (firstIncomplete.kind === 'lesson') navigate(`/learn/${slug}/${firstIncomplete.id}`, { replace: true })
        else navigate(`/learn/${slug}/test/${firstIncomplete.id}`, { replace: true })
      }
    }
  }, [lessonLocked, course, lesson, navigate, slug, ordered, canBypass])

  const complete = useMutation({
    mutationFn: () => api.post(`/lessons/${lessonId}/complete/`).then(r => r.data),
    onSuccess: (data) => {
      qc.invalidateQueries(['course', slug])
      qc.invalidateQueries(['enrollments'])
      // Course is only "complete" when EVERY lesson AND test is done (server-side check).
      if (data.completed) {
        toast.success("Tabriklaymiz! Kurs to'liq yakunlandi.")
        navigate(`/learn/${slug}/complete`)
        return
      }
      // Don't auto-advance: confirm the lesson is done, then ASK before moving on.
      const curIdx = ordered.findIndex(it => it.kind === 'lesson' && String(it.id) === String(lessonId))
      const isCurrent = it => it.kind === 'lesson' && String(it.id) === String(lessonId)
      const nextItem = ordered.slice(curIdx + 1).find(it => !it.done)
        || ordered.find(it => !it.done && !isCurrent(it))
      toast.success('Dars tugatildi')
      if (nextItem) {
        setNextPrompt({
          kind: nextItem.kind,
          id: nextItem.id,
          title: nextItem.kind === 'lesson' ? nextItem.lesson.title : nextItem.test.title,
        })
      }
    },
    onError: () => toast.error('Saqlashda xatolik, qayta urinib ko\'ring'),
  })

  const totalItems = ordered.length
  const completedCount = ordered.filter(it => it.done).length
  const progress = totalItems ? Math.round(completedCount / totalItems * 100) : 0

  if (!course || !lesson) {
    return <><Navbar /><div className="loading-state"><span className="spinner" />Dars yuklanmoqda…</div></>
  }

  const embed = lesson.video_type === 'youtube' ? youtubeEmbed(lesson.youtube_url) : null

  return (
    <>
      <Navbar />
      <div style={{ height: 3, background: 'var(--border-2)', position: 'sticky', top: 64, zIndex: 40 }}>
        <div style={{ height: '100%', background: 'var(--green-600)', width: `${progress}%`, transition: '.4s' }} />
      </div>
      <style>{`
        /* ── Video stage: dark cinematic frame ── */
        .video-stage {
          aspect-ratio: 16/9; position: relative;
          background:
            radial-gradient(ellipse 70% 90% at 50% 110%, rgba(14,131,69,0.20), transparent 65%),
            linear-gradient(180deg, #070908 0%, #0a0d0b 100%);
          background-color: #0a0d0b;
        }
        .video-empty {
          height: 100%; display: flex; flex-direction: column; gap: 12px;
          align-items: center; justify-content: center; color: rgba(255,255,255,0.45);
        }
        .video-empty .ring {
          width: 84px; height: 84px; border-radius: 999px;
          border: 1.5px solid rgba(255,255,255,0.14);
          background: rgba(255,255,255,0.05);
          display: flex; align-items: center; justify-content: center;
        }

        /* Uploaded-video player */
        .upload-player { width: 100%; height: 100%; position: relative; }
        .upload-player video { width: 100%; height: 100%; object-fit: contain; display: block; }
        /* Hide the download button in Chrome/Edge native controls */
        .upload-player video::-webkit-media-controls-download-button,
        .upload-player video::-internal-media-controls-download-button { display: none !important; }
        .upload-player video::-webkit-media-controls-enclosure { overflow: hidden; }
        .upload-player video::-webkit-media-controls-panel { width: calc(100% + 32px); }

        /* Big centered play overlay (shows while paused) */
        .vp-overlay {
          position: absolute; inset: 0; z-index: 3;
          display: flex; align-items: center; justify-content: center;
          background: linear-gradient(180deg, rgba(0,0,0,0.18), rgba(0,0,0,0.42));
          border: none; cursor: pointer; padding: 0;
          animation: vpFade .25s ease-out;
        }
        @keyframes vpFade { from { opacity: 0; } to { opacity: 1; } }
        .vp-overlay .btn-ring {
          width: 84px; height: 84px; border-radius: 999px;
          background: rgba(255,255,255,0.96); color: var(--green-700);
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 0 0 10px rgba(255,255,255,0.14), 0 18px 50px -12px rgba(0,0,0,0.6);
          transition: transform .18s ease, box-shadow .18s ease;
        }
        .vp-overlay:hover .btn-ring {
          transform: scale(1.07);
          box-shadow: 0 0 0 14px rgba(255,255,255,0.18), 0 22px 60px -12px rgba(0,0,0,0.65);
        }
        .vp-overlay .hint {
          position: absolute; bottom: 22px; left: 0; right: 0; text-align: center;
          color: rgba(255,255,255,0.75); font-size: 13px; font-weight: 500;
          text-shadow: 0 1px 8px rgba(0,0,0,0.6);
        }

        /* Playback speed pills (top-left, fade in on hover) */
        .vp-speed {
          position: absolute; top: 14px; left: 16px; z-index: 4;
          display: inline-flex; gap: 4px; padding: 4px;
          background: rgba(0,0,0,0.5); border-radius: 999px;
          backdrop-filter: blur(10px);
          opacity: 0; transition: opacity .2s ease;
        }
        .upload-player:hover .vp-speed, .vp-speed.show { opacity: 1; }
        .vp-speed button {
          padding: 4px 11px; border-radius: 999px; border: none; cursor: pointer;
          background: transparent; color: rgba(255,255,255,0.7);
          font-size: 11.5px; font-weight: 600; font-family: var(--font-display);
          transition: all .12s;
        }
        .vp-speed button:hover { color: white; }
        .vp-speed button.on { background: rgba(255,255,255,0.94); color: #0a0d0b; }

        /* Soft watermark */
        .upload-watermark {
          position: absolute; top: 14px; right: 16px;
          padding: 5px 12px; border-radius: 999px;
          background: rgba(0,0,0,0.45); color: rgba(255,255,255,0.85);
          backdrop-filter: blur(8px);
          font-family: var(--font-display); font-weight: 700; font-size: 12px;
          letter-spacing: 0.06em;
          pointer-events: none; z-index: 4;
          display: inline-flex; align-items: center; gap: 6px;
        }
        .upload-watermark .dot {
          width: 6px; height: 6px; border-radius: 999px; background: #4ade80;
          box-shadow: 0 0 8px #4ade80;
        }

        /* ── "Keyingisiga o'tasizmi?" confirmation modal ── */
        .lp-modal-back {
          position: fixed; inset: 0; background: rgba(12,17,14,0.45); z-index: 100;
          display: flex; align-items: center; justify-content: center; padding: 24px;
          animation: vpFade .2s ease-out;
        }
        .lp-modal {
          background: var(--white); border-radius: 18px; padding: 28px;
          max-width: 420px; width: 100%; box-shadow: var(--shadow-pop);
          animation: vpFade .25s ease-out;
        }
        .lp-modal-icon {
          width: 56px; height: 56px; border-radius: 999px; margin: 0 auto 14px;
          background: var(--green-50); color: var(--green-600);
          display: flex; align-items: center; justify-content: center;
        }
      `}</style>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 24, padding: 24, maxWidth: 1500, margin: '0 auto', alignItems: 'start' }}>
        <div className="card fade-up" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="video-stage">
            {embed ? (
              <iframe src={embed} style={{ width: '100%', height: '100%', border: 'none', position: 'relative', zIndex: 1 }} title={lesson.title} allow="autoplay; encrypted-media" allowFullScreen />
            ) : lesson.video_file ? (
              <UploadedPlayer lesson={lesson} />
            ) : (
              <div className="video-empty">
                <div className="ring"><Icon name="video" size={32} /></div>
                <div style={{ fontSize: 14, fontWeight: 500 }}>Bu darsga video biriktirilmagan</div>
                <div style={{ fontSize: 12.5, opacity: 0.7 }}>Tavsif va materiallar pastda</div>
              </div>
            )}
          </div>

          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)' }}>
            <div className="breadcrumb" style={{ marginBottom: 8 }}>
              <Link to={`/courses/${slug}`}>{course.title}</Link>
              <span className="sep">/</span>
              <span>{lesson.sectionTitle}</span>
            </div>
            <h1 style={{ fontSize: 24, marginBottom: 8 }}>{lesson.title}</h1>
            <div style={{ display: 'flex', gap: 16, fontSize: 13, color: 'var(--text-3)' }}>
              <span><Icon name="clock" size={13} /> {lesson.duration_minutes} daqiqa</span>
            </div>
          </div>

          <LessonTabs
            lesson={lesson}
            prev={prev}
            isLast={isLastItem}
            slug={slug}
            navigate={navigate}
            onComplete={() => complete.mutate()}
            onPreviewNext={promptNextPreview}
            completePending={complete.isPending}
            previewMode={canBypass}
          />
        </div>

        <aside className="card fade-up-d2" style={{ padding: 0, position: 'sticky', top: 88, maxHeight: 'calc(100vh - 100px)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
            <h4 style={{ fontSize: 14, fontFamily: 'var(--font-display)', marginBottom: 8 }}>Kurs dasturi</h4>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12, color: 'var(--text-3)' }}>
              <div className="progress" style={{ flex: 1, height: 4 }}><div className="progress-fill" style={{ width: `${progress}%` }} /></div>
              <span>{completedCount}/{totalItems}</span>
            </div>
          </div>
          <div style={{ overflowY: 'auto', padding: '8px 0' }}>
            {(course.sections || []).map((s, si) => (
              <div key={s.id} style={{ padding: '8px 0' }}>
                <div style={{ padding: '6px 20px', fontSize: 12, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '.05em', fontWeight: 600 }}>
                  {si + 1}. {s.title}
                </div>
                {s.lessons.map(l => {
                  const isActive = String(l.id) === String(lessonId)
                  const locked = isLocked('lesson', l.id)
                  const baseStyle = {
                    display: 'flex', alignItems: 'center', gap: 12, padding: '10px 20px',
                    textDecoration: 'none', fontSize: 13,
                    background: isActive ? 'var(--green-50)' : 'transparent',
                    color: locked ? 'var(--text-4)' : isActive ? 'var(--green-700)' : 'var(--text-2)',
                    fontWeight: isActive ? 600 : 400,
                    cursor: locked ? 'not-allowed' : 'pointer',
                    opacity: locked ? 0.65 : 1,
                  }
                  const inner = (
                    <>
                      <span style={{ width: 26, height: 26, borderRadius: 6,
                        background: l.is_completed ? 'var(--green-50)' : isActive ? 'var(--green-600)' : locked ? 'var(--bg-soft)' : 'var(--bg-soft)',
                        color: l.is_completed ? 'var(--green-600)' : isActive ? 'white' : 'var(--text-3)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                      }}>
                        <Icon name={l.is_completed ? 'check' : locked ? 'lock' : 'play'} size={14} />
                      </span>
                      <span style={{ flex: 1, lineHeight: 1.3 }}>{l.title}</span>
                      <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{l.duration_minutes} daq</span>
                    </>
                  )
                  if (locked) {
                    return (
                      <div key={l.id} style={baseStyle}
                        title="Avval oldingi darslarni va testlarni tugating"
                        onClick={() => toast.error("Avval oldingi darslarni tugating")}>
                        {inner}
                      </div>
                    )
                  }
                  return <Link key={l.id} to={`/learn/${slug}/${l.id}`} style={baseStyle}>{inner}</Link>
                })}
                {(s.tests || []).map(t => {
                  const locked = isLocked('test', t.id)
                  const passed = t.is_passed
                  const baseStyle = {
                    display: 'flex', alignItems: 'center', gap: 12, padding: '10px 20px',
                    textDecoration: 'none', fontSize: 13,
                    color: locked ? 'var(--text-4)' : passed ? 'var(--green-700)' : 'var(--blue-600)',
                    cursor: locked ? 'not-allowed' : 'pointer',
                    opacity: locked ? 0.65 : 1,
                  }
                  const inner = (
                    <>
                      <span style={{ width: 26, height: 26, borderRadius: 6,
                        background: passed ? 'var(--green-50)' : 'var(--blue-50)',
                        color: passed ? 'var(--green-600)' : 'var(--blue-600)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <Icon name={passed ? 'check' : locked ? 'lock' : 'fileText'} size={14} />
                      </span>
                      <span style={{ flex: 1 }}>Test: {t.title}</span>
                      <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{t.question_count} savol</span>
                    </>
                  )
                  if (locked) {
                    return <div key={`t-${t.id}`} style={baseStyle}
                      onClick={() => toast.error("Avval oldingi darslarni tugating")}>{inner}</div>
                  }
                  return <Link key={`t-${t.id}`} to={`/learn/${slug}/test/${t.id}`} style={baseStyle}>{inner}</Link>
                })}
              </div>
            ))}
          </div>
        </aside>
      </div>

      {/* Dars tugagach: keyingi dars/testga o'tishni so'rovchi modal */}
      {nextPrompt && (
        <div className="lp-modal-back" onClick={() => setNextPrompt(null)}>
          <div className="lp-modal" onClick={e => e.stopPropagation()}>
            <div className="lp-modal-icon"><Icon name={nextPrompt.preview ? 'arrowR' : 'check'} size={28} /></div>
            <h3 style={{ fontSize: 20, marginBottom: 8, textAlign: 'center' }}>
              {nextPrompt.preview ? "Keyingisiga o'tish" : 'Dars tugatildi!'}
            </h3>
            <p className="text-sm text-muted" style={{ lineHeight: 1.65, textAlign: 'center' }}>
              {nextPrompt.kind === 'test' ? (
                <>Keyingi bosqich — <b>test</b>:<br />«{nextPrompt.title}»<br />Hozir topshirasizmi?</>
              ) : (
                <>Keyingi dars:<br />«{nextPrompt.title}»<br />Hozir o'tasizmi?</>
              )}
            </p>
            <div style={{ display: 'flex', gap: 10, marginTop: 22 }}>
              <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setNextPrompt(null)}>
                Yo'q, qolaman
              </button>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => {
                const p = nextPrompt
                setNextPrompt(null)
                navigate(p.kind === 'test' ? `/learn/${slug}/test/${p.id}` : `/learn/${slug}/${p.id}`)
              }}>
                {nextPrompt.kind === 'test' ? "Ha, testga o'tish" : 'Ha, keyingi dars'} <Icon name="arrowR" size={14} />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}


// ============================================================
// Uploaded-video player: big play overlay + speed pills + resume
// ============================================================
const SPEEDS = [1, 1.25, 1.5, 1.75, 2]

function UploadedPlayer({ lesson }) {
  const ref = useRef(null)
  const [playing, setPlaying] = useState(false)
  const [started, setStarted] = useState(false)
  const [speed, setSpeed] = useState(1)

  const posKey = `ionedu-video-pos-${lesson.id}`

  function setRate(r) {
    setSpeed(r)
    if (ref.current) ref.current.playbackRate = r
  }

  return (
    <div className="upload-player" onContextMenu={e => e.preventDefault()}>
      <span className="upload-watermark"><span className="dot" /> IONEDU</span>

      <div className={`vp-speed ${!playing && started ? 'show' : ''}`}>
        {SPEEDS.map(s => (
          <button key={s} className={speed === s ? 'on' : ''} onClick={() => setRate(s)}>
            {s}×
          </button>
        ))}
      </div>

      <video
        ref={ref}
        src={absUrl(lesson.video_file)}
        controls={started}
        controlsList="nodownload noplaybackrate noremoteplayback"
        disablePictureInPicture
        preload="metadata"
        playsInline
        onContextMenu={e => e.preventDefault()}
        onPlay={() => { setPlaying(true); setStarted(true) }}
        onPause={() => setPlaying(false)}
        onLoadedMetadata={e => {
          // Resume from the last watched position (if meaningful)
          const saved = parseFloat(localStorage.getItem(posKey) || '0')
          if (saved > 10 && saved < e.target.duration - 20) {
            e.target.currentTime = saved
            toast(`Davom etyapsiz: ${Math.floor(saved / 60)}:${String(Math.floor(saved % 60)).padStart(2, '0')}`, { icon: '▶️' })
          }
        }}
        onTimeUpdate={e => {
          const t = e.target.currentTime
          if (t > 5) localStorage.setItem(posKey, String(Math.floor(t)))
        }}
        onEnded={() => { localStorage.removeItem(posKey); setPlaying(false) }}
      />

      {!started && (
        <button className="vp-overlay" onClick={() => ref.current?.play()} aria-label="Videoni boshlash">
          <span className="btn-ring"><Icon name="play" size={34} fill /></span>
          <span className="hint">{lesson.title} · {lesson.duration_minutes} daqiqa</span>
        </button>
      )}
    </div>
  )
}


// ============================================================
// Tabs: Tavsif / Muhokama / Resurslar
// ============================================================
function LessonTabs({ lesson, prev, isLast, slug, navigate, onComplete, onPreviewNext, completePending, previewMode }) {
  const [tab, setTab] = useState('desc')
  return (
    <>
      <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid var(--border)', padding: '0 28px' }}>
        {[['desc', 'Tavsif'], ['disc', 'Muhokama'], ['res', 'Resurslar']].map(([k, n]) => (
          <button key={k} onClick={() => setTab(k)}
            style={{
              padding: '14px 18px', fontSize: 14, fontWeight: 500,
              color: tab === k ? 'var(--green-600)' : 'var(--text-3)',
              borderBottom: tab === k ? '2px solid var(--green-600)' : '2px solid transparent',
              marginBottom: -1,
            }}>{n}</button>
        ))}
      </div>

      <div style={{ padding: 28 }}>
        {tab === 'desc' && (
          <div style={{ color: 'var(--text-2)', fontSize: 15, lineHeight: 1.7 }}>
            {!lesson.description ? (
              <p>Tavsif kiritilmagan.</p>
            ) : isHtmlContent(lesson.description) ? (
              <div className="rte-content" dangerouslySetInnerHTML={{ __html: sanitizeHtml(lesson.description) }} />
            ) : (
              <p style={{ whiteSpace: 'pre-line' }}>{lesson.description}</p>
            )}
          </div>
        )}
        {tab === 'disc' && <DiscussionTab lessonId={lesson.id} />}
        {tab === 'res' && <ResourcesTab lessonId={lesson.id} />}

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 28, paddingTop: 20, borderTop: '1px solid var(--border-2)' }}>
          <button className="btn btn-secondary" disabled={!prev} onClick={() => prev && navigate(`/learn/${slug}/${prev.id}`)}>
            <Icon name="arrowL" size={14} /> Oldingi
          </button>
          {previewMode ? (
            <button className="btn btn-primary" disabled={isLast} onClick={onPreviewNext}>
              {isLast ? "Oxirgi bo'lim" : 'Keyingi'} <Icon name="arrowR" size={14} />
            </button>
          ) : (
            <button className="btn btn-primary" onClick={onComplete} disabled={completePending}>
              {completePending ? 'Saqlanmoqda…' : isLast ? 'Kursni tugatish' : 'Darsni tugatdim'} <Icon name="check" size={14} />
            </button>
          )}
        </div>
      </div>
    </>
  )
}

function DiscussionTab({ lessonId }) {
  const qc = useQueryClient()
  const { user } = useAuth()
  const [text, setText] = useState('')

  const { data: comments = [] } = useQuery({
    queryKey: ['lesson-comments', lessonId],
    queryFn: () => api.get(`/lessons/${lessonId}/comments/`).then(r => r.data.results || r.data),
  })

  const post = useMutation({
    mutationFn: () => api.post(`/lessons/${lessonId}/comments/`, { text }),
    onSuccess: () => { setText(''); qc.invalidateQueries(['lesson-comments', lessonId]) },
    onError: () => toast.error("Yuborib bo'lmadi"),
  })

  const del = useMutation({
    mutationFn: (id) => api.delete(`/comments/${id}/`),
    onSuccess: () => qc.invalidateQueries(['lesson-comments', lessonId]),
  })

  return (
    <div>
      <div className="card" style={{ background: 'var(--bg-soft)', marginBottom: 16 }}>
        <textarea className="textarea" rows={3} value={text} onChange={e => setText(e.target.value)}
          placeholder="Savolingiz yoki fikringizni yozing…" />
        <button className="btn btn-primary btn-sm mt-3" disabled={!text.trim() || post.isPending} onClick={() => post.mutate()}>
          {post.isPending ? 'Yuborilmoqda…' : 'Izoh qoldirish'}
        </button>
      </div>
      {comments.length === 0 ? (
        <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-3)' }}>Hozircha izohlar yo'q</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {comments.map(c => (
            <div key={c.id} className="card">
              <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 8 }}>
                <div className="avatar avatar-blue">{c.user?.initials}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{c.user?.display_name}</div>
                  <div className="text-xs text-muted">{new Date(c.created_at).toLocaleString('uz-UZ')}</div>
                </div>
                {(user?.id === c.user?.id || user?.role === 'admin') && (
                  <button className="icon-btn" title="O'chirish" onClick={() => { if (confirm("Izohni o'chirish?")) del.mutate(c.id) }}>
                    <Icon name="trash" size={14} />
                  </button>
                )}
              </div>
              <p className="text-sm" style={{ color: 'var(--text-2)' }}>{c.text}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function ResourcesTab({ lessonId }) {
  const { data: items = [] } = useQuery({
    queryKey: ['lesson-materials', lessonId],
    queryFn: () => api.get(`/lessons/${lessonId}/materials/`).then(r => r.data.results || r.data),
  })

  if (items.length === 0) {
    return (
      <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-3)' }}>
        Ushbu darsga biriktirilgan resurslar yo'q
      </div>
    )
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {items.map(m => (
        <a key={m.id} href={absUrl(m.file)} target="_blank" rel="noreferrer"
          className="card card-hover" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 14, textDecoration: 'none' }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--green-50)', color: 'var(--green-600)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="fileText" size={18} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, fontSize: 14 }}>{m.title}</div>
            <div className="text-xs text-muted">{m.file.split('/').pop()}</div>
          </div>
          <Icon name="download" size={16} style={{ color: 'var(--green-600)' }} />
        </a>
      ))}
    </div>
  )
}
