import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import api, { absUrl } from '../api/client'
import Layout from '../components/Layout'
import Icon from '../components/Icon'
import CertificateView from '../components/CertificateView'

const styles = `
  .cert-page { max-width: 1000px; margin: 40px auto; padding: 0 24px 70px; }
  .cert-actions { display: flex; justify-content: space-between; align-items: center; margin-bottom: 22px; flex-wrap: wrap; gap: 14px; }
  .cert-verify { margin-top: 22px; padding: 16px 20px; background: var(--white); border: 1px solid var(--border); border-radius: 14px; display: flex; align-items: center; gap: 14px; font-size: 13px; }
`

export default function CertificatePublic() {
  const { uuid } = useParams()
  const { data: cert, isLoading } = useQuery({
    queryKey: ['certificate', uuid],
    queryFn: () => api.get(`/certificates/${uuid}/`).then(r => r.data),
  })

  if (isLoading) return <Layout><div className="loading-state"><span className="spinner" />Sertifikat yuklanmoqda…</div></Layout>
  if (!cert) return <Layout><div style={{ padding: 80, textAlign: 'center' }}>Sertifikat topilmadi</div></Layout>

  function copyVerify() {
    const url = `${window.location.origin}/verify/${cert.unique_id}`
    navigator.clipboard?.writeText(url)
      .then(() => toast.success('Tekshirish havolasi nusxalandi'))
      .catch(() => {})
  }

  return (
    <Layout>
      <style>{styles}</style>
      <div className="cert-page">
        <div className="cert-actions">
          <div>
            <h1 style={{ fontSize: 24 }}>Sertifikat #{cert.short_id}</h1>
            <div style={{ fontSize: 13, color: 'var(--text-3)' }}>
              {cert.course_title} · Berilgan sana: {new Date(cert.issued_at).toLocaleDateString('uz-UZ')}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
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
        <div className="fade-up">
          <CertificateView cert={cert} />
        </div>

        <div className="cert-verify">
          <span style={{ width: 36, height: 36, borderRadius: 999, background: 'var(--green-50)', color: 'var(--green-600)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Icon name="shield" size={18} />
          </span>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600 }}>Bu sertifikat haqiqiy va tasdiqlangan</div>
            <div style={{ color: 'var(--text-3)', fontSize: 12, marginTop: 2 }}>
              ID: {cert.short_id} · QR kodni skanerlab yoki ushbu havola orqali istalgan vaqtda tekshirish mumkin
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
