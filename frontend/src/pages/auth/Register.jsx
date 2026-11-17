import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuth } from '../../store/auth'
import PhoneInput from '../../components/PhoneInput'
import GoogleButton from '../../components/GoogleButton'
import AuthShell, { PasswordInput, VerifyEmailStep } from '../../components/AuthShell'
import Icon from '../../components/Icon'

const REGIONS = [
  'Toshkent', 'Toshkent viloyati', 'Andijon', 'Buxoro', "Farg'ona", 'Jizzax',
  'Namangan', 'Navoiy', 'Qashqadaryo', "Qoraqalpog'iston", 'Samarqand',
  'Sirdaryo', 'Surxondaryo', 'Xorazm',
]

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
  const [pending, setPending] = useState(null) // { email, resend_in, debug_code }
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
      const res = await register(payload)
      if (res.verification_required) {
        setPending(res)
        setStep(3)
        toast.success('Tasdiqlash kodi emailingizga yuborildi')
      } else {
        navigate('/', { replace: true })
      }
    } catch (e) {
      const d = e.response?.data
      const msg = typeof d === 'object'
        ? (d?.email?.[0] || d?.phone?.[0] || d?.password?.[0] || d?.full_name?.[0] || d?.detail || Object.values(d).flat()[0])
        : (e.response ? 'Xatolik yuz berdi' : "Server bilan aloqa yo'q")
      toast.error(String(msg))
      if (d?.email || d?.phone || d?.password || d?.full_name) setStep(1)
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

  const STEPS = ['Akkaunt', "Ma'lumot", 'Tasdiqlash']

  return (
    <AuthShell wide headline={<>Dunyoni <em>kashf etishni</em> boshlang.</>}
      text="Bepul akkaunt oching: video darslar, testlar, o'yinlar va sertifikatlar bir joyda.">
          <div className="au-steps">
            {STEPS.map((label, i) => (
              <span key={label} style={{ display: 'contents' }}>
                {i > 0 && <span className="ln" />}
                <span className={`st ${step === i + 1 ? 'on' : step > i + 1 ? 'done' : ''}`}>
                  <b>{step > i + 1 ? <Icon name="check" size={13} /> : i + 1}</b>{label}
                </span>
              </span>
            ))}
          </div>

          {step === 3 && pending && (
            <VerifyEmailStep email={pending.email} initialWait={pending.resend_in} debugCode={pending.debug_code}
              onVerified={() => navigate('/', { replace: true })}
              onBack={() => { setPending(null); setStep(1) }} />
          )}

          {step < 3 && (
            <>
              <h1 className="au-title">
                {step === 1 ? <>Akkaunt <span className="mark-sun">yaratish</span></>
                  : role === 'teacher' ? "O'qituvchi ma'lumotlari" : "O'zingiz haqingizda"}
              </h1>
              <p className="au-sub">{step === 1
                ? 'Avval kim ekanligingizni tanlang.'
                : (role === 'teacher'
                  ? "Tajribangiz haqida yozing — o'quvchilar sizni shu orqali taniydi."
                  : "Bu ma'lumotlar reyting va sertifikat uchun kerak. Keyin ham o'zgartirish mumkin.")}
              </p>
            </>
          )}

          {step === 1 && (
            <>
              <div className="au-roles">
                <button type="button" className={`au-role ${role === 'student' ? 'on' : ''}`} onClick={() => setRole('student')}>
                  <span className="em">🎒</span>
                  <span><span className="nm" style={{ display: 'block' }}>O'quvchiman</span><span className="ds" style={{ display: 'block' }}>O'rganaman, sertifikat olaman</span></span>
                </button>
                <button type="button" className={`au-role ${role === 'teacher' ? 'on' : ''}`} onClick={() => setRole('teacher')}>
                  <span className="em">🧑‍🏫</span>
                  <span><span className="nm" style={{ display: 'block' }}>O'qituvchiman</span><span className="ds" style={{ display: 'block' }}>Kurs yarataman, o'qitaman</span></span>
                </button>
              </div>

              <GoogleButton text="signup_with" />
              <form onSubmit={handleNext}>
                <div className="au-grid2">
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
                <div className="au-grid2">
                  <div className="field">
                    <label className="label">Email</label>
                    <input type="email" className="input" value={form.email} onChange={e => set('email', e.target.value)}
                      placeholder="siz@email.com" required autoComplete="email" />
                  </div>
                  <div className="field">
                    <label className="label">Parol</label>
                    <PasswordInput value={form.password} onChange={v => set('password', v)} meter
                      placeholder="Kamida 6 ta belgi" required minLength={6} autoComplete="new-password" />
                  </div>
                </div>

                <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={busy || !step1Valid()}>
                  Keyingi qadam <Icon name="arrowR" size={17} />
                </button>
              </form>
            </>
          )}

          {step === 2 && role === 'student' && (
            <form onSubmit={handleNext}>
              <div className="au-grid2">
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

              <div style={{ fontSize: 13, margin: "8px 0 16px" }}>
                <label className="checkbox" style={{ alignItems: 'start' }}>
                  <input type="checkbox" style={{ marginTop: 3 }} checked={agreed} onChange={e => setAgreed(e.target.checked)} />
                  <span>Men foydalanish shartlari va maxfiylik siyosatiga roziman</span>
                </label>
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button type="button" className="btn btn-secondary btn-lg" onClick={() => setStep(1)} aria-label="Orqaga"><Icon name="arrowL" size={17} /></button>
                <button type="submit" className="btn btn-primary btn-lg" style={{ flex: 1 }} disabled={busy || !agreed}>
                  {busy ? 'Yaratilmoqda…' : 'Akkaunt yaratish'}
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
              <div className="au-grid2">
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

              <div style={{ fontSize: 13, margin: "8px 0 16px" }}>
                <label className="checkbox" style={{ alignItems: 'start' }}>
                  <input type="checkbox" style={{ marginTop: 3 }} checked={agreed} onChange={e => setAgreed(e.target.checked)} />
                  <span>Men foydalanish shartlari va maxfiylik siyosatiga roziman</span>
                </label>
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button type="button" className="btn btn-secondary btn-lg" onClick={() => setStep(1)} aria-label="Orqaga"><Icon name="arrowL" size={17} /></button>
                <button type="submit" className="btn btn-primary btn-lg" style={{ flex: 1 }} disabled={busy || !agreed}>
                  {busy ? 'Yaratilmoqda…' : 'Akkaunt yaratish'}
                </button>
              </div>
            </form>
          )}

          {step < 3 && (
            <div className="au-foot">
              Allaqachon akkaunt bormi? <Link to="/auth/login">Kirish</Link>
            </div>
          )}
    </AuthShell>
  )
}
