import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import api, { absUrl } from '../../api/client'
import DashLayout from '../../components/DashLayout'
import Icon from '../../components/Icon'
import Pagination from '../../components/Pagination'
import FilterBar from '../../components/FilterBar'
import { PageHead, EmptyState } from '../../components/Dash'
import { ConfirmModal, ErrorState, LoadingBlock, StatStrip } from '../../components/PanelKit'

const PAGE_SIZE = 12

const css = `
  .abl-feature {
    position: relative; overflow: hidden; display: grid; grid-template-columns: 260px minmax(0, 1fr); gap: 22px;
    padding: 16px; margin-bottom: 18px; background-color: var(--white);
    border: 2px solid var(--line); border-radius: var(--r-card); box-shadow: var(--hard);
  }
  .abl-feature .thumb { width: 100%; height: 100%; min-height: 168px; aspect-ratio: auto; font-size: 60px; border: 1.5px solid var(--line); }
  .abl-feature .thumb img, .abl-cover img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; z-index: 2; }
  .abl-f-body { display: flex; flex-direction: column; min-width: 0; padding: 4px 4px 4px 0; }
  .abl-f-tag {
    align-self: flex-start; display: inline-flex; align-items: center; gap: 6px; padding: 4px 11px;
    background: var(--sun); color: #14213D; border: 1.5px solid var(--line); border-radius: 999px;
    font-family: var(--font-mono); font-size: 10.5px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase;
    transform: rotate(-2deg);
  }
  .abl-f-title { font-family: var(--font-display); font-size: 25px; font-weight: 800; letter-spacing: -0.035em; line-height: 1.15; color: var(--text); margin-top: 12px; overflow-wrap: anywhere; }
  .abl-f-title:hover, .abl-title:hover { text-decoration: underline; text-underline-offset: 3px; }
  .abl-f-ex { font-size: 14px; color: var(--text-3); line-height: 1.55; margin-top: 8px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
  .abl-f-foot { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; margin-top: auto; padding-top: 14px; }
  .abl-f-foot .abl-meta { margin-right: auto; }

  .abl-meta { display: flex; align-items: center; flex-wrap: wrap; gap: 4px 12px; font-family: var(--font-mono); font-size: 11px; color: var(--text-3); }
  .abl-meta span { display: inline-flex; align-items: center; gap: 5px; white-space: nowrap; }

  .abl-flat { padding: 0; }
  .abl-main { min-width: 0; }
  .abl-gap { height: 6px; }
  .abl-list { background: var(--white); border: 1.5px solid var(--border); border-radius: var(--r-card); overflow: hidden; }
  .abl-row {
    display: grid; grid-template-columns: 84px minmax(0, 1fr) auto auto; gap: 16px; align-items: center;
    padding: 13px 16px; border-bottom: 1.5px dashed var(--border-2); transition: background .12s ease;
  }
  .abl-row:last-child { border-bottom: none; }
  .abl-row:hover { background: var(--paper); }
  .abl-row.draft .abl-cover { opacity: .75; }
  .abl-cover { width: 84px; height: 58px; aspect-ratio: auto; border-radius: 12px; font-size: 26px; flex-shrink: 0; }
  .abl-title { font-family: var(--font-display); font-size: 16px; font-weight: 700; letter-spacing: -0.02em; line-height: 1.25; color: var(--text); overflow-wrap: anywhere; }
  .abl-ex { font-size: 13px; color: var(--text-3); margin: 2px 0 6px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .abl-state { display: flex; align-items: center; gap: 9px; }
  .abl-state .lbl { font-size: 12px; font-weight: 700; color: var(--text-3); min-width: 78px; }
  .abl-state .lbl.on { color: var(--green-700); }
  .abl-acts { display: inline-flex; gap: 2px; }
  .abl-acts .star.on { color: #F5A300; }

  @media (max-width: 900px) {
    .abl-feature { grid-template-columns: 1fr; gap: 14px; }
    .abl-feature .thumb { min-height: 0; height: auto; aspect-ratio: 16 / 8; }
    .abl-row { grid-template-columns: 64px minmax(0, 1fr); gap: 10px 12px; align-items: start; }
    .abl-cover { width: 64px; height: 48px; font-size: 22px; }
    .abl-state { grid-column: 1 / -1; grid-row: 2; justify-self: start; }
    .abl-state .lbl { min-width: 0; }
    .abl-acts { grid-column: 1 / -1; grid-row: 2; justify-self: end; }
    .abl-ex { white-space: normal; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
    .abl-f-title { font-size: 21px; }
  }
`

// The API clamps page_size to 100 — walk every page so nothing past the first 100 is hidden.
async function fetchAllPosts() {
  const out = []
  for (let page = 1; page <= 50; page += 1) {
    const { data } = await api.get('/blog/posts/', { params: { manage: 1, page, page_size: 100 } })
    if (Array.isArray(data)) return data
    out.push(...(data.results || []))
    if (!data.next) break
  }
  return out
}

const fmtDate = (p) => new Date(p.published_at || p.created_at).toLocaleDateString('uz-UZ')

function Meta({ p }) {
  return (
    <div className="abl-meta">
      {p.category && <span><Icon name="bookmark" size={12} /> {p.category}</span>}
      <span><Icon name="calendar" size={12} /> {fmtDate(p)}</span>
      <span><Icon name="clock" size={12} /> {p.read_minutes} daq</span>
      <span><Icon name="eye" size={12} /> {p.views}</span>
      <span><Icon name="comment" size={12} /> {p.comment_count ?? 0}</span>
    </div>
  )
}

function Cover({ p, className }) {
  return (
    <div className={`thumb thumb-${p.cover_color} ${className || ''}`}>
      {p.cover ? <img src={absUrl(p.cover)} alt="" /> : <span>{p.cover_emoji}</span>}
    </div>
  )
}

export default function AdminBlog() {
  const qc = useQueryClient()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')     // '' | 'published' | 'draft'
  const [category, setCategory] = useState('')
  const [toDelete, setToDelete] = useState(null)

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin-blog'],
    queryFn: fetchAllPosts,
  })
  const posts = Array.isArray(data) ? data : []
  const published = posts.filter(p => p.status === 'published').length
  const drafts = posts.length - published
  const views = posts.reduce((s, p) => s + (p.views || 0), 0)
  const categories = [...new Set(posts.map(p => p.category).filter(Boolean))].sort()

  const q = search.trim().toLowerCase()
  const hasFilters = !!(q || status || category)
  const filtered = posts
    .filter(p => !status || p.status === status)
    .filter(p => !category || p.category === category)
    .filter(p => !q || (p.title || '').toLowerCase().includes(q) || (p.excerpt || '').toLowerCase().includes(q))

  // The post readers see pinned on top of the public blog — shown as a hero when no filter is active.
  const feature = hasFilters ? null : posts.find(p => p.is_featured && p.status === 'published')
  const rows = feature ? filtered.filter(p => p.id !== feature.id) : filtered
  const pages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE))
  const cur = Math.min(page, pages)
  const pageItems = rows.slice((cur - 1) * PAGE_SIZE, cur * PAGE_SIZE)

  function invalidate(slug) {
    qc.invalidateQueries({ queryKey: ['admin-blog'] })
    qc.invalidateQueries({ queryKey: ['blog-list'] })
    if (slug) qc.invalidateQueries({ queryKey: ['blog', slug] })
  }
  const errMsg = (e, fallback) => e.response?.data?.detail || fallback

  const del = useMutation({
    mutationFn: (slug) => api.delete(`/blog/posts/${slug}/`),
    onSuccess: (_r, slug) => { invalidate(slug); toast.success("Maqola o'chirildi"); setToDelete(null) },
    onError: (e) => toast.error(errMsg(e, "Maqolani o'chirib bo'lmadi")),
  })

  const patch = useMutation({
    mutationFn: ({ slug, body }) => api.patch(`/blog/posts/${slug}/`, body),
    onSuccess: (_r, { slug, body }) => {
      invalidate(slug)
      if ('status' in body) toast.success(body.status === 'published' ? 'Maqola chop etildi' : 'Maqola qoralamaga qaytarildi')
      else toast.success(body.is_featured ? 'Asosiy maqola sifatida belgilandi' : 'Asosiy belgisi olib tashlandi')
    },
    onError: (e) => toast.error(errMsg(e, "O'zgarishni saqlab bo'lmadi")),
  })
  const busySlug = patch.isPending ? patch.variables?.slug : null

  const setFilter = (fn) => { fn(); setPage(1) }

  function renderActions(p) {
    return (
      <div className="abl-acts">
        {p.status === 'published' && (
          <Link to={`/blog/${p.slug}`} className="icon-btn" title="Saytda ko'rish" aria-label="Saytda ko'rish"><Icon name="eye" size={15} /></Link>
        )}
        <button className={`icon-btn star ${p.is_featured ? 'on' : ''}`} disabled={busySlug === p.slug}
          title={p.is_featured ? 'Asosiy belgisini olib tashlash' : 'Asosiy maqola qilish'}
          aria-label={p.is_featured ? 'Asosiy belgisini olib tashlash' : 'Asosiy maqola qilish'} aria-pressed={!!p.is_featured}
          onClick={() => patch.mutate({ slug: p.slug, body: { is_featured: !p.is_featured } })}>
          <Icon name={p.is_featured ? 'starF' : 'star'} size={15} />
        </button>
        <Link to={`/admin-panel/blog/${p.slug}/edit`} className="icon-btn" title="Tahrirlash" aria-label="Tahrirlash"><Icon name="edit" size={15} /></Link>
        <button className="icon-btn danger" title="O'chirish" aria-label="O'chirish" onClick={() => setToDelete(p)}><Icon name="trash" size={15} /></button>
      </div>
    )
  }

  return (
    <DashLayout kind="admin">
      <style>{css}</style>
      <PageHead title="Blog"
        sub={isLoading ? 'Maqolalar va yangiliklar' : `${posts.length} ta maqola · ${published} tasi chop etilgan`}>
        <Link className="btn btn-primary" to="/admin-panel/blog/new">
          <Icon name="pen" size={15} /> Yangi maqola
        </Link>
      </PageHead>

      {isLoading ? (
        <LoadingBlock label="Maqolalar yuklanmoqda…" />
      ) : isError ? (
        <ErrorState title="Maqolalarni yuklab bo'lmadi" onRetry={refetch} />
      ) : posts.length === 0 ? (
        <div className="card abl-flat">
          <EmptyState icon="news" title="Hozircha maqolalar yo'q"
            sub="Birinchi blog maqolangizni yozing — u ommaviy Blog bo'limida ko'rinadi."
            action={<Link className="btn btn-primary btn-sm" to="/admin-panel/blog/new"><Icon name="pen" size={13} /> Yangi maqola</Link>} />
        </div>
      ) : (
        <>
          <StatStrip items={[
            { label: 'Jami maqola', value: posts.length, icon: 'news', tone: 'gray', onClick: () => setFilter(() => setStatus('')), active: !status },
            { label: 'Chop etilgan', value: published, icon: 'checkC', tone: 'green', onClick: () => setFilter(() => setStatus(status === 'published' ? '' : 'published')), active: status === 'published' },
            { label: 'Qoralama', value: drafts, icon: 'file', tone: 'amber', onClick: () => setFilter(() => setStatus(status === 'draft' ? '' : 'draft')), active: status === 'draft' },
            { label: "Jami ko'rishlar", value: views, icon: 'eye', tone: 'blue' },
          ]} />

          <FilterBar search={search} onSearch={v => setFilter(() => setSearch(v))}
            placeholder="Sarlavha yoki qisqa tavsif bo'yicha…" count={filtered.length}
            onClear={hasFilters ? () => setFilter(() => { setSearch(''); setStatus(''); setCategory('') }) : null}>
            {categories.length > 1 && (
              <select className="select" value={category} aria-label="Kategoriya bo'yicha filtr"
                onChange={e => setFilter(() => setCategory(e.target.value))}>
                <option value="">Barcha kategoriyalar</option>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            )}
          </FilterBar>

          {feature && cur === 1 && (
            <article className="abl-feature topo">
              <Cover p={feature} />
              <div className="abl-f-body">
                <span className="abl-f-tag"><Icon name="pin" size={11} /> Asosiy maqola</span>
                <Link to={`/admin-panel/blog/${feature.slug}/edit`} className="abl-f-title">{feature.title}</Link>
                {feature.excerpt && <p className="abl-f-ex">{feature.excerpt}</p>}
                <div className="abl-f-foot">
                  <Meta p={feature} />
                  {renderActions(feature)}
                </div>
              </div>
            </article>
          )}

          {rows.length === 0 ? (
            hasFilters ? (
              <div className="card abl-flat">
                <EmptyState small icon="search" title="Hech narsa topilmadi" sub="Filtr yoki qidiruvni o'zgartirib ko'ring." />
              </div>
            ) : null
          ) : (
            <div className="abl-list">
              {pageItems.map(p => {
                const isPub = p.status === 'published'
                return (
                  <div key={p.id} className={`abl-row ${isPub ? '' : 'draft'}`}>
                    <Cover p={p} className="abl-cover" />
                    <div className="abl-main">
                      <Link to={`/admin-panel/blog/${p.slug}/edit`} className="abl-title">{p.title}</Link>
                      {p.excerpt ? <div className="abl-ex">{p.excerpt}</div> : <div className="abl-gap" />}
                      <Meta p={p} />
                    </div>
                    <div className="abl-state">
                      <label className="switch" title={isPub ? 'Qoralamaga qaytarish' : 'Chop etish'}>
                        <input type="checkbox" checked={isPub} disabled={busySlug === p.slug}
                          aria-label={`"${p.title}" — chop etilgan`}
                          onChange={() => patch.mutate({ slug: p.slug, body: { status: isPub ? 'draft' : 'published' } })} />
                        <span />
                      </label>
                      <span className={`lbl ${isPub ? 'on' : ''}`}>{isPub ? 'Chop etilgan' : 'Qoralama'}</span>
                    </div>
                    {renderActions(p)}
                  </div>
                )
              })}
            </div>
          )}

          <Pagination page={cur} pageSize={PAGE_SIZE} total={rows.length} onChange={setPage} />
        </>
      )}

      <ConfirmModal open={!!toDelete} title="Maqolani o'chirish"
        text={toDelete ? `"${toDelete.title}" maqolasi barcha izohlari bilan birga butunlay o'chiriladi. Bu amalni ortga qaytarib bo'lmaydi.` : ''}
        busy={del.isPending}
        onConfirm={() => del.mutate(toDelete.slug)}
        onClose={() => setToDelete(null)} />
    </DashLayout>
  )
}
