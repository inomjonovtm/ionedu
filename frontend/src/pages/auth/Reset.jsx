import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import api from '../../api/client'
import AuthShell, { CodeInput, PasswordInput } from '../../components/AuthShell'
import Icon from '../../components/Icon'

/**
 * Two-step email-based password reset:
 *   1. email → 6-digit code is sent to the inbox
 *   2. code + new password → password updated
 */
export default function Reset() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [pwd, setPwd] = useState('')
  const [pwd2, setPwd2] = useState('')
  const [busy, setBusy] = useState(false)

  async function sendCode(e) {
    e.preventDefault()
    setBusy(true)
    try {
      await api.post('/auth/password-reset/', { email: email.trim().toLowerCase() })
      toast.success('Tasdiqlash kodi emailingizga yuborildi')
      setStep(2)
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Xatolik. Qayta urinib ko\'ring')
    } finally { setBusy(false) }
  }

  async function confirm(e) {
    e.preventDefault()
    if (pwd !== pwd2) return toast.error('Parollar mos kelmadi')
    if (pwd.length < 6) return toast.error('Parol kamida 6 ta belgi')
    setBusy(true)
    try {
      await api.post('/auth/password-reset/confirm/', {
        email: email.trim().toLowerCase(), code: code.trim(), new_password: pwd,
      })
      toast.success('Parol yangilandi! Endi yangi parol bilan kiring.')
      navigate('/auth/login')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Xatolik')
    } finally { setBusy(false) }
  }

  return (
    <AuthShell headline={<>Yo'lni <em>yo'qotdingizmi?</em> Qaytaramiz.</>}
      text="Emailingizga kod yuboramiz — yangi parol o'rnatib, sayohatni davom ettirasiz.">
      <h1 className="au-title">Parolni <span className="mark-sun">tiklash</span></h1>
      <p className="au-sub">
        {step === 1
          ? 'Email manzilingizni kiriting — tasdiqlash kodini yuboramiz.'
          : <>Kod shu manzilga yuborildi:<br /><span className="au-mail" style={{ marginTop: 10 }}><Icon name="mail" size={14} /> {email}</span></>}
      </p>

      {step === 1 ? (
        <form onSubmit={sendCode}>
          <div className="field">
            <label className="label" htmlFor="rs-email">Email</label>
            <input id="rs-email" className="input" type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="siz@email.com" autoFocus required autoComplete="email" />
          </div>
          <button className="btn btn-primary btn-lg btn-block" disabled={busy || !/^\S+@\S+\.\S+$/.test(email.trim())}>
            {busy ? 'Yuborilmoqda…' : <>Kod yuborish <Icon name="arrowR" size={17} /></>}
          </button>
        </form>
      ) : (
        <form onSubmit={confirm}>
          <div className="field">
            <label className="label">Tasdiqlash kodi</label>
            <CodeInput value={code} onChange={setCode} />
          </div>
          <div className="field">
            <label className="label">Yangi parol</label>
            <PasswordInput value={pwd} onChange={setPwd} meter minLength={6} required autoComplete="new-password" />
          </div>
          <div className="field">
            <label className="label">Yangi parol (qaytadan)</label>
            <PasswordInput value={pwd2} onChange={setPwd2} minLength={6} required autoComplete="new-password" />
            {pwd2 && pwd !== pwd2 && <div className="field-error">Parollar mos kelmadi</div>}
          </div>
          <button className="btn btn-primary btn-lg btn-block" disabled={busy || code.length !== 6}>
            {busy ? 'Tekshirilmoqda…' : 'Parolni yangilash'}
          </button>
          <button type="button" className="btn btn-ghost btn-block" style={{ marginTop: 8 }}
            onClick={() => { setStep(1); setCode('') }}>
            Boshqa email kiritish
          </button>
        </form>
      )}

      <div className="au-foot">
        <Link to="/auth/login">Kirish sahifasiga qaytish</Link>
      </div>
    </AuthShell>
  )
}
