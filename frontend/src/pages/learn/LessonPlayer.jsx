import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import api, { absUrl } from '../../api/client'
import Navbar from '../../components/Navbar'
import Icon from '../../components/Icon'
import Confirm from '../../components/Confirm'
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

  // Flat list of ALL items in the exact order the teacher arranged them
  // (lessons and tests share one sequence inside each section).
  const ordered = useMemo(() => {
    if (!course) return []
    const out = []
    for (const s of course.sections || []) {
      const lessonsById = Object.fromEntries((s.lessons || []).map(l => [l.id, l]))
      const items = s.items || [
        ...(s.lessons || []).map(l => ({ kind: 'lesson', ...l })),
        ...(s.tests || []).map(t => ({ kind: 'test', ...t })),
      ]
      for (const it of items) {
        if (it.kind === 'lesson') {
          const l = lessonsById[it.id] || it
          out.push({ kind: 'lesson', id: l.id, lesson: l, sectionId: s.id, sectionTitle: s.title, done: !!l.is_completed })
        } else {
          // A test without questions cannot be taken, so it never blocks the path.
          out.push({ kind: 'test', id: it.id, test: it, sectionId: s.id, sectionTitle: s.title, done: !!it.is_passed || !it.question_count })
        }
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
      qc.invalidateQueries({ queryKey: ['course', slug] })
      qc.invalidateQueries({ queryKey: ['enrollments'] })
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

  const sectionIndex = (course.sections || []).findIndex(sec => sec.title === lesson.sectionTitle)
  const nextUp = ordered[curOrderedIdx + 1]

  const embed = lesson.video_type === 'youtube' ? youtubeEmbed(lesson.youtube_url) : null

  return (
    <>
      <Navbar />
      <style>{css}</style>

      <div className="lp">
        <div className="lp-main fade-up">
          {/* ── Video stage ── */}
          <div className="lp-stage">
            {embed ? (
              <iframe src={embed} title={lesson.title} allow="autoplay; encrypted-media" allowFullScreen />
            ) : lesson.video_file ? (
              <UploadedPlayer lesson={lesson} />
            ) : (
              <div className="lp-novideo">
                <span className="ic"><Icon name="book" size={30} /></span>
                <b>Bu dars matn shaklida</b>
                <span>Dars matni va materiallar pastda</span>
              </div>
            )}
          </div>

          {/* ── Title block ── */}
          <div className="lp-head">
            <div className="lp-crumbs">
              <Link to={`/courses/${slug}`}><Icon name="arrowL" size={13} /> {course.title}</Link>
              <span className="coord">{String(sectionIndex + 1).padStart(2, '0')} · {lesson.sectionTitle}</span>
            </div>
            <h1>{lesson.title}</h1>
            <div className="lp-meta">
              <span className="chip"><Icon name="clock" size={13} /> {lesson.duration_minutes} daqiqa</span>
              <span className="chip">{curOrderedIdx + 1}-qadam / {totalItems}</span>
              {lesson.is_completed && <span className="chip" style={{ background: 'var(--green-100)', color: 'var(--green-800)', borderColor: 'var(--green-600)' }}><Icon name="check" size={13} /> Tugatilgan</span>}
              {canBypass && <span className="chip chip-sun"><Icon name="eye" size={13} /> Ko'rib chiqish rejimi</span>}
            </div>
          </div>

          <LessonTabs lesson={lesson} />

          {/* ── Next step bar ── */}
          <div className="lp-next">
            <button className="btn btn-secondary" disabled={!prev} onClick={() => prev && navigate(`/learn/${slug}/${prev.id}`)}>
              <Icon name="arrowL" size={15} /> Oldingi dars
            </button>
            <div className="nx">
              {nextUp ? (
                <>
                  <span className="lb">Keyingi bekat</span>
                  <b>{nextUp.kind === 'test' ? 'Test: ' : ''}{nextUp.kind === 'lesson' ? nextUp.lesson.title : nextUp.test.title}</b>
                </>
              ) : <><span className="lb">Marra</span><b>Bu kursning oxirgi qadami</b></>}
            </div>
            {canBypass ? (
              <button className="btn btn-primary" disabled={isLastItem} onClick={promptNextPreview}>
                {isLastItem ? "Oxirgi qadam" : 'Keyingisi'} <Icon name="arrowR" size={15} />
              </button>
            ) : (
              <button className="btn btn-primary" onClick={() => complete.mutate()} disabled={complete.isPending}>
                {complete.isPending ? 'Saqlanmoqda…' : isLastItem ? 'Kursni tugatish' : lesson.is_completed ? 'Davom etish' : 'Darsni tugatdim'}
                <Icon name={lesson.is_completed ? 'arrowR' : 'check'} size={15} />
              </button>
            )}
          </div>
        </div>

        {/* ── Route sidebar ── */}
        <aside className="lp-side fade-up-d2">
          <div className="lp-side-head">
            <div className="t">
              <h4>Kurs yo'li</h4>
              <span>{completedCount}/{totalItems}</span>
            </div>
            <div className="lp-route"><i style={{ width: `${progress}%` }} /><b style={{ left: `${progress}%` }}>{progress}%</b></div>
          </div>
          <div className="lp-side-body">
            {(course.sections || []).map((sec, si) => (
              <div key={sec.id} className="lp-sec">
                <div className="lp-sec-t"><span>{String(si + 1).padStart(2, '0')}</span>{sec.title}</div>
                {ordered.filter(it => it.sectionId === sec.id).map(it => {
                  const isTest = it.kind === 'test'
                  const active = !isTest && String(it.id) === String(lessonId)
                  const locked = isLocked(it.kind, it.id)
                  const title = isTest ? it.test.title : it.lesson.title
                  const cls = `lp-it ${active ? 'on' : ''} ${it.done ? 'done' : ''} ${locked ? 'locked' : ''} ${isTest ? 'test' : ''}`
                  const inner = (
                    <>
                      <span className="st"><Icon name={it.done ? 'check' : locked ? 'lock' : isTest ? 'fileText' : 'play'} size={13} /></span>
                      <span className="tx">
                        {isTest && <em>Test</em>}
                        {title}
                      </span>
                      <span className="du">{isTest ? `${it.test.question_count} savol` : `${it.lesson.duration_minutes} daq`}</span>
                    </>
                  )
                  return locked ? (
                    <div key={`${it.kind}-${it.id}`} className={cls} title="Avval oldingi dars va testlarni tugating"
                      onClick={() => toast.error('Avval oldingi dars va testlarni tugating')}>{inner}</div>
                  ) : (
                    <Link key={`${it.kind}-${it.id}`} className={cls}
                      to={isTest ? `/learn/${slug}/test/${it.id}` : `/learn/${slug}/${it.id}`}>{inner}</Link>
                  )
                })}
              </div>
            ))}
          </div>
        </aside>
      </div>

      {/* After finishing a lesson: ask before moving on */}
      {nextPrompt && (
        <div className="modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) setNextPrompt(null) }}>
          <div className="modal" style={{ maxWidth: 440, textAlign: 'center' }}>
            <div className="lp-done-ic">{nextPrompt.preview ? '🧭' : '🎉'}</div>
            <h3 style={{ fontSize: 24, margin: '14px 0 8px' }}>{nextPrompt.preview ? "Keyingisiga o'tish" : 'Dars tugatildi!'}</h3>
            <p className="text-sm text-muted" style={{ lineHeight: 1.6 }}>
              {nextPrompt.kind === 'test' ? 'Keyingi bekat — test:' : 'Keyingi bekat — dars:'}
            </p>
            <div className="lp-nextcard">
              <span className={`st ${nextPrompt.kind}`}><Icon name={nextPrompt.kind === 'test' ? 'fileText' : 'play'} size={15} /></span>
              <b>{nextPrompt.title}</b>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 22 }}>
              <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setNextPrompt(null)}>Shu yerda qolaman</button>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => {
                const p = nextPrompt
                setNextPrompt(null)
                navigate(p.kind === 'test' ? `/learn/${slug}/test/${p.id}` : `/learn/${slug}/${p.id}`)
              }}>
                {nextPrompt.kind === 'test' ? "Testga o'tish" : 'Keyingi dars'} <Icon name="arrowR" size={15} />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

const css = `
  .lp { display: grid; grid-template-columns: minmax(0, 1fr) 372px; gap: 22px; padding: 22px 24px 60px; max-width: 1480px; margin: 0 auto; align-items: start; }
  .lp-main { min-width: 0; }

  .lp-stage { aspect-ratio: 16/9; position: relative; background: #0B1220; border: 2px solid var(--line); border-radius: 26px; box-shadow: var(--hard); overflow: hidden; }
  .lp-stage iframe { width: 100%; height: 100%; border: 0; display: block; }
  .lp-novideo { height: 100%; display: flex; flex-direction: column; gap: 8px; align-items: center; justify-content: center; color: #B7C0D8; background-image: var(--topo); background-size: 520px 360px; text-align: center; padding: 20px; }
  .lp-novideo .ic { width: 76px; height: 76px; border-radius: 24px; background: var(--sun); color: #14213D; border: 2px solid #14213D; display: flex; align-items: center; justify-content: center; transform: rotate(-6deg); margin-bottom: 8px; }
  .lp-novideo b { color: #fff; font-family: var(--font-display); font-size: 20px; letter-spacing: -.02em; }
  .lp-novideo span { font-size: 13.5px; }

  .lp-player { width: 100%; height: 100%; position: relative; }
  .lp-player video { width: 100%; height: 100%; object-fit: contain; display: block; }
  .lp-player video::-webkit-media-controls-download-button,
  .lp-player video::-internal-media-controls-download-button { display: none !important; }
  .lp-play { position: absolute; inset: 0; z-index: 3; display: flex; flex-direction: column; gap: 18px; align-items: center; justify-content: center; background: rgba(11, 18, 32, .55); }
  .lp-play .pb { width: 92px; height: 92px; border-radius: 28px; background: var(--sun); color: #14213D; border: 2px solid #14213D; box-shadow: 6px 6px 0 #14213D; display: flex; align-items: center; justify-content: center; transition: transform .15s ease, box-shadow .15s ease; }
  .lp-play:hover .pb { transform: translate(-3px, -3px) rotate(-4deg); box-shadow: 9px 9px 0 #14213D; }
  .lp-play .hint { color: #fff; font-size: 14px; font-weight: 700; max-width: 80%; text-align: center; }
  .lp-speed { position: absolute; top: 14px; left: 14px; z-index: 4; display: inline-flex; gap: 3px; padding: 4px; background: #14213D; border: 1.5px solid rgba(255,255,255,.25); border-radius: 12px; opacity: 0; transition: opacity .2s ease; }
  .lp-player:hover .lp-speed, .lp-speed.show { opacity: 1; }
  .lp-speed button { padding: 4px 9px; border-radius: 8px; color: #B7C0D8; font-family: var(--font-mono); font-size: 11.5px; font-weight: 700; }
  .lp-speed button:hover { color: #fff; }
  .lp-speed button.on { background: var(--sun); color: #14213D; }
  .lp-mark { position: absolute; top: 14px; right: 14px; z-index: 4; padding: 5px 10px; border-radius: 10px; background: #14213D; color: #fff; border: 1.5px solid rgba(255,255,255,.25); font-family: var(--font-display); font-weight: 800; font-size: 12px; letter-spacing: -.02em; pointer-events: none; }

  .lp-head { padding: 24px 4px 4px; }
  .lp-crumbs { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; margin-bottom: 12px; }
  .lp-crumbs a { display: inline-flex; align-items: center; gap: 6px; font-size: 13.5px; font-weight: 700; color: var(--text-2); }
  .lp-crumbs a:hover { color: var(--text); text-decoration: underline; text-underline-offset: 3px; }
  .lp-crumbs .coord { text-transform: uppercase; }
  .lp-head h1 { font-size: 38px; line-height: 1.05; }
  .lp-meta { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 14px; }
  .lp-meta .chip { height: 30px; font-size: 12.5px; padding: 0 11px; }

  .lp-card { background: var(--white); border: 1.5px solid var(--border); border-radius: 22px; margin-top: 20px; overflow: hidden; }
  .lp-tabs { display: flex; gap: 4px; padding: 10px; border-bottom: 1.5px dashed var(--border); overflow-x: auto; }
  .lp-tabs button { display: inline-flex; align-items: center; gap: 7px; height: 38px; padding: 0 14px; border-radius: 12px; font-size: 14px; font-weight: 700; color: var(--text-3); white-space: nowrap; }
  .lp-tabs button:hover { background: var(--bg-soft); color: var(--text); }
  .lp-tabs button.on { background: var(--ink); color: #fff; }
  html[data-theme="dark"] .lp-tabs button.on { background: var(--sun); color: #14213D; }
  .lp-tabs .n { font-family: var(--font-mono); font-size: 10.5px; padding: 0 6px; border-radius: 99px; background: var(--sun); color: #14213D; }
  .lp-pane { padding: 22px 24px 24px; }
  .lp-text { color: var(--text-2); font-size: 15.5px; line-height: 1.75; }
  .lp-none { display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 28px 16px; text-align: center; color: var(--text-3); font-size: 14px; }
  .lp-none .ic { width: 46px; height: 46px; border-radius: 15px; background: var(--sun-soft); color: var(--text); border: 1.5px solid var(--line); display: flex; align-items: center; justify-content: center; transform: rotate(-5deg); margin-bottom: 6px; }

  .lp-write { display: flex; gap: 12px; align-items: flex-start; margin-bottom: 20px; }
  .lp-write .avatar { width: 40px; height: 40px; border-radius: 13px; }
  .lp-write .box { flex: 1; min-width: 0; }
  .lp-write .row { display: flex; justify-content: space-between; align-items: center; gap: 10px; margin-top: 8px; }
  .lp-cm { display: flex; gap: 12px; padding: 14px 0; border-top: 1.5px dashed var(--border-2); }
  .lp-cm .avatar { width: 38px; height: 38px; border-radius: 12px; }
  .lp-cm .bd { flex: 1; min-width: 0; }
  .lp-cm .nm { font-weight: 750; font-size: 14px; }
  .lp-cm .tm { font-family: var(--font-mono); font-size: 10.5px; color: var(--text-3); margin-left: 8px; }
  .lp-cm p { font-size: 14.5px; color: var(--text-2); line-height: 1.6; margin-top: 4px; white-space: pre-wrap; word-break: break-word; }

  .lp-files { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
  .lp-file { display: flex; align-items: center; gap: 12px; padding: 12px; border-radius: 16px; border: 1.5px solid var(--border); background: var(--white); transition: border-color .14s ease, box-shadow .14s ease, transform .14s ease; }
  .lp-file:hover { border-color: var(--line); box-shadow: var(--hard-sm); transform: translate(-2px, -2px); }
  .lp-file .fi { width: 42px; height: 42px; border-radius: 13px; background: var(--sea-soft); color: var(--blue-600); display: flex; align-items: center; justify-content: center; flex-shrink: 0; transform: rotate(-4deg); }
  .lp-file .fn { font-weight: 700; font-size: 14px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .lp-file .fs { font-family: var(--font-mono); font-size: 10.5px; color: var(--text-3); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

  .lp-next { display: flex; align-items: center; gap: 16px; margin-top: 20px; padding: 14px 16px; background: var(--white); border: 2px solid var(--line); border-radius: 22px; box-shadow: var(--hard-sm); }
  .lp-next .nx { flex: 1; min-width: 0; text-align: center; }
  .lp-next .lb { display: block; font-family: var(--font-mono); font-size: 10px; letter-spacing: .1em; text-transform: uppercase; color: var(--text-3); }
  .lp-next .nx b { display: block; font-size: 14.5px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

  .lp-side { position: sticky; top: 92px; max-height: calc(100vh - 108px); display: flex; flex-direction: column; background: var(--white); border: 1.5px solid var(--border); border-radius: 24px; overflow: hidden; }
  .lp-side-head { padding: 18px 18px 22px; border-bottom: 1.5px dashed var(--border); flex-shrink: 0; }
  .lp-side-head .t { display: flex; align-items: baseline; justify-content: space-between; margin-bottom: 14px; }
  .lp-side-head h4 { font-size: 19px; }
  .lp-side-head .t span { font-family: var(--font-mono); font-size: 12px; font-weight: 700; color: var(--text-3); }
  .lp-route { position: relative; height: 10px; border-radius: 99px; background: var(--bg-soft); border: 1.5px solid var(--line); }
  .lp-route i { display: block; height: 100%; border-radius: 99px; background: var(--green-600); transition: width .5s ease; }
  .lp-route b { position: absolute; top: 14px; transform: translateX(-50%); font-family: var(--font-mono); font-size: 10px; font-weight: 700; color: var(--text-2); white-space: nowrap; }
  .lp-side-body { overflow-y: auto; padding: 10px 10px 14px; }
  .lp-sec { margin-bottom: 8px; }
  .lp-sec-t { display: flex; align-items: center; gap: 8px; padding: 10px 8px 6px; font-family: var(--font-display); font-weight: 750; font-size: 14px; letter-spacing: -.01em; }
  .lp-sec-t span { font-family: var(--font-mono); font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 7px; background: var(--bg-soft); color: var(--text-3); }
  .lp-it { display: flex; align-items: center; gap: 10px; padding: 9px 10px; border-radius: 14px; border: 1.5px solid transparent; font-size: 13.5px; font-weight: 600; color: var(--text); cursor: pointer; transition: background .12s ease, border-color .12s ease; }
  .lp-it:hover { background: var(--bg-soft); }
  .lp-it.on { background: var(--sun-soft); border-color: var(--line); font-weight: 750; }
  .lp-it.locked { color: var(--text-4); cursor: not-allowed; }
  .lp-it .st { width: 28px; height: 28px; border-radius: 10px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; background: var(--sea-soft); color: var(--blue-600); }
  .lp-it.test .st { background: var(--violet-soft); color: var(--violet); }
  .lp-it.done .st { background: var(--green-600); color: #fff; }
  .lp-it.locked .st { background: var(--bg-soft); color: var(--text-4); }
  .lp-it .tx { flex: 1; min-width: 0; line-height: 1.3; }
  .lp-it .tx em { display: block; font-style: normal; font-family: var(--font-mono); font-size: 9.5px; letter-spacing: .08em; text-transform: uppercase; color: var(--violet); }
  .lp-it .du { font-family: var(--font-mono); font-size: 10.5px; color: var(--text-3); flex-shrink: 0; }

  .lp-done-ic { font-size: 52px; line-height: 1; }
  .lp-nextcard { display: flex; align-items: center; gap: 12px; text-align: left; margin-top: 12px; padding: 12px 14px; border: 1.5px solid var(--line); border-radius: 16px; background: var(--sun-soft); }
  .lp-nextcard .st { width: 34px; height: 34px; border-radius: 11px; background: var(--white); border: 1.5px solid var(--line); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .lp-nextcard b { font-size: 14.5px; line-height: 1.3; }

  @media (max-width: 1100px) {
    .lp { grid-template-columns: 1fr; padding: 14px 14px 48px; }
    .lp-side { position: static; max-height: 460px; }
    .lp-head h1 { font-size: 28px; }
  }
  @media (max-width: 640px) {
    .lp-stage { border-radius: 18px; } .lp-files { grid-template-columns: 1fr; } .lp-pane { padding: 16px; }
    .lp-next { flex-wrap: wrap; } .lp-next .nx { order: -1; flex-basis: 100%; text-align: left; } .lp-next .btn { flex: 1; }
  }
`


// ============================================================
// Uploaded-video player: play sticker + speed pills + resume
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
    <div className="lp-player" onContextMenu={e => e.preventDefault()}>
      <span className="lp-mark">ionedu</span>

      <div className={`lp-speed ${!playing && started ? 'show' : ''}`}>
        {SPEEDS.map(s => (
          <button key={s} className={speed === s ? 'on' : ''} onClick={() => setRate(s)}>{s}×</button>
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
        <button className="lp-play" onClick={() => ref.current?.play()} aria-label="Videoni boshlash">
          <span className="pb"><Icon name="play" size={36} fill /></span>
          <span className="hint">{lesson.title} · {lesson.duration_minutes} daqiqa</span>
        </button>
      )}
    </div>
  )
}


// ============================================================
// Tabs: Dars matni / Muhokama / Materiallar
// ============================================================
function LessonTabs({ lesson }) {
  const [tab, setTab] = useState('desc')

  const { data: comments = [] } = useQuery({
    queryKey: ['lesson-comments', lesson.id],
    queryFn: () => api.get(`/lessons/${lesson.id}/comments/`).then(r => r.data.results || r.data),
  })
  const { data: materials = [] } = useQuery({
    queryKey: ['lesson-materials', lesson.id],
    queryFn: () => api.get(`/lessons/${lesson.id}/materials/`).then(r => r.data.results || r.data),
  })

  const TABS = [
    ['desc', 'Dars matni', 'book', 0],
    ['disc', 'Muhokama', 'comment', comments.length],
    ['res', 'Materiallar', 'folder', materials.length],
  ]

  return (
    <div className="lp-card">
      <div className="lp-tabs" role="tablist">
        {TABS.map(([k, label, icon, n]) => (
          <button key={k} role="tab" aria-selected={tab === k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>
            <Icon name={icon} size={15} /> {label} {n > 0 && <span className="n">{n}</span>}
          </button>
        ))}
      </div>

      <div className="lp-pane">
        {tab === 'desc' && (
          !lesson.description ? (
            <div className="lp-none"><span className="ic"><Icon name="book" size={20} /></span>Bu dars uchun matn yozilmagan.</div>
          ) : isHtmlContent(lesson.description) ? (
            <div className="rte-content lp-text" dangerouslySetInnerHTML={{ __html: sanitizeHtml(lesson.description) }} />
          ) : (
            <p className="lp-text" style={{ whiteSpace: 'pre-line' }}>{lesson.description}</p>
          )
        )}
        {tab === 'disc' && <DiscussionTab lessonId={lesson.id} comments={comments} />}
        {tab === 'res' && <ResourcesTab items={materials} />}
      </div>
    </div>
  )
}

function DiscussionTab({ lessonId, comments }) {
  const qc = useQueryClient()
  const { user } = useAuth()
  const [text, setText] = useState('')
  const [toDelete, setToDelete] = useState(null)

  const post = useMutation({
    mutationFn: () => api.post(`/lessons/${lessonId}/comments/`, { text: text.trim() }),
    onSuccess: () => { setText(''); qc.invalidateQueries({ queryKey: ['lesson-comments', lessonId] }) },
    onError: () => toast.error("Izohni yuborib bo'lmadi"),
  })

  const del = useMutation({
    mutationFn: (id) => api.delete(`/comments/${id}/`),
    onSuccess: () => { setToDelete(null); qc.invalidateQueries({ queryKey: ['lesson-comments', lessonId] }) },
    onError: () => toast.error("O'chirib bo'lmadi"),
  })

  return (
    <div>
      <div className="lp-write">
        <span className="avatar">{user?.avatar ? <img src={absUrl(user.avatar)} alt="" /> : user?.initials}</span>
        <div className="box">
          <textarea className="textarea" rows={2} value={text} onChange={e => setText(e.target.value)} maxLength={2000}
            placeholder="Savolingiz yoki fikringizni yozing…"
            onKeyDown={e => { if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && text.trim()) post.mutate() }} />
          <div className="row">
            <span className="text-xs text-muted">Ctrl+Enter — yuborish</span>
            <button className="btn btn-primary btn-sm" disabled={!text.trim() || post.isPending} onClick={() => post.mutate()}>
              {post.isPending ? 'Yuborilmoqda…' : <>Yuborish <Icon name="arrowR" size={13} /></>}
            </button>
          </div>
        </div>
      </div>

      {comments.length === 0 ? (
        <div className="lp-none"><span className="ic"><Icon name="comment" size={20} /></span>Hozircha izoh yo'q — birinchi bo'lib savol bering.</div>
      ) : comments.map(c => (
        <div key={c.id} className="lp-cm">
          <span className="avatar avatar-blue">{c.user?.avatar ? <img src={absUrl(c.user.avatar)} alt="" /> : c.user?.initials}</span>
          <div className="bd">
            <span className="nm">{c.user?.display_name}</span>
            {c.user?.role === 'teacher' && <span className="badge badge-amber" style={{ marginLeft: 8 }}>O'qituvchi</span>}
            <span className="tm">{new Date(c.created_at).toLocaleString('uz-UZ', { dateStyle: 'short', timeStyle: 'short' })}</span>
            <p>{c.text}</p>
          </div>
          {(user?.id === c.user?.id || user?.role === 'admin') && (
            <button className="icon-btn danger" title="O'chirish" onClick={() => setToDelete(c)}><Icon name="trash" size={14} /></button>
          )}
        </div>
      ))}

      {toDelete && (
        <Confirm danger title="Izohni o'chirish" text="Bu izoh butunlay o'chiriladi." confirmLabel="O'chirish"
          busy={del.isPending} onConfirm={() => del.mutate(toDelete.id)} onClose={() => setToDelete(null)} />
      )}
    </div>
  )
}

function ResourcesTab({ items }) {
  if (items.length === 0) {
    return <div className="lp-none"><span className="ic"><Icon name="folder" size={20} /></span>Bu darsga material biriktirilmagan.</div>
  }
  return (
    <div className="lp-files">
      {items.map(m => (
        <a key={m.id} href={absUrl(m.file)} target="_blank" rel="noreferrer" className="lp-file">
          <span className="fi"><Icon name="fileText" size={19} /></span>
          <span style={{ flex: 1, minWidth: 0 }}>
            <span className="fn" style={{ display: 'block' }}>{m.title}</span>
            <span className="fs" style={{ display: 'block' }}>{m.file.split('/').pop()}</span>
          </span>
          <Icon name="download" size={16} />
        </a>
      ))}
    </div>
  )
}
