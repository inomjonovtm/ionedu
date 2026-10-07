import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'
import api, { absUrl } from '../api/client'
import { useAuth } from '../store/auth'
import { useTheme } from '../store/theme'
import Icon from './Icon'

// Menyu vazifasiga qarab guruhlangan dropdownlar
const MENUS = [
  { id: 'learn', label: "O'rganish", icon: 'book', items: [
    { to: '/courses',   label: 'Kurslar',       icon: 'book' },
    { to: '/tests',     label: 'Testlar',       icon: 'fileText' },
    { to: '/resources', label: 'Resurslar',     icon: 'file' },
  ] },
  { id: 'interactive', label: 'Interaktiv', icon: 'gamepad', items: [
    { to: '/games', label: "O'yinlar",       icon: 'gamepad' },
    { to: '/world', label: 'Dunyo xaritasi', icon: 'map' },
  ] },
  { id: 'community', label: 'Hamjamiyat', icon: 'users', items: [
    { to: '/blog',      label: 'Blog',          icon: 'news' },
    { to: '/teachers',  label: "O'qituvchilar", icon: 'grad' },
    { to: '/ratings',   label: 'Reyting',       icon: 'trophy' },
  ] },
  { id: 'site', label: 'Sayt', icon: 'globe', items: [
    { to: '/about',   label: 'Biz haqimizda', icon: 'globe' },
    { to: '/contact', label: 'Aloqa',         icon: 'mail' },
  ] },
]

const navCss = `
  .nv-bar {
    position: sticky; top: 0; z-index: 60;
    background: rgba(252, 252, 251, 0.78);
    backdrop-filter: blur(18px) saturate(1.4);
    -webkit-backdrop-filter: blur(18px) saturate(1.4);
    border-bottom: 1px solid transparent;
    transition: border-color .25s ease, background .25s ease;
  }
  .nv-bar.scrolled {
    border-bottom-color: var(--border-2);
    background: rgba(252, 252, 251, 0.92);
  }
  .nv-inner { display: flex; align-items: center; gap: 16px; height: 68px; }

  .nv-logo {
    display: inline-flex; align-items: center; gap: 10px;
    font-family: var(--font-display); font-weight: 700; font-size: 19px;
    letter-spacing: -0.04em; color: var(--text);
    flex-shrink: 0; text-decoration: none;
  }
  .nv-logo-mark {
    width: 31px; height: 31px; border-radius: 10px;
    background: var(--green-600);
    color: white; display: flex; align-items: center; justify-content: center;
  }
  .nv-logo .accent { color: var(--green-600); }

  /* Centered minimal links — quiet pill states */
  .nv-links {
    display: flex; align-items: center; gap: 1px;
    margin: 0 auto; list-style: none;
  }
  .nv-links a {
    position: relative;
    display: inline-flex; align-items: center; gap: 6px;
    padding: 7px 13px;
    font-size: 14px; font-weight: 480; color: var(--text-3);
    text-decoration: none; white-space: nowrap;
    border-radius: 999px;
    transition: color .16s ease, background .16s ease;
  }
  .nv-links a:hover { color: var(--text); }
  .nv-links a.active { color: var(--text); background: var(--bg-soft); font-weight: 560; }
  .nv-new-badge {
    margin-left: 5px; padding: 1px 6px; border-radius: 999px;
    background: var(--green-600); color: white; font-size: 9px; font-weight: 700;
    letter-spacing: 0.04em; text-transform: uppercase; line-height: 1.5;
  }
  .nv-new-dot {
    width: 6px; height: 6px; border-radius: 999px; background: var(--green-600);
    flex-shrink: 0; align-self: flex-start; margin-top: 2px;
  }
  .nv-more { position: relative; }
  .nv-more-btn {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 7px 12px; font-size: 14px; font-weight: 500; color: var(--text-3);
    background: none; border: none; cursor: pointer; border-radius: 999px; white-space: nowrap;
    transition: color .16s ease, background .16s ease;
  }
  .nv-more-btn .nv-trigger-ic { color: var(--text-4); transition: color .16s ease; }
  .nv-more-btn:hover, .nv-more-btn.on { color: var(--text); background: var(--bg-soft); }
  .nv-more-btn:hover .nv-trigger-ic, .nv-more-btn.on .nv-trigger-ic { color: var(--green-600); }

  .nv-actions { display: flex; align-items: center; gap: 6px; flex-shrink: 0; }

  .nv-icon-btn {
    width: 38px; height: 38px; position: relative;
    display: inline-flex; align-items: center; justify-content: center;
    border-radius: 999px; color: var(--text-2); background: transparent;
    border: none; cursor: pointer; text-decoration: none;
    transition: background .15s, color .15s;
  }
  .nv-icon-btn:hover { background: var(--bg-soft); color: var(--text); }
  .nv-icon-btn .dot {
    position: absolute; top: 4px; right: 4px;
    min-width: 16px; height: 16px; padding: 0 4px;
    background: var(--green-600); color: white;
    border-radius: 999px; font-size: 10px; font-weight: 700;
    display: inline-flex; align-items: center; justify-content: center;
    border: 2px solid var(--paper);
  }

  /* Search popover */
  .nv-search-wrap { position: relative; }
  .nv-search-popover {
    position: absolute; right: 0; top: calc(100% + 12px);
    background: var(--white); border: 1px solid var(--border); border-radius: 16px;
    padding: 10px; min-width: 340px;
    box-shadow: var(--shadow-pop);
    z-index: 70;
    animation: nvPop .18s cubic-bezier(.21, .7, .25, 1);
  }
  @keyframes nvPop { from { opacity: 0; transform: translateY(-6px) scale(.98); } to { opacity: 1; transform: none; } }
  .nv-search-popover form { position: relative; }
  .nv-search-popover .ico { position: absolute; left: 13px; top: 50%; transform: translateY(-50%); color: var(--text-3); }
  .nv-search-popover .input { padding-left: 38px; height: 42px; border-radius: 11px; }
  .nv-search-popover .hint {
    display: flex; justify-content: space-between; align-items: center;
    padding: 8px 4px 2px; font-size: 11px; color: var(--text-4);
  }
  .nv-search-popover kbd {
    padding: 2px 6px; border: 1px solid var(--border); border-bottom-width: 2px;
    border-radius: 5px; font-size: 10px; font-family: var(--font-mono); color: var(--text-3);
    background: var(--bg-soft);
  }

  /* User chip */
  .nv-user {
    display: inline-flex; align-items: center; gap: 9px;
    padding: 3px 10px 3px 3px; border-radius: 999px;
    background: transparent; border: 1px solid var(--border);
    cursor: pointer; transition: all .15s; height: 40px;
  }
  .nv-user:hover { border-color: #CFD3CE; background: var(--white); box-shadow: var(--shadow-soft); }
  .nv-user .av {
    width: 32px; height: 32px; border-radius: 999px;
    background: var(--green-100); color: var(--green-800);
    display: inline-flex; align-items: center; justify-content: center;
    font-weight: 650; font-size: 12px; font-family: var(--font-display);
    overflow: hidden;
  }
  .nv-user .av img { width: 100%; height: 100%; object-fit: cover; }
  .nv-user .nm { font-size: 13.5px; font-weight: 500; max-width: 130px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--text); }

  /* Dropdown menu */
  .nv-menu {
    position: absolute; right: 0; top: calc(100% + 12px); min-width: 250px;
    background: var(--white); border: 1px solid var(--border); border-radius: 16px;
    box-shadow: var(--shadow-pop);
    padding: 6px; z-index: 70;
    animation: nvPop .18s cubic-bezier(.21, .7, .25, 1);
  }
  .nv-menu .item {
    display: flex; align-items: center; gap: 10px;
    padding: 9px 12px; border-radius: 10px; font-size: 14px;
    color: var(--text-2); transition: background .12s;
    text-decoration: none; width: 100%; background: none; border: none;
    text-align: left; cursor: pointer;
  }
  .nv-menu .item svg { color: var(--text-3); }
  .nv-menu .item:hover { background: var(--bg-soft); color: var(--text); }
  .nv-menu .item.danger { color: var(--red-600); }
  .nv-menu .item.danger svg { color: var(--red-600); }
  .nv-menu .item.danger:hover { background: var(--red-50); }
  .nv-menu .head {
    display: flex; gap: 10px; align-items: center;
    padding: 10px 12px 12px; border-bottom: 1px solid var(--border-2); margin-bottom: 4px;
  }
  .nv-menu .head .av { width: 40px; height: 40px; border-radius: 999px;
    background: var(--green-100); color: var(--green-800);
    display: inline-flex; align-items: center; justify-content: center;
    font-weight: 650; font-size: 14px; font-family: var(--font-display); overflow: hidden; flex-shrink: 0;
  }
  .nv-menu .head .av img { width: 100%; height: 100%; object-fit: cover; }
  .nv-menu .head .nm { font-weight: 600; font-size: 14px; line-height: 1.2; }
  .nv-menu .head .ph { font-size: 12px; color: var(--text-3); font-family: var(--font-mono); margin-top: 2px; }
  .nv-menu .group-title { font-family: var(--font-mono); font-size: 10px; text-transform: uppercase; letter-spacing: 0.12em; color: var(--text-4); padding: 8px 12px 4px; font-weight: 500; }
  .nv-menu hr { border: none; border-top: 1px solid var(--border-2); margin: 4px 0; }

  .nv-cta-ghost {
    padding: 8px 15px; border-radius: 999px; font-size: 14px; font-weight: 500;
    color: var(--text-2); transition: all .15s; text-decoration: none;
  }
  .nv-cta-ghost:hover { background: var(--bg-soft); color: var(--text); }
  .nv-cta-primary {
    padding: 9px 19px; border-radius: 999px; font-size: 14px; font-weight: 550;
    background: var(--ink); color: white; transition: all .15s; text-decoration: none;
  }
  .nv-cta-primary:hover { background: var(--ink-2); }

  .nv-burger { display: none; }

  @media (max-width: 1080px) {
    .nv-more-btn { padding: 7px 9px; font-size: 13.5px; gap: 4px; }
    .nv-more-btn .nv-trigger-ic { display: none; }
  }
  @media (max-width: 920px) {
    .nv-links { display: none; }
    .nv-search-popover { min-width: 280px; }
    .nv-burger {
      display: inline-flex; width: 38px; height: 38px; align-items: center; justify-content: center;
      border-radius: 999px; color: var(--text-2); border: 1px solid var(--border);
      background: var(--white); cursor: pointer; transition: all .15s;
    }
    .nv-burger:hover { background: var(--bg-soft); }
  }
  @media (max-width: 600px) {
    .nv-user .nm { display: none; }
    .nv-user { padding-right: 8px; }
    .nv-cta-ghost { display: none; }
  }

  /* Mobile sheet */
  .nv-sheet {
    position: fixed; inset: 68px 0 0 0; background: rgba(12, 17, 14, 0.4);
    backdrop-filter: blur(3px);
    -webkit-backdrop-filter: blur(3px);
    z-index: 55;
    animation: nvFade .2s ease-out;
  }
  @keyframes nvFade { from { opacity: 0; } to { opacity: 1; } }
  .nv-sheet-inner {
    background: var(--white); padding: 12px 16px 24px;
    border-radius: 0 0 24px 24px;
    box-shadow: var(--shadow-pop);
    animation: nvSlide .22s cubic-bezier(.21, .7, .25, 1);
  }
  @keyframes nvSlide { from { transform: translateY(-12px); opacity: 0; } to { transform: none; opacity: 1; } }
  .nv-sheet-inner a {
    display: flex; align-items: center; gap: 12px;
    padding: 13px 12px; font-size: 15px; font-weight: 500;
    border-radius: 12px; color: var(--text-2);
    text-decoration: none; transition: background .12s;
  }
  .nv-sheet-inner a:hover { background: var(--bg-soft); }
  .nv-sheet-inner a.active { color: var(--green-800); background: var(--green-50); font-weight: 600; }
  .nv-sheet-inner .sheet-divider { height: 1px; background: var(--border-2); margin: 8px 0; }
  .nv-sheet-grp { margin-bottom: 6px; }
  .nv-sheet-grp + .nv-sheet-grp { margin-top: 6px; padding-top: 6px; border-top: 1px solid var(--border-2); }
  .nv-sheet-group {
    font-family: var(--font-mono); font-size: 10px; font-weight: 600;
    letter-spacing: 0.12em; text-transform: uppercase; color: var(--text-4);
    padding: 6px 12px 4px;
  }
`

function NavSearch() {
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const navigate = useNavigate()
  const ref = useRef(null)
  const wrapRef = useRef(null)

  useEffect(() => { if (open) ref.current?.focus() }, [open])

  useEffect(() => {
    if (!open) return
    function onClickOutside(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false)
    }
    function onKey(e) { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onClickOutside)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClickOutside)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  // Ctrl+K / Cmd+K opens search anywhere
  useEffect(() => {
    function onKey(e) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setOpen(true)
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  function submit(e) {
    e.preventDefault()
    if (!q.trim()) return
    navigate(`/search?q=${encodeURIComponent(q.trim())}`)
    setOpen(false); setQ('')
  }

  return (
    <div className="nv-search-wrap" ref={wrapRef}>
      <button className="nv-icon-btn" onClick={() => setOpen(o => !o)} title="Qidirish (Ctrl+K)" aria-label="Qidirish">
        <Icon name="search" size={18} />
      </button>
      {open && (
        <div className="nv-search-popover">
          <form onSubmit={submit}>
            <Icon name="search" size={16} className="ico" />
            <input ref={ref} value={q} onChange={e => setQ(e.target.value)}
              placeholder="Kurs, o'qituvchi, resurs…" className="input" />
          </form>
          <div className="hint">
            <span>Enter — qidirish</span>
            <span><kbd>Ctrl</kbd> + <kbd>K</kbd></span>
          </div>
        </div>
      )}
    </div>
  )
}

function ThemeToggle() {
  const { theme, toggle } = useTheme()
  const dark = theme === 'dark'
  return (
    <button
      className="nv-icon-btn"
      onClick={toggle}
      title={dark ? 'Yorug‘ rejim' : 'Tungi rejim'}
      aria-label="Rejimni almashtirish"
    >
      <Icon name={dark ? 'sun' : 'moon'} size={18} />
    </button>
  )
}

function UserMenu({ user, onClose }) {
  const navigate = useNavigate()
  const { logout } = useAuth()
  async function doLogout() { await logout(); onClose(); navigate('/') }

  return (
    <div className="nv-menu" onMouseLeave={onClose}>
      <div className="head">
        <div className="av">{user.avatar ? <img src={absUrl(user.avatar)} alt="" /> : user.initials}</div>
        <div style={{ minWidth: 0 }}>
          <div className="nm">{user.display_name}</div>
          <div className="ph">{user.email || user.phone}</div>
        </div>
      </div>
      <Link to="/profile" className="item" onClick={onClose}><Icon name="user" size={16} /> Profilim</Link>
      <Link to="/notifications" className="item" onClick={onClose}><Icon name="bell" size={16} /> Bildirishnomalar</Link>
      {(user.role === 'teacher' || user.role === 'admin') && (
        <>
          <hr />
          <div className="group-title">{user.role === 'admin' ? 'Admin' : "O'qituvchi"}</div>
          {user.role === 'teacher' && (
            <>
              <Link to="/teacher" className="item" onClick={onClose}><Icon name="home" size={16} /> Boshqaruv paneli</Link>
              <Link to="/teacher/courses" className="item" onClick={onClose}><Icon name="book" size={16} /> Kurslarim</Link>
              <Link to="/teacher/courses/new" className="item" onClick={onClose}><Icon name="plus" size={16} /> Yangi kurs</Link>
            </>
          )}
          {user.role === 'admin' && (
            <>
              <Link to="/admin-panel" className="item" onClick={onClose}><Icon name="shield" size={16} /> Admin panel</Link>
              <Link to="/admin-panel/users" className="item" onClick={onClose}><Icon name="users" size={16} /> Foydalanuvchilar</Link>
              <Link to="/admin-panel/courses" className="item" onClick={onClose}><Icon name="book" size={16} /> Kurslar</Link>
            </>
          )}
        </>
      )}
      <hr />
      <button className="item danger" onClick={doLogout}><Icon name="x" size={16} /> Chiqish</button>
    </div>
  )
}

export default function Navbar() {
  const { user } = useAuth()
  const [unread, setUnread] = useState(0)
  const [menuOpen, setMenuOpen] = useState(false)
  const [openMenu, setOpenMenu] = useState(null)
  const [scrolled, setScrolled] = useState(false)
  const [sheetOpen, setSheetOpen] = useState(false)
  const loc = useLocation()
  const userWrapRef = useRef(null)
  const menusRef = useRef(null)

  useEffect(() => {
    if (!user) { setUnread(0); return }
    let alive = true
    const load = () => api.get('/notifications/unread-count/')
      .then(r => { if (alive) setUnread(r.data.count) })
      .catch(() => {})
    load()
    const id = setInterval(load, 60000)
    return () => { alive = false; clearInterval(id) }
  }, [user, loc.pathname])

  useEffect(() => { setSheetOpen(false); setMenuOpen(false); setOpenMenu(null) }, [loc.pathname])

  // Close any open nav dropdown on outside click / Escape
  useEffect(() => {
    if (!openMenu) return
    function onClickOutside(e) {
      if (menusRef.current && !menusRef.current.contains(e.target)) setOpenMenu(null)
    }
    function onKey(e) { if (e.key === 'Escape') setOpenMenu(null) }
    document.addEventListener('mousedown', onClickOutside)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClickOutside)
      document.removeEventListener('keydown', onKey)
    }
  }, [openMenu])

  // Lock body scroll while the mobile sheet is open
  useEffect(() => {
    document.body.style.overflow = sheetOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [sheetOpen])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 6)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Close user menu on outside click
  useEffect(() => {
    if (!menuOpen) return
    function onClickOutside(e) {
      if (userWrapRef.current && !userWrapRef.current.contains(e.target)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [menuOpen])

  return (
    <>
      <style>{navCss}</style>
      <header className={`nv-bar ${scrolled ? 'scrolled' : ''}`}>
        <div className="container nv-inner">
          <Link to="/" className="nv-logo" aria-label="Ionedu — bosh sahifa">
            <span className="nv-logo-mark">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><path d="M2 12h20"/>
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
              </svg>
            </span>
            Ion<span className="accent">Edu</span>
          </Link>

          <nav className="nv-links" aria-label="Asosiy menyu" ref={menusRef}>
            {MENUS.map(menu => {
              const open = openMenu === menu.id
              const active = menu.items.some(it => loc.pathname.startsWith(it.to))
              const hasNew = menu.items.some(it => it.isNew)
              return (
                <div className="nv-more" key={menu.id}>
                  <button className={`nv-more-btn ${open || active ? 'on' : ''}`}
                    onClick={() => setOpenMenu(open ? null : menu.id)}
                    onMouseEnter={() => { if (openMenu) setOpenMenu(menu.id) }}
                    aria-haspopup="true" aria-expanded={open}>
                    <Icon name={menu.icon} size={15} className="nv-trigger-ic" />
                    {menu.label}
                    {hasNew && <span className="nv-new-dot" />}
                    <Icon name="chevD" size={13} style={{ transform: open ? 'rotate(180deg)' : '', transition: '.2s' }} />
                  </button>
                  {open && (
                    <div className="nv-menu" style={{ left: 0, right: 'auto', minWidth: 218 }}>
                      {menu.items.map(item => (
                        <NavLink key={item.to} to={item.to} className="item" onClick={() => setOpenMenu(null)}>
                          <Icon name={item.icon} size={16} /> {item.label}
                          {item.isNew && <span className="nv-new-badge" style={{ marginLeft: 'auto' }}>yangi</span>}
                        </NavLink>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </nav>

          <div className="nv-actions">
            <ThemeToggle />
            <NavSearch />
            {user ? (
              <>
                <Link to="/notifications" className="nv-icon-btn" title="Bildirishnomalar" aria-label="Bildirishnomalar">
                  <Icon name="bell" size={18} />
                  {unread > 0 && <span className="dot">{unread > 9 ? '9+' : unread}</span>}
                </Link>
                <div style={{ position: 'relative' }} ref={userWrapRef}>
                  <button className="nv-user" onClick={() => setMenuOpen(o => !o)} aria-label="Profil menyusi">
                    <span className="av">{user.avatar ? <img src={absUrl(user.avatar)} alt="" /> : user.initials}</span>
                    <span className="nm">{user.full_name || user.display_name}</span>
                    <Icon name="chevD" size={14} style={{ color: 'var(--text-3)', transform: menuOpen ? 'rotate(180deg)' : '', transition: '.2s' }} />
                  </button>
                  {menuOpen && <UserMenu user={user} onClose={() => setMenuOpen(false)} />}
                </div>
              </>
            ) : (
              <>
                <Link to="/auth/login" className="nv-cta-ghost">Kirish</Link>
                <Link to="/auth/register" className="nv-cta-primary">Boshlash</Link>
              </>
            )}
            <button className="nv-burger" onClick={() => setSheetOpen(o => !o)} aria-label="Menyu">
              <Icon name={sheetOpen ? 'x' : 'list'} size={18} />
            </button>
          </div>
        </div>
      </header>

      {sheetOpen && (
        <div className="nv-sheet" onClick={() => setSheetOpen(false)}>
          <div className="nv-sheet-inner" onClick={e => e.stopPropagation()}>
            {MENUS.map(menu => (
              <div key={menu.id} className="nv-sheet-grp">
                <div className="nv-sheet-group">{menu.label}</div>
                {menu.items.map(item => (
                  <NavLink key={item.to} to={item.to} className={({ isActive }) => isActive ? 'active' : ''}>
                    <Icon name={item.icon} size={17} /> {item.label}
                    {item.isNew && <span className="nv-new-badge" style={{ marginLeft: 'auto' }}>yangi</span>}
                  </NavLink>
                ))}
              </div>
            ))}
            {!user && (
              <>
                <div className="sheet-divider" />
                <NavLink to="/auth/login"><Icon name="user" size={16} /> Kirish</NavLink>
                <NavLink to="/auth/register"><Icon name="plus" size={16} /> Ro'yxatdan o'tish</NavLink>
              </>
            )}
            {user && (
              <>
                <div className="sheet-divider" />
                <NavLink to="/profile"><Icon name="user" size={16} /> Profilim</NavLink>
                {user.role === 'teacher' && <NavLink to="/teacher"><Icon name="home" size={16} /> O'qituvchi paneli</NavLink>}
                {user.role === 'admin' && <NavLink to="/admin-panel"><Icon name="shield" size={16} /> Admin panel</NavLink>}
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
