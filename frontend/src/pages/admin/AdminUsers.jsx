import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import api, { absUrl } from '../../api/client'
import { useAuth } from '../../store/auth'
import DashLayout from '../../components/DashLayout'
import Icon from '../../components/Icon'
import Pagination from '../../components/Pagination'
import Confirm from '../../components/Confirm'
import DeleteUserModal from '../../components/DeleteUserModal'
import { PageHead, EmptyState } from '../../components/Dash'

const PAGE_SIZE = 15
const ROLE_LABEL = { student: "O'quvchi", teacher: "O'qituvchi", admin: 'Admin' }
const ROLE_TONE = { student: 'blue', teacher: 'green', admin: 'amber' }

const css = `
  .au-tabs { display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 16px; }
  .au-tab {
    display: flex; align-items: center; gap: 12px; padding: 12px 16px; min-width: 150px; flex: 1;
    background: var(--white); border: 1.5px solid var(--border); border-radius: 18px; text-align: left;
    transition: border-color .14s ease, box-shadow .14s ease, transform .14s ease;
  }
  .au-tab:hover { border-color: var(--line); }
  .au-tab.on { border: 2px solid var(--line); background: var(--sun-soft); box-shadow: var(--hard-sm); }
  .au-tab .n { font-family: var(--font-display); font-size: 26px; font-weight: 800; letter-spacing: -.04em; line-height: 1; }
  .au-tab .l { font-size: 12.5px; font-weight: 650; color: var(--text-3); margin-top: 3px; }
  .au-tab .ic { width: 38px; height: 38px; border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }

  .au-bar { display: flex; gap: 10px; flex-wrap: wrap; align-items: center; margin-bottom: 14px; }
  .au-bar .search-box { flex: 1 1 260px; }
  .au-bar .search-box .input { width: 100%; }
  .au-bar .select { width: auto; flex: 0 1 180px; height: 42px; }

  .au-bulk {
    display: flex; align-items: center; gap: 12px; flex-wrap: wrap; padding: 10px 14px; margin-bottom: 12px;
    background: var(--ink); color: #fff; border-radius: 16px; font-size: 14px; font-weight: 650;
  }
  .au-bulk .sp { flex: 1; }
  .au-bulk button { height: 34px; padding: 0 12px; border-radius: 10px; font-size: 13px; font-weight: 700; display: inline-flex; align-items: center; gap: 6px; background: rgba(255,255,255,.12); color: #fff; }
  .au-bulk button:hover { background: rgba(255,255,255,.22); }
  .au-bulk button.del { background: var(--coral); }

  .au-user { display: flex; align-items: center; gap: 12px; color: var(--text); min-width: 0; }
  .au-user .avatar { width: 40px; height: 40px; border-radius: 13px; font-size: 13px; }
  .au-user .nm { font-weight: 700; display: flex; align-items: center; gap: 6px; }
  .au-check { width: 17px; height: 17px; accent-color: var(--ink); cursor: pointer; }
  .au-rowsel { background: var(--sun-soft) !important; }
  .au-acts { display: inline-flex; gap: 2px; }
  .au-role-select { height: 34px; width: 128px; font-size: 13px; padding-left: 10px; border-radius: 10px; }
  @media (max-width: 760px) { .au-hide-sm { display: none; } }
`

function CreateUserModal({ onClose }) {
  const qc = useQueryClient()
  const [f, setF] = useState({ full_name: '', email: '', password: '', role: 'student' })
  const set = (k, v) => setF(s => ({ ...s, [k]: v }))
  const create = useMutation({
    mutationFn: () => api.post('/admin/users/', { ...f, email: f.email.trim().toLowerCase() }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-users'] })
      qc.invalidateQueries({ queryKey: ['admin-stats'] })
      toast.success('Foydalanuvchi yaratildi')
      onClose()
    },
    onError: (e) => {
      const d = e.response?.data
      toast.error(String(d?.email?.[0] || d?.password?.[0] || d?.detail || 'Yaratib bo\'lmadi'))
    },
  })
  const valid = f.full_name.trim().length >= 2 && /^\S+@\S+\.\S+$/.test(f.email.trim()) && f.password.length >= 6

  return (
    <div className="modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}>
      <form className="modal" onSubmit={e => { e.preventDefault(); if (valid) create.mutate() }}>
        <h3 style={{ fontSize: 22, marginBottom: 4 }}>Yangi foydalanuvchi</h3>
        <p className="text-sm text-muted" style={{ marginBottom: 18 }}>Admin yaratgan akkaunt email tasdiqlashsiz darhol faol bo'ladi.</p>
        <div className="field">
          <label className="label">To'liq ism</label>
          <input className="input" value={f.full_name} onChange={e => set('full_name', e.target.value)} autoFocus required />
        </div>
        <div className="field">
          <label className="label">Email</label>
          <input className="input" type="email" value={f.email} onChange={e => set('email', e.target.value)} required autoComplete="off" />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div className="field">
            <label className="label">Parol</label>
            <input className="input" value={f.password} onChange={e => set('password', e.target.value)} placeholder="Kamida 6 ta belgi" minLength={6} required autoComplete="new-password" />
          </div>
          <div className="field">
            <label className="label">Rol</label>
            <select className="select" value={f.role} onChange={e => set('role', e.target.value)}>
              <option value="student">O'quvchi</option>
              <option value="teacher">O'qituvchi</option>
              <option value="admin">Admin</option>
            </select>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
          <button type="button" className="btn btn-secondary" onClick={onClose}>Bekor qilish</button>
          <button type="submit" className="btn btn-primary" disabled={!valid || create.isPending}>
            {create.isPending ? 'Yaratilmoqda…' : 'Yaratish'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default function AdminUsers() {
  const qc = useQueryClient()
  const me = useAuth(s => s.user)
  const [search, setSearch] = useState('')
  const [debounced, setDebounced] = useState('')
  const [role, setRole] = useState('')
  const [region, setRegion] = useState('')
  const [school, setSchool] = useState('')
  const [isActive, setIsActive] = useState('')
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState(() => new Map()) // id -> user
  const [toDelete, setToDelete] = useState(null)             // array of users
  const [roleChange, setRoleChange] = useState(null)         // { user, role }
  const [blockTarget, setBlockTarget] = useState(null)       // user
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search.trim()), 300)
    return () => clearTimeout(t)
  }, [search])
  useEffect(() => { setPage(1) }, [debounced, role, region, school, isActive])

  const { data: opts = {} } = useQuery({
    queryKey: ['admin-user-filter-options'],
    queryFn: () => api.get('/admin/users-filter-options/').then(r => r.data),
  })
  const { data: stats = {} } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => api.get('/admin/stats/').then(r => r.data),
  })

  const params = new URLSearchParams()
  if (debounced) params.set('search', debounced)
  if (role) params.set('role', role)
  if (region) params.set('region', region)
  if (school) params.set('school', school)
  if (isActive) params.set('is_active', isActive)
  params.set('page', String(page))
  params.set('page_size', String(PAGE_SIZE))

  const { data, isLoading, isError, isFetching } = useQuery({
    queryKey: ['admin-users', params.toString()],
    queryFn: () => api.get(`/admin/users/?${params.toString()}`).then(r => r.data),
    placeholderData: prev => prev,
  })
  const users = data?.results || data || []
  const total = data?.count ?? users.length

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ['admin-users'] })
    qc.invalidateQueries({ queryKey: ['admin-stats'] })
    qc.invalidateQueries({ queryKey: ['admin-user-filter-options'] })
  }

  const setUserRole = useMutation({
    mutationFn: ({ user, role }) => api.put(`/admin/users/${user.id}/role/`, { role }),
    onSuccess: () => { refresh(); toast.success('Rol yangilandi'); setRoleChange(null) },
    onError: () => toast.error("Rolni yangilab bo'lmadi"),
  })
  const setStatus = useMutation({
    mutationFn: ({ user, is_active }) => api.post(`/admin/users/${user.id}/status/`, { is_active }),
    onSuccess: (_, v) => { refresh(); toast.success(v.is_active ? 'Blokdan chiqarildi' : 'Foydalanuvchi bloklandi'); setBlockTarget(null) },
    onError: () => toast.error("Holatni o'zgartirib bo'lmadi"),
  })

  const selectable = users.filter(u => u.id !== me?.id)
  const allChecked = selectable.length > 0 && selectable.every(u => selected.has(u.id))
  function toggle(u) {
    setSelected(prev => {
      const next = new Map(prev)
      if (next.has(u.id)) next.delete(u.id); else next.set(u.id, u)
      return next
    })
  }
  function toggleAll() {
    setSelected(prev => {
      const next = new Map(prev)
      if (allChecked) selectable.forEach(u => next.delete(u.id))
      else selectable.forEach(u => next.set(u.id, u))
      return next
    })
  }

  const filtersOn = [debounced, region, school, isActive].filter(Boolean).length
  function clearAll() { setSearch(''); setRegion(''); setSchool(''); setIsActive('') }

  const TABS = [
    { id: '', label: 'Hammasi', n: stats.users_total, icon: 'users', tone: 'gray' },
    { id: 'student', label: "O'quvchilar", n: stats.users_students, icon: 'grad', tone: 'blue' },
    { id: 'teacher', label: "O'qituvchilar", n: stats.users_teachers, icon: 'book', tone: 'green' },
    { id: 'admin', label: 'Adminlar', n: stats.users_admins, icon: 'shield', tone: 'amber' },
  ]

  return (
    <DashLayout kind="admin">
      <style>{css}</style>
      <PageHead title="Foydalanuvchilar" sub="Akkauntlarni boshqarish: rol, bloklash va butunlay o'chirish">
        <button className="btn btn-primary" onClick={() => setCreating(true)}>
          <Icon name="plus" size={16} /> Yangi foydalanuvchi
        </button>
      </PageHead>

      <div className="au-tabs">
        {TABS.map(t => (
          <button key={t.id} className={`au-tab ${role === t.id ? 'on' : ''}`} onClick={() => setRole(t.id)}>
            <span className={`ic tone-${t.tone}`}><Icon name={t.icon} size={18} /></span>
            <span><span className="n" style={{ display: 'block' }}>{t.n ?? '—'}</span><span className="l" style={{ display: 'block' }}>{t.label}</span></span>
          </button>
        ))}
      </div>

      <div className="au-bar">
        <div className="search-box">
          <Icon name="search" size={16} />
          <input className="input" value={search} onChange={e => setSearch(e.target.value)} placeholder="Ism, email, telefon, maktab…" />
        </div>
        <select className="select" value={region} onChange={e => setRegion(e.target.value)}>
          <option value="">Barcha viloyatlar</option>
          {(opts.regions || []).map(r => <option key={r} value={r}>{r}</option>)}
        </select>
        <select className="select" value={school} onChange={e => setSchool(e.target.value)}>
          <option value="">Barcha maktablar</option>
          {(opts.schools || []).map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select className="select" value={isActive} onChange={e => setIsActive(e.target.value)}>
          <option value="">Barcha holatlar</option>
          <option value="true">Faol</option>
          <option value="false">Bloklangan</option>
        </select>
        {filtersOn > 0 && <button className="btn btn-ghost btn-sm" onClick={clearAll}><Icon name="x" size={13} /> Tozalash</button>}
      </div>

      {selected.size > 0 && (
        <div className="au-bulk">
          <Icon name="checkC" size={17} /> {selected.size} ta tanlandi
          <span className="sp" />
          <button onClick={() => setSelected(new Map())}>Bekor qilish</button>
          <button className="del" onClick={() => setToDelete([...selected.values()])}><Icon name="trash" size={14} /> Tanlanganlarni o'chirish</button>
        </div>
      )}

      <div className="table-wrap" style={{ opacity: isFetching && !isLoading ? 0.7 : 1, transition: 'opacity .15s' }}>
        {isLoading ? (
          <div className="loading-state"><span className="spinner" />Yuklanmoqda…</div>
        ) : isError ? (
          <EmptyState icon="alert" title="Ro'yxatni yuklab bo'lmadi" sub="Server bilan aloqani tekshirib, qayta urinib ko'ring."
            action={<button className="btn btn-secondary btn-sm" onClick={refresh}>Qayta urinish</button>} />
        ) : users.length === 0 ? (
          <EmptyState icon="users" title="Foydalanuvchilar topilmadi" sub="Qidiruv yoki filtrlarni o'zgartirib ko'ring."
            action={filtersOn > 0 && <button className="btn btn-secondary btn-sm" onClick={clearAll}><Icon name="x" size={13} /> Filtrlarni tozalash</button>} />
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th style={{ width: 40 }}><input type="checkbox" className="au-check" checked={allChecked} onChange={toggleAll} aria-label="Hammasini tanlash" /></th>
                <th>Foydalanuvchi</th>
                <th>Rol</th>
                <th className="au-hide-sm">Maktab / hudud</th>
                <th className="au-hide-sm">Qo'shilgan</th>
                <th style={{ textAlign: 'right' }}>Amallar</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => {
                const self = u.id === me?.id
                return (
                  <tr key={u.id} className={selected.has(u.id) ? 'au-rowsel' : ''}>
                    <td>
                      <input type="checkbox" className="au-check" disabled={self} checked={selected.has(u.id)}
                        onChange={() => toggle(u)} aria-label={`${u.display_name}ni tanlash`} />
                    </td>
                    <td>
                      <Link to={`/admin-panel/users/${u.id}`} className="au-user">
                        <span className={`avatar avatar-${ROLE_TONE[u.role] === 'amber' ? 'amber' : ROLE_TONE[u.role] === 'green' ? 'green' : 'blue'}`}>
                          {u.avatar ? <img src={absUrl(u.avatar)} alt="" /> : u.initials}
                        </span>
                        <span style={{ minWidth: 0 }}>
                          <span className="nm">
                            {u.display_name}
                            {self && <span className="badge badge-amber">Siz</span>}
                            {!u.is_active && <span className="badge badge-red">Bloklangan</span>}
                            {!u.is_verified && <span className="badge badge-gray" title="Email tasdiqlanmagan">Tasdiqlanmagan</span>}
                          </span>
                          <span className="text-xs text-muted" style={{ display: 'block' }}>{u.email || u.phone || '—'}</span>
                        </span>
                      </Link>
                    </td>
                    <td>
                      <select value={u.role} disabled={self} className="select au-role-select"
                        onChange={e => setRoleChange({ user: u, role: e.target.value })}>
                        <option value="student">O'quvchi</option>
                        <option value="teacher">O'qituvchi</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td className="text-sm au-hide-sm">
                      {u.school && <div>{u.school}</div>}
                      {u.region && <div className="text-xs text-muted">{u.region}{u.district ? ', ' + u.district : ''}</div>}
                      {!u.school && !u.region && <span className="text-muted">—</span>}
                    </td>
                    <td className="text-sm text-muted au-hide-sm">{new Date(u.date_joined).toLocaleDateString('uz-UZ')}</td>
                    <td style={{ textAlign: 'right' }}>
                      <span className="au-acts">
                        <Link to={`/admin-panel/users/${u.id}`} className="icon-btn" title="Batafsil"><Icon name="eye" size={16} /></Link>
                        {!self && (
                          <>
                            <button className="icon-btn" title={u.is_active ? 'Bloklash' : 'Blokdan chiqarish'} onClick={() => setBlockTarget(u)}>
                              <Icon name={u.is_active ? 'lock' : 'check'} size={16} />
                            </button>
                            <button className="icon-btn danger" title="Butunlay o'chirish" onClick={() => setToDelete([u])}>
                              <Icon name="trash" size={16} />
                            </button>
                          </>
                        )}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      <Pagination page={page} pageSize={PAGE_SIZE} total={total} onChange={setPage} />

      {creating && <CreateUserModal onClose={() => setCreating(false)} />}
      {toDelete && (
        <DeleteUserModal users={toDelete} onClose={() => setToDelete(null)}
          onDeleted={() => { setSelected(new Map()); refresh() }} />
      )}
      {roleChange && (
        <Confirm title="Rolni o'zgartirish" icon="userCog" confirmLabel="O'zgartirish" busy={setUserRole.isPending}
          text={`${roleChange.user.display_name}: ${ROLE_LABEL[roleChange.user.role]} → ${ROLE_LABEL[roleChange.role]}`}
          onConfirm={() => setUserRole.mutate(roleChange)} onClose={() => setRoleChange(null)} />
      )}
      {blockTarget && (
        <Confirm danger={blockTarget.is_active} icon={blockTarget.is_active ? 'lock' : 'check'} busy={setStatus.isPending}
          title={blockTarget.is_active ? 'Foydalanuvchini bloklash' : 'Blokdan chiqarish'}
          text={blockTarget.is_active
            ? `${blockTarget.display_name} tizimga kira olmaydi. Ma'lumotlari saqlanib qoladi.`
            : `${blockTarget.display_name} yana tizimga kira oladi.`}
          confirmLabel={blockTarget.is_active ? 'Bloklash' : 'Blokdan chiqarish'}
          onConfirm={() => setStatus.mutate({ user: blockTarget, is_active: !blockTarget.is_active })}
          onClose={() => setBlockTarget(null)} />
      )}
    </DashLayout>
  )
}
