import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../store/auth'
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
  .dash-shell {
    display: grid; grid-template-columns: 256px 1fr; min-height: 100vh;
  }
  .dash-sb {
    border-right: 1px solid var(--border-2);
    background: var(--white);
    position: sticky; top: 0; align-self: start;
    height: 100vh;
    display: flex; flex-direction: column;
  }
  .dash-sb-brand {
    padding: 20px 20px 18px;
    flex-shrink: 0;
    display: flex; align-items: center; gap: 10px;
    font-family: var(--font-display); font-weight: 700; font-size: 18px;
    letter-spacing: -0.04em; color: var(--text);
    text-decoration: none;
  }
  .dash-sb-brand-mark {
    width: 28px; height: 28px; border-radius: 9px;
    background: var(--green-600);
    color: white; display: flex; align-items: center; justify-content: center;
  }
  .dash-sb-brand .accent { color: var(--green-600); }
  .dash-sb-user {
    display: flex; align-items: center; gap: 10px;
    margin: 0 12px 8px; padding: 11px 12px;
    background: var(--bg-soft); border-radius: 14px;
    flex-shrink: 0;
  }
  .dash-sb-user .avatar { width: 34px; height: 34px; overflow: hidden; }
  .dash-sb-user .avatar img { width: 100%; height: 100%; object-fit: cover; }
  .dash-sb-user .nm { font-weight: 600; font-size: 13px; line-height: 1.2; }
  .dash-sb-user .rl { font-family: var(--font-mono); font-size: 10px; letter-spacing: 0.08em; text-transform: uppercase; color: var(--text-4); margin-top: 3px; }
  .dash-sb-nav {
    flex: 1; min-height: 0; overflow-y: auto;
    padding: 8px 12px 12px;
    display: flex; flex-direction: column; gap: 2px;
  }
  .dash-sb-nav a {
    position: relative;
    display: flex; align-items: center; gap: 11px;
    padding: 9px 12px; border-radius: 10px;
    font-size: 13.5px; font-weight: 500; color: var(--text-3);
    text-decoration: none;
    transition: all .15s ease;
  }
  .dash-sb-nav a svg { color: var(--text-4); transition: color .15s ease; }
  .dash-sb-nav a:hover { background: var(--bg-soft); color: var(--text); }
  .dash-sb-nav a:hover svg { color: var(--text-2); }
  .dash-sb-nav a.active { background: var(--green-50); color: var(--green-800); font-weight: 560; box-shadow: inset 0 0 0 1px var(--green-100); }
  .dash-sb-nav a.active svg { color: var(--green-600); }
  .dash-sb-grp { display: flex; flex-direction: column; gap: 2px; }
  .dash-sb-grp + .dash-sb-grp { margin-top: 12px; }
  .dash-sb-grp-title {
    font-family: var(--font-mono); font-size: 9.5px; text-transform: uppercase;
    letter-spacing: 0.1em; color: var(--text-4); font-weight: 600; padding: 4px 12px 3px;
  }
  .dash-sb-foot {
    flex-shrink: 0;
    padding: 10px 12px 14px;
    border-top: 1px solid var(--border-2);
    background: var(--white);
    display: flex; flex-direction: column; gap: 4px;
  }
  .dash-sb-foot button, .dash-sb-foot a {
    display: flex; align-items: center; gap: 10px;
    padding: 9px 12px; border-radius: 10px;
    font-size: 13.5px; font-weight: 500; color: var(--text-3);
    background: none; border: none; cursor: pointer;
    text-decoration: none; text-align: left;
    transition: all .15s ease;
  }
  .dash-sb-foot a:hover { background: var(--bg-soft); color: var(--text); }
  .dash-sb-foot .logout { color: var(--red-600); }
  .dash-sb-foot .logout:hover { background: var(--red-50); }

  .dash-main {
    padding: 32px 40px;
    background: var(--bg-soft);
    overflow-x: hidden;
    min-height: 100vh;
  }

  @media (max-width: 1024px) {
    .dash-shell { grid-template-columns: 1fr; }
    .dash-sb { position: static; height: auto; }
    .dash-sb-nav { flex-direction: row; flex-wrap: wrap; overflow-x: auto; }
    .dash-sb-grp { display: contents; }
    .dash-sb-grp + .dash-sb-grp { margin-top: 0; }
    .dash-sb-grp-title { display: none; }
    .dash-main { padding: 20px 16px; }
  }
`

export default function DashLayout({ kind = 'student', children }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const nav = kind === 'teacher' ? TEACHER_NAV : kind === 'admin' ? ADMIN_NAV : STUDENT_NAV

  return (
    <div className="dash-shell">
      <style>{sidebarCss}</style>
      <aside className="dash-sb">
        <Link to="/" className="dash-sb-brand">
          <span className="dash-sb-brand-mark">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><path d="M2 12h20"/>
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
            </svg>
          </span>
          Ion<span className="accent">edu</span>
        </Link>

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
                  <Icon name={item.icon} size={16} /> {item.label}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <div className="dash-sb-foot">
          <Link to="/">
            <Icon name="globe" size={16} /> Saytga o'tish
          </Link>
          <button className="logout" onClick={async () => { await logout(); navigate('/') }}>
            <Icon name="arrowL" size={16} /> Chiqish
          </button>
        </div>
      </aside>
      <main className="dash-main">{children}</main>
    </div>
  )
}
