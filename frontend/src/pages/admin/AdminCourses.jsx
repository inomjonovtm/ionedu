import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import api from '../../api/client'
import DashLayout from '../../components/DashLayout'
import Icon from '../../components/Icon'
import Pagination from '../../components/Pagination'
import FilterBar from '../../components/FilterBar'
import { PageHead, Panel, EmptyState } from '../../components/Dash'

const PAGE_SIZE = 12

const TABS = [
  ['pending', 'Moderatsiyada'],
  ['published', 'Nashrda'],
  ['rejected', 'Rad etilgan'],
  ['draft', 'Qoralama'],
]

export default function AdminCourses() {
  const qc = useQueryClient()
  const [tab, setTab] = useState('pending')
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [rejecting, setRejecting] = useState(null) // course being rejected
  const [rejectNote, setRejectNote] = useState('')

  useEffect(() => { setPage(1) }, [tab, search])

  const { data, isLoading } = useQuery({
    queryKey: ['admin-courses', tab],
    queryFn: () => {
      if (tab === 'pending') return api.get('/admin/courses/pending/').then(r => r.data)
      return api.get(`/courses/?status=${tab}&page_size=200`).then(r => r.data.results || r.data)
    },
  })
  const allCourses = data || []
  const q = search.trim().toLowerCase()
  const filtered = allCourses.filter(c => !q
    || (c.title || '').toLowerCase().includes(q)
    || (c.teacher?.display_name || '').toLowerCase().includes(q))
  const total = filtered.length
  const courses = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const approve = useMutation({
    mutationFn: (slug) => api.post(`/admin/courses/${slug}/approve/`),
    onSuccess: () => { qc.invalidateQueries(); toast.success('Kurs tasdiqlandi va nashr etildi') },
    onError: () => toast.error('Tasdiqlashda xatolik'),
  })
  const reject = useMutation({
    mutationFn: ({ slug, note }) => api.post(`/admin/courses/${slug}/reject/`, { note }),
    onSuccess: () => {
      qc.invalidateQueries()
      toast.success('Kurs rad etildi — muallifga xabar yuborildi')
      setRejecting(null); setRejectNote('')
    },
    onError: () => toast.error('Rad etishda xatolik'),
  })
  const del = useMutation({
    mutationFn: (slug) => api.delete(`/courses/${slug}/`),
    onSuccess: () => { qc.invalidateQueries(); toast.success("O'chirildi") },
    onError: () => toast.error("O'chirib bo'lmadi"),
  })

  return (
    <DashLayout kind="admin">
      <PageHead title="Kurslar boshqaruvi" sub="Kurslarni ko'rib chiqing, tasdiqlang yoki o'zingiz yarating">
        <Link to="/admin-panel/courses/new" className="btn btn-primary">
          <Icon name="plus" size={15} /> Yangi kurs
        </Link>
      </PageHead>

      <FilterBar search={search} onSearch={setSearch} placeholder="Kurs yoki muallif…"
        count={total}
        tabs={TABS.map(([k, n]) => ({ id: k, label: n }))}
        tab={tab} onTab={setTab} />

      <Panel title={TABS.find(([k]) => k === tab)?.[1]} count={total}>
        {isLoading ? (
          <div className="loading-state"><span className="spinner" /></div>
        ) : courses.length === 0 ? (
          <EmptyState icon="book" title="Bu bo'limda kurslar yo'q"
            sub={tab === 'pending' ? "Yangi kurs moderatsiyaga yuborilganda shu yerda ko'rinadi." : undefined} />
        ) : (
          <table className="table">
            <thead><tr><th>Kurs</th><th>Muallif</th><th>Sana</th><th></th></tr></thead>
            <tbody>
              {courses.map(c => (
                <tr key={c.id}>
                  <td>
                    <Link to={`/courses/${c.slug}`} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div className={`thumb thumb-${c.thumb_color}`} style={{ width: 48, height: 32, fontSize: 18, borderRadius: 6 }}>{c.thumb_emoji}</div>
                      <div>
                        <div style={{ fontWeight: 600 }}>{c.title}</div>
                        <div className="text-xs text-muted">{c.lessons_count} dars</div>
                      </div>
                    </Link>
                  </td>
                  <td>{c.teacher?.display_name}</td>
                  <td className="text-sm text-muted">{new Date(c.created_at).toLocaleDateString('uz-UZ')}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center', justifyContent: 'flex-end' }}>
                      {tab === 'pending' && (
                        <>
                          <button className="btn btn-primary btn-sm" onClick={() => approve.mutate(c.slug)} disabled={approve.isPending}>
                            Tasdiqlash
                          </button>
                          <button className="btn btn-danger btn-sm" onClick={() => { setRejecting(c); setRejectNote('') }}>
                            Rad etish
                          </button>
                        </>
                      )}
                      {tab === 'rejected' && (
                        <button className="btn btn-primary btn-sm" onClick={() => approve.mutate(c.slug)} disabled={approve.isPending}>
                          Tasdiqlash
                        </button>
                      )}
                      <Link to={`/admin-panel/courses/${c.slug}/stats`} className="icon-btn" title="Statistika"><Icon name="chart" size={15} /></Link>
                      <Link to={`/courses/${c.slug}`} className="icon-btn" title="Ko'rish"><Icon name="eye" size={15} /></Link>
                      <Link to={`/admin-panel/courses/${c.slug}/edit`} className="icon-btn" title="Tahrirlash"><Icon name="edit" size={15} /></Link>
                      <button className="icon-btn" title="O'chirish" onClick={() => { if (confirm(`"${c.title}" kursini butunlay o'chirishni tasdiqlaysizmi?`)) del.mutate(c.slug) }}>
                        <Icon name="trash" size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Panel>

      <Pagination page={page} pageSize={PAGE_SIZE} total={total} onChange={setPage} />

      {rejecting && (
        <div className="modal-backdrop" onClick={() => setRejecting(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: 18, marginBottom: 6 }}>Kursni rad etish</h3>
            <p className="text-sm text-muted mb-4">"{rejecting.title}" — muallifga rad etish sababi yuboriladi.</p>
            <div className="field">
              <label className="label">Sabab *</label>
              <textarea className="textarea" rows={3} autoFocus value={rejectNote}
                onChange={e => setRejectNote(e.target.value)}
                placeholder="Masalan: videolar sifati past, tavsif yetarli emas…" />
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setRejecting(null)}>Bekor qilish</button>
              <button className="btn btn-danger" disabled={!rejectNote.trim() || reject.isPending}
                onClick={() => reject.mutate({ slug: rejecting.slug, note: rejectNote.trim() })}>
                {reject.isPending ? 'Yuborilmoqda…' : 'Rad etish'}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashLayout>
  )
}
