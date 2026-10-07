import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import api, { absUrl } from '../api/client'
import Layout from '../components/Layout'
import Icon from '../components/Icon'
import { useAuth } from '../store/auth'
import { sanitizeHtml } from '../api/richText'

const css = `
  .ba-wrap { max-width: 760px; margin: 0 auto; padding: 30px 20px 100px; }
  .ba-back { display: inline-flex; align-items: center; gap: 6px; font-size: 13.5px;
    color: var(--text-3); margin-bottom: 22px; transition: color .15s; }
  .ba-back:hover { color: var(--text); }
  .ba-cat { font-family: var(--font-mono); font-size: 11px; letter-spacing: .12em; text-transform: uppercase;
    font-weight: 600; color: var(--green-700); }
  .ba-title { font-size: 38px; line-height: 1.12; letter-spacing: -0.035em; margin: 12px 0 16px; }
  .ba-meta { display: flex; align-items: center; gap: 12px; padding-bottom: 22px;
    border-bottom: 1px solid var(--border-2); margin-bottom: 26px; flex-wrap: wrap; }
  .ba-author { display: flex; align-items: center; gap: 10px; }
  .ba-author .av { width: 40px; height: 40px; border-radius: 999px; overflow: hidden;
    background: var(--green-100); color: var(--green-800); display: flex; align-items: center;
    justify-content: center; font-weight: 650; font-size: 14px; font-family: var(--font-display); }
  .ba-author .av img { width: 100%; height: 100%; object-fit: cover; }
  .ba-author .nm { font-weight: 600; font-size: 14px; }
  .ba-author .sub { font-size: 12.5px; color: var(--text-4); }
  .ba-stat { display: inline-flex; align-items: center; gap: 5px; font-size: 13px; color: var(--text-4); }

  .ba-cover { border-radius: 18px; overflow: hidden; margin-bottom: 30px; aspect-ratio: 16/8;
    display: flex; align-items: center; justify-content: center; font-size: 96px; position: relative; }
  .ba-cover img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }

  .ba-lead { font-size: 18px; line-height: 1.6; color: var(--text-2); margin-bottom: 24px; font-weight: 450; }
  .ba-body { font-size: 16.5px; line-height: 1.75; color: var(--text); }
  .ba-body h2 { font-size: 26px; margin: 32px 0 12px; letter-spacing: -0.02em; }
  .ba-body h3 { font-size: 21px; margin: 26px 0 10px; }
  .ba-body p { margin: 0 0 18px; }
  .ba-body ul, .ba-body ol { margin: 0 0 18px; padding-left: 24px; }
  .ba-body li { margin: 6px 0; }
  .ba-body img { border-radius: 14px; margin: 22px 0; }
  .ba-body a { color: var(--green-700); text-decoration: underline; text-underline-offset: 2px; }
  .ba-body blockquote { margin: 22px 0; padding: 4px 20px; border-left: 3px solid var(--green-300);
    color: var(--text-2); background: var(--bg-soft); border-radius: 0 10px 10px 0; }
  .ba-body pre { background: var(--bg-soft); border: 1px solid var(--border-2); border-radius: 12px;
    padding: 14px 18px; overflow-x: auto; font-family: var(--font-mono); font-size: 14px; margin: 0 0 18px; }
  .ba-body code { font-family: var(--font-mono); font-size: .9em; background: var(--bg-soft);
    border: 1px solid var(--border-2); border-radius: 6px; padding: 1px 6px; }

  @media (max-width: 600px) {
    .ba-title { font-size: 28px; }
    .ba-body { font-size: 16px; }
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

function timeAgo(iso) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (s < 60) return 'hozir'
  if (s < 3600) return `${Math.floor(s / 60)} daqiqa oldin`
  if (s < 86400) return `${Math.floor(s / 3600)} soat oldin`
  if (s < 604800) return `${Math.floor(s / 86400)} kun oldin`
  return fmtDate(iso)
}

const commentsCss = `
  .bc { margin-top: 44px; padding-top: 28px; border-top: 1px solid var(--border); }
  .bc h3 { font-size: 21px; letter-spacing: -0.02em; margin-bottom: 18px; display: flex; align-items: center; gap: 9px; }
  .bc h3 .n { font-family: var(--font-mono); font-size: 14px; color: var(--text-4); font-weight: 500; }
  .bc-form { display: flex; gap: 12px; margin-bottom: 26px; }
  .bc-av { width: 42px; height: 42px; border-radius: 999px; flex-shrink: 0; overflow: hidden;
    background: var(--green-100); color: var(--green-800); display: flex; align-items: center;
    justify-content: center; font-weight: 650; font-size: 14px; font-family: var(--font-display); }
  .bc-av img { width: 100%; height: 100%; object-fit: cover; }
  .bc-form-main { flex: 1; }
  .bc-form textarea { width: 100%; min-height: 70px; border: 1px solid var(--border); border-radius: 14px;
    padding: 12px 14px; font-size: 14.5px; font-family: inherit; color: var(--text); background: var(--white);
    outline: none; resize: vertical; transition: border-color .15s, box-shadow .15s; }
  .bc-form textarea:focus { border-color: var(--green-600); box-shadow: var(--shadow-ring); }
  .bc-form-foot { display: flex; justify-content: flex-end; margin-top: 10px; }
  .bc-login { background: var(--bg-soft); border: 1px dashed var(--border); border-radius: 14px;
    padding: 18px; text-align: center; color: var(--text-3); font-size: 14px; margin-bottom: 26px; }
  .bc-login a { color: var(--green-700); font-weight: 600; }
  .bc-item { display: flex; gap: 12px; padding: 14px 0; border-bottom: 1px solid var(--border-2); }
  .bc-item:last-child { border-bottom: none; }
  .bc-item-main { flex: 1; min-width: 0; }
  .bc-item-head { display: flex; align-items: center; gap: 8px; }
  .bc-item-head .who { font-weight: 640; font-size: 14px; }
  .bc-item-head .tm { font-size: 12.5px; color: var(--text-4); }
  .bc-item-head .del { margin-left: auto; width: 28px; height: 28px; border-radius: 999px; color: var(--text-4);
    display: inline-flex; align-items: center; justify-content: center; transition: all .15s; }
  .bc-item-head .del:hover { background: var(--red-50); color: var(--red-600); }
  .bc-item .tx { font-size: 14.5px; line-height: 1.55; color: var(--text-2); margin-top: 3px; word-break: break-word; }
  .bc-empty { text-align: center; color: var(--text-3); font-size: 14px; padding: 26px 0; }
`

function Comments({ slug }) {
  const { user } = useAuth()
  const qc = useQueryClient()
  const [text, setText] = useState('')
  const { data: list = [] } = useQuery({
    queryKey: ['blog-comments', slug],
    queryFn: () => api.get(`/blog/posts/${slug}/comments/`).then(r => r.data),
  })
  const add = useMutation({
    mutationFn: () => api.post(`/blog/posts/${slug}/comments/`, { content: text.trim() }),
    onSuccess: () => {
      setText('')
      qc.invalidateQueries({ queryKey: ['blog-comments', slug] })
      qc.invalidateQueries({ queryKey: ['blog', slug] })
      toast.success('Izoh qo‘shildi')
    },
    onError: () => toast.error('Izoh yuborilmadi'),
  })
  const del = useMutation({
    mutationFn: (id) => api.delete(`/blog/posts/${slug}/comments/${id}/`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['blog-comments', slug] }); qc.invalidateQueries({ queryKey: ['blog', slug] }) },
    onError: () => toast.error('O‘chirib bo‘lmadi'),
  })

  return (
    <section className="bc">
      <style>{commentsCss}</style>
      <h3>Izohlar {list.length > 0 && <span className="n">{list.length}</span>}</h3>

      {user ? (
        <form className="bc-form" onSubmit={e => { e.preventDefault(); if (text.trim()) add.mutate() }}>
          <div className="bc-av">{user.avatar ? <img src={absUrl(user.avatar)} alt="" /> : user.initials}</div>
          <div className="bc-form-main">
            <textarea value={text} onChange={e => setText(e.target.value)} placeholder="Fikringizni yozing…" />
            <div className="bc-form-foot">
              <button className="btn btn-primary btn-sm" disabled={!text.trim() || add.isPending}>
                {add.isPending ? 'Yuborilmoqda…' : 'Izoh qoldirish'}
              </button>
            </div>
          </div>
        </form>
      ) : (
        <div className="bc-login">Izoh qoldirish uchun <Link to="/auth/login">tizimga kiring</Link> yoki <Link to="/auth/register">ro‘yxatdan o‘ting</Link>.</div>
      )}

      {list.length === 0 ? (
        <div className="bc-empty">Hali izohlar yo‘q — birinchi bo‘lib fikr bildiring!</div>
      ) : list.map(c => {
        const canDel = user && (c.author?.id === user.id || user.role === 'admin')
        return (
          <div className="bc-item" key={c.id}>
            <div className="bc-av">{c.author?.avatar ? <img src={absUrl(c.author.avatar)} alt="" /> : (c.author?.initials || '?')}</div>
            <div className="bc-item-main">
              <div className="bc-item-head">
                <span className="who">{c.author?.display_name}</span>
                <span className="tm">· {timeAgo(c.created_at)}</span>
                {canDel && <button className="del" title="O'chirish" onClick={() => { if (confirm('Izohni o‘chirasizmi?')) del.mutate(c.id) }}><Icon name="trash" size={14} /></button>}
              </div>
              <div className="tx">{c.content}</div>
            </div>
          </div>
        )
      })}
    </section>
  )
}

export default function BlogDetail() {
  const { slug } = useParams()
  const { data: post, isLoading, isError } = useQuery({
    queryKey: ['blog', slug],
    queryFn: () => api.get(`/blog/posts/${slug}/`).then(r => r.data),
    retry: false,
  })

  const safeBody = useMemo(() => sanitizeHtml(post?.body || ''), [post?.body])

  if (isLoading) {
    return <Layout><div className="loading-state"><span className="spinner" /> Yuklanmoqda…</div></Layout>
  }
  if (isError || !post) {
    return (
      <Layout>
        <div className="empty-state" style={{ padding: '90px 24px' }}>
          <div className="es-ico"><Icon name="news" size={22} /></div>
          <div className="es-title">Maqola topilmadi</div>
          <Link to="/blog" className="btn btn-secondary" style={{ marginTop: 14 }}>Blogga qaytish</Link>
        </div>
      </Layout>
    )
  }

  const cls = COLOR_CLASS[post.cover_color] || 'thumb-green'

  return (
    <Layout>
      <style>{css}</style>
      <article className="ba-wrap">
        <Link to="/blog" className="ba-back"><Icon name="arrowL" size={15} /> Barcha maqolalar</Link>

        <span className="ba-cat">{post.category}</span>
        <h1 className="ba-title">{post.title}</h1>

        <div className="ba-meta">
          <div className="ba-author">
            <div className="av">
              {post.author?.avatar ? <img src={absUrl(post.author.avatar)} alt="" /> : (post.author?.initials || 'IE')}
            </div>
            <div>
              <div className="nm">{post.author?.display_name || 'IonEdu jamoasi'}</div>
              <div className="sub">{fmtDate(post.published_at || post.created_at)}</div>
            </div>
          </div>
          <span className="ba-stat"><Icon name="clock" size={14} /> {post.read_minutes} daq o‘qish</span>
          <span className="ba-stat"><Icon name="eye" size={14} /> {post.views} ko‘rish</span>
          {post.comment_count > 0 && <span className="ba-stat"><Icon name="comment" size={14} /> {post.comment_count} izoh</span>}
          {post.status === 'draft' && <span className="badge badge-amber">Qoralama</span>}
        </div>

        <div className={`ba-cover ${post.cover ? '' : cls}`}>
          {post.cover ? <img src={absUrl(post.cover)} alt="" /> : <span>{post.cover_emoji || '📝'}</span>}
        </div>

        {post.excerpt && <p className="ba-lead">{post.excerpt}</p>}

        <div className="ba-body rte-content" dangerouslySetInnerHTML={{ __html: safeBody }} />

        <Comments slug={slug} />
      </article>
    </Layout>
  )
}
