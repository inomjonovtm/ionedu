import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import api, { absUrl } from '../api/client'
import Layout from '../components/Layout'
import Icon from '../components/Icon'

const css = `
  .vc-page { padding-top: 30px; padding-bottom: 90px; }
  .vc-grid { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1.05fr); gap: 56px; align-items: start; margin-top: 26px; }
  .vc-intro h1 { font-family: var(--font-display); font-size: 56px; font-weight: 800; letter-spacing: -.045em; line-height: 1; margin-top: 16px; }
  .vc-intro > p { font-size: 16px; color: var(--text-3); line-height: 1.6; margin-top: 18px; max-width: 460px; }
  .vc-steps { list-style: none; padding: 0; margin: 34px 0 0; display: flex; flex-direction: column; }
  .vc-steps li { display: grid; grid-template-columns: 46px minmax(0, 1fr); gap: 16px; padding: 16px 0; border-top: 1.5px dashed var(--border); align-items: start; }
  .vc-steps .n { width: 46px; height: 46px; border-radius: 14px; border: 1.5px solid var(--line); display: flex; align-items: center; justify-content: center; font-family: var(--font-mono); font-weight: 700; font-size: 14px; color: #14213D; }
  .vc-steps li:nth-child(1) .n { background: var(--sun); transform: rotate(-4deg); }
  .vc-steps li:nth-child(2) .n { background: #9DBDFF; transform: rotate(3deg); }
  .vc-steps li:nth-child(3) .n { background: #8FE0B4; transform: rotate(-2deg); }
  .vc-steps b { display: block; font-family: var(--font-display); font-size: 16.5px; font-weight: 700; letter-spacing: -.02em; color: var(--text); }
  .vc-steps span { display: block; font-size: 13.5px; color: var(--text-3); line-height: 1.55; margin-top: 3px; }

  .vc-side { display: flex; flex-direction: column; gap: 20px; min-width: 0; }
  .vc-check { background: var(--white); border: 2px solid var(--line); border-radius: var(--r-card); box-shadow: var(--hard-lg); overflow: hidden; }
  .vc-check-top { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 14px 22px; background-color: var(--ink); background-image: var(--topo); background-size: 520px 360px; color: #fff; font-family: var(--font-mono); font-size: 11px; letter-spacing: .14em; text-transform: uppercase; }
  .vc-check-top i { width: 10px; height: 10px; border-radius: 999px; background: var(--sun); display: inline-block; }
  .vc-check-body { padding: 24px 22px; }
  .vc-input { position: relative; margin-top: 8px; }
  .vc-input svg { position: absolute; left: 15px; top: 50%; transform: translateY(-50%); color: var(--text-3); }
  .vc-input .input { height: 54px; padding-left: 44px; font-size: 15.5px; font-family: var(--font-mono); }
  .vc-check-body .btn { margin-top: 12px; }
  .vc-hint { font-size: 12.5px; color: var(--text-3); margin-top: 14px; line-height: 1.55; }
  .vc-hint code { font-family: var(--font-mono); font-size: 11.5px; background: var(--bg-soft); border: 1.5px solid var(--border); padding: 2px 6px; border-radius: 6px; color: var(--text-2); }

  .vc-ok { position: relative; background: var(--white); border: 2px solid var(--line); border-radius: var(--r-card); padding: 24px 22px; }
  .vc-ok-head { display: flex; align-items: center; gap: 14px; padding-right: 96px; min-height: 64px; }
  .vc-ok-head .ic { width: 52px; height: 52px; border-radius: 16px; background: var(--green-600); color: #fff; border: 1.5px solid var(--line); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .vc-ok-head .t { font-family: var(--font-display); font-size: 23px; font-weight: 800; letter-spacing: -.03em; color: var(--text); line-height: 1.15; }
  .vc-ok-head .s { font-size: 13px; color: var(--text-3); margin-top: 3px; }
  .vc-stamp { position: absolute; top: 16px; right: 16px; width: 84px; height: 84px; border-radius: 999px; border: 2.5px dashed var(--green-600); color: var(--green-600); display: flex; align-items: center; justify-content: center; text-align: center; font-family: var(--font-mono); font-size: 10px; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; line-height: 1.3; transform: rotate(12deg); }
  .vc-rows { margin-top: 18px; display: grid; grid-template-columns: 1fr 1fr; column-gap: 22px; }
  .vc-row { padding: 12px 0; border-top: 1.5px dashed var(--border); min-width: 0; }
  .vc-row .k { font-family: var(--font-mono); font-size: 10px; letter-spacing: .1em; text-transform: uppercase; color: var(--text-4); margin-bottom: 4px; }
  .vc-row .v { font-size: 15px; font-weight: 700; color: var(--text); word-break: break-word; }
  .vc-row .v.mono { font-family: var(--font-mono); font-size: 13.5px; }
  .vc-ok-actions { display: flex; gap: 10px; flex-wrap: wrap; margin-top: 18px; padding-top: 18px; border-top: 1.5px dashed var(--border); }

  .vc-bad { display: grid; grid-template-columns: 52px minmax(0, 1fr); gap: 14px; align-items: center; background: var(--coral-soft); border: 2px solid var(--line); border-radius: var(--r-card); padding: 22px; }
  .vc-bad .ic { width: 52px; height: 52px; border-radius: 16px; background: var(--coral); color: #14213D; border: 1.5px solid var(--line); display: flex; align-items: center; justify-content: center; transform: rotate(-5deg); }
  .vc-bad .t { font-family: var(--font-display); font-size: 20px; font-weight: 800; letter-spacing: -.03em; color: var(--text); }
  .vc-bad .s { font-size: 13.5px; color: var(--text-2); margin-top: 4px; line-height: 1.5; }

  @media (max-width: 900px) {
    .vc-grid { grid-template-columns: minmax(0, 1fr); gap: 30px; }
    .vc-intro h1 { font-size: 40px; }
    .vc-steps { margin-top: 22px; }
  }
  @media (max-width: 768px) {
    .vc-page { padding-top: 18px; padding-bottom: 64px; }
    .vc-intro h1 { font-size: 34px; }
    .vc-check { box-shadow: var(--hard); }
    .vc-check-body { padding: 18px 16px; }
    .vc-ok { padding: 18px 16px; }
    .vc-ok-head { padding-right: 0; }
    .vc-stamp { display: none; }
    .vc-rows { grid-template-columns: minmax(0, 1fr); }
    .vc-ok-actions .btn { flex: 1; }
  }
`

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
      <style>{css}</style>
      <div className="container vc-page">
        <div className="breadcrumb">
          <Link to="/">Bosh sahifa</Link><span className="sep">/</span><span>Sertifikat tekshirish</span>
        </div>

        <div className="vc-grid">
          <div className="vc-intro fade-up">
            <span className="eyebrow">Nazorat punkti</span>
            <h1>Sertifikatni <span className="mark-leaf">tasdiqlash</span></h1>
            <p>Sertifikat ID raqami yoki to'liq havolasini kiriting — biz uning haqiqiyligini darhol tekshiramiz.</p>

            <ol className="vc-steps">
              <li>
                <span className="n">01</span>
                <div><b>ID ni toping</b><span>Sertifikatning pastki qatorida yozilgan yoki QR kod ichida bo'ladi.</span></div>
              </li>
              <li>
                <span className="n">02</span>
                <div><b>Shu yerga kiriting</b><span>Qisqa ID, to'liq UUID yoki butun havola — hammasi mos keladi.</span></div>
              </li>
              <li>
                <span className="n">03</span>
                <div><b>Natijani ko'ring</b><span>Ionedu da har bir sertifikat <strong>noyob UUID</strong> bilan yaratiladi: kim, qaysi kurs uchun, qachon olganini ko'rsatamiz.</span></div>
              </li>
            </ol>
          </div>

          <div className="vc-side fade-up fade-up-d1">
            <form onSubmit={submit} className="vc-check">
              <div className="vc-check-top"><span>Tekshiruv oynasi</span><i /></div>
              <div className="vc-check-body">
                <label className="label">Sertifikat ID yoki havola</label>
                <div className="vc-input">
                  <Icon name="shield" size={18} />
                  <input className="input" autoFocus
                    value={code} onChange={e => setCode(e.target.value)}
                    placeholder="IND-2026-08841 yoki to'liq UUID" />
                </div>
                <button className="btn btn-primary btn-lg btn-block" disabled={busy}>
                  {busy ? 'Tekshirilmoqda…' : <>Tekshirish <Icon name="arrowR" size={16} /></>}
                </button>
                <div className="vc-hint">
                  Sertifikatdagi pastdagi qatorda ID yozilgan bo'ladi (masalan, <code>ID: IND-2026-08841</code>).
                </div>
              </div>
            </form>

            {/* Result */}
            {result && result.ok && (
              <div className="vc-ok fade-up">
                <div className="vc-stamp" aria-hidden="true">Ionedu<br />haqiqiy</div>
                <div className="vc-ok-head">
                  <div className="ic"><Icon name="checkC" size={26} /></div>
                  <div>
                    <div className="t">Sertifikat haqiqiy</div>
                    <div className="s">Ionedu tomonidan rasman berilgan</div>
                  </div>
                </div>

                <div className="vc-rows">
                  <Row label="O'quvchi" value={result.cert.student?.display_name} />
                  <Row label="Kurs" value={result.cert.course_title} />
                  <Row label="O'qituvchi" value={result.cert.teacher_name} />
                  <Row label="Berilgan sana" value={new Date(result.cert.issued_at).toLocaleDateString('uz-UZ')} />
                  <Row label="Natija" value={`${Math.round(result.cert.score_percent)}%`} />
                  <Row label="ID" value={result.cert.short_id} mono />
                </div>

                <div className="vc-ok-actions">
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
              <div className="vc-bad fade-up">
                <div className="ic"><Icon name="x" size={26} /></div>
                <div>
                  <div className="t">{result.error || 'Sertifikat topilmadi'}</div>
                  <div className="s">
                    Bunday sertifikat tizimda mavjud emas. ID ni qaytadan tekshirib ko'ring.
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}

function Row({ label, value, mono }) {
  return (
    <div className="vc-row">
      <div className="k">{label}</div>
      <div className={`v ${mono ? 'mono' : ''}`}>{value || '—'}</div>
    </div>
  )
}
