import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import api, { absUrl } from '../../api/client'
import { useAuth } from '../../store/auth'
import Navbar from '../../components/Navbar'
import Icon from '../../components/Icon'

/**
 * Test result + answer review.
 *   /learn/:slug/test/:testId/result/:attemptId   (course test)
 *   /tests/:testId/result/:attemptId              (standalone test)
 * Teachers open the same page from test statistics to review a student's attempt.
 */

const css = `
  .tr { max-width: 1040px; margin: 0 auto; padding: 36px 20px 70px; }
  .tr-hero { display: grid; grid-template-columns: auto minmax(0, 1fr); gap: 30px; align-items: center; background: var(--white); border: 2px solid var(--line); border-radius: 30px; box-shadow: var(--hard-lg); padding: 30px 34px; position: relative; overflow: hidden; }
  .tr-hero::after { content: ''; position: absolute; inset: 0; background-image: var(--topo); background-size: 520px 360px; pointer-events: none; }
  .tr-hero > * { position: relative; z-index: 1; }
  .tr-ring { position: relative; width: 180px; height: 180px; flex-shrink: 0; }
  .tr-ring svg { transform: rotate(-90deg); display: block; }
  .tr-ring .c { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; }
  .tr-ring .p { font-family: var(--font-display); font-size: 46px; font-weight: 800; letter-spacing: -.05em; line-height: 1; }
  .tr-ring .l { font-family: var(--font-mono); font-size: 10.5px; letter-spacing: .1em; text-transform: uppercase; color: var(--text-3); margin-top: 4px; }
  .tr-stamp { display: inline-flex; align-items: center; gap: 8px; padding: 6px 14px; border-radius: 12px; border: 2px solid var(--line); font-family: var(--font-display); font-weight: 800; font-size: 15px; transform: rotate(-3deg); color: #14213D; }
  .tr-hero h1 { font-size: 40px; margin: 14px 0 6px; }
  .tr-sub { color: var(--text-3); font-size: 15px; line-height: 1.55; }
  .tr-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-top: 20px; }
  .tr-stat { background: var(--bg-soft); border-radius: 16px; padding: 12px 14px; }
  .tr-stat b { display: block; font-family: var(--font-display); font-size: 24px; font-weight: 800; letter-spacing: -.04em; line-height: 1; }
  .tr-stat span { font-size: 12px; color: var(--text-3); font-weight: 650; }
  .tr-acts { display: flex; gap: 10px; flex-wrap: wrap; margin-top: 22px; }
  .tr-note { margin-top: 16px; padding: 12px 16px; border-radius: 16px; font-size: 13.5px; line-height: 1.55; display: flex; gap: 10px; align-items: flex-start; }
  .tr-note.amber { background: var(--amber-50); color: var(--text-2); }
  .tr-note.blue { background: var(--blue-50); color: var(--text-2); }

  .tr-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; margin: 36px 0 14px; }
  .tr-head h2 { font-size: 26px; }
  .tr-q { background: var(--white); border: 1.5px solid var(--border); border-radius: 22px; padding: 18px 20px; margin-bottom: 12px; border-left-width: 6px; }
  .tr-q.ok { border-left-color: var(--green-600); }
  .tr-q.no { border-left-color: var(--coral); }
  .tr-q.skip { border-left-color: var(--text-4); }
  .tr-q-top { display: flex; align-items: flex-start; gap: 12px; }
  .tr-n { width: 32px; height: 32px; border-radius: 11px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; font-family: var(--font-mono); font-size: 12.5px; font-weight: 700; }
  .tr-q.ok .tr-n { background: var(--green-100); color: var(--green-800); }
  .tr-q.no .tr-n { background: var(--coral-soft); color: var(--red-600); }
  .tr-q.skip .tr-n { background: var(--bg-soft); color: var(--text-3); }
  .tr-qt { flex: 1; min-width: 0; font-weight: 700; font-size: 15.5px; line-height: 1.45; white-space: pre-wrap; word-break: break-word; }
  .tr-img { max-width: 300px; border-radius: 14px; border: 1.5px solid var(--border); margin: 12px 0 0 44px; }
  .tr-opts { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin: 14px 0 0 44px; }
  .tr-opt { display: flex; align-items: center; gap: 9px; padding: 9px 12px; border-radius: 13px; border: 1.5px solid var(--border-2); font-size: 14px; color: var(--text-2); min-width: 0; }
  .tr-opt .ic { width: 22px; height: 22px; border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; background: var(--bg-soft); color: var(--text-4); }
  .tr-opt.right { background: var(--green-50); border-color: var(--green-300); color: var(--green-800); font-weight: 700; }
  .tr-opt.right .ic { background: var(--green-600); color: #fff; }
  .tr-opt.wrong { background: var(--red-50); border-color: var(--coral); color: var(--red-600); font-weight: 700; }
  .tr-opt.wrong .ic { background: var(--coral); color: #fff; }
  .tr-opt.picked { border-color: var(--line); font-weight: 700; color: var(--text); }
  .tr-opt .tag { margin-left: auto; font-family: var(--font-mono); font-size: 9.5px; letter-spacing: .06em; text-transform: uppercase; flex-shrink: 0; opacity: .8; }
  .tr-ans { margin: 14px 0 0 44px; display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
  .tr-ans div { border-radius: 13px; padding: 10px 12px; font-size: 14px; }
  .tr-ans .lb { display: block; font-family: var(--font-mono); font-size: 9.5px; letter-spacing: .08em; text-transform: uppercase; opacity: .7; margin-bottom: 3px; }
  .tr-expl { margin: 12px 0 0 44px; padding: 10px 14px; border-left: 4px solid var(--sun); background: var(--bg-soft); border-radius: 0 13px 13px 0; font-size: 13.5px; line-height: 1.55; color: var(--text-2); }

  @media (max-width: 760px) {
    .tr-hero { grid-template-columns: 1fr; padding: 22px 18px; gap: 18px; justify-items: start; }
    .tr-hero h1 { font-size: 30px; } .tr-ring { width: 150px; height: 150px; } .tr-ring .p { font-size: 38px; }
    .tr-stats { grid-template-columns: 1fr 1fr; }
    .tr-opts, .tr-ans { grid-template-columns: 1fr; margin-left: 0; } .tr-img, .tr-expl { margin-left: 0; }
  }
`

const REASON = {
  timeout: ['clock', 'Vaqt tugagani uchun test avtomatik yakunlandi.'],
  focus_lost: ['shield', "Nazorat rejimi: test oynasidan chiqishlar chegarasiga yetilgani uchun test yakunlandi."],
  left: ['alert', 'Test sahifasi tark etilgani uchun mavjud javoblar asosida baholandi.'],
}

function fmtDur(s) {
  if (s == null) return '—'
  if (s < 60) return `${s} son`
  const m = Math.floor(s / 60)
  return `${m} daq${s % 60 ? ` ${s % 60} son` : ''}`
}

function Ring({ percent, passed }) {
  const r = 78, c = 2 * Math.PI * r
  return (
    <div className="tr-ring">
      <svg width="100%" height="100%" viewBox="0 0 180 180">
        <circle cx="90" cy="90" r={r} fill="none" stroke="var(--bg-soft)" strokeWidth="16" />
        <circle cx="90" cy="90" r={r} fill="none" stroke={passed ? 'var(--green-600)' : 'var(--coral)'} strokeWidth="16"
          strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - Math.min(percent, 100) / 100)}
          style={{ transition: 'stroke-dashoffset .9s cubic-bezier(.2,.7,.2,1)' }} />
      </svg>
      <div className="c"><span className="p">{Math.round(percent)}%</span><span className="l">natija</span></div>
    </div>
  )
}

export default function TestResult() {
  const { slug, testId, attemptId } = useParams()
  const me = useAuth(s => s.user)
  const [filter, setFilter] = useState('all')

  const { data: r, isLoading, isError } = useQuery({
    queryKey: ['attempt', attemptId],
    queryFn: () => api.get(`/attempts/${attemptId}/result/`).then(x => x.data),
    retry: false,
  })

  // Fresh curriculum state (course mode only) — decides where "continue" leads.
  const { data: course } = useQuery({
    queryKey: ['course', slug],
    queryFn: () => api.get(`/courses/${slug}/`).then(x => x.data),
    enabled: !!slug,
  })

  if (isLoading) return <><Navbar /><div className="loading-state"><span className="spinner" />Natija yuklanmoqda…</div></>
  if (isError || !r) {
    return (
      <>
        <Navbar />
        <div className="empty-state" style={{ paddingTop: 100 }}>
          <span className="es-ico"><Icon name="alert" size={22} /></span>
          <div className="es-title">Natija topilmadi</div>
          <div className="es-sub">Bu urinish sizga tegishli emas yoki hali yakunlanmagan.</div>
          <Link to={slug ? `/courses/${slug}` : '/tests'} className="btn btn-secondary btn-sm">Orqaga</Link>
        </div>
      </>
    )
  }

  const foreign = r.student && me && r.student.id !== me.id   // a teacher reviewing a student
  const total = r.correct_count + r.wrong_count
  const skipped = r.answers.filter(a => !a.answered).length
  const reveal = r.test.show_answers || foreign

  // Flat curriculum in the teacher's order → the next unfinished item.
  const ordered = []
  for (const s of course?.sections || []) {
    const items = s.items || [
      ...(s.lessons || []).map(l => ({ kind: 'lesson', ...l })),
      ...(s.tests || []).map(t => ({ kind: 'test', ...t })),
    ]
    for (const it of items) {
      ordered.push({ kind: it.kind, id: it.id, done: it.kind === 'lesson' ? !!it.is_completed : (!!it.is_passed || !it.question_count) })
    }
  }
  const nextItem = ordered.find(it => !it.done)
  const courseCompleted = !!slug && ordered.length > 0 && !nextItem
  const continueTo = courseCompleted ? `/learn/${slug}/complete`
    : nextItem ? (nextItem.kind === 'lesson' ? `/learn/${slug}/${nextItem.id}` : `/learn/${slug}/test/${nextItem.id}`)
      : `/courses/${slug}`
  const retakePath = slug ? `/learn/${slug}/test/${testId}` : `/tests/${testId}/take`
  const reason = REASON[r.finish_reason]

  const shown = r.answers.filter(a => filter === 'all' || (filter === 'wrong' ? !a.is_correct : a.is_correct))

  return (
    <>
      <Navbar />
      <style>{css}</style>
      <div className="tr fade-up">
        <div className="tr-hero">
          <Ring percent={r.score_percent} passed={r.passed} />
          <div style={{ minWidth: 0 }}>
            <span className="tr-stamp" style={{ background: r.passed ? '#8FE0B4' : '#FF9D88' }}>
              <Icon name={r.passed ? 'checkC' : 'x'} size={17} /> {r.passed ? "O'TDINGIZ" : "O'TA OLMADINGIZ"}
            </span>
            <h1>{foreign ? r.student.display_name : r.passed ? 'Barakalla!' : 'Yana bir urinib ko\'ring'}</h1>
            <p className="tr-sub">
              <strong style={{ color: 'var(--text)' }}>{r.test.title}</strong> — o'tish bali {r.test.pass_percent}%.
              {!foreign && !r.passed && ' Xatolaringizni ko\'rib chiqing va qayta topshiring.'}
            </p>
            <div className="tr-stats">
              <div className="tr-stat"><b style={{ color: 'var(--green-600)' }}>{r.correct_count}</b><span>to'g'ri</span></div>
              <div className="tr-stat"><b style={{ color: 'var(--red-600)' }}>{r.wrong_count - skipped}</b><span>noto'g'ri</span></div>
              <div className="tr-stat"><b>{skipped}</b><span>javobsiz</span></div>
              <div className="tr-stat"><b style={{ fontSize: 19, lineHeight: '24px' }}>{fmtDur(r.duration_seconds)}</b><span>sarflangan vaqt</span></div>
            </div>
            {r.max_points !== total && (
              <div className="text-sm text-muted" style={{ marginTop: 10, fontWeight: 600 }}>
                To'plangan ball: <strong style={{ color: 'var(--text)' }}>{r.earned_points} / {r.max_points}</strong>
              </div>
            )}
            {!foreign && (
              <div className="tr-acts">
                {slug && r.passed && (
                  <Link to={continueTo} className="btn btn-primary">
                    {courseCompleted ? 'Kursni yakunlash' : 'Davom etish'} <Icon name="arrowR" size={16} />
                  </Link>
                )}
                {r.can_retake && (
                  <Link to={retakePath} className={`btn ${r.passed ? 'btn-secondary' : 'btn-primary'}`}>
                    <Icon name="rotate" size={15} /> Qayta topshirish
                    {r.test.max_attempts ? ` (${r.attempts_used}/${r.test.max_attempts})` : ''}
                  </Link>
                )}
                <Link to={slug ? `/courses/${slug}` : '/tests'} className="btn btn-ghost">{slug ? 'Kursga qaytish' : 'Barcha testlar'}</Link>
              </div>
            )}
            {!foreign && !r.can_retake && !r.passed && (
              <div className="tr-note amber"><Icon name="alert" size={16} /> Bu test uchun urinishlar tugadi ({r.attempts_used}/{r.test.max_attempts}).</div>
            )}
          </div>
        </div>

        {reason && <div className="tr-note amber"><Icon name={reason[0]} size={16} /><span>{reason[1]}</span></div>}
        {r.focus_losses > 0 && r.finish_reason !== 'focus_lost' && (
          <div className="tr-note amber"><Icon name="shield" size={16} /><span>Test davomida oynadan {r.focus_losses} marta chiqilgan.</span></div>
        )}
        {!reveal && (
          <div className="tr-note blue"><Icon name="lock" size={16} /><span>O'qituvchi bu test uchun to'g'ri javoblarni ko'rsatishni o'chirib qo'ygan. Qaysi savollarga to'g'ri javob berganingizni ko'rishingiz mumkin.</span></div>
        )}

        <div className="tr-head">
          <h2>Javoblar tahlili</h2>
          <div className="seg-tabs">
            {[['all', 'Hammasi', r.answers.length], ['wrong', 'Xatolar', r.wrong_count], ['right', "To'g'ri", r.correct_count]].map(([id, label, n]) => (
              <button key={id} className={filter === id ? 'on' : ''} onClick={() => setFilter(id)}>{label}<span className="n">{n}</span></button>
            ))}
          </div>
        </div>

        {shown.length === 0 && (
          <div className="card empty-state empty-sm">
            <span className="es-ico"><Icon name={filter === 'wrong' ? 'trophy' : 'fileText'} size={18} /></span>
            <div className="es-title">{filter === 'wrong' ? "Xato yo'q — a'lo natija!" : "Bu bo'limda savol yo'q"}</div>
          </div>
        )}

        {shown.map(a => {
          const n = r.answers.indexOf(a) + 1
          const cls = a.is_correct ? 'ok' : a.answered ? 'no' : 'skip'
          return (
            <div key={a.question_id} className={`tr-q ${cls}`}>
              <div className="tr-q-top">
                <span className="tr-n">{n}</span>
                <div className="tr-qt">{a.question_text}</div>
                <span className={`badge badge-${a.is_correct ? 'green' : a.answered ? 'red' : 'gray'}`}>
                  {a.is_correct ? `+${a.points_earned} ball` : a.answered ? "Noto'g'ri" : 'Javobsiz'}
                </span>
              </div>
              {a.image && <img className="tr-img" src={absUrl(a.image)} alt="" />}

              {a.options.length > 0 ? (
                <div className="tr-opts">
                  {a.options.map(o => {
                    const right = o.is_correct === true
                    const wrong = o.selected && o.is_correct === false
                    const blind = o.is_correct === null   // answers hidden by the teacher
                    const state = right ? 'right' : wrong ? 'wrong' : blind && o.selected ? (a.is_correct ? 'right' : 'wrong') : ''
                    return (
                      <div key={o.id} className={`tr-opt ${state}`}>
                        <span className="ic"><Icon name={state === 'right' ? 'check' : state === 'wrong' ? 'x' : 'chevR'} size={13} /></span>
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{o.text}</span>
                        {o.selected && <span className="tag">{foreign ? 'tanlangan' : 'siz'}</span>}
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="tr-ans">
                  <div style={{ background: a.is_correct ? 'var(--green-50)' : 'var(--red-50)', color: a.is_correct ? 'var(--green-800)' : 'var(--red-600)' }}>
                    <span className="lb">{foreign ? "O'quvchi javobi" : 'Sizning javobingiz'}</span>
                    <strong>{a.selected_text || '— javob berilmagan'}</strong>
                  </div>
                  {reveal && !a.is_correct && a.correct_text && (
                    <div style={{ background: 'var(--green-50)', color: 'var(--green-800)' }}>
                      <span className="lb">To'g'ri javob</span><strong>{a.correct_text}</strong>
                    </div>
                  )}
                </div>
              )}
              {a.explanation && <div className="tr-expl"><strong>Izoh:</strong> {a.explanation}</div>}
            </div>
          )
        })}
      </div>
    </>
  )
}
