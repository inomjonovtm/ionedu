import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import api from '../../api/client'
import Navbar from '../../components/Navbar'
import Icon from '../../components/Icon'

/**
 * Test taking — works in two modes:
 *   /learn/:slug/test/:testId  (course test)
 *   /tests/:testId/take        (standalone test)
 *
 * Flow: intro screen (rules, no timer) → active attempt → result.
 *
 * Robustness guarantees:
 *   - Refresh-proof: the server resumes the active attempt; the timer is
 *     computed from the server-side started_at, never reset by reload.
 *   - Answers and flags survive refresh via localStorage (per attempt).
 *   - STRICT MODE: switching to another tab/window auto-submits the test.
 *   - Closing the tab shows a browser warning; an abandoned timed attempt
 *     is auto-graded on the next visit.
 *   - Navigating away inside the app auto-submits the current answers.
 */

const QT_LABEL = {
  single: { icon: 'checkC', text: 'Bitta javobni tanlang' },
  multiple: { icon: 'list', text: 'Bir nechta javob belgilash mumkin' },
  true_false: { icon: 'shield', text: "To'g'ri yoki noto'g'rini tanlang" },
  text: { icon: 'edit', text: 'Javobni yozib kiriting' },
}

const styles = `
  .tp-wrap { max-width: 760px; margin: 0 auto; padding: 0 24px 90px; }
  .tp-option {
    display: flex; align-items: center; gap: 16px; padding: 16px 20px;
    border: 1.5px solid var(--border); border-radius: 12px; background: var(--white);
    cursor: pointer; transition: all .12s; user-select: none;
  }
  .tp-option:hover { border-color: var(--green-300); }
  .tp-option.on { border-color: var(--green-600); background: var(--green-50); color: var(--green-800); }
  .tp-marker {
    width: 28px; height: 28px; border-radius: 999px; flex-shrink: 0;
    border: 1.5px solid var(--border); background: var(--white); color: var(--text-3);
    display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 13;
    transition: all .12s;
  }
  .tp-option.on .tp-marker { background: var(--green-600); border-color: var(--green-600); color: white; }
  .tp-marker.sq { border-radius: 8px; }
  .tp-tf { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .tp-tf .tp-option { justify-content: center; padding: 22px; font-weight: 600; font-size: 16px; }
  .tp-nav-btn {
    width: 36px; height: 36px; border-radius: 10px; position: relative;
    font-family: var(--font-display); font-weight: 700; font-size: 13px;
    border: 1.5px solid var(--border); background: var(--white); color: var(--text-3);
    cursor: pointer; transition: all .12s;
  }
  .tp-nav-btn.answered { border-color: var(--green-200); background: var(--green-50); color: var(--green-700); }
  .tp-nav-btn.current { border-color: var(--green-600); background: var(--green-600); color: white; }
  .tp-nav-btn .flag-dot {
    position: absolute; top: -4px; right: -4px; width: 10px; height: 10px;
    border-radius: 999px; background: var(--amber-600); border: 2px solid white;
  }
  .tp-rule { display: flex; gap: 12px; align-items: flex-start; padding: 10px 0; }
  .tp-rule .ic {
    width: 34px; height: 34px; border-radius: 10px; flex-shrink: 0;
    background: var(--bg-soft); color: var(--text-2);
    display: flex; align-items: center; justify-content: center;
  }
  .tp-modal-back {
    position: fixed; inset: 0; background: rgba(12,17,14,0.45); z-index: 100;
    display: flex; align-items: center; justify-content: center; padding: 24px;
  }
  .tp-modal { background: var(--white); border-radius: 18px; padding: 28px; max-width: 480px; width: 100%; box-shadow: var(--shadow-pop); }
  @keyframes pulse { 50% { opacity: 0.65; } }
  @media (max-width: 560px) { .tp-tf { grid-template-columns: 1fr; } }
`

function fmtTime(s) {
  const m = Math.floor(s / 60), sec = s % 60
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
}

export default function TestPage() {
  const { slug, testId } = useParams()
  const navigate = useNavigate()
  const qc = useQueryClient()

  const activeFlagKey = `ionedu-test-active-${testId}`
  const [stage, setStage] = useState(() => localStorage.getItem(activeFlagKey) ? 'starting' : 'intro')
  const [attempt, setAttempt] = useState(null)
  const [test, setTest] = useState(null)
  const [i, setI] = useState(0)
  const [answers, setAnswers] = useState({})
  const [flags, setFlags] = useState(() => new Set())
  const [busy, setBusy] = useState(false)
  const [timeLeft, setTimeLeft] = useState(null)
  const [confirmFinish, setConfirmFinish] = useState(false)

  // Refs mirror state for unload/unmount/event handlers
  const answersRef = useRef({})
  const attemptRef = useRef(null)
  const testRef = useRef(null)
  const submittedRef = useRef(false)
  const busyRef = useRef(false)
  answersRef.current = answers
  attemptRef.current = attempt
  testRef.current = test
  busyRef.current = busy

  const storageKey = (attemptId) => `ionedu-attempt-${attemptId}`
  const resultPath = (attemptId) => slug
    ? `/learn/${slug}/test/${testId}/result/${attemptId}`
    : `/tests/${testId}/result/${attemptId}`

  // Intro data — public test detail, the attempt (and timer) is NOT started yet.
  const { data: preview } = useQuery({
    queryKey: ['test-detail', testId],
    queryFn: () => api.get(`/tests/${testId}/detail/`).then(r => r.data),
    enabled: stage === 'intro',
  })

  function buildPayload(ans, t) {
    const byId = {}
    for (const q of t?.questions || []) byId[q.id] = q
    return Object.entries(ans).map(([qid, val]) => {
      const q = byId[Number(qid)]
      if (!q) return null
      if (q.question_type === 'multiple') return { question_id: Number(qid), option_ids: val || [] }
      if (q.question_type === 'text') return { question_id: Number(qid), text: val || '' }
      return { question_id: Number(qid), option_id: val }
    }).filter(Boolean)
  }

  async function start() {
    try {
      const { data } = await api.post(`/tests/${testId}/start/`)
      setAttempt(data)
      setTest(data.test)
      localStorage.setItem(activeFlagKey, '1')
      try {
        const saved = JSON.parse(localStorage.getItem(storageKey(data.id)) || '{}')
        if (saved.answers && typeof saved.answers === 'object') setAnswers(saved.answers)
        if (Array.isArray(saved.flags)) setFlags(new Set(saved.flags))
      } catch { /* corrupted state — start clean */ }
      if (data.resumed) toast("Test davom ettirilmoqda — vaqt to'xtamagan edi", { icon: '⏳' })
      setStage('active')
    } catch {
      toast.error("Testni boshlab bo'lmadi")
      navigate(slug ? `/courses/${slug}` : '/tests', { replace: true })
    }
  }

  // Refresh mid-test → resume instantly, skip the intro.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- start() is async; state updates land after the network call
    if (stage === 'starting') start()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Server-anchored countdown — survives refresh
  useEffect(() => {
    if (!attempt || !test?.time_limit_minutes) return
    const deadline = new Date(attempt.started_at).getTime() + test.time_limit_minutes * 60 * 1000
    const tick = () => setTimeLeft(Math.max(0, Math.floor((deadline - Date.now()) / 1000)))
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [attempt, test])

  // Time over → auto submit
  useEffect(() => {
    if (timeLeft === 0 && !submittedRef.current) {
      toast('Vaqt tugadi — javoblaringiz yuborildi', { icon: '⏰' })
      submit('timeout')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft])

  // Persist answers + flags per attempt
  useEffect(() => {
    if (!attempt) return
    localStorage.setItem(storageKey(attempt.id), JSON.stringify({ answers, flags: [...flags] }))
  }, [answers, flags, attempt])

  // ── STRICT MODE: leaving the page (tab switch, minimize, another window)
  //    immediately submits the test with whatever is answered.
  useEffect(() => {
    if (stage !== 'active') return
    function violation() {
      if (submittedRef.current || busyRef.current) return
      toast.error('Sahifadan chiqib ketdingiz — test avtomatik yakunlandi', { duration: 5000 })
      submit('focus_lost')
    }
    function onVisibility() { if (document.hidden) violation() }
    window.addEventListener('blur', violation)
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      window.removeEventListener('blur', violation)
      document.removeEventListener('visibilitychange', onVisibility)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage])

  // Block copy & right-click while the test is running
  useEffect(() => {
    if (stage !== 'active') return
    const block = e => e.preventDefault()
    document.addEventListener('contextmenu', block)
    document.addEventListener('copy', block)
    return () => {
      document.removeEventListener('contextmenu', block)
      document.removeEventListener('copy', block)
    }
  }, [stage])

  // Warn before tab close / hard refresh while the test is active
  useEffect(() => {
    function onBeforeUnload(e) {
      if (submittedRef.current || !attemptRef.current) return
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [])

  // SPA navigation away (unmount) → auto-submit answered questions
  useEffect(() => {
    return () => {
      const a = attemptRef.current
      if (submittedRef.current || !a) return
      submittedRef.current = true
      const payload = {
        answers: buildPayload(answersRef.current, testRef.current),
        reason: 'left',
      }
      // keepalive — completes even though the component is gone
      fetch(`${api.defaults.baseURL}/attempts/${a.id}/submit/`, {
        method: 'POST',
        keepalive: true,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('access')}`,
        },
        body: JSON.stringify(payload),
      }).catch(() => {})
      localStorage.removeItem(storageKey(a.id))
      localStorage.removeItem(activeFlagKey)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function submit(reason = 'manual') {
    if (!attemptRef.current || busyRef.current || submittedRef.current) return
    setBusy(true)
    busyRef.current = true
    try {
      const payload = { answers: buildPayload(answersRef.current, testRef.current), reason }
      const { data } = await api.post(`/attempts/${attemptRef.current.id}/submit/`, payload)
      submittedRef.current = true
      localStorage.removeItem(storageKey(attemptRef.current.id))
      localStorage.removeItem(activeFlagKey)
      if (slug) {
        qc.invalidateQueries(['course', slug])
        qc.invalidateQueries(['enrollments'])
        if (data.course_completed) toast.success("Tabriklaymiz! Kurs to'liq yakunlandi.")
      }
      navigate(resultPath(data.id), { replace: true })
    } catch {
      toast.error("Yuborishda xatolik, qayta urinib ko'ring")
    } finally { setBusy(false); busyRef.current = false }
  }

  // Keyboard navigation (skip while typing a written answer)
  useEffect(() => {
    if (stage !== 'active') return
    function onKey(e) {
      if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return
      if (e.key === 'ArrowLeft') setI(v => Math.max(0, v - 1))
      if (e.key === 'ArrowRight') setI(v => Math.min((testRef.current?.questions.length || 1) - 1, v + 1))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [stage])

  /* ─────────── INTRO ─────────── */
  if (stage === 'intro') {
    const t = preview
    return (
      <>
        <Navbar />
        <style>{styles}</style>
        {!t ? (
          <div className="loading-state"><span className="spinner" />Test yuklanmoqda…</div>
        ) : (
          <div className="tp-wrap fade-up" style={{ paddingTop: 48 }}>
            <div className="card" style={{ padding: '40px 40px 32px', borderRadius: 20 }}>
              <div className="badge badge-blue" style={{ marginBottom: 14 }}><Icon name="fileText" size={13} /> TEST</div>
              <h1 style={{ fontSize: 30, lineHeight: 1.25, marginBottom: 10 }}>{t.title}</h1>
              {t.description && <p className="text-muted" style={{ lineHeight: 1.6, marginBottom: 8 }}>{t.description}</p>}

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, margin: '26px 0' }}>
                <div style={{ padding: '16px 12px', background: 'var(--bg-soft)', borderRadius: 12, textAlign: 'center' }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700 }}>{t.question_count}</div>
                  <div className="text-xs text-muted mt-1">Savol</div>
                </div>
                <div style={{ padding: '16px 12px', background: 'var(--bg-soft)', borderRadius: 12, textAlign: 'center' }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700 }}>
                    {t.time_limit_minutes ? `${t.time_limit_minutes}` : '∞'}
                  </div>
                  <div className="text-xs text-muted mt-1">{t.time_limit_minutes ? 'Daqiqa' : 'Vaqt cheksiz'}</div>
                </div>
                <div style={{ padding: '16px 12px', background: 'var(--bg-soft)', borderRadius: 12, textAlign: 'center' }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700, color: 'var(--green-600)' }}>{t.pass_percent}%</div>
                  <div className="text-xs text-muted mt-1">O'tish bali</div>
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--border-2)', paddingTop: 16 }}>
                <div className="text-xs text-muted" style={{ textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600, marginBottom: 6 }}>Qoidalar</div>
                <div className="tp-rule">
                  <span className="ic"><Icon name="clock" size={16} /></span>
                  <div className="text-sm" style={{ lineHeight: 1.55 }}>
                    {t.time_limit_minutes
                      ? `Vaqt boshlagan zahoti hisoblanadi — ${t.time_limit_minutes} daqiqadan keyin test avtomatik yakunlanadi. Sahifani yangilasangiz vaqt to'xtamaydi.`
                      : "Bu test uchun vaqt chegarasi yo'q — bemalol ishlang."}
                  </div>
                </div>
                <div className="tp-rule">
                  <span className="ic"><Icon name="bookmark" size={16} /></span>
                  <div className="text-sm" style={{ lineHeight: 1.55 }}>
                    Qiyin savolni belgilab qo'yib, keyinroq qaytishingiz mumkin. Javoblar avtomatik saqlanadi.
                  </div>
                </div>
                <div className="tp-rule" style={{ alignItems: 'center' }}>
                  <span className="ic" style={{ background: 'var(--red-50)', color: 'var(--red-600)' }}><Icon name="alert" size={16} /></span>
                  <div className="text-sm" style={{ lineHeight: 1.55 }}>
                    <strong style={{ color: 'var(--red-600)' }}>Diqqat:</strong> boshqa oyna, varaq yoki dasturga o'tsangiz —
                    test <strong>shu zahoti avtomatik yakunlanadi</strong> va joriy javoblaringiz asosida baholanadi.
                  </div>
                </div>
              </div>

              <button className="btn btn-primary btn-lg btn-block" style={{ marginTop: 22 }}
                disabled={t.question_count === 0} onClick={start}>
                Testni boshlash <Icon name="arrowR" size={16} />
              </button>
              {t.question_count === 0 && (
                <div className="text-sm text-muted mt-3" style={{ textAlign: 'center' }}>Bu testda hali savollar yo'q</div>
              )}
            </div>
          </div>
        )}
      </>
    )
  }

  /* ─────────── ACTIVE ─────────── */
  if (!test) return <><Navbar /><div className="loading-state"><span className="spinner" />Test yuklanmoqda…</div></>

  const q = test.questions[i]
  if (!q) return <><Navbar /><div style={{ padding: 80, textAlign: 'center', color: 'var(--text-3)' }}>Bu testda hali savollar yo'q</div></>
  const total = test.questions.length
  const isAnswered = (qq) => {
    const v = answers[qq.id]
    if (v === undefined || v === null) return false
    if (Array.isArray(v)) return v.length > 0
    if (typeof v === 'string') return v.trim() !== ''
    return true
  }
  const answered = test.questions.filter(isAnswered).length
  const unansweredIdx = test.questions.map((qq, k) => isAnswered(qq) ? null : k).filter(v => v !== null)
  const urgent = timeLeft !== null && timeLeft < 60
  const qt = QT_LABEL[q.question_type] || QT_LABEL.single

  const setAnswer = (val) => setAnswers({ ...answers, [q.id]: val })
  const toggleMulti = (optId) => {
    const cur = Array.isArray(answers[q.id]) ? answers[q.id] : []
    setAnswer(cur.includes(optId) ? cur.filter(x => x !== optId) : [...cur, optId])
  }
  const toggleFlag = () => {
    const next = new Set(flags)
    if (next.has(q.id)) next.delete(q.id); else next.add(q.id)
    setFlags(next)
  }

  return (
    <>
      <Navbar />
      <style>{styles}</style>
      <div style={{ background: 'var(--white)', borderBottom: '1px solid var(--border)', position: 'sticky', top: 64, zIndex: 40 }}>
        <div style={{ maxWidth: 760, margin: '0 auto', padding: '14px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontFamily: 'var(--font-display)', fontSize: 15, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{test.title}</div>
            <div className="text-xs text-muted">{answered}/{total} javob berildi · o'tish bali {test.pass_percent}%</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            <span className="badge badge-red" style={{ fontSize: 11 }} title="Boshqa oynaga o'tish testni yakunlaydi">
              <Icon name="shield" size={12} /> Qattiq rejim
            </span>
            {timeLeft !== null && (
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 8, padding: '7px 16px',
                background: urgent ? 'var(--red-50)' : 'var(--green-50)',
                color: urgent ? 'var(--red-600)' : 'var(--green-700)',
                borderRadius: 999, fontSize: 14, fontWeight: 700, fontFamily: 'var(--font-display)',
                animation: urgent ? 'pulse 1s ease-in-out infinite' : 'none',
              }}>
                <Icon name="clock" size={15} />
                {fmtTime(timeLeft)}
              </div>
            )}
          </div>
        </div>
        <div style={{ height: 3, background: 'var(--border-2)' }}>
          <div style={{ height: '100%', background: 'var(--green-600)', width: `${answered / total * 100}%`, transition: '.4s' }} />
        </div>
      </div>

      <div className="tp-wrap fade-up" style={{ marginTop: 32 }}>
        {/* Question navigator */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 20 }}>
          {test.questions.map((qq, k) => (
            <button key={qq.id} onClick={() => setI(k)} aria-label={`Savol ${k + 1}`}
              className={`tp-nav-btn ${k === i ? 'current' : isAnswered(qq) ? 'answered' : ''}`}>
              {k + 1}
              {flags.has(qq.id) && <span className="flag-dot" />}
            </button>
          ))}
        </div>

        <div className="card" style={{ padding: 36, marginBottom: 24, borderRadius: 16, userSelect: 'none' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <div className="text-xs text-muted" style={{ textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>
              Savol {i + 1} / {total}
            </div>
            <button className={`btn btn-sm ${flags.has(q.id) ? 'btn-primary' : 'btn-secondary'}`} onClick={toggleFlag}
              style={flags.has(q.id) ? { background: 'var(--amber-600)', borderColor: 'var(--amber-600)' } : {}}>
              <Icon name="bookmark" size={13} fill={flags.has(q.id)} /> {flags.has(q.id) ? 'Belgilangan' : 'Belgilash'}
            </button>
          </div>
          <div className="text-xs" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--blue-600)', background: 'var(--blue-50)', padding: '4px 10px', borderRadius: 999, marginBottom: 16 }}>
            <Icon name={qt.icon} size={12} /> {qt.text}
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, lineHeight: 1.4, marginBottom: 28 }}>
            {q.text}
          </div>

          {q.question_type === 'text' ? (
            <input className="input" style={{ height: 52, fontSize: 16, userSelect: 'text' }}
              value={answers[q.id] || ''}
              onChange={e => setAnswer(e.target.value)}
              placeholder="Javobingizni yozing…" autoComplete="off" spellCheck={false} />
          ) : q.question_type === 'true_false' ? (
            <div className="tp-tf">
              {q.options.map(o => (
                <div key={o.id} className={`tp-option ${answers[q.id] === o.id ? 'on' : ''}`} onClick={() => setAnswer(o.id)}>
                  <Icon name={answers[q.id] === o.id ? 'checkC' : 'playC'} size={18} />
                  {o.text}
                </div>
              ))}
            </div>
          ) : q.question_type === 'multiple' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {q.options.map((o, k) => {
                const on = Array.isArray(answers[q.id]) && answers[q.id].includes(o.id)
                return (
                  <div key={o.id} className={`tp-option ${on ? 'on' : ''}`} onClick={() => toggleMulti(o.id)}>
                    <span className="tp-marker sq">{on ? <Icon name="check" size={15} /> : String.fromCharCode(65 + k)}</span>
                    <span style={{ lineHeight: 1.45 }}>{o.text}</span>
                  </div>
                )
              })}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {q.options.map((o, k) => {
                const on = answers[q.id] === o.id
                return (
                  <div key={o.id} className={`tp-option ${on ? 'on' : ''}`} onClick={() => setAnswer(o.id)}>
                    <span className="tp-marker">{String.fromCharCode(65 + k)}</span>
                    <span style={{ lineHeight: 1.45 }}>{o.text}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
          <button className="btn btn-secondary" disabled={i === 0} onClick={() => setI(i - 1)}>
            <Icon name="arrowL" size={14} /> Oldingi
          </button>
          {i === total - 1 ? (
            <button className="btn btn-primary btn-lg" onClick={() => setConfirmFinish(true)} disabled={busy}>
              {busy ? 'Yuborilmoqda…' : 'Testni yakunlash'} <Icon name="check" size={15} />
            </button>
          ) : (
            <button className="btn btn-primary" onClick={() => setI(i + 1)}>
              Keyingi <Icon name="arrowR" size={14} />
            </button>
          )}
        </div>

        <div className="text-xs text-muted mt-4" style={{ textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
          <Icon name="alert" size={13} style={{ color: 'var(--red-600)' }} />
          Boshqa oyna yoki varaqqa o'tsangiz test avtomatik yakunlanadi.
        </div>
      </div>

      {/* Finish confirmation — custom modal (native confirm would trigger the blur guard) */}
      {confirmFinish && (
        <div className="tp-modal-back" onClick={() => setConfirmFinish(false)}>
          <div className="tp-modal" onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: 20, marginBottom: 6 }}>Testni yakunlaysizmi?</h3>
            <p className="text-sm text-muted" style={{ lineHeight: 1.6 }}>
              {answered}/{total} savolga javob berdingiz.
              {unansweredIdx.length > 0 && " Javobsiz savollar noto'g'ri deb hisoblanadi."}
            </p>
            {unansweredIdx.length > 0 && (
              <div style={{ margin: '14px 0' }}>
                <div className="text-xs text-muted mb-2" style={{ fontWeight: 600 }}>Javobsiz savollar:</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {unansweredIdx.map(k => (
                    <button key={k} className="tp-nav-btn" onClick={() => { setI(k); setConfirmFinish(false) }}>
                      {k + 1}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
              <button className="btn btn-secondary" onClick={() => setConfirmFinish(false)}>Davom etish</button>
              <button className="btn btn-primary" disabled={busy} onClick={() => submit('manual')}>
                {busy ? 'Yuborilmoqda…' : 'Ha, yakunlash'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
