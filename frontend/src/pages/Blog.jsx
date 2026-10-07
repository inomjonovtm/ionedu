import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import api, { absUrl } from '../api/client'
import Layout from '../components/Layout'
import Icon from '../components/Icon'
import Pagination from '../components/Pagination'
import PageHeader from '../components/PageHeader'

const PAGE_SIZE = 9

const css = `
  .bl-hero { padding: 40px 0 8px; }
  .bl-hero h1 { font-size: 38px; letter-spacing: -0.035em; }
  .bl-hero p { color: var(--text-3); font-size: 16px; margin-top: 8px; max-width: 560px; }

  .bl-chips { display: flex; gap: 8px; flex-wrap: wrap; margin: 22px 0 26px; }
  .bl-chip { padding: 7px 15px; border-radius: 999px; font-size: 13px; font-weight: 500;
    border: 1px solid var(--border); background: var(--white); color: var(--text-2); transition: all .15s; }
  .bl-chip:hover { border-color: #CFD3CE; color: var(--text); }
  .bl-chip.on { background: var(--ink); color: #fff; border-color: var(--ink); }

  .bl-feature { display: grid; grid-template-columns: 1.15fr 1fr; gap: 0; margin-bottom: 34px;
    border: 1px solid var(--border); border-radius: 20px; overflow: hidden; background: var(--white);
    transition: border-color .2s, box-shadow .2s, transform .2s; }
  .bl-feature:hover { border-color: #D8DCD7; box-shadow: var(--shadow-hover); transform: translateY(-3px); }
  .bl-feature-cover { aspect-ratio: auto; min-height: 320px; display: flex; align-items: center;
    justify-content: center; font-size: 92px; position: relative; overflow: hidden; }
  .bl-feature-cover img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
  .bl-feature-body { padding: 34px; display: flex; flex-direction: column; justify-content: center; }
  .bl-feature-body h2 { font-size: 27px; line-height: 1.18; letter-spacing: -0.03em; margin: 14px 0 12px; }
  .bl-feature-body p { color: var(--text-3); font-size: 15px; line-height: 1.6; }

  .bl-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
  .bl-card { background: var(--white); border: 1px solid var(--border); border-radius: var(--r-card);
    overflow: hidden; display: flex; flex-direction: column; transition: border-color .2s, box-shadow .2s, transform .2s; }
  .bl-card:hover { border-color: #D8DCD7; box-shadow: var(--shadow-hover); transform: translateY(-3px); }
  .bl-cover { aspect-ratio: 16/9; display: flex; align-items: center; justify-content: center;
    font-size: 46px; position: relative; overflow: hidden; }
  .bl-cover img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
  .bl-card-body { padding: 16px 18px 18px; display: flex; flex-direction: column; gap: 9px; flex: 1; }
  .bl-cat { font-family: var(--font-mono); font-size: 10.5px; letter-spacing: .1em; text-transform: uppercase;
    font-weight: 600; color: var(--green-700); }
  .bl-card h3 { font-size: 17px; line-height: 1.32; letter-spacing: -0.02em; }
  .bl-excerpt { font-size: 13.5px; color: var(--text-3); line-height: 1.55; flex: 1; }
  .bl-meta { display: flex; align-items: center; gap: 8px; font-size: 12px; color: var(--text-4);
    padding-top: 11px; border-top: 1px solid var(--border-2); }
  .bl-meta .who { color: var(--text-2); font-weight: 500; }

  @media (max-width: 900px) {
    .bl-grid { grid-template-columns: repeat(2, 1fr); }
    .bl-feature { grid-template-columns: 1fr; }
    .bl-feature-cover { min-height: 200px; font-size: 64px; }
  }
  @media (max-width: 600px) {
    .bl-grid { grid-template-columns: 1fr; }
    .bl-hero h1 { font-size: 30px; }
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

function Cover({ post, className }) {
  const cls = COLOR_CLASS[post.cover_color] || 'thumb-green'
  return (
    <div className={`${className} ${post.cover ? '' : cls}`}>
      {post.cover ? <img src={absUrl(post.cover)} alt="" /> : <span>{post.cover_emoji || '📝'}</span>}
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

  return (
    <Layout>
      <style>{css}</style>
      <div className="container" style={{ paddingBottom: 90 }}>
        <PageHeader eyebrow="Blog" title="Maqolalar va yangiliklar"
          subtitle="Ta'lim, geografiya va IonEdu yangiliklari haqida foydali maqolalar." />

        {categories.length > 1 && (
          <div className="bl-chips">
            {categories.map(c => (
              <button key={c} className={`bl-chip ${cat === c ? 'on' : ''}`} onClick={() => setCat(c)}>
                {c === 'all' ? 'Barchasi' : c}
              </button>
            ))}
          </div>
        )}

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
              <Link to={`/blog/${featured.slug}`} className="bl-feature">
                <Cover post={featured} className="bl-feature-cover" />
                <div className="bl-feature-body">
                  <span className="bl-cat">{featured.category}</span>
                  <h2>{featured.title}</h2>
                  <p>{featured.excerpt}</p>
                  <div className="bl-meta" style={{ marginTop: 16, borderTop: 'none', padding: 0 }}>
                    <span className="who">{featured.author?.display_name || 'IonEdu'}</span>
                    <span>·</span><span>{fmtDate(featured.published_at || featured.created_at)}</span>
                    <span>·</span><span>{featured.read_minutes} daq o‘qish</span>
                  </div>
                </div>
              </Link>
            )}

            {rest.length > 0 && (
              <div className="bl-grid">
                {rest.map(p => (
                  <Link to={`/blog/${p.slug}`} className="bl-card" key={p.id}>
                    <Cover post={p} className="bl-cover" />
                    <div className="bl-card-body">
                      <span className="bl-cat">{p.category}</span>
                      <h3>{p.title}</h3>
                      <p className="bl-excerpt">{p.excerpt}</p>
                      <div className="bl-meta">
                        <span className="who">{p.author?.display_name || 'IonEdu'}</span>
                        <span>·</span><span>{fmtDate(p.published_at || p.created_at)}</span>
                        <span style={{ marginLeft: 'auto', display: 'inline-flex', gap: 4, alignItems: 'center' }}>
                          <Icon name="eye" size={13} /> {p.views}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
            <Pagination page={page} pageSize={PAGE_SIZE} total={allRest.length} onChange={setPage} />
          </>
        )}
      </div>
    </Layout>
  )
}
