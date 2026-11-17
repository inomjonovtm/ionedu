import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuth } from '../../store/auth'
import GoogleButton from '../../components/GoogleButton'
import AuthShell, { PasswordInput, VerifyEmailStep } from '../../components/AuthShell'
import Icon from '../../components/Icon'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [pending, setPending] = useState(null) // { email, resend_in, debug_code }
  const login = useAuth(s => s.login)
  const user = useAuth(s => s.user)
  const navigate = useNavigate()
  const loc = useLocation()
  const dest = loc.state?.from || '/'

  // Already signed in → nothing to do here
  useEffect(() => {
    if (user) navigate(dest, { replace: true })
  }, [user]) // eslint-disable-line react-hooks/exhaustive-deps

  async function submit(e) {
    e.preventDefault()
    setBusy(true)
    try {
      const res = await login(email.trim(), password)
      if (res?.verification_required) {
        setPending(res)
        toast('Avval emailingizni tasdiqlang', { icon: '✉️' })
        return
      }
      toast.success('Xush kelibsiz!')
      navigate(dest, { replace: true })
    } catch (err) {
      const d = err.response?.data
      toast.error(d?.detail || (err.response ? "Email yoki parol noto'g'ri" : "Server bilan aloqa yo'q"))
    } finally { setBusy(false) }
  }

  return (
    <AuthShell headline={<>Yana <em>sayohatga</em> tayyormisiz?</>}
      text="Kurslaringiz, testlaringiz va yutuqlaringiz sizni kutib turibdi.">
      {pending ? (
        <VerifyEmailStep email={pending.email} initialWait={pending.resend_in} debugCode={pending.debug_code}
          onVerified={() => navigate(dest, { replace: true })} onBack={() => setPending(null)} />
      ) : (
        <>
          <h1 className="au-title">Xush <span className="mark-sun">kelibsiz</span></h1>
          <p className="au-sub">Akkauntingizga kiring va o'rganishni davom ettiring.</p>

          <GoogleButton text="signin_with" />

          <form onSubmit={submit}>
            <div className="field">
              <label className="label" htmlFor="lg-email">Email</label>
              <input id="lg-email" type="email" className="input" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="siz@email.com" autoFocus required autoComplete="email" />
            </div>
            <div className="field">
              <label className="label" htmlFor="lg-pw">Parol</label>
              <PasswordInput id="lg-pw" value={password} onChange={setPassword} placeholder="••••••••"
                required autoComplete="current-password" />
            </div>
            <div className="au-row">
              <span className="text-muted">Parol esdan chiqdimi?</span>
              <Link to="/auth/reset" className="au-link">Tiklash</Link>
            </div>
            <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={busy}>
              {busy ? 'Kirilmoqda…' : <>Kirish <Icon name="arrowR" size={17} /></>}
            </button>
          </form>

          <div className="au-foot">
            Yangi foydalanuvchimisiz? <Link to="/auth/register">Bepul akkaunt yarating</Link>
          </div>
        </>
      )}
    </AuthShell>
  )
}
