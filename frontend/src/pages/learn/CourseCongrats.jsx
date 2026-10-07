import { useEffect, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import api from '../../api/client'
import Navbar from '../../components/Navbar'
import Icon from '../../components/Icon'

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
      <div style={{ minHeight: 'calc(100vh - 64px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px', background: 'var(--bg-soft)' }}>
        <div className="card fade-up" style={{ padding: '56px 48px', maxWidth: 560, textAlign: 'center', boxShadow: '0 24px 60px -20px rgba(14,131,69,0.12)', borderRadius: 24 }}>
          <div style={{
            width: 96, height: 96, borderRadius: 999, background: 'var(--green-50)', color: 'var(--green-600)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px',
          }}>
            <Icon name="checkC" size={48} />
          </div>

          <h1 style={{ fontSize: 40, marginBottom: 12 }}>Tabriklaymiz! 🎉</h1>
          <p style={{ fontSize: 17, color: 'var(--text-3)', marginBottom: 8 }}>Siz kursni muvaffaqiyatli yakunladingiz</p>
          {enrollment.course?.title && <div style={{ fontWeight: 700, fontSize: 17, marginTop: 4 }}>"{enrollment.course.title}"</div>}

          {cert ? (
            <>
              <Link to={`/certificate/${cert.unique_id}`} style={{
                margin: '32px 0 28px', padding: 20, border: '1px solid var(--green-100)', background: 'var(--green-50)', borderRadius: 16,
                display: 'flex', alignItems: 'center', gap: 16, textAlign: 'left', textDecoration: 'none',
              }}>
                <div style={{ width: 76, height: 56, borderRadius: 8, background: 'var(--white)', border: '1px solid var(--green-200)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--green-600)', fontFamily: 'serif', fontStyle: 'italic', fontSize: 15, fontWeight: 600 }}>Sertifikat</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>Sertifikatingiz tayyor</div>
                  <div className="text-xs text-muted mt-1">ID: {cert.short_id} · PDF formatda</div>
                </div>
                <Icon name="chevR" size={18} style={{ color: 'var(--green-600)' }} />
              </Link>

              <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                <Link to={`/certificate/${cert.unique_id}`} className="btn btn-primary btn-lg">
                  <Icon name="eye" size={16} /> Sertifikatni ko'rish
                </Link>
                <Link to="/courses" className="btn btn-secondary btn-lg">
                  Boshqa kurslar <Icon name="arrowR" size={16} />
                </Link>
              </div>
            </>
          ) : genError ? (
            <div style={{ margin: '24px 0' }}>
              <p className="text-muted text-sm mb-3">Sertifikat tayyorlashda xatolik yuz berdi.</p>
              <button className="btn btn-primary" onClick={retryGenerate} disabled={generating}>
                {generating ? 'Tayyorlanmoqda…' : 'Qayta urinish'}
              </button>
            </div>
          ) : (
            <div className="text-muted text-sm" style={{ margin: '24px 0', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <Icon name="clock" size={15} /> Sertifikat tayyorlanmoqda…
            </div>
          )}
        </div>
      </div>
    </>
  )
}
