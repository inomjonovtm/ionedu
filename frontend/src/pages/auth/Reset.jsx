import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import api from '../../api/client'
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
    <>
      <style>{`body{background:var(--bg-soft)}`}</style>
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 16px' }}>
        <div className="card fade-up" style={{ width: '100%', maxWidth: 440, padding: 40, background: 'var(--white)', boxShadow: '0 20px 60px -20px rgba(0,0,0,.08)' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 18 }}>
            <div style={{ width: 56, height: 56, borderRadius: 14, background: 'var(--green-50)', color: 'var(--green-600)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="shield" size={24} />
            </div>
          </div>
          <h1 style={{ fontSize: 24, textAlign: 'center', marginBottom: 6 }}>Parolni tiklash</h1>
          <p style={{ textAlign: 'center', color: 'var(--text-3)', fontSize: 14, marginBottom: 28 }}>
            {step === 1
              ? 'Email manzilingizni kiriting — tasdiqlash kodi yuboramiz'
              : `${email} manziliga yuborilgan 6 xonali kodni kiriting`}
          </p>

          {step === 1 ? (
            <form onSubmit={sendCode}>
              <div className="field">
                <label className="label">Email</label>
                <input className="input" type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="siz@email.com" autoFocus required autoComplete="email" />
              </div>
              <button className="btn btn-primary btn-lg btn-block" disabled={busy || !/^\S+@\S+\.\S+$/.test(email.trim())}>
                {busy ? 'Yuborilmoqda…' : 'Kod yuborish'}
              </button>
            </form>
          ) : (
            <form onSubmit={confirm}>
              <div className="field">
                <label className="label">Tasdiqlash kodi</label>
                <input className="input" inputMode="numeric" maxLength={6} autoFocus
                  value={code} onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="123456"
                  style={{ textAlign: 'center', fontSize: 22, letterSpacing: '0.4em', fontFamily: 'var(--font-display)', fontWeight: 700, height: 52 }} />
              </div>
              <div className="field">
                <label className="label">Yangi parol</label>
                <input className="input" type="password" value={pwd} onChange={e => setPwd(e.target.value)} minLength={6} required />
              </div>
              <div className="field">
                <label className="label">Yangi parol (qaytadan)</label>
                <input className="input" type="password" value={pwd2} onChange={e => setPwd2(e.target.value)} minLength={6} required />
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

          <div style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-3)', marginTop: 24 }}>
            <Link to="/auth/login" style={{ color: 'var(--green-600)', fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <Icon name="arrowL" size={14} /> Kirish sahifasiga qaytish
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}
