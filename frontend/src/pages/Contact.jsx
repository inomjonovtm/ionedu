import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import api from '../api/client'
import Layout from '../components/Layout'
import Icon from '../components/Icon'

const css = `
  .ct { overflow-x: clip; padding-bottom: 104px; }

  /* ── Header ── */
  .ct-hero { padding: 56px 0 48px; display: flex; align-items: flex-end; justify-content: space-between; gap: 32px; flex-wrap: wrap; }
  .ct-kick { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; margin-bottom: 22px; }
  .ct-hero h1 { font-family: var(--font-display); font-weight: 800; font-size: clamp(38px, 5.6vw, 68px); line-height: 1; letter-spacing: -0.045em; }
  .ct-hero p { color: var(--text-2); font-size: 17px; line-height: 1.65; max-width: 380px; font-weight: 500; }
  .ct-hero p b { color: var(--text); font-weight: 800; }

  /* ── Main split ── */
  .ct-grid { display: grid; grid-template-columns: minmax(0, 5fr) minmax(0, 6fr); gap: 44px; align-items: start; }

  /* channels: colour tiles */
  .ct-tiles { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
  .ct-tile {
    display: flex; flex-direction: column; justify-content: space-between; gap: 26px; min-height: 150px;
    padding: 18px; border-radius: 22px; border: 2px solid var(--line); color: #14213D; min-width: 0;
    transition: transform .16s ease, box-shadow .16s ease;
  }
  a.ct-tile:hover { transform: translate(-2px, -2px); box-shadow: var(--hard); }
  .ct-tile.sun { background: var(--sun); } .ct-tile.sea { background: #9DBDFF; }
  .ct-tile.leaf { background: #8FE0B4; } .ct-tile.coral { background: #FF9D88; }
  .ct-tile.wide { grid-column: 1 / -1; min-height: 0; flex-direction: row; align-items: center; justify-content: flex-start; gap: 16px; }
  .ct-tile .ic {
    width: 40px; height: 40px; border-radius: 13px; background: #fff; border: 2px solid #14213D; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
  }
  .ct-tile .lbl { font-family: var(--font-mono); font-size: 10.5px; letter-spacing: .1em; text-transform: uppercase; font-weight: 600; opacity: .75; }
  .ct-tile .val { font-family: var(--font-display); font-size: 18px; font-weight: 800; letter-spacing: -0.03em; line-height: 1.2; margin-top: 4px; overflow-wrap: anywhere; }

  .ct-socials { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 18px; align-items: center; }
  .ct-socials .coord { margin-right: 4px; }
  .ct-social {
    display: inline-flex; align-items: center; gap: 7px; height: 38px; padding: 0 14px; border-radius: 999px;
    background: var(--white); border: 1.5px solid var(--line); font-size: 13.5px; font-weight: 700; color: var(--text);
    transition: transform .14s ease, box-shadow .14s ease, background .14s ease;
  }
  .ct-social:hover { transform: translate(-1px, -1px); box-shadow: var(--hard-sm); background: var(--sun); color: #14213D; }

  .ct-map { position: relative; margin-top: 22px; border: 2px solid var(--line); border-radius: 22px; overflow: hidden; height: 250px; background: var(--bg-soft); }
  .ct-map iframe { width: 100%; height: 100%; border: 0; display: block; }
  .ct-map .tag {
    position: absolute; left: 12px; top: 12px; display: inline-flex; align-items: center; gap: 8px;
    background: var(--white); border: 2px solid var(--line); border-radius: 999px; padding: 5px 12px 5px 9px;
    box-shadow: var(--hard-sm); pointer-events: none;
  }
  .ct-map .tag::before { content: ''; width: 10px; height: 10px; border-radius: 999px 999px 999px 0; transform: rotate(-45deg); background: var(--coral); }
  .ct-map .tag .coord { color: var(--text); }

  /* form: postcard */
  .ct-form {
    position: sticky; top: 104px;
    background: var(--white); border: 2px solid var(--line); border-radius: 28px; box-shadow: var(--hard-lg);
    padding: 34px 36px 36px;
  }
  .ct-form-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 20px; padding-bottom: 22px; margin-bottom: 24px; border-bottom: 1.5px dashed var(--border); }
  .ct-form h2 { font-family: var(--font-display); font-size: 30px; font-weight: 800; letter-spacing: -0.04em; line-height: 1.1; }
  .ct-form .sub { font-size: 14.5px; color: var(--text-3); margin-top: 8px; font-weight: 500; }
  .ct-stamp {
    width: 74px; height: 86px; flex-shrink: 0; border: 2px dashed var(--line); border-radius: 10px;
    display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px;
    transform: rotate(5deg); background: var(--sun-soft);
    font-family: var(--font-mono); font-size: 8.5px; letter-spacing: .1em; font-weight: 600; color: var(--text);
  }
  .ct-stamp span { font-size: 30px; line-height: 1; }
  .ct-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
  .ct-form .foot { display: flex; align-items: center; gap: 16px; flex-wrap: wrap; margin-top: 6px; }
  .ct-form .foot .btn { flex: 1 1 220px; }

  /* ── FAQ ── */
  .ct-faq { display: grid; grid-template-columns: minmax(0, 4fr) minmax(0, 8fr); gap: 56px; align-items: start; margin-top: 104px; }
  .ct-faq h2 { font-family: var(--font-display); font-size: clamp(28px, 3.6vw, 42px); font-weight: 800; letter-spacing: -0.04em; line-height: 1.06; margin-top: 16px; }
  .ct-faq .side p { color: var(--text-3); font-size: 16px; line-height: 1.65; margin: 16px 0 24px; font-weight: 500; }
  .ct-faq details { border-top: 2px solid var(--line); }
  .ct-faq details:last-child { border-bottom: 2px solid var(--line); }
  .ct-faq summary {
    display: grid; grid-template-columns: 44px minmax(0, 1fr) auto; align-items: center; gap: 10px;
    padding: 24px 0; cursor: pointer; list-style: none;
    font-family: var(--font-display); font-size: 21px; font-weight: 700; letter-spacing: -0.03em; line-height: 1.25;
  }
  .ct-faq summary::-webkit-details-marker { display: none; }
  .ct-faq summary .chev {
    width: 36px; height: 36px; padding: 8px; border-radius: 12px; border: 2px solid var(--line); color: var(--text);
    transition: transform .2s ease, background .2s ease;
  }
  .ct-faq details[open] summary .chev { transform: rotate(180deg); background: var(--sun); color: #14213D; }
  .ct-faq .ans { font-size: 15.5px; color: var(--text-2); line-height: 1.7; padding: 0 56px 26px 54px; max-width: 680px; font-weight: 500; }

  @media (max-width: 980px) {
    .ct-grid { grid-template-columns: 1fr; gap: 40px; }
    .ct-form { position: static; order: -1; }
    .ct-faq { grid-template-columns: 1fr; gap: 24px; margin-top: 76px; }
  }
  @media (max-width: 768px) {
    .ct { padding-bottom: 76px; }
    .ct-hero { padding: 36px 0 36px; }
    .ct-form { padding: 26px 22px 28px; border-radius: 24px; box-shadow: var(--hard); }
    .ct-form h2 { font-size: 25px; }
    .ct-faq summary { grid-template-columns: 34px minmax(0, 1fr) auto; font-size: 18px; padding: 20px 0; }
    .ct-faq .ans { padding: 0 0 22px 44px; }
  }
  @media (max-width: 520px) {
    .ct-2 { grid-template-columns: 1fr; gap: 0; }
    .ct-stamp { display: none; }
    .ct-tile { min-height: 132px; padding: 14px; border-radius: 18px; }
    .ct-tile .val { font-size: 15.5px; }
  }
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
      <div className="ct">
        <div className="container">

          {/* ── Header ── */}
          <header className="ct-hero fade-up">
            <div>
              <div className="ct-kick">
                <span className="eyebrow">Aloqa</span>
                <span className="coord">41.31°N · 69.24°E</span>
              </div>
              <h1>Biz bilan <span className="mark-sun">bog'laning</span></h1>
            </div>
            <p>
              Savol, taklif yoki hamkorlik bo'yicha murojaatlaringizni yuboring — odatda <b>24 soat ichida</b> javob beramiz.
            </p>
          </header>

          <div className="ct-grid">
            {/* ── Channels ── */}
            <aside className="fade-up-d1">
              <div className="ct-tiles">
                <a className="ct-tile sun" href={`mailto:${s.contact_email || 'info@ionedu.uz'}`}>
                  <span className="ic"><Icon name="mail" size={19} /></span>
                  <div><div className="lbl">Email</div><div className="val">{s.contact_email || 'info@ionedu.uz'}</div></div>
                </a>
                {s.contact_phone ? (
                  <a className="ct-tile sea" href={`tel:${s.contact_phone.replace(/\s/g, '')}`}>
                    <span className="ic"><Icon name="phone" size={19} /></span>
                    <div><div className="lbl">Telefon</div><div className="val">{s.contact_phone}</div></div>
                  </a>
                ) : (
                  <div className="ct-tile sea">
                    <span className="ic"><Icon name="clock" size={19} /></span>
                    <div><div className="lbl">Ish vaqti</div><div className="val">Du–Ju · 9:00–18:00</div></div>
                  </div>
                )}
                <div className={`ct-tile leaf ${s.contact_phone ? '' : 'wide'}`}>
                  <span className="ic"><Icon name="mapPin" size={19} /></span>
                  <div><div className="lbl">Manzil</div><div className="val">{address}</div></div>
                </div>
                {s.contact_phone && (
                  <div className="ct-tile coral">
                    <span className="ic"><Icon name="clock" size={19} /></span>
                    <div><div className="lbl">Ish vaqti</div><div className="val">Du–Ju · 9:00–18:00</div></div>
                  </div>
                )}
              </div>

              {socials.length > 0 && (
                <div className="ct-socials">
                  <span className="coord">IJTIMOIY TARMOQLAR</span>
                  {socials.map(soc => (
                    <a key={soc.label} href={soc.url} target="_blank" rel="noreferrer" className="ct-social">
                      <Icon name={soc.icon} size={15} /> {soc.label}
                    </a>
                  ))}
                </div>
              )}

              <div className="ct-map">
                <iframe
                  title="Xarita"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  src={`https://www.google.com/maps?q=${encodeURIComponent(address)}&output=embed`}
                />
                <span className="tag"><span className="coord">BIZ SHU YERDAMIZ</span></span>
              </div>
            </aside>

            {/* ── Form ── */}
            <form onSubmit={submit} className="ct-form fade-up-d2">
              <div className="ct-form-top">
                <div>
                  <h2>Xabar yuborish</h2>
                  <div className="sub">Quyidagi shaklni to'ldiring, tez orada bog'lanamiz.</div>
                </div>
                <div className="ct-stamp" aria-hidden="true"><span>✉️</span>IONEDU</div>
              </div>
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
              <div className="foot">
                <button className="btn btn-primary btn-lg" disabled={busy}>
                  {busy ? 'Yuborilmoqda…' : 'Xabarni yuborish'} <Icon name="send" size={15} />
                </button>
                <span className="coord">JAVOB ≈ 24 SOAT</span>
              </div>
            </form>
          </div>

          {/* ── FAQ ── */}
          <section className="ct-faq">
            <div className="side">
              <span className="eyebrow">FAQ</span>
              <h2>Ko'p so'raladigan <span className="mark-sea">savollar</span></h2>
              <p>Javobni topa olmadingizmi? Yuqoridagi shakl orqali yozing yoki platforma haqida ko'proq o'qing.</p>
              <Link to="/about" className="btn btn-secondary">Biz haqimizda <Icon name="arrowR" size={14} /></Link>
            </div>
            <div>
              {FAQ.map((f, i) => (
                <details key={i}>
                  <summary>
                    <span className="coord">0{i + 1}</span>
                    <span>{f.q}</span>
                    <Icon name="chevD" size={16} className="chev" />
                  </summary>
                  <div className="ans">{f.a}</div>
                </details>
              ))}
            </div>
          </section>
        </div>
      </div>
    </Layout>
  )
}
