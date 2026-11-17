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

const KIND_LABELS = {
  enrollment: 'Kurs',
  course_approved: 'Tasdiqlandi',
  course_rejected: 'Rad etildi',
  test_passed: 'Test',
  certificate: 'Sertifikat',
  review: 'Sharh',
  system: 'Tizim',
}

const css = `
  .nt-page { max-width: 860px; margin: 0 auto; padding: 40px 28px 90px; }
  .nt-head { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 24px; align-items: end; margin-bottom: 34px; }
  .nt-head h1 { font-family: var(--font-display); font-size: 52px; font-weight: 800; letter-spacing: -.045em; line-height: 1; margin-top: 14px; }
  .nt-head p { font-size: 15px; color: var(--text-3); margin-top: 12px; }
  .nt-count { width: 104px; height: 104px; border-radius: 22px; background: var(--sun); color: #14213D; border: 2px solid var(--line); box-shadow: var(--hard); transform: rotate(4deg); display: flex; flex-direction: column; align-items: center; justify-content: center; flex-shrink: 0; }
  .nt-count b { font-family: var(--font-display); font-size: 44px; font-weight: 800; letter-spacing: -.04em; line-height: 1; }
  .nt-count span { font-family: var(--font-mono); font-size: 9.5px; letter-spacing: .12em; text-transform: uppercase; font-weight: 700; margin-top: 4px; }
  .nt-bar { display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap; margin-bottom: 18px; padding-bottom: 14px; border-bottom: 1.5px dashed var(--border); }
  .nt-bar .lb { font-family: var(--font-mono); font-size: 11px; letter-spacing: .12em; text-transform: uppercase; color: var(--text-3); }

  .nt-list { position: relative; display: flex; flex-direction: column; gap: 12px; padding-left: 62px; }
  .nt-list::before { content: ''; position: absolute; left: 22px; top: 10px; bottom: 10px; border-left: 2px dashed var(--border); }
  .nt-item { position: relative; display: flex; align-items: center; gap: 14px; padding: 16px 18px; background: var(--white); border: 1.5px solid var(--border); border-radius: 18px; transition: transform .14s ease, box-shadow .14s ease, border-color .14s ease; }
  .nt-item:hover { transform: translate(-2px, -2px); border-color: var(--line); box-shadow: var(--hard); }
  .nt-node { position: absolute; left: -62px; top: 50%; margin-top: -23px; width: 46px; height: 46px; border-radius: 14px; border: 1.5px solid var(--line); display: flex; align-items: center; justify-content: center; color: #14213D; background: var(--bg-soft); }
  .nt-node.green { background: #8FE0B4; } .nt-node.red { background: #FF9D88; }
  .nt-node.amber { background: var(--sun); } .nt-node.blue { background: #9DBDFF; }
  .nt-node.gray { color: var(--text); }
  .nt-item:nth-child(odd) .nt-node { transform: rotate(-4deg); }
  .nt-item:nth-child(even) .nt-node { transform: rotate(3deg); }
  .nt-body { flex: 1; min-width: 0; }
  .nt-meta { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; font-family: var(--font-mono); font-size: 10.5px; letter-spacing: .08em; text-transform: uppercase; color: var(--text-4); margin-bottom: 5px; }
  .nt-meta b { color: var(--text-2); font-weight: 700; }
  .nt-msg { font-size: 14.5px; line-height: 1.55; color: var(--text); word-break: break-word; }
  .nt-go { width: 38px; height: 38px; border-radius: 12px; border: 1.5px solid var(--line); background: var(--white); color: var(--text); display: flex; align-items: center; justify-content: center; flex-shrink: 0; transition: background .14s ease, color .14s ease; }
  .nt-go:hover { background: var(--sun); color: #14213D; }
  .nt-empty { background: var(--white); border: 1.5px dashed var(--border); border-radius: var(--r-card); }

  @media (max-width: 768px) {
    .nt-page { padding: 24px 16px 64px; }
    .nt-head { gap: 14px; margin-bottom: 24px; }
    .nt-head h1 { font-size: 34px; }
    .nt-count { width: 72px; height: 72px; border-radius: 18px; }
    .nt-count b { font-size: 30px; }
    .nt-count span { font-size: 8px; }
    .nt-list { padding-left: 0; }
    .nt-list::before { display: none; }
    .nt-item { align-items: flex-start; padding: 14px; gap: 12px; }
    .nt-node { position: static; margin: 0; width: 40px; height: 40px; border-radius: 12px; flex-shrink: 0; }
    .nt-go { align-self: center; }
  }
`

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
    onSuccess: () => { setPage(1); qc.invalidateQueries({ queryKey: ['notifications'] }) },
  })

  return (
    <Layout>
      <style>{css}</style>
      <div className="nt-page">
        <div className="nt-head fade-up">
          <div>
            <span className="eyebrow">Signal daftari</span>
            <h1>Bildirish<span className="mark-sun">nomalar</span></h1>
            <p>Yangi xabarlaringiz{total > 0 ? ` — ${total} ta` : ''}</p>
          </div>
          <div className="nt-count" aria-hidden="true">
            <b>{total > 99 ? '99+' : total}</b>
            <span>Yangi</span>
          </div>
        </div>

        {total > 0 && (
          <div className="nt-bar">
            <span className="lb">O'qilmaganlar</span>
            <button className="btn btn-secondary btn-sm" onClick={() => readAll.mutate()}>
              <Icon name="checkC" size={14} /> Hammasini o'qildi deb belgilash
            </button>
          </div>
        )}

        {total === 0 ? (
          <div className="nt-empty fade-up fade-up-d1">
            <div className="empty-state">
              <div className="es-ico"><Icon name="bell" size={24} /></div>
              <div className="es-title">Yangi bildirishnomalar yo'q</div>
              <div className="es-sub">Hammasi tinch — yangi xabar kelganda shu yerda ko'rinadi.</div>
            </div>
          </div>
        ) : (
          <div className="nt-list fade-up fade-up-d1">
            {data.map(n => {
              const [icon, color] = KIND_ICONS[n.kind] || ['bell', 'gray']
              return (
                <div key={n.id} className="nt-item">
                  <span className={`nt-node ${color}`}><Icon name={icon} size={20} /></span>
                  <div className="nt-body">
                    <div className="nt-meta">
                      <b>{KIND_LABELS[n.kind] || 'Xabar'}</b>
                      <span>{new Date(n.created_at).toLocaleString('uz-UZ')}</span>
                    </div>
                    <div className="nt-msg">{renderMessage(n.message)}</div>
                  </div>
                  {n.link && (
                    <Link to={n.link} className="nt-go" title="O'tish">
                      <Icon name="chevR" size={16} />
                    </Link>
                  )}
                </div>
              )
            })}
          </div>
        )}
        <Pagination page={page} pageSize={PAGE_SIZE} total={total} onChange={setPage} />
      </div>
    </Layout>
  )
}
