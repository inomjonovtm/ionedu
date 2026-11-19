import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import api, { apiError } from '../../api/client'
import Navbar from '../../components/Navbar'
import Icon from '../../components/Icon'
import Logo from '../../components/Logo'

/**
 * Test taking — two entry points:
 *   /learn/:slug/test/:testId  (course test)
 *   /tests/:testId/take        (standalone test)
 *
 * Reliability rules:
 *   - The server owns the clock. The countdown is driven by the
 *     `remaining_seconds` the API returns (re-synced on every autosave), so a
 *     wrong device clock can never end or extend a test.
 *   - Answers are autosaved to the server (and mirrored in localStorage), so
 *     a refresh, a crash or a dropped connection resumes exactly where the
 *     student left off. Closing the page never throws answers away.
 *   - Tab switching only matters when the teacher enabled "nazorat rejimi":
 *     each switch is a counted warning and only the N-th one ends the test.
 */

const css = `
  .tk { min-height: 100vh; background: var(--paper); display: flex; flex-direction: column; }
  .tk-top { position: sticky; top: 0; z-index: 40; background: var(--white); border-bottom: 2px solid var(--line); }
  .tk-top-in { max-width: 1240px; margin: 0 auto; padding: 10px 20px; display: flex; align-items: center; gap: 16px; }
  .tk-title { min-width: 0; flex: 1; }
  .tk-title b { display: block; font-family: var(--font-display); font-size: 16.5px; font-weight: 750; letter-spacing: -.02em; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .tk-title span { font-size: 12px; color: var(--text-3); font-weight: 600; }
  .tk-save { font-family: var(--font-mono); font-size: 10.5px; letter-spacing: .06em; color: var(--text-3); display: inline-flex; align-items: center; gap: 5px; white-space: nowrap; }
  .tk-save.err { color: var(--red-600); }
  .tk-timer { display: inline-flex; align-items: center; gap: 8px; height: 42px; padding: 0 14px; border-radius: 13px; border: 2px solid var(--line); background: var(--sun); color: #14213D; font-family: var(--font-mono); font-size: 17px; font-weight: 700; flex-shrink: 0; }
  .tk-timer.urgent { background: var(--coral); color: #fff; animation: tkPulse 1s ease-in-out infinite; }
  @keyframes tkPulse { 50% { transform: scale(1.05); } }
  .tk-bar { height: 6px; background: var(--bg-soft); }
  .tk-bar i { display: block; height: 100%; background: var(--green-600); transition: width .3s ease; }

  .tk-body { flex: 1; width: 100%; max-width: 1240px; margin: 0 auto; padding: 24px 20px 40px; display: grid; grid-template-columns: minmax(0, 1fr) 300px; gap: 22px; align-items: start; }
  .tk-q { background: var(--white); border: 2px solid var(--line); border-radius: 26px; box-shadow: var(--hard); padding: 28px; user-select: none; }
  .tk-q-head { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; margin-bottom: 16px; }
  .tk-q-n { font-family: var(--font-mono); font-size: 11.5px; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; color: var(--text-3); }
  .tk-q-head .sp { flex: 1; }
  .tk-flag { display: inline-flex; align-items: center; gap: 6px; height: 34px; padding: 0 12px; border-radius: 11px; border: 1.5px solid var(--border); font-size: 13px; font-weight: 700; color: var(--text-2); background: var(--white); }
  .tk-flag:hover { border-color: var(--line); }
  .tk-flag.on { background: var(--sun); border-color: var(--line); color: #14213D; }
  .tk-q-text { font-family: var(--font-display); font-size: 24px; font-weight: 700; letter-spacing: -.025em; line-height: 1.3; margin-bottom: 22px; white-space: pre-wrap; word-break: break-word; }
  .tk-q-img { max-width: 100%; max-height: 340px; border-radius: 16px; border: 1.5px solid var(--border); margin-bottom: 20px; }
  .tk-opts { display: flex; flex-direction: column; gap: 10px; }
  .tk-opts.tf { display: grid; grid-template-columns: 1fr 1fr; }
  .tk-opt { display: flex; align-items: center; gap: 13px; width: 100%; text-align: left; padding: 14px 16px; border-radius: 16px; background: var(--white); border: 1.5px solid var(--border); font-size: 15.5px; font-weight: 600; color: var(--text); line-height: 1.45; transition: border-color .12s ease, background .12s ease, transform .12s ease, box-shadow .12s ease; }
  .tk-opt:hover { border-color: var(--line); transform: translate(-1px, -1px); box-shadow: var(--hard-sm); }
  .tk-opt.on { border: 2px solid var(--line); background: var(--sun-soft); box-shadow: var(--hard-sm); padding: 13.5px 15.5px; }
  .tk-mk { width: 32px; height: 32px; border-radius: 999px; border: 1.5px solid var(--line); background: var(--white); color: var(--text); font-family: var(--font-mono); font-weight: 700; font-size: 13px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .tk-mk.sq { border-radius: 10px; }
  .tk-opt.on .tk-mk { background: var(--ink); border-color: var(--ink); color: #fff; }
  .tk-text { height: 56px; font-size: 17px; font-weight: 600; user-select: text; }
  .tk-nav { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-top: 18px; }
  .tk-hint { text-align: center; font-size: 12px; color: var(--text-3); margin-top: 14px; }
  .tk-hint kbd { font-family: var(--font-mono); font-size: 10.5px; padding: 1px 6px; border-radius: 6px; border: 1.5px solid var(--border); background: var(--white); }

  .tk-side { position: sticky; top: 86px; background: var(--white); border: 1.5px solid var(--border); border-radius: 22px; padding: 18px; }
  .tk-side h4 { font-size: 15px; margin-bottom: 12px; display: flex; align-items: center; justify-content: space-between; }
  .tk-side h4 span { font-family: var(--font-mono); font-size: 11.5px; color: var(--text-3); font-weight: 600; }
  .tk-pal { display: grid; grid-template-columns: repeat(6, 1fr); gap: 6px; }
  .tk-pb { position: relative; aspect-ratio: 1; border-radius: 10px; border: 1.5px solid var(--border); background: var(--white); font-family: var(--font-mono); font-size: 12.5px; font-weight: 700; color: var(--text-3); }
  .tk-pb:hover { border-color: var(--line); color: var(--text); }
  .tk-pb.done { background: var(--green-100); border-color: var(--green-300); color: var(--green-800); }
  .tk-pb.cur { background: var(--ink); border-color: var(--ink); color: #fff; }
  .tk-pb .fl { position: absolute; top: -4px; right: -4px; width: 11px; height: 11px; border-radius: 99px; background: var(--sun); border: 1.5px solid var(--line); }
  .tk-leg { display: flex; flex-wrap: wrap; gap: 6px 14px; margin: 14px 0; font-size: 12px; color: var(--text-3); font-weight: 600; }
  .tk-leg i { display: inline-block; width: 11px; height: 11px; border-radius: 4px; margin-right: 5px; vertical-align: -1px; border: 1.5px solid var(--border); }
  .tk-strict { margin-top: 14px; padding: 10px 12px; border-radius: 14px; background: var(--red-50); font-size: 12.5px; line-height: 1.5; color: var(--text-2); }
  .tk-strict b { color: var(--red-600); }
  .tk-dots { display: inline-flex; gap: 4px; margin-left: 6px; vertical-align: middle; }
  .tk-dots i { width: 9px; height: 9px; border-radius: 99px; border: 1.5px solid var(--red-600); display: inline-block; }
  .tk-dots i.on { background: var(--red-600); }

  /* Intro */
  .ti { max-width: 980px; margin: 0 auto; padding: 44px 20px 60px; display: grid; grid-template-columns: minmax(0, 1.25fr) minmax(0, 1fr); gap: 24px; align-items: start; }
  .ti-main { background: var(--white); border: 2px solid var(--line); border-radius: 28px; box-shadow: var(--hard); padding: 32px; position: relative; overflow: hidden; }
  .ti-main::after { content: ''; position: absolute; inset: 0; background-image: var(--topo); background-size: 520px 360px; pointer-events: none; }
  .ti-main > * { position: relative; z-index: 1; }
  .ti-main h1 { font-size: 40px; margin: 16px 0 10px; }
  .ti-desc { color: var(--text-3); line-height: 1.6; font-size: 15px; white-space: pre-wrap; }
  .ti-facts { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin: 24px 0; }
  .ti-fact { border: 1.5px solid var(--line); border-radius: 18px; padding: 14px; background: var(--white); }
  .ti-fact:nth-child(1) { background: var(--sun); color: #14213D; transform: rotate(-2deg); }
  .ti-fact b { display: block; font-family: var(--font-display); font-size: 30px; font-weight: 800; letter-spacing: -.04em; line-height: 1; }
  .ti-fact span { font-size: 12px; font-weight: 700; opacity: .75; }
  .ti-side { display: flex; flex-direction: column; gap: 14px; }
  .ti-card { background: var(--white); border: 1.5px solid var(--border); border-radius: 22px; padding: 18px 20px; }
  .ti-card h3 { font-size: 16px; margin-bottom: 10px; }
  .ti-rule { display: flex; gap: 12px; padding: 9px 0; font-size: 13.5px; line-height: 1.5; color: var(--text-2); border-bottom: 1.5px dashed var(--border-2); }
  .ti-rule:last-child { border-bottom: none; }
  .ti-rule .ri { width: 30px; height: 30px; border-radius: 10px; background: var(--bg-soft); display: flex; align-items: center; justify-content: center; flex-shrink: 0; color: var(--text-2); }
  .ti-rule.red .ri { background: var(--coral-soft); color: var(--red-600); }
  .ti-me { display: flex; gap: 10px; }
  .ti-me div { flex: 1; background: var(--bg-soft); border-radius: 14px; padding: 12px; }
  .ti-me b { display: block; font-family: var(--font-display); font-size: 22px; font-weight: 800; letter-spacing: -.03em; line-height: 1; }
  .ti-me span { font-size: 12px; color: var(--text-3); font-weight: 600; }

  html[data-theme="dark"] .tk-pb.cur, html[data-theme="dark"] .tk-opt.on .tk-mk { background: var(--sun); border-color: var(--sun); color: #14213D; }
  html[data-theme="dark"] .tk-mk { background: transparent; }

  @media (max-width: 960px) {
    .tk-body { grid-template-columns: 1fr; padding: 16px 14px 32px; }
    .tk-side { position: static; order: -1; padding: 12px 14px; }
    .tk-side .tk-leg, .tk-side .tk-fin { display: none; }
    .tk-pal { grid-template-columns: repeat(auto-fill, minmax(36px, 1fr)); }
    .ti { grid-template-columns: 1fr; padding-top: 24px; }
    .tk-save { display: none; }
  }
  @media (max-width: 600px) {
    .tk-q { padding: 20px 16px; border-radius: 20px; } .tk-q-text { font-size: 20px; }
    .tk-opts.tf { grid-template-columns: 1fr; } .ti-main { padding: 22px 18px; } .ti-main h1 { font-size: 30px; }
    .tk-top-in { padding: 8px 12px; gap: 10px; } .tk-timer { height: 38px; font-size: 15px; padding: 0 10px; }
    .tk-nav .btn { padding: 0 14px; }
  }
`

const QT = {
  single: ['checkC', "Bitta to'g'ri javobni tanlang"],
  multiple: ['list', "Bir nechta javob to'g'ri bo'lishi mumkin"],
  true_false: ['check', "To'g'ri yoki noto'g'ri?"],
  text: ['pen', 'Javobni yozing'],
}

function fmtTime(s) {
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60
  const mm = String(m).padStart(2, '0'), ss = String(sec).padStart(2, '0')
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`
}

const hasAnswer = (v) => Array.isArray(v) ? v.length > 0 : typeof v === 'string' ? v.trim() !== '' : v !== undefined && v !== null

function toPayload(answers, questions) {
  return questions.filter(q => hasAnswer(answers[q.id])).map(q => {
    const v = answers[q.id]
    if (q.question_type === 'multiple') return { question_id: q.id, option_ids: v }
    if (q.question_type === 'text') return { question_id: q.id, text: v }
    return { question_id: q.id, option_id: v }
  })
}
function fromPayload(list) {
  const out = {}
  for (const a of list || []) {
    if (!a || a.question_id == null) continue
    out[a.question_id] = a.option_ids ?? a.text ?? a.option_id
  }
  return out
}
const lsKey = (id) => `ionedu-attempt-${id}`

export default function TestPage() {
  const { slug, testId } = useParams()
  const navigate = useNavigate()
  const qc = useQueryClient()

  const [stage, setStage] = useState('intro')       // intro | active
  const [starting, setStarting] = useState(false)
  const [attempt, setAttempt] = useState(null)      // { id, test, focus_losses }
  const [i, setI] = useState(0)
  const [answers, setAnswers] = useState({})
  const [flags, setFlags] = useState(() => new Set())
  const [timeLeft, setTimeLeft] = useState(null)
  const [saveState, setSaveState] = useState('saved') // saved | saving | error
  const [violations, setViolations] = useState(0)
  const [warn, setWarn] = useState(false)
  const [finishing, setFinishing] = useState(false)
  const [busy, setBusy] = useState(false)

  const deadlineRef = useRef(null)     // performance.now()-based deadline (ms)
  const stateRef = useRef({})
  const submittedRef = useRef(false)
  const dirtyRef = useRef(false)
  const lastViolationRef = useRef(0)
  stateRef.current = { attempt, answers, flags, i, violations }

  const backPath = slug ? `/courses/${slug}` : '/tests'
  const resultPath = useCallback(
    (id) => slug ? `/learn/${slug}/test/${testId}/result/${id}` : `/tests/${testId}/result/${id}`,
    [slug, testId],
  )

  const { data: info, isError: infoError } = useQuery({
    queryKey: ['test-detail', testId],
    queryFn: () => api.get(`/tests/${testId}/detail/`).then(r => r.data),
    enabled: stage === 'intro',
    retry: false,
  })

  const test = attempt?.test
  const questions = useMemo(() => test?.questions || [], [test])
  const syncClock = useCallback((remaining) => {
    if (remaining === null || remaining === undefined) { deadlineRef.current = null; setTimeLeft(null); return }
    deadlineRef.current = performance.now() + remaining * 1000
    setTimeLeft(Math.max(0, remaining))
  }, [])

  /* ── start / resume ── */
  async function start() {
    if (starting) return
    setStarting(true)
    try {
      const { data } = await api.post(`/tests/${testId}/start/`)
      let restored = fromPayload(data.draft?.answers)
      let restoredFlags = data.draft?.flags || []
      let index = data.draft?.index || 0
      // The local mirror can be newer than the last successful autosave.
      try {
        const local = JSON.parse(localStorage.getItem(lsKey(data.id)) || 'null')
        if (local?.answers && Object.keys(local.answers).length >= Object.keys(restored).length) {
          restored = local.answers; restoredFlags = local.flags || restoredFlags; index = local.index ?? index
        }
      } catch { /* corrupted mirror — ignore */ }
      const valid = new Set(data.test.questions.map(q => q.id))
      setAnswers(Object.fromEntries(Object.entries(restored).filter(([k]) => valid.has(Number(k)))))
      setFlags(new Set(restoredFlags.filter(f => valid.has(f))))
      setI(Math.min(Math.max(index, 0), data.test.questions.length - 1))
      setViolations(data.focus_losses || 0)
      setAttempt(data)
      syncClock(data.remaining_seconds)
      setStage('active')
      if (data.resumed) toast('Test davom ettirilmoqda — javoblaringiz saqlangan', { icon: '⏳' })
    } catch (e) {
      toast.error(apiError(e, "Testni boshlab bo'lmadi"), { duration: 6000 })
      // Refresh the intro so attempt limits / closed tests show their real state.
      qc.invalidateQueries({ queryKey: ['test-detail', testId] })
    } finally { setStarting(false) }
  }

  /* ── submit ── */
  const submit = useCallback(async (reason = 'manual') => {
    const { attempt: a, answers: ans, violations: v } = stateRef.current
    if (!a || submittedRef.current) return
    submittedRef.current = true
    setBusy(true)
    try {
      const { data } = await api.post(`/attempts/${a.id}/submit/`, {
        answers: toPayload(ans, a.test.questions), reason, focus_losses: v,
      })
      localStorage.removeItem(lsKey(a.id))
      qc.invalidateQueries({ queryKey: ['test-detail', testId] })
      qc.invalidateQueries({ queryKey: ['my-attempts'] })
      if (slug) {
        qc.invalidateQueries({ queryKey: ['course', slug] })
        qc.invalidateQueries({ queryKey: ['enrollments'] })
        if (data.course_completed) toast.success("Tabriklaymiz! Kurs to'liq yakunlandi.")
      }
      navigate(resultPath(data.id), { replace: true })
    } catch {
      submittedRef.current = false
      setBusy(false)
      toast.error("Yuborib bo'lmadi. Internetni tekshirib, qayta urinib ko'ring — javoblaringiz saqlangan.")
    }
  }, [navigate, qc, slug, testId, resultPath])

  /* ── autosave ── */
  const save = useCallback(async () => {
    const { attempt: a, answers: ans, flags: fl, i: idx, violations: v } = stateRef.current
    if (!a || submittedRef.current) return
    dirtyRef.current = false
    setSaveState('saving')
    try {
      const { data } = await api.post(`/attempts/${a.id}/save/`, {
        answers: toPayload(ans, a.test.questions), flags: [...fl], index: idx, focus_losses: v,
      })
      setSaveState('saved')
      if (data.finished) {
        // The server closed the attempt (time ran out while offline).
        submittedRef.current = true
        localStorage.removeItem(lsKey(a.id))
        toast('Vaqt tugadi — test yakunlandi', { icon: '⏰' })
        navigate(resultPath(a.id), { replace: true })
        return
      }
      syncClock(data.remaining_seconds)
    } catch {
      dirtyRef.current = true
      setSaveState('error')
    }
  }, [navigate, syncClock, resultPath])

  // Debounced save after every change + local mirror.
  useEffect(() => {
    if (stage !== 'active' || !attempt) return
    localStorage.setItem(lsKey(attempt.id), JSON.stringify({ answers, flags: [...flags], index: i, at: Date.now() }))
    dirtyRef.current = true
    const t = setTimeout(save, 900)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answers, flags, violations])

  // Heartbeat: retries failed saves and keeps the clock honest.
  useEffect(() => {
    if (stage !== 'active') return
    const id = setInterval(() => { save() }, 25000)
    return () => clearInterval(id)
  }, [stage, save])

  /* ── countdown ── */
  useEffect(() => {
    if (stage !== 'active') return
    const id = setInterval(() => {
      if (deadlineRef.current === null) return
      setTimeLeft(Math.max(0, Math.ceil((deadlineRef.current - performance.now()) / 1000)))
    }, 500)
    return () => clearInterval(id)
  }, [stage])

  useEffect(() => {
    if (stage === 'active' && timeLeft === 0 && !submittedRef.current) {
      toast('Vaqt tugadi — javoblaringiz yuborildi', { icon: '⏰' })
      submit('timeout')
    }
  }, [timeLeft, stage, submit])

  /* ── strict mode: counted warnings ── */
  const strict = !!test?.strict_mode
  useEffect(() => {
    if (stage !== 'active' || !strict) return
    function violation() {
      if (submittedRef.current) return
      const now = Date.now()
      if (now - lastViolationRef.current < 1500) return   // blur + visibilitychange fire together
      lastViolationRef.current = now
      setViolations(v => v + 1)
      setWarn(true)
    }
    const onVis = () => { if (document.hidden) violation() }
    const block = e => e.preventDefault()
    window.addEventListener('blur', violation)
    document.addEventListener('visibilitychange', onVis)
    document.addEventListener('contextmenu', block)
    document.addEventListener('copy', block)
    return () => {
      window.removeEventListener('blur', violation)
      document.removeEventListener('visibilitychange', onVis)
      document.removeEventListener('contextmenu', block)
      document.removeEventListener('copy', block)
    }
  }, [stage, strict])

  const limit = test?.focus_loss_limit || 3
  useEffect(() => {
    if (!strict || stage !== 'active' || violations < limit || submittedRef.current) return
    toast.error('Qoidabuzarliklar chegarasiga yetildi — test yakunlandi', { duration: 6000 })
    submit('focus_lost')
  }, [violations, strict, stage, limit, submit])

  /* ── leaving the page ── */
  useEffect(() => {
    if (stage !== 'active') return
    function onBeforeUnload(e) {
      if (submittedRef.current) return
      e.preventDefault(); e.returnValue = ''
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [stage])

  // Navigating away inside the app: flush the latest answers (the attempt stays
  // open and can be resumed — nothing is submitted behind the student's back).
  useEffect(() => () => {
    const { attempt: a, answers: ans, flags: fl, i: idx, violations: v } = stateRef.current
    if (!a || submittedRef.current || !dirtyRef.current) return
    fetch(`${api.defaults.baseURL}/attempts/${a.id}/save/`, {
      method: 'POST', keepalive: true,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('access')}` },
      body: JSON.stringify({ answers: toPayload(ans, a.test.questions), flags: [...fl], index: idx, focus_losses: v }),
    }).catch(() => {})
  }, [])

  function pick(q, optId) {
    setAnswers(prev => {
      if (q.question_type === 'multiple') {
        const cur = Array.isArray(prev[q.id]) ? prev[q.id] : []
        return { ...prev, [q.id]: cur.includes(optId) ? cur.filter(x => x !== optId) : [...cur, optId] }
      }
      return { ...prev, [q.id]: optId }
    })
  }
  function toggleFlag(qid) {
    if (!qid) return
    setFlags(prev => { const n = new Set(prev); if (n.has(qid)) n.delete(qid); else n.add(qid); return n })
  }

  /* ── keyboard ── */
  const keyRef = useRef(null)
  keyRef.current = (e) => {
    if (finishing || warn) return
    const typing = ['INPUT', 'TEXTAREA'].includes(e.target.tagName)
    const last = questions.length - 1
    if (typing) { if (e.key === 'Enter') setI(v => Math.min(last, v + 1)); return }
    if (e.key === 'ArrowLeft') setI(v => Math.max(0, v - 1))
    else if (e.key === 'ArrowRight') setI(v => Math.min(last, v + 1))
    else if (e.key.toLowerCase() === 'f') toggleFlag(questions[i]?.id)
    else if (/^[1-9]$/.test(e.key)) {
      const cur = questions[i]
      const o = cur?.options?.[Number(e.key) - 1]
      if (o) pick(cur, o.id)
    }
  }
  useEffect(() => {
    if (stage !== 'active') return
    const onKey = (e) => keyRef.current?.(e)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [stage])

  /* ─────────── INTRO ─────────── */
  if (stage === 'intro') {
    const t = info
    const me = t?.me || {}
    const exhausted = t?.max_attempts && me.attempts_used >= t.max_attempts && !me.active_attempt && !t.can_manage
    return (
      <>
        <Navbar />
        <style>{css}</style>
        {infoError ? (
          <div className="empty-state" style={{ paddingTop: 100 }}>
            <span className="es-ico"><Icon name="alert" size={22} /></span>
            <div className="es-title">Test topilmadi</div>
            <div className="es-sub">U o'chirilgan yoki yopilgan bo'lishi mumkin.</div>
            <Link to={backPath} className="btn btn-secondary btn-sm">Orqaga</Link>
          </div>
        ) : !t ? (
          <div className="loading-state"><span className="spinner" />Test yuklanmoqda…</div>
        ) : (
          <div className="ti fade-up">
            <div className="ti-main">
              <span className="eyebrow">Test</span>
              <h1>{t.title}</h1>
              {t.description && <p className="ti-desc">{t.description}</p>}
              <div className="ti-facts">
                <div className="ti-fact"><b>{t.question_count}</b><span>savol</span></div>
                <div className="ti-fact"><b>{t.time_limit_minutes || '∞'}</b><span>{t.time_limit_minutes ? 'daqiqa' : 'vaqt cheksiz'}</span></div>
                <div className="ti-fact"><b>{t.pass_percent}%</b><span>o'tish bali</span></div>
              </div>
              {exhausted ? (
                <div className="tk-strict" style={{ marginTop: 0 }}>
                  <b>Urinishlar tugadi.</b> Bu testni {t.max_attempts} marta ishlash mumkin edi. Eng yaxshi natijangiz: {Math.round(me.best_score || 0)}%.
                </div>
              ) : (
                <button className="btn btn-primary btn-lg btn-block" disabled={t.question_count === 0 || starting} onClick={start}>
                  {starting ? 'Tayyorlanmoqda…' : me.active_attempt ? 'Testni davom ettirish' : me.attempts_used ? 'Qayta topshirish' : 'Testni boshlash'}
                  <Icon name="arrowR" size={17} />
                </button>
              )}
              {t.question_count === 0 && <div className="text-sm text-muted mt-3" style={{ textAlign: 'center' }}>Bu testda hali savollar yo'q</div>}
              <div style={{ textAlign: 'center', marginTop: 14 }}>
                <Link to={backPath} className="text-sm text-muted" style={{ fontWeight: 600 }}>← Orqaga qaytish</Link>
              </div>
            </div>

            <div className="ti-side">
              {(me.attempts_used > 0 || t.max_attempts) && (
                <div className="ti-card">
                  <h3>Sizning natijalaringiz</h3>
                  <div className="ti-me">
                    <div><b>{me.attempts_used || 0}{t.max_attempts ? `/${t.max_attempts}` : ''}</b><span>urinish</span></div>
                    <div><b style={{ color: me.is_passed ? 'var(--green-600)' : undefined }}>{me.best_score != null ? `${Math.round(me.best_score)}%` : '—'}</b><span>eng yaxshi ball</span></div>
                  </div>
                </div>
              )}
              <div className="ti-card">
                <h3>Qoidalar</h3>
                <div className="ti-rule">
                  <span className="ri"><Icon name="clock" size={15} /></span>
                  <div>{t.time_limit_minutes
                    ? `Vaqt «Boshlash» bosilganda ketadi. ${t.time_limit_minutes} daqiqadan so'ng test o'zi yakunlanadi.`
                    : "Vaqt chegarasi yo'q — shoshilmasdan ishlang."}</div>
                </div>
                <div className="ti-rule">
                  <span className="ri"><Icon name="checkC" size={15} /></span>
                  <div>Javoblar avtomatik saqlanadi. Sahifa yangilansa yoki internet uzilsa ham davom ettira olasiz.</div>
                </div>
                <div className="ti-rule">
                  <span className="ri"><Icon name="bookmark" size={15} /></span>
                  <div>Qiyin savolni belgilab qo'yib, keyinroq qaytishingiz mumkin.</div>
                </div>
                {t.strict_mode && (
                  <div className="ti-rule red">
                    <span className="ri"><Icon name="shield" size={15} /></span>
                    <div><b style={{ color: 'var(--red-600)' }}>Nazorat rejimi.</b> Boshqa oyna yoki varaqqa o'tish qoidabuzarlik sanaladi.
                      {' '}{t.focus_loss_limit}-martasida test avtomatik yakunlanadi.</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </>
    )
  }

  /* ─────────── ACTIVE ─────────── */
  const q = questions[i]
  if (!q) return <><style>{css}</style><div className="loading-state"><span className="spinner" />Yuklanmoqda…</div></>
  const total = questions.length
  const answered = questions.filter(x => hasAnswer(answers[x.id])).length
  const unanswered = questions.map((x, k) => hasAnswer(answers[x.id]) ? null : k).filter(v => v !== null)
  const flagged = questions.map((x, k) => flags.has(x.id) ? k : null).filter(v => v !== null)
  const urgent = timeLeft !== null && timeLeft <= 60
  const [qtIcon, qtText] = QT[q.question_type] || QT.single
  const val = answers[q.id]

  return (
    <div className="tk">
      <style>{css}</style>
      <header className="tk-top">
        <div className="tk-top-in">
          <Logo size={30} name="" />
          <div className="tk-title">
            <b>{test.title}</b>
            <span>{answered}/{total} javob berildi</span>
          </div>
          <span className={`tk-save ${saveState === 'error' ? 'err' : ''}`}>
            <Icon name={saveState === 'error' ? 'alert' : saveState === 'saving' ? 'rotate' : 'check'} size={12} />
            {saveState === 'error' ? 'OFLAYN — QAYTA URINILADI' : saveState === 'saving' ? 'SAQLANMOQDA' : 'SAQLANDI'}
          </span>
          {timeLeft !== null && (
            <div className={`tk-timer ${urgent ? 'urgent' : ''}`} role="timer">
              <Icon name="clock" size={16} /> {fmtTime(timeLeft)}
            </div>
          )}
        </div>
        <div className="tk-bar"><i style={{ width: `${answered / total * 100}%` }} /></div>
      </header>

      <div className="tk-body">
        <main style={{ minWidth: 0 }}>
          <div className="tk-q" key={q.id}>
            <div className="tk-q-head">
              <span className="tk-q-n">Savol {i + 1} / {total}</span>
              <span className="badge badge-blue"><Icon name={qtIcon} size={11} /> {qtText}</span>
              {q.points > 1 && <span className="badge badge-amber">{q.points} ball</span>}
              <span className="sp" />
              <button className={`tk-flag ${flags.has(q.id) ? 'on' : ''}`} onClick={() => toggleFlag(q.id)} aria-pressed={flags.has(q.id)}>
                <Icon name="bookmark" size={14} fill={flags.has(q.id)} /> {flags.has(q.id) ? 'Belgilangan' : 'Belgilash'}
              </button>
            </div>

            <div className="tk-q-text">{q.text}</div>
            {q.image && <img className="tk-q-img" src={q.image} alt="Savolga oid rasm" draggable={false} />}

            {q.question_type === 'text' ? (
              <input className="input tk-text" value={val || ''} onChange={e => setAnswers(p => ({ ...p, [q.id]: e.target.value }))}
                placeholder="Javobingizni yozing…" autoComplete="off" spellCheck={false} autoFocus maxLength={500} />
            ) : (
              <div className={`tk-opts ${q.question_type === 'true_false' ? 'tf' : ''}`} role={q.question_type === 'multiple' ? 'group' : 'radiogroup'}>
                {q.options.map((o, k) => {
                  const on = q.question_type === 'multiple' ? Array.isArray(val) && val.includes(o.id) : val === o.id
                  return (
                    <button type="button" key={o.id} className={`tk-opt ${on ? 'on' : ''}`} onClick={() => pick(q, o.id)}
                      role={q.question_type === 'multiple' ? 'checkbox' : 'radio'} aria-checked={on}>
                      <span className={`tk-mk ${q.question_type === 'multiple' ? 'sq' : ''}`}>
                        {on && q.question_type === 'multiple' ? <Icon name="check" size={15} /> : String.fromCharCode(65 + k)}
                      </span>
                      <span>{o.text}</span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          <div className="tk-nav">
            <button className="btn btn-secondary" disabled={i === 0} onClick={() => setI(i - 1)}><Icon name="arrowL" size={15} /> Oldingi</button>
            {hasAnswer(val) && q.question_type !== 'text' && (
              <button className="btn btn-ghost btn-sm" onClick={() => setAnswers(p => { const n = { ...p }; delete n[q.id]; return n })}>Javobni tozalash</button>
            )}
            {i === total - 1
              ? <button className="btn btn-primary" onClick={() => setFinishing(true)} disabled={busy}>Yakunlash <Icon name="check" size={15} /></button>
              : <button className="btn btn-primary" onClick={() => setI(i + 1)}>Keyingi <Icon name="arrowR" size={15} /></button>}
          </div>
          <div className="tk-hint"><kbd>←</kbd> <kbd>→</kbd> savollar orasida · <kbd>1</kbd>–<kbd>9</kbd> variant tanlash · <kbd>F</kbd> belgilash</div>
        </main>

        <aside className="tk-side">
          <h4>Savollar <span>{answered}/{total}</span></h4>
          <div className="tk-pal">
            {questions.map((x, k) => (
              <button key={x.id} className={`tk-pb ${k === i ? 'cur' : hasAnswer(answers[x.id]) ? 'done' : ''}`} onClick={() => setI(k)}
                aria-label={`${k + 1}-savol${hasAnswer(answers[x.id]) ? ', javob berilgan' : ''}`}>
                {k + 1}{flags.has(x.id) && <span className="fl" />}
              </button>
            ))}
          </div>
          <div className="tk-leg">
            <span><i style={{ background: 'var(--green-100)', borderColor: 'var(--green-300)' }} />Javob berilgan</span>
            <span><i style={{ background: 'var(--sun)', borderColor: 'var(--line)', borderRadius: 99 }} />Belgilangan</span>
            <span><i />Javobsiz</span>
          </div>
          <button className="btn btn-primary btn-block tk-fin" onClick={() => setFinishing(true)} disabled={busy}>
            Testni yakunlash
          </button>
          {strict && (
            <div className="tk-strict">
              <b>Nazorat rejimi</b>
              <span className="tk-dots">
                {Array.from({ length: limit }, (_, k) => <i key={k} className={k < violations ? 'on' : ''} />)}
              </span>
              <br />Boshqa oynaga o'tmang: {limit}-ogohlantirishda test yakunlanadi.
            </div>
          )}
        </aside>
      </div>

      {warn && violations < limit && (
        <div className="modal-backdrop">
          <div className="modal" style={{ maxWidth: 440, textAlign: 'center' }} role="alertdialog">
            <div style={{ fontSize: 46, lineHeight: 1 }}>⚠️</div>
            <h3 style={{ fontSize: 22, margin: '12px 0 8px' }}>Ogohlantirish {violations}/{limit}</h3>
            <p className="text-sm text-muted" style={{ lineHeight: 1.6 }}>
              Siz test oynasidan chiqdingiz. Bu testda nazorat rejimi yoqilgan —
              yana {limit - violations} marta takrorlansa, test avtomatik yakunlanadi.
            </p>
            <button className="btn btn-primary btn-block" style={{ marginTop: 20 }} onClick={() => setWarn(false)} autoFocus>Tushundim, davom etaman</button>
          </div>
        </div>
      )}

      {finishing && (
        <div className="modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget && !busy) setFinishing(false) }}>
          <div className="modal" style={{ maxWidth: 480 }}>
            <h3 style={{ fontSize: 23, marginBottom: 6 }}>Testni yakunlaysizmi?</h3>
            <p className="text-sm text-muted" style={{ lineHeight: 1.6 }}>
              {answered}/{total} savolga javob berdingiz.
              {unanswered.length > 0 ? " Javobsiz savollar noto'g'ri deb hisoblanadi." : ' Hamma savolga javob berilgan — barakalla!'}
            </p>
            {unanswered.length > 0 && (
              <div style={{ marginTop: 14 }}>
                <div className="label">Javobsiz savollar</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {unanswered.map(k => <button key={k} className="tk-pb" style={{ width: 38 }} onClick={() => { setI(k); setFinishing(false) }}>{k + 1}</button>)}
                </div>
              </div>
            )}
            {flagged.length > 0 && (
              <div style={{ marginTop: 14 }}>
                <div className="label">Belgilangan savollar</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {flagged.map(k => <button key={k} className="tk-pb" style={{ width: 38, background: 'var(--sun-soft)' }} onClick={() => { setI(k); setFinishing(false) }}>{k + 1}</button>)}
                </div>
              </div>
            )}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 24 }}>
              <button className="btn btn-secondary" onClick={() => setFinishing(false)} disabled={busy}>Davom etish</button>
              <button className="btn btn-primary" disabled={busy} onClick={() => submit('manual')}>{busy ? 'Yuborilmoqda…' : 'Ha, yakunlash'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
