import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import api, { absUrl, apiError } from '../../api/client'
import { useAuth } from '../../store/auth'
import DashLayout from '../../components/DashLayout'
import Icon from '../../components/Icon'
import Confirm from '../../components/Confirm'
import RichTextEditor from '../../components/RichTextEditor'
import LessonMaterialsManager from '../../components/LessonMaterialsManager'
import TestEditor from '../../components/builder/TestEditor'
import { CourseStatus, EmptyState } from '../../components/Dash'

/* ════════════════════════════════════════════════════════════════
   Course Studio
   Left  — the course outline: sections with lessons AND tests in one
           freely ordered list (drag & drop, or insert at any position).
   Right — an editor for whatever is selected: course info, a lesson,
           a test (full TestEditor) or the publish checklist.
   ════════════════════════════════════════════════════════════════ */

const EMOJIS = ['🌍', '🗺️', '🏔️', '🌋', '🌊', '🏜️', '🌾', '🌦️', '🧭', '🛰️', '🏙️', '🐪', '🌡️', '💎', '🚀', '📊']
const COLORS = ['blue', 'green', 'amber', 'rose', 'teal', 'violet', 'slate']
const LEVELS = [['beginner', "Boshlang'ich"], ['intermediate', "O'rta"], ['advanced', 'Yuqori']]

const css = `
  .cs-top { display: flex; align-items: center; gap: 14px; flex-wrap: wrap; margin-bottom: 18px; }
  .cs-top h1 { font-size: 28px; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 520px; }
  .cs-top .sp { flex: 1; }
  .cs-back { width: 42px; height: 42px; border-radius: 13px; border: 1.5px solid var(--border); background: var(--white); display: inline-flex; align-items: center; justify-content: center; color: var(--text-2); flex-shrink: 0; }
  .cs-back:hover { border-color: var(--line); color: var(--text); }
  .cs-saved { font-family: var(--font-mono); font-size: 11px; color: var(--text-3); display: inline-flex; align-items: center; gap: 6px; }
  .cs-saved.busy { color: var(--amber-600); }

  .cs-grid { display: grid; grid-template-columns: 372px minmax(0, 1fr); gap: 20px; align-items: start; }
  .cs-out { position: sticky; top: 16px; max-height: calc(100vh - 32px); display: flex; flex-direction: column; background: var(--white); border: 1.5px solid var(--border); border-radius: 22px; overflow: hidden; }
  .cs-out-head { padding: 12px; border-bottom: 1.5px dashed var(--border); display: flex; flex-direction: column; gap: 6px; flex-shrink: 0; }
  .cs-nav { display: flex; align-items: center; gap: 10px; width: 100%; padding: 9px 10px; border-radius: 13px; font-size: 14px; font-weight: 700; color: var(--text-2); text-align: left; }
  .cs-nav:hover { background: var(--bg-soft); color: var(--text); }
  .cs-nav.on { background: var(--sun); color: #14213D; }
  .cs-nav .ni { width: 30px; height: 30px; border-radius: 10px; background: var(--bg-soft); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .cs-nav.on .ni { background: #fff; color: #14213D; }
  .cs-nav .nb { margin-left: auto; font-family: var(--font-mono); font-size: 11px; font-weight: 600; }
  .cs-out-body { flex: 1; min-height: 0; overflow-y: auto; padding: 10px 10px 12px; }
  .cs-out-foot { padding: 10px 12px; border-top: 1.5px dashed var(--border); flex-shrink: 0; }

  .cs-sec { border: 1.5px solid var(--border); border-radius: 16px; margin-bottom: 8px; background: var(--paper); transition: box-shadow .12s ease, opacity .12s ease; }
  .cs-sec.dragging { opacity: .4; }
  .cs-sec.over-top { box-shadow: 0 -4px 0 var(--sea); }
  .cs-sec.over-bot { box-shadow: 0 4px 0 var(--sea); }
  .cs-sec-head { display: flex; align-items: center; gap: 4px; padding: 8px 6px 8px 4px; }
  .cs-grip { cursor: grab; color: var(--text-4); display: inline-flex; padding: 4px 2px; flex-shrink: 0; touch-action: none; }
  .cs-grip:hover { color: var(--text-2); }
  .cs-sec-n { font-family: var(--font-mono); font-size: 10.5px; font-weight: 700; color: var(--text-3); flex-shrink: 0; width: 22px; text-align: center; }
  .cs-sec-title { flex: 1; min-width: 0; height: 32px; padding: 0 8px; border-radius: 9px; border: 1.5px solid transparent; background: transparent; font-weight: 750; font-size: 14px; font-family: var(--font-display); letter-spacing: -.01em; color: var(--text); outline: none; text-overflow: ellipsis; }
  .cs-sec-title:hover { border-color: var(--border); }
  .cs-sec-title:focus { border-color: var(--line); background: var(--white); }
  .cs-mini { width: 28px; height: 28px; border-radius: 9px; display: inline-flex; align-items: center; justify-content: center; color: var(--text-3); flex-shrink: 0; }
  .cs-mini:hover { background: var(--bg-soft); color: var(--text); }
  .cs-mini.danger:hover { background: var(--red-50); color: var(--red-600); }
  .cs-mini:disabled { opacity: .3; pointer-events: none; }
  .cs-items { padding: 0 6px 6px; min-height: 12px; }
  .cs-item { display: flex; align-items: center; gap: 6px; padding: 7px 6px 7px 2px; border-radius: 12px; background: var(--white); border: 1.5px solid var(--border-2); cursor: pointer; transition: border-color .12s ease, box-shadow .12s ease, opacity .12s ease; position: relative; }
  .cs-item:hover { border-color: var(--line); }
  .cs-item.on { border: 2px solid var(--line); box-shadow: var(--hard-sm); padding: 6.5px 5.5px 6.5px 1.5px; }
  .cs-item.dragging { opacity: .35; }
  .cs-ico { width: 30px; height: 30px; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; color: #14213D; }
  .cs-ico.lesson { background: #C9DCFF; } .cs-ico.test { background: #DAD0FF; }
  .cs-item .tt { flex: 1; min-width: 0; }
  .cs-item .tn { font-weight: 700; font-size: 13.5px; line-height: 1.25; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--text); }
  .cs-item .tm { font-size: 11.5px; color: var(--text-3); margin-top: 1px; display: flex; align-items: center; gap: 5px; }
  .cs-item .warn { color: var(--amber-600); font-weight: 700; }
  .cs-item .acts { display: none; gap: 0; }
  .cs-item:hover .acts, .cs-item.on .acts { display: inline-flex; }

  /* gap between items = drop zone + "insert here" */
  .cs-gap { position: relative; height: 8px; }
  .cs-gap.drop::before { content: ''; position: absolute; left: 4px; right: 4px; top: 2px; height: 4px; border-radius: 99px; background: var(--sea); }
  .cs-gap .ins { position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); display: none; gap: 4px; z-index: 3; }
  .cs-gap:hover .ins { display: inline-flex; }
  .cs-gap:hover::after { content: ''; position: absolute; left: 8px; right: 8px; top: 3.5px; border-top: 1.5px dashed var(--text-4); }
  .cs-ins { height: 22px; padding: 0 8px; border-radius: 99px; font-size: 11px; font-weight: 750; border: 1.5px solid var(--line); background: var(--white); color: var(--text); display: inline-flex; align-items: center; gap: 3px; white-space: nowrap; }
  .cs-ins:hover { background: var(--sun); color: #14213D; }
  .cs-dragging .cs-gap { height: 12px; }
  .cs-dragging .cs-gap .ins, .cs-dragging .cs-gap::after { display: none !important; }
  .cs-add { display: flex; gap: 6px; padding: 2px 0 0; }
  .cs-add button { flex: 1; height: 32px; border-radius: 10px; border: 1.5px dashed var(--border); font-size: 12.5px; font-weight: 700; color: var(--text-3); display: inline-flex; align-items: center; justify-content: center; gap: 5px; background: transparent; }
  .cs-add button:hover { border-color: var(--line); border-style: solid; color: var(--text); background: var(--white); }
  .cs-empty { text-align: center; font-size: 12.5px; color: var(--text-3); padding: 10px 6px 8px; }

  /* Right panel */
  .cs-panel { background: var(--white); border: 1.5px solid var(--border); border-radius: 22px; padding: 24px; min-width: 0; }
  .cs-ph { display: flex; align-items: flex-start; gap: 14px; margin-bottom: 20px; padding-bottom: 18px; border-bottom: 1.5px dashed var(--border); flex-wrap: wrap; }
  .cs-ph .pi { width: 46px; height: 46px; border-radius: 15px; border: 1.5px solid var(--line); display: flex; align-items: center; justify-content: center; flex-shrink: 0; transform: rotate(-4deg); color: #14213D; }
  .cs-ph h2 { font-size: 23px; }
  .cs-ph p { font-size: 13.5px; color: var(--text-3); margin-top: 3px; }
  .cs-ph .sp { flex: 1; }
  .cs-g2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
  .cs-foot { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; margin-top: 20px; padding-top: 18px; border-top: 1.5px dashed var(--border); }
  .cs-foot .sp { flex: 1; }
  .cs-dirty { font-size: 13px; font-weight: 700; color: var(--amber-600); }

  .cs-cover { display: grid; grid-template-columns: 240px 1fr; gap: 18px; align-items: start; }
  .cs-cover-prev { aspect-ratio: 16/10; border-radius: 18px; overflow: hidden; border: 1.5px solid var(--line); font-size: 64px; }
  .cs-cover-prev img { width: 100%; height: 100%; object-fit: cover; }
  .cs-emo { display: flex; flex-wrap: wrap; gap: 6px; }
  .cs-emo button { width: 38px; height: 38px; border-radius: 11px; font-size: 19px; border: 1.5px solid var(--border); background: var(--white); }
  .cs-emo button.on { border: 2px solid var(--line); background: var(--sun-soft); }
  .cs-col { display: flex; gap: 6px; flex-wrap: wrap; }
  .cs-col button { width: 34px; height: 34px; border-radius: 11px; border: 2px solid transparent; }
  .cs-col button.on { border-color: var(--line); box-shadow: var(--hard-sm); }

  .cs-vtabs { display: inline-flex; gap: 4px; padding: 4px; background: var(--bg-soft); border: 1.5px solid var(--border); border-radius: 13px; margin-bottom: 12px; }
  .cs-vtabs button { padding: 7px 14px; border-radius: 9px; font-size: 13px; font-weight: 700; color: var(--text-3); display: inline-flex; align-items: center; gap: 6px; }
  .cs-vtabs button.on { background: var(--ink); color: #fff; }
  html[data-theme="dark"] .cs-vtabs button.on { background: var(--sun); color: #14213D; }
  .cs-video { aspect-ratio: 16/9; border-radius: 16px; overflow: hidden; background: var(--ink); border: 1.5px solid var(--line); margin-top: 10px; max-width: 560px; }
  .cs-video iframe, .cs-video video { width: 100%; height: 100%; border: 0; display: block; }
  .cs-drop { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 26px 18px; border: 2px dashed var(--border); border-radius: 16px; cursor: pointer; text-align: center; transition: all .14s ease; background: var(--paper); }
  .cs-drop:hover, .cs-drop.over { border-color: var(--line); background: var(--sun-soft); }
  .cs-upbar { height: 12px; border-radius: 99px; border: 1.5px solid var(--line); background: var(--white); overflow: hidden; margin-top: 10px; }
  .cs-upbar i { display: block; height: 100%; background: var(--sun); transition: width .2s ease; }
  .cs-sw { display: flex; align-items: center; justify-content: space-between; gap: 14px; padding: 12px 14px; border: 1.5px solid var(--border); border-radius: 14px; }
  .cs-sw .t { font-weight: 700; font-size: 14px; } .cs-sw .d { font-size: 12.5px; color: var(--text-3); margin-top: 2px; }

  .cs-check { display: flex; align-items: flex-start; gap: 12px; padding: 12px 0; border-bottom: 1.5px dashed var(--border-2); }
  .cs-check:last-child { border-bottom: none; }
  .cs-check .ci { width: 28px; height: 28px; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .cs-check.ok .ci { background: var(--green-100); color: var(--green-800); }
  .cs-check.no .ci { background: var(--coral-soft); color: var(--red-600); }
  .cs-check.opt .ci { background: var(--sun-soft); color: var(--amber-600); }
  .cs-check .ct { font-weight: 700; font-size: 14px; } .cs-check .cd { font-size: 12.5px; color: var(--text-3); margin-top: 2px; }
  .cs-check button { margin-left: auto; flex-shrink: 0; }
  .cs-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 20px; }
  .cs-stat { border: 1.5px solid var(--border); border-radius: 16px; padding: 14px; }
  .cs-stat .v { font-family: var(--font-display); font-size: 26px; font-weight: 800; letter-spacing: -.04em; line-height: 1; }
  .cs-stat .l { font-size: 12px; color: var(--text-3); font-weight: 650; margin-top: 6px; }
  .cs-note { border-radius: 16px; padding: 14px 16px; font-size: 13.5px; line-height: 1.55; margin-bottom: 18px; display: flex; gap: 12px; }
  .cs-note.red { background: var(--red-50); color: var(--text-2); border: 1.5px dashed var(--red-600); }
  .cs-note.amber { background: var(--amber-50); color: var(--text-2); }
  .cs-note.green { background: var(--green-50); color: var(--text-2); }

  .cs-mobile-toggle { display: none; }
  @media (max-width: 1180px) {
    .cs-grid { grid-template-columns: 1fr; }
    .cs-out { position: static; max-height: none; }
    .cs-out.collapsed .cs-out-body, .cs-out.collapsed .cs-out-foot { display: none; }
    .cs-mobile-toggle { display: inline-flex; }
    .cs-item .acts { display: inline-flex; }
  }
  @media (max-width: 640px) {
    .cs-panel { padding: 16px; } .cs-g2, .cs-cover { grid-template-columns: 1fr; } .cs-stats { grid-template-columns: 1fr 1fr; }
    .cs-top h1 { font-size: 22px; max-width: 100%; }
  }
`

const errMsg = apiError

function ytId(url) {
  const m = (url || '').match(/(?:youtu\.be\/|v=|embed\/|shorts\/|live\/)([\w-]{11})/)
  return m ? m[1] : null
}

/* ─────────────────────────── Course info ─────────────────────────── */

function CourseInfoPanel({ course, onSaved, onDirty }) {
  const navigate = useNavigate()
  const loc = useLocation()
  const { data: cats = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.get('/categories/').then(r => r.data.results || r.data),
  })
  const init = () => ({
    title: course?.title || '', description: course?.description || '',
    category_id: course?.category?.id || '', level: course?.level || 'beginner',
    thumb_emoji: course?.thumb_emoji || '🌍', thumb_color: course?.thumb_color || 'blue',
  })
  const [f, setF] = useState(init)
  const [thumb, setThumb] = useState(null)
  const [preview, setPreview] = useState(course?.thumbnail ? absUrl(course.thumbnail) : '')
  const [busy, setBusy] = useState(false)
  const set = (k, v) => setF(s => ({ ...s, [k]: v }))
  const dirty = !!thumb || JSON.stringify(f) !== JSON.stringify(init())
  useEffect(() => { onDirty?.(dirty) }, [dirty, onDirty])

  function pick(e) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) return toast.error('Faqat rasm fayli tanlang')
    if (file.size > 5 * 1024 * 1024) return toast.error('Rasm hajmi 5 MB dan oshmasin')
    setThumb(file); setPreview(URL.createObjectURL(file))
  }

  async function save(e) {
    e?.preventDefault()
    if (f.title.trim().length < 3) return toast.error('Kurs nomi kamida 3 ta belgidan iborat bo\'lsin')
    setBusy(true)
    try {
      const fd = new FormData()
      fd.append('title', f.title.trim())
      fd.append('description', f.description)
      fd.append('level', f.level)
      fd.append('thumb_emoji', f.thumb_emoji)
      fd.append('thumb_color', f.thumb_color)
      if (f.category_id) fd.append('category_id', f.category_id)
      if (thumb) fd.append('thumbnail', thumb)
      const headers = { 'Content-Type': 'multipart/form-data' }
      if (course) {
        await api.patch(`/courses/${course.slug}/`, fd, { headers })
        setThumb(null)
        toast.success('Saqlandi')
        onSaved()
      } else {
        fd.append('status', 'draft')
        const { data } = await api.post('/courses/', fd, { headers })
        toast.success('Kurs yaratildi — endi darslar qo\'shing')
        navigate(loc.pathname.replace(/new$/, `${data.slug}/edit`), { replace: true })
      }
    } catch (err) { toast.error(errMsg(err, 'Saqlashda xatolik')) }
    finally { setBusy(false) }
  }

  return (
    <form className="cs-panel fade-up" onSubmit={save}>
      <div className="cs-ph">
        <span className="pi" style={{ background: 'var(--sun)' }}><Icon name="book" size={21} /></span>
        <div>
          <h2>{course ? "Kurs ma'lumotlari" : 'Yangi kurs'}</h2>
          <p>{course ? "Nom, tavsif va muqova — o'quvchi kurs sahifasida shularni ko'radi." : "Avval kursga nom bering. Darslar va testlarni keyingi qadamda qo'shasiz."}</p>
        </div>
      </div>

      <div className="field">
        <label className="label">Kurs nomi</label>
        <input className="input" style={{ height: 52, fontSize: 17, fontWeight: 700 }} value={f.title} onChange={e => set('title', e.target.value)}
          placeholder="Masalan: Materiklar va okeanlar geografiyasi" maxLength={200} autoFocus={!course} required />
      </div>

      <div className="cs-g2">
        <div className="field">
          <label className="label">Kategoriya</label>
          <select className="select" value={f.category_id} onChange={e => set('category_id', e.target.value)}>
            <option value="">Tanlanmagan</option>
            {cats.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
          </select>
        </div>
        <div className="field">
          <label className="label">Daraja</label>
          <select className="select" value={f.level} onChange={e => set('level', e.target.value)}>
            {LEVELS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>
      </div>

      <div className="field">
        <label className="label">Tavsif</label>
        <RichTextEditor value={f.description} onChange={v => set('description', v)} minHeight={140}
          placeholder="Kursda nimalar o'rgatiladi? Kimlar uchun? Qanday natijaga erishiladi?" />
      </div>

      <div className="field" style={{ marginBottom: 0 }}>
        <label className="label">Muqova</label>
        <div className="cs-cover">
          <div className={`cs-cover-prev ${preview ? '' : `thumb thumb-${f.thumb_color}`}`}>
            {preview ? <img src={preview} alt="" /> : <span>{f.thumb_emoji}</span>}
          </div>
          <div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
              <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer' }}>
                <Icon name="image" size={14} /> {preview ? 'Rasmni almashtirish' : 'Rasm yuklash'}
                <input type="file" accept="image/*" hidden onChange={pick} />
              </label>
              {thumb && <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setThumb(null); setPreview(course?.thumbnail ? absUrl(course.thumbnail) : '') }}>Bekor qilish</button>}
            </div>
            {!preview && (
              <>
                <div className="field-hint" style={{ margin: '0 0 8px' }}>Rasm bo'lmasa — emoji va rang tanlang:</div>
                <div className="cs-emo" style={{ marginBottom: 10 }}>
                  {EMOJIS.map(e => <button key={e} type="button" className={f.thumb_emoji === e ? 'on' : ''} onClick={() => set('thumb_emoji', e)}>{e}</button>)}
                </div>
                <div className="cs-col">
                  {COLORS.map(c => <button key={c} type="button" className={`thumb-${c} ${f.thumb_color === c ? 'on' : ''}`} onClick={() => set('thumb_color', c)} aria-label={c} />)}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="cs-foot">
        {dirty && course && <span className="cs-dirty">Saqlanmagan o'zgarishlar bor</span>}
        <span className="sp" />
        <button type="submit" className="btn btn-primary" disabled={busy || (course && !dirty)}>
          {busy ? 'Saqlanmoqda…' : course ? 'Saqlash' : <>Kursni yaratish <Icon name="arrowR" size={16} /></>}
        </button>
      </div>
    </form>
  )
}

/* ─────────────────────────── Lesson editor ─────────────────────────── */

function LessonPanel({ lessonId, onSaved, onDirty, onDelete, onDuplicate }) {
  const { data: lesson, isLoading, isError } = useQuery({
    queryKey: ['lesson-edit', lessonId],
    queryFn: () => api.get(`/lessons/${lessonId}/`).then(r => r.data),
  })
  if (isLoading) return <div className="cs-panel"><div className="loading-state"><span className="spinner" />Dars yuklanmoqda…</div></div>
  if (isError || !lesson) return <div className="cs-panel"><EmptyState icon="alert" title="Darsni yuklab bo'lmadi" /></div>
  return <LessonForm key={lesson.id} lesson={lesson} onSaved={onSaved} onDirty={onDirty} onDelete={onDelete} onDuplicate={onDuplicate} />
}

function LessonForm({ lesson, onSaved, onDirty, onDelete, onDuplicate }) {
  const qc = useQueryClient()
  const init = () => ({
    title: lesson.title, video_type: lesson.video_type, youtube_url: lesson.youtube_url || '',
    duration_minutes: lesson.duration_minutes, description: lesson.description || '',
    is_free_preview: lesson.is_free_preview,
  })
  const [f, setF] = useState(init)
  const [file, setFile] = useState(null)
  const [progress, setProgress] = useState(null)
  const [busy, setBusy] = useState(false)
  const [over, setOver] = useState(false)
  const [tab, setTab] = useState('content')
  const titleRef = useRef(null)
  const abortRef = useRef(null)
  const set = (k, v) => setF(s => ({ ...s, [k]: v }))
  const dirty = !!file || JSON.stringify(f) !== JSON.stringify(init())
  useEffect(() => { onDirty?.(dirty) }, [dirty, onDirty])
  useEffect(() => { if (lesson.title === 'Yangi dars') { titleRef.current?.focus(); titleRef.current?.select() } }, [lesson.title])
  useEffect(() => () => abortRef.current?.abort(), [])

  const yid = ytId(f.youtube_url)
  const ytInvalid = f.video_type === 'youtube' && f.youtube_url.trim() && !yid

  function pickVideo(fl) {
    if (!fl) return
    if (!fl.type.startsWith('video/')) return toast.error('Faqat video fayl tanlang (MP4, WebM…)')
    if (fl.size > 1024 * 1024 * 1024) return toast.error('Video hajmi 1 GB dan oshmasin')
    setFile(fl)
    // Read the real duration from the file so the teacher need not type it.
    const v = document.createElement('video')
    v.preload = 'metadata'
    v.onloadedmetadata = () => { if (isFinite(v.duration)) set('duration_minutes', Math.max(1, Math.round(v.duration / 60))); URL.revokeObjectURL(v.src) }
    v.src = URL.createObjectURL(fl)
  }

  async function save(e) {
    e?.preventDefault()
    if (!f.title.trim()) return toast.error('Dars nomini kiriting')
    if (ytInvalid) return toast.error("YouTube havolasi noto'g'ri")
    setBusy(true)
    try {
      const fd = new FormData()
      fd.append('title', f.title.trim())
      fd.append('video_type', f.video_type)
      fd.append('duration_minutes', String(Math.max(1, Number(f.duration_minutes) || 1)))
      fd.append('description', f.description)
      fd.append('is_free_preview', f.is_free_preview ? 'true' : 'false')
      fd.append('youtube_url', f.video_type === 'youtube' ? f.youtube_url.trim() : '')
      if (f.video_type === 'upload' && file) fd.append('video_file', file)
      abortRef.current = new AbortController()
      await api.patch(`/lessons/${lesson.id}/`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
        signal: abortRef.current.signal,
        onUploadProgress: file ? (p) => setProgress(p.total ? Math.round(p.loaded / p.total * 100) : null) : undefined,
      })
      setFile(null); setProgress(null)
      await qc.invalidateQueries({ queryKey: ['lesson-edit', lesson.id] })
      toast.success('Dars saqlandi')
      onSaved()
    } catch (err) {
      if (err.code !== 'ERR_CANCELED') toast.error(errMsg(err, 'Darsni saqlashda xatolik'))
      setProgress(null)
    } finally { setBusy(false) }
  }

  return (
    <form className="cs-panel fade-up" onSubmit={save}>
      <div className="cs-ph">
        <span className="pi" style={{ background: '#C9DCFF' }}><Icon name="video" size={21} /></span>
        <div style={{ minWidth: 0 }}>
          <h2>Dars</h2>
          <p>Video, tavsif va qo'shimcha materiallar</p>
        </div>
        <span className="sp" />
        <button type="button" className="btn btn-ghost btn-sm" onClick={onDuplicate} title="Darsdan nusxa olish"><Icon name="file" size={14} /> Nusxa</button>
        <button type="button" className="btn btn-ghost btn-sm" style={{ color: 'var(--red-600)' }} onClick={onDelete}><Icon name="trash" size={14} /> O'chirish</button>
      </div>

      <div className="cs-vtabs">
        <button type="button" className={tab === 'content' ? 'on' : ''} onClick={() => setTab('content')}><Icon name="video" size={14} /> Dars</button>
        <button type="button" className={tab === 'materials' ? 'on' : ''} onClick={() => setTab('materials')}><Icon name="folder" size={14} /> Materiallar</button>
      </div>

      {tab === 'materials' ? (
        <LessonMaterialsManager lessonId={lesson.id} />
      ) : (
        <>
          <div className="field">
            <label className="label">Dars nomi</label>
            <input ref={titleRef} className="input" style={{ height: 50, fontSize: 16, fontWeight: 700 }} value={f.title}
              onChange={e => set('title', e.target.value)} maxLength={200} placeholder="Masalan: Yerning ichki tuzilishi" />
          </div>

          <div className="field">
            <label className="label">Video</label>
            <div className="cs-vtabs" style={{ marginBottom: 10 }}>
              <button type="button" className={f.video_type === 'youtube' ? 'on' : ''} onClick={() => set('video_type', 'youtube')}><Icon name="youtube" size={14} /> YouTube havola</button>
              <button type="button" className={f.video_type === 'upload' ? 'on' : ''} onClick={() => set('video_type', 'upload')}><Icon name="upload" size={14} /> Fayl yuklash</button>
            </div>
            {f.video_type === 'youtube' ? (
              <>
                <input className="input" type="url" value={f.youtube_url} onChange={e => set('youtube_url', e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=…" />
                {ytInvalid && <div className="field-error">Havola tanilmadi. youtube.com/watch?v=… yoki youtu.be/… ko'rinishida bo'lsin.</div>}
                {yid && <div className="cs-video"><iframe src={`https://www.youtube.com/embed/${yid}`} title="Video" allowFullScreen /></div>}
              </>
            ) : (
              <>
                <label className={`cs-drop ${over ? 'over' : ''}`}
                  onDragOver={e => { e.preventDefault(); setOver(true) }} onDragLeave={() => setOver(false)}
                  onDrop={e => { e.preventDefault(); setOver(false); pickVideo(e.dataTransfer.files?.[0]) }}>
                  <Icon name="upload" size={24} />
                  <div style={{ fontWeight: 750 }}>{file ? file.name : lesson.video_file ? 'Boshqa video tanlash' : 'Videoni tanlang yoki shu yerga tashlang'}</div>
                  <div className="text-xs text-muted">
                    {file ? `${(file.size / 1024 / 1024).toFixed(1)} MB — «Saqlash» bosilganda yuklanadi` : 'MP4 yoki WebM, 1 GB gacha'}
                  </div>
                  <input type="file" accept="video/*" hidden onChange={e => pickVideo(e.target.files?.[0])} />
                </label>
                {progress !== null && (
                  <>
                    <div className="cs-upbar"><i style={{ width: `${progress}%` }} /></div>
                    <div className="field-hint" style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Yuklanmoqda… {progress}% — sahifani yopmang</span>
                      <button type="button" className="btn btn-ghost btn-sm" onClick={() => abortRef.current?.abort()}>Bekor qilish</button>
                    </div>
                  </>
                )}
                {!file && lesson.video_file && (
                  <div className="cs-video"><video src={absUrl(lesson.video_file)} controls preload="metadata" /></div>
                )}
              </>
            )}
          </div>

          <div className="cs-g2">
            <div className="field">
              <label className="label">Davomiyligi (daqiqa)</label>
              <input className="input" type="number" min={1} max={600} value={f.duration_minutes} onChange={e => set('duration_minutes', e.target.value)} />
            </div>
            <div className="field">
              <label className="label">Kirish huquqi</label>
              <div className="cs-sw">
                <div><div className="t">Bepul ko'rib chiqish</div><div className="d">Kursga yozilmaganlar ham ko'ra oladi</div></div>
                <label className="switch"><input type="checkbox" checked={f.is_free_preview} onChange={e => set('is_free_preview', e.target.checked)} /><span /></label>
              </div>
            </div>
          </div>

          <div className="field" style={{ marginBottom: 0 }}>
            <label className="label">Dars matni / konspekt</label>
            <RichTextEditor value={f.description} onChange={v => set('description', v)} minHeight={130}
              placeholder="Darsning qisqacha mazmuni, muhim tushunchalar, foydali havolalar…" />
          </div>

          <div className="cs-foot">
            {dirty && <span className="cs-dirty">Saqlanmagan o'zgarishlar bor</span>}
            <span className="sp" />
            <button type="submit" className="btn btn-primary" disabled={busy || !dirty}>{busy ? 'Saqlanmoqda…' : 'Darsni saqlash'}</button>
          </div>
        </>
      )}
    </form>
  )
}

/* ─────────────────────────── Test panel ─────────────────────────── */

function TestPanel({ testId, onChanged, onDelete, onDuplicate }) {
  return (
    <div className="cs-panel fade-up">
      <div className="cs-ph">
        <span className="pi" style={{ background: '#DAD0FF' }}><Icon name="fileText" size={21} /></span>
        <div>
          <h2>Test</h2>
          <p>Savollar, sozlamalar va o'quvchilar natijalari</p>
        </div>
        <span className="sp" />
        <button type="button" className="btn btn-ghost btn-sm" onClick={onDuplicate}><Icon name="file" size={14} /> Nusxa</button>
        <button type="button" className="btn btn-ghost btn-sm" style={{ color: 'var(--red-600)' }} onClick={onDelete}><Icon name="trash" size={14} /> O'chirish</button>
      </div>
      <TestEditor key={testId} testId={testId} onChanged={onChanged} />
    </div>
  )
}

/* ─────────────────────────── Publish panel ─────────────────────────── */

function PublishPanel({ course, tree, isAdmin, onChanged, goTo }) {
  const [busy, setBusy] = useState(false)
  const items = tree.flatMap(s => s.items)
  const lessons = items.filter(i => i.kind === 'lesson')
  const tests = items.filter(i => i.kind === 'test')
  const emptyTests = tests.filter(t => !t.question_count)
  const emptySections = tree.filter(s => s.items.length === 0)
  const plainDesc = (course.description || '').replace(/<[^>]+>/g, '').trim()

  const checks = [
    { ok: course.title.trim().length >= 3, req: true, t: 'Kurs nomi', d: course.title, go: 'info' },
    { ok: plainDesc.length >= 40, req: true, t: 'Tavsif (kamida 40 ta belgi)', d: plainDesc ? `${plainDesc.length} ta belgi` : "Tavsif yozilmagan", go: 'info' },
    { ok: !!course.category, req: false, t: 'Kategoriya', d: course.category?.name || "Tanlanmagan — katalogda topish qiyinlashadi", go: 'info' },
    { ok: lessons.length >= 1, req: true, t: 'Kamida bitta dars', d: `${tree.length} bo'lim · ${lessons.length} dars · ${tests.length} test` },
    { ok: emptySections.length === 0, req: false, t: "Bo'sh bo'limlar yo'q", d: emptySections.length ? `Bo'sh: ${emptySections.map(s => s.title).join(', ')}` : "Hamma bo'limda kontent bor" },
    { ok: emptyTests.length === 0, req: true, t: 'Har bir testda savol bor', d: emptyTests.length ? `Savolsiz: ${emptyTests.map(t => t.title).join(', ')}` : tests.length ? 'Hammasi tayyor' : "Kursda test yo'q", go: emptyTests[0] ? { kind: 'test', id: emptyTests[0].id } : null },
  ]
  const blocking = checks.filter(c => c.req && !c.ok)
  const ready = blocking.length === 0
  const minutes = lessons.reduce((s, l) => s + (l.duration_minutes || 0), 0)

  async function setStatus(status, msg) {
    setBusy(true)
    try {
      await api.patch(`/courses/${course.slug}/`, { status })
      toast.success(msg)
      onChanged()
    } catch (e) { toast.error(errMsg(e, 'Holatni o\'zgartirishda xatolik')) }
    finally { setBusy(false) }
  }

  return (
    <div className="cs-panel fade-up">
      <div className="cs-ph">
        <span className="pi" style={{ background: '#8FE0B4' }}><Icon name="zap" size={21} /></span>
        <div>
          <h2>Nashr etish</h2>
          <p>Kursni tekshirib, o'quvchilarga oching</p>
        </div>
        <span className="sp" />
        <CourseStatus status={course.status} />
      </div>

      {course.status === 'rejected' && course.rejection_note && (
        <div className="cs-note red"><Icon name="alert" size={18} /><div><strong>Moderator izohi:</strong> {course.rejection_note}</div></div>
      )}
      {course.status === 'pending' && (
        <div className="cs-note amber"><Icon name="clock" size={18} /><div>Kurs moderatsiyada. Administrator ko'rib chiqqach bildirishnoma olasiz. Shu vaqt ichida ham tahrirlashingiz mumkin.</div></div>
      )}
      {course.status === 'published' && (
        <div className="cs-note green"><Icon name="checkC" size={18} /><div>Kurs nashr etilgan va katalogda ko'rinadi. O'zgarishlar darhol o'quvchilarga yetib boradi.</div></div>
      )}

      <div className="cs-stats">
        <div className="cs-stat"><div className="v">{tree.length}</div><div className="l">Bo'lim</div></div>
        <div className="cs-stat"><div className="v">{lessons.length}</div><div className="l">Dars</div></div>
        <div className="cs-stat"><div className="v">{tests.length}</div><div className="l">Test</div></div>
        <div className="cs-stat"><div className="v">{minutes >= 60 ? `${Math.floor(minutes / 60)}s ${minutes % 60}d` : `${minutes}d`}</div><div className="l">Umumiy vaqt</div></div>
      </div>

      <h3 style={{ fontSize: 16, marginBottom: 4 }}>Tayyorlik ro'yxati</h3>
      {checks.map((c, i) => (
        <div key={i} className={`cs-check ${c.ok ? 'ok' : c.req ? 'no' : 'opt'}`}>
          <span className="ci"><Icon name={c.ok ? 'check' : c.req ? 'x' : 'alert'} size={15} /></span>
          <div style={{ minWidth: 0 }}>
            <div className="ct">{c.t}{!c.req && <span className="text-muted" style={{ fontWeight: 500 }}> · tavsiya</span>}</div>
            <div className="cd">{c.d}</div>
          </div>
          {!c.ok && c.go && <button className="btn btn-secondary btn-sm" onClick={() => goTo(c.go)}>Tuzatish</button>}
        </div>
      ))}

      <div className="cs-foot">
        <Link to={`/courses/${course.slug}`} target="_blank" className="btn btn-secondary"><Icon name="eye" size={15} /> Kurs sahifasini ko'rish</Link>
        <span className="sp" />
        {!ready && <span className="cs-dirty">{blocking.length} ta majburiy band bajarilmagan</span>}
        {course.status === 'published' && (
          <button className="btn btn-secondary" disabled={busy} onClick={() => setStatus('draft', 'Kurs qoralamaga qaytarildi')}>Qoralamaga qaytarish</button>
        )}
        {course.status === 'pending' && !isAdmin && (
          <button className="btn btn-secondary" disabled={busy} onClick={() => setStatus('draft', "So'rov qaytarib olindi")}>So'rovni qaytarib olish</button>
        )}
        {isAdmin && course.status !== 'published' && (
          <button className="btn btn-primary" disabled={busy || !ready} onClick={() => setStatus('published', 'Kurs nashr etildi')}>
            <Icon name="zap" size={15} /> Nashr etish
          </button>
        )}
        {!isAdmin && (course.status === 'draft' || course.status === 'rejected') && (
          <button className="btn btn-primary" disabled={busy || !ready} onClick={() => setStatus('pending', 'Kurs moderatsiyaga yuborildi')}>
            <Icon name="arrowR" size={15} /> Moderatsiyaga yuborish
          </button>
        )}
      </div>
    </div>
  )
}

/* ─────────────────────────── Studio ─────────────────────────── */

export default function CourseBuilder() {
  const { slug } = useParams()
  const loc = useLocation()
  const qc = useQueryClient()
  const { user } = useAuth()
  const adminArea = loc.pathname.startsWith('/admin-panel')
  const isAdmin = user?.role === 'admin'
  const base = adminArea ? '/admin-panel' : '/teacher'

  const [tree, setTree] = useState([])
  const [sel, setSel] = useState('info')        // 'info' | 'publish' | { kind, id }
  const [saving, setSaving] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [drag, setDrag] = useState(null)        // { type: 'item'|'section', kind, id }
  const [dropAt, setDropAt] = useState(null)    // { sectionId, index } | { before: sectionId, pos }
  const [confirm, setConfirm] = useState(null)  // { title, text, action, danger }
  const [pendingSel, setPendingSel] = useState(null)
  const [collapsed, setCollapsed] = useState({})
  const [outlineOpen, setOutlineOpen] = useState(true)
  const [busyConfirm, setBusyConfirm] = useState(false)
  const pendingRef = useRef(null)
  const sendingRef = useRef(false)

  const { data: course, isLoading, isError } = useQuery({
    queryKey: ['studio-course', slug],
    queryFn: () => api.get(`/courses/${slug}/`).then(r => r.data),
    enabled: !!slug,
    retry: false,
  })

  // Server → local outline (kept local so drag & drop feels instant).
  useEffect(() => {
    if (!course) return
    setTree(course.sections.map(s => ({
      id: s.id, title: s.title,
      items: s.items || [
        ...(s.lessons || []).map(l => ({ kind: 'lesson', ...l })),
        ...(s.tests || []).map(t => ({ kind: 'test', ...t })),
      ],
    })))
  }, [course])

  // Warn before closing the tab with unsaved edits.
  useEffect(() => {
    if (!dirty) return
    const h = (e) => { e.preventDefault(); e.returnValue = '' }
    window.addEventListener('beforeunload', h)
    return () => window.removeEventListener('beforeunload', h)
  }, [dirty])

  const reload = () => {
    qc.invalidateQueries({ queryKey: ['studio-course', slug] })
    qc.invalidateQueries({ queryKey: ['my-teaching'] })
    qc.invalidateQueries({ queryKey: ['course', slug] })
  }

  const counts = useMemo(() => {
    const items = tree.flatMap(s => s.items)
    return { lessons: items.filter(i => i.kind === 'lesson').length, tests: items.filter(i => i.kind === 'test').length }
  }, [tree])

  const isSel = (kind, id) => typeof sel === 'object' && sel.kind === kind && sel.id === id

  /** Change selection, asking first if the open form has unsaved edits. */
  function select(next) {
    if (dirty) { setPendingSel(next); return }
    setSel(next)
    if (window.innerWidth <= 1180) setOutlineOpen(false)
  }

  // Reorders are sent strictly one after another, and only the newest
  // arrangement is sent — quick successive moves can never overwrite each
  // other out of order on the server.
  async function persist(next, { silent } = {}) {
    setTree(next)
    pendingRef.current = next
    if (sendingRef.current) return
    sendingRef.current = true
    setSaving(true)
    try {
      while (pendingRef.current) {
        const t = pendingRef.current
        pendingRef.current = null
        await api.post(`/courses/${slug}/structure/`, {
          sections: t.map(s => ({ id: s.id, items: s.items.map(i => ({ kind: i.kind, id: i.id })) })),
        })
      }
      if (!silent) reload()
    } catch (e) {
      pendingRef.current = null
      toast.error(errMsg(e, "Tartibni saqlab bo'lmadi"), { duration: 6000 })
      reload()
    } finally {
      sendingRef.current = false
      setSaving(false)
    }
  }

  /* ── sections ── */
  async function addSection() {
    try {
      const { data } = await api.post(`/courses/${slug}/sections/`, { title: `${tree.length + 1}-bo'lim` })
      setTree(t => [...t, { id: data.id, title: data.title, items: [] }])
      reload()
      requestAnimationFrame(() => {
        const el = document.getElementById(`cs-sec-${data.id}`)
        el?.focus(); el?.select()
      })
    } catch (e) { toast.error(errMsg(e, "Bo'lim qo'shib bo'lmadi")) }
  }
  async function renameSection(id, title) {
    const cur = tree.find(s => s.id === id)
    const clean = title.trim()
    if (!cur || !clean || clean === cur.title) {
      if (!clean) setTree(t => t.map(s => s.id === id ? { ...s } : s))
      return
    }
    setTree(t => t.map(s => s.id === id ? { ...s, title: clean } : s))
    try { await api.patch(`/sections/${id}/`, { title: clean }); reload() }
    catch (e) { toast.error(errMsg(e, "Nomini saqlab bo'lmadi")); reload() }
  }
  function moveSection(i, dir) {
    const j = i + dir
    if (j < 0 || j >= tree.length) return
    const next = [...tree]
    ;[next[i], next[j]] = [next[j], next[i]]
    persist(next)
  }
  function askDeleteSection(s) {
    setConfirm({
      danger: true, title: "Bo'limni o'chirish",
      text: s.items.length
        ? `«${s.title}» bo'limi ichidagi ${s.items.length} ta dars/test bilan birga o'chiriladi. Bu amalni qaytarib bo'lmaydi.`
        : `«${s.title}» bo'limi o'chiriladi.`,
      action: async () => {
        await api.delete(`/sections/${s.id}/`)
        if (typeof sel === 'object' && s.items.some(i => i.kind === sel.kind && i.id === sel.id)) { setDirty(false); setSel('info') }
        toast.success("Bo'lim o'chirildi"); reload()
      },
    })
  }

  /* ── items ── */
  async function addItem(kind, sectionId, index) {
    try {
      const { data } = kind === 'lesson'
        ? await api.post(`/sections/${sectionId}/lessons/`, { title: 'Yangi dars', video_type: 'youtube', duration_minutes: 10 })
        : await api.post('/tests/', { title: 'Yangi test', section: sectionId, pass_percent: 60 })
      const item = kind === 'lesson'
        ? { kind, id: data.id, title: data.title, duration_minutes: data.duration_minutes, video_type: 'youtube', _new: true }
        : { kind, id: data.id, title: data.title, question_count: 0, pass_percent: 60 }
      const next = tree.map(s => {
        if (s.id !== sectionId) return s
        const items = [...s.items]
        items.splice(index ?? items.length, 0, item)
        return { ...s, items }
      })
      setCollapsed(c => ({ ...c, [sectionId]: false }))
      await persist(next)
      setDirty(false)
      setSel({ kind, id: data.id })
      if (window.innerWidth <= 1180) setOutlineOpen(false)
    } catch (e) { toast.error(errMsg(e, kind === 'lesson' ? "Dars qo'shib bo'lmadi" : "Test qo'shib bo'lmadi")) }
  }
  function moveItem(sectionId, i, dir) {
    const si = tree.findIndex(s => s.id === sectionId)
    const next = tree.map(s => ({ ...s, items: [...s.items] }))
    const items = next[si].items
    const j = i + dir
    if (j >= 0 && j < items.length) {
      ;[items[i], items[j]] = [items[j], items[i]]
    } else {
      // Hop into the neighbouring section.
      const ti = si + dir
      if (ti < 0 || ti >= next.length) return
      const [it] = items.splice(i, 1)
      if (dir < 0) next[ti].items.push(it); else next[ti].items.unshift(it)
      setCollapsed(c => ({ ...c, [next[ti].id]: false }))
    }
    persist(next)
  }
  function askDeleteItem(it) {
    setConfirm({
      danger: true, title: it.kind === 'lesson' ? "Darsni o'chirish" : "Testni o'chirish",
      text: it.kind === 'lesson'
        ? `«${it.title}» darsi videosi, materiallari va o'quvchilar progressi bilan birga o'chiriladi.`
        : `«${it.title}» testi barcha savollari va o'quvchilar natijalari bilan birga o'chiriladi.`,
      action: async () => {
        await api.delete(it.kind === 'lesson' ? `/lessons/${it.id}/` : `/tests/${it.id}/`)
        if (isSel(it.kind, it.id)) { setDirty(false); setSel('info') }
        toast.success("O'chirildi"); reload()
      },
    })
  }
  async function duplicateItem(it) {
    try {
      const { data } = await api.post(it.kind === 'lesson' ? `/lessons/${it.id}/duplicate/` : `/tests/${it.id}/duplicate/`)
      // Place the copy right after the original.
      const next = tree.map(s => {
        const i = s.items.findIndex(x => x.kind === it.kind && x.id === it.id)
        if (i < 0) return s
        const items = [...s.items]
        items.splice(i + 1, 0, { ...it, id: data.id, title: data.title })
        return { ...s, items }
      })
      await persist(next)
      toast.success('Nusxa yaratildi')
      setDirty(false)
      setSel({ kind: it.kind, id: data.id })
    } catch (e) { toast.error(errMsg(e, "Nusxalab bo'lmadi")) }
  }

  /* ── drag & drop ── */
  function endDrag() { setDrag(null); setDropAt(null) }
  function dropItem() {
    if (!drag || drag.type !== 'item' || !dropAt || dropAt.sectionId == null) return endDrag()
    let moved = null
    let fromSection = null
    let fromIndex = -1
    tree.forEach(s => {
      const i = s.items.findIndex(x => x.kind === drag.kind && x.id === drag.id)
      if (i >= 0) { moved = s.items[i]; fromSection = s.id; fromIndex = i }
    })
    if (!moved) return endDrag()
    let index = dropAt.index
    if (fromSection === dropAt.sectionId) {
      if (index === fromIndex || index === fromIndex + 1) return endDrag() // dropped in place
      if (index > fromIndex) index -= 1
    }
    const next = tree.map(s => ({ ...s, items: s.items.filter(x => !(x.kind === drag.kind && x.id === drag.id)) }))
    next.find(s => s.id === dropAt.sectionId).items.splice(index, 0, moved)
    endDrag()
    persist(next)
  }
  function dropSection() {
    if (!drag || drag.type !== 'section' || !dropAt || dropAt.before == null || dropAt.before === drag.id) return endDrag()
    const moved = tree.find(s => s.id === drag.id)
    const rest = tree.filter(s => s.id !== drag.id)
    let at = rest.findIndex(s => s.id === dropAt.before)
    if (dropAt.pos === 'bot') at += 1
    rest.splice(at, 0, moved)
    endDrag()
    persist(rest)
  }

  const gap = (sectionId, index) => {
    const active = drag?.type === 'item' && dropAt?.sectionId === sectionId && dropAt?.index === index
    return (
      <div className={`cs-gap ${active ? 'drop' : ''}`}
        onDragOver={e => { if (drag?.type !== 'item') return; e.preventDefault(); e.stopPropagation(); if (!active) setDropAt({ sectionId, index }) }}
        onDrop={e => { if (drag?.type !== 'item') return; e.preventDefault(); e.stopPropagation(); dropItem() }}>
        <span className="ins">
          <button type="button" className="cs-ins" onClick={() => addItem('lesson', sectionId, index)}><Icon name="plus" size={10} /> Dars</button>
          <button type="button" className="cs-ins" onClick={() => addItem('test', sectionId, index)}><Icon name="plus" size={10} /> Test</button>
        </span>
      </div>
    )
  }

  /* ── render ── */
  const shell = (children) => (
    <DashLayout kind={adminArea ? 'admin' : 'teacher'}>
      <style>{css}</style>
      {children}
    </DashLayout>
  )

  if (!slug) {
    return shell(
      <>
        <div className="cs-top">
          <Link to={`${base}/courses`} className="cs-back" aria-label="Orqaga"><Icon name="arrowL" size={18} /></Link>
          <h1>Yangi kurs</h1>
        </div>
        <div style={{ maxWidth: 860 }}><CourseInfoPanel course={null} onDirty={setDirty} /></div>
      </>,
    )
  }
  if (isLoading) return shell(<div className="loading-state"><span className="spinner" />Kurs yuklanmoqda…</div>)
  if (isError || !course) {
    return shell(<EmptyState icon="alert" title="Kurs topilmadi" sub="U o'chirilgan yoki sizga tegishli emas."
      action={<Link to={`${base}/courses`} className="btn btn-secondary btn-sm"><Icon name="arrowL" size={13} /> Kurslarga qaytish</Link>} />)
  }

  const selItem = typeof sel === 'object'
    ? tree.flatMap(s => s.items).find(i => i.kind === sel.kind && i.id === sel.id)
    : null

  return shell(
    <>
      <div className="cs-top">
        <Link to={`${base}/courses`} className="cs-back" aria-label="Kurslarga qaytish"><Icon name="arrowL" size={18} /></Link>
        <h1 title={course.title}>{course.title}</h1>
        <CourseStatus status={course.status} />
        <span className="sp" />
        <span className={`cs-saved ${saving ? 'busy' : ''}`}>
          <Icon name={saving ? 'rotate' : 'check'} size={13} /> {saving ? 'SAQLANMOQDA…' : 'TARTIB SAQLANGAN'}
        </span>
        <Link to={`/courses/${course.slug}`} target="_blank" className="btn btn-secondary btn-sm"><Icon name="eye" size={14} /> Ko'rish</Link>
        <button className="btn btn-primary btn-sm" onClick={() => select('publish')}><Icon name="zap" size={14} /> Nashr</button>
      </div>

      <div className="cs-grid">
        {/* ───── Outline ───── */}
        <aside className={`cs-out ${outlineOpen ? '' : 'collapsed'} ${drag ? 'cs-dragging' : ''}`}>
          <div className="cs-out-head">
            <button className={`cs-nav ${sel === 'info' ? 'on' : ''}`} onClick={() => select('info')}>
              <span className="ni"><Icon name="book" size={15} /></span> Kurs ma'lumotlari
            </button>
            <button className={`cs-nav ${sel === 'publish' ? 'on' : ''}`} onClick={() => select('publish')}>
              <span className="ni"><Icon name="zap" size={15} /></span> Nashr etish
              <span className="nb">{counts.lessons} dars · {counts.tests} test</span>
            </button>
            <button className="cs-nav cs-mobile-toggle" onClick={() => setOutlineOpen(o => !o)}>
              <span className="ni"><Icon name="list" size={15} /></span> Kurs tuzilmasi
              <span className="nb"><Icon name={outlineOpen ? 'chevU' : 'chevD'} size={15} /></span>
            </button>
          </div>

          <div className="cs-out-body" onDragOver={e => { if (drag) e.preventDefault() }}>
            {tree.length === 0 && (
              <EmptyState small icon="layout" title="Tuzilma bo'sh" sub="Birinchi bo'limni qo'shing, so'ng unga darslar va testlar joylang." />
            )}
            {tree.map((s, si) => {
              const secOver = drag?.type === 'section' && dropAt?.before === s.id && drag.id !== s.id
              const closed = collapsed[s.id]
              return (
                <div key={s.id}
                  className={`cs-sec ${drag?.type === 'section' && drag.id === s.id ? 'dragging' : ''} ${secOver ? (dropAt.pos === 'top' ? 'over-top' : 'over-bot') : ''}`}
                  onDragOver={e => {
                    if (drag?.type === 'section') {
                      e.preventDefault()
                      const r = e.currentTarget.getBoundingClientRect()
                      const pos = e.clientY < r.top + r.height / 2 ? 'top' : 'bot'
                      if (dropAt?.before !== s.id || dropAt?.pos !== pos) setDropAt({ before: s.id, pos })
                    } else if (drag?.type === 'item') {
                      // Hovering the section itself (header / empty area) → append.
                      e.preventDefault()
                      if (dropAt?.sectionId !== s.id) setDropAt({ sectionId: s.id, index: s.items.length })
                    }
                  }}
                  onDrop={e => { e.preventDefault(); if (drag?.type === 'section') dropSection(); else dropItem() }}>
                  <div className="cs-sec-head">
                    <span className="cs-grip" draggable title="Bo'limni sudrang"
                      onDragStart={e => { e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', `s${s.id}`); setDrag({ type: 'section', id: s.id }) }}
                      onDragEnd={endDrag}><Icon name="drag" size={16} /></span>
                    <span className="cs-sec-n">{String(si + 1).padStart(2, '0')}</span>
                    <input id={`cs-sec-${s.id}`} className="cs-sec-title" defaultValue={s.title} key={s.title} maxLength={200}
                      aria-label="Bo'lim nomi"
                      onBlur={e => { if (!e.target.value.trim()) e.target.value = s.title; renameSection(s.id, e.target.value) }}
                      onKeyDown={e => { if (e.key === 'Enter') e.target.blur(); if (e.key === 'Escape') { e.target.value = s.title; e.target.blur() } }} />
                    <button className="cs-mini" title="Yuqoriga" disabled={si === 0} onClick={() => moveSection(si, -1)}><Icon name="chevU" size={14} /></button>
                    <button className="cs-mini" title="Pastga" disabled={si === tree.length - 1} onClick={() => moveSection(si, 1)}><Icon name="chevD" size={14} /></button>
                    <button className="cs-mini danger" title="Bo'limni o'chirish" onClick={() => askDeleteSection(s)}><Icon name="trash" size={14} /></button>
                    <button className="cs-mini" title={closed ? 'Ochish' : 'Yig\'ish'} onClick={() => setCollapsed(c => ({ ...c, [s.id]: !closed }))}>
                      <Icon name={closed ? 'chevR' : 'chevD'} size={15} />
                    </button>
                  </div>

                  {!closed && (
                    <div className="cs-items">
                      {s.items.length === 0 && <div className="cs-empty">Bo'lim bo'sh — dars yoki test qo'shing</div>}
                      {s.items.map((it, i) => (
                        <div key={`${it.kind}-${it.id}`}>
                          {gap(s.id, i)}
                          <div className={`cs-item ${isSel(it.kind, it.id) ? 'on' : ''} ${drag?.type === 'item' && drag.kind === it.kind && drag.id === it.id ? 'dragging' : ''}`}
                            onClick={() => select({ kind: it.kind, id: it.id })}
                            onDragOver={e => {
                              if (drag?.type !== 'item') return
                              e.preventDefault(); e.stopPropagation()
                              const r = e.currentTarget.getBoundingClientRect()
                              const index = e.clientY < r.top + r.height / 2 ? i : i + 1
                              if (dropAt?.sectionId !== s.id || dropAt?.index !== index) setDropAt({ sectionId: s.id, index })
                            }}
                            onDrop={e => { if (drag?.type !== 'item') return; e.preventDefault(); e.stopPropagation(); dropItem() }}>
                            <span className="cs-grip" draggable title="Sudrab istalgan joyga qo'ying" onClick={e => e.stopPropagation()}
                              onDragStart={e => { e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', `${it.kind}${it.id}`); setDrag({ type: 'item', kind: it.kind, id: it.id }) }}
                              onDragEnd={endDrag}><Icon name="drag" size={15} /></span>
                            <span className={`cs-ico ${it.kind}`}><Icon name={it.kind === 'lesson' ? 'play' : 'fileText'} size={14} /></span>
                            <span className="tt">
                              <span className="tn" style={{ display: 'block' }}>{it.title}</span>
                              <span className="tm">
                                {it.kind === 'lesson'
                                  ? <>{it.duration_minutes} daq{it.is_free_preview && ' · bepul'}</>
                                  : it.question_count
                                    ? <>{it.question_count} savol · o'tish {it.pass_percent}%</>
                                    : <span className="warn">Savol qo'shilmagan</span>}
                              </span>
                            </span>
                            <span className="acts" onClick={e => e.stopPropagation()}>
                              <button className="cs-mini" title="Yuqoriga" disabled={si === 0 && i === 0} onClick={() => moveItem(s.id, i, -1)}><Icon name="chevU" size={13} /></button>
                              <button className="cs-mini" title="Pastga" disabled={si === tree.length - 1 && i === s.items.length - 1} onClick={() => moveItem(s.id, i, 1)}><Icon name="chevD" size={13} /></button>
                            </span>
                          </div>
                        </div>
                      ))}
                      {gap(s.id, s.items.length)}
                      <div className="cs-add">
                        <button type="button" onClick={() => addItem('lesson', s.id)}><Icon name="plus" size={13} /> Dars</button>
                        <button type="button" onClick={() => addItem('test', s.id)}><Icon name="plus" size={13} /> Test</button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          <div className="cs-out-foot">
            <button className="btn btn-secondary btn-block btn-sm" onClick={addSection}><Icon name="plus" size={14} /> Bo'lim qo'shish</button>
          </div>
        </aside>

        {/* ───── Editor ───── */}
        <div style={{ minWidth: 0 }}>
          {sel === 'info' && <CourseInfoPanel key={course.id} course={course} onSaved={() => { setDirty(false); reload() }} onDirty={setDirty} />}
          {sel === 'publish' && <PublishPanel course={course} tree={tree} isAdmin={isAdmin} onChanged={reload} goTo={select} />}
          {typeof sel === 'object' && sel.kind === 'lesson' && (
            <LessonPanel key={sel.id} lessonId={sel.id} onDirty={setDirty}
              onSaved={() => { setDirty(false); reload() }}
              onDelete={() => selItem && askDeleteItem(selItem)}
              onDuplicate={() => selItem && duplicateItem(selItem)} />
          )}
          {typeof sel === 'object' && sel.kind === 'test' && (
            <TestPanel key={sel.id} testId={sel.id} onChanged={reload}
              onDelete={() => selItem && askDeleteItem(selItem)}
              onDuplicate={() => selItem && duplicateItem(selItem)} />
          )}
        </div>
      </div>

      {confirm && (
        <Confirm danger={confirm.danger} title={confirm.title} text={confirm.text} confirmLabel="O'chirish" busy={busyConfirm}
          onClose={() => setConfirm(null)}
          onConfirm={async () => {
            setBusyConfirm(true)
            try { await confirm.action(); setConfirm(null) }
            catch (e) { toast.error(errMsg(e, "Amalni bajarib bo'lmadi")) }
            finally { setBusyConfirm(false) }
          }} />
      )}
      {pendingSel && (
        <Confirm title="Saqlanmagan o'zgarishlar" icon="alert" confirmLabel="Saqlamasdan o'tish" cancelLabel="Qolish"
          text="Ochiq formadagi o'zgarishlar saqlanmagan. Boshqa bo'limga o'tsangiz, ular yo'qoladi."
          onClose={() => setPendingSel(null)}
          onConfirm={() => { setDirty(false); setSel(pendingSel); setPendingSel(null) }} />
      )}
    </>,
  )
}
