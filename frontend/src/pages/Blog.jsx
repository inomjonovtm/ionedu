import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import api, { absUrl } from '../api/client'
import Layout from '../components/Layout'
import Icon from '../components/Icon'
import Pagination from '../components/Pagination'

const PAGE_SIZE = 9

const css = `
  .bl-min { min-width: 0; }
  .bl-grow { flex: 1; }
  .bl-page { padding-bottom: 90px; }

  /* ── Masthead ── */
  .bl-mast { padding: 54px 0 0; }
  .bl-mast-row { display: flex; align-items: flex-end; justify-content: space-between; gap: 24px; flex-wrap: wrap; margin-top: 18px; }
  .bl-mast h1 { font-size: 72px; line-height: .95; letter-spacing: -0.05em; }
  .bl-mast p { font-size: 16px; color: var(--text-3); max-width: 340px; line-height: 1.55; padding-bottom: 6px; }
  .bl-strip {
    display: flex; align-items: center; gap: 14px; flex-wrap: wrap; margin: 26px 0 30px; padding: 12px 0;
    border-top: 2px solid var(--line); border-bottom: 1.5px dashed var(--border);
  }
  .bl-strip .issue { font-family: var(--font-mono); font-size: 11px; font-weight: 600; letter-spacing: .1em; text-transform: uppercase; color: var(--text-3); white-space: nowrap; }
  .bl-chips { display: flex; gap: 8px; flex-wrap: wrap; margin-left: auto; }

  /* ── Front page: feature + "latest" rail ── */
  .bl-front { display: grid; grid-template-columns: 1.7fr 1fr; gap: 40px; align-items: start; margin-bottom: 52px; }
  .bl-front.solo { grid-template-columns: 1fr; }
  .bl-feature { display: block; min-width: 0; }
  .bl-feature-cover {
    aspect-ratio: 16 / 9; border-radius: 26px; border: 2px solid var(--line); box-shadow: var(--hard-lg);
    display: flex; align-items: center; justify-content: center; font-size: 110px; position: relative; overflow: hidden;
    transition: transform .18s ease;
  }
  .bl-front.solo .bl-feature-cover { aspect-ratio: 21 / 9; }
  .bl-feature:hover .bl-feature-cover { transform: translate(-3px, -3px); }
  .bl-feature-cover img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
  .bl-stamp {
    position: absolute; left: 18px; top: 18px; z-index: 2; transform: rotate(-4deg);
    background: var(--sun); color: #14213D; border: 2px solid #14213D; border-radius: 12px; padding: 5px 12px;
    font-family: var(--font-mono); font-size: 11px; font-weight: 700; letter-spacing: .1em; text-transform: uppercase;
  }
  .bl-feature-body { padding: 26px 4px 0; }
  .bl-feature-body h2 { font-size: 42px; line-height: 1.04; letter-spacing: -0.04em; margin: 12px 0 14px; }
  .bl-feature:hover h2 { text-decoration: underline; text-decoration-thickness: 3px; text-underline-offset: 5px; text-decoration-color: var(--sun); }
  .bl-feature-body p { color: var(--text-2); font-size: 16.5px; line-height: 1.6; max-width: 620px; }

  .bl-cat { font-family: var(--font-mono); font-size: 10.5px; letter-spacing: .1em; text-transform: uppercase; font-weight: 700; color: var(--sea); }
  .bl-meta { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; font-size: 12.5px; color: var(--text-3); margin-top: 14px; }
  .bl-meta .who { color: var(--text); font-weight: 700; }
  .bl-meta .views { display: inline-flex; gap: 4px; align-items: center; }

  .bl-rail { min-width: 0; }
  .bl-rail-title { font-family: var(--font-mono); font-size: 11px; font-weight: 700; letter-spacing: .12em; text-transform: uppercase; color: var(--text-3); padding-bottom: 12px; border-bottom: 2px solid var(--line); }
  .bl-rail-item { display: grid; grid-template-columns: 44px 1fr; gap: 14px; padding: 18px 0; border-bottom: 1.5px dashed var(--border); }
  .bl-rail-item .no { font-family: var(--font-display); font-weight: 800; font-size: 30px; letter-spacing: -0.05em; line-height: 1; color: var(--text-4); transition: color .15s ease; }
  .bl-rail-item:hover .no { color: var(--coral); }
  .bl-rail-item h3 { font-size: 19px; line-height: 1.2; letter-spacing: -0.03em; margin-top: 5px; }
  .bl-rail-item:hover h3 { text-decoration: underline; text-underline-offset: 4px; text-decoration-thickness: 2px; }
  .bl-rail-item .bl-meta { margin-top: 8px; }

  /* ── Archive list ── */
  .bl-sec-head { display: flex; align-items: center; gap: 14px; margin-bottom: 20px; }
  .bl-sec-head h2 { font-size: 28px; letter-spacing: -0.04em; }
  .bl-sec-head .rule { flex: 1; border-top: 1.5px dashed var(--border); }
  .bl-list { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; }
  .bl-row {
    display: grid; grid-template-columns: 132px 1fr; gap: 18px; align-items: stretch;
    background: var(--white); border: 1.5px solid var(--border); border-radius: 22px; padding: 12px;
    transition: border-color .16s ease, box-shadow .16s ease, transform .16s ease;
  }
  .bl-row:hover { border-color: var(--line); box-shadow: var(--hard); transform: translate(-2px, -2px); }
  .bl-cover { border-radius: 14px; min-height: 132px; display: flex; align-items: center; justify-content: center; font-size: 44px; position: relative; overflow: hidden; }
  .bl-cover img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
  .bl-row-body { display: flex; flex-direction: column; min-width: 0; padding: 6px 6px 4px 0; }
  .bl-row h3 { font-size: 19px; line-height: 1.22; letter-spacing: -0.03em; margin-top: 6px; }
  .bl-excerpt { font-size: 13.5px; color: var(--text-3); line-height: 1.5; margin-top: 6px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
  .bl-row .bl-meta { margin-top: auto; padding-top: 10px; }
  .bl-row .bl-meta .views { margin-left: auto; }

  @media (max-width: 980px) {
    .bl-front { grid-template-columns: 1fr; gap: 30px; }
    .bl-mast h1 { font-size: 54px; }
  }
  @media (max-width: 768px) {
    .bl-mast { padding-top: 30px; }
    .bl-mast h1 { font-size: 40px; }
    .bl-strip { margin: 18px 0 22px; }
    .bl-chips { margin-left: 0; }
    .bl-feature-cover, .bl-front.solo .bl-feature-cover { aspect-ratio: 16 / 10; border-radius: 20px; box-shadow: var(--hard); font-size: 72px; }
    .bl-feature-body h2 { font-size: 28px; }
    .bl-feature-body p { font-size: 15px; }
    .bl-list { grid-template-columns: 1fr; }
    .bl-front { margin-bottom: 38px; }
  }
  @media (max-width: 460px) {
    .bl-row { grid-template-columns: 92px 1fr; gap: 12px; }
    .bl-cover { min-height: 92px; font-size: 32px; }
    .bl-row h3 { font-size: 16.5px; }
    .bl-excerpt { display: none; }
  }
`

const COLOR_CLASS = {
  blue: 'thumb-blue', green: 'thumb-green', amber: 'thumb-amber', rose: 'thumb-rose',
  teal: 'thumb-teal', violet: 'thumb-violet', slate: 'thumb-slate',
}

function fmtDate(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('uz-UZ', { day: 'numeric', month: 'long', year: 'numeric' })
}

function Cover({ post, className, children }) {
  const cls = COLOR_CLASS[post.cover_color] || 'thumb-green'
  return (
    <div className={`${className} ${post.cover ? '' : cls}`}>
      {post.cover ? <img src={absUrl(post.cover)} alt="" /> : <span>{post.cover_emoji || '📝'}</span>}
      {children}
    </div>
  )
}

export default function Blog() {
  const [cat, setCat] = useState('all')
  const [page, setPage] = useState(1)
  const { data: posts = [], isLoading } = useQuery({
    queryKey: ['blog-list'],
    queryFn: () => api.get('/blog/posts/', { params: { page_size: 500 } }).then(r => r.data.results || r.data),
  })

  useEffect(() => { setPage(1) }, [cat])

  const categories = ['all', ...Array.from(new Set(posts.map(p => p.category).filter(Boolean)))]
  const filtered = cat === 'all' ? posts : posts.filter(p => p.category === cat)
  const featured = filtered.find(p => p.is_featured) || filtered[0]
  const allRest = filtered.filter(p => p.id !== featured?.id)
  // Featured article sits on top of page 1; the rest of the grid is paginated.
  const rest = allRest.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  // On the first page the first three posts sit beside the feature as a numbered rail.
  const rail = page === 1 && featured ? rest.slice(0, 3) : []
  const list = rest.slice(rail.length)

  return (
    <Layout>
      <style>{css}</style>
      <div className="container bl-page">
        <header className="bl-mast">
          <span className="eyebrow">Blog</span>
          <div className="bl-mast-row">
            <h1 className="fade-up">Ionedu <span className="mark-sun">jurnali</span></h1>
            <p className="fade-up-d1">Ta'lim, geografiya va Ionedu yangiliklari haqida foydali maqolalar.</p>
          </div>
          <div className="bl-strip">
            <span className="issue">Maqolalar va yangiliklar · {filtered.length} ta</span>
            {categories.length > 1 && (
              <div className="bl-chips">
                {categories.map(c => (
                  <button key={c} className={`chip ${cat === c ? 'on' : ''}`} onClick={() => setCat(c)}>
                    {c === 'all' ? 'Barchasi' : c}
                  </button>
                ))}
              </div>
            )}
          </div>
        </header>

        {isLoading ? (
          <div className="loading-state"><span className="spinner" /> Yuklanmoqda…</div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="es-ico"><Icon name="news" size={22} /></div>
            <div className="es-title">Hozircha maqolalar yo‘q</div>
            <div className="es-sub">Tez orada bu yerda qiziqarli maqolalar paydo bo‘ladi.</div>
          </div>
        ) : (
          <>
            {featured && page === 1 && (
              <div className={`bl-front ${rail.length === 0 ? 'solo' : ''}`}>
                <Link to={`/blog/${featured.slug}`} className="bl-feature fade-up">
                  <Cover post={featured} className="bl-feature-cover">
                    <span className="bl-stamp">Bosh maqola</span>
                  </Cover>
                  <div className="bl-feature-body">
                    <span className="bl-cat">{featured.category}</span>
                    <h2>{featured.title}</h2>
                    <p>{featured.excerpt}</p>
                    <div className="bl-meta">
                      <span className="who">{featured.author?.display_name || 'Ionedu'}</span>
                      <span>·</span><span>{fmtDate(featured.published_at || featured.created_at)}</span>
                      <span>·</span><span>{featured.read_minutes} daq o‘qish</span>
                    </div>
                  </div>
                </Link>

                {rail.length > 0 && (
                  <aside className="bl-rail fade-up-d1">
                    <div className="bl-rail-title">Navbatdagi maqolalar</div>
                    {rail.map((p, i) => (
                      <Link to={`/blog/${p.slug}`} className="bl-rail-item" key={p.id}>
                        <span className="no">{String(i + 1).padStart(2, '0')}</span>
                        <div className="bl-min">
                          <span className="bl-cat">{p.category}</span>
                          <h3>{p.title}</h3>
                          <div className="bl-meta">
                            <span className="who">{p.author?.display_name || 'Ionedu'}</span>
                            <span>·</span><span>{fmtDate(p.published_at || p.created_at)}</span>
                            <span>·</span><span className="views"><Icon name="eye" size={13} /> {p.views}</span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </aside>
                )}
              </div>
            )}

            {list.length > 0 && (
              <>
                <div className="bl-sec-head">
                  <h2>{page === 1 ? 'Yana o‘qing' : 'Maqolalar'}</h2>
                  <span className="rule" />
                  <span className="coord">{page}-SAHIFA</span>
                </div>
                <div className="bl-list">
                  {list.map(p => (
                    <Link to={`/blog/${p.slug}`} className="bl-row" key={p.id}>
                      <Cover post={p} className="bl-cover" />
                      <div className="bl-row-body">
                        <span className="bl-cat">{p.category}</span>
                        <h3>{p.title}</h3>
                        <p className="bl-excerpt">{p.excerpt}</p>
                        <div className="bl-meta">
                          <span className="who">{p.author?.display_name || 'Ionedu'}</span>
                          <span>·</span><span>{fmtDate(p.published_at || p.created_at)}</span>
                          <span className="views"><Icon name="eye" size={13} /> {p.views}</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </>
            )}
            <Pagination page={page} pageSize={PAGE_SIZE} total={allRest.length} onChange={setPage} />
          </>
        )}
      </div>
    </Layout>
  )
}
