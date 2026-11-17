import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'
import api, { absUrl } from '../api/client'
import { useAuth } from '../store/auth'
import { useTheme } from '../store/theme'
import Icon from './Icon'
import Logo from './Logo'

// Always-visible destinations — the things a student does every day.
const PRIMARY = [
  { to: '/courses', label: 'Kurslar' },
  { to: '/tests', label: 'Testlar' },
  { to: '/games', label: "O'yinlar" },
  { to: '/world', label: 'Xarita' },
  { to: '/ratings', label: 'Reyting' },
]

// Everything else lives in the "Kashf et" panel as colourful tiles.
const EXPLORE = [
  { to: '/blog', label: 'Blog', sub: 'Maqola va yangiliklar', icon: 'news', tone: 'sun' },
  { to: '/resources', label: 'Resurslar', sub: 'Kitob, xarita, fayllar', icon: 'folder', tone: 'sea' },
  { to: '/teachers', label: "O'qituvchilar", sub: 'Ustozlar bilan tanishing', icon: 'grad', tone: 'leaf' },
  { to: '/verify', label: 'Sertifikat', sub: 'Haqiqiyligini tekshirish', icon: 'award', tone: 'violet' },
  { to: '/about', label: 'Biz haqimizda', sub: 'Jamoa va maqsad', icon: 'compass', tone: 'coral' },
  { to: '/contact', label: 'Aloqa', sub: 'Savolingiz bormi?', icon: 'mail', tone: 'sand' },
]

const navCss = `
  .nv-wrap { position: sticky; top: 0; z-index: 60; padding: 12px 0 0; pointer-events: none; }
  .nv-bar {
    pointer-events: auto;
    display: flex; align-items: center; gap: 14px;
    height: 64px; padding: 0 12px 0 16px;
    background: var(--white);
    border: 2px solid var(--line); border-radius: 22px;
    transition: box-shadow .2s ease, transform .2s ease;
  }
  .nv-bar.scrolled { box-shadow: var(--hard); }
  .nv-logo { flex-shrink: 0; display: inline-flex; text-decoration: none; }

  .nv-links { display: flex; align-items: center; gap: 2px; margin-left: 10px; }
  .nv-links > a, .nv-explore-btn {
    display: inline-flex; align-items: center; gap: 6px;
    height: 38px; padding: 0 13px; border-radius: 12px;
    font-size: 14.5px; font-weight: 650; color: var(--text-2);
    white-space: nowrap; transition: background .14s ease, color .14s ease;
  }
  .nv-links > a:hover, .nv-explore-btn:hover, .nv-explore-btn.on { background: var(--bg-soft); color: var(--text); }
  .nv-links > a.active { background: var(--sun); color: #14213D; }

  .nv-explore { position: relative; }
  .nv-panel {
    position: absolute; left: 0; top: calc(100% + 16px); width: 520px;
    background: var(--white); border: 2px solid var(--line); border-radius: 22px;
    box-shadow: var(--hard); padding: 10px;
    display: grid; grid-template-columns: 1fr 1fr; gap: 6px;
    animation: nvPop .18s cubic-bezier(.21,.7,.25,1);
  }
  @keyframes nvPop { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: none; } }
  .nv-tile { display: flex; align-items: center; gap: 12px; padding: 10px; border-radius: 14px; transition: background .12s ease; }
  .nv-tile:hover { background: var(--bg-soft); }
  .nv-tile .ti {
    width: 42px; height: 42px; border-radius: 13px; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
    border: 1.5px solid var(--line); color: #14213D;
  }
  .nv-tile .ti.sun { background: var(--sun); } .nv-tile .ti.sea { background: #9DBDFF; }
  .nv-tile .ti.leaf { background: #8FE0B4; } .nv-tile .ti.violet { background: #C4B6FF; }
  .nv-tile .ti.coral { background: #FF9D88; } .nv-tile .ti.sand { background: #F0E2BE; }
  .nv-tile .tl { font-weight: 700; font-size: 14.5px; color: var(--text); line-height: 1.2; }
  .nv-tile .ts { font-size: 12.5px; color: var(--text-3); margin-top: 2px; }

  .nv-actions { display: flex; align-items: center; gap: 4px; margin-left: auto; flex-shrink: 0; }
  .nv-icon-btn {
    width: 40px; height: 40px; position: relative;
    display: inline-flex; align-items: center; justify-content: center;
    border-radius: 12px; color: var(--text-2);
    transition: background .14s, color .14s;
  }
  .nv-icon-btn:hover { background: var(--bg-soft); color: var(--text); }
  .nv-icon-btn .dot {
    position: absolute; top: 3px; right: 2px; min-width: 17px; height: 17px; padding: 0 4px;
    background: var(--coral); color: #fff; border: 1.5px solid var(--white);
    border-radius: 999px; font-size: 10px; font-weight: 800;
    display: inline-flex; align-items: center; justify-content: center;
  }

  .nv-search-btn {
    display: inline-flex; align-items: center; gap: 9px; height: 40px; padding: 0 12px;
    border-radius: 12px; background: var(--bg-soft); color: var(--text-3);
    font-size: 13.5px; font-weight: 600; transition: color .14s ease;
  }
  .nv-search-btn:hover { color: var(--text); }
  .nv-search-btn kbd {
    font-family: var(--font-mono); font-size: 10px; font-weight: 600; padding: 2px 6px;
    border-radius: 6px; background: var(--white); border: 1.5px solid var(--border); color: var(--text-3);
  }

  /* Command-palette style search */
  .nv-cmd-back { position: fixed; inset: 0; z-index: 90; background: rgba(20,33,61,.5); display: flex; justify-content: center; align-items: flex-start; padding: 12vh 16px 0; animation: fadeIn .15s ease-out; }
  .nv-cmd { width: 100%; max-width: 580px; background: var(--white); border: 2px solid var(--line); border-radius: 22px; box-shadow: var(--hard-lg); overflow: hidden; animation: nvPop .18s cubic-bezier(.21,.7,.25,1); }
  .nv-cmd form { display: flex; align-items: center; gap: 12px; padding: 6px 18px; border-bottom: 1.5px dashed var(--border); }
  .nv-cmd input { flex: 1; height: 54px; border: none; outline: none; background: none; font-size: 17px; font-weight: 600; color: var(--text); }
  .nv-cmd input::placeholder { color: var(--text-4); font-weight: 500; }
  .nv-cmd-quick { padding: 14px 18px 18px; }
  .nv-cmd-quick .ql { font-family: var(--font-mono); font-size: 10.5px; letter-spacing: .1em; text-transform: uppercase; color: var(--text-4); margin-bottom: 10px; }
  .nv-cmd-quick .qs { display: flex; flex-wrap: wrap; gap: 8px; }

  .nv-user {
    display: inline-flex; align-items: center; gap: 8px; height: 44px; padding: 0 10px 0 4px;
    border-radius: 14px; border: 1.5px solid var(--border); margin-left: 4px;
    transition: border-color .14s ease, background .14s ease;
  }
  .nv-user:hover { border-color: var(--line); }
  .nv-user .av, .nv-menu .head .av {
    width: 34px; height: 34px; border-radius: 11px; background: var(--sun); color: #14213D;
    display: inline-flex; align-items: center; justify-content: center;
    font-weight: 800; font-size: 12.5px; font-family: var(--font-display); overflow: hidden; flex-shrink: 0;
  }
  .nv-user .av img, .nv-menu .head .av img { width: 100%; height: 100%; object-fit: cover; }
  .nv-user .nm { font-size: 13.5px; font-weight: 700; max-width: 120px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

  .nv-menu {
    position: absolute; right: 0; top: calc(100% + 16px); min-width: 264px;
    background: var(--white); border: 2px solid var(--line); border-radius: 20px;
    box-shadow: var(--hard); padding: 8px; z-index: 70;
    animation: nvPop .18s cubic-bezier(.21,.7,.25,1);
  }
  .nv-menu .item {
    display: flex; align-items: center; gap: 11px; width: 100%;
    padding: 10px 12px; border-radius: 12px; font-size: 14px; font-weight: 600;
    color: var(--text-2); text-align: left; transition: background .12s;
  }
  .nv-menu .item svg { color: var(--text-3); }
  .nv-menu .item:hover { background: var(--bg-soft); color: var(--text); }
  .nv-menu .item.danger, .nv-menu .item.danger svg { color: var(--red-600); }
  .nv-menu .item.danger:hover { background: var(--red-50); }
  .nv-menu .head { display: flex; gap: 11px; align-items: center; padding: 10px 12px 14px; border-bottom: 1.5px dashed var(--border); margin-bottom: 6px; }
  .nv-menu .head .av { width: 42px; height: 42px; border-radius: 13px; font-size: 14px; }
  .nv-menu .head .nm { font-weight: 700; font-size: 14.5px; line-height: 1.2; }
  .nv-menu .head .ph { font-size: 11.5px; color: var(--text-3); font-family: var(--font-mono); margin-top: 3px; overflow: hidden; text-overflow: ellipsis; }
  .nv-menu .group-title { font-family: var(--font-mono); font-size: 10px; text-transform: uppercase; letter-spacing: 0.12em; color: var(--text-4); padding: 8px 12px 4px; font-weight: 600; }
  .nv-menu hr { border: none; border-top: 1.5px dashed var(--border); margin: 6px 0; }

  .nv-cta-ghost { height: 40px; padding: 0 14px; display: inline-flex; align-items: center; border-radius: 12px; font-size: 14.5px; font-weight: 700; color: var(--text-2); }
  .nv-cta-ghost:hover { background: var(--bg-soft); color: var(--text); }

  .nv-burger { display: none; }

  @media (max-width: 1120px) { .nv-search-btn span, .nv-search-btn kbd { display: none; } .nv-search-btn { width: 40px; padding: 0; justify-content: center; background: none; } }
  @media (max-width: 980px) {
    .nv-links { display: none; }
    .nv-burger { display: inline-flex; width: 42px; height: 42px; align-items: center; justify-content: center; border-radius: 13px; border: 2px solid var(--line); background: var(--sun); color: #14213D; margin-left: 4px; }
  }
  @media (max-width: 600px) {
    .nv-wrap { padding-top: 8px; }
    .nv-bar { height: 58px; border-radius: 18px; padding: 0 8px 0 12px; gap: 6px; }
    .nv-user .nm, .nv-user > svg { display: none; }
    .nv-user { padding: 0 4px; border: none; margin: 0; }
    .nv-cta-ghost { display: none; }
  }

  /* Mobile sheet — a fold-out map */
  .nv-sheet { position: fixed; inset: 0; z-index: 80; background: var(--paper); overflow-y: auto; padding: 16px 18px 40px; animation: fadeIn .16s ease-out; }
  .nv-sheet-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 22px; }
  .nv-sheet-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
  .nv-sheet-grid a {
    display: flex; flex-direction: column; gap: 14px; padding: 16px;
    background: var(--white); border: 2px solid var(--line); border-radius: 18px;
    font-family: var(--font-display); font-weight: 700; font-size: 17px; letter-spacing: -.02em;
  }
  .nv-sheet-grid a.active { background: var(--sun); color: #14213D; }
  .nv-sheet-list { margin-top: 18px; display: flex; flex-direction: column; }
  .nv-sheet-list a { display: flex; align-items: center; gap: 12px; padding: 14px 4px; font-size: 16px; font-weight: 650; border-bottom: 1.5px dashed var(--border); }
  .nv-sheet-cta { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 22px; }
`

function CommandSearch({ open, onClose }) {
  const [q, setQ] = useState('')
  const navigate = useNavigate()
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    setQ('')
    const t = setTimeout(() => ref.current?.focus(), 30)
    const onKey = e => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => { clearTimeout(t); document.removeEventListener('keydown', onKey) }
  }, [open, onClose])

  if (!open) return null

  function go(text) {
    if (!text.trim()) return
    navigate(`/search?q=${encodeURIComponent(text.trim())}`)
    onClose()
  }

  return (
    <div className="nv-cmd-back" onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="nv-cmd" role="dialog" aria-label="Qidiruv">
        <form onSubmit={e => { e.preventDefault(); go(q) }}>
          <Icon name="search" size={20} />
          <input ref={ref} value={q} onChange={e => setQ(e.target.value)} placeholder="Kurs, test, o'qituvchi, resurs…" />
          <button type="submit" className="btn btn-primary btn-sm" disabled={!q.trim()}>Izlash</button>
        </form>
        <div className="nv-cmd-quick">
          <div className="ql">Tez qidiruv</div>
          <div className="qs">
            {['Materiklar', 'Iqlim', "O'zbekiston", 'Okeanlar', 'Xaritalar', 'Aholi'].map(s => (
              <button key={s} type="button" className="chip" onClick={() => go(s)}>{s}</button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function UserMenu({ user, onClose }) {
  const navigate = useNavigate()
  const { logout } = useAuth()
  async function doLogout() { await logout(); onClose(); navigate('/') }

  return (
    <div className="nv-menu">
      <div className="head">
        <div className="av">{user.avatar ? <img src={absUrl(user.avatar)} alt="" /> : user.initials}</div>
        <div style={{ minWidth: 0 }}>
          <div className="nm">{user.display_name}</div>
          <div className="ph">{user.email || user.phone}</div>
        </div>
      </div>
      <Link to="/profile" className="item" onClick={onClose}><Icon name="user" size={16} /> Profilim</Link>
      <Link to="/notifications" className="item" onClick={onClose}><Icon name="bell" size={16} /> Bildirishnomalar</Link>
      {user.role === 'teacher' && (
        <>
          <hr />
          <div className="group-title">O'qituvchi</div>
          <Link to="/teacher" className="item" onClick={onClose}><Icon name="home" size={16} /> Boshqaruv paneli</Link>
          <Link to="/teacher/courses" className="item" onClick={onClose}><Icon name="book" size={16} /> Kurslarim</Link>
          <Link to="/teacher/tests" className="item" onClick={onClose}><Icon name="fileText" size={16} /> Testlarim</Link>
        </>
      )}
      {user.role === 'admin' && (
        <>
          <hr />
          <div className="group-title">Admin</div>
          <Link to="/admin-panel" className="item" onClick={onClose}><Icon name="shield" size={16} /> Admin panel</Link>
          <Link to="/admin-panel/users" className="item" onClick={onClose}><Icon name="users" size={16} /> Foydalanuvchilar</Link>
          <Link to="/admin-panel/courses" className="item" onClick={onClose}><Icon name="book" size={16} /> Kurslar</Link>
        </>
      )}
      <hr />
      <button className="item danger" onClick={doLogout}><Icon name="arrowL" size={16} /> Chiqish</button>
    </div>
  )
}

export default function Navbar() {
  const { user } = useAuth()
  const { theme, toggle } = useTheme()
  const [unread, setUnread] = useState(0)
  const [menuOpen, setMenuOpen] = useState(false)
  const [exploreOpen, setExploreOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [sheetOpen, setSheetOpen] = useState(false)
  const loc = useLocation()
  const userWrapRef = useRef(null)
  const exploreRef = useRef(null)

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

  useEffect(() => { setSheetOpen(false); setMenuOpen(false); setExploreOpen(false) }, [loc.pathname])

  // Ctrl/Cmd+K opens search anywhere
  useEffect(() => {
    function onKey(e) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setSearchOpen(true) }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  // Close dropdowns on outside click / Escape
  useEffect(() => {
    if (!menuOpen && !exploreOpen) return
    function onDown(e) {
      if (menuOpen && userWrapRef.current && !userWrapRef.current.contains(e.target)) setMenuOpen(false)
      if (exploreOpen && exploreRef.current && !exploreRef.current.contains(e.target)) setExploreOpen(false)
    }
    function onKey(e) { if (e.key === 'Escape') { setMenuOpen(false); setExploreOpen(false) } }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey) }
  }, [menuOpen, exploreOpen])

  useEffect(() => {
    document.body.style.overflow = sheetOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [sheetOpen])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const exploreActive = EXPLORE.some(it => loc.pathname.startsWith(it.to))
  const dark = theme === 'dark'

  return (
    <>
      <style>{navCss}</style>
      <div className="nv-wrap">
        <div className="container">
          <header className={`nv-bar ${scrolled ? 'scrolled' : ''}`}>
            <Link to="/" className="nv-logo" aria-label="Ionedu — bosh sahifa"><Logo size={34} /></Link>

            <nav className="nv-links" aria-label="Asosiy menyu">
              {PRIMARY.map(l => (
                <NavLink key={l.to} to={l.to} className={({ isActive }) => isActive ? 'active' : ''}>{l.label}</NavLink>
              ))}
              <div className="nv-explore" ref={exploreRef}>
                <button className={`nv-explore-btn ${exploreOpen || exploreActive ? 'on' : ''}`}
                  onClick={() => setExploreOpen(o => !o)} aria-haspopup="true" aria-expanded={exploreOpen}>
                  Kashf et
                  <Icon name="chevD" size={14} style={{ transform: exploreOpen ? 'rotate(180deg)' : '', transition: '.2s' }} />
                </button>
                {exploreOpen && (
                  <div className="nv-panel">
                    {EXPLORE.map(it => (
                      <Link key={it.to} to={it.to} className="nv-tile" onClick={() => setExploreOpen(false)}>
                        <span className={`ti ${it.tone}`}><Icon name={it.icon} size={19} /></span>
                        <span><span className="tl" style={{ display: 'block' }}>{it.label}</span><span className="ts" style={{ display: 'block' }}>{it.sub}</span></span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </nav>

            <div className="nv-actions">
              <button className="nv-search-btn" onClick={() => setSearchOpen(true)} aria-label="Qidirish">
                <Icon name="search" size={17} /><span>Qidirish</span><kbd>Ctrl K</kbd>
              </button>
              <button className="nv-icon-btn" onClick={toggle} title={dark ? "Yorug' rejim" : 'Tungi rejim'} aria-label="Rejimni almashtirish">
                <Icon name={dark ? 'sun' : 'moon'} size={18} />
              </button>
              {user ? (
                <>
                  <Link to="/notifications" className="nv-icon-btn" title="Bildirishnomalar" aria-label="Bildirishnomalar">
                    <Icon name="bell" size={18} />
                    {unread > 0 && <span className="dot">{unread > 9 ? '9+' : unread}</span>}
                  </Link>
                  <div style={{ position: 'relative' }} ref={userWrapRef}>
                    <button className="nv-user" onClick={() => setMenuOpen(o => !o)} aria-label="Profil menyusi">
                      <span className="av">{user.avatar ? <img src={absUrl(user.avatar)} alt="" /> : user.initials}</span>
                      <span className="nm">{(user.full_name || user.display_name || '').split(' ')[0]}</span>
                      <Icon name="chevD" size={14} style={{ color: 'var(--text-3)', transform: menuOpen ? 'rotate(180deg)' : '', transition: '.2s' }} />
                    </button>
                    {menuOpen && <UserMenu user={user} onClose={() => setMenuOpen(false)} />}
                  </div>
                </>
              ) : (
                <>
                  <Link to="/auth/login" className="nv-cta-ghost">Kirish</Link>
                  <Link to="/auth/register" className="btn btn-primary btn-sm" style={{ height: 40, padding: '0 16px', fontSize: 14 }}>Boshlash</Link>
                </>
              )}
              <button className="nv-burger" onClick={() => setSheetOpen(true)} aria-label="Menyu">
                <Icon name="list" size={19} />
              </button>
            </div>
          </header>
        </div>
      </div>

      <CommandSearch open={searchOpen} onClose={() => setSearchOpen(false)} />

      {sheetOpen && (
        <div className="nv-sheet">
          <div className="nv-sheet-top">
            <Logo size={34} />
            <button className="nv-burger" style={{ display: 'inline-flex' }} onClick={() => setSheetOpen(false)} aria-label="Yopish">
              <Icon name="x" size={19} />
            </button>
          </div>
          <div className="nv-sheet-grid">
            {PRIMARY.map(l => (
              <NavLink key={l.to} to={l.to} className={({ isActive }) => isActive ? 'active' : ''}>
                <Icon name={{ '/courses': 'book', '/tests': 'fileText', '/games': 'gamepad', '/world': 'map', '/ratings': 'trophy' }[l.to]} size={22} />
                {l.label}
              </NavLink>
            ))}
            <NavLink to="/blog"><Icon name="news" size={22} />Blog</NavLink>
          </div>
          <div className="nv-sheet-list">
            {EXPLORE.filter(e => e.to !== '/blog').map(it => (
              <NavLink key={it.to} to={it.to}><Icon name={it.icon} size={18} /> {it.label}</NavLink>
            ))}
            {user && <NavLink to="/profile"><Icon name="user" size={18} /> Profilim</NavLink>}
            {user?.role === 'teacher' && <NavLink to="/teacher"><Icon name="home" size={18} /> O'qituvchi paneli</NavLink>}
            {user?.role === 'admin' && <NavLink to="/admin-panel"><Icon name="shield" size={18} /> Admin panel</NavLink>}
          </div>
          {!user && (
            <div className="nv-sheet-cta">
              <Link to="/auth/login" className="btn btn-secondary">Kirish</Link>
              <Link to="/auth/register" className="btn btn-primary">Boshlash</Link>
            </div>
          )}
        </div>
      )}
    </>
  )
}
