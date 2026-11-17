import { useState, useEffect, useMemo, useRef } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import api, { absUrl } from '../../api/client'
import DashLayout from '../../components/DashLayout'
import Icon from '../../components/Icon'
import RichTextEditor from '../../components/RichTextEditor'
import { PageHead } from '../../components/Dash'
import { ConfirmModal, ErrorState, LoadingBlock } from '../../components/PanelKit'

const COLORS = ['green', 'blue', 'amber', 'rose', 'teal', 'violet', 'slate']
const COLOR_NAMES = { green: 'Yashil', blue: "Ko'k", amber: 'Sariq', rose: 'Pushti', teal: 'Feruza', violet: 'Binafsha', slate: 'Kulrang' }
const EMOJIS = ['📝', '🌍', '📚', '🧭', '🏔️', '🌊', '🗺️', '💡', '🎓', '📰', '✨', '🔬', '⭐', '🚀']

const TITLE_MAX = 200
const EXCERPT_MAX = 300
const CATEGORY_MAX = 60

const EMPTY = {
  title: '', category: 'Umumiy', excerpt: '', body: '',
  cover_emoji: '📝', cover_color: 'green', status: 'draft',
  is_featured: false, read_minutes: '3',
}

const fromPost = (p) => ({
  title: p.title || '', category: p.category ?? '', excerpt: p.excerpt || '',
  body: p.body || '', cover_emoji: p.cover_emoji || '📝', cover_color: p.cover_color || 'green',
  status: p.status || 'draft', is_featured: !!p.is_featured, read_minutes: String(p.read_minutes ?? 3),
})

const countWords = (html) => {
  const text = String(html || '').replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').trim()
  return text ? text.split(/\s+/).length : 0
}

const css = `
  .abe-grid { display: grid; grid-template-columns: minmax(0, 1fr) 320px; gap: 22px; align-items: start; }

  .abe-sheet { background: var(--white); border: 1.5px solid var(--border); border-radius: var(--r-card); padding: 26px 28px 22px; min-width: 0; }
  .abe-kicker { display: flex; align-items: center; justify-content: space-between; gap: 10px; font-family: var(--font-mono); font-size: 10.5px; letter-spacing: 0.1em; text-transform: uppercase; color: var(--text-3); margin-bottom: 10px; }
  .abe-kicker .over { color: var(--red-600); }
  .abe-kicker.under { margin: 4px 0 0; }
  .abe-last { margin-bottom: 0; }
  .abe-title {
    width: 100%; border: none; outline: none; background: transparent; font-family: var(--font-display);
    font-size: 34px; font-weight: 800; letter-spacing: -0.04em; color: var(--text); line-height: 1.12;
  }
  .abe-title::placeholder, .abe-excerpt::placeholder { color: var(--text-4); }
  .abe-excerpt {
    width: 100%; border: none; outline: none; background: transparent; resize: none; font-family: inherit;
    font-size: 16px; line-height: 1.55; color: var(--text-2); margin-top: 12px;
  }
  .abe-fold { border-top: 1.5px dashed var(--border); margin: 16px 0 18px; }
  .abe-sheet .rte-area { max-height: 68vh; }
  .abe-count { display: flex; gap: 14px; flex-wrap: wrap; margin-top: 12px; font-family: var(--font-mono); font-size: 11px; color: var(--text-3); }

  .abe-side { position: sticky; top: 20px; display: flex; flex-direction: column; gap: 16px; min-width: 0; }

  .abe-pub {
    position: relative; overflow: hidden; background: var(--ink); color: #B7C0D8;
    border-radius: var(--r-card); padding: 18px; box-shadow: 4px 4px 0 var(--sun);
  }
  html[data-theme="dark"] .abe-pub { border: 1.5px solid var(--border); box-shadow: var(--hard); }
  .abe-pub::before { content: ''; position: absolute; inset: 0; background-image: var(--topo); background-size: 420px 290px; filter: invert(1); opacity: .4; pointer-events: none; }
  html[data-theme="dark"] .abe-pub::before { filter: none; }
  .abe-pub > * { position: relative; }
  .abe-pub .cap { font-family: var(--font-mono); font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase; color: var(--sun); }
  .abe-pub .st { display: flex; align-items: center; gap: 9px; margin-top: 10px; font-family: var(--font-display); font-size: 19px; font-weight: 700; letter-spacing: -0.02em; color: #fff; }
  .abe-pub .dot { width: 11px; height: 11px; border-radius: 999px; background: var(--sun); flex-shrink: 0; }
  .abe-pub .dot.live { background: var(--green-300); }
  .abe-pub .note { font-size: 12.5px; line-height: 1.5; margin-top: 5px; }
  .abe-pub .note a { color: #fff; text-decoration: underline; text-underline-offset: 3px; overflow-wrap: anywhere; }
  .abe-feat {
    display: flex; align-items: center; justify-content: space-between; gap: 12px; margin: 14px 0;
    padding: 12px 0; border-top: 1.5px dashed rgba(255,255,255,.16); border-bottom: 1.5px dashed rgba(255,255,255,.16);
    font-size: 13.5px; font-weight: 700; color: #fff; cursor: pointer;
  }
  .abe-feat small { display: block; font-size: 11.5px; font-weight: 500; color: #B7C0D8; margin-top: 1px; }
  .abe-feat .switch span { border-color: rgba(255,255,255,.55); background: rgba(255,255,255,.12); }
  .abe-feat .switch span::after { background: #fff; }
  .abe-feat .switch input:checked + span { background: var(--sun); border-color: var(--sun); }
  .abe-feat .switch input:checked + span::after { background: #14213D; }
  .abe-pub-acts { display: flex; flex-direction: column; gap: 9px; }
  .abe-pub .abe-ghost { background: transparent; color: #fff; border-color: rgba(255,255,255,.4); }
  .abe-pub .abe-ghost:hover { background: rgba(255,255,255,.1); box-shadow: none; }
  .abe-pub .btn-accent:hover { box-shadow: 4px 4px 0 rgba(0,0,0,.45); }

  .abe-card { background: var(--white); border: 1.5px solid var(--border); border-radius: var(--r-card); padding: 16px; }
  .abe-card-h { display: flex; align-items: center; gap: 8px; font-family: var(--font-mono); font-size: 10.5px; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; color: var(--text-3); margin-bottom: 12px; }

  .abe-cover { aspect-ratio: 16 / 9; border-radius: 14px; display: flex; align-items: center; justify-content: center; font-size: 46px; position: relative; overflow: hidden; border: 1.5px solid var(--line); }
  .abe-cover img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
  .abe-cover-acts { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 10px; }
  .abe-sub { font-size: 12px; font-weight: 700; color: var(--text-2); margin: 14px 0 7px; }
  .abe-emojis { display: grid; grid-template-columns: repeat(7, 1fr); gap: 5px; }
  .abe-em { aspect-ratio: 1; border-radius: 10px; font-size: 18px; border: 1.5px solid var(--border); background: var(--white); display: flex; align-items: center; justify-content: center; transition: background .12s ease, border-color .12s ease; }
  .abe-em:hover { background: var(--bg-soft); }
  .abe-em.on { background: var(--sun-soft); border-color: var(--line); }
  .abe-swatches { display: flex; flex-wrap: wrap; gap: 8px; }
  .abe-sw { width: 30px; height: 30px; border-radius: 10px; border: 1.5px solid transparent; cursor: pointer; }
  .abe-sw.on { border-color: var(--line); box-shadow: var(--hard-sm); }
  .abe-dim { opacity: .5; }

  .abe-mins { display: flex; gap: 8px; }
  .abe-mins .input { flex: 1; min-width: 0; }
  .abe-mins .btn { height: 46px; flex-shrink: 0; }

  .abe-mbar { display: none; }

  @media (max-width: 980px) {
    .abe-grid { grid-template-columns: 1fr; padding-bottom: 78px; }
    .abe-side { position: static; }
    .abe-sheet { padding: 20px 16px 18px; }
    .abe-title { font-size: 26px; }
    .abe-pub-acts { display: none; }
    .abe-feat { margin-bottom: 0; border-bottom: none; padding-bottom: 0; }
    .abe-mbar {
      display: flex; gap: 8px; position: fixed; left: 0; right: 0; bottom: 0; z-index: 40;
      padding: 10px 14px calc(10px + env(safe-area-inset-bottom, 0px));
      background: var(--paper); border-top: 1.5px solid var(--border);
    }
    .abe-mbar .btn { flex: 1; min-width: 0; padding: 0 10px; }
  }
`

export default function AdminBlogEditor() {
  const { slug } = useParams()
  const editing = !!slug
  const nav = useNavigate()
  const qc = useQueryClient()
  const [form, setForm] = useState(EMPTY)
  const [cover, setCover] = useState(null)
  const [coverPreview, setCoverPreview] = useState('')
  const [dropCover, setDropCover] = useState(false)   // remove the already-uploaded cover on save
  const [leaveAsk, setLeaveAsk] = useState(false)
  const titleRef = useRef(null)
  const coverRef = useRef(null)

  const { data: existing, isLoading, isError, refetch } = useQuery({
    queryKey: ['blog-edit', slug],
    queryFn: () => api.get(`/blog/posts/${slug}/`).then(r => r.data),
    enabled: editing,
    // Never re-hydrate the form behind the author's back (a reconnect refetch would wipe unsaved text),
    // and never show a stale cached copy when the editor is reopened.
    refetchOnReconnect: false,
    gcTime: 0,
  })

  useEffect(() => {
    if (existing) setForm(fromPost(existing))
  }, [existing])

  // Free the object URL of a replaced / discarded cover preview.
  useEffect(() => () => { if (coverPreview) URL.revokeObjectURL(coverPreview) }, [coverPreview])

  const baseline = useMemo(() => JSON.stringify(existing ? fromPost(existing) : EMPTY), [existing])
  const dirty = JSON.stringify(form) !== baseline || !!cover || dropCover

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  function pickCover(f) {
    if (!f) return
    if (!f.type.startsWith('image/')) { toast.error('Muqova uchun rasm fayli tanlang (JPG, PNG, WEBP)'); return }
    setCover(f)
    setCoverPreview(URL.createObjectURL(f))
    setDropCover(false)
  }
  function clearCover() {
    setCover(null)
    setCoverPreview('')
    if (existing?.cover) setDropCover(true)
  }

  // Inline image upload for the rich-text body (multiple images supported).
  async function uploadInline(file) {
    const fd = new FormData()
    fd.append('image', file)
    try {
      const { data } = await api.post('/blog/upload-image/', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      return data.url
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Rasm yuklanmadi')
      throw e
    }
  }

  const save = useMutation({
    mutationFn: (status) => {
      const mins = Math.min(600, Math.max(1, Math.round(Number(form.read_minutes)) || 3))
      const payload = {
        ...form,
        title: form.title.trim(),
        category: form.category.trim(),
        status: status || form.status,
        read_minutes: mins,
      }
      const fd = new FormData()
      Object.entries(payload).forEach(([k, v]) => {
        fd.append(k, k === 'is_featured' ? (v ? 'true' : 'false') : v)
      })
      if (cover) fd.append('cover', cover)
      else if (dropCover) fd.append('cover', '')
      const headers = { 'Content-Type': 'multipart/form-data' }
      return editing
        ? api.patch(`/blog/posts/${slug}/`, fd, { headers })
        : api.post('/blog/posts/', fd, { headers })
    },
    onSuccess: (_r, status) => {
      qc.invalidateQueries({ queryKey: ['admin-blog'] })
      qc.invalidateQueries({ queryKey: ['blog-list'] })
      if (editing) {
        qc.invalidateQueries({ queryKey: ['blog', slug] })
        qc.removeQueries({ queryKey: ['blog-edit', slug] })
      }
      toast.success(status === 'published'
        ? (wasPublished ? 'Maqola yangilandi' : 'Maqola chop etildi')
        : 'Qoralama saqlandi')
      nav('/admin-panel/blog')
    },
    onError: (e) => {
      const d = e.response?.data
      const msg = typeof d === 'object' && d ? (d.detail || Object.values(d).flat()[0] || JSON.stringify(d)) : 'Saqlashda xatolik yuz berdi'
      toast.error(String(msg).slice(0, 200))
    },
  })

  // Warn before a tab close / reload throws away unsaved writing.
  const guard = dirty && !save.isPending && !save.isSuccess
  useEffect(() => {
    if (!guard) return undefined
    const h = (e) => { e.preventDefault(); e.returnValue = '' }
    window.addEventListener('beforeunload', h)
    return () => window.removeEventListener('beforeunload', h)
  }, [guard])

  const wasPublished = existing?.status === 'published'
  const words = countWords(form.body)
  const autoMins = Math.max(1, Math.round(words / 180))

  if (editing && isLoading) {
    return <DashLayout kind="admin"><LoadingBlock label="Maqola yuklanmoqda…" /></DashLayout>
  }
  if (editing && (isError || !existing)) {
    return (
      <DashLayout kind="admin">
        <PageHead title="Maqolani tahrirlash">
          <Link to="/admin-panel/blog" className="btn btn-secondary"><Icon name="arrowL" size={15} /> Bloglar</Link>
        </PageHead>
        <ErrorState title="Maqolani ochib bo'lmadi"
          sub="Maqola o'chirilgan bo'lishi yoki aloqa uzilgan bo'lishi mumkin." onRetry={refetch} />
      </DashLayout>
    )
  }

  // The backend requires a title, so validate on click instead of greying the
  // buttons out — a dimmed button reads as a broken page.
  function trySave(status) {
    if (save.isPending) return
    if (!form.title.trim()) {
      toast.error('Avval sarlavha kiriting')
      titleRef.current?.focus()
      return
    }
    save.mutate(status)
  }

  const coverSrc = coverPreview || (!dropCover && existing?.cover ? absUrl(existing.cover) : '')
  const draftLabel = wasPublished ? 'Qoralamaga qaytarish' : 'Qoralama saqlash'
  const pubLabel = wasPublished ? 'Yangilash' : 'Chop etish'
  const savingAs = save.isPending ? save.variables : null

  const draftBtn = (cls) => (
    <button type="button" className={cls} disabled={save.isPending} onClick={() => trySave('draft')}>
      <Icon name="file" size={15} /> {savingAs === 'draft' ? 'Saqlanmoqda…' : draftLabel}
    </button>
  )
  const pubBtn = (cls) => (
    <button type="button" className={cls} disabled={save.isPending} onClick={() => trySave('published')}>
      <Icon name="check" size={15} /> {savingAs === 'published' ? 'Saqlanmoqda…' : pubLabel}
    </button>
  )

  return (
    <DashLayout kind="admin">
      <style>{css}</style>
      <PageHead title={editing ? 'Maqolani tahrirlash' : 'Yangi maqola'}
        sub={dirty ? "Saqlanmagan o'zgarishlar bor" : (editing ? "Barcha o'zgarishlar saqlangan" : "Sarlavha yozing, matnni to'ldiring va chop eting")}>
        <Link to="/admin-panel/blog" className="btn btn-secondary"
          onClick={e => { if (guard) { e.preventDefault(); setLeaveAsk(true) } }}>
          <Icon name="arrowL" size={15} /> Bloglar
        </Link>
      </PageHead>

      <div className="abe-grid">
        <div className="abe-sheet">
          <div className="abe-kicker">
            <span>Sarlavha</span>
            <span className={form.title.length >= TITLE_MAX ? 'over' : ''}>{form.title.length}/{TITLE_MAX}</span>
          </div>
          <input className="abe-title" ref={titleRef} autoFocus={!editing} value={form.title} maxLength={TITLE_MAX}
            aria-label="Maqola sarlavhasi"
            onChange={e => set('title', e.target.value)} placeholder="Maqola sarlavhasi…" />
          <textarea className="abe-excerpt" rows={3} value={form.excerpt} maxLength={EXCERPT_MAX}
            aria-label="Qisqa tavsif"
            onChange={e => set('excerpt', e.target.value)}
            placeholder="Qisqa tavsif — ro'yxatda va ulashishda ko'rinadi…" />
          <div className="abe-kicker under">
            <span>Qisqa tavsif</span>
            <span className={form.excerpt.length >= EXCERPT_MAX ? 'over' : ''}>{form.excerpt.length}/{EXCERPT_MAX}</span>
          </div>
          <div className="abe-fold" />
          <RichTextEditor value={form.body} onChange={v => set('body', v)}
            onImageUpload={uploadInline}
            placeholder="Maqola matnini shu yerda yozing — sarlavha, ro'yxat, iqtibos. Rasmlarni tugma orqali yoki sudrab tashlab (drag-drop) qo'shing…"
            minHeight={400} />
          <div className="abe-count">
            <span>{words} so'z</span>
            <span>≈ {autoMins} daqiqa o'qish</span>
          </div>
        </div>

        <aside className="abe-side">
          <div className="abe-pub">
            <div className="cap">Nashr holati</div>
            <div className="st">
              <span className={`dot ${wasPublished ? 'live' : ''}`} />
              {wasPublished ? 'Chop etilgan' : (editing ? 'Qoralama' : 'Yangi qoralama')}
            </div>
            <div className="note">
              {wasPublished
                ? <>Saytda ko'rinib turibdi: <Link to={`/blog/${slug}`} target="_blank" rel="noopener noreferrer">/blog/{slug}</Link></>
                : "Chop etilmaguncha maqolani faqat jamoa ko'radi."}
            </div>
            <label className="abe-feat">
              <span>Asosiy maqola<small>Blog sahifasining tepasida turadi</small></span>
              <span className="switch">
                <input type="checkbox" checked={form.is_featured} onChange={e => set('is_featured', e.target.checked)} />
                <span />
              </span>
            </label>
            <div className="abe-pub-acts">
              {pubBtn('btn btn-accent btn-block')}
              {draftBtn('btn btn-block abe-ghost')}
            </div>
          </div>

          <div className="abe-card">
            <div className="abe-card-h"><Icon name="image" size={13} /> Muqova</div>
            <div className={`abe-cover thumb-${form.cover_color}`}>
              {coverSrc ? <img src={coverSrc} alt="Muqova" /> : <span>{form.cover_emoji}</span>}
            </div>
            <div className="abe-cover-acts">
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => coverRef.current?.click()}>
                <Icon name="upload" size={13} /> {coverSrc ? 'Almashtirish' : 'Rasm yuklash'}
              </button>
              {coverSrc && (
                <button type="button" className="btn btn-ghost btn-sm" onClick={clearCover}>
                  <Icon name="x" size={13} /> Olib tashlash
                </button>
              )}
              <input ref={coverRef} type="file" accept="image/*" hidden
                onChange={e => { pickCover(e.target.files?.[0]); e.target.value = '' }} />
            </div>
            <div className="field-hint">
              {coverSrc ? "Rasm bor — emoji va rang faqat zaxira sifatida saqlanadi." : "Rasm bo'lmasa, emoji va rang muqova bo'ladi."}
            </div>

            <div className={coverSrc ? 'abe-dim' : ''}>
              <div className="abe-sub">Emoji</div>
              <div className="abe-emojis">
                {EMOJIS.map(em => (
                  <button key={em} type="button" className={`abe-em ${form.cover_emoji === em ? 'on' : ''}`}
                    aria-pressed={form.cover_emoji === em} onClick={() => set('cover_emoji', em)}>{em}</button>
                ))}
              </div>
              <div className="abe-sub">Rang</div>
              <div className="abe-swatches">
                {COLORS.map(c => (
                  <button key={c} type="button" className={`abe-sw thumb-${c} ${form.cover_color === c ? 'on' : ''}`}
                    title={COLOR_NAMES[c]} aria-label={COLOR_NAMES[c]} aria-pressed={form.cover_color === c}
                    onClick={() => set('cover_color', c)} />
                ))}
              </div>
            </div>
          </div>

          <div className="abe-card">
            <div className="abe-card-h"><Icon name="sliders" size={13} /> Tafsilotlar</div>
            <div className="field">
              <label className="label" htmlFor="abe-cat">Kategoriya</label>
              <input id="abe-cat" className="input" value={form.category} maxLength={CATEGORY_MAX}
                onChange={e => set('category', e.target.value)} placeholder="Masalan: Geografiya" />
            </div>
            <div className="field abe-last">
              <label className="label" htmlFor="abe-mins">O'qish vaqti (daqiqa)</label>
              <div className="abe-mins">
                <input id="abe-mins" className="input" type="number" min={1} max={600} inputMode="numeric" value={form.read_minutes}
                  onChange={e => set('read_minutes', e.target.value)} />
                <button type="button" className="btn btn-secondary" title="Matn uzunligiga qarab hisoblash"
                  onClick={() => set('read_minutes', String(autoMins))}>
                  <Icon name="timer" size={14} /> Avto
                </button>
              </div>
              <div className="field-hint">Matn bo'yicha taxminan {autoMins} daqiqa.</div>
            </div>
          </div>
        </aside>
      </div>

      <div className="abe-mbar">
        {draftBtn('btn btn-secondary')}
        {pubBtn('btn btn-primary')}
      </div>

      <ConfirmModal open={leaveAsk} tone="sun" icon="alert"
        title="Saqlamasdan chiqasizmi?"
        text="Saqlanmagan o'zgarishlar yo'qoladi. Avval qoralama sifatida saqlab qo'yishingiz mumkin."
        confirmLabel="Chiqish" cancelLabel="Tahrirlashda qolish"
        onConfirm={() => nav('/admin-panel/blog')}
        onClose={() => setLeaveAsk(false)} />
    </DashLayout>
  )
}
