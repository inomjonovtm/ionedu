import { useState, useEffect } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import api, { absUrl } from '../../api/client'
import DashLayout from '../../components/DashLayout'
import Icon from '../../components/Icon'
import FileInput from '../../components/FileInput'
import RichTextEditor from '../../components/RichTextEditor'

const COLORS = ['green', 'blue', 'amber', 'rose', 'teal', 'violet', 'slate']
const EMOJIS = ['📝', '🌍', '📚', '🧭', '🏔️', '🌊', '🗺️', '💡', '🎓', '📰', '✨', '🔬', '⭐', '🚀']

const EMPTY = {
  title: '', category: 'Umumiy', excerpt: '', body: '',
  cover_emoji: '📝', cover_color: 'green', status: 'draft',
  is_featured: false, read_minutes: 3,
}

const css = `
  .be-top { display: flex; align-items: center; gap: 14px; margin-bottom: 22px; flex-wrap: wrap; }
  .be-top .back { display: inline-flex; align-items: center; gap: 6px; font-size: 13.5px; color: var(--text-3); }
  .be-top .back:hover { color: var(--text); }
  .be-top h1 { font-size: 21px; letter-spacing: -0.03em; }
  .be-top .acts { margin-left: auto; display: flex; gap: 8px; align-items: center; }

  .be-grid { display: grid; grid-template-columns: minmax(0, 1fr) 320px; gap: 24px; align-items: start; }
  .be-main { background: var(--white); border: 1px solid var(--border); border-radius: 18px; padding: 26px 28px; }
  .be-title-in { width: 100%; border: none; outline: none; background: transparent; font-family: var(--font-display);
    font-size: 30px; font-weight: 700; letter-spacing: -0.035em; color: var(--text); line-height: 1.15; }
  .be-title-in::placeholder { color: var(--text-4); }
  .be-excerpt { width: 100%; border: none; outline: none; background: transparent; resize: none;
    font-size: 16px; line-height: 1.55; color: var(--text-2); margin-top: 12px; font-family: inherit; }
  .be-excerpt::placeholder { color: var(--text-4); }
  .be-sep { height: 1px; background: var(--border-2); margin: 18px 0; }

  .be-side { position: sticky; top: 24px; display: flex; flex-direction: column; gap: 16px; }
  .be-card { background: var(--white); border: 1px solid var(--border); border-radius: 16px; overflow: hidden; }
  .be-card-h { padding: 12px 16px; font-size: 12.5px; font-weight: 650; border-bottom: 1px solid var(--border-2);
    display: flex; align-items: center; gap: 7px; }
  .be-card-h svg { color: var(--green-600); }
  .be-card-b { padding: 15px 16px; }

  .be-cover-prev { aspect-ratio: 16/9; border-radius: 12px; display: flex; align-items: center; justify-content: center;
    font-size: 42px; position: relative; overflow: hidden; margin-bottom: 12px; }
  .be-cover-prev img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
  .be-swatches { display: flex; flex-wrap: wrap; gap: 6px; }
  .be-sw { width: 30px; height: 30px; border-radius: 8px; aspect-ratio: auto; cursor: pointer; }
  .be-emojis { display: flex; flex-wrap: wrap; gap: 5px; }
  .be-em { width: 34px; height: 34px; border-radius: 9px; font-size: 18px; border: 1px solid var(--border); background: var(--white); }
  .be-em.on { background: var(--green-50); box-shadow: inset 0 0 0 1px var(--green-300); }

  .be-status { display: flex; gap: 6px; padding: 4px; background: var(--bg-soft); border: 1px solid var(--border-2);
    border-radius: 999px; }
  .be-status button { flex: 1; padding: 8px; border-radius: 999px; font-size: 12.5px; font-weight: 560; color: var(--text-3); }
  .be-status button.on { background: var(--white); color: var(--text); box-shadow: 0 1px 2px rgba(12,17,14,.06), inset 0 0 0 1px var(--border); }
  .be-status button.on.pub { color: var(--green-700); }

  @media (max-width: 980px) {
    .be-grid { grid-template-columns: 1fr; }
    .be-side { position: static; }
    .be-main { padding: 20px 18px; }
    .be-title-in { font-size: 25px; }
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

  const { data: existing, isLoading } = useQuery({
    queryKey: ['blog-edit', slug],
    queryFn: () => api.get(`/blog/posts/${slug}/`).then(r => r.data),
    enabled: editing,
  })

  useEffect(() => {
    if (existing) {
      setForm({
        title: existing.title, category: existing.category, excerpt: existing.excerpt,
        body: existing.body || '', cover_emoji: existing.cover_emoji, cover_color: existing.cover_color,
        status: existing.status, is_featured: existing.is_featured, read_minutes: existing.read_minutes,
      })
    }
  }, [existing])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  function pickCover(f) {
    setCover(f)
    if (f) setCoverPreview(URL.createObjectURL(f))
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
      const payload = { ...form, status: status || form.status }
      const fd = new FormData()
      Object.entries(payload).forEach(([k, v]) => {
        fd.append(k, k === 'is_featured' ? (v ? 'true' : 'false') : v)
      })
      if (cover) fd.append('cover', cover)
      const headers = { 'Content-Type': 'multipart/form-data' }
      return editing
        ? api.patch(`/blog/posts/${slug}/`, fd, { headers })
        : api.post('/blog/posts/', fd, { headers })
    },
    onSuccess: () => {
      qc.invalidateQueries(['admin-blog']); qc.invalidateQueries(['blog-list'])
      toast.success(editing ? 'Saqlandi' : 'Maqola yaratildi')
      nav('/admin-panel/blog')
    },
    onError: (e) => {
      const d = e.response?.data
      const msg = typeof d === 'object' && d ? (Object.values(d).flat()[0] || JSON.stringify(d)) : (d || 'Xatolik')
      toast.error(String(msg).slice(0, 200))
    },
  })

  if (editing && isLoading) {
    return <DashLayout kind="admin"><div className="loading-state"><span className="spinner" /> Yuklanmoqda…</div></DashLayout>
  }

  const coverCls = `be-cover-prev thumb-${form.cover_color}`

  return (
    <DashLayout kind="admin">
      <style>{css}</style>
      <div className="be-top">
        <Link to="/admin-panel/blog" className="back"><Icon name="arrowL" size={15} /> Bloglar</Link>
        <h1>{editing ? 'Maqolani tahrirlash' : 'Yangi maqola'}</h1>
        <div className="acts">
          <span className={`badge ${form.status === 'published' ? 'badge-green' : 'badge-amber'}`}>
            {form.status === 'published' ? 'Chop etilgan' : 'Qoralama'}
          </span>
          <button className="btn btn-secondary btn-sm" disabled={save.isPending || !form.title.trim()}
            onClick={() => save.mutate('draft')}>
            <Icon name="file" size={14} /> Qoralama saqlash
          </button>
          <button className="btn btn-primary btn-sm" disabled={save.isPending || !form.title.trim()}
            onClick={() => save.mutate('published')}>
            <Icon name="check" size={14} /> {save.isPending ? 'Saqlanmoqda…' : 'Chop etish'}
          </button>
        </div>
      </div>

      <div className="be-grid">
        <div className="be-main">
          <input className="be-title-in" autoFocus value={form.title}
            onChange={e => set('title', e.target.value)} placeholder="Maqola sarlavhasi…" />
          <textarea className="be-excerpt" rows={2} value={form.excerpt}
            onChange={e => set('excerpt', e.target.value)}
            placeholder="Qisqa tavsif — ro'yxatda va ulashishda ko'rinadi…" />
          <div className="be-sep" />
          <RichTextEditor value={form.body} onChange={v => set('body', v)}
            onImageUpload={uploadInline}
            placeholder="Maqola matnini shu yerda yozing — sarlavha, ro'yxat, iqtibos. Rasmlarni tugma orqali yoki sudrab tashlab (drag-drop) qo'shing…"
            minHeight={400} />
        </div>

        <aside className="be-side">
          <div className="be-card">
            <div className="be-card-h"><Icon name="image" size={14} /> Muqova</div>
            <div className="be-card-b">
              <div className={coverCls}>
                {(coverPreview || existing?.cover)
                  ? <img src={coverPreview || absUrl(existing.cover)} alt="" />
                  : <span>{form.cover_emoji}</span>}
              </div>
              <FileInput onPick={pickCover} compact hint="JPG/PNG — bo'lmasa emoji + rang ishlatiladi" />
              <div className="label" style={{ marginTop: 14 }}>Emoji</div>
              <div className="be-emojis">
                {EMOJIS.map(em => (
                  <button key={em} type="button" className={`be-em ${form.cover_emoji === em ? 'on' : ''}`}
                    onClick={() => set('cover_emoji', em)}>{em}</button>
                ))}
              </div>
              <div className="label" style={{ marginTop: 14 }}>Rang</div>
              <div className="be-swatches">
                {COLORS.map(c => (
                  <button key={c} type="button" className={`be-sw thumb-${c}`}
                    onClick={() => set('cover_color', c)}
                    style={{ outline: form.cover_color === c ? '2px solid var(--ink)' : 'none', outlineOffset: 2 }} />
                ))}
              </div>
            </div>
          </div>

          <div className="be-card">
            <div className="be-card-h"><Icon name="sliders" size={14} /> Sozlamalar</div>
            <div className="be-card-b">
              <div className="field">
                <label className="label">Kategoriya</label>
                <input className="input" value={form.category} onChange={e => set('category', e.target.value)}
                  placeholder="Masalan: Geografiya" />
              </div>
              <div className="field">
                <label className="label">O'qish vaqti (daqiqa)</label>
                <input className="input" type="number" min={1} value={form.read_minutes}
                  onChange={e => set('read_minutes', e.target.value)} />
              </div>
              <div className="field" style={{ marginBottom: 14 }}>
                <label className="label">Holat</label>
                <div className="be-status">
                  <button className={form.status === 'draft' ? 'on' : ''} onClick={() => set('status', 'draft')}>Qoralama</button>
                  <button className={`pub ${form.status === 'published' ? 'on' : ''}`} onClick={() => set('status', 'published')}>Chop etilgan</button>
                </div>
              </div>
              <label className="checkbox">
                <input type="checkbox" checked={form.is_featured} onChange={e => set('is_featured', e.target.checked)} />
                Asosiy maqola (featured)
              </label>
            </div>
          </div>
        </aside>
      </div>
    </DashLayout>
  )
}
