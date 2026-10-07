import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import api, { absUrl } from '../../api/client'
import DashLayout from '../../components/DashLayout'
import Icon from '../../components/Icon'
import Pagination from '../../components/Pagination'
import FilterBar from '../../components/FilterBar'
import { PageHead, Panel, EmptyState } from '../../components/Dash'

const PAGE_SIZE = 12

export default function AdminUsers() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [role, setRole] = useState('')
  const [region, setRegion] = useState('')
  const [school, setSchool] = useState('')
  const [birthYear, setBirthYear] = useState('')
  const [isActive, setIsActive] = useState('')
  const [page, setPage] = useState(1)

  // Reset page when filters change
  useEffect(() => { setPage(1) }, [search, role, region, school, birthYear, isActive])

  const { data: opts = {} } = useQuery({
    queryKey: ['admin-user-filter-options'],
    queryFn: () => api.get('/admin/users-filter-options/').then(r => r.data),
  })

  const params = new URLSearchParams()
  if (search) params.set('search', search)
  if (role) params.set('role', role)
  if (region) params.set('region', region)
  if (school) params.set('school', school)
  if (birthYear) params.set('birth_year', birthYear)
  if (isActive) params.set('is_active', isActive)
  params.set('page', String(page))
  params.set('page_size', String(PAGE_SIZE))

  const { data } = useQuery({
    queryKey: ['admin-users', params.toString()],
    queryFn: () => api.get(`/admin/users/?${params.toString()}`).then(r => r.data),
  })

  const users = data?.results || data || []
  const total = data?.count ?? users.length

  const setUserRole = useMutation({
    mutationFn: ({ id, role }) => api.put(`/admin/users/${id}/role/`, { role }),
    onSuccess: () => { qc.invalidateQueries(['admin-users']); toast.success('Rol yangilandi') },
    onError: () => toast.error('Rolni yangilab bo\'lmadi'),
  })

  const activeCount = [search, role, region, school, birthYear, isActive].filter(Boolean).length

  function clearAll() {
    setSearch(''); setRole(''); setRegion(''); setSchool(''); setBirthYear(''); setIsActive('')
  }

  return (
    <DashLayout kind="admin">
      <PageHead title="Foydalanuvchilar" sub={`Jami ${total} ta foydalanuvchi`} />

      <FilterBar search={search} onSearch={setSearch} placeholder="Ism, telefon, maktab, viloyat…"
        count={total}
        onClear={activeCount > 0 ? clearAll : null}>
        <select className="select" value={role} onChange={e => setRole(e.target.value)}>
          <option value="">Barcha rollar</option>
          <option value="student">O'quvchilar</option>
          <option value="teacher">O'qituvchilar</option>
          <option value="admin">Adminlar</option>
        </select>
        <select className="select" value={region} onChange={e => setRegion(e.target.value)}>
          <option value="">Barcha viloyatlar</option>
          {(opts.regions || []).map(r => <option key={r} value={r}>{r}</option>)}
        </select>
        <select className="select" value={school} onChange={e => setSchool(e.target.value)}>
          <option value="">Barcha maktablar</option>
          {(opts.schools || []).map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select className="select" value={birthYear} onChange={e => setBirthYear(e.target.value)}>
          <option value="">Barcha yillar</option>
          {(opts.birth_years || []).map(y => (
            <option key={y} value={y}>{y} yil · ~{new Date().getFullYear() - y - 6}-sinf</option>
          ))}
        </select>
        <select className="select" value={isActive} onChange={e => setIsActive(e.target.value)}>
          <option value="">Barcha holatlar</option>
          <option value="true">Faol</option>
          <option value="false">Bloklangan</option>
        </select>
      </FilterBar>

      <Panel title="Ro'yxat" count={total}>
        {users.length === 0 ? (
          <EmptyState icon="users" title="Foydalanuvchilar topilmadi"
            sub="Qidiruv yoki filtrlarni o'zgartirib ko'ring."
            action={activeCount > 0 && (
              <button className="btn btn-secondary btn-sm" onClick={clearAll}>
                <Icon name="x" size={13} /> Filtrlarni tozalash
              </button>
            )} />
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Foydalanuvchi</th>
                <th>Telefon</th>
                <th>Rol</th>
                <th>Maktab / Sinf</th>
                <th>Sana</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td>
                    <Link to={`/admin-panel/users/${u.id}`} style={{ display: 'flex', alignItems: 'center', gap: 12, color: 'var(--text)' }}>
                      <div className="avatar avatar-blue" style={{ width: 36, height: 36, fontSize: 12, overflow: 'hidden', flexShrink: 0 }}>
                        {u.avatar ? <img src={absUrl(u.avatar)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : u.initials}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600 }}>{u.display_name}</div>
                        {u.email && <div className="text-xs text-muted">{u.email}</div>}
                        {!u.is_active && <span className="badge badge-red" style={{ marginTop: 4 }}>Bloklangan</span>}
                      </div>
                    </Link>
                  </td>
                  <td className="text-sm font-mono">{u.phone || '—'}</td>
                  <td>
                    <select value={u.role}
                      onChange={e => {
                        const role = e.target.value
                        if (confirm(`${u.display_name} rolini "${role}" ga o'zgartirishni tasdiqlaysizmi?`)) {
                          setUserRole.mutate({ id: u.id, role })
                        } else { e.target.value = u.role }
                      }}
                      className="select"
                      style={{ height: 32, width: 130, fontSize: 13, paddingLeft: 10 }}>
                      <option value="student">O'quvchi</option>
                      <option value="teacher">O'qituvchi</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td className="text-sm">
                    {u.school && <div>{u.school}</div>}
                    {u.birth_year && <div className="text-xs text-muted">{u.birth_year} y · ~{new Date().getFullYear() - u.birth_year - 6}-sinf</div>}
                    {u.region && <div className="text-xs text-muted">{u.region}{u.district ? ', ' + u.district : ''}</div>}
                    {!u.school && !u.birth_year && !u.region && <span className="text-muted">—</span>}
                  </td>
                  <td className="text-sm text-muted">{new Date(u.date_joined).toLocaleDateString('uz-UZ')}</td>
                  <td>
                    <Link to={`/admin-panel/users/${u.id}`} className="icon-btn" title="Batafsil"><Icon name="eye" size={15} /></Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Panel>

      <Pagination page={page} pageSize={PAGE_SIZE} total={total} onChange={setPage} />
    </DashLayout>
  )
}
