import { useState, useEffect } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import api, { absUrl } from '../../api/client'
import DashLayout from '../../components/DashLayout'
import Icon from '../../components/Icon'
import CourseCard from '../../components/CourseCard'
import Confirm from '../../components/Confirm'
import DeleteUserModal from '../../components/DeleteUserModal'
import { useAuth } from '../../store/auth'
import { StatCard, Panel, EmptyState } from '../../components/Dash'

const EDIT_FIELDS = ['full_name', 'email', 'phone', 'role', 'is_active', 'is_verified', 'bio', 'city',
  'birth_year', 'region', 'district', 'school', 'specialty', 'experience_years', 'education']

const EDIT_ROLES = [['student', "O'quvchi"], ['teacher', "O'qituvchi"], ['admin', 'Administrator']]
const EDIT_AVATAR_TONE = { student: 'blue', teacher: 'green', admin: 'amber' }

const editCss = `
  .eum { max-width: 680px; padding: 0; overflow: hidden; display: flex; flex-direction: column; }
  .eum-head { display: flex; align-items: flex-start; gap: 14px; padding: 22px 24px 18px; border-bottom: 1.5px dashed var(--border); flex-shrink: 0; }
  .eum-tile {
    width: 46px; height: 46px; flex-shrink: 0; border-radius: 14px; background: var(--sun); color: #14213D;
    border: 2px solid var(--line); display: flex; align-items: center; justify-content: center; transform: rotate(-4deg);
  }
  .eum-head-txt { min-width: 0; flex: 1; }
  .eum-head h3 { font-size: 20px; letter-spacing: -0.03em; line-height: 1.2; }
  .eum-head p { font-size: 13px; color: var(--text-3); margin-top: 4px; overflow-wrap: anywhere; }
  .eum-x { flex-shrink: 0; margin: -4px -6px 0 0; }

  .eum-body { padding: 4px 24px 8px; overflow-y: auto; min-height: 0; flex: 1; }
  .eum-sec { padding: 18px 0 4px; border-bottom: 1.5px dashed var(--border); }
  .eum-sec:last-child { border-bottom: none; }
  .eum-sec-h { display: flex; align-items: center; gap: 9px; margin-bottom: 14px; }
  .eum-sec-h .n {
    font-family: var(--font-mono); font-size: 10.5px; font-weight: 600; color: #14213D; background: var(--sun);
    border: 1.5px solid var(--line); border-radius: 8px; padding: 1px 7px;
  }
  .eum-sec-h b { font-family: var(--font-mono); font-size: 11px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: var(--text-2); }
  .eum-sec-h span { font-size: 12px; color: var(--text-4); margin-left: auto; text-align: right; }
  .eum-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0 14px; }
  .eum-grid .full { grid-column: 1 / -1; }

  .eum-avatar { display: flex; align-items: center; gap: 18px; padding-bottom: 14px; }
  .eum-avatar .avatar { width: 76px; height: 76px; border-radius: 22px; border: 2px solid var(--line); font-size: 25px; transform: rotate(-4deg); }
  .eum-avatar .avatar.picked { box-shadow: var(--hard-sm); }
  .eum-avatar .avatar img { width: 100%; height: 100%; object-fit: cover; }
  .eum-avatar-side { min-width: 0; }
  .eum-avatar-btns { display: flex; gap: 8px; flex-wrap: wrap; }
  .eum-avatar-btns label { cursor: pointer; }
  .eum-avatar-note { font-size: 12px; color: var(--text-3); margin-top: 8px; overflow-wrap: anywhere; }

  .eum-toggles { display: flex; flex-direction: column; margin-bottom: 14px; border: 1.5px solid var(--border); border-radius: 16px; overflow: hidden; }
  .eum-toggle { display: flex; align-items: center; gap: 14px; padding: 13px 15px; cursor: pointer; border-bottom: 1.5px dashed var(--border); transition: background .13s ease; }
  .eum-toggle:last-child { border-bottom: none; }
  .eum-toggle:hover { background: var(--paper); }
  .eum-toggle .tx { flex: 1; min-width: 0; }
  .eum-toggle .tx b { display: block; font-size: 14px; font-weight: 700; color: var(--text); }
  .eum-toggle .tx small { display: block; font-size: 12px; color: var(--text-3); margin-top: 2px; line-height: 1.45; }

  .eum-foot { display: flex; justify-content: flex-end; gap: 10px; padding: 16px 24px 20px; border-top: 1.5px dashed var(--border); flex-shrink: 0; }
  @media (max-width: 600px) {
    .eum-head { padding: 18px 18px 14px; }
    .eum-body { padding: 2px 18px 6px; }
    .eum-grid { grid-template-columns: 1fr; }
    .eum-sec-h span { display: none; }
    .eum-avatar { align-items: flex-start; }
    .eum-foot { padding: 14px 18px 18px; flex-direction: column-reverse; }
    .eum-foot .btn { width: 100%; }
  }
`

function EditUserModal({ user, onClose }) {
  const qc = useQueryClient()
  const [form, setForm] = useState({})
  const [password, setPassword] = useState('')
  const [avatar, setAvatar] = useState(null)
  const [avatarPreview, setAvatarPreview] = useState('')

  useEffect(() => {
    const init = {}
    EDIT_FIELDS.forEach(k => { init[k] = user[k] ?? '' })
    setForm(init)
  }, [user])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const save = useMutation({
    mutationFn: () => {
      const fd = new FormData()
      EDIT_FIELDS.forEach(k => {
        let v = form[k]
        if (k === 'is_active' || k === 'is_verified') v = v ? 'true' : 'false'
        fd.append(k, v ?? '')
      })
      if (password.trim()) fd.append('password', password.trim())
      if (avatar) fd.append('avatar', avatar)
      return api.patch(`/admin/users/${user.id}/`, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-user', String(user.id)] })
      qc.invalidateQueries({ queryKey: ['admin-users'] })
      toast.success('Saqlandi')
      onClose()
    },
    onError: (e) => {
      const d = e.response?.data
      const msg = typeof d === 'object' && d ? (Object.values(d).flat()[0] || JSON.stringify(d)) : (d || 'Xatolik')
      toast.error(String(msg).slice(0, 200))
    },
  })

  function pickAvatar(e) {
    const f = e.target.files?.[0]
    e.target.value = ''
    if (!f) return
    if (avatarPreview) URL.revokeObjectURL(avatarPreview)
    setAvatar(f); setAvatarPreview(URL.createObjectURL(f))
  }
  function clearAvatar() {
    if (avatarPreview) URL.revokeObjectURL(avatarPreview)
    setAvatar(null); setAvatarPreview('')
  }

  const busy = save.isPending
  useEffect(() => {
    const h = (e) => { if (e.key === 'Escape' && !busy) onClose() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [busy, onClose])

  const role = form.role || 'student'
  const photo = avatarPreview || (user.avatar ? absUrl(user.avatar) : '')

  return (
    <div className="modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget && !busy) onClose() }}>
      <style>{editCss}</style>
      <form className="modal eum" role="dialog" aria-modal="true" aria-label="Foydalanuvchini tahrirlash"
        onSubmit={e => { e.preventDefault(); if (!busy) save.mutate() }}>
        <div className="eum-head">
          <span className="eum-tile"><Icon name="userCog" size={20} /></span>
          <div className="eum-head-txt">
            <h3>Foydalanuvchini tahrirlash</h3>
            <p>{user.display_name || user.full_name || user.email}{user.email && user.display_name ? ` · ${user.email}` : ''}</p>
          </div>
          <button type="button" className="icon-btn eum-x" onClick={onClose} disabled={busy} aria-label="Yopish">
            <Icon name="x" size={18} />
          </button>
        </div>

        <div className="eum-body">
          <section className="eum-sec">
            <div className="eum-sec-h"><span className="n">01</span><b>Profil rasmi</b></div>
            <div className="eum-avatar">
              <span className={`avatar avatar-${EDIT_AVATAR_TONE[role] || 'blue'} ${avatar ? 'picked' : ''}`}>
                {photo ? <img src={photo} alt="" /> : user.initials}
              </span>
              <div className="eum-avatar-side">
                <div className="eum-avatar-btns">
                  <label className="btn btn-secondary btn-sm">
                    <Icon name="image" size={14} /> {photo ? 'Rasmni almashtirish' : 'Rasm tanlash'}
                    <input type="file" accept="image/*" hidden onChange={pickAvatar} />
                  </label>
                  {avatar && (
                    <button type="button" className="btn btn-ghost btn-sm" onClick={clearAvatar}>
                      <Icon name="rotate" size={13} /> Bekor qilish
                    </button>
                  )}
                </div>
                <div className="eum-avatar-note">
                  {avatar ? `Tanlandi: ${avatar.name} — saqlangach yangilanadi` : 'JPG yoki PNG, kvadrat rasm tavsiya etiladi.'}
                </div>
              </div>
            </div>
          </section>

          <section className="eum-sec">
            <div className="eum-sec-h"><span className="n">02</span><b>Asosiy ma'lumotlar</b></div>
            <div className="eum-grid">
              <div className="field"><label className="label">To'liq ism</label>
                <input className="input" value={form.full_name || ''} onChange={e => set('full_name', e.target.value)} /></div>
              <div className="field"><label className="label">Rol</label>
                <select className="select" value={role} onChange={e => set('role', e.target.value)}>
                  {EDIT_ROLES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select></div>
              <div className="field"><label className="label">Email</label>
                <input className="input" type="email" value={form.email || ''} onChange={e => set('email', e.target.value)} /></div>
              <div className="field"><label className="label">Telefon</label>
                <input className="input" value={form.phone || ''} onChange={e => set('phone', e.target.value)} placeholder="+998..." /></div>
              <div className="field full"><label className="label">Bio</label>
                <textarea className="textarea" rows={2} value={form.bio || ''} onChange={e => set('bio', e.target.value)} /></div>
            </div>
          </section>

          <section className="eum-sec">
            <div className="eum-sec-h"><span className="n">03</span><b>Hudud va maktab</b></div>
            <div className="eum-grid">
              <div className="field"><label className="label">Viloyat</label>
                <input className="input" value={form.region || ''} onChange={e => set('region', e.target.value)} /></div>
              <div className="field"><label className="label">Tuman</label>
                <input className="input" value={form.district || ''} onChange={e => set('district', e.target.value)} /></div>
              <div className="field"><label className="label">Shahar</label>
                <input className="input" value={form.city || ''} onChange={e => set('city', e.target.value)} /></div>
              <div className="field"><label className="label">Tug'ilgan yil</label>
                <input className="input" type="number" value={form.birth_year || ''} onChange={e => set('birth_year', e.target.value)} /></div>
              <div className="field full"><label className="label">Maktab</label>
                <input className="input" value={form.school || ''} onChange={e => set('school', e.target.value)} /></div>
            </div>
          </section>

          <section className="eum-sec">
            <div className="eum-sec-h"><span className="n">04</span><b>O'qituvchi ma'lumotlari</b>
              {role !== 'teacher' && <span>Faqat o'qituvchi profilida ko'rinadi</span>}</div>
            <div className="eum-grid">
              <div className="field"><label className="label">Mutaxassislik</label>
                <input className="input" value={form.specialty || ''} onChange={e => set('specialty', e.target.value)} /></div>
              <div className="field"><label className="label">Tajriba (yil)</label>
                <input className="input" type="number" value={form.experience_years || ''} onChange={e => set('experience_years', e.target.value)} /></div>
              <div className="field full"><label className="label">Ta'lim (diplom, daraja)</label>
                <textarea className="textarea" rows={2} value={form.education || ''} onChange={e => set('education', e.target.value)} /></div>
            </div>
          </section>

          <section className="eum-sec">
            <div className="eum-sec-h"><span className="n">05</span><b>Kirish va holat</b></div>
            <div className="eum-toggles">
              <label className="eum-toggle">
                <span className="tx">
                  <b>Faol akkaunt</b>
                  <small>O'chirilsa, foydalanuvchi bloklanadi va tizimga kira olmaydi.</small>
                </span>
                <span className="switch">
                  <input type="checkbox" checked={!!form.is_active} onChange={e => set('is_active', e.target.checked)} />
                  <span />
                </span>
              </label>
              <label className="eum-toggle">
                <span className="tx">
                  <b>Tasdiqlangan</b>
                  <small>Email manzili tasdiqlangan deb belgilanadi.</small>
                </span>
                <span className="switch">
                  <input type="checkbox" checked={!!form.is_verified} onChange={e => set('is_verified', e.target.checked)} />
                  <span />
                </span>
              </label>
            </div>
            <div className="field"><label className="label">Yangi parol</label>
              <input className="input" type="text" value={password} onChange={e => setPassword(e.target.value)}
                placeholder="Kamida 6 ta belgi" autoComplete="new-password" />
              <div className="field-hint">Ixtiyoriy — bo'sh qoldirsangiz, parol o'zgarmaydi.</div></div>
          </section>
        </div>

        <div className="eum-foot">
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={busy}>Bekor qilish</button>
          <button type="submit" className="btn btn-primary" disabled={busy}>
            <Icon name="check" size={16} /> {busy ? 'Saqlanmoqda…' : 'Saqlash'}
          </button>
        </div>
      </form>
    </div>
  )
}

const ROLE_LABEL = { student: "O'quvchi", teacher: "O'qituvchi", admin: 'Administrator' }

const css = `
  .ud-hero {
    display: grid; grid-template-columns: auto 1fr auto; gap: 22px; align-items: center;
    background: var(--white); border: 2px solid var(--line); border-radius: 26px; box-shadow: var(--hard);
    padding: 22px 24px; margin-bottom: 22px; position: relative; overflow: hidden;
  }
  .ud-hero::after { content: ''; position: absolute; inset: 0; background-image: var(--topo); background-size: 520px 360px; pointer-events: none; }
  .ud-hero > * { position: relative; z-index: 1; }
  .ud-av { width: 96px; height: 96px; border-radius: 26px; border: 2px solid var(--line); font-size: 32px; transform: rotate(-4deg); }
  .ud-hero h1 { font-size: 32px; }
  .ud-tags { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 10px; }
  .ud-meta { font-family: var(--font-mono); font-size: 11.5px; color: var(--text-3); margin-top: 10px; letter-spacing: .03em; }
  .ud-acts { display: flex; gap: 8px; flex-wrap: wrap; justify-content: flex-end; max-width: 340px; }
  .ud-grid { display: grid; grid-template-columns: 320px minmax(0, 1fr); gap: 22px; align-items: start; }
  .ud-h { font-size: 17px; margin: 0 0 12px; }
  .ud-info { padding: 6px 18px; }
  .ud-row { display: flex; align-items: flex-start; gap: 12px; padding: 12px 0; border-bottom: 1.5px dashed var(--border-2); }
  .ud-row:last-child { border-bottom: none; }
  .ud-row .ic { width: 32px; height: 32px; border-radius: 10px; background: var(--bg-soft); color: var(--text-3); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .ud-danger { margin-top: 18px; border: 1.5px dashed var(--red-600); border-radius: 20px; padding: 16px 18px; background: var(--red-50); }
  .ud-danger h4 { font-size: 15px; color: var(--red-600); margin-bottom: 4px; }
  .ud-kpis { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; margin-bottom: 22px; }
  @media (max-width: 1100px) { .ud-grid { grid-template-columns: 1fr; } .ud-hero { grid-template-columns: auto 1fr; } .ud-acts { grid-column: 1 / -1; justify-content: flex-start; max-width: none; } }
  @media (max-width: 560px) { .ud-hero { grid-template-columns: 1fr; } .ud-kpis { grid-template-columns: 1fr; } }
`

export default function AdminUserDetail() {
  const { id } = useParams()
  const qc = useQueryClient()
  const navigate = useNavigate()
  const me = useAuth(s => s.user)
  const [editOpen, setEditOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [pendingRole, setPendingRole] = useState(null)
  const [blocking, setBlocking] = useState(false)

  const { data: u, isLoading, isError } = useQuery({
    queryKey: ['admin-user', id],
    queryFn: () => api.get(`/admin/users/${id}/detail/`).then(r => r.data),
    retry: false,
  })

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ['admin-user', id] })
    qc.invalidateQueries({ queryKey: ['admin-users'] })
    qc.invalidateQueries({ queryKey: ['admin-stats'] })
  }
  const setRole = useMutation({
    mutationFn: (role) => api.put(`/admin/users/${id}/role/`, { role }),
    onSuccess: () => { refresh(); toast.success('Rol yangilandi'); setPendingRole(null) },
    onError: () => toast.error("Rolni yangilab bo'lmadi"),
  })
  const setStatus = useMutation({
    mutationFn: (is_active) => api.post(`/admin/users/${id}/status/`, { is_active }),
    onSuccess: (_, active) => { refresh(); toast.success(active ? 'Blokdan chiqarildi' : 'Foydalanuvchi bloklandi'); setBlocking(false) },
    onError: () => toast.error("Holatni o'zgartirib bo'lmadi"),
  })

  if (isLoading) return <DashLayout kind="admin"><div className="loading-state"><span className="spinner" />Yuklanmoqda…</div></DashLayout>
  if (isError || !u) {
    return (
      <DashLayout kind="admin">
        <EmptyState icon="user" title="Foydalanuvchi topilmadi" sub="U o'chirilgan bo'lishi mumkin."
          action={<Link to="/admin-panel/users" className="btn btn-secondary btn-sm"><Icon name="arrowL" size={13} /> Ro'yxatga qaytish</Link>} />
      </DashLayout>
    )
  }

  const self = me?.id === u.id
  const tone = u.role === 'admin' ? 'amber' : u.role === 'teacher' ? 'green' : 'blue'

  return (
    <DashLayout kind="admin">
      <style>{css}</style>
      <div className="breadcrumb">
        <Link to="/admin-panel/users">Foydalanuvchilar</Link>
        <span className="sep">/</span>
        <span>{u.display_name}</span>
      </div>

      <div className="ud-hero">
        <div className={`avatar avatar-${tone} ud-av`}>
          {u.avatar ? <img src={absUrl(u.avatar)} alt="" /> : u.initials}
        </div>
        <div style={{ minWidth: 0 }}>
          <h1>{u.display_name}</h1>
          <div className="ud-tags">
            <span className={`badge badge-${tone}`}>{ROLE_LABEL[u.role]}</span>
            <span className={`badge badge-${u.is_active ? 'green' : 'red'}`}>{u.is_active ? 'Faol' : 'Bloklangan'}</span>
            <span className={`badge badge-${u.is_verified ? 'green' : 'gray'}`}>{u.is_verified ? 'Email tasdiqlangan' : 'Email tasdiqlanmagan'}</span>
            {!u.has_password && <span className="badge badge-blue">Google orqali</span>}
            {self && <span className="badge badge-amber">Bu siz</span>}
          </div>
          <div className="ud-meta">
            ID {u.id} · QO'SHILGAN {new Date(u.date_joined).toLocaleDateString('uz-UZ')}
            {u.last_login && <> · OXIRGI KIRISH {new Date(u.last_login).toLocaleString('uz-UZ', { dateStyle: 'short', timeStyle: 'short' })}</>}
          </div>
        </div>
        <div className="ud-acts">
          <button className="btn btn-primary" onClick={() => setEditOpen(true)}><Icon name="edit" size={15} /> Tahrirlash</button>
          {!self && (
            <>
              <select value={u.role} onChange={e => setPendingRole(e.target.value)} className="select" style={{ width: 150, height: 44 }}>
                <option value="student">O'quvchi</option>
                <option value="teacher">O'qituvchi</option>
                <option value="admin">Admin</option>
              </select>
              <button className="btn btn-secondary" onClick={() => setBlocking(true)}>
                <Icon name={u.is_active ? 'lock' : 'check'} size={15} /> {u.is_active ? 'Bloklash' : 'Blokdan chiqarish'}
              </button>
            </>
          )}
        </div>
      </div>

      <div className="ud-grid">
        <aside>
          <h3 className="ud-h">Ma'lumotlar</h3>
          <div className="card ud-info">
            <InfoRow icon="mail" label="Email" value={u.email} />
            {u.phone && <InfoRow icon="phone" label="Telefon" value={u.phone} />}
            {u.birth_year && <InfoRow icon="calendar" label="Tug'ilgan yil" value={u.birth_year} />}
            {(u.region || u.district) && <InfoRow icon="mapPin" label="Hudud" value={[u.region, u.district].filter(Boolean).join(', ')} />}
            {u.school && <InfoRow icon="book" label="Maktab" value={u.school} />}
            {u.city && <InfoRow icon="mapPin" label="Shahar" value={u.city} />}
            {u.specialty && <InfoRow icon="grad" label="Mutaxassislik" value={u.specialty} />}
            {u.experience_years != null && <InfoRow icon="clock" label="Tajriba" value={`${u.experience_years} yil`} />}
            {u.education && <InfoRow icon="award" label="Ta'lim" value={u.education} />}
            {u.bio && <InfoRow icon="user" label="Bio" value={u.bio} />}
          </div>

          {!self && (
            <div className="ud-danger">
              <h4>Xavfli hudud</h4>
              <p className="text-sm" style={{ color: 'var(--text-2)', lineHeight: 1.55, marginBottom: 12 }}>
                Akkaunt va unga tegishli barcha ma'lumotlar (kurslar, natijalar, sertifikatlar, fayllar) butunlay o'chiriladi.
              </p>
              <button className="btn btn-danger btn-sm" onClick={() => setDeleting(true)}>
                <Icon name="trash" size={14} /> Butunlay o'chirish
              </button>
            </div>
          )}
        </aside>

        <main style={{ minWidth: 0 }}>
          {u.role === 'student' && (
            <>
              <div className="ud-kpis">
                <StatCard icon="book" value={u.enrollments?.length || 0} label="Kurslar" tone="blue" />
                <StatCard icon="award" value={u.certificates?.length || 0} label="Sertifikatlar" tone="green" />
                <StatCard icon="fileText" value={u.attempts_count || 0} label="Test urinishlari" tone="amber" />
              </div>

              <Panel title="Kurslari" count={u.enrollments?.length || 0} style={{ marginBottom: 20 }}>
                {(u.enrollments || []).length === 0 ? (
                  <EmptyState small icon="book" title="Hozircha kurslar yo'q" />
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table className="table">
                      <thead><tr><th>Kurs</th><th>Progress</th><th>Holat</th><th>Yozilgan</th></tr></thead>
                      <tbody>
                        {u.enrollments.map(e => (
                          <tr key={e.id}>
                            <td><Link to={`/courses/${e.course_slug}`} style={{ color: 'var(--text)', fontWeight: 700 }}>{e.course_title}</Link></td>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <div className="progress" style={{ width: 110 }}><div className="progress-fill" style={{ width: `${e.progress_percent}%` }} /></div>
                                <span className="text-xs font-mono">{Math.round(e.progress_percent)}%</span>
                              </div>
                            </td>
                            <td><span className={`badge badge-${e.completed ? 'green' : 'amber'}`}>{e.completed ? 'Tugatgan' : 'Davom etmoqda'}</span></td>
                            <td className="text-sm text-muted">{new Date(e.enrolled_at).toLocaleDateString('uz-UZ')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Panel>

              {(u.certificates || []).length > 0 && (
                <Panel title="Sertifikatlari" count={u.certificates.length}>
                  <div style={{ overflowX: 'auto' }}>
                    <table className="table">
                      <thead><tr><th>Kurs</th><th>Ball</th><th>Sana</th><th></th></tr></thead>
                      <tbody>
                        {u.certificates.map(c => (
                          <tr key={c.id}>
                            <td style={{ fontWeight: 600, color: 'var(--text)' }}>{c.course_title}</td>
                            <td><strong>{Math.round(c.score_percent)}%</strong></td>
                            <td className="text-sm text-muted">{new Date(c.issued_at).toLocaleDateString('uz-UZ')}</td>
                            <td><Link to={`/certificate/${c.unique_id}`} className="icon-btn" title="Ko'rish"><Icon name="eye" size={15} /></Link></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Panel>
              )}
            </>
          )}

          {u.role === 'teacher' && (
            <>
              <h3 className="ud-h">O'qituvchining kurslari ({u.courses?.length || 0})</h3>
              {(u.courses || []).length === 0 ? (
                <div className="card"><EmptyState small icon="book" title="Kurslar yo'q" sub="Bu o'qituvchi hali kurs yaratmagan." /></div>
              ) : (
                <div className="grid grid-2">
                  {u.courses.map(c => <CourseCard key={c.id} course={c} />)}
                </div>
              )}
            </>
          )}

          {u.role === 'admin' && (
            <div className="card"><EmptyState icon="shield" title="Administrator" sub="Platformani boshqarish uchun to'liq huquqlarga ega." /></div>
          )}
        </main>
      </div>

      {editOpen && <EditUserModal user={u} onClose={() => setEditOpen(false)} />}
      {deleting && (
        <DeleteUserModal users={[u]} onClose={() => setDeleting(false)}
          onDeleted={(res) => { refresh(); if (res.deleted.length) navigate('/admin-panel/users', { replace: true }) }} />
      )}
      {pendingRole && (
        <Confirm title="Rolni o'zgartirish" icon="userCog" confirmLabel="O'zgartirish" busy={setRole.isPending}
          text={`${u.display_name}: ${ROLE_LABEL[u.role]} → ${ROLE_LABEL[pendingRole]}`}
          onConfirm={() => setRole.mutate(pendingRole)} onClose={() => setPendingRole(null)} />
      )}
      {blocking && (
        <Confirm danger={u.is_active} icon={u.is_active ? 'lock' : 'check'} busy={setStatus.isPending}
          title={u.is_active ? 'Foydalanuvchini bloklash' : 'Blokdan chiqarish'}
          text={u.is_active ? "U tizimga kira olmaydi. Ma'lumotlari saqlanib qoladi." : 'U yana tizimga kira oladi.'}
          confirmLabel={u.is_active ? 'Bloklash' : 'Blokdan chiqarish'}
          onConfirm={() => setStatus.mutate(!u.is_active)} onClose={() => setBlocking(false)} />
      )}
    </DashLayout>
  )
}

function InfoRow({ icon, label, value }) {
  return (
    <div className="ud-row">
      <span className="ic"><Icon name={icon} size={15} /></span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="text-xs text-muted">{label}</div>
        <div className="text-sm" style={{ wordBreak: 'break-word', fontWeight: 600, color: 'var(--text)' }}>{value || '—'}</div>
      </div>
    </div>
  )
}
