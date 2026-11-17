import { useEffect, useState } from 'react'
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import api from '../../api/client'
import DashLayout from '../../components/DashLayout'
import Icon from '../../components/Icon'
import Pagination from '../../components/Pagination'
import { PageHead, EmptyState } from '../../components/Dash'
import { ErrorState, LoadingBlock } from '../../components/PanelKit'

const PAGE_SIZE = 10
const TONES = ['blue', 'amber', 'rose', 'violet', 'teal', 'green']

function toDate(iso) {
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? null : d
}
/** Short stamp for the list: time today, otherwise day + month. */
function shortWhen(iso) {
  const d = toDate(iso)
  if (!d) return ''
  const now = new Date()
  if (d.toDateString() === now.toDateString()) return d.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })
  const opts = { day: '2-digit', month: '2-digit' }
  if (d.getFullYear() !== now.getFullYear()) opts.year = '2-digit'
  return d.toLocaleDateString('uz-UZ', opts)
}
function fullWhen(iso) {
  const d = toDate(iso)
  return d ? d.toLocaleString('uz-UZ', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'
}
const initial = (name) => ((name || '').trim()[0] || '?').toUpperCase()
const tone = (id) => TONES[(Number(id) || 0) % TONES.length]

const css = `
  .amg-flat { padding: 0; }
  .amg-bar { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; margin-bottom: 16px; }
  .amg-bar .search-box { flex: 1 1 240px; }
  .amg-bar .search-box .input { width: 100%; padding-right: 36px; }
  .amg-clear { position: absolute; right: 8px; top: 50%; transform: translateY(-50%); color: var(--text-3); padding: 5px; display: flex; border-radius: 8px; }
  .amg-clear:hover { color: var(--text); background: var(--bg-soft); }

  .amg-split { display: grid; grid-template-columns: minmax(300px, 400px) minmax(0, 1fr); gap: 18px; align-items: start; }
  .amg-list { background: var(--white); border: 1.5px solid var(--border); border-radius: var(--r-card); overflow: hidden; transition: opacity .15s ease; }
  .amg-list.stale { opacity: .55; }
  .amg-item { display: grid; grid-template-columns: auto minmax(0, 1fr) auto; gap: 4px 12px; align-items: center; width: 100%; text-align: left; padding: 14px 16px; border-bottom: 1.5px dashed var(--border-2); position: relative; transition: background .12s ease; }
  .amg-item:last-child { border-bottom: none; }
  .amg-item:hover { background: var(--paper); }
  .amg-item.sel { background: var(--sun-soft); }
  .amg-item.sel::before { content: ''; position: absolute; left: 0; top: 10px; bottom: 10px; width: 4px; border-radius: 0 4px 4px 0; background: var(--line); }
  .amg-item .avatar { width: 40px; height: 40px; border-radius: 13px; font-size: 15px; grid-row: span 2; }
  .amg-item .nm { font-size: 14px; font-weight: 600; color: var(--text-2); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; display: flex; align-items: center; gap: 7px; }
  .amg-item .nm i { width: 9px; height: 9px; border-radius: 999px; background: var(--coral); flex-shrink: 0; }
  .amg-item .sb { font-size: 13px; color: var(--text-3); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; grid-column: 2 / 4; }
  .amg-item .tm { font-family: var(--font-mono); font-size: 10.5px; color: var(--text-4); white-space: nowrap; }
  .amg-item.unread .nm { color: var(--text); font-weight: 800; }
  .amg-item.unread .sb { color: var(--text-2); font-weight: 600; }
  .amg-item.unread .tm { color: var(--text-2); }

  .amg-read { background: var(--white); border: 1.5px solid var(--border); border-radius: var(--r-card); position: sticky; top: 20px; min-width: 0; }
  .amg-read.open { border: 2px solid var(--line); box-shadow: var(--hard); }
  .amg-read-top { display: flex; align-items: center; gap: 10px; padding: 14px 18px; border-bottom: 1.5px dashed var(--border); }
  .amg-read-top .coord { margin-left: auto; text-align: right; }
  .amg-back { display: none; }
  .amg-read-body { padding: 22px 24px 8px; }
  .amg-read-body h2 { font-size: 24px; letter-spacing: -0.035em; line-height: 1.15; overflow-wrap: anywhere; }
  .amg-from { display: flex; align-items: center; gap: 12px; margin: 18px 0; padding: 12px 14px; background: var(--paper); border: 1.5px solid var(--border); border-radius: 16px; }
  .amg-from .avatar { width: 44px; height: 44px; border-radius: 14px; font-size: 17px; }
  .amg-from .who { min-width: 0; flex: 1; }
  .amg-from .who b { display: block; font-size: 14.5px; color: var(--text); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .amg-from .who a { font-size: 13px; color: var(--sea); font-weight: 600; overflow-wrap: anywhere; }
  .amg-from .who a:hover { text-decoration: underline; text-underline-offset: 3px; }
  .amg-text { font-size: 15px; line-height: 1.7; color: var(--text-2); white-space: pre-wrap; overflow-wrap: anywhere; padding-bottom: 14px; }
  .amg-read-foot { display: flex; gap: 8px; flex-wrap: wrap; padding: 16px 24px 20px; border-top: 1.5px dashed var(--border); }
  .amg-read-foot .sp { flex: 1; }

  .amg-blank { display: flex; flex-direction: column; align-items: center; text-align: center; gap: 6px; padding: 72px 24px; background-image: var(--topo); background-size: 520px 360px; border-radius: var(--r-card); }
  .amg-blank .tile { width: 62px; height: 62px; border-radius: 20px; background: var(--sun); color: #14213D; border: 2px solid var(--line); box-shadow: var(--hard-sm); transform: rotate(-6deg); display: flex; align-items: center; justify-content: center; margin-bottom: 12px; }
  .amg-blank b { font-family: var(--font-display); font-size: 18px; color: var(--text); letter-spacing: -0.02em; }
  .amg-blank span { font-size: 13.5px; color: var(--text-3); max-width: 300px; line-height: 1.5; }

  @media (max-width: 1024px) {
    .amg-split { grid-template-columns: 1fr; }
    .amg-read { position: static; }
    .amg-split.has-sel .amg-side { display: none; }
    .amg-split:not(.has-sel) .amg-read { display: none; }
    .amg-back { display: inline-flex; }
  }
  @media (max-width: 560px) {
    .amg-read-body { padding: 18px 16px 4px; }
    .amg-read-body h2 { font-size: 20px !important; }
    .amg-read-foot { padding: 14px 16px 16px; }
    .amg-read-foot .btn { flex: 1 1 100%; }
    .amg-read-foot .sp { display: none; }
    .amg-read-top .coord { display: none; }
  }
`

export default function AdminMessages() {
  const qc = useQueryClient()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [debounced, setDebounced] = useState('')
  const [onlyUnread, setOnlyUnread] = useState(false)
  const [selId, setSelId] = useState(null)

  // Debounce the search box; a new search always starts from page 1
  useEffect(() => {
    const t = setTimeout(() => { setDebounced(search.trim()); setPage(1) }, 350)
    return () => clearTimeout(t)
  }, [search])

  const params = new URLSearchParams({ page: String(page), page_size: String(PAGE_SIZE) })
  if (debounced) params.set('search', debounced)
  if (onlyUnread) params.set('unread', '1')

  const { data, isLoading, isError, isFetching, isPlaceholderData, refetch } = useQuery({
    queryKey: ['admin-contact-messages', params.toString()],
    queryFn: () => api.get(`/admin/contact-messages/?${params.toString()}`).then(r => r.data),
    placeholderData: keepPreviousData,
  })
  // Same key as the dashboard's "needs attention" block, so both stay in sync
  const { data: unreadCount } = useQuery({
    queryKey: ['admin-contact-messages', 'unread-count'],
    queryFn: () => api.get('/admin/contact-messages/?unread=1&page_size=1').then(r => r.data?.count ?? 0),
  })

  const list = data?.results || (Array.isArray(data) ? data : [])
  const total = data?.count ?? list.length
  const current = list.find(m => m.id === selId) || null
  const filtered = !!debounced || onlyUnread

  const markRead = useMutation({
    mutationFn: (id) => api.post(`/admin/contact-messages/${id}/read/`),
    onSuccess: () => {
      // In the "unread" view the message leaves the list — don't stay on an empty page
      if (onlyUnread && list.length === 1 && page > 1) setPage(p => p - 1)
      qc.invalidateQueries({ queryKey: ['admin-contact-messages'] })
      qc.invalidateQueries({ queryKey: ['admin-contact-messages-recent'] })
      toast.success("O'qilgan deb belgilandi")
    },
    onError: (err) => toast.error(err.response?.data?.detail || "Belgilab bo'lmadi, qayta urinib ko'ring"),
  })

  function switchTab(unread) {
    if (unread === onlyUnread) return
    setOnlyUnread(unread); setPage(1); setSelId(null)
  }
  async function copyEmail(email) {
    try {
      await navigator.clipboard.writeText(email)
      toast.success('Email nusxalandi')
    } catch { toast.error("Nusxalab bo'lmadi") }
  }
  const replyHref = (m) =>
    `mailto:${m.email}?subject=${encodeURIComponent(`Re: ${m.subject || ''}`)}`

  const sub = unreadCount > 0
    ? `Aloqa formasi orqali kelgan xabarlar — ${unreadCount} tasi o'qilmagan`
    : 'Aloqa formasi orqali kelgan xabarlar'

  return (
    <DashLayout kind="admin">
      <style>{css}</style>
      <PageHead title="Xabarlar" sub={sub} />

      <div className="amg-bar">
        <div className="seg-tabs">
          <button type="button" className={!onlyUnread ? 'on' : ''} onClick={() => switchTab(false)}>Hammasi</button>
          <button type="button" className={onlyUnread ? 'on' : ''} onClick={() => switchTab(true)}>
            O'qilmagan{unreadCount > 0 && <span className="n">{unreadCount}</span>}
          </button>
        </div>
        <div className="search-box">
          <Icon name="search" size={15} />
          <input className="input" placeholder="Ism, email, mavzu yoki matn bo'yicha…" value={search}
            onChange={e => setSearch(e.target.value)} aria-label="Xabarlarni qidirish" />
          {search && (
            <button type="button" className="amg-clear" onClick={() => setSearch('')} aria-label="Qidiruvni tozalash">
              <Icon name="x" size={14} />
            </button>
          )}
        </div>
        <span className="coord">{isFetching && !isLoading ? 'YANGILANMOQDA…' : `JAMI · ${total}`}</span>
      </div>

      {isLoading ? (
        <LoadingBlock label="Xabarlar yuklanmoqda…" />
      ) : isError ? (
        <ErrorState title="Xabarlarni yuklab bo'lmadi" onRetry={refetch} />
      ) : list.length === 0 ? (
        <div className="card amg-flat">
          <EmptyState icon={filtered ? 'search' : 'mail'}
            title={onlyUnread && !debounced ? "O'qilmagan xabar yo'q" : filtered ? 'Xabarlar topilmadi' : "Hozircha xabar yo'q"}
            sub={onlyUnread && !debounced ? 'Barcha xabarlar ko\'rib chiqilgan.'
              : filtered ? "Qidiruv so'zini o'zgartirib ko'ring."
              : 'Foydalanuvchilar «Aloqa» sahifasi orqali yuborgan xabarlar shu yerda paydo bo\'ladi.'}
            action={filtered && (
              <button type="button" className="btn btn-secondary btn-sm"
                onClick={() => { setSearch(''); setDebounced(''); setOnlyUnread(false); setPage(1) }}>
                <Icon name="x" size={13} /> Filtrni tozalash
              </button>
            )} />
        </div>
      ) : (
        <div className={`amg-split ${current ? 'has-sel' : ''}`}>
          <div className="amg-side">
            <div className={`amg-list ${isPlaceholderData ? 'stale' : ''}`}>
              {list.map(m => (
                <button type="button" key={m.id}
                  className={`amg-item ${m.is_read ? '' : 'unread'} ${current?.id === m.id ? 'sel' : ''}`}
                  onClick={() => setSelId(m.id)} aria-current={current?.id === m.id}>
                  <span className={`avatar avatar-${tone(m.id)}`}>{initial(m.name)}</span>
                  <span className="nm">{!m.is_read && <i title="O'qilmagan" />}{m.name || 'Ismsiz'}</span>
                  <span className="tm">{shortWhen(m.created_at)}</span>
                  <span className="sb">{m.subject || '(mavzusiz)'}</span>
                </button>
              ))}
            </div>
            <Pagination compact page={page} pageSize={PAGE_SIZE} total={total}
              onChange={(p) => { setPage(p); setSelId(null) }} />
          </div>

          <div className={`amg-read ${current ? 'open fade-up' : ''}`} key={current?.id || 'blank'}>
            {!current ? (
              <div className="amg-blank">
                <span className="tile"><Icon name="mail" size={26} /></span>
                <b>Xabarni tanlang</b>
                <span>Chapdagi ro'yxatdan xabarni bossangiz, to'liq matni shu yerda ochiladi.</span>
              </div>
            ) : (
              <>
                <div className="amg-read-top">
                  <button type="button" className="btn btn-secondary btn-sm amg-back" onClick={() => setSelId(null)}>
                    <Icon name="arrowL" size={13} /> Ro'yxat
                  </button>
                  <span className={`badge badge-${current.is_read ? 'gray' : 'red'}`}>
                    {current.is_read ? "O'qilgan" : 'Yangi'}
                  </span>
                  <span className="coord">{fullWhen(current.created_at)}</span>
                </div>
                <div className="amg-read-body">
                  <h2>{current.subject || '(mavzusiz)'}</h2>
                  <div className="amg-from">
                    <span className={`avatar avatar-${tone(current.id)}`}>{initial(current.name)}</span>
                    <div className="who">
                      <b>{current.name || 'Ismsiz'}</b>
                      <a href={`mailto:${current.email}`}>{current.email}</a>
                    </div>
                    <button type="button" className="icon-btn" onClick={() => copyEmail(current.email)}
                      title="Emailni nusxalash" aria-label="Emailni nusxalash">
                      <Icon name="link" size={15} />
                    </button>
                  </div>
                  <p className="amg-text">{current.message}</p>
                </div>
                <div className="amg-read-foot">
                  <a href={replyHref(current)} className="btn btn-primary">
                    <Icon name="mail" size={15} /> Javob yozish
                  </a>
                  <span className="sp" />
                  {!current.is_read && (
                    <button type="button" className="btn btn-secondary" disabled={markRead.isPending}
                      onClick={() => markRead.mutate(current.id)}>
                      <Icon name="checkC" size={15} /> {markRead.isPending ? 'Belgilanmoqda…' : "O'qildi deb belgilash"}
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </DashLayout>
  )
}
