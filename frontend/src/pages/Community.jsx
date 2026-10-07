import { useState, useRef, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import api, { absUrl } from '../api/client'
import { useAuth } from '../store/auth'
import Layout from '../components/Layout'
import Icon from '../components/Icon'

const css = `
  .xc-shell { max-width: 1180px; margin: 0 auto; padding: 0 22px 80px;
    display: grid; grid-template-columns: 244px minmax(0, 600px) 318px; gap: 28px; align-items: start; }
  .xc-rail { position: sticky; top: 84px; display: flex; flex-direction: column; gap: 14px; padding-top: 16px; }

  /* ===== Center timeline (X-style: one column, hairline dividers) ===== */
  .xc-feed { border-left: 1px solid var(--border); border-right: 1px solid var(--border);
    background: var(--white); min-height: calc(100vh - 68px); }
  .xc-head { position: sticky; top: 68px; z-index: 20; display: flex; align-items: center; justify-content: space-between;
    padding: 0 16px; height: 53px; background: color-mix(in srgb, var(--white) 82%, transparent);
    backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); border-bottom: 1px solid var(--border-2); }
  .xc-head h1 { font-size: 19px; font-weight: 740; letter-spacing: -0.02em; }
  .xc-sort { display: inline-flex; gap: 2px; }
  .xc-sort button { padding: 6px 12px; border-radius: 999px; font-size: 13px; font-weight: 540; color: var(--text-3);
    display: inline-flex; align-items: center; gap: 5px; transition: all .14s; }
  .xc-sort button:hover { background: var(--bg-soft); color: var(--text); }
  .xc-sort button.on { color: var(--text); }
  .xc-sort button.on .u { background: var(--green-600); }
  .xc-sort button .u { display: block; height: 3px; }

  /* ===== Composer (inline, X-style) ===== */
  .xc-composer { display: flex; gap: 12px; padding: 12px 16px 6px; border-bottom: 1px solid var(--border); }
  .xc-av { width: 42px; height: 42px; border-radius: 999px; flex-shrink: 0; overflow: hidden;
    background: var(--green-100); color: var(--green-800); display: flex; align-items: center;
    justify-content: center; font-weight: 650; font-size: 14px; font-family: var(--font-display); }
  .xc-av img { width: 100%; height: 100%; object-fit: cover; }
  .xc-av.official { background: var(--green-600); color: #fff; }
  .xc-comp-main { flex: 1; min-width: 0; }
  .xc-aud { display: inline-flex; align-items: center; gap: 5px; font-size: 12.5px; font-weight: 600;
    color: var(--green-700); padding: 3px 10px; border-radius: 999px; margin-bottom: 4px;
    box-shadow: inset 0 0 0 1px var(--green-100); cursor: default; }
  .xc-comp-main textarea { width: 100%; border: none; outline: none; resize: none; background: transparent;
    font-size: 19px; line-height: 1.4; color: var(--text); min-height: 30px; padding: 6px 0; font-family: inherit; }
  .xc-comp-main textarea::placeholder { color: var(--text-4); }
  .xc-preview { position: relative; margin-top: 8px; border-radius: 16px; overflow: hidden; border: 1px solid var(--border); }
  .xc-preview img { width: 100%; max-height: 320px; object-fit: cover; display: block; }
  .xc-preview button { position: absolute; top: 8px; right: 8px; width: 30px; height: 30px; border-radius: 999px;
    background: rgba(0,0,0,.65); color: #fff; display: flex; align-items: center; justify-content: center; }
  .xc-linkrow { margin-top: 8px; }
  .xc-comp-bar { display: flex; align-items: center; gap: 2px; margin-top: 6px; padding-top: 4px; }
  .xc-tool { width: 34px; height: 34px; border-radius: 999px; color: var(--green-600);
    display: inline-flex; align-items: center; justify-content: center; transition: background .15s; }
  .xc-tool:hover { background: var(--green-50); }
  .xc-tool.on { background: var(--green-50); }
  .xc-comp-spacer { flex: 1; }
  .xc-count { font-family: var(--font-mono); font-size: 12px; color: var(--text-4); margin-right: 10px; }
  .xc-off-chip { display: inline-flex; align-items: center; gap: 5px; font-size: 12px; color: var(--text-2);
    cursor: pointer; padding: 5px 10px; border-radius: 999px; border: 1px solid var(--border); user-select: none;
    margin-right: 8px; transition: all .14s; }
  .xc-off-chip.on { background: var(--green-50); color: var(--green-700); border-color: var(--green-200); }
  .xc-off-chip input { display: none; }
  .xc-post-btn { padding: 8px 20px; border-radius: 999px; font-size: 14px; font-weight: 640;
    background: var(--green-600); color: #fff; transition: background .15s; }
  .xc-post-btn:hover { background: var(--green-700); }
  .xc-post-btn:disabled { opacity: .45; cursor: not-allowed; }
  .xc-emoji-wrap { position: relative; }
  .xc-emoji-pop { position: absolute; bottom: 42px; left: 0; z-index: 30; background: var(--white);
    border: 1px solid var(--border); border-radius: 14px; box-shadow: var(--shadow-pop); padding: 8px;
    display: grid; grid-template-columns: repeat(6, 1fr); gap: 2px; width: 250px; animation: xcPop .15s ease-out; }
  .xc-emoji-pop button { width: 37px; height: 37px; border-radius: 9px; font-size: 20px; transition: background .12s; }
  .xc-emoji-pop button:hover { background: var(--bg-soft); }
  @keyframes xcPop { from { opacity: 0; transform: translateY(6px) scale(.97); } to { opacity: 1; transform: none; } }

  /* ===== Post (X-style row) ===== */
  .xc-post { display: flex; gap: 12px; padding: 12px 16px; border-bottom: 1px solid var(--border-2);
    transition: background .12s; cursor: default; }
  .xc-post:hover { background: var(--bg-soft); }
  .xc-post.official { background: var(--green-50); }
  .xc-post.official:hover { background: color-mix(in srgb, var(--green-50) 80%, var(--green-100)); }
  .xc-post-main { flex: 1; min-width: 0; }
  .xc-pinned { display: inline-flex; align-items: center; gap: 6px; font-size: 12.5px; font-weight: 600;
    color: var(--text-3); margin: 0 0 4px 2px; }
  .xc-post-head { display: flex; align-items: center; gap: 4px; line-height: 1.2; }
  .xc-name { font-weight: 700; font-size: 15px; color: var(--text); white-space: nowrap; max-width: 200px;
    overflow: hidden; text-overflow: ellipsis; }
  .xc-vf { color: var(--green-600); display: inline-flex; flex-shrink: 0; }
  .xc-chip { display: inline-flex; align-items: center; gap: 3px; font-size: 10px; font-weight: 700;
    letter-spacing: .03em; text-transform: uppercase; padding: 1px 7px; border-radius: 999px;
    background: var(--green-600); color: #fff; flex-shrink: 0; }
  .xc-handle { font-size: 14.5px; color: var(--text-4); white-space: nowrap; }
  .xc-handle.sep::before { content: '·'; margin: 0 5px; }
  .xc-menu { margin-left: auto; width: 32px; height: 32px; border-radius: 999px; color: var(--text-4);
    display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; transition: all .15s; }
  .xc-menu:hover { background: var(--green-50); color: var(--green-600); }
  .xc-menu.del:hover { background: var(--red-50); color: var(--red-600); }
  .xc-text { font-size: 15px; line-height: 1.45; color: var(--text); margin-top: 2px;
    white-space: pre-wrap; word-break: break-word; }
  .xc-text .tag { color: var(--green-700); }
  .xc-text a.lnk { color: var(--green-700); }
  .xc-media { margin-top: 10px; border-radius: 16px; overflow: hidden; border: 1px solid var(--border); }
  .xc-media img { width: 100%; max-height: 510px; object-fit: cover; display: block; }
  .xc-linkcard { display: flex; align-items: center; gap: 8px; margin-top: 10px; padding: 11px 14px;
    border: 1px solid var(--border); border-radius: 14px; font-size: 13px; color: var(--green-700); font-weight: 500; }
  .xc-linkcard span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

  .xc-actions { display: flex; align-items: center; justify-content: space-between; max-width: 320px; margin-top: 10px; }
  .xc-act { display: inline-flex; align-items: center; gap: 3px; color: var(--text-3); font-size: 13px;
    font-variant-numeric: tabular-nums; background: none; transition: color .15s; }
  .xc-act .ic { width: 34px; height: 34px; margin: -8px -5px; border-radius: 999px;
    display: flex; align-items: center; justify-content: center; transition: background .15s; }
  .xc-act.reply:hover { color: var(--green-700); } .xc-act.reply:hover .ic { background: var(--green-50); }
  .xc-act.share:hover { color: var(--green-700); } .xc-act.share:hover .ic { background: var(--green-50); }
  .xc-act.like:hover { color: #F91880; } .xc-act.like:hover .ic { background: rgba(249,24,128,.12); }
  .xc-act.like.on { color: #F91880; }
  .xc-act.like.on .hf { fill: #F91880; }

  /* ===== Replies ===== */
  .xc-replies { margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--border-2); }
  .xc-reply { display: flex; gap: 9px; padding: 6px 0; }
  .xc-reply .xc-av { width: 30px; height: 30px; font-size: 11px; }
  .xc-reply-b { min-width: 0; flex: 1; }
  .xc-reply-b .who { font-weight: 660; font-size: 13px; }
  .xc-reply-b .who .h { color: var(--text-4); font-weight: 400; margin-left: 5px; }
  .xc-reply-b .tx { font-size: 14px; line-height: 1.4; color: var(--text); margin-top: 1px; word-break: break-word; }
  .xc-reply-add { display: flex; gap: 9px; margin-top: 10px; align-items: center; }
  .xc-reply-add input { flex: 1; height: 38px; border-radius: 999px; border: 1px solid var(--border);
    background: var(--white); padding: 0 15px; font-size: 13.5px; color: var(--text); outline: none; }
  .xc-reply-add input:focus { border-color: var(--green-600); box-shadow: var(--shadow-ring); }

  .xc-login { padding: 28px 20px; text-align: center; color: var(--text-3); font-size: 14.5px;
    border-bottom: 1px solid var(--border); }
  .xc-login a { color: var(--green-700); font-weight: 600; }
  .xc-empty { padding: 56px 24px; text-align: center; }
  .xc-empty .es-ico { width: 44px; height: 44px; border-radius: 13px; background: var(--bg-soft); color: var(--text-4);
    box-shadow: inset 0 0 0 1px var(--border-2); display: flex; align-items: center; justify-content: center; margin: 0 auto 10px; }
  .xc-empty .t { font-size: 15px; font-weight: 640; }
  .xc-empty .s { font-size: 13.5px; color: var(--text-3); margin-top: 4px; }
  .xc-more { display: block; width: 100%; padding: 16px; text-align: center; color: var(--green-700);
    font-size: 14px; font-weight: 540; transition: background .12s; }
  .xc-more:hover { background: var(--bg-soft); }

  /* ===== Left nav ===== */
  .xc-brand { padding: 16px 14px; }
  .xc-brand .t { font-family: var(--font-display); font-weight: 700; font-size: 18px; letter-spacing: -0.03em;
    display: flex; align-items: center; gap: 9px; }
  .xc-brand .t .mk { width: 30px; height: 30px; border-radius: 9px; background: var(--green-600); color: #fff;
    display: flex; align-items: center; justify-content: center; }
  .xc-brand p { font-size: 12.5px; color: var(--text-3); margin-top: 9px; line-height: 1.5; }
  .xc-nav { display: flex; flex-direction: column; gap: 2px; }
  .xc-nav button { display: flex; align-items: center; gap: 14px; padding: 11px 16px; border-radius: 999px;
    font-size: 15px; font-weight: 500; color: var(--text-2); transition: all .14s; text-align: left; }
  .xc-nav button svg { color: var(--text-3); }
  .xc-nav button:hover { background: var(--bg-soft); }
  .xc-nav button.on { font-weight: 700; color: var(--text); }
  .xc-nav button.on svg { color: var(--green-600); }
  .xc-box { background: var(--bg-soft); border-radius: 16px; overflow: hidden; }
  .xc-box-h { padding: 13px 16px 6px; font-size: 15px; font-weight: 740; letter-spacing: -0.02em; }
  .xc-rules { padding: 4px 16px 14px; }
  .xc-rules li { display: flex; gap: 9px; font-size: 13px; color: var(--text-3); line-height: 1.5; padding: 5px 0; list-style: none; }
  .xc-rules li svg { color: var(--green-600); flex-shrink: 0; margin-top: 2px; }

  /* ===== Right rail ===== */
  .xc-search { position: relative; }
  .xc-search svg { position: absolute; left: 15px; top: 50%; transform: translateY(-50%); color: var(--text-4); }
  .xc-search input { width: 100%; height: 44px; border-radius: 999px; border: 1px solid transparent;
    background: var(--bg-soft); padding: 0 42px; font-size: 14px; color: var(--text); outline: none; transition: all .15s; }
  .xc-search input:focus { background: var(--white); border-color: var(--green-600); box-shadow: var(--shadow-ring); }
  .xc-search .clr { left: auto; right: 10px; width: 26px; height: 26px; display: flex; align-items: center;
    justify-content: center; border-radius: 999px; transform: translateY(-50%); }
  .xc-stat3 { display: grid; grid-template-columns: repeat(3, 1fr); padding: 6px 0 12px; }
  .xc-stat3 > div { text-align: center; }
  .xc-stat3 .v { font-family: var(--font-mono); font-size: 18px; font-weight: 600; letter-spacing: -0.03em; }
  .xc-stat3 .l { font-size: 11px; color: var(--text-3); margin-top: 3px; }
  .xc-follow { display: flex; align-items: center; gap: 11px; padding: 9px 16px; transition: background .14s; }
  .xc-follow:hover { background: color-mix(in srgb, var(--bg-soft) 60%, transparent); }
  .xc-follow .xc-av { width: 40px; height: 40px; font-size: 13px; }
  .xc-follow .nm { font-weight: 700; font-size: 13.5px; display: flex; align-items: center; gap: 4px; }
  .xc-follow .sp { font-size: 12px; color: var(--text-4); margin-top: 1px;
    overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 140px; }
  .xc-follow .go { margin-left: auto; padding: 6px 14px; border-radius: 999px; font-size: 12.5px; font-weight: 640;
    background: var(--ink); color: #fff; flex-shrink: 0; }
  .xc-topics { padding: 4px 0 8px; }
  .xc-topic { display: block; padding: 8px 16px; transition: background .12s; }
  .xc-topic:hover { background: color-mix(in srgb, var(--bg-soft) 60%, transparent); }
  .xc-topic .tg { font-size: 14px; font-weight: 640; color: var(--text); }
  .xc-topic .mt { font-size: 11.5px; color: var(--text-4); margin-top: 1px; }
  .xc-railfoot { font-size: 12px; color: var(--text-4); padding: 6px 8px; line-height: 1.8; }
  .xc-railfoot a:hover { color: var(--text-2); text-decoration: underline; }

  @media (max-width: 1100px) {
    .xc-shell { grid-template-columns: 70px minmax(0, 600px) 300px; }
    .xc-brand .t span:last-child, .xc-brand p { display: none; }
    .xc-nav button { justify-content: center; padding: 12px; gap: 0; }
    .xc-nav button span { display: none; }
    .xc-box { display: none; }
  }
  @media (max-width: 980px) {
    .xc-shell { grid-template-columns: 70px minmax(0, 1fr); }
    .xc-rail.right { display: none; }
  }
  @media (max-width: 700px) {
    .xc-shell { grid-template-columns: 1fr; padding: 0 0 70px; }
    .xc-rail.left { display: none; }
    .xc-feed { border-left: none; border-right: none; }
    .xc-head { top: 0; }
  }
`

const EMOJIS = ['😀', '😂', '😍', '🥳', '👍', '🙏', '🔥', '✨', '🎉', '❤️', '😎', '🤔',
  '🌍', '🗺️', '🧭', '📚', '🎓', '💡', '⭐', '✅', '📌', '🚀', '👏', '😊']

function timeAgo(iso) {
  const d = new Date(iso)
  const s = Math.floor((Date.now() - d.getTime()) / 1000)
  if (s < 60) return 'hozir'
  if (s < 3600) return `${Math.floor(s / 60)} daq`
  if (s < 86400) return `${Math.floor(s / 3600)} soat`
  if (s < 604800) return `${Math.floor(s / 86400)} kun`
  return d.toLocaleDateString('uz-UZ', { day: 'numeric', month: 'short' })
}

function renderText(text) {
  return String(text).split(/(\s+)/).map((p, i) => {
    if (/^#[\p{L}\d_]+$/u.test(p)) return <span key={i} className="tag">{p}</span>
    if (/^https?:\/\/\S+$/i.test(p)) {
      return <a key={i} className="lnk" href={p} target="_blank" rel="noopener noreferrer">{p.replace(/^https?:\/\//, '')}</a>
    }
    return p
  })
}

function Avatar({ user, cls = 'xc-av' }) {
  return <div className={cls}>{user?.avatar ? <img src={absUrl(user.avatar)} alt="" /> : (user?.initials || '??')}</div>
}
function OfficialAvatar({ cls = 'xc-av official' }) {
  return (
    <div className={cls} aria-hidden>
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><path d="M2 12h20" />
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
      </svg>
    </div>
  )
}

function Composer() {
  const { user } = useAuth()
  const qc = useQueryClient()
  const [text, setText] = useState('')
  const [link, setLink] = useState('')
  const [showLink, setShowLink] = useState(false)
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState('')
  const [official, setOfficial] = useState(false)
  const [showEmoji, setShowEmoji] = useState(false)
  const fileRef = useRef(null)
  const taRef = useRef(null)
  const isAdmin = user?.role === 'admin'
  const MAX = 2000

  const create = useMutation({
    mutationFn: () => {
      const fd = new FormData()
      fd.append('content', text.trim())
      if (link.trim()) fd.append('link', link.trim())
      if (file) fd.append('image', file)
      if (isAdmin && official) { fd.append('is_official', 'true'); fd.append('is_pinned', 'true') }
      return api.post('/community/posts/', fd)
    },
    onSuccess: () => {
      setText(''); setLink(''); setShowLink(false); setFile(null); setPreview(''); setOfficial(false); setShowEmoji(false)
      qc.invalidateQueries({ queryKey: ['community'] })
      toast.success(official ? 'IonEdu nomidan e’lon qilindi' : 'E’lon qilindi')
    },
    onError: () => toast.error('Xatolik yuz berdi'),
  })

  function autoGrow(el) { el.style.height = 'auto'; el.style.height = Math.min(el.scrollHeight, 320) + 'px' }
  function pickFile(e) {
    const f = e.target.files?.[0]; if (!f) return
    if (f.size > 8 * 1024 * 1024) { toast.error('Rasm 8MB dan kichik bo‘lsin'); return }
    setFile(f); setPreview(URL.createObjectURL(f))
  }
  function insertEmoji(em) {
    const ta = taRef.current
    const s = ta?.selectionStart ?? text.length
    setText(text.slice(0, s) + em + text.slice(ta?.selectionEnd ?? text.length))
    setShowEmoji(false)
    requestAnimationFrame(() => { ta?.focus(); if (ta) { ta.selectionStart = ta.selectionEnd = s + em.length; autoGrow(ta) } })
  }

  const over = text.length > MAX
  const can = (text.trim().length > 0 || file) && !over && !create.isPending

  return (
    <div className="xc-composer">
      {isAdmin && official ? <OfficialAvatar /> : <Avatar user={user} />}
      <div className="xc-comp-main">
        {isAdmin && official && <span className="xc-aud"><Icon name="verified" size={13} /> IonEdu rasmiy</span>}
        <textarea
          ref={taRef}
          value={text}
          onChange={e => { setText(e.target.value); autoGrow(e.target) }}
          placeholder="Nima gaplar?!"
          rows={1}
        />
        {preview && (
          <div className="xc-preview">
            <img src={preview} alt="" />
            <button onClick={() => { setFile(null); setPreview('') }} aria-label="O'chirish"><Icon name="x" size={16} /></button>
          </div>
        )}
        {showLink && (
          <div className="xc-linkrow"><input className="input" autoFocus value={link} onChange={e => setLink(e.target.value)} placeholder="https://havola..." /></div>
        )}
        <div className="xc-comp-bar">
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={pickFile} />
          <button className="xc-tool" onClick={() => fileRef.current?.click()} title="Rasm"><Icon name="image" size={19} /></button>
          <button className={`xc-tool ${showLink ? 'on' : ''}`} onClick={() => setShowLink(s => !s)} title="Havola"><Icon name="link" size={18} /></button>
          <div className="xc-emoji-wrap">
            <button className={`xc-tool ${showEmoji ? 'on' : ''}`} onClick={() => setShowEmoji(s => !s)} title="Emoji"><Icon name="sparkles" size={18} /></button>
            {showEmoji && <div className="xc-emoji-pop">{EMOJIS.map(em => <button key={em} type="button" onClick={() => insertEmoji(em)}>{em}</button>)}</div>}
          </div>
          <span className="xc-comp-spacer" />
          {isAdmin && (
            <label className={`xc-off-chip ${official ? 'on' : ''}`} title="IonEdu nomidan">
              <input type="checkbox" checked={official} onChange={e => setOfficial(e.target.checked)} />
              <Icon name="verified" size={13} /> Rasmiy
            </label>
          )}
          {text.length > 0 && <span className="xc-count" style={{ color: over ? 'var(--red-600)' : undefined }}>{MAX - text.length}</span>}
          <button className="xc-post-btn" disabled={!can} onClick={() => create.mutate()}>
            {create.isPending ? '...' : 'Post'}
          </button>
        </div>
      </div>
    </div>
  )
}

function Replies({ postId }) {
  const { user } = useAuth()
  const qc = useQueryClient()
  const [text, setText] = useState('')
  const { data: list = [] } = useQuery({
    queryKey: ['post-comments', postId],
    queryFn: () => api.get(`/community/posts/${postId}/comments/`).then(r => r.data),
  })
  const add = useMutation({
    mutationFn: () => api.post(`/community/posts/${postId}/comments/`, { content: text.trim() }),
    onSuccess: () => { setText(''); qc.invalidateQueries({ queryKey: ['post-comments', postId] }); qc.invalidateQueries({ queryKey: ['community'] }) },
    onError: () => toast.error('Izoh yuborilmadi'),
  })
  return (
    <div className="xc-replies">
      {list.map(c => (
        <div className="xc-reply" key={c.id}>
          <Avatar user={c.author} />
          <div className="xc-reply-b">
            <div className="who">{c.author?.display_name}<span className="h">@{(c.author?.username || c.author?.email || 'user').split('@')[0]}</span></div>
            <div className="tx">{c.content}</div>
          </div>
        </div>
      ))}
      {user ? (
        <form className="xc-reply-add" onSubmit={e => { e.preventDefault(); if (text.trim()) add.mutate() }}>
          <Avatar user={user} />
          <input value={text} onChange={e => setText(e.target.value)} placeholder="Javob yozing…" />
          <button className="btn btn-secondary btn-sm" disabled={!text.trim() || add.isPending}><Icon name="send" size={15} /></button>
        </form>
      ) : (
        <div className="text-sm text-muted" style={{ paddingTop: 4 }}>Javob yozish uchun <Link to="/auth/login" style={{ color: 'var(--green-700)', fontWeight: 600 }}>tizimga kiring</Link>.</div>
      )}
    </div>
  )
}

function Post({ post }) {
  const { user } = useAuth()
  const qc = useQueryClient()
  const [liked, setLiked] = useState(post.liked)
  const [likeCount, setLikeCount] = useState(post.like_count)
  const [openReplies, setOpenReplies] = useState(false)

  const like = useMutation({
    mutationFn: () => api.post(`/community/posts/${post.id}/like/`),
    onMutate: () => { setLiked(l => !l); setLikeCount(c => c + (liked ? -1 : 1)) },
    onError: () => { setLiked(post.liked); setLikeCount(post.like_count); toast.error('Saqlanmadi') },
    onSuccess: (r) => { setLiked(r.data.liked); setLikeCount(r.data.like_count) },
  })
  const del = useMutation({
    mutationFn: () => api.delete(`/community/posts/${post.id}/`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['community'] }); toast.success('O‘chirildi') },
    onError: () => toast.error('O‘chirib bo‘lmadi'),
  })
  function onLike() { if (!user) { toast.error('Avval tizimga kiring'); return } like.mutate() }
  function onShare() {
    const txt = `${post.is_official ? 'IonEdu' : post.author?.display_name}: ${post.content}`
    if (navigator.share) navigator.share({ text: txt }).catch(() => {})
    else { navigator.clipboard?.writeText(txt); toast.success('Nusxa olindi') }
  }
  const a = post.author || {}

  return (
    <article className={`xc-post ${post.is_official ? 'official' : ''}`}>
      {post.is_official ? <OfficialAvatar /> : <Avatar user={a} />}
      <div className="xc-post-main">
        {post.is_pinned && <div className="xc-pinned"><Icon name="pin" size={13} /> Mahkamlangan</div>}
        <div className="xc-post-head">
          <span className="xc-name">{post.is_official ? 'IonEdu' : (a.display_name || 'Foydalanuvchi')}</span>
          {(post.is_official || a.role === 'teacher') && <span className="xc-vf"><Icon name="verified" size={15} fill={post.is_official} /></span>}
          {post.is_official && <span className="xc-chip"><Icon name="sparkles" size={10} /> Rasmiy</span>}
          <span className="xc-handle">@{post.is_official ? 'ionedu' : (a.username || a.email || 'user').split('@')[0]}</span>
          <span className="xc-handle sep">{timeAgo(post.created_at)}</span>
          {post.can_delete && (
            <button className="xc-menu del" title="O'chirish" onClick={() => { if (confirm('Postni o‘chirasizmi?')) del.mutate() }}>
              <Icon name="trash" size={15} />
            </button>
          )}
        </div>
        <div className="xc-text">{renderText(post.content)}</div>
        {post.image && <div className="xc-media"><img src={absUrl(post.image)} alt="" /></div>}
        {post.link && (
          <a className="xc-linkcard" href={post.link} target="_blank" rel="noopener noreferrer">
            <Icon name="link" size={14} /> <span>{post.link.replace(/^https?:\/\//, '')}</span>
          </a>
        )}
        <div className="xc-actions">
          <button className="xc-act reply" onClick={() => setOpenReplies(o => !o)}>
            <span className="ic"><Icon name="comment" size={17} /></span>{post.comment_count > 0 && post.comment_count}
          </button>
          <button className={`xc-act like ${liked ? 'on' : ''}`} onClick={onLike}>
            <span className="ic"><Icon name="heart" size={17} className={liked ? 'hf' : ''} fill={liked} /></span>{likeCount > 0 && likeCount}
          </button>
          <button className="xc-act share" onClick={onShare}>
            <span className="ic"><Icon name="share" size={16} /></span>
          </button>
        </div>
        {openReplies && <Replies postId={post.id} />}
      </div>
    </article>
  )
}

const NAV = [
  { id: 'all', label: 'Barchasi', icon: 'layout' },
  { id: 'official', label: 'IonEdu rasmiy', icon: 'verified' },
  { id: 'mine', label: 'Mening postlarim', icon: 'user', auth: true },
]
const SUGGESTED = ['#geografiya', '#DTM', '#sayohat', '#tabiat', '#xarita', '#iqlim']

function RightRail({ posts, totalPosts, search, setSearch }) {
  const { data: stats = {} } = useQuery({ queryKey: ['home-stats'], queryFn: () => api.get('/stats/').then(r => r.data).catch(() => ({})) })
  const { data: teachers = [] } = useQuery({ queryKey: ['rail-teachers'], queryFn: () => api.get('/teachers/?page_size=6').then(r => r.data.results || r.data).catch(() => []) })
  const members = (stats.students || 0) + (stats.teachers || 0)
  const today = useMemo(() => { const t = new Date().toDateString(); return posts.filter(p => new Date(p.created_at).toDateString() === t).length }, [posts])
  const topics = useMemo(() => {
    const freq = {}
    posts.forEach(p => (p.content.match(/#[\p{L}\d_]+/gu) || []).forEach(h => { freq[h] = (freq[h] || 0) + 1 }))
    const f = Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 6)
    return f.length ? f : SUGGESTED.map(t => [t, 0])
  }, [posts])

  return (
    <aside className="xc-rail right">
      <div className="xc-search">
        <Icon name="search" size={17} />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Suhbatdan qidirish" />
        {search && <button className="clr" onClick={() => setSearch('')}><Icon name="x" size={15} /></button>}
      </div>

      <div className="xc-box">
        <div className="xc-box-h">Hamjamiyat</div>
        <div className="xc-stat3">
          <div><div className="v">{members > 0 ? members : '—'}</div><div className="l">A'zolar</div></div>
          <div><div className="v">{totalPosts}</div><div className="l">Postlar</div></div>
          <div><div className="v">{today}</div><div className="l">Bugun</div></div>
        </div>
      </div>

      {teachers.length > 0 && (
        <div className="xc-box">
          <div className="xc-box-h">Tavsiya etiladi</div>
          {teachers.slice(0, 3).map(t => (
            <div className="xc-follow" key={t.id}>
              <Avatar user={t} />
              <div style={{ minWidth: 0 }}>
                <div className="nm">{t.display_name}<Icon name="verified" size={13} style={{ color: 'var(--green-600)' }} /></div>
                <div className="sp">@{(t.username || t.email || 'user').split('@')[0]}</div>
              </div>
              <Link to={`/teachers/${t.id}`} className="go">Ko'rish</Link>
            </div>
          ))}
        </div>
      )}

      <div className="xc-box">
        <div className="xc-box-h">Mashhur mavzular</div>
        <div className="xc-topics">
          {topics.map(([t, n]) => (
            <button key={t} className="xc-topic" style={{ width: '100%', textAlign: 'left' }} onClick={() => setSearch(t)}>
              <div className="tg">{t}</div>
              <div className="mt">{n > 0 ? `${n} ta post` : 'Suhbat mavzusi'}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="xc-railfoot">
        <Link to="/about">Biz haqimizda</Link> · <Link to="/contact">Aloqa</Link> · <Link to="/blog">Blog</Link>
        <div>© {new Date().getFullYear()} IonEdu</div>
      </div>
    </aside>
  )
}

export default function Community() {
  const { user } = useAuth()
  const [mode, setMode] = useState('all')
  const [sort, setSort] = useState('new')
  const [search, setSearch] = useState('')

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useInfiniteQuery({
    queryKey: ['community', mode, sort, search],
    queryFn: ({ pageParam = 1 }) =>
      api.get('/community/posts/', {
        params: {
          page: pageParam,
          ...(mode === 'official' ? { filter: 'official' } : {}),
          ...(mode === 'mine' ? { filter: 'mine' } : {}),
          ...(sort === 'popular' ? { sort: 'popular' } : {}),
          ...(search.trim() ? { search: search.trim() } : {}),
        },
      }).then(r => r.data),
    getNextPageParam: (last, pages) => last.next ? pages.length + 1 : undefined,
    initialPageParam: 1,
  })

  const posts = data?.pages.flatMap(p => p.results || p) || []
  const totalPosts = data?.pages?.[0]?.count ?? posts.length
  const navItems = NAV.filter(n => !n.auth || user)
  const activeLabel = NAV.find(n => n.id === mode)?.label || 'Suhbat'

  return (
    <Layout>
      <style>{css}</style>
      <div className="xc-shell">
        {/* LEFT */}
        <aside className="xc-rail left">
          <div className="xc-brand">
            <div className="t"><span className="mk"><Icon name="comment" size={16} /></span> <span>Suhbat</span></div>
            <p>IonEdu hamjamiyati — yangiliklar va muloqot.</p>
          </div>
          <nav className="xc-nav">
            {navItems.map(n => (
              <button key={n.id} className={mode === n.id ? 'on' : ''} onClick={() => setMode(n.id)}>
                <Icon name={n.icon} size={20} /> <span>{n.label}</span>
              </button>
            ))}
          </nav>
          <div className="xc-box">
            <div className="xc-box-h">Qoidalar</div>
            <ul className="xc-rules">
              <li><Icon name="check" size={14} /> Hurmat bilan munosabatda bo'ling.</li>
              <li><Icon name="check" size={14} /> Foydali va mavzuga oid yozing.</li>
              <li><Icon name="check" size={14} /> Spam o'chiriladi.</li>
            </ul>
          </div>
        </aside>

        {/* CENTER */}
        <main className="xc-feed">
          <div className="xc-head">
            <h1>{activeLabel}</h1>
            <div className="xc-sort">
              <button className={sort === 'new' ? 'on' : ''} onClick={() => setSort('new')}>Yangi<span className="u" /></button>
              <button className={sort === 'popular' ? 'on' : ''} onClick={() => setSort('popular')}>Mashhur<span className="u" /></button>
            </div>
          </div>

          {user ? <Composer /> : (
            <div className="xc-login">Suhbatda qatnashish uchun <Link to="/auth/login">tizimga kiring</Link> yoki <Link to="/auth/register">ro‘yxatdan o‘ting</Link>.</div>
          )}

          {isLoading ? (
            <div className="loading-state"><span className="spinner" /> Yuklanmoqda…</div>
          ) : posts.length === 0 ? (
            <div className="xc-empty">
              <div className="es-ico"><Icon name="comment" size={22} /></div>
              <div className="t">{search ? 'Hech narsa topilmadi' : 'Hali postlar yo‘q'}</div>
              <div className="s">{search ? 'Boshqa so‘z bilan urinib ko‘ring.' : 'Birinchi bo‘lib fikr bildiring!'}</div>
            </div>
          ) : (
            <>
              {posts.map(p => <Post key={p.id} post={p} />)}
              {hasNextPage && (
                <button className="xc-more" onClick={() => fetchNextPage()} disabled={isFetchingNextPage}>
                  {isFetchingNextPage ? 'Yuklanmoqda…' : 'Yana ko‘rsatish'}
                </button>
              )}
            </>
          )}
        </main>

        {/* RIGHT */}
        <RightRail posts={posts} totalPosts={totalPosts} search={search} setSearch={setSearch} />
      </div>
    </Layout>
  )
}
