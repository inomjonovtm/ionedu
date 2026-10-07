import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import api, { absUrl } from '../../api/client'
import DashLayout from '../../components/DashLayout'
import Icon from '../../components/Icon'
import Pagination from '../../components/Pagination'
import { PageHead, Panel, EmptyState } from '../../components/Dash'

const PAGE_SIZE = 12

export default function AdminBlog() {
  const qc = useQueryClient()
  const nav = useNavigate()
  const [page, setPage] = useState(1)

  const { data } = useQuery({
    queryKey: ['admin-blog'],
    queryFn: () => api.get('/blog/posts/', { params: { manage: 1, page_size: 500 } }).then(r => r.data.results || r.data),
  })
  const posts = data || []
  const published = posts.filter(p => p.status === 'published').length
  const pageItems = posts.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const del = useMutation({
    mutationFn: (slug) => api.delete(`/blog/posts/${slug}/`),
    onSuccess: () => { qc.invalidateQueries(['admin-blog']); qc.invalidateQueries(['blog-list']); toast.success("O'chirildi") },
  })

  return (
    <DashLayout kind="admin">
      <PageHead title="Blog" sub={`${posts.length} ta maqola · ${published} ta chop etilgan`}>
        <Link className="btn btn-primary" to="/admin-panel/blog/new">
          <Icon name="plus" size={15} /> Yangi maqola
        </Link>
      </PageHead>

      <Panel title="Barcha maqolalar" count={posts.length}>
        {posts.length === 0 ? (
          <EmptyState icon="news" title="Hozircha maqolalar yo'q"
            sub="Birinchi blog maqolangizni yozing — u ommaviy Blog bo'limida ko'rinadi."
            action={<Link className="btn btn-primary btn-sm" to="/admin-panel/blog/new"><Icon name="plus" size={13} /> Yangi maqola</Link>} />
        ) : (
          <table className="table">
            <thead><tr><th>Maqola</th><th>Kategoriya</th><th>Holat</th><th>Ko'rishlar</th><th></th></tr></thead>
            <tbody>
              {pageItems.map(p => (
                <tr key={p.id} className="hoverable" style={{ cursor: 'pointer' }}
                  onClick={() => nav(`/admin-panel/blog/${p.slug}/edit`)}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div className={`thumb thumb-${p.cover_color}`} style={{ width: 44, height: 32, fontSize: 18, borderRadius: 8, flexShrink: 0, aspectRatio: 'auto' }}>
                        {p.cover ? <img src={absUrl(p.cover)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span>{p.cover_emoji}</span>}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <strong style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          {p.title}
                          {p.is_featured && <span className="badge badge-green" title="Asosiy"><Icon name="star" size={10} fill /></span>}
                        </strong>
                        <div className="text-xs text-muted">{p.excerpt?.slice(0, 64)}</div>
                      </div>
                    </div>
                  </td>
                  <td><span className="badge badge-gray">{p.category}</span></td>
                  <td>
                    {p.status === 'published'
                      ? <span className="badge badge-green">Chop etilgan</span>
                      : <span className="badge badge-amber">Qoralama</span>}
                  </td>
                  <td className="text-sm text-muted">{p.views}</td>
                  <td onClick={e => e.stopPropagation()}>
                    <div className="row-actions" style={{ opacity: 1 }}>
                      {p.status === 'published' && (
                        <Link to={`/blog/${p.slug}`} className="icon-btn" title="Ko'rish"><Icon name="eye" size={15} /></Link>
                      )}
                      <Link to={`/admin-panel/blog/${p.slug}/edit`} className="icon-btn" title="Tahrirlash"><Icon name="edit" size={15} /></Link>
                      <button className="icon-btn" onClick={() => { if (confirm("O'chirilsinmi?")) del.mutate(p.slug) }} title="O'chirish"><Icon name="trash" size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Panel>

      <Pagination page={page} pageSize={PAGE_SIZE} total={posts.length} onChange={setPage} />
    </DashLayout>
  )
}
