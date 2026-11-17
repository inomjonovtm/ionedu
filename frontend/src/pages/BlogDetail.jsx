import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import api, { absUrl } from '../api/client'
import Layout from '../components/Layout'
import Icon from '../components/Icon'
import Confirm from '../components/Confirm'
import { useAuth } from '../store/auth'
import { sanitizeHtml } from '../api/richText'

const css = `
  .ba-page { max-width: 1040px; margin: 0 auto; padding: 34px 28px 100px; }
  .ba-back { display: inline-flex; align-items: center; gap: 8px; height: 36px; padding: 0 14px 0 10px; border-radius: 999px;
    border: 1.5px solid var(--line); background: var(--white); font-size: 13px; font-weight: 700; color: var(--text);
    transition: transform .14s ease, box-shadow .14s ease; }
  .ba-min { min-width: 0; }
  .ba-back:hover { transform: translate(-1px, -1px); box-shadow: var(--hard-sm); }

  /* ── Headline block ── */
  .ba-head { margin: 26px 0 30px; max-width: 880px; }
  .ba-cat { display: inline-block; font-family: var(--font-mono); font-size: 11px; letter-spacing: .12em; text-transform: uppercase;
    font-weight: 700; color: #14213D; background: var(--sun); border: 1.5px solid var(--line); border-radius: 8px; padding: 3px 10px; transform: rotate(-1.5deg); }
  .ba-title { font-size: 58px; line-height: 1.02; letter-spacing: -0.045em; margin-top: 18px; overflow-wrap: anywhere; }
  .ba-lead { font-size: 20px; line-height: 1.55; color: var(--text-2); margin-top: 20px; font-weight: 500; max-width: 720px; }

  .ba-cover { border-radius: 28px; overflow: hidden; aspect-ratio: 21 / 9; border: 2px solid var(--line); box-shadow: var(--hard-lg);
    display: flex; align-items: center; justify-content: center; font-size: 110px; position: relative; }
  .ba-cover img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }

  /* ── Two columns: sticky fact rail + reading column ── */
  .ba-cols { display: grid; grid-template-columns: 220px minmax(0, 680px); gap: 56px; margin-top: 46px; align-items: start; }
  .ba-rail { position: sticky; top: 100px; }
  .ba-author { display: flex; align-items: center; gap: 12px; padding-bottom: 16px; border-bottom: 2px solid var(--line); }
  .ba-author .av { width: 48px; height: 48px; border-radius: 15px; overflow: hidden; flex-shrink: 0; border: 1.5px solid var(--line);
    background: var(--sun); color: #14213D; display: flex; align-items: center; justify-content: center;
    font-weight: 800; font-size: 15px; font-family: var(--font-display); }
  .ba-author .av img { width: 100%; height: 100%; object-fit: cover; }
  .ba-author small { display: block; font-family: var(--font-mono); font-size: 9.5px; font-weight: 600; letter-spacing: .12em; text-transform: uppercase; color: var(--text-4); }
  .ba-author .nm { font-weight: 700; font-size: 14.5px; line-height: 1.25; }
  .ba-facts { display: flex; flex-direction: column; }
  .ba-fact { display: flex; align-items: center; gap: 10px; padding: 12px 0; border-bottom: 1.5px dashed var(--border); font-size: 13.5px; font-weight: 600; color: var(--text-2); }
  .ba-fact svg { color: var(--text-3); flex-shrink: 0; }
  .ba-rail .badge { margin-top: 14px; }

  .ba-body { font-size: 17.5px; line-height: 1.78; color: var(--text); overflow-wrap: break-word; }
  .ba-body > p:first-child::first-letter { font-family: var(--font-display); font-weight: 800; font-size: 3.5em; float: left; line-height: .82; padding: 6px 10px 0 0; color: var(--text); }
  .ba-body h2 { font-size: 30px; margin: 40px 0 14px; letter-spacing: -0.035em; }
  .ba-body h3 { font-size: 23px; margin: 30px 0 10px; letter-spacing: -0.03em; }
  .ba-body p { margin: 0 0 20px; }
  .ba-body ul, .ba-body ol { margin: 0 0 20px; padding-left: 26px; }
  .ba-body li { margin: 7px 0; }
  .ba-body li::marker { color: var(--coral); font-weight: 700; }
  .ba-body img { border-radius: 18px; margin: 26px 0; border: 1.5px solid var(--line); }
  .ba-body a { color: var(--sea); font-weight: 600; text-decoration: underline; text-underline-offset: 3px; }
  .ba-body blockquote { margin: 28px 0; padding: 18px 22px; border: 1.5px solid var(--line); border-left-width: 8px; border-radius: 16px;
    background: var(--sun-soft); color: var(--text); font-size: 19px; font-weight: 600; line-height: 1.5; }
  .ba-body pre { background: var(--ink); color: #E8EEFF; border-radius: 16px; padding: 16px 18px; overflow-x: auto;
    font-family: var(--font-mono); font-size: 14px; margin: 0 0 20px; }
  .ba-body code { font-family: var(--font-mono); font-size: .88em; background: var(--bg-soft); border-radius: 6px; padding: 2px 6px; }
  .ba-body pre code { background: none; padding: 0; }

  .ba-end { display: flex; align-items: center; gap: 14px; margin-top: 40px; color: var(--text-4); }
  .ba-end::before, .ba-end::after { content: ''; flex: 1; border-top: 1.5px dashed var(--border); }

  @media (max-width: 900px) {
    .ba-cols { grid-template-columns: 1fr; gap: 26px; margin-top: 30px; }
    .ba-rail { position: static; display: flex; align-items: center; gap: 6px 18px; flex-wrap: wrap; padding-bottom: 16px; border-bottom: 2px solid var(--line); }
    .ba-author { border-bottom: none; padding-bottom: 0; margin-right: auto; }
    .ba-facts { flex-direction: row; flex-wrap: wrap; gap: 4px 16px; }
    .ba-fact { border-bottom: none; padding: 4px 0; font-size: 13px; }
    .ba-rail .badge { margin-top: 0; }
    .ba-title { font-size: 44px; }
  }
  @media (max-width: 640px) {
    .ba-page { padding: 22px 18px 80px; }
    .ba-title { font-size: 32px; }
    .ba-lead { font-size: 17px; }
    .ba-cover { aspect-ratio: 16 / 10; border-radius: 20px; box-shadow: var(--hard); font-size: 72px; }
    .ba-body { font-size: 16.5px; }
    .ba-body h2 { font-size: 25px; }
    .ba-body blockquote { font-size: 17px; padding: 14px 16px; }
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
  .bc { margin-top: 44px; }
  .bc-head { display: flex; align-items: center; gap: 12px; margin-bottom: 20px; }
  .bc-head h3 { font-size: 28px; letter-spacing: -0.04em; }
  .bc-head .n { font-family: var(--font-mono); font-size: 12px; font-weight: 700; background: var(--sun); color: #14213D; border-radius: 999px; padding: 2px 10px; }
  .bc-av { width: 42px; height: 42px; border-radius: 14px; flex-shrink: 0; overflow: hidden; border: 1.5px solid var(--line);
    background: #9DBDFF; color: #14213D; display: flex; align-items: center;
    justify-content: center; font-weight: 800; font-size: 14px; font-family: var(--font-display); }
  .bc-av img { width: 100%; height: 100%; object-fit: cover; }
  .bc-form { display: flex; gap: 12px; margin-bottom: 30px; padding: 16px; background: var(--white); border: 2px solid var(--line); border-radius: 22px; box-shadow: var(--hard); }
  .bc-form-main { flex: 1; min-width: 0; }
  .bc-form textarea { width: 100%; min-height: 76px; border: none; background: none; padding: 8px 2px; font-size: 15px; font-family: inherit;
    color: var(--text); outline: none; resize: vertical; line-height: 1.55; }
  .bc-form textarea::placeholder { color: var(--text-4); }
  .bc-form-foot { display: flex; justify-content: flex-end; padding-top: 10px; border-top: 1.5px dashed var(--border); }
  .bc-login { background: var(--bg-soft); border: 1.5px dashed var(--border); border-radius: 20px;
    padding: 20px; text-align: center; color: var(--text-3); font-size: 14.5px; margin-bottom: 30px; font-weight: 500; }
  .bc-login a { color: var(--text); font-weight: 700; text-decoration: underline; text-decoration-color: var(--sun); text-decoration-thickness: 3px; text-underline-offset: 3px; }
  .bc-list { display: flex; flex-direction: column; gap: 14px; }
  .bc-item { display: flex; gap: 12px; align-items: flex-start; }
  .bc-bubble { flex: 1; min-width: 0; background: var(--white); border: 1.5px solid var(--border); border-radius: 4px 18px 18px 18px; padding: 12px 16px 14px; }
  .bc-item-head { display: flex; align-items: center; gap: 8px; min-height: 28px; }
  .bc-item-head .who { font-weight: 700; font-size: 14px; }
  .bc-item-head .tm { font-family: var(--font-mono); font-size: 11px; color: var(--text-4); }
  .bc-item-head .del { margin-left: auto; width: 28px; height: 28px; border-radius: 9px; color: var(--text-4);
    display: inline-flex; align-items: center; justify-content: center; transition: all .15s; }
  .bc-item-head .del:hover { background: var(--red-50); color: var(--red-600); }
  .bc-item .tx { font-size: 14.5px; line-height: 1.6; color: var(--text-2); margin-top: 2px; word-break: break-word; white-space: pre-line; }
  .bc-empty { text-align: center; color: var(--text-3); font-size: 14.5px; padding: 30px 16px; border: 1.5px dashed var(--border); border-radius: 20px; font-weight: 500; }
`

function Comments({ slug }) {
  const { user } = useAuth()
  const qc = useQueryClient()
  const [text, setText] = useState('')
  const [toDelete, setToDelete] = useState(null)
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
    onSettled: () => setToDelete(null),
  })

  return (
    <section className="bc">
      <style>{commentsCss}</style>
      <div className="bc-head">
        <h3>Izohlar</h3>
        {list.length > 0 && <span className="n">{list.length}</span>}
      </div>

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
      ) : (
        <div className="bc-list">
          {list.map(c => {
            const canDel = user && (c.author?.id === user.id || user.role === 'admin')
            return (
              <div className="bc-item" key={c.id}>
                <div className="bc-av">{c.author?.avatar ? <img src={absUrl(c.author.avatar)} alt="" /> : (c.author?.initials || '?')}</div>
                <div className="bc-bubble">
                  <div className="bc-item-head">
                    <span className="who">{c.author?.display_name}</span>
                    <span className="tm">{timeAgo(c.created_at)}</span>
                    {canDel && <button type="button" className="del" title="O'chirish" onClick={() => setToDelete(c)}><Icon name="trash" size={14} /></button>}
                  </div>
                  <div className="tx">{c.content}</div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {toDelete && (
        <Confirm
          danger
          title="Izoh o‘chirilsinmi?"
          text="Izoh butunlay o‘chiriladi. Bu amalni ortga qaytarib bo‘lmaydi."
          confirmLabel="O‘chirish"
          busy={del.isPending}
          onConfirm={() => del.mutate(toDelete.id)}
          onClose={() => setToDelete(null)}
        />
      )}
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
        <div className="empty-state">
          <div className="es-ico"><Icon name="news" size={22} /></div>
          <div className="es-title">Maqola topilmadi</div>
          <div className="es-sub">Havola eskirgan yoki maqola olib tashlangan bo‘lishi mumkin.</div>
          <Link to="/blog" className="btn btn-secondary">Blogga qaytish</Link>
        </div>
      </Layout>
    )
  }

  const cls = COLOR_CLASS[post.cover_color] || 'thumb-green'

  return (
    <Layout>
      <style>{css}</style>
      <article className="ba-page">
        <Link to="/blog" className="ba-back"><Icon name="arrowL" size={15} /> Barcha maqolalar</Link>

        <header className="ba-head fade-up">
          {post.category && <span className="ba-cat">{post.category}</span>}
          <h1 className="ba-title">{post.title}</h1>
          {post.excerpt && <p className="ba-lead">{post.excerpt}</p>}
        </header>

        <div className={`ba-cover fade-up-d1 ${post.cover ? '' : cls}`}>
          {post.cover ? <img src={absUrl(post.cover)} alt="" /> : <span>{post.cover_emoji || '📝'}</span>}
        </div>

        <div className="ba-cols">
          <aside className="ba-rail">
            <div className="ba-author">
              <div className="av">
                {post.author?.avatar ? <img src={absUrl(post.author.avatar)} alt="" /> : (post.author?.initials || 'IE')}
              </div>
              <div className="ba-min">
                <small>Muallif</small>
                <div className="nm">{post.author?.display_name || 'Ionedu jamoasi'}</div>
              </div>
            </div>
            <div className="ba-facts">
              <span className="ba-fact"><Icon name="calendar" size={15} /> {fmtDate(post.published_at || post.created_at)}</span>
              <span className="ba-fact"><Icon name="clock" size={15} /> {post.read_minutes} daq o‘qish</span>
              <span className="ba-fact"><Icon name="eye" size={15} /> {post.views} ko‘rish</span>
              {post.comment_count > 0 && <span className="ba-fact"><Icon name="comment" size={15} /> {post.comment_count} izoh</span>}
            </div>
            {post.status === 'draft' && <span className="badge badge-amber">Qoralama</span>}
          </aside>

          <div className="ba-min">
            <div className="ba-body rte-content" dangerouslySetInnerHTML={{ __html: safeBody }} />
            <div className="ba-end"><Icon name="compass" size={18} /></div>
            <Comments slug={slug} />
          </div>
        </div>
      </article>
    </Layout>
  )
}
