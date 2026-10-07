import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuth } from '../../store/auth'
import GoogleButton from '../../components/GoogleButton'
import Icon from '../../components/Icon'

const css = `
  .auth-page {
    min-height: 100vh; display: flex; align-items: center; justify-content: center;
    padding: 40px 20px; position: relative; overflow: hidden;
    background:
      radial-gradient(60% 50% at 50% -8%, var(--green-50), transparent 62%),
      radial-gradient(46% 42% at 102% 104%, rgba(37,99,235,.07), transparent 60%),
      var(--paper);
  }
  .auth-card {
    width: 100%; max-width: 416px; position: relative; z-index: 1;
    background: var(--white); border: 1px solid var(--border); border-radius: 22px;
    padding: 38px 34px 32px; box-shadow: var(--shadow-pop);
  }
  .auth-brand {
    display: inline-flex; align-items: center; gap: 10px;
    font-family: var(--font-display); font-weight: 700; font-size: 20px;
    letter-spacing: -0.04em; color: var(--text); text-decoration: none;
  }
  .auth-brand .mark {
    width: 32px; height: 32px; border-radius: 10px; background: var(--green-600);
    color: white; display: flex; align-items: center; justify-content: center;
  }
  .auth-brand .accent { color: var(--green-600); }

  .auth-head { text-align: center; margin: 22px 0 26px; }
  .auth-head h1 { font-size: 25px; font-weight: 700; letter-spacing: -0.03em; margin-bottom: 7px; }
  .auth-head p { font-size: 14px; color: var(--text-3); line-height: 1.5; }

  .auth-card .field { margin-bottom: 16px; }
  .auth-card .label { font-size: 13px; font-weight: 560; color: var(--text-2); margin-bottom: 7px; }
  .auth-card .input { height: 48px; font-size: 15px; border-radius: 12px; }

  .auth-row { display: flex; justify-content: space-between; align-items: center; margin: 2px 0 20px; font-size: 13px; }
  .auth-row a { color: var(--green-700); font-weight: 500; }
  .auth-cta {
    width: 100%; height: 50px; border-radius: 999px; font-weight: 560; font-size: 15px;
    background: var(--ink); color: white; border: none; cursor: pointer;
    display: inline-flex; align-items: center; justify-content: center; gap: 8px;
    transition: background .18s ease, transform .12s ease;
  }
  .auth-cta:hover { background: var(--ink-2); }
  .auth-cta:active { transform: scale(0.985); }
  .auth-cta:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
  .auth-foot { text-align: center; font-size: 14px; color: var(--text-3); margin-top: 24px; }
  .auth-foot a { color: var(--green-700); font-weight: 560; }
`

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const login = useAuth(s => s.login)
  const user = useAuth(s => s.user)
  const navigate = useNavigate()
  const loc = useLocation()

  // Allaqachon kirgan bo'lsa — auth sahifasiga kerak emas
  useEffect(() => {
    if (user) navigate(loc.state?.from || '/', { replace: true })
  }, [user]) // eslint-disable-line react-hooks/exhaustive-deps

  async function submit(e) {
    e.preventDefault()
    setBusy(true)
    try {
      await login(email, password)
      toast.success('Xush kelibsiz!')
      navigate(loc.state?.from || '/', { replace: true })
    } catch (e) {
      toast.error(e.response?.data?.detail || "Email yoki parol noto'g'ri")
    } finally { setBusy(false) }
  }

  return (
    <>
      <style>{css}</style>
      <div className="auth-page">
        <div className="auth-card fade-up">
          <div style={{ textAlign: 'center' }}>
            <Link to="/" className="auth-brand">
              <span className="mark">
                <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
              </span>
              Ion<span className="accent">edu</span>
            </Link>
          </div>

          <div className="auth-head">
            <h1>Xush kelibsiz</h1>
            <p>Akkauntingizga kirib, o'rganishni davom ettiring</p>
          </div>

          <GoogleButton text="signin_with" />
          <div className="auth-divider">yoki</div>

          <form onSubmit={submit}>
            <div className="field">
              <label className="label">Email</label>
              <input type="email" className="input" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="siz@email.com" autoFocus required autoComplete="email" />
            </div>
            <div className="field">
              <label className="label">Parol</label>
              <input type="password" className="input" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
            </div>
            <div className="auth-row">
              <label className="checkbox"><input type="checkbox" /> Eslab qolish</label>
              <Link to="/auth/reset">Parolni unutdingizmi?</Link>
            </div>
            <button type="submit" className="auth-cta" disabled={busy}>
              {busy ? 'Kirilmoqda…' : <>Kirish <Icon name="arrowR" size={15} /></>}
            </button>
          </form>

          <div className="auth-foot">
            Yangi foydalanuvchimisiz? <Link to="/auth/register">Bepul akkaunt yaratish</Link>
          </div>
        </div>
      </div>
    </>
  )
}
