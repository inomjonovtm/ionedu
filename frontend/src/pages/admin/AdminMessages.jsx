import { useEffect, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../api/client'
import DashLayout from '../../components/DashLayout'
import Icon from '../../components/Icon'
import Pagination from '../../components/Pagination'
import FilterBar from '../../components/FilterBar'
import { PageHead, EmptyState } from '../../components/Dash'

const PAGE_SIZE = 10

export default function AdminMessages() {
  const qc = useQueryClient()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [debounced, setDebounced] = useState('')
  const [onlyUnread, setOnlyUnread] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 350)
    return () => clearTimeout(t)
  }, [search])
  useEffect(() => { setPage(1) }, [debounced, onlyUnread])

  const params = new URLSearchParams({ page: String(page), page_size: String(PAGE_SIZE) })
  if (debounced) params.set('search', debounced)
  if (onlyUnread) params.set('unread', '1')

  const { data, isLoading } = useQuery({
    queryKey: ['admin-contact-messages', params.toString()],
    queryFn: () => api.get(`/admin/contact-messages/?${params.toString()}`).then(r => r.data),
  })
  const list = data?.results || []
  const total = data?.count ?? list.length

  const markRead = useMutation({
    mutationFn: (id) => api.post(`/admin/contact-messages/${id}/read/`),
    onSuccess: () => qc.invalidateQueries(['admin-contact-messages']),
  })

  return (
    <DashLayout kind="admin">
      <PageHead title="Aloqa xabarlari" sub={`${total} ta xabar — aloqa formasi orqali kelgan`} />

      <FilterBar search={search} onSearch={setSearch}
        placeholder="Ism, email yoki mavzu bo'yicha…" count={total}>
        <label className="checkbox">
          <input type="checkbox" checked={onlyUnread} onChange={e => setOnlyUnread(e.target.checked)} />
          Faqat o'qilmaganlar
        </label>
      </FilterBar>

      {isLoading ? (
        <div className="loading-state"><span className="spinner" /></div>
      ) : list.length === 0 ? (
        <div className="card" style={{ padding: 0 }}>
          <EmptyState icon="message"
            title={debounced || onlyUnread ? 'Xabarlar topilmadi' : "Hozircha xabar yo'q"}
            sub={debounced || onlyUnread ? "Filtr yoki qidiruvni o'zgartirib ko'ring." : 'Foydalanuvchilar "Aloqa" sahifasi orqali xabar yuborishlari mumkin.'} />
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {list.map(m => (
            <div key={m.id} className="card" style={{ position: 'relative', borderColor: m.is_read ? 'var(--border)' : 'var(--green-300)' }}>
              {!m.is_read && (
                <span className="badge badge-green" style={{ position: 'absolute', top: 16, right: 16 }}>
                  Yangi
                </span>
              )}
              <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', marginBottom: 12 }}>
                <div className="avatar avatar-blue" style={{ width: 44, height: 44, fontSize: 16 }}>
                  {(m.name || '?')[0]?.toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 15 }}>{m.name}</div>
                  <div className="text-sm text-muted" style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <Icon name="message" size={13} /> {m.email}
                    </span>
                    <span>·</span>
                    <span>{new Date(m.created_at).toLocaleString('uz-UZ')}</span>
                  </div>
                </div>
              </div>
              <h4 style={{ fontSize: 15, marginBottom: 8, fontFamily: 'var(--font-display)' }}>{m.subject}</h4>
              <p style={{ fontSize: 14, color: 'var(--text-2)', lineHeight: 1.6, whiteSpace: 'pre-line' }}>{m.message}</p>
              <div style={{ display: 'flex', gap: 8, marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--border-2)' }}>
                {!m.is_read && (
                  <button className="btn btn-secondary btn-sm" onClick={() => markRead.mutate(m.id)}>
                    <Icon name="checkC" size={14} /> O'qildi deb belgilash
                  </button>
                )}
                <a href={`mailto:${m.email}`} className="btn btn-primary btn-sm">
                  <Icon name="arrowR" size={14} /> Javob yozish
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      <Pagination page={page} pageSize={PAGE_SIZE} total={total} onChange={setPage} />
    </DashLayout>
  )
}
