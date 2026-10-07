import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import api from '../../api/client'
import DashLayout from '../../components/DashLayout'
import Icon from '../../components/Icon'
import Pagination from '../../components/Pagination'
import FilterBar from '../../components/FilterBar'
import { PageHead, EmptyState, Stars } from '../../components/Dash'

const PAGE_SIZE = 10

export default function AdminReviews() {
  const qc = useQueryClient()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [debounced, setDebounced] = useState('')

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 350)
    return () => clearTimeout(t)
  }, [search])
  useEffect(() => { setPage(1) }, [debounced])

  const params = new URLSearchParams({ page: String(page), page_size: String(PAGE_SIZE) })
  if (debounced) params.set('search', debounced)

  const { data, isLoading } = useQuery({
    queryKey: ['admin-reviews', params.toString()],
    queryFn: () => api.get(`/admin/reviews/?${params.toString()}`).then(r => r.data),
  })
  const list = data?.results || []
  const total = data?.count ?? list.length

  const del = useMutation({
    mutationFn: (id) => api.delete(`/admin/reviews/${id}/`),
    onSuccess: () => { qc.invalidateQueries(['admin-reviews']); toast.success("O'chirildi") },
    onError: () => toast.error("O'chirib bo'lmadi"),
  })

  return (
    <DashLayout kind="admin">
      <PageHead title="Sharhlar" sub={`${total} ta sharh — barcha kurslar bo'yicha`} />

      <FilterBar search={search} onSearch={setSearch}
        placeholder="Sharh matni, kurs yoki o'quvchi bo'yicha…" count={total} />

      {isLoading ? (
        <div className="loading-state"><span className="spinner" /></div>
      ) : list.length === 0 ? (
        <div className="card" style={{ padding: 0 }}>
          <EmptyState icon="star"
            title={debounced ? 'Sharhlar topilmadi' : "Hozircha sharhlar yo'q"}
            sub={debounced ? "Qidiruv so'zini o'zgartirib ko'ring." : "O'quvchilar kurslarni baholaganda shu yerda ko'rinadi."} />
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {list.map(r => (
            <div key={r.id} className="card">
              <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 10 }}>
                <div className="avatar avatar-blue">{r.student?.initials}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{r.student?.display_name}</div>
                  <div className="text-xs text-muted">
                    <Link to={`/courses/${r.course_slug}`} style={{ color: 'var(--green-600)' }}>{r.course_title}</Link>
                    {' '}· {new Date(r.created_at).toLocaleDateString('uz-UZ')}
                  </div>
                </div>
                <Stars value={r.rating} size={13} />
                <button className="icon-btn" title="O'chirish"
                  onClick={() => { if (confirm("Sharhni o'chirishni tasdiqlaysizmi?")) del.mutate(r.id) }}>
                  <Icon name="trash" size={15} />
                </button>
              </div>
              <p className="text-sm" style={{ color: 'var(--text-2)' }}>{r.comment}</p>
            </div>
          ))}
        </div>
      )}
      <Pagination page={page} pageSize={PAGE_SIZE} total={total} onChange={setPage} />
    </DashLayout>
  )
}
