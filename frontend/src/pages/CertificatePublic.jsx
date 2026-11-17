import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import api, { absUrl } from '../api/client'
import Layout from '../components/Layout'
import Icon from '../components/Icon'
import CertificateView from '../components/CertificateView'

const styles = `
  .cp-min { min-width: 0; }
  .cp-grow { flex: 1; }
  .cp-page { max-width: 1080px; margin: 0 auto; padding: 40px 28px 90px; }
  .cp-head { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 24px; align-items: end; margin-bottom: 28px; }
  .cp-head h1 { font-family: var(--font-display); font-size: 48px; font-weight: 800; letter-spacing: -.045em; line-height: 1.02; margin-top: 14px; overflow-wrap: anywhere; }
  .cp-meta { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 16px; }
  .cp-meta span { display: inline-flex; align-items: center; gap: 7px; padding: 6px 12px; border-radius: 999px; border: 1.5px solid var(--border); background: var(--white); font-size: 13px; font-weight: 600; color: var(--text-2); max-width: 100%; }
  .cp-meta span svg { color: var(--text-3); flex-shrink: 0; }
  .cp-actions { display: flex; gap: 8px; flex-wrap: wrap; justify-content: flex-end; }

  .cp-stage { position: relative; padding: 28px; border: 2px solid var(--line); border-radius: var(--r-card); box-shadow: var(--hard-lg); background-color: var(--bg-soft); background-image: var(--topo); background-size: 520px 360px; }
  .cp-stage .tape { position: absolute; top: -13px; width: 86px; height: 26px; background: var(--sun); border: 1.5px solid var(--line); z-index: 1; }
  .cp-stage .tape.l { left: 44px; transform: rotate(-5deg); }
  .cp-stage .tape.r { right: 44px; transform: rotate(4deg); background: #FF9D88; }

  .cp-verify { margin-top: 30px; display: grid; grid-template-columns: auto minmax(0, 1fr) auto; gap: 20px; align-items: center; padding: 22px 24px; background: var(--ink); color: #fff; border-radius: var(--r-card); }
  .cp-seal { width: 78px; height: 78px; border-radius: 999px; background: #8FE0B4; color: #14213D; border: 2px dashed #14213D; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 2px; transform: rotate(-8deg); flex-shrink: 0; }
  .cp-seal small { font-family: var(--font-mono); font-size: 8px; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; }
  .cp-verify .t { font-family: var(--font-display); font-size: 20px; font-weight: 800; letter-spacing: -.03em; color: #fff; }
  .cp-verify .s { font-size: 13px; color: #B7C0D8; margin-top: 5px; line-height: 1.55; }
  .cp-verify .id { font-family: var(--font-mono); font-size: 12px; letter-spacing: .08em; color: var(--sun); margin-top: 8px; overflow-wrap: anywhere; }
  .cp-none { max-width: 520px; margin: 60px auto; background: var(--white); border: 1.5px dashed var(--border); border-radius: var(--r-card); }

  @media (max-width: 768px) {
    .cp-page { padding: 24px 16px 64px; }
    .cp-head { grid-template-columns: minmax(0, 1fr); gap: 18px; }
    .cp-head h1 { font-size: 32px; }
    .cp-actions { justify-content: flex-start; }
    .cp-actions .btn { flex: 1; }
    .cp-stage { padding: 10px; box-shadow: var(--hard); }
    .cp-stage .tape { display: none; }
    .cp-verify { grid-template-columns: auto minmax(0, 1fr); padding: 18px; gap: 14px; }
    .cp-verify .btn { grid-column: 1 / -1; }
    .cp-seal { width: 60px; height: 60px; }
  }
`

export default function CertificatePublic() {
  const { uuid } = useParams()
  const { data: cert, isLoading } = useQuery({
    queryKey: ['certificate', uuid],
    queryFn: () => api.get(`/certificates/${uuid}/`).then(r => r.data),
  })

  if (isLoading) return <Layout><div className="loading-state"><span className="spinner" />Sertifikat yuklanmoqda…</div></Layout>
  if (!cert) return (
    <Layout>
      <style>{styles}</style>
      <div className="cp-page">
        <div className="cp-none">
          <div className="empty-state">
            <div className="es-ico"><Icon name="award" size={24} /></div>
            <div className="es-title">Sertifikat topilmadi</div>
          </div>
        </div>
      </div>
    </Layout>
  )

  function copyVerify() {
    const url = `${window.location.origin}/verify/${cert.unique_id}`
    navigator.clipboard?.writeText(url)
      .then(() => toast.success('Tekshirish havolasi nusxalandi'))
      .catch(() => {})
  }

  return (
    <Layout>
      <style>{styles}</style>
      <div className="cp-page">
        <div className="cp-head fade-up">
          <div>
            <span className="eyebrow">Rasmiy hujjat</span>
            <h1>Sertifikat <span className="mark-sun">#{cert.short_id}</span></h1>
            <div className="cp-meta">
              <span><Icon name="book" size={14} /> {cert.course_title}</span>
              <span><Icon name="calendar" size={14} /> Berilgan sana: {new Date(cert.issued_at).toLocaleDateString('uz-UZ')}</span>
            </div>
          </div>
          <div className="cp-actions">
            <button className="btn btn-secondary" onClick={copyVerify}>
              <Icon name="link" size={14} /> Havolani nusxalash
            </button>
            {cert.pdf_file && (
              <a href={absUrl(cert.pdf_file)} download target="_blank" rel="noreferrer" className="btn btn-primary">
                <Icon name="download" size={14} /> PDF yuklab olish
              </a>
            )}
          </div>
        </div>

        {/* Saytdagi ko'rinish endi PDF bilan aynan bir xil */}
        <div className="cp-stage fade-up fade-up-d1">
          <span className="tape l" aria-hidden="true" />
          <span className="tape r" aria-hidden="true" />
          <CertificateView cert={cert} />
        </div>

        <div className="cp-verify">
          <div className="cp-seal" aria-hidden="true">
            <Icon name="shield" size={24} />
            <small>Haqiqiy</small>
          </div>
          <div className="cp-min">
            <div className="t">Bu sertifikat haqiqiy va tasdiqlangan</div>
            <div className="s">QR kodni skanerlab yoki ushbu havola orqali istalgan vaqtda tekshirish mumkin</div>
            <div className="id">ID: {cert.short_id}</div>
          </div>
          <button className="btn btn-accent" onClick={copyVerify}>
            <Icon name="link" size={14} /> Nusxalash
          </button>
        </div>
      </div>
    </Layout>
  )
}
