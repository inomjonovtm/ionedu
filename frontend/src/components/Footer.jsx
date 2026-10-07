import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import api from './../api/client'
import Icon from './Icon'

const ftCss = `
  .ft-brand {
    display: inline-flex; align-items: center; gap: 10px;
    font-family: var(--font-display); font-weight: 700; font-size: 19px;
    letter-spacing: -0.04em; color: #fff; text-decoration: none;
  }
  .ft-brand .mark {
    width: 30px; height: 30px; border-radius: 9px;
    background: var(--green-600); color: white;
    display: inline-flex; align-items: center; justify-content: center;
  }
  .ft-desc { font-size: 13.5px; color: #8E978F; max-width: 280px; margin-top: 16px; line-height: 1.65; }
  .ft-stats { display: flex; gap: 20px; margin-top: 22px; }
  .ft-stats .num { font-family: var(--font-mono); font-size: 16px; font-weight: 560; color: #fff; line-height: 1; }
  .ft-stats .lbl { font-size: 11px; color: #7C857F; margin-top: 5px; }
  .footer ul a { display: inline-flex; align-items: center; gap: 8px; }
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
        <div className="footer-grid">
          <div>
            <Link to="/" className="ft-brand">
              <span className="mark">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
              </span>
              {siteName}
            </Link>
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
                <li style={{ fontSize: 13, color: '#7C857F' }}>Tez orada qo'shiladi</li>
              )}
              {s.contact_email && (
                <li><a href={`mailto:${s.contact_email}`}>{s.contact_email}</a></li>
              )}
              {s.contact_phone && (
                <li><a href={`tel:${s.contact_phone.replace(/\s/g, '')}`}>{s.contact_phone}</a></li>
              )}
              {s.address && (
                <li style={{ fontSize: 13, color: '#7C857F' }}>{s.address}</li>
              )}
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} {siteName} — Geografiya o'rganish platformasi</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.08em' }}>UZ · 2026</span>
        </div>
      </div>
    </footer>
  )
}
