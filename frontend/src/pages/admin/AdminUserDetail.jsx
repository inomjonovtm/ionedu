import { useState, useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import api, { absUrl } from '../../api/client'
import DashLayout from '../../components/DashLayout'
import Icon from '../../components/Icon'
import CourseCard from '../../components/CourseCard'
import { StatCard } from '../../components/Dash'

const EDIT_FIELDS = ['full_name', 'email', 'phone', 'role', 'is_active', 'is_verified', 'bio', 'city',
  'birth_year', 'region', 'district', 'school', 'specialty', 'experience_years', 'education']

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
      qc.invalidateQueries(['admin-user', String(user.id)])
      qc.invalidateQueries(['admin-users'])
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
    if (!f) return
    setAvatar(f); setAvatarPreview(URL.createObjectURL(f))
  }

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(12,17,14,0.45)', backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        padding: '40px 16px', zIndex: 100, overflowY: 'auto' }}
      onClick={onClose}
    >
      <div
        style={{ width: '100%', maxWidth: 620, background: 'var(--white)', borderRadius: 20,
          boxShadow: 'var(--shadow-pop)', display: 'flex', flexDirection: 'column', maxHeight: 'calc(100vh - 80px)' }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--border-2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <h3 style={{ fontSize: 16, fontWeight: 650, letterSpacing: '-0.02em' }}>Foydalanuvchini tahrirlash</h3>
          <button className="icon-btn" onClick={onClose}><Icon name="x" size={18} /></button>
        </div>

        <div style={{ padding: '18px 22px', overflowY: 'auto', flex: 1 }}>
          {/* Avatar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 18 }}>
            <div className="avatar avatar-blue" style={{ width: 64, height: 64, borderRadius: 999, overflow: 'hidden', fontSize: 22 }}>
              {(avatarPreview || user.avatar)
                ? <img src={avatarPreview || absUrl(user.avatar)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : user.initials}
            </div>
            <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer' }}>
              <Icon name="camera" size={14} /> Avatar almashtirish
              <input type="file" accept="image/*" hidden onChange={pickAvatar} />
            </label>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="field"><label className="label">To'liq ism</label>
              <input className="input" value={form.full_name || ''} onChange={e => set('full_name', e.target.value)} /></div>
            <div className="field"><label className="label">Email</label>
              <input className="input" type="email" value={form.email || ''} onChange={e => set('email', e.target.value)} /></div>
            <div className="field"><label className="label">Telefon</label>
              <input className="input" value={form.phone || ''} onChange={e => set('phone', e.target.value)} placeholder="+998..." /></div>
            <div className="field"><label className="label">Rol</label>
              <select className="select" value={form.role || 'student'} onChange={e => set('role', e.target.value)}>
                <option value="student">O'quvchi</option>
                <option value="teacher">O'qituvchi</option>
                <option value="admin">Admin</option>
              </select></div>
            <div className="field"><label className="label">Shahar</label>
              <input className="input" value={form.city || ''} onChange={e => set('city', e.target.value)} /></div>
            <div className="field"><label className="label">Tug'ilgan yil</label>
              <input className="input" type="number" value={form.birth_year || ''} onChange={e => set('birth_year', e.target.value)} /></div>
            <div className="field"><label className="label">Viloyat</label>
              <input className="input" value={form.region || ''} onChange={e => set('region', e.target.value)} /></div>
            <div className="field"><label className="label">Tuman</label>
              <input className="input" value={form.district || ''} onChange={e => set('district', e.target.value)} /></div>
          </div>

          <div className="field"><label className="label">Maktab</label>
            <input className="input" value={form.school || ''} onChange={e => set('school', e.target.value)} /></div>
          <div className="field"><label className="label">Bio</label>
            <textarea className="textarea" rows={2} value={form.bio || ''} onChange={e => set('bio', e.target.value)} /></div>

          {/* Teacher extras */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="field"><label className="label">Mutaxassislik (o'qituvchi)</label>
              <input className="input" value={form.specialty || ''} onChange={e => set('specialty', e.target.value)} /></div>
            <div className="field"><label className="label">Tajriba (yil)</label>
              <input className="input" type="number" value={form.experience_years || ''} onChange={e => set('experience_years', e.target.value)} /></div>
          </div>
          <div className="field"><label className="label">Ta'lim (diplom, daraja)</label>
            <textarea className="textarea" rows={2} value={form.education || ''} onChange={e => set('education', e.target.value)} /></div>

          {/* Security */}
          <div style={{ borderTop: '1px solid var(--border-2)', paddingTop: 14, marginTop: 4 }}>
            <div className="field"><label className="label">Yangi parol (ixtiyoriy — bo'sh qoldirsangiz o'zgarmaydi)</label>
              <input className="input" type="text" value={password} onChange={e => setPassword(e.target.value)}
                placeholder="Kamida 6 ta belgi" autoComplete="new-password" /></div>
            <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
              <label className="checkbox">
                <input type="checkbox" checked={!!form.is_active} onChange={e => set('is_active', e.target.checked)} />
                Faol (bloklanmagan)
              </label>
              <label className="checkbox">
                <input type="checkbox" checked={!!form.is_verified} onChange={e => set('is_verified', e.target.checked)} />
                Tasdiqlangan
              </label>
            </div>
          </div>
        </div>

        <div style={{ padding: '14px 22px', borderTop: '1px solid var(--border-2)', display: 'flex', gap: 8, justifyContent: 'flex-end', background: 'var(--bg-soft)', borderRadius: '0 0 20px 20px', flexShrink: 0 }}>
          <button className="btn btn-secondary btn-sm" onClick={onClose}>Bekor</button>
          <button className="btn btn-primary btn-sm" onClick={() => save.mutate()} disabled={save.isPending}>
            {save.isPending ? 'Saqlanmoqda…' : 'Saqlash'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function AdminUserDetail() {
  const { id } = useParams()
  const qc = useQueryClient()
  const [editOpen, setEditOpen] = useState(false)

  const { data: u, isLoading } = useQuery({
    queryKey: ['admin-user', id],
    queryFn: () => api.get(`/admin/users/${id}/detail/`).then(r => r.data),
  })

  const setRole = useMutation({
    mutationFn: (role) => api.put(`/admin/users/${id}/role/`, { role }),
    onSuccess: () => { qc.invalidateQueries(['admin-user', id]); toast.success("Rol yangilandi") },
  })
  const setStatus = useMutation({
    mutationFn: (is_active) => api.post(`/admin/users/${id}/status/`, { is_active }),
    onSuccess: () => { qc.invalidateQueries(['admin-user', id]); toast.success("Holat yangilandi") },
  })

  if (isLoading) return <DashLayout kind="admin"><div style={{ padding: 80, textAlign: 'center' }}>Yuklanmoqda…</div></DashLayout>
  if (!u) return <DashLayout kind="admin"><div style={{ padding: 80 }}>Topilmadi</div></DashLayout>

  return (
    <DashLayout kind="admin">
      <div className="breadcrumb">
        <Link to="/admin-panel/users">Foydalanuvchilar</Link>
        <span className="sep">/</span>
        <span>{u.display_name}</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 24, padding: '24px 0 32px', borderBottom: '1px solid var(--border)', marginBottom: 24, flexWrap: 'wrap' }}>
        <div style={{ width: 96, height: 96, borderRadius: 999, overflow: 'hidden' }} className="avatar avatar-blue">
          {u.avatar
            ? <img src={absUrl(u.avatar)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <span style={{ fontSize: 32 }}>{u.initials}</span>}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 style={{ fontSize: 28 }}>{u.display_name}</h1>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 8 }}>
            <span className={`badge badge-${u.role === 'admin' ? 'amber' : u.role === 'teacher' ? 'green' : 'blue'}`}>{u.role}</span>
            <span className={`badge badge-${u.is_active ? 'green' : 'red'}`}>{u.is_active ? 'Faol' : 'Bloklangan'}</span>
            {u.is_verified && <span className="badge badge-green">Tasdiqlangan</span>}
          </div>
          <div className="text-sm text-muted mt-2">
            Qo'shilgan: {new Date(u.date_joined).toLocaleDateString('uz-UZ')}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button className="btn btn-primary" onClick={() => setEditOpen(true)}>
            <Icon name="edit" size={14} /> Tahrirlash
          </button>
          <select value={u.role}
            onChange={e => {
              const role = e.target.value
              if (confirm(`Rolni "${role}" ga o'zgartirishni tasdiqlaysizmi?`)) setRole.mutate(role)
              else e.target.value = u.role
            }}
            className="select" style={{ width: 150 }}>
            <option value="student">O'quvchi</option>
            <option value="teacher">O'qituvchi</option>
            <option value="admin">Admin</option>
          </select>
          {u.is_active
            ? <button className="btn btn-danger" onClick={() => { if (confirm("Bloklash?")) setStatus.mutate(false) }}><Icon name="x" size={14} /> Bloklash</button>
            : <button className="btn btn-primary" onClick={() => setStatus.mutate(true)}><Icon name="check" size={14} /> Faollashtirish</button>
          }
        </div>
      </div>

      {editOpen && <EditUserModal user={u} onClose={() => setEditOpen(false)} />}

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 32, alignItems: 'start' }}>
        <aside>
          <h3 style={{ fontSize: 16, marginBottom: 12 }}>Aloqa</h3>
          <div className="card">
            <InfoRow icon="message" label="Email" value={u.email} />
            {u.phone && <InfoRow icon="phone" label="Telefon" value={u.phone} />}
            {u.bio && <InfoRow icon="user" label="Bio" value={u.bio} />}
            {u.role === 'student' && (
              <>
                {u.birth_year && <InfoRow icon="calendar" label="Tug'ilgan yil" value={u.birth_year} />}
                {(u.region || u.district) && <InfoRow icon="mapPin" label="Manzil" value={[u.region, u.district].filter(Boolean).join(', ')} />}
                {u.school && <InfoRow icon="book" label="Maktab" value={u.school} />}
              </>
            )}
            {u.city && <InfoRow icon="mapPin" label="Shahar" value={u.city} />}
          </div>
        </aside>

        <main>
          {u.role === 'student' && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
                <StatCard icon="book" value={u.enrollments?.length || 0} label="Kurslar" tone="blue" />
                <StatCard icon="award" value={u.certificates?.length || 0} label="Sertifikatlar" tone="green" />
                <StatCard icon="fileText" value={u.attempts_count || 0} label="Test urinishlar" tone="amber" />
              </div>

              <h3 style={{ fontSize: 16, marginBottom: 12 }}>Kurslari ({u.enrollments?.length || 0})</h3>
              {(u.enrollments || []).length === 0 ? (
                <div className="card" style={{ padding: 24, textAlign: 'center', color: 'var(--text-3)' }}>Hozircha kurslar yo'q</div>
              ) : (
                <div className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: 24 }}>
                  <table className="table">
                    <thead><tr><th>Kurs</th><th>Davomiylik</th><th>Holat</th><th>Yozildi</th></tr></thead>
                    <tbody>
                      {u.enrollments.map(e => (
                        <tr key={e.id}>
                          <td><Link to={`/courses/${e.course_slug}`} style={{ color: 'var(--text)', fontWeight: 600 }}>{e.course_title}</Link></td>
                          <td>
                            <div className="progress" style={{ width: 120, height: 6 }}>
                              <div className="progress-fill" style={{ width: `${e.progress_percent}%` }} />
                            </div>
                            <div className="text-xs text-muted mt-1">{Math.round(e.progress_percent)}%</div>
                          </td>
                          <td><span className={`badge badge-${e.completed ? 'green' : 'amber'}`}>{e.completed ? 'Tugatdi' : 'Davom etmoqda'}</span></td>
                          <td className="text-sm text-muted">{new Date(e.enrolled_at).toLocaleDateString('uz-UZ')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {(u.certificates || []).length > 0 && (
                <>
                  <h3 style={{ fontSize: 16, marginBottom: 12 }}>Sertifikatlari</h3>
                  <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                    <table className="table">
                      <thead><tr><th>Kurs</th><th>Ball</th><th>Sana</th><th></th></tr></thead>
                      <tbody>
                        {u.certificates.map(c => (
                          <tr key={c.id}>
                            <td>{c.course_title}</td>
                            <td><strong>{Math.round(c.score_percent)}%</strong></td>
                            <td className="text-sm text-muted">{new Date(c.issued_at).toLocaleDateString('uz-UZ')}</td>
                            <td><Link to={`/certificate/${c.unique_id}`} className="icon-btn"><Icon name="eye" size={14} /></Link></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </>
          )}

          {u.role === 'teacher' && (
            <>
              <h3 style={{ fontSize: 16, marginBottom: 12 }}>O'qituvchining kurslari ({u.courses?.length || 0})</h3>
              {(u.courses || []).length === 0 ? (
                <div className="card" style={{ padding: 24, textAlign: 'center', color: 'var(--text-3)' }}>Kurslar yo'q</div>
              ) : (
                <div className="grid grid-3">
                  {u.courses.map(c => <CourseCard key={c.id} course={c} />)}
                </div>
              )}
            </>
          )}

          {u.role === 'admin' && (
            <div className="card" style={{ padding: 40, textAlign: 'center', color: 'var(--text-3)' }}>
              Administrator. To'liq huquqlarga ega.
            </div>
          )}
        </main>
      </div>
    </DashLayout>
  )
}

function InfoRow({ icon, label, value }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '8px 0', borderBottom: '1px solid var(--border-2)' }}>
      <Icon name={icon} size={16} style={{ color: 'var(--text-3)', marginTop: 2, flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="text-xs text-muted">{label}</div>
        <div className="text-sm" style={{ wordBreak: 'break-word' }}>{value || '—'}</div>
      </div>
    </div>
  )
}
