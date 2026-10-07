import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import api from '../api/client'
import Layout from '../components/Layout'
import Icon from '../components/Icon'
import PageHeader from '../components/PageHeader'

const css = `
  .ct-wrap { padding-bottom: 90px; }
  .ct-hero { padding: 46px 0 26px; }
  .ct-hero h1 { font-size: 38px; letter-spacing: -0.035em; margin-top: 8px; }
  .ct-hero p { color: var(--text-3); font-size: 16px; margin-top: 10px; max-width: 540px; }

  .ct-grid { display: grid; grid-template-columns: 1.35fr 1fr; gap: 28px; align-items: start; }

  .ct-form { background: var(--white); border: 1px solid var(--border); border-radius: 20px; padding: 30px 32px; }
  .ct-form h2 { font-size: 20px; letter-spacing: -0.02em; margin-bottom: 4px; }
  .ct-form .sub { font-size: 13.5px; color: var(--text-3); margin-bottom: 22px; }
  .ct-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }

  .ct-aside { display: flex; flex-direction: column; gap: 16px; }
  .ct-info { background: var(--white); border: 1px solid var(--border); border-radius: 20px; overflow: hidden; }
  .ct-info-top { padding: 20px 22px; background:
      radial-gradient(120% 130% at 90% -20%, var(--green-100), transparent 55%),
      linear-gradient(135deg, var(--green-50), var(--white)); border-bottom: 1px solid var(--border-2); }
  .ct-info-top .t { font-weight: 700; font-size: 16px; letter-spacing: -0.02em; }
  .ct-info-top .d { font-size: 13px; color: var(--text-3); margin-top: 4px; }
  .ct-row { display: flex; align-items: center; gap: 14px; padding: 14px 22px; border-bottom: 1px solid var(--border-2); }
  .ct-row:last-child { border-bottom: none; }
  .ct-row .ic { width: 42px; height: 42px; border-radius: 12px; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center; }
  .ct-row .lbl { font-size: 11.5px; color: var(--text-4); font-family: var(--font-mono);
    text-transform: uppercase; letter-spacing: 0.08em; }
  .ct-row .val { font-size: 14.5px; font-weight: 500; color: var(--text); margin-top: 2px; }
  .ct-row .val a:hover { color: var(--green-700); }

  .ct-socials { display: flex; gap: 8px; flex-wrap: wrap; padding: 16px 22px 18px; }
  .ct-social { display: inline-flex; align-items: center; gap: 7px; padding: 9px 14px; border-radius: 999px;
    border: 1px solid var(--border); font-size: 13px; font-weight: 540; color: var(--text-2); transition: all .15s; }
  .ct-social:hover { border-color: var(--green-300); background: var(--green-50); color: var(--green-700); }

  .ct-map { border: 1px solid var(--border); border-radius: 20px; overflow: hidden; height: 220px; background: var(--bg-soft); }
  .ct-map iframe { width: 100%; height: 100%; border: 0; display: block; filter: saturate(.9); }

  .ct-faq { background: var(--white); border: 1px solid var(--border); border-radius: 20px; padding: 22px 24px; margin-top: 28px; }
  .ct-faq h3 { font-size: 17px; letter-spacing: -0.02em; margin-bottom: 14px; }
  .ct-faq details { border-bottom: 1px solid var(--border-2); padding: 12px 0; }
  .ct-faq details:last-child { border-bottom: none; }
  .ct-faq summary { font-size: 14.5px; font-weight: 560; cursor: pointer; list-style: none;
    display: flex; align-items: center; justify-content: space-between; gap: 12px; }
  .ct-faq summary::-webkit-details-marker { display: none; }
  .ct-faq summary .chev { color: var(--text-4); transition: transform .2s; }
  .ct-faq details[open] summary .chev { transform: rotate(180deg); }
  .ct-faq .ans { font-size: 13.5px; color: var(--text-3); line-height: 1.6; margin-top: 8px; }

  @media (max-width: 900px) {
    .ct-grid { grid-template-columns: 1fr; }
    .ct-hero h1 { font-size: 30px; }
  }
  @media (max-width: 520px) { .ct-2 { grid-template-columns: 1fr; } }
`

const FAQ = [
  { q: 'Kurslar pullikmi yoki bepulmi?', a: "Hozircha barcha kurslar bepul. Pullik kurslar kelajakda qo'shilishi mumkin." },
  { q: 'Sertifikat qanday olinadi?', a: "Kursni to'liq tugatib, testlardan o'tganingizdan so'ng sertifikat avtomatik beriladi va uni tekshirish mumkin." },
  { q: "O'qituvchi bo'lib qo'shilsam bo'ladimi?", a: "Albatta! Ro'yxatdan o'ting va biz bilan bog'laning — arizangizni ko'rib chiqamiz." },
]

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' })
  const [busy, setBusy] = useState(false)

  const { data: s = {} } = useQuery({
    queryKey: ['site-settings'],
    queryFn: () => api.get('/admin/settings/').then(r => r.data).catch(() => ({})),
  })

  const socials = [
    s.telegram_url && { url: s.telegram_url, icon: 'message', label: 'Telegram' },
    s.instagram_url && { url: s.instagram_url, icon: 'instagram', label: 'Instagram' },
    s.youtube_url && { url: s.youtube_url, icon: 'youtube', label: 'YouTube' },
    s.facebook_url && { url: s.facebook_url, icon: 'globe', label: 'Facebook' },
  ].filter(Boolean)

  const address = s.address || "Toshkent shahri, O'zbekiston"

  async function submit(e) {
    e.preventDefault()
    setBusy(true)
    try {
      await api.post('/contact/', form)
      toast.success('Xabaringiz yuborildi! Tez orada javob beramiz.')
      setForm({ name: '', email: '', subject: '', message: '' })
    } catch { toast.error("Xatolik. Qayta urinib ko'ring") }
    finally { setBusy(false) }
  }

  return (
    <Layout>
      <style>{css}</style>
      <div className="container ct-wrap">
        <PageHeader eyebrow="Aloqa" title="Biz bilan bog'laning"
          subtitle="Savol, taklif yoki hamkorlik bo'yicha murojaatlaringizni yuboring — odatda 24 soat ichida javob beramiz." />

        <div className="ct-grid">
          {/* Form */}
          <form onSubmit={submit} className="ct-form">
            <h2>Xabar yuborish</h2>
            <div className="sub">Quyidagi shaklni to'ldiring, tez orada bog'lanamiz.</div>
            <div className="ct-2">
              <div className="field">
                <label className="label">Ismingiz</label>
                <input className="input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="To'liq ismingiz" required />
              </div>
              <div className="field">
                <label className="label">Email</label>
                <input className="input" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="email@misol.uz" required />
              </div>
            </div>
            <div className="field">
              <label className="label">Mavzu</label>
              <input className="input" value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} placeholder="Murojaat mavzusi" required />
            </div>
            <div className="field">
              <label className="label">Xabar</label>
              <textarea className="textarea" rows={6} value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} placeholder="Xabaringizni batafsil yozing…" required />
            </div>
            <button className="btn btn-primary btn-lg btn-block" disabled={busy}>
              {busy ? 'Yuborilmoqda…' : 'Xabarni yuborish'} <Icon name="send" size={15} />
            </button>
          </form>

          {/* Info */}
          <aside className="ct-aside">
            <div className="ct-info">
              <div className="ct-info-top">
                <div className="t">To'g'ridan-to'g'ri aloqa</div>
                <div className="d">Bizga quyidagi orqali ham murojaat qilishingiz mumkin</div>
              </div>
              <div className="ct-row">
                <div className="ic tone-green"><Icon name="mail" size={19} /></div>
                <div><div className="lbl">Email</div><div className="val"><a href={`mailto:${s.contact_email || 'info@ionedu.uz'}`}>{s.contact_email || 'info@ionedu.uz'}</a></div></div>
              </div>
              {s.contact_phone && (
                <div className="ct-row">
                  <div className="ic tone-blue"><Icon name="phone" size={19} /></div>
                  <div><div className="lbl">Telefon</div><div className="val"><a href={`tel:${s.contact_phone.replace(/\s/g, '')}`}>{s.contact_phone}</a></div></div>
                </div>
              )}
              <div className="ct-row">
                <div className="ic tone-amber"><Icon name="mapPin" size={19} /></div>
                <div><div className="lbl">Manzil</div><div className="val">{address}</div></div>
              </div>
              <div className="ct-row">
                <div className="ic tone-gray"><Icon name="clock" size={19} /></div>
                <div><div className="lbl">Ish vaqti</div><div className="val">Du–Ju · 9:00–18:00</div></div>
              </div>
              {socials.length > 0 && (
                <div className="ct-socials">
                  {socials.map(soc => (
                    <a key={soc.label} href={soc.url} target="_blank" rel="noreferrer" className="ct-social">
                      <Icon name={soc.icon} size={15} /> {soc.label}
                    </a>
                  ))}
                </div>
              )}
            </div>

            <div className="ct-map">
              <iframe
                title="Xarita"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                src={`https://www.google.com/maps?q=${encodeURIComponent(address)}&output=embed`}
              />
            </div>
          </aside>
        </div>

        <div className="ct-faq">
          <h3>Ko'p so'raladigan savollar</h3>
          {FAQ.map((f, i) => (
            <details key={i}>
              <summary>{f.q} <Icon name="chevD" size={16} className="chev" /></summary>
              <div className="ans">{f.a}</div>
            </details>
          ))}
        </div>
      </div>
    </Layout>
  )
}
