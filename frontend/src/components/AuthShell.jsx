import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import api from '../api/client'
import { useAuth } from '../store/auth'
import Icon from './Icon'
import Logo from './Logo'

/* Shared chrome for /auth/* pages: an ink "atlas cover" on the left,
   the form on map paper on the right. */
const css = `
  .au { min-height: 100vh; display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1.05fr); background: var(--paper); }
  .au-side {
    position: relative; overflow: hidden; margin: 14px 0 14px 14px; border-radius: 30px;
    background: var(--ink); color: #fff; padding: 34px 40px 40px;
    display: flex; flex-direction: column; justify-content: space-between;
  }
  .au-side::before { content: ''; position: absolute; inset: 0; background-image: var(--topo); background-size: 520px 360px; filter: invert(1); opacity: .55; }
  .au-side > * { position: relative; }
  .au-side h2 { color: #fff; font-size: clamp(38px, 4.4vw, 64px); font-weight: 800; letter-spacing: -.045em; line-height: .98; max-width: 520px; }
  .au-side h2 em { font-style: normal; color: var(--sun); }
  .au-side p { color: #B7C0D8; font-size: 16px; margin-top: 18px; max-width: 420px; line-height: 1.6; }
  .au-stickers { position: relative; height: 210px; margin: 10px 0; }
  .au-st {
    position: absolute; display: flex; align-items: center; justify-content: center;
    border: 2px solid #14213D; border-radius: 22px; font-size: 44px; box-shadow: 5px 5px 0 rgba(0,0,0,.35);
  }
  .au-st.a { width: 112px; height: 112px; background: var(--sun); left: 4%; top: 20px; --tilt: -8deg; }
  .au-st.b { width: 92px; height: 92px; background: #9DBDFF; left: 36%; top: 96px; --tilt: 6deg; animation-delay: .8s; }
  .au-st.c { width: 100px; height: 100px; background: #FF9D88; left: 62%; top: 8px; --tilt: 10deg; animation-delay: 1.5s; }
  .au-st.d { width: 76px; height: 76px; background: #8FE0B4; left: 16%; top: 132px; font-size: 34px; --tilt: 12deg; animation-delay: 2.1s; }
  .au-coord { font-family: var(--font-mono); font-size: 11px; letter-spacing: .1em; color: #8591B0; text-transform: uppercase; }

  .au-main { display: flex; flex-direction: column; min-width: 0; padding: 26px 28px 30px; }
  .au-top { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
  .au-top .mlogo { display: none; }
  .au-back { display: inline-flex; align-items: center; gap: 7px; font-size: 13.5px; font-weight: 700; color: var(--text-3); }
  .au-back:hover { color: var(--text); }
  .au-body { flex: 1; display: flex; align-items: center; justify-content: center; padding: 24px 0; }
  .au-form { width: 100%; max-width: 440px; }
  .au-form.wide { max-width: 520px; }
  .au-title { font-size: 38px; font-weight: 800; letter-spacing: -.045em; line-height: 1.02; }
  .au-sub { font-size: 15px; color: var(--text-3); margin: 10px 0 26px; line-height: 1.55; }
  .au-foot { font-size: 14px; color: var(--text-3); margin-top: 22px; }
  .au-foot a, .au-link { color: var(--text); font-weight: 750; text-decoration: underline; text-decoration-color: var(--sun); text-decoration-thickness: 3px; text-underline-offset: 3px; }
  .au-row { display: flex; justify-content: space-between; align-items: center; margin: 2px 0 20px; font-size: 13.5px; }
  .au-grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .au-pw { position: relative; }
  .au-pw .input { padding-right: 46px; }
  .au-pw button { position: absolute; right: 6px; top: 6px; width: 34px; height: 34px; border-radius: 10px; color: var(--text-3); display: flex; align-items: center; justify-content: center; }
  .au-pw button:hover { background: var(--bg-soft); color: var(--text); }
  .au-meter { display: flex; gap: 4px; margin-top: 8px; }
  .au-meter i { flex: 1; height: 5px; border-radius: 99px; background: var(--border); }
  .au-meter i.on1 { background: var(--coral); } .au-meter i.on2 { background: var(--sun); } .au-meter i.on3 { background: var(--green-600); }

  .au-steps { display: flex; align-items: center; gap: 8px; margin-bottom: 22px; }
  .au-steps .st { display: inline-flex; align-items: center; gap: 8px; font-size: 12.5px; font-weight: 700; color: var(--text-4); }
  .au-steps .st b { width: 26px; height: 26px; border-radius: 9px; border: 1.5px solid var(--border); display: inline-flex; align-items: center; justify-content: center; font-family: var(--font-mono); font-size: 11px; }
  .au-steps .st.on { color: var(--text); } .au-steps .st.on b { background: var(--sun); border-color: var(--line); color: #14213D; }
  .au-steps .st.done b { background: var(--green-600); border-color: var(--green-600); color: #fff; }
  .au-steps .ln { flex: 1; border-top: 1.5px dashed var(--border); }

  .au-code { display: flex; gap: 10px; margin: 6px 0 4px; }
  .au-code input {
    width: 100%; min-width: 0; height: 64px; text-align: center; font-family: var(--font-display); font-size: 30px; font-weight: 800;
    background: var(--white); border: 2px solid var(--border); border-radius: 16px; outline: none; color: var(--text);
    transition: border-color .12s ease, box-shadow .12s ease, transform .12s ease;
  }
  .au-code input:focus { border-color: var(--line); box-shadow: 3px 3px 0 var(--sun); transform: translateY(-2px); }
  .au-code input.filled { border-color: var(--line); }
  .au-mail { display: inline-flex; align-items: center; gap: 8px; padding: 6px 12px; border-radius: 999px; background: var(--sun-soft); border: 1.5px solid var(--line); font-weight: 700; font-size: 13.5px; color: var(--text); max-width: 100%; overflow: hidden; text-overflow: ellipsis; }
  .au-dev { margin-top: 16px; padding: 12px 14px; border-radius: 14px; border: 1.5px dashed var(--line); background: var(--bg-soft); font-size: 13px; color: var(--text-2); line-height: 1.5; }
  .au-dev b { font-family: var(--font-mono); letter-spacing: .2em; font-size: 15px; color: var(--text); }

  .au-roles { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 20px; }
  .au-role { text-align: left; padding: 14px; border-radius: 18px; background: var(--white); border: 1.5px solid var(--border); transition: all .14s ease; display: flex; gap: 12px; align-items: center; }
  .au-role:hover { border-color: var(--line); }
  .au-role.on { border: 2px solid var(--line); background: var(--sun-soft); box-shadow: var(--hard-sm); }
  .au-role .em { width: 46px; height: 46px; border-radius: 14px; border: 1.5px solid var(--line); background: var(--white); display: flex; align-items: center; justify-content: center; font-size: 24px; flex-shrink: 0; }
  .au-role .nm { font-family: var(--font-display); font-weight: 750; font-size: 15.5px; letter-spacing: -.02em; }
  .au-role .ds { font-size: 12px; color: var(--text-3); margin-top: 2px; line-height: 1.35; }

  @media (max-width: 940px) {
    .au { grid-template-columns: 1fr; }
    .au-side { display: none; }
    .au-top .mlogo { display: inline-flex; }
    .au-main { padding: 18px 18px 28px; }
    .au-title { font-size: 31px; }
  }
  @media (max-width: 480px) {
    .au-grid2, .au-roles { grid-template-columns: 1fr; }
    .au-code { gap: 6px; } .au-code input { height: 54px; font-size: 24px; border-radius: 13px; }
  }
`

export default function AuthShell({ headline, text, wide, children }) {
  return (
    <div className="au">
      <style>{css}</style>
      <aside className="au-side">
        <Link to="/"><Logo size={36} light /></Link>
        <div>
          <div className="au-stickers" aria-hidden="true">
            <span className="au-st a floaty">🌍</span>
            <span className="au-st b floaty">🧭</span>
            <span className="au-st c floaty">🏔️</span>
            <span className="au-st d floaty">📍</span>
          </div>
          <h2>{headline}</h2>
          {text && <p>{text}</p>}
        </div>
        <div className="au-coord">41.31°N · 69.24°E — Toshkent</div>
      </aside>
      <main className="au-main">
        <div className="au-top">
          <Link to="/" className="mlogo"><Logo size={32} /></Link>
          <span />
          <Link to="/" className="au-back"><Icon name="arrowL" size={15} /> Bosh sahifa</Link>
        </div>
        <div className="au-body">
          <div className={`au-form fade-up ${wide ? 'wide' : ''}`}>{children}</div>
        </div>
      </main>
    </div>
  )
}

/** Password field with show/hide and an optional strength meter. */
export function PasswordInput({ value, onChange, meter, ...rest }) {
  const [show, setShow] = useState(false)
  let score = 0
  if (value.length >= 6) score = 1
  if (value.length >= 8 && /\d/.test(value) && /[a-zA-Z]/.test(value)) score = 2
  if (value.length >= 10 && /\d/.test(value) && /[a-z]/.test(value) && /[A-Z\W]/.test(value)) score = 3
  return (
    <>
      <div className="au-pw">
        <input className="input" type={show ? 'text' : 'password'} value={value}
          onChange={e => onChange(e.target.value)} {...rest} />
        <button type="button" onClick={() => setShow(s => !s)} tabIndex={-1}
          aria-label={show ? 'Parolni yashirish' : "Parolni ko'rsatish"}>
          <Icon name={show ? 'lock' : 'eye'} size={16} />
        </button>
      </div>
      {meter && value && (
        <>
          <div className="au-meter">
            {[1, 2, 3].map(n => <i key={n} className={score >= n ? `on${score}` : ''} />)}
          </div>
          <div className="field-hint">{['Juda qisqa — kamida 6 ta belgi', 'Kuchsiz parol', "O'rtacha parol", 'Kuchli parol'][score]}</div>
        </>
      )}
    </>
  )
}

/** Six-box one-time-code input with paste support. */
export function CodeInput({ value, onChange, onComplete, autoFocus = true }) {
  const refs = useRef([])
  const digits = Array.from({ length: 6 }, (_, i) => value[i] || '')

  useEffect(() => { if (autoFocus) refs.current[0]?.focus() }, [autoFocus])

  function setAll(str, focusAt) {
    const clean = str.replace(/\D/g, '').slice(0, 6)
    onChange(clean)
    const idx = Math.min(focusAt ?? clean.length, 5)
    requestAnimationFrame(() => refs.current[idx]?.focus())
    if (clean.length === 6) onComplete?.(clean)
  }

  function onKey(i, e) {
    if (e.key === 'Backspace') {
      e.preventDefault()
      if (digits[i]) setAll(value.slice(0, i) + value.slice(i + 1), i)
      else if (i > 0) setAll(value.slice(0, i - 1) + value.slice(i), i - 1)
    } else if (e.key === 'ArrowLeft' && i > 0) refs.current[i - 1]?.focus()
    else if (e.key === 'ArrowRight' && i < 5) refs.current[i + 1]?.focus()
  }

  return (
    <div className="au-code" onPaste={e => { e.preventDefault(); setAll(e.clipboardData.getData('text')) }}>
      {digits.map((d, i) => (
        <input key={i} ref={el => { refs.current[i] = el }} value={d} inputMode="numeric" autoComplete={i === 0 ? 'one-time-code' : 'off'}
          maxLength={1} className={d ? 'filled' : ''} aria-label={`Kod ${i + 1}-raqam`}
          onChange={e => {
            const ch = e.target.value.replace(/\D/g, '').slice(-1)
            if (!ch) return
            setAll((value.slice(0, i) + ch + value.slice(i + 1)).slice(0, 6), i + 1)
          }}
          onKeyDown={e => onKey(i, e)} onFocus={e => e.target.select()} />
      ))}
    </div>
  )
}

/** Email-verification step used after register and after an unverified login. */
export function VerifyEmailStep({ email, initialWait = 60, debugCode, onVerified, onBack }) {
  const completeAuth = useAuth(s => s.completeAuth)
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [wait, setWait] = useState(initialWait)
  const [dev, setDev] = useState(debugCode || '')

  useEffect(() => {
    if (wait <= 0) return
    const id = setTimeout(() => setWait(w => w - 1), 1000)
    return () => clearTimeout(id)
  }, [wait])

  async function verify(c = code) {
    if (c.length !== 6 || busy) return
    setBusy(true)
    try {
      const { data } = await api.post('/auth/verify-email/', { email, code: c })
      completeAuth(data)
      toast.success('Email tasdiqlandi. Xush kelibsiz!')
      onVerified?.(data.user)
    } catch (e) {
      toast.error(e.response?.data?.detail || "Kodni tekshirib bo'lmadi")
      setCode('')
    } finally { setBusy(false) }
  }

  async function resend() {
    try {
      const { data } = await api.post('/auth/verify-email/resend/', { email })
      setWait(data.resend_in || 60)
      if (data.debug_code) setDev(data.debug_code)
      toast.success('Yangi kod yuborildi')
    } catch (e) {
      const d = e.response?.data
      if (d?.resend_in) setWait(d.resend_in)
      toast.error(d?.detail || "Kod yuborib bo'lmadi")
    }
  }

  return (
    <>
      <h1 className="au-title">Pochtangizni <span className="mark-sun">tekshiring</span></h1>
      <p className="au-sub">
        6 xonali tasdiqlash kodini shu manzilga yubordik:<br />
        <span className="au-mail" style={{ marginTop: 10 }}><Icon name="mail" size={14} /> {email}</span>
      </p>
      <form onSubmit={e => { e.preventDefault(); verify() }}>
        <label className="label">Tasdiqlash kodi</label>
        <CodeInput value={code} onChange={setCode} onComplete={verify} />
        <div className="field-hint" style={{ marginBottom: 18 }}>Kod 15 daqiqa amal qiladi. Xat kelmasa, «Spam» jildini ham tekshiring.</div>
        <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={busy || code.length !== 6}>
          {busy ? 'Tekshirilmoqda…' : <>Tasdiqlash <Icon name="check" size={17} /></>}
        </button>
      </form>
      <div className="au-foot" style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        {wait > 0
          ? <span>Qayta yuborish: <b style={{ fontFamily: 'var(--font-mono)', color: 'var(--text)' }}>{wait}s</b></span>
          : <button type="button" className="au-link" onClick={resend}>Kodni qayta yuborish</button>}
        {onBack && <button type="button" className="au-link" onClick={onBack}>Emailni o'zgartirish</button>}
      </div>
      {dev && (
        <div className="au-dev">
          <strong>Dev rejim:</strong> pochta serveri sozlanmagan, shuning uchun kod shu yerda ko'rsatilmoqda: <b>{dev}</b>
        </div>
      )}
    </>
  )
}
