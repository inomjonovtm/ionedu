import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../api/client'
import Layout from '../../components/Layout'
import Icon from '../../components/Icon'
import Pagination from '../../components/Pagination'

// Render the message as plain text, honouring only <strong> markers
// (no raw HTML ever reaches the DOM — prevents stored XSS).
function renderMessage(msg = '') {
  const unescape = (s) => s
    .replaceAll('&lt;', '<').replaceAll('&gt;', '>')
    .replaceAll('&quot;', '"').replaceAll('&#x27;', "'").replaceAll('&#39;', "'")
    .replaceAll('&amp;', '&')
  return msg.split(/<\/?strong>/).map((part, i) =>
    i % 2 === 1 ? <strong key={i}>{unescape(part)}</strong> : <span key={i}>{unescape(part)}</span>
  )
}

const PAGE_SIZE = 15

const KIND_ICONS = {
  enrollment: ['book', 'green'],
  course_approved: ['checkC', 'green'],
  course_rejected: ['x', 'red'],
  test_passed: ['fileText', 'amber'],
  certificate: ['award', 'green'],
  review: ['star', 'blue'],
  system: ['bell', 'blue'],
}

export default function Notifications() {
  const qc = useQueryClient()
  const [page, setPage] = useState(1)
  const { data: all = [] } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => api.get('/notifications/').then(r => r.data.results || r.data),
  })

  // Faqat yangi (o'qilmagan) bildirishnomalar ko'rsatiladi — eskilari (o'qilganlar) yashiriladi.
  const fresh = useMemo(() => all.filter(n => !n.is_read), [all])
  const total = fresh.length
  const data = useMemo(() => fresh.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), [fresh, page])

  const readAll = useMutation({
    mutationFn: () => api.post('/notifications/read-all/'),
    onSuccess: () => { setPage(1); qc.invalidateQueries(['notifications']) },
  })

  return (
    <Layout>
      <div style={{ maxWidth: 680, margin: '40px auto', padding: '0 24px 80px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <h1 style={{ fontSize: 28 }}>Bildirishnomalar</h1>
          {total > 0 && (
            <button className="btn btn-ghost btn-sm" onClick={() => readAll.mutate()}>
              <Icon name="checkC" size={14} /> Hammasini o'qildi deb belgilash
            </button>
          )}
        </div>
        <p className="text-muted mb-4">
          Yangi xabarlaringiz{total > 0 ? ` — ${total} ta` : ''}
        </p>

        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {total === 0 ? (
            <div style={{ padding: 60, textAlign: 'center', color: 'var(--text-3)' }}>
              Yangi bildirishnomalar yo'q
            </div>
          ) : data.map(n => {
            const [icon, color] = KIND_ICONS[n.kind] || ['bell', 'gray']
            return (
              <div key={n.id} style={{ display: 'flex', gap: 14, padding: '16px 20px', borderBottom: '1px solid var(--border-2)', background: 'var(--bg-soft)' }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: `var(--${color}-50)`, color: `var(--${color}-600)`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon name={icon} size={20} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="text-sm" style={{ wordBreak: 'break-word' }}>{renderMessage(n.message)}</div>
                  <div className="text-xs text-muted mt-1">{new Date(n.created_at).toLocaleString('uz-UZ')}</div>
                </div>
                {n.link && (
                  <Link to={n.link} className="icon-btn" title="O'tish" style={{ alignSelf: 'center' }}>
                    <Icon name="chevR" size={16} />
                  </Link>
                )}
              </div>
            )
          })}
        </div>
        <Pagination page={page} pageSize={PAGE_SIZE} total={total} onChange={setPage} />
      </div>
    </Layout>
  )
}
