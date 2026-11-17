import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import api from './../api/client'
import Icon from './Icon'
import Logo from './Logo'

const ftCss = `
  .footer { position: relative; overflow: hidden; border-radius: 36px 36px 0 0; }
  .footer::before { content: ''; position: absolute; inset: 0; background-image: var(--topo); background-size: 520px 360px; filter: invert(1); opacity: .5; pointer-events: none; }
  .footer .container { position: relative; }
  .ft-cta {
    display: flex; align-items: center; justify-content: space-between; gap: 24px; flex-wrap: wrap;
    padding-bottom: 44px; margin-bottom: 48px; border-bottom: 1.5px dashed rgba(255,255,255,.16);
  }
  .ft-cta h3 { color: #fff; font-size: clamp(28px, 4vw, 44px); font-weight: 800; letter-spacing: -.04em; max-width: 560px; }
  .ft-cta h3 em { font-style: normal; color: var(--sun); }
  .ft-brand { text-decoration: none; display: inline-flex; }
  .ft-desc { font-size: 14px; color: #8591B0; max-width: 290px; margin-top: 16px; line-height: 1.65; }
  .ft-stats { display: flex; gap: 22px; margin-top: 22px; }
  .ft-stats .num { font-family: var(--font-display); font-size: 22px; font-weight: 800; color: #fff; line-height: 1; letter-spacing: -.03em; }
  .ft-stats .lbl { font-size: 11.5px; color: #8591B0; margin-top: 5px; }
  .footer ul a { display: inline-flex; align-items: center; gap: 8px; }
  .ft-mute { font-size: 13px; color: #8591B0; }
  .ft-coord { font-family: var(--font-mono); font-size: 11px; letter-spacing: .08em; }
`

export default function Footer() {
  const { data: s = {} } = useQuery({
    queryKey: ['site-settings'],
    queryFn: () => api.get('/admin/settings/').then(r => r.data).catch(() => ({})),
  })
  const { data: stats = {} } = useQuery({
    queryKey: ['home-stats'],
    queryFn: () => api.get('/stats/').then(r => r.data).catch(() => ({})),
  })

  const siteName = s.site_name || 'Ionedu'

  return (
    <footer className="footer">
      <style>{ftCss}</style>
      <div className="container">
        <div className="ft-cta">
          <h3>Dunyoni <em>xaritadan</em> emas, bilimdan o'rgan.</h3>
          <Link to="/courses" className="btn btn-accent btn-lg">Kurslarni ko'rish <Icon name="arrowR" size={17} /></Link>
        </div>
        <div className="footer-grid">
          <div>
            <Link to="/" className="ft-brand"><Logo size={36} name={siteName} light /></Link>
            <p className="ft-desc">
              Geografiya o'rganish uchun zamonaviy platforma. O'zbekistondan olamga.
            </p>
            {(stats.students > 0 || stats.courses > 0 || stats.teachers > 0) && (
              <div className="ft-stats">
                {stats.students > 0 && <div><div className="num">{stats.students}+</div><div className="lbl">O'quvchi</div></div>}
                {stats.courses > 0 && <div><div className="num">{stats.courses}+</div><div className="lbl">Kurs</div></div>}
                {stats.teachers > 0 && <div><div className="num">{stats.teachers}+</div><div className="lbl">O'qituvchi</div></div>}
              </div>
            )}
          </div>
          <div>
            <h5>Platforma</h5>
            <ul>
              <li><Link to="/courses">Kurslar</Link></li>
              <li><Link to="/tests">Testlar</Link></li>
              <li><Link to="/blog">Blog</Link></li>
              <li><Link to="/teachers">O'qituvchilar</Link></li>
              <li><Link to="/resources">Resurslar</Link></li>
              <li><Link to="/ratings">Reyting</Link></li>
            </ul>
          </div>
          <div>
            <h5>Yordam</h5>
            <ul>
              <li><Link to="/about">Biz haqimizda</Link></li>
              <li><Link to="/contact">Aloqa</Link></li>
              <li><Link to="/verify">Sertifikat tasdiqlash</Link></li>
              <li><Link to="/search">Qidiruv</Link></li>
            </ul>
          </div>
          <div>
            <h5>Aloqa</h5>
            <ul>
              {s.telegram_url && (
                <li><a href={s.telegram_url} target="_blank" rel="noreferrer">
                  <Icon name="message" size={13} /> Telegram
                </a></li>
              )}
              {s.youtube_url && (
                <li><a href={s.youtube_url} target="_blank" rel="noreferrer">
                  <Icon name="youtube" size={13} /> YouTube
                </a></li>
              )}
              {s.instagram_url && (
                <li><a href={s.instagram_url} target="_blank" rel="noreferrer">
                  <Icon name="instagram" size={13} /> Instagram
                </a></li>
              )}
              {s.facebook_url && (
                <li><a href={s.facebook_url} target="_blank" rel="noreferrer">
                  <Icon name="globe" size={13} /> Facebook
                </a></li>
              )}
              {!s.telegram_url && !s.youtube_url && !s.instagram_url && !s.facebook_url && (
                <li className="ft-mute">Tez orada qo'shiladi</li>
              )}
              {s.contact_email && (
                <li><a href={`mailto:${s.contact_email}`}>{s.contact_email}</a></li>
              )}
              {s.contact_phone && (
                <li><a href={`tel:${s.contact_phone.replace(/\s/g, '')}`}>{s.contact_phone}</a></li>
              )}
              {s.address && (
                <li className="ft-mute">{s.address}</li>
              )}
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} {siteName} — Geografiya o'rganish platformasi</span>
          <span className="ft-coord">41.31°N · 69.24°E — TOSHKENT</span>
        </div>
      </div>
    </footer>
  )
}
