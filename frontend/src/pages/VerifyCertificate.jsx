import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import api, { absUrl } from '../api/client'
import Layout from '../components/Layout'
import Icon from '../components/Icon'

export default function VerifyCertificate() {
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState(null) // null | { ok, cert? , error? }
  const navigate = useNavigate()

  function normalize(input) {
    // Strip any URL prefix; keep the meaningful ID part (UUID or IND-YYYY-XXXXXX)
    return input.trim()
      .replace(/^https?:\/\/[^/]+/i, '')
      .replace(/^.*\/verify\//i, '')
      .replace(/^.*\/certificate\//i, '')
      .replace(/\/$/, '')
      .trim()
  }

  async function submit(e) {
    e?.preventDefault()
    const id = normalize(code)
    if (!id) { toast.error('Sertifikat ID kiriting'); return }
    setBusy(true); setResult(null)
    try {
      // Server accepts both full UUID and short_id (IND-YYYY-XXXXXX)
      const { data } = await api.get(`/certificates/verify/?id=${encodeURIComponent(id)}`)
      setResult({ ok: true, cert: data })
    } catch (e) {
      const status = e.response?.status
      const msg = status === 404 ? "Sertifikat topilmadi" : "Tekshirib bo'lmadi"
      setResult({ ok: false, error: msg })
    } finally { setBusy(false) }
  }

  return (
    <Layout>
      <div className="container">
        <div className="page-head">
          <div className="breadcrumb">
            <Link to="/">Bosh sahifa</Link><span className="sep">/</span><span>Sertifikat tekshirish</span>
          </div>
          <h1 className="page-title" style={{ textAlign: 'center', marginTop: 12 }}>Sertifikatni tasdiqlash</h1>
          <p className="text-muted mt-2" style={{ textAlign: 'center', maxWidth: 580, margin: '8px auto 0' }}>
            Sertifikat ID raqami yoki to'liq havolasini kiriting — biz uning haqiqiyligini darhol tekshiramiz
          </p>
        </div>

        <div style={{ maxWidth: 640, margin: '36px auto 80px' }}>
          <form onSubmit={submit} className="card" style={{ padding: 24 }}>
            <label className="label" style={{ fontWeight: 600 }}>Sertifikat ID yoki havola</label>
            <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <Icon name="shield" size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)' }} />
                <input className="input" autoFocus
                  value={code} onChange={e => setCode(e.target.value)}
                  placeholder="IND-2026-08841 yoki to'liq UUID"
                  style={{ height: 48, paddingLeft: 42, fontSize: 15 }} />
              </div>
              <button className="btn btn-primary" disabled={busy} style={{ height: 48, paddingLeft: 22, paddingRight: 22 }}>
                {busy ? 'Tekshirilmoqda…' : 'Tekshirish'}
              </button>
            </div>
            <div className="text-xs text-muted mt-3">
              Sertifikatdagi pastdagi qatorda ID yozilgan bo'ladi (masalan, <code>ID: IND-2026-08841</code>).
            </div>
          </form>

          {/* Result */}
          {result && result.ok && (
            <div className="card fade-up" style={{
              marginTop: 20, padding: 28,
              border: '1px solid var(--green-300)', background: 'linear-gradient(135deg, var(--green-50), var(--white))',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
                <div style={{
                  width: 56, height: 56, borderRadius: 999,
                  background: 'var(--green-600)', color: 'white',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 8px 20px -6px rgba(14,131,69,0.4)',
                }}>
                  <Icon name="checkC" size={28} />
                </div>
                <div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, color: 'var(--green-700)' }}>
                    Sertifikat haqiqiy ✓
                  </div>
                  <div className="text-sm text-muted">Ionedu tomonidan rasman berilgan</div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 12 }}>
                <Row label="O'quvchi" value={result.cert.student?.display_name} />
                <Row label="Kurs" value={result.cert.course_title} />
                <Row label="O'qituvchi" value={result.cert.teacher_name} />
                <Row label="Berilgan sana" value={new Date(result.cert.issued_at).toLocaleDateString('uz-UZ')} />
                <Row label="Natija" value={`${Math.round(result.cert.score_percent)}%`} />
                <Row label="ID" value={result.cert.short_id} mono />
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 22, flexWrap: 'wrap' }}>
                <button className="btn btn-primary"
                  onClick={() => navigate(`/certificate/${result.cert.unique_id}`)}>
                  <Icon name="eye" size={14} /> To'liq ko'rish
                </button>
                {result.cert.pdf_file && (
                  <a href={absUrl(result.cert.pdf_file)} download target="_blank" rel="noreferrer" className="btn btn-secondary">
                    <Icon name="download" size={14} /> PDF yuklab olish
                  </a>
                )}
              </div>
            </div>
          )}

          {result && !result.ok && (
            <div className="card fade-up" style={{
              marginTop: 20, padding: 28, textAlign: 'center',
              border: '1px solid var(--red-600)', background: 'var(--red-50)',
            }}>
              <div style={{
                width: 56, height: 56, borderRadius: 999, background: 'var(--red-600)', color: 'white',
                display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px',
              }}>
                <Icon name="x" size={28} />
              </div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, color: 'var(--red-600)' }}>
                Sertifikat topilmadi
              </div>
              <div className="text-sm text-muted mt-2">
                Bunday sertifikat tizimda mavjud emas. ID ni qaytadan tekshirib ko'ring.
              </div>
            </div>
          )}

          {/* Info bottom */}
          <div className="card" style={{ marginTop: 28, padding: 20, background: 'var(--bg-soft)', border: 'none' }}>
            <div style={{ display: 'flex', gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--green-50)', color: 'var(--green-600)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon name="shield" size={18} />
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>Sertifikat qanday tekshiriladi?</div>
                <div className="text-sm text-muted">
                  Ionedu da har bir sertifikat <strong>noyob UUID</strong> bilan yaratiladi.
                  ID ni kiriting — biz uni bazadan topib, kim, qaysi kurs uchun, qachon olganini ko'rsatamiz.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}

function Row({ label, value, mono }) {
  return (
    <div style={{ background: 'var(--white)', padding: 14, borderRadius: 10, border: '1px solid var(--border)' }}>
      <div style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 15, fontWeight: 600, fontFamily: mono ? 'var(--font-display)' : 'inherit', wordBreak: 'break-word' }}>
        {value || '—'}
      </div>
    </div>
  )
}
