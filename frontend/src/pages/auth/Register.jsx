import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuth } from '../../store/auth'
import PhoneInput from '../../components/PhoneInput'
import GoogleButton from '../../components/GoogleButton'
import Icon from '../../components/Icon'

const REGIONS = [
  'Toshkent', 'Toshkent viloyati', 'Andijon', 'Buxoro', "Farg'ona", 'Jizzax',
  'Namangan', 'Navoiy', 'Qashqadaryo', "Qoraqalpog'iston", 'Samarqand',
  'Sirdaryo', 'Surxondaryo', 'Xorazm',
]

const css = `
  .auth-page {
    min-height: 100vh; display: flex; align-items: center; justify-content: center;
    padding: 18px 16px; position: relative; overflow: auto;
    background:
      radial-gradient(60% 50% at 50% -6%, var(--green-50), transparent 62%),
      radial-gradient(46% 42% at 102% 104%, rgba(37,99,235,.07), transparent 60%),
      var(--paper);
  }
  .auth-card {
    width: 100%; max-width: 480px; position: relative; z-index: 1;
    background: var(--white); border: 1px solid var(--border); border-radius: 22px;
    padding: 22px 26px 18px; box-shadow: var(--shadow-pop);
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

  .auth-head { text-align: center; margin: 12px 0 14px; }
  .auth-head h1 { font-size: 21px; font-weight: 700; letter-spacing: -0.03em; margin-bottom: 4px; }
  .auth-head p { font-size: 13px; color: var(--text-3); line-height: 1.45; }

  /* Role cards */
  .role-cards { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 14px; }
  .role-card {
    position: relative; padding: 11px 13px; border: 1px solid var(--border); border-radius: 14px;
    background: var(--white); cursor: pointer; text-align: left; transition: all .18s ease;
  }
  .role-card:hover { border-color: #CFD3CE; box-shadow: var(--shadow-soft); }
  .role-card.active { border-color: var(--green-600); background: var(--green-50); box-shadow: inset 0 0 0 1px var(--green-600); }
  .role-card.active::after {
    content: '✓'; position: absolute; top: 12px; right: 14px;
    width: 21px; height: 21px; border-radius: 999px; background: var(--green-600); color: white;
    display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700;
  }
  .role-card .ico {
    width: 32px; height: 32px; border-radius: 10px; display: flex; align-items: center; justify-content: center;
    margin-bottom: 7px; background: var(--bg-soft); color: var(--text-2); transition: all .18s;
  }
  .role-card.active .ico { background: var(--green-600); color: white; }
  .role-card .nm { font-family: var(--font-display); font-weight: 650; font-size: 14px; letter-spacing: -0.015em; color: var(--text); margin-bottom: 2px; }
  .role-card .ds { font-size: 11.5px; color: var(--text-3); line-height: 1.4; }

  .step-bar { display: flex; gap: 6px; margin-bottom: 14px; }
  .step-bar .s { flex: 1; height: 4px; border-radius: 999px; background: var(--border); transition: background .2s ease; }
  .step-bar .s.active { background: var(--green-600); }

  .field { margin-bottom: 10px; }
  .field .label { font-size: 12.5px; font-weight: 560; color: var(--text-2); margin-bottom: 5px; }
  .field .input, .field .select { height: 41px; font-size: 14px; border-radius: 11px; }
  .field .textarea { height: auto; border-radius: 12px; }
  .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  @media (max-width: 480px) { .grid-2 { grid-template-columns: 1fr; } }

  .terms { font-size: 12.5px; color: var(--text-3); margin: 6px 0 12px; line-height: 1.5; }
  .terms a { color: var(--green-700); font-weight: 500; }

  .auth-cta {
    width: 100%; height: 44px; border-radius: 999px; font-weight: 560; font-size: 14.5px;
    background: var(--ink); color: white; border: none; cursor: pointer;
    transition: background .18s ease, transform .12s ease;
    display: inline-flex; align-items: center; justify-content: center; gap: 8px;
  }
  .auth-cta:hover { background: var(--ink-2); }
  .auth-cta:active { transform: scale(0.985); }
  .auth-cta:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
  .btn-ghost-step {
    height: 44px; padding: 0 18px; border-radius: 999px; font-weight: 500; font-size: 14px;
    background: var(--bg-soft); color: var(--text-2); border: 1px solid var(--border); cursor: pointer;
    transition: all .15s ease;
  }
  .btn-ghost-step:hover { background: var(--border-2); }

  .auth-foot { text-align: center; font-size: 13.5px; color: var(--text-3); margin-top: 14px; }
  .auth-foot a { color: var(--green-700); font-weight: 560; }
`

export default function Register() {
  const [role, setRole] = useState('student')
  const [step, setStep] = useState(1)
  const [form, setForm] = useState({
    full_name: '', email: '', phone: '', password: '',
    // student-only
    birth_year: '', region: '', district: '', school: '',
    // teacher-only
    specialty: '', experience_years: '', education: '', bio: '',
  })
  const [busy, setBusy] = useState(false)
  const [agreed, setAgreed] = useState(false)
  const register = useAuth(s => s.register)
  const user = useAuth(s => s.user)
  const navigate = useNavigate()

  // Allaqachon kirgan bo'lsa — auth sahifasiga kerak emas
  useEffect(() => {
    if (user) navigate('/', { replace: true })
  }, [user]) // eslint-disable-line react-hooks/exhaustive-deps

  const set = (k, v) => setForm({ ...form, [k]: v })

  function step1Valid() {
    return form.full_name.trim().length >= 2
      && /^\S+@\S+\.\S+$/.test(form.email.trim())
      && form.password.length >= 6
  }

  async function submit() {
    if (!agreed) return toast.error("Shartlarga rozi bo'ling")
    setBusy(true)
    try {
      const payload = { ...form, role, email: form.email.trim().toLowerCase() }
      // Phone is optional — only send it when fully typed (+998XXXXXXXXX)
      if (!payload.phone || payload.phone.length < 13) delete payload.phone
      // Strip fields not relevant to the chosen role
      if (role === 'student') {
        delete payload.specialty
        delete payload.experience_years
        delete payload.education
      } else {
        delete payload.birth_year
        delete payload.region
        delete payload.district
        delete payload.school
      }
      if (!payload.birth_year) delete payload.birth_year
      if (!payload.experience_years) delete payload.experience_years
      await register(payload)
      toast.success("Akkaunt yaratildi! Xush kelibsiz.")
      navigate('/', { replace: true })
    } catch (e) {
      const d = e.response?.data
      const msg = typeof d === 'object'
        ? (d?.email?.[0] || d?.phone?.[0] || d?.password?.[0] || d?.full_name?.[0] || Object.values(d).flat()[0])
        : "Xatolik"
      toast.error(String(msg))
    } finally { setBusy(false) }
  }

  function handleNext(e) {
    e?.preventDefault()
    if (step === 1) {
      if (!step1Valid()) return toast.error("Maydonlarni to'liq to'ldiring")
      setStep(2)
    } else {
      submit()
    }
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
            <h1>{step === 1 ? "Akkaunt yaratish" : (role === 'teacher' ? "O'qituvchi ma'lumotlari" : "O'quvchi ma'lumotlari")}</h1>
            <p>{step === 1
              ? 'Avval kim ekanligingizni tanlang'
              : (role === 'teacher'
                ? "Tajribangiz haqida — o'quvchilar sizni tanlashi uchun"
                : "Sizga moslashtirish uchun bir nechta ma'lumot")}
            </p>
          </div>

          <div className="step-bar">
            <div className={`s ${step >= 1 ? 'active' : ''}`}></div>
            <div className={`s ${step >= 2 ? 'active' : ''}`}></div>
          </div>

          {step === 1 && (
            <>
              <div className="role-cards">
                <button type="button" className={`role-card student ${role === 'student' ? 'active' : ''}`} onClick={() => setRole('student')}>
                  <div className="ico"><Icon name="user" size={20} /></div>
                  <div className="nm">O'quvchiman</div>
                  <div className="ds">Kurslarni o'rganaman, sertifikat olaman</div>
                </button>
                <button type="button" className={`role-card teacher ${role === 'teacher' ? 'active' : ''}`} onClick={() => setRole('teacher')}>
                  <div className="ico"><Icon name="users" size={20} /></div>
                  <div className="nm">O'qituvchiman</div>
                  <div className="ds">O'z kursimni yarataman, o'qitaman</div>
                </button>
              </div>

              <GoogleButton text="signup_with" />
              <div className="auth-divider">yoki</div>

              <form onSubmit={handleNext}>
                <div className="grid-2">
                  <div className="field">
                    <label className="label">To'liq ism</label>
                    <input className="input" value={form.full_name} onChange={e => set('full_name', e.target.value)}
                      placeholder="Aziza Tojiyeva" required />
                  </div>
                  <div className="field">
                    <label className="label">Telefon <span style={{ color: 'var(--text-3)', fontWeight: 400 }}>(ixtiyoriy)</span></label>
                    <PhoneInput value={form.phone} onChange={v => set('phone', v)} />
                  </div>
                </div>
                <div className="grid-2">
                  <div className="field">
                    <label className="label">Email</label>
                    <input type="email" className="input" value={form.email} onChange={e => set('email', e.target.value)}
                      placeholder="siz@email.com" required autoComplete="email" />
                  </div>
                  <div className="field">
                    <label className="label">Parol</label>
                    <input type="password" className="input" value={form.password} onChange={e => set('password', e.target.value)}
                      placeholder="Kamida 6 ta belgi" required minLength={6} />
                  </div>
                </div>

                <button type="submit" className="auth-cta" disabled={busy || !step1Valid()}>
                  Keyingi qadam <Icon name="arrowR" size={14} />
                </button>
              </form>
            </>
          )}

          {step === 2 && role === 'student' && (
            <form onSubmit={handleNext}>
              <div className="grid-2">
                <div className="field">
                  <label className="label">Tug'ilgan yil</label>
                  <input className="input" type="number" min={1980} max={new Date().getFullYear()}
                    value={form.birth_year} onChange={e => set('birth_year', e.target.value)} placeholder="2009" />
                </div>
                <div className="field">
                  <label className="label">Viloyat</label>
                  <select className="select" value={form.region} onChange={e => set('region', e.target.value)}>
                    <option value="">— Tanlash —</option>
                    {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
              </div>
              <div className="field">
                <label className="label">Tuman / shahar</label>
                <input className="input" value={form.district} onChange={e => set('district', e.target.value)}
                  placeholder="Masalan, Yunusobod" />
              </div>
              <div className="field">
                <label className="label">Maktab</label>
                <input className="input" value={form.school} onChange={e => set('school', e.target.value)}
                  placeholder="Masalan, 1-IDUM" />
              </div>

              <div className="terms">
                <label className="checkbox" style={{ alignItems: 'start' }}>
                  <input type="checkbox" style={{ marginTop: 3 }} checked={agreed} onChange={e => setAgreed(e.target.checked)} />
                  <span>Men <a href="#">foydalanish shartlari</a> va <a href="#">maxfiylik siyosati</a>ga roziman</span>
                </label>
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button type="button" className="btn-ghost-step" onClick={() => setStep(1)}><Icon name="arrowL" size={14} /></button>
                <button type="submit" className="auth-cta" disabled={busy || !agreed}>
                  {busy ? 'Yaratilmoqda…' : "Akkaunt yaratish"}
                </button>
              </div>
            </form>
          )}

          {step === 2 && role === 'teacher' && (
            <form onSubmit={handleNext}>
              <div className="field">
                <label className="label">Mutaxassisligingiz *</label>
                <input className="input" value={form.specialty} onChange={e => set('specialty', e.target.value)}
                  placeholder="Masalan: Fizik geografiya o'qituvchisi" required />
              </div>
              <div className="grid-2">
                <div className="field">
                  <label className="label">Tajriba (yil)</label>
                  <input className="input" type="number" min={0} max={60}
                    value={form.experience_years} onChange={e => set('experience_years', e.target.value)} placeholder="5" />
                </div>
                <div className="field">
                  <label className="label">Viloyat</label>
                  <select className="select" value={form.region} onChange={e => set('region', e.target.value)}>
                    <option value="">— Tanlash —</option>
                    {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
              </div>
              <div className="field">
                <label className="label">Ta'lim ma'lumoti</label>
                <textarea className="textarea" rows={2} value={form.education} onChange={e => set('education', e.target.value)}
                  placeholder="Masalan, O'zMU geografiya fakulteti bitiruvchisi, doktorant" />
              </div>
              <div className="field">
                <label className="label">O'zingiz haqingizda</label>
                <textarea className="textarea" rows={3} value={form.bio} onChange={e => set('bio', e.target.value)}
                  placeholder="O'quvchilarga sizni tanitadigan qisqacha matn — o'qitish uslubingiz, yutuqlaringiz…" />
              </div>

              <div className="terms">
                <label className="checkbox" style={{ alignItems: 'start' }}>
                  <input type="checkbox" style={{ marginTop: 3 }} checked={agreed} onChange={e => setAgreed(e.target.checked)} />
                  <span>Men <a href="#">foydalanish shartlari</a> va <a href="#">maxfiylik siyosati</a>ga roziman</span>
                </label>
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button type="button" className="btn-ghost-step" onClick={() => setStep(1)}><Icon name="arrowL" size={14} /></button>
                <button type="submit" className="auth-cta" disabled={busy || !agreed}>
                  {busy ? 'Yaratilmoqda…' : "Akkaunt yaratish"}
                </button>
              </div>
            </form>
          )}

          <div className="auth-foot">
            Allaqachon akkaunt bormi? <Link to="/auth/login">Kirish</Link>
          </div>
        </div>
      </div>
    </>
  )
}
