import { useEffect, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import api from '../../api/client'
import Navbar from '../../components/Navbar'
import Icon from '../../components/Icon'

const css = `
  .cg-page { min-height: calc(100vh - 80px); display: flex; align-items: center; padding: 48px 0 72px; background-image: var(--topo); background-size: 520px 360px; overflow: hidden; }
  .cg-grid { display: grid; grid-template-columns: minmax(0, 1.15fr) minmax(0, 1fr); gap: 56px; align-items: center; }
  .cg-text h1 { font-family: var(--font-display); font-size: 84px; font-weight: 800; letter-spacing: -.05em; line-height: .95; margin-top: 18px; }
  .cg-text .lead { font-size: 18px; color: var(--text-3); margin-top: 20px; line-height: 1.55; }
  .cg-course { display: inline-block; max-width: 100%; margin-top: 12px; padding: 8px 14px; background: var(--white); border: 2px solid var(--line); border-radius: 14px; box-shadow: var(--hard-sm); font-family: var(--font-display); font-weight: 700; font-size: 19px; letter-spacing: -.02em; transform: rotate(-1deg); overflow-wrap: anywhere; }

  .cg-route { display: flex; align-items: center; gap: 10px; margin-top: 30px; max-width: 460px; font-family: var(--font-mono); font-size: 10.5px; letter-spacing: .12em; text-transform: uppercase; color: var(--text-3); }
  .cg-route .ln { flex: 1; height: 4px; border-radius: 4px; background: var(--green-600); transform-origin: left; animation: cgGrow 1s .25s cubic-bezier(.21,.7,.25,1) both; }
  .cg-route .d { width: 14px; height: 14px; border-radius: 999px; background: var(--white); border: 2px solid var(--line); flex-shrink: 0; }
  .cg-route .fl { width: 34px; height: 34px; border-radius: 11px; background: var(--sun); color: #14213D; border: 2px solid var(--line); display: flex; align-items: center; justify-content: center; font-size: 17px; flex-shrink: 0; }
  @keyframes cgGrow { from { transform: scaleX(0); } to { transform: scaleX(1); } }

  .cg-ticket { display: grid; grid-template-columns: 96px minmax(0, 1fr) auto; align-items: stretch; margin-top: 30px; max-width: 500px; background: var(--white); border: 2px solid var(--line); border-radius: 20px; box-shadow: var(--hard); overflow: hidden; transition: transform .14s ease, box-shadow .14s ease; }
  .cg-ticket:hover { transform: translate(-2px, -2px); box-shadow: var(--hard-lg); }
  .cg-ticket .stub { background: var(--sun); color: #14213D; border-right: 2px dashed #14213D; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; padding: 16px 8px; font-family: var(--font-mono); font-size: 9px; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; }
  .cg-ticket .bd { padding: 16px 18px; min-width: 0; align-self: center; }
  .cg-ticket .bd b { display: block; font-family: var(--font-display); font-size: 18px; font-weight: 800; letter-spacing: -.02em; color: var(--text); }
  .cg-ticket .bd span { display: block; font-family: var(--font-mono); font-size: 11px; letter-spacing: .06em; color: var(--text-3); margin-top: 5px; overflow-wrap: anywhere; }
  .cg-ticket .go { display: flex; align-items: center; padding: 0 16px; color: var(--text); }
  .cg-actions { display: flex; gap: 12px; flex-wrap: wrap; margin-top: 26px; }
  .cg-wait { display: inline-flex; align-items: center; gap: 12px; margin-top: 30px; padding: 14px 18px; background: var(--white); border: 1.5px dashed var(--border); border-radius: 16px; font-size: 14px; font-weight: 600; color: var(--text-2); }
  .cg-wait .spinner { width: 18px; height: 18px; }
  .cg-err { margin-top: 30px; max-width: 460px; padding: 18px 20px; background: var(--coral-soft); border: 2px solid var(--line); border-radius: 18px; }
  .cg-err p { font-size: 14px; font-weight: 600; color: var(--text); margin-bottom: 12px; }

  /* Summit artwork */
  .cg-art { position: relative; aspect-ratio: 1; max-width: 440px; width: 100%; justify-self: center; }
  .cg-sun { position: absolute; inset: 9%; border-radius: 999px; background: var(--sun); border: 2px solid var(--line); box-shadow: var(--hard-lg); display: flex; align-items: center; justify-content: center; font-size: 150px; line-height: 1; }
  .cg-ring { position: absolute; inset: 0; border-radius: 999px; border: 2px dashed var(--border); }
  .cg-st { position: absolute; display: flex; align-items: center; justify-content: center; border: 2px solid var(--line); box-shadow: var(--hard-sm); color: #14213D; }
  .cg-st.a { top: 2%; left: 4%; width: 84px; height: 84px; border-radius: 22px; background: #FF9D88; font-size: 40px; --tilt: -10deg; transform: rotate(-10deg); }
  .cg-st.b { bottom: 6%; right: 0; width: 96px; height: 96px; border-radius: 999px; background: #8FE0B4; font-size: 44px; --tilt: 8deg; transform: rotate(8deg); animation-delay: .6s; }
  .cg-st.c { top: 10%; right: 2%; padding: 8px 14px; border-radius: 12px; background: var(--white); color: var(--text); font-family: var(--font-mono); font-size: 13px; font-weight: 700; letter-spacing: .08em; transform: rotate(6deg); }
  .cg-st.d { bottom: 4%; left: 6%; padding: 9px 14px; border-radius: 999px; background: #C4B6FF; font-family: var(--font-mono); font-size: 11px; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; --tilt: -5deg; transform: rotate(-5deg); animation-delay: 1.1s; }
  .cg-cf { position: absolute; width: 14px; height: 14px; border: 1.5px solid var(--line); }
  .cg-cf.c1 { top: 32%; left: -3%; background: var(--sea); border-radius: 999px; }
  .cg-cf.c2 { top: -2%; left: 46%; background: var(--coral); transform: rotate(20deg); }
  .cg-cf.c3 { top: 56%; right: -4%; background: var(--violet); transform: rotate(45deg); }
  .cg-cf.c4 { bottom: -2%; left: 44%; background: var(--green-600); border-radius: 999px; width: 10px; height: 10px; }

  @media (max-width: 900px) {
    .cg-page { padding: 28px 0 56px; align-items: flex-start; }
    .cg-grid { grid-template-columns: minmax(0, 1fr); gap: 34px; }
    .cg-art { order: -1; max-width: 240px; }
    .cg-sun { font-size: 84px; box-shadow: var(--hard); }
    .cg-st.a { width: 54px; height: 54px; font-size: 26px; border-radius: 16px; }
    .cg-st.b { width: 60px; height: 60px; font-size: 28px; }
    .cg-st.c { font-size: 11px; padding: 6px 10px; }
    .cg-st.d { font-size: 9.5px; padding: 6px 10px; }
    .cg-text h1 { font-size: 52px; }
    .cg-text .lead { font-size: 16px; }
  }
  @media (max-width: 480px) {
    .cg-text h1 { font-size: 42px; }
    .cg-ticket { grid-template-columns: 72px minmax(0, 1fr); }
    .cg-ticket .go { display: none; }
    .cg-actions .btn { width: 100%; }
  }
`

export default function CourseCongrats() {
  const { slug } = useParams()
  const [genError, setGenError] = useState(false)
  const [generating, setGenerating] = useState(false)

  // Verify the user's enrollment is REALLY 100% complete before showing the screen.
  const { data: enrollments = [], isLoading: enrollLoading } = useQuery({
    queryKey: ['enrollments'],
    queryFn: () => api.get('/courses/enrolled/').then(r => r.data),
  })
  const enrollment = enrollments.find(e => e.course?.slug === slug)

  const { data: certs = [], isLoading: certsLoading, refetch: refetchCerts } = useQuery({
    queryKey: ['my-certs'],
    queryFn: () => api.get('/certificates/mine/').then(r => r.data.results || r.data),
  })
  const cert = certs.find(c => c.course_slug === slug)

  // Generate cert if course is complete but cert not yet issued.
  useEffect(() => {
    if (!enrollment || !enrollment.completed || cert || certsLoading || generating) return
    setGenerating(true)
    api.post(`/certificates/generate/${slug}/`)
      .then(() => { setGenError(false); refetchCerts() })
      .catch(() => setGenError(true))
      .finally(() => setGenerating(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enrollment, cert, certsLoading, slug])

  function retryGenerate() {
    setGenError(false)
    setGenerating(true)
    api.post(`/certificates/generate/${slug}/`)
      .then(() => refetchCerts())
      .catch(() => setGenError(true))
      .finally(() => setGenerating(false))
  }

  if (enrollLoading) {
    return <><Navbar /><div className="loading-state"><span className="spinner" />Yuklanmoqda…</div></>
  }

  // Guard: if not actually finished, redirect back to the course.
  if (!enrollment || !enrollment.completed) {
    return <Navigate to={`/courses/${slug}`} replace />
  }

  return (
    <>
      <Navbar />
      <style>{css}</style>
      <div className="cg-page">
        <div className="container">
          <div className="cg-grid">
            <div className="cg-text fade-up">
              <span className="eyebrow">Marraga yetdingiz</span>
              <h1>Tabriklay<span className="mark-sun">miz!</span></h1>
              <p className="lead">Siz kursni muvaffaqiyatli yakunladingiz</p>
              {enrollment.course?.title && <div className="cg-course">{enrollment.course.title}</div>}

              <div className="cg-route" aria-hidden="true">
                <span>Start</span><span className="d" /><span className="ln" /><span className="fl">🚩</span><span>100%</span>
              </div>

              {cert ? (
                <>
                  <Link to={`/certificate/${cert.unique_id}`} className="cg-ticket">
                    <div className="stub"><Icon name="award" size={28} />Sertifikat</div>
                    <div className="bd">
                      <b>Sertifikatingiz tayyor</b>
                      <span>ID: {cert.short_id} · PDF formatda</span>
                    </div>
                    <div className="go"><Icon name="chevR" size={20} /></div>
                  </Link>

                  <div className="cg-actions">
                    <Link to={`/certificate/${cert.unique_id}`} className="btn btn-primary btn-lg">
                      <Icon name="eye" size={16} /> Sertifikatni ko'rish
                    </Link>
                    <Link to="/courses" className="btn btn-secondary btn-lg">
                      Boshqa kurslar <Icon name="arrowR" size={16} />
                    </Link>
                  </div>
                </>
              ) : genError ? (
                <div className="cg-err">
                  <p>Sertifikat tayyorlashda xatolik yuz berdi.</p>
                  <button className="btn btn-primary" onClick={retryGenerate} disabled={generating}>
                    {generating ? 'Tayyorlanmoqda…' : 'Qayta urinish'}
                  </button>
                </div>
              ) : (
                <div>
                  <div className="cg-wait">
                    <span className="spinner" /> Sertifikat tayyorlanmoqda…
                  </div>
                </div>
              )}
            </div>

            <div className="cg-art fade-up fade-up-d2" aria-hidden="true">
              <span className="cg-ring" />
              <div className="cg-sun">🏔️</div>
              <span className="cg-st a floaty">🧭</span>
              <span className="cg-st b floaty">🏆</span>
              <span className="cg-st c">100%</span>
              <span className="cg-st d floaty">Cho'qqi zabt etildi</span>
              <span className="cg-cf c1" /><span className="cg-cf c2" /><span className="cg-cf c3" /><span className="cg-cf c4" />
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
