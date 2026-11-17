import { useEffect, useState } from 'react'
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../store/auth'
import { useTheme } from '../store/theme'
import Logo from './Logo'
import { absUrl } from '../api/client'
import Icon from './Icon'

// Har bir panel navigatsiyasi bo'limlarga (group) ajratilgan: { title?, items[] }
const STUDENT_NAV = [
  { items: [
    { to: '/profile', label: 'Mening profilim', icon: 'home', end: true },
  ] },
  { title: "O'qish", items: [
    { to: '/courses', label: 'Kurslar', icon: 'book' },
    { to: '/tests', label: 'Testlar', icon: 'fileText' },
    { to: '/games', label: "O'yinlar", icon: 'gamepad' },
  ] },
]

const TEACHER_NAV = [
  { items: [
    { to: '/teacher', label: 'Boshqaruv paneli', icon: 'home', end: true },
  ] },
  { title: 'Kontent', items: [
    { to: '/teacher/courses', label: 'Kurslarim', icon: 'book' },
    { to: '/teacher/courses/new', label: 'Yangi kurs', icon: 'plus' },
    { to: '/teacher/tests', label: 'Testlarim', icon: 'fileText' },
  ] },
  { title: 'Auditoriya', items: [
    { to: '/teacher/students', label: "O'quvchilar", icon: 'users' },
    { to: '/teacher/reviews', label: 'Sharhlar', icon: 'star' },
  ] },
  { title: 'Hisob', items: [
    { to: '/profile', label: 'Profil', icon: 'userCog' },
  ] },
]

const ADMIN_NAV = [
  { items: [
    { to: '/admin-panel', label: 'Boshqaruv paneli', icon: 'home', end: true },
    { to: '/admin-panel/users', label: 'Foydalanuvchilar', icon: 'users' },
  ] },
  { title: 'Kontent', items: [
    { to: '/admin-panel/courses', label: 'Kurslar', icon: 'book' },
    { to: '/admin-panel/tests', label: 'Testlar', icon: 'fileText' },
    { to: '/admin-panel/categories', label: 'Kategoriyalar', icon: 'grid' },
    { to: '/admin-panel/resources', label: 'Resurslar', icon: 'folder' },
    { to: '/admin-panel/blog', label: 'Blog', icon: 'news' },
  ] },
  { title: 'Moderatsiya', items: [
    { to: '/admin-panel/certificates', label: 'Sertifikatlar', icon: 'award' },
    { to: '/admin-panel/reviews', label: 'Sharhlar', icon: 'star' },
    { to: '/admin-panel/messages', label: 'Xabarlar', icon: 'message' },
  ] },
  { title: 'Sayt', items: [
    { to: '/admin-panel/team', label: 'Jamoa', icon: 'shield' },
    { to: '/admin-panel/settings', label: 'Sozlamalar', icon: 'sliders' },
  ] },
  { title: 'Hisob', items: [
    { to: '/profile', label: 'Profil', icon: 'userCog' },
  ] },
]

const sidebarCss = `
  .dash-shell { display: grid; grid-template-columns: 268px 1fr; min-height: 100vh; background: var(--paper); }
  .dash-sb {
    position: sticky; top: 0; align-self: start; height: 100vh;
    padding: 14px 0 14px 14px; display: flex; flex-direction: column;
  }
  .dash-sb-card {
    flex: 1; min-height: 0; display: flex; flex-direction: column;
    background: var(--ink); color: #C6CFE6; border-radius: 26px; overflow: hidden; position: relative;
  }
  .dash-sb-card::before { content: ''; position: absolute; inset: 0; background-image: var(--topo); background-size: 420px 290px; filter: invert(1); opacity: .45; pointer-events: none; }
  .dash-sb-card > * { position: relative; }
  .dash-sb-brand { padding: 20px 18px 16px; flex-shrink: 0; display: flex; text-decoration: none; }
  .dash-sb-user {
    display: flex; align-items: center; gap: 11px; margin: 0 12px 10px; padding: 11px 12px;
    background: rgba(255,255,255,.07); border: 1.5px solid rgba(255,255,255,.1); border-radius: 16px; flex-shrink: 0;
  }
  .dash-sb-user .avatar { width: 38px; height: 38px; border-radius: 12px; }
  .dash-sb-user .nm { font-weight: 700; font-size: 13.5px; line-height: 1.2; color: #fff; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .dash-sb-user .rl { font-family: var(--font-mono); font-size: 10px; letter-spacing: 0.1em; text-transform: uppercase; color: var(--sun); margin-top: 4px; }
  .dash-sb-nav { flex: 1; min-height: 0; overflow-y: auto; padding: 6px 12px 12px; display: flex; flex-direction: column; gap: 2px; scrollbar-color: rgba(255,255,255,.2) transparent; }
  .dash-sb-nav a {
    display: flex; align-items: center; gap: 11px; padding: 10px 12px; border-radius: 13px;
    font-size: 14px; font-weight: 600; color: #AEB9D6; text-decoration: none;
    transition: background .14s ease, color .14s ease;
  }
  .dash-sb-nav a svg { color: #7887AD; transition: color .14s ease; flex-shrink: 0; }
  .dash-sb-nav a:hover { background: rgba(255,255,255,.07); color: #fff; }
  .dash-sb-nav a:hover svg { color: #fff; }
  .dash-sb-nav a.active { background: var(--sun); color: #14213D; font-weight: 750; }
  .dash-sb-nav a.active svg { color: #14213D; }
  .dash-sb-grp { display: flex; flex-direction: column; gap: 2px; }
  .dash-sb-grp + .dash-sb-grp { margin-top: 14px; }
  .dash-sb-grp-title { font-family: var(--font-mono); font-size: 9.5px; text-transform: uppercase; letter-spacing: 0.14em; color: #6676A0; font-weight: 600; padding: 4px 12px 4px; }
  .dash-sb-foot { flex-shrink: 0; padding: 10px 12px 12px; border-top: 1.5px dashed rgba(255,255,255,.14); display: flex; gap: 6px; }
  .dash-sb-foot button, .dash-sb-foot a {
    flex: 1; display: flex; align-items: center; justify-content: center; gap: 8px;
    height: 40px; border-radius: 12px; font-size: 13px; font-weight: 700; color: #C6CFE6;
    background: rgba(255,255,255,.07); text-decoration: none; transition: background .14s ease, color .14s ease;
  }
  .dash-sb-foot a:hover, .dash-sb-foot button:hover { background: rgba(255,255,255,.14); color: #fff; }
  .dash-sb-foot .logout:hover { background: var(--coral); color: #fff; }
  .dash-sb-foot .sq { flex: 0 0 40px; }

  .dash-main { padding: 30px 36px 60px; overflow-x: hidden; min-height: 100vh; min-width: 0; }
  .dash-mtop { display: none; }

  @media (max-width: 1024px) {
    .dash-shell { display: block; }
    .dash-sb { position: fixed; inset: 0 auto 0 0; width: 290px; height: 100vh; z-index: 95; padding: 10px; transform: translateX(-105%); transition: transform .24s cubic-bezier(.21,.7,.25,1); }
    .dash-sb.open { transform: none; }
    .dash-scrim { position: fixed; inset: 0; z-index: 94; background: rgba(20,33,61,.5); animation: fadeIn .16s ease-out; }
    .dash-mtop {
      display: flex; align-items: center; justify-content: space-between; gap: 12px;
      position: sticky; top: 0; z-index: 50; padding: 10px 16px; background: var(--paper); border-bottom: 1.5px solid var(--border);
    }
    .dash-mtop button { width: 42px; height: 42px; border-radius: 13px; border: 2px solid var(--line); background: var(--sun); color: #14213D; display: inline-flex; align-items: center; justify-content: center; }
    .dash-main { padding: 20px 16px 48px; }
  }
`

export default function DashLayout({ kind = 'student', children }) {
  const { user, logout } = useAuth()
  const { theme, toggle } = useTheme()
  const navigate = useNavigate()
  const loc = useLocation()
  const [open, setOpen] = useState(false)
  const nav = kind === 'teacher' ? TEACHER_NAV : kind === 'admin' ? ADMIN_NAV : STUDENT_NAV

  useEffect(() => { setOpen(false) }, [loc.pathname])

  return (
    <div className="dash-shell">
      <style>{sidebarCss}</style>
      {open && <div className="dash-scrim" onClick={() => setOpen(false)} />}
      <aside className={`dash-sb ${open ? 'open' : ''}`}>
        <div className="dash-sb-card">
          <Link to="/" className="dash-sb-brand"><Logo size={32} light /></Link>

          <div className="dash-sb-user">
            <div className="avatar">
              {user?.avatar ? <img src={absUrl(user.avatar)} alt="" /> : user?.initials}
            </div>
            <div style={{ minWidth: 0 }}>
              <div className="nm">{user?.display_name}</div>
              <div className="rl">{user?.role === 'teacher' ? "O'qituvchi" : user?.role === 'admin' ? 'Administrator' : "O'quvchi"}</div>
            </div>
          </div>

          <nav className="dash-sb-nav">
            {nav.map((group, gi) => (
              <div key={gi} className="dash-sb-grp">
                {group.title && <div className="dash-sb-grp-title">{group.title}</div>}
                {group.items.map(item => (
                  <NavLink key={item.to} to={item.to} end={item.end} className={({ isActive }) => isActive ? 'active' : ''}>
                    <Icon name={item.icon} size={17} /> {item.label}
                  </NavLink>
                ))}
              </div>
            ))}
          </nav>

          <div className="dash-sb-foot">
            <Link to="/" title="Saytga o'tish"><Icon name="globe" size={15} /> Sayt</Link>
            <button className="sq" onClick={toggle} title="Rejimni almashtirish" aria-label="Rejimni almashtirish">
              <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={15} />
            </button>
            <button className="sq logout" title="Chiqish" aria-label="Chiqish" onClick={async () => { await logout(); navigate('/') }}>
              <Icon name="arrowL" size={15} />
            </button>
          </div>
        </div>
      </aside>
      <div style={{ minWidth: 0 }}>
        <div className="dash-mtop">
          <Link to="/"><Logo size={30} /></Link>
          <button onClick={() => setOpen(true)} aria-label="Menyu"><Icon name="list" size={19} /></button>
        </div>
        <main className="dash-main">{children}</main>
      </div>
    </div>
  )
}
