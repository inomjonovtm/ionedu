import { Link, useNavigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import api from '../../api/client'
import Navbar from '../../components/Navbar'
import Icon from '../../components/Icon'

/**
 * Test result — course mode (/learn/:slug/test/:testId/result/:attemptId)
 * and standalone mode (/tests/:testId/result/:attemptId).
 */
export default function TestResult() {
  const { slug, testId, attemptId } = useParams()
  const navigate = useNavigate()
  const { data: r } = useQuery({
    queryKey: ['attempt', attemptId],
    queryFn: () => api.get(`/attempts/${attemptId}/result/`).then(x => x.data),
  })

  // Fresh curriculum state (course mode only) — decides where "continue" leads.
  const { data: course } = useQuery({
    queryKey: ['course', slug],
    queryFn: () => api.get(`/courses/${slug}/`).then(x => x.data),
    enabled: !!slug,
  })

  if (!r) return <><Navbar /><div className="loading-state"><span className="spinner" />Natija yuklanmoqda…</div></>

  // Flat curriculum order (lessons then tests, per section)
  const ordered = []
  for (const s of course?.sections || []) {
    for (const l of s.lessons || []) ordered.push({ kind: 'lesson', id: l.id, done: !!l.is_completed })
    for (const t of s.tests || []) ordered.push({ kind: 'test', id: t.id, done: !!t.is_passed })
  }
  const nextItem = ordered.find(it => !it.done)
  const courseCompleted = !!slug && ordered.length > 0 && !nextItem
  const continueTo = nextItem
    ? (nextItem.kind === 'lesson' ? `/learn/${slug}/${nextItem.id}` : `/learn/${slug}/test/${nextItem.id}`)
    : `/courses/${slug}`
  const retakePath = slug ? `/learn/${slug}/test/${testId}` : `/tests/${testId}/take`

  const total = r.correct_count + r.wrong_count
  const wrong = (r.answers || []).filter(a => !a.is_correct)
  const dash = 502
  const dashOffset = dash - (dash * r.score_percent / 100)

  const reasonNote = {
    focus_lost: { icon: 'alert', tone: 'red', text: "Test boshqa oyna yoki varaqqa o'tilgani sababli avtomatik yakunlandi." },
    timeout: { icon: 'clock', tone: 'amber', text: 'Ajratilgan vaqt tugagani uchun test avtomatik yakunlandi.' },
    left: { icon: 'alert', tone: 'amber', text: 'Test sahifasi tark etilgani uchun joriy javoblar asosida baholandi.' },
  }[r.finish_reason]

  return (
    <>
      <Navbar />
      <div style={{ maxWidth: 600, margin: '60px auto', padding: '0 24px 80px', minHeight: 'calc(100vh - 64px)' }}>
        {reasonNote && (
          <div className="fade-up" style={{
            display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', marginBottom: 16,
            background: `var(--${reasonNote.tone}-50)`, color: `var(--${reasonNote.tone}-600)`,
            border: `1px solid var(--${reasonNote.tone}-50)`, borderRadius: 14, fontSize: 14, fontWeight: 500,
          }}>
            <Icon name={reasonNote.icon} size={18} /> {reasonNote.text}
          </div>
        )}
        <div className="card fade-up" style={{ padding: '48px 40px', textAlign: 'center', borderRadius: 20 }}>
          <div style={{ position: 'relative', width: 200, height: 200, margin: '0 auto 24px' }}>
            <svg viewBox="0 0 200 200" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
              <circle fill="none" stroke="var(--border-2)" strokeWidth="12" cx="100" cy="100" r="80" />
              <circle fill="none" stroke={r.passed ? 'var(--green-600)' : 'var(--red-600)'} strokeWidth="12" strokeLinecap="round" cx="100" cy="100" r="80"
                strokeDasharray={dash} strokeDashoffset={dashOffset} style={{ transition: 'stroke-dashoffset 1s ease-out' }} />
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 52, fontWeight: 560, letterSpacing: '-0.04em', lineHeight: 1, color: r.passed ? 'var(--green-600)' : 'var(--red-600)' }}>
                {Math.round(r.score_percent)}
              </div>
              <div className="text-sm text-muted mt-1">/ 100 ball</div>
            </div>
          </div>

          <div className={`badge badge-${r.passed ? 'green' : 'red'}`} style={{ padding: '8px 18px', fontSize: 14, marginBottom: 8 }}>
            <Icon name={r.passed ? 'checkC' : 'x'} size={16} /> {r.passed ? "Muvaffaqiyatli o'tildi" : "O'tilmadi"}
          </div>
          <h1 style={{ fontSize: 28, margin: '12px 0 8px' }}>{r.passed ? 'Ajoyib natija!' : "Yana urinib ko'ring"}</h1>
          <p className="text-muted">{r.test?.title}</p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, margin: '32px 0' }}>
            <div style={{ padding: '18px 12px', background: 'var(--bg-soft)', borderRadius: 12 }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700, color: 'var(--green-600)' }}>{r.correct_count}</div>
              <div className="text-xs text-muted mt-2">To'g'ri</div>
            </div>
            <div style={{ padding: '18px 12px', background: 'var(--bg-soft)', borderRadius: 12 }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700, color: 'var(--red-600)' }}>{r.wrong_count}</div>
              <div className="text-xs text-muted mt-2">Noto'g'ri</div>
            </div>
            <div style={{ padding: '18px 12px', background: 'var(--bg-soft)', borderRadius: 12 }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700 }}>{total}</div>
              <div className="text-xs text-muted mt-2">Jami</div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            {!r.passed && (
              <button className="btn btn-primary" onClick={() => navigate(retakePath)}>
                Qayta urinish <Icon name="arrowR" size={14} />
              </button>
            )}
            {slug && r.passed && courseCompleted && (
              <Link to={`/learn/${slug}/complete`} className="btn btn-primary btn-lg">
                <Icon name="award" size={16} /> Sertifikat olish
              </Link>
            )}
            {slug && r.passed && !courseCompleted && (
              <Link to={continueTo} className="btn btn-primary">
                Davom etish <Icon name="arrowR" size={14} />
              </Link>
            )}
            {!slug && r.passed && (
              <button className="btn btn-secondary" onClick={() => navigate(retakePath)}>
                Qayta topshirish
              </button>
            )}
            <Link to={slug ? `/courses/${slug}` : '/tests'} className="btn btn-secondary">
              {slug ? 'Kurs sahifasi' : 'Barcha testlar'}
            </Link>
          </div>
        </div>

        {wrong.length > 0 && (
          <div className="card mt-6" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <strong>Xato javoblar</strong>
              <span className="badge badge-red">{wrong.length} ta xato</span>
            </div>
            {wrong.map(a => (
              <div key={a.question_id} style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-2)' }}>
                <div style={{ display: 'flex', gap: 12 }}>
                  <span style={{ width: 28, height: 28, borderRadius: 999, background: 'var(--red-50)', color: 'var(--red-600)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, flexShrink: 0 }}>×</span>
                  <div className="text-sm">{a.question_text}</div>
                </div>
                <div style={{ marginLeft: 40, marginTop: 12, fontSize: 13 }}>
                  <div className="text-muted" style={{ padding: '4px 0' }}>Sizning javob: <span style={{ color: 'var(--red-600)' }}>{a.selected_text || '—'}</span></div>
                  <div className="text-muted" style={{ padding: '4px 0' }}>To'g'ri javob: <span style={{ color: 'var(--green-600)', fontWeight: 600 }}>{a.correct_text}</span></div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
