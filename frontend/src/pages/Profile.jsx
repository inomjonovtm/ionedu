import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import api, { absUrl } from '../api/client'
import Layout from '../components/Layout'
import Icon from '../components/Icon'
import CourseCard from '../components/CourseCard'
import PhoneInput from '../components/PhoneInput'
import Pagination from '../components/Pagination'
import FileInput from '../components/FileInput'
import { useAuth } from '../store/auth'

const styles = `
  .profile-cover {
    height: 190px; position: relative; overflow: hidden;
    background:
      radial-gradient(ellipse 50% 80% at 85% 100%, rgba(14, 131, 69, 0.22), transparent 70%),
      radial-gradient(ellipse 40% 60% at 8% 0%, rgba(135, 207, 166, 0.10), transparent 70%),
      var(--ink);
  }
  .profile-cover::after {
    content: ''; position: absolute; inset: 0;
    background-image:
      linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px);
    background-size: 44px 44px;
  }
  .profile-head { margin-top: -64px; display: flex; align-items: end; gap: 24px; margin-bottom: 28px; position: relative; z-index: 1; flex-wrap: wrap; }
  .profile-avatar-wrap { position: relative; }
  .profile-avatar { width: 124px; height: 124px; border-radius: 999px; background: var(--green-100); color: var(--green-800); display: flex; align-items: center; justify-content: center; font-family: var(--font-display); font-weight: 650; font-size: 44px; border: 5px solid var(--paper); box-shadow: 0 8px 24px -12px rgba(12,17,14,0.3); flex-shrink: 0; overflow: hidden; }
  .profile-avatar img { width: 100%; height: 100%; object-fit: cover; }
  .avatar-upload-btn { position: absolute; bottom: 4px; right: 4px; width: 36px; height: 36px; border-radius: 999px; background: var(--ink); color: white; display: flex; align-items: center; justify-content: center; cursor: pointer; border: 3px solid var(--paper); transition: all .15s; }
  .avatar-upload-btn:hover { background: var(--ink-2); transform: scale(1.05); }
  .profile-info { flex: 1; padding-bottom: 6px; min-width: 0; }
  .profile-info h1 { font-size: 27px; letter-spacing: -0.03em; }
  .profile-title { font-size: 13.5px; color: var(--text-3); margin-top: 5px; }
  .profile-tabs { display: flex; gap: 2px; border-bottom: 1px solid var(--border-2); margin-bottom: 28px; overflow-x: auto; }
  .profile-tab { display: inline-flex; align-items: center; gap: 7px; padding: 11px 16px; font-size: 14px; font-weight: 500; color: var(--text-3); position: relative; white-space: nowrap; cursor: pointer; transition: color .15s; background: none; border: none; }
  .profile-tab svg { color: var(--text-4); transition: color .15s; }
  .profile-tab:hover svg, .profile-tab.active svg { color: var(--green-600); }
  .profile-tab:hover { color: var(--text); }
  .profile-tab.active { color: var(--text); font-weight: 560; }
  .profile-tab.active::after { content: ''; position: absolute; left: 16px; right: 16px; bottom: -1px; height: 2px; border-radius: 2px; background: var(--green-600); }
  .stat-tile { padding: 18px 20px; background: var(--white); border: 1px solid var(--border); border-radius: var(--r-card); }
  .stat-tile .v { font-family: var(--font-mono); font-weight: 560; font-size: 26px; letter-spacing: -0.04em; line-height: 1; color: var(--text); }
  .stat-tile .l { font-size: 12.5px; color: var(--text-3); margin-top: 8px; }
`

export default function Profile() {
  const { user } = useAuth()
  const [tab, setTab] = useState('overview')

  if (!user) {
    return <Layout><div style={{ padding: 80, textAlign: 'center' }}>Yuklanmoqda…</div></Layout>
  }

  const isStudent = user.role === 'student'
  const isTeacher = user.role === 'teacher'
  const isAdmin = user.role === 'admin'

  return (
    <Layout>
      <style>{styles}</style>
      <div className="profile-cover" />
      <div className="container">
        <div className="profile-head">
          <AvatarUpload user={user} />
          <div className="profile-info">
            <h1>{user.display_name}</h1>
            <div className="profile-title">
              {user.role === 'student' ? "O'quvchi" : user.role === 'teacher' ? "O'qituvchi" : 'Administrator'}
              {user.region && ` · ${user.region}${user.district ? ', ' + user.district : ''}`}
              {user.school && ` · ${user.school}`}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, paddingBottom: 6 }}>
            {isTeacher && (
              <Link to="/teacher" className="btn btn-secondary">
                <Icon name="settings" size={14} /> O'qituvchi paneli
              </Link>
            )}
            {isAdmin && (
              <Link to="/admin-panel" className="btn btn-primary">
                <Icon name="shield" size={14} /> Admin panel
              </Link>
            )}
          </div>
        </div>

        <div className="profile-tabs">
          <button className={`profile-tab ${tab === 'overview' ? 'active' : ''}`} onClick={() => setTab('overview')}><Icon name="layout" size={15} /> Umumiy</button>
          {isStudent && <>
            <button className={`profile-tab ${tab === 'courses' ? 'active' : ''}`} onClick={() => setTab('courses')}><Icon name="book" size={15} /> Kurslarim</button>
            <button className={`profile-tab ${tab === 'certs' ? 'active' : ''}`} onClick={() => setTab('certs')}><Icon name="award" size={15} /> Sertifikatlar</button>
            <button className={`profile-tab ${tab === 'tests' ? 'active' : ''}`} onClick={() => setTab('tests')}><Icon name="fileText" size={15} /> Test natijalari</button>
          </>}
          {(isTeacher || isAdmin) && (
            <button className={`profile-tab ${tab === 'credentials' ? 'active' : ''}`} onClick={() => setTab('credentials')}><Icon name="grad" size={15} /> Sertifikatlarim</button>
          )}
          <button className={`profile-tab ${tab === 'edit' ? 'active' : ''}`} onClick={() => setTab('edit')}><Icon name="edit" size={15} /> Tahrirlash</button>
          <button className={`profile-tab ${tab === 'security' ? 'active' : ''}`} onClick={() => setTab('security')}><Icon name="lock" size={15} /> Parol</button>
        </div>

        <div style={{ paddingBottom: 80 }}>
          {tab === 'overview' && <OverviewTab user={user} />}
          {tab === 'courses' && <CoursesTab />}
          {tab === 'certs' && <CertsTab />}
          {tab === 'tests' && <TestsTab />}
          {tab === 'credentials' && <CredentialsTab />}
          {tab === 'edit' && <EditTab user={user} />}
          {tab === 'security' && <PasswordTab />}
        </div>
      </div>
    </Layout>
  )
}

function AvatarUpload({ user }) {
  const { updateMe } = useAuth()
  const [uploading, setUploading] = useState(false)

  async function pick(file) {
    if (!file) return
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('avatar', file)
      await updateMe(fd)
      toast.success('Avatar yangilandi')
    } catch { toast.error('Yuklab bo\'lmadi') }
    finally { setUploading(false) }
  }

  return (
    <div className="profile-avatar-wrap">
      <div className="profile-avatar">
        {user.avatar ? <img src={absUrl(user.avatar)} alt="" /> : user.initials}
      </div>
      <label className="avatar-upload-btn" title="Avatarni o'zgartirish">
        <Icon name={uploading ? 'clock' : 'upload'} size={16} />
        <input type="file" accept="image/*" hidden onChange={e => pick(e.target.files?.[0])} />
      </label>
    </div>
  )
}

function OverviewTab({ user }) {
  const { data: enrollments = [] } = useQuery({
    queryKey: ['enrollments'],
    queryFn: () => api.get('/courses/enrolled/').then(r => r.data),
    enabled: user.role === 'student',
  })
  const { data: certs = [] } = useQuery({
    queryKey: ['my-certs'],
    queryFn: () => api.get('/certificates/mine/').then(r => r.data.results || r.data),
    enabled: user.role === 'student',
  })
  const { data: attempts = [] } = useQuery({
    queryKey: ['my-attempts'],
    queryFn: () => api.get('/attempts/mine/').then(r => r.data),
    enabled: user.role === 'student',
  })
  const { data: teaching = [] } = useQuery({
    queryKey: ['my-teaching'],
    queryFn: () => api.get('/courses/?mine=1').then(r => r.data.results || r.data),
    enabled: user.role === 'teacher' || user.role === 'admin',
  })

  return (
    <>
      {user.role === 'student' && (
        <>
          <div className="grid grid-4" style={{ marginBottom: 32 }}>
            <div className="stat-tile"><div className="v">{enrollments.length}</div><div className="l">Yozilgan kurslar</div></div>
            <div className="stat-tile"><div className="v">{enrollments.filter(e => e.completed).length}</div><div className="l">Tugatilgan</div></div>
            <div className="stat-tile"><div className="v">{certs.length}</div><div className="l">Sertifikatlar</div></div>
            <div className="stat-tile"><div className="v">{attempts.length}</div><div className="l">Test urinishlar</div></div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
            <div>
              <h3 style={{ fontSize: 18, marginBottom: 16 }}>Davom etayotgan kurslar</h3>
              {enrollments.filter(e => !e.completed).slice(0, 3).length === 0 ? (
                <div className="card" style={{ padding: 40, textAlign: 'center', color: 'var(--text-3)' }}>
                  Hozircha kurslar yo'q.<br/>
                  <Link to="/courses" style={{ color: 'var(--green-600)', marginTop: 8, display: 'inline-block' }}>Kurslarni ko'rish →</Link>
                </div>
              ) : (
                <div className="grid grid-2">
                  {enrollments.filter(e => !e.completed).slice(0, 3).map(e => (
                    <CourseCard key={e.id} course={{ ...e.course, is_enrolled: true, progress: e.progress_percent }} showProgress />
                  ))}
                </div>
              )}
            </div>
            <div>
              <h3 style={{ fontSize: 18, marginBottom: 16 }}>Shaxsiy ma'lumot</h3>
              <div className="card">
                <InfoRow icon="message" label="Email" value={user.email} />
                {user.phone && <InfoRow icon="phone" label="Telefon" value={user.phone} />}
                {user.birth_year && <InfoRow icon="calendar" label="Tug'ilgan yil" value={user.birth_year} />}
                {user.region && <InfoRow icon="mapPin" label="Manzil" value={`${user.region}${user.district ? ', ' + user.district : ''}`} />}
                {user.school && <InfoRow icon="book" label="Maktab" value={user.school} />}
              </div>
            </div>
          </div>
        </>
      )}

      {(user.role === 'teacher' || user.role === 'admin') && (
        <>
          <div className="grid grid-4" style={{ marginBottom: 32 }}>
            <div className="stat-tile"><div className="v">{teaching.length}</div><div className="l">Kurslarim</div></div>
            <div className="stat-tile"><div className="v">{teaching.reduce((s, c) => s + (c.students_count || 0), 0)}</div><div className="l">Jami o'quvchilar</div></div>
            <div className="stat-tile"><div className="v">{teaching.filter(c => c.status === 'published').length}</div><div className="l">Nashr etilgan</div></div>
            <div className="stat-tile"><div className="v">{teaching.length ? (teaching.reduce((s, c) => s + (c.rating_avg || 0), 0) / teaching.length).toFixed(1) : '—'}</div><div className="l">O'rtacha reyting</div></div>
          </div>

          <h3 style={{ fontSize: 18, marginBottom: 16 }}>Shaxsiy ma'lumot</h3>
          <div className="card" style={{ maxWidth: 520 }}>
            <InfoRow icon="message" label="Email" value={user.email} />
            {user.phone && <InfoRow icon="phone" label="Telefon" value={user.phone} />}
            {user.bio && <InfoRow icon="user" label="Bio" value={user.bio} />}
            {user.city && <InfoRow icon="mapPin" label="Shahar" value={user.city} />}
          </div>
        </>
      )}
    </>
  )
}

function InfoRow({ icon, label, value }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--border-2)' }}>
      <Icon name={icon} size={16} style={{ color: 'var(--text-3)', marginTop: 2 }} />
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 12, color: 'var(--text-3)' }}>{label}</div>
        <div style={{ fontSize: 14, color: 'var(--text)' }}>{value || '—'}</div>
      </div>
    </div>
  )
}

function CoursesTab() {
  const [page, setPage] = useState(1)
  const PAGE_SIZE = 12
  const { data: enrollments = [] } = useQuery({
    queryKey: ['enrollments'],
    queryFn: () => api.get('/courses/enrolled/').then(r => r.data),
  })
  if (enrollments.length === 0) return (
    <div className="card" style={{ padding: 60, textAlign: 'center', color: 'var(--text-3)' }}>
      Hozircha kurslar yo'q. <Link to="/courses" style={{ color: 'var(--green-600)' }}>Kurslar katalogiga o'tish →</Link>
    </div>
  )
  const pageList = enrollments.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  return (
    <>
      <div className="grid grid-3">
        {pageList.map(e => <CourseCard key={e.id} course={{ ...e.course, is_enrolled: true, progress: e.progress_percent }} showProgress />)}
      </div>
      <Pagination page={page} pageSize={PAGE_SIZE} total={enrollments.length} onChange={setPage} />
    </>
  )
}

function CertsTab() {
  const [page, setPage] = useState(1)
  const PAGE_SIZE = 12
  const { data: certs = [] } = useQuery({
    queryKey: ['my-certs'],
    queryFn: () => api.get('/certificates/mine/').then(r => r.data.results || r.data),
  })
  if (certs.length === 0) return (
    <div className="card" style={{ padding: 60, textAlign: 'center', color: 'var(--text-3)' }}>
      Sertifikatlar yo'q. Kursni 100% tugatib sertifikat oling.
    </div>
  )
  const pageList = certs.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  return (
    <>
    <div className="grid grid-3">
      {pageList.map(c => (
        <div key={c.id} className="card">
          <div style={{ aspectRatio: '1.414/1', background: 'linear-gradient(135deg, var(--green-50), var(--green-100))', borderRadius: 8,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'serif', fontStyle: 'italic',
            color: 'var(--green-700)', fontSize: 22, marginBottom: 14 }}>Sertifikat</div>
          <h4 style={{ fontSize: 15, marginBottom: 4 }}>{c.course_title}</h4>
          <div className="text-sm text-muted mb-3">
            {new Date(c.issued_at).toLocaleDateString('uz-UZ')} · {Math.round(c.score_percent)}%
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Link to={`/certificate/${c.unique_id}`} className="btn btn-secondary btn-sm" style={{ flex: 1 }}>
              <Icon name="eye" size={14} /> Ko'rish
            </Link>
            {c.pdf_file && (
              <a href={absUrl(c.pdf_file)} target="_blank" rel="noreferrer" className="btn btn-primary btn-sm">
                <Icon name="download" size={14} />
              </a>
            )}
          </div>
        </div>
      ))}
    </div>
    <Pagination page={page} pageSize={PAGE_SIZE} total={certs.length} onChange={setPage} />
    </>
  )
}

function TestsTab() {
  const [page, setPage] = useState(1)
  const PAGE_SIZE = 10
  const { data: attempts = [] } = useQuery({
    queryKey: ['my-attempts'],
    queryFn: () => api.get('/attempts/mine/').then(r => r.data),
  })
  if (attempts.length === 0) return (
    <div className="card" style={{ padding: 60, textAlign: 'center', color: 'var(--text-3)' }}>Test natijalari yo'q</div>
  )
  const pageList = attempts.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  return (
    <>
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      <table className="table">
        <thead><tr><th>Test</th><th>Ball</th><th>To'g'ri</th><th>Holat</th><th>Sana</th><th></th></tr></thead>
        <tbody>
          {pageList.map(a => (
            <tr key={a.id}>
              <td><strong>{a.test?.title}</strong></td>
              <td>{Math.round(a.score_percent)}%</td>
              <td className="text-sm">{a.correct_count}/{a.correct_count + a.wrong_count}</td>
              <td><span className={`badge badge-${a.passed ? 'green' : 'red'}`}>{a.passed ? "O'tdi" : "O'tmadi"}</span></td>
              <td className="text-muted text-sm">{new Date(a.started_at).toLocaleString('uz-UZ')}</td>
              <td>
                {a.finished_at && a.test?.id && (
                  <Link to={`/tests/${a.test.id}/result/${a.id}`} className="icon-btn" title="Natijani ko'rish">
                    <Icon name="eye" size={15} />
                  </Link>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    <Pagination page={page} pageSize={PAGE_SIZE} total={attempts.length} onChange={setPage} />
    </>
  )
}

function EditTab({ user }) {
  const { updateMe } = useAuth()
  const [form, setForm] = useState({
    full_name: user.full_name || '',
    email: user.email || '',
    bio: user.bio || '',
    city: user.city || '',
    birth_year: user.birth_year || '',
    region: user.region || '',
    district: user.district || '',
    school: user.school || '',
    phone: user.phone || '',
    specialty: user.specialty || '',
    experience_years: user.experience_years || '',
    education: user.education || '',
  })
  const [busy, setBusy] = useState(false)

  async function submit(e) {
    e.preventDefault()
    setBusy(true)
    try {
      const fd = new FormData()
      Object.entries(form).forEach(([k, v]) => { if (v !== '' && v !== null && v !== undefined) fd.append(k, v) })
      await updateMe(fd)
      toast.success("Saqlandi")
    } catch {
      toast.error("Saqlashda xatolik")
    } finally { setBusy(false) }
  }

  return (
    <form onSubmit={submit} className="card" style={{ maxWidth: 720, padding: 28 }}>
      <h3 style={{ fontSize: 18, marginBottom: 18 }}>Shaxsiy ma'lumot</h3>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div className="field">
          <label className="label">To'liq ism</label>
          <input className="input" value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} />
        </div>
        <div className="field">
          <label className="label">Telefon raqam <span style={{ color: 'var(--text-3)', fontWeight: 400 }}>(ixtiyoriy)</span></label>
          <PhoneInput value={form.phone} onChange={v => setForm({ ...form, phone: v })} />
        </div>
        <div className="field" style={{ gridColumn: '1 / -1' }}>
          <label className="label">Email</label>
          <input className="input" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
        </div>
        <div className="field" style={{ gridColumn: '1 / -1' }}>
          <label className="label">Bio</label>
          <textarea className="textarea" rows={3} value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })} />
        </div>
      </div>

      {user.role === 'student' && (
        <>
          <h3 style={{ fontSize: 18, margin: '24px 0 18px' }}>O'quvchi ma'lumotlari</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div className="field">
              <label className="label">Tug'ilgan yil</label>
              <input className="input" type="number" min={1980} max={new Date().getFullYear()}
                value={form.birth_year} onChange={e => setForm({ ...form, birth_year: e.target.value })} />
            </div>
            <div className="field">
              <label className="label">Viloyat</label>
              <input className="input" value={form.region} onChange={e => setForm({ ...form, region: e.target.value })} />
            </div>
            <div className="field">
              <label className="label">Tuman / shahar</label>
              <input className="input" value={form.district} onChange={e => setForm({ ...form, district: e.target.value })} />
            </div>
            <div className="field">
              <label className="label">Maktab</label>
              <input className="input" value={form.school} onChange={e => setForm({ ...form, school: e.target.value })} />
            </div>
          </div>
        </>
      )}

      {(user.role === 'teacher' || user.role === 'admin') && (
        <>
          <h3 style={{ fontSize: 18, margin: '24px 0 18px' }}>O'qituvchi ma'lumotlari</h3>
          <div className="field">
            <label className="label">Mutaxassisligingiz</label>
            <input className="input" value={form.specialty} onChange={e => setForm({ ...form, specialty: e.target.value })}
              placeholder="Masalan, Fizik geografiya o'qituvchisi" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div className="field">
              <label className="label">Tajriba (yil)</label>
              <input className="input" type="number" min={0} max={60}
                value={form.experience_years} onChange={e => setForm({ ...form, experience_years: e.target.value })} />
            </div>
            <div className="field">
              <label className="label">Shahar</label>
              <input className="input" value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} />
            </div>
          </div>
          <div className="field">
            <label className="label">Ta'lim ma'lumoti</label>
            <textarea className="textarea" rows={2} value={form.education} onChange={e => setForm({ ...form, education: e.target.value })}
              placeholder="Diplom, daraja, oliy ta'lim muassasasi" />
          </div>
        </>
      )}

      <button className="btn btn-primary" disabled={busy} style={{ marginTop: 12 }}>
        {busy ? 'Saqlanmoqda…' : 'Saqlash'}
      </button>
    </form>
  )
}

function PasswordTab() {
  const [oldPwd, setOld] = useState('')
  const [newPwd, setNew] = useState('')
  const [confirmPwd, setConfirm] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e) {
    e.preventDefault()
    if (newPwd !== confirmPwd) return toast.error("Yangi parollar mos kelmadi")
    if (newPwd.length < 6) return toast.error("Parol kamida 6 ta belgi")
    setBusy(true)
    try {
      await api.post('/auth/change-password/', { old_password: oldPwd, new_password: newPwd })
      toast.success("Parol o'zgartirildi")
      setOld(''); setNew(''); setConfirm('')
    } catch (e) {
      toast.error(e.response?.data?.detail || "Xatolik")
    } finally { setBusy(false) }
  }

  return (
    <form onSubmit={submit} className="card" style={{ maxWidth: 520, padding: 28 }}>
      <h3 style={{ fontSize: 18, marginBottom: 18 }}>Parolni o'zgartirish</h3>
      <div className="field">
        <label className="label">Joriy parol</label>
        <input className="input" type="password" value={oldPwd} onChange={e => setOld(e.target.value)} required />
      </div>
      <div className="field">
        <label className="label">Yangi parol</label>
        <input className="input" type="password" value={newPwd} onChange={e => setNew(e.target.value)} required minLength={6} />
      </div>
      <div className="field">
        <label className="label">Yangi parol (qaytadan)</label>
        <input className="input" type="password" value={confirmPwd} onChange={e => setConfirm(e.target.value)} required minLength={6} />
      </div>
      <button className="btn btn-primary" disabled={busy}>{busy ? 'Saqlanmoqda…' : "O'zgartirish"}</button>
    </form>
  )
}


/* ============================================================
   Teacher credentials — upload external diplomas / certificates
   ============================================================ */
function CredentialsTab() {
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ title: '', issuer: '', issued_year: '', note: '', file: null })
  const [busy, setBusy] = useState(false)

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['my-credentials'],
    queryFn: () => api.get('/teacher/credentials/').then(r => r.data),
  })

  const del = useMutation({
    mutationFn: (id) => api.delete(`/teacher/credentials/${id}/`),
    onSuccess: () => { qc.invalidateQueries(['my-credentials']); toast.success("O'chirildi") },
  })

  async function submit(e) {
    e.preventDefault()
    if (!form.title.trim()) return toast.error("Sertifikat nomini kiriting")
    setBusy(true)
    try {
      const fd = new FormData()
      fd.append('title', form.title.trim())
      if (form.issuer) fd.append('issuer', form.issuer)
      if (form.issued_year) fd.append('issued_year', form.issued_year)
      if (form.note) fd.append('note', form.note)
      if (form.file) fd.append('file', form.file)
      await api.post('/teacher/credentials/', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      qc.invalidateQueries(['my-credentials'])
      toast.success("Sertifikat qo'shildi")
      setForm({ title: '', issuer: '', issued_year: '', note: '', file: null })
      setOpen(false)
    } catch (e) {
      const d = e.response?.data
      const msg = typeof d === 'object' && d ? Object.values(d).flat()[0] : "Xatolik"
      toast.error(String(msg))
    } finally { setBusy(false) }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h3 style={{ fontSize: 18, marginBottom: 4 }}>Sertifikatlarim</h3>
          <p className="text-muted text-sm">Boshqa joydan olgan diplomlar, kurs sertifikatlari va malaka guvohnomalarini yuklang — bu o'quvchilarga sizning malakangizni ko'rsatadi.</p>
        </div>
        {!open && (
          <button className="btn btn-primary" onClick={() => setOpen(true)}>
            <Icon name="plus" size={14} /> Sertifikat qo'shish
          </button>
        )}
      </div>

      {open && (
        <form onSubmit={submit} className="card" style={{ padding: 24, marginBottom: 20, background: 'linear-gradient(135deg, var(--green-50), var(--white))', border: '1px solid var(--green-100)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <strong style={{ fontFamily: 'var(--font-display)', fontSize: 16 }}>Yangi sertifikat</strong>
            <button type="button" className="icon-btn" onClick={() => setOpen(false)}><Icon name="x" size={16} /></button>
          </div>
          <div className="field">
            <label className="label">Sertifikat nomi *</label>
            <input className="input" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
              placeholder="Masalan, Geografiya o'qituvchisi malaka sertifikati" required autoFocus />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>
            <div className="field">
              <label className="label">Kim bergan</label>
              <input className="input" value={form.issuer} onChange={e => setForm({ ...form, issuer: e.target.value })}
                placeholder="Masalan, O'zPMI, Coursera, IELTS Centre" />
            </div>
            <div className="field">
              <label className="label">Berilgan yil</label>
              <input className="input" type="number" min={1980} max={new Date().getFullYear()}
                value={form.issued_year} onChange={e => setForm({ ...form, issued_year: e.target.value })} placeholder="2023" />
            </div>
          </div>
          <div className="field">
            <label className="label">Izoh (ixtiyoriy)</label>
            <textarea className="textarea" rows={2} value={form.note} onChange={e => setForm({ ...form, note: e.target.value })}
              placeholder="Qisqacha tavsif" />
          </div>
          <div className="field">
            <label className="label">Sertifikat fayli (PDF, JPG, PNG)</label>
            <FileInput accept=".pdf,image/*" icon="award" hint="PDF, JPG yoki PNG — 10MB gacha"
              onPick={f => setForm({ ...form, file: f })} />
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setOpen(false)}>Bekor</button>
            <button className="btn btn-primary" disabled={busy || !form.title.trim()}>
              {busy ? 'Yuklanmoqda…' : 'Qo\'shish'}
            </button>
          </div>
        </form>
      )}

      {isLoading ? (
        <div className="card" style={{ padding: 40, textAlign: 'center' }}>Yuklanmoqda…</div>
      ) : items.length === 0 ? (
        <div className="card" style={{ padding: 60, textAlign: 'center', color: 'var(--text-3)' }}>
          <Icon name="award" size={36} style={{ color: 'var(--text-4)', marginBottom: 12 }} />
          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4, color: 'var(--text-2)' }}>Hozircha sertifikat yo'q</div>
          <div className="text-sm">Diplom, malaka guvohnomasi yoki boshqa sertifikatlaringizni qo'shing</div>
        </div>
      ) : (
        <div className="grid grid-2">
          {items.map(c => (
            <div key={c.id} className="card" style={{ display: 'flex', gap: 14, padding: 18 }}>
              <div style={{
                width: 56, height: 56, borderRadius: 12,
                background: 'var(--amber-50)', color: 'var(--amber-600)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <Icon name="award" size={26} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{c.title}</div>
                {c.issuer && <div className="text-sm text-muted">{c.issuer}{c.issued_year ? ` · ${c.issued_year}` : ''}</div>}
                {c.note && <div className="text-xs text-muted mt-2" style={{ lineHeight: 1.5 }}>{c.note}</div>}
                <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
                  {c.file && (
                    <a href={absUrl(c.file)} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm">
                      <Icon name="eye" size={13} /> Ko'rish
                    </a>
                  )}
                  <button className="btn btn-danger btn-sm"
                    onClick={() => { if (confirm("Sertifikatni o'chirishni tasdiqlaysizmi?")) del.mutate(c.id) }}>
                    <Icon name="trash" size={13} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
