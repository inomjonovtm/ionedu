import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import api, { absUrl } from '../../api/client'
import DashLayout from '../../components/DashLayout'
import Icon from '../../components/Icon'
import FileInput from '../../components/FileInput'
import LessonMaterialsManager from '../../components/LessonMaterialsManager'
import RichTextEditor from '../../components/RichTextEditor'
import { useAuth } from '../../store/auth'

const STEPS = ["Asosiy ma'lumot", "Bo'limlar, darslar va testlar", "Ko'rib chiqish"]
const EMOJIS = ['🌍', '🏔️', '🗺️', '🌋', '🌐', '🌾', '💨', '🌊', '🐪', '🌡️']
const COLORS = ['blue', 'green', 'amber', 'rose', 'teal', 'violet', 'slate']

const gfsStyles = `
  /* ── Studio layout: sticky sidebar + content ── */
  .cb-layout { display: grid; grid-template-columns: 290px minmax(0, 1fr); gap: 22px; align-items: start; margin-top: 18px; }
  .cb-side { position: sticky; top: 84px; display: flex; flex-direction: column; gap: 14px; }
  .cb-preview { background: var(--white); border: 1px solid var(--border); border-radius: var(--r-card); overflow: hidden; }
  .cb-preview .pthumb { aspect-ratio: 16/9; display: flex; align-items: center; justify-content: center; font-size: 46px; }
  .cb-preview .pthumb img { width: 100%; height: 100%; object-fit: cover; }
  .cb-preview .pbody { padding: 14px 16px 16px; }
  .cb-preview .ptitle { font-weight: 650; font-size: 15px; letter-spacing: -0.015em; line-height: 1.35; word-break: break-word; }
  .cb-steps { background: var(--white); border: 1px solid var(--border); border-radius: var(--r-card); padding: 8px; }
  .cb-step {
    display: flex; gap: 12px; width: 100%; padding: 12px; align-items: flex-start;
    border: none; background: transparent; border-radius: 12px; cursor: pointer; text-align: left;
    transition: background .12s; position: relative;
  }
  .cb-step:hover { background: var(--bg-soft); }
  .cb-step.active { background: var(--green-50); }
  .cb-step.locked { opacity: .5; cursor: not-allowed; }
  .cb-step .num {
    width: 30px; height: 30px; border-radius: 999px; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
    font-family: var(--font-mono); font-weight: 560; font-size: 12px;
    border: 1.5px solid var(--border); background: var(--white); color: var(--text-3);
    transition: all .15s;
  }
  .cb-step.active .num { background: var(--green-600); border-color: var(--green-600); color: white; }
  .cb-step.done .num { background: var(--green-50); border-color: var(--green-200); color: var(--green-700); }
  .cb-step .t { font-size: 13.5px; font-weight: 600; color: var(--text-2); }
  .cb-step.active .t { color: var(--green-800); }
  .cb-step .d { font-size: 11.5px; color: var(--text-4); margin-top: 2px; line-height: 1.4; }
  .cb-side-actions { display: flex; flex-direction: column; gap: 8px; }
  .cb-main { min-width: 0; }
  @media (max-width: 1100px) {
    .cb-layout { grid-template-columns: 1fr; }
    .cb-side { position: static; }
    .cb-preview { display: none; }
    .cb-steps { display: flex; gap: 4px; }
    .cb-step { flex: 1; flex-direction: column; gap: 8px; align-items: center; text-align: center; }
    .cb-step .d { display: none; }
    .cb-side-actions { flex-direction: row; }
  }

  /* Google-Forms-style cards */
  .gf-card {
    background: var(--white); border: 1px solid var(--border); border-radius: var(--r-card);
    margin-bottom: 14px;
    transition: box-shadow .15s ease, border-color .15s ease;
    position: relative;
    overflow: hidden;
  }
  .gf-card.focused {
    box-shadow: var(--shadow-hover);
    border-color: var(--green-300);
  }
  .gf-card.focused::before {
    content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 4px;
    background: var(--green-600);
  }
  .gf-section-head {
    display: flex; align-items: center; gap: 12px;
    padding: 16px 20px 16px 24px;
    cursor: pointer;
  }
  .gf-section-num {
    width: 30px; height: 30px; border-radius: 9px;
    background: var(--green-50); color: var(--green-700);
    box-shadow: inset 0 0 0 1px var(--green-100);
    display: flex; align-items: center; justify-content: center;
    font-family: var(--font-mono); font-weight: 560; font-size: 12px;
    flex-shrink: 0;
  }
  .gf-section-title {
    flex: 1; font-weight: 600; font-size: 16px; color: var(--text);
    border: none; outline: none; background: transparent;
    padding: 4px 8px; margin: -4px -8px;
    border-radius: 6px;
    transition: background .12s;
  }
  .gf-section-title:focus { background: var(--bg-soft); }
  .gf-section-meta {
    font-size: 12px; color: var(--text-3); padding: 2px 8px;
    background: var(--bg-soft); border-radius: 999px;
  }
  .gf-section-body {
    padding: 4px 12px 12px;
    border-top: 1px solid var(--border-2);
    background: linear-gradient(to bottom, var(--bg-soft) 0%, transparent 60px);
  }

  /* Lesson row — collapsed */
  .gf-lesson { margin: 8px 4px; }
  .gf-lesson-row {
    display: flex; align-items: center; gap: 12px;
    padding: 12px 14px; border-radius: 10px;
    background: var(--white); border: 1px solid var(--border);
    transition: all .12s;
  }
  .gf-lesson-row:hover { border-color: var(--green-300); transform: translateY(-1px); }
  .gf-lesson-icon {
    width: 30px; height: 30px; border-radius: 8px;
    background: var(--green-50); color: var(--green-600);
    display: flex; align-items: center; justify-content: center; flex-shrink: 0;
  }
  .gf-lesson-icon.test { background: var(--blue-50); color: var(--blue-600); }
  .gf-lesson-title { flex: 1; font-size: 14px; font-weight: 500; }
  .gf-lesson-meta { font-size: 12px; color: var(--text-3); }

  /* Lesson row — expanded inline form */
  .gf-lesson-form {
    background: var(--white); border: 2px solid var(--green-600); border-radius: 12px;
    padding: 22px;
    margin: 8px 4px;
    animation: gfIn .2s ease-out;
    box-shadow: 0 10px 24px -10px rgba(14,131,69,0.2);
  }
  @keyframes gfIn { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: none; } }
  .gf-form-head {
    display: flex; align-items: center; gap: 10px;
    margin-bottom: 16px;
  }
  .gf-form-head .badge-mini {
    padding: 3px 11px; border-radius: 999px;
    background: var(--green-50); color: var(--green-700);
    box-shadow: inset 0 0 0 1px var(--green-100);
    font-family: var(--font-mono);
    font-size: 10px; font-weight: 500; letter-spacing: 0.1em; text-transform: uppercase;
  }
  .gf-form-head .badge-mini.test { background: var(--blue-50); color: var(--blue-600); }
  .gf-input-lg {
    width: 100%; padding: 12px 14px; font-size: 16px; font-weight: 500;
    border: none; outline: none;
    border-bottom: 1.5px solid var(--border);
    background: transparent;
    transition: border-color .12s;
  }
  .gf-input-lg:focus { border-bottom-color: var(--green-600); }

  /* Add lesson/test toolbar at bottom of section */
  .gf-add-row {
    display: flex; gap: 8px; padding: 10px 4px;
    border-top: 1px dashed var(--border);
    margin-top: 4px;
  }
  .gf-add-btn {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 8px 14px; border-radius: 8px;
    background: var(--white); border: 1px solid var(--border);
    color: var(--text-2); font-size: 13px; font-weight: 500; cursor: pointer;
    transition: all .12s;
  }
  .gf-add-btn:hover { border-color: var(--green-600); color: var(--green-700); background: var(--green-50); }

  /* "Add section" floating button */
  .gf-add-section {
    display: flex; align-items: center; gap: 10px; justify-content: center;
    width: 100%; padding: 16px;
    background: var(--white); border: 1.5px dashed var(--border); border-radius: 14px;
    color: var(--text-3); font-size: 14px; font-weight: 500; cursor: pointer;
    transition: all .15s;
  }
  .gf-add-section:hover {
    border-color: var(--green-600); color: var(--green-700); background: var(--green-50);
    transform: translateY(-1px);
  }

  /* Tab pills for lesson form */
  .gf-tabs {
    display: inline-flex; gap: 2px;
    background: var(--bg-soft); border-radius: 10px; padding: 3px;
    margin-bottom: 14px;
  }
  .gf-tabs button {
    padding: 7px 14px; border-radius: 8px; font-size: 13px; font-weight: 500;
    color: var(--text-3); background: transparent; border: none; cursor: pointer;
  }
  .gf-tabs button.active { background: var(--white); color: var(--green-700); box-shadow: 0 1px 3px rgba(0,0,0,0.06); }

  /* Question card */
  .gf-q-card {
    background: var(--white); border: 1px solid var(--border); border-radius: 12px;
    padding: 18px; margin-bottom: 12px;
    transition: all .12s;
  }
  .gf-q-card:hover { border-color: var(--green-300); box-shadow: 0 4px 12px -6px rgba(0,0,0,0.06); }
  .gf-q-card.focused { border-color: var(--green-600); box-shadow: 0 6px 18px -8px rgba(14,131,69,0.18); }
  .gf-q-opts { display: flex; flex-direction: column; gap: 8px; }
  .gf-q-opt {
    display: flex; align-items: center; gap: 12px;
    padding: 10px 14px;
    border: 1px solid var(--border); border-radius: 10px;
    background: var(--white);
  }
  .gf-q-opt.correct { border-color: var(--green-600); background: var(--green-50); }
  .gf-q-opt-marker {
    width: 26px; height: 26px; border-radius: 999px;
    border: 1.5px solid var(--border);
    color: var(--text-3);
    display: inline-flex; align-items: center; justify-content: center;
    font-family: var(--font-mono); font-weight: 560; font-size: 12px;
    background: var(--white); cursor: pointer; flex-shrink: 0;
    transition: all .12s;
  }
  .gf-q-opt.correct .gf-q-opt-marker {
    background: var(--green-600); border-color: var(--green-600); color: white;
  }
  .gf-q-opt input {
    flex: 1; border: none; outline: none; font-size: 14px; background: transparent;
  }
`

export default function CourseBuilder() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { user } = useAuth()
  const isEdit = !!slug

  const [step, setStep] = useState(1)
  const [form, setForm] = useState({
    title: '', description: '',
    category_id: '', level: 'beginner',
    is_free: true, price: 0,
    thumb_emoji: '🌍', thumb_color: 'blue',
  })
  const [thumbFile, setThumbFile] = useState(null)
  const [thumbPreview, setThumbPreview] = useState(null)
  const [courseSlug, setCourseSlug] = useState(slug || null)

  const { data: cats = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.get('/categories/').then(r => r.data.results || r.data),
  })

  const { data: existing } = useQuery({
    queryKey: ['edit-course', slug],
    queryFn: () => api.get(`/courses/${slug}/`).then(r => r.data),
    enabled: isEdit,
  })

  useEffect(() => {
    if (existing) {
      setForm({
        title: existing.title,
        description: existing.description || '',
        category_id: existing.category?.id || '',
        level: existing.level,
        is_free: existing.is_free,
        price: existing.price || 0,
        thumb_emoji: existing.thumb_emoji,
        thumb_color: existing.thumb_color,
      })
      if (existing.thumbnail) setThumbPreview(absUrl(existing.thumbnail))
      setCourseSlug(existing.slug)
    }
  }, [existing])

  const onPickThumb = (file) => {
    if (!file) return
    setThumbFile(file)
    const reader = new FileReader()
    reader.onload = (e) => setThumbPreview(e.target.result)
    reader.readAsDataURL(file)
  }

  const save = useMutation({
    mutationFn: async () => {
      const fd = new FormData()
      Object.entries(form).forEach(([k, v]) => {
        if (v !== '' && v !== null && v !== undefined) fd.append(k, v)
      })
      if (thumbFile) fd.append('thumbnail', thumbFile)
      const headers = { 'Content-Type': 'multipart/form-data' }
      if (courseSlug) {
        const { data } = await api.patch(`/courses/${courseSlug}/`, fd, { headers })
        return data
      }
      fd.append('status', 'draft')
      const { data } = await api.post('/courses/', fd, { headers })
      return data
    },
    onSuccess: (data) => {
      setCourseSlug(data.slug)
      setThumbFile(null)
      qc.invalidateQueries(['my-teaching'])
      qc.invalidateQueries(['edit-course'])
      toast.success('Saqlandi')
    },
    onError: (e) => {
      const d = e.response?.data
      const msg = d?.title?.[0] || d?.detail || (typeof d === 'string' ? d : 'Saqlashda xatolik')
      toast.error(String(msg))
    },
  })

  const submitForReview = useMutation({
    mutationFn: () => api.patch(`/courses/${courseSlug}/`, { status: 'pending' }),
    onSuccess: () => {
      toast.success('Kurs moderatsiyaga yuborildi')
      navigate(user?.role === 'admin' ? '/admin-panel/courses' : '/teacher/courses')
    },
    onError: () => toast.error('Yuborishda xatolik'),
  })

  const publishDirect = useMutation({
    mutationFn: () => api.patch(`/courses/${courseSlug}/`, { status: 'published' }),
    onSuccess: () => { toast.success('Kurs nashr etildi'); navigate('/admin-panel/courses') },
    onError: () => toast.error('Nashr etishda xatolik'),
  })

  const base = user?.role === 'admin' ? '/admin-panel' : '/teacher'
  const STATUS_BADGE = {
    published: ['green', 'Nashr etilgan'],
    pending: ['amber', 'Moderatsiyada'],
    rejected: ['red', 'Rad etilgan'],
    draft: ['gray', 'Qoralama'],
  }
  const [statusTone, statusLabel] = STATUS_BADGE[existing?.status] || STATUS_BADGE.draft
  const STEP_DESCS = ['Nom, tavsif va muqova', 'Bo‘limlar, darslar, testlar', 'Tekshirish va nashr']
  const sectionsCount = existing?.sections?.length || 0
  const lessonsCount = existing?.lessons_count || 0

  return (
    <DashLayout kind={user?.role === 'admin' ? 'admin' : 'teacher'}>
      <style>{gfsStyles}</style>

      <div className="breadcrumb">
        <Link to={`${base}/courses`}>Kurslar</Link>
        <span className="sep">/</span>
        <span>{isEdit ? 'Tahrirlash' : 'Yangi kurs'}</span>
      </div>

      {existing?.status === 'rejected' && existing?.rejection_note && (
        <div className="card" style={{ background: 'var(--red-50)', borderColor: 'var(--red-600)', padding: 16, marginTop: 14, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <Icon name="alert" size={18} style={{ color: 'var(--red-600)', flexShrink: 0, marginTop: 2 }} />
          <div>
            <strong style={{ color: 'var(--red-600)' }}>Kurs rad etilgan</strong>
            <div className="text-sm mt-1" style={{ color: 'var(--text-2)' }}>{existing.rejection_note}</div>
            <div className="text-xs text-muted mt-1">Kamchiliklarni to'g'irlab, qaytadan moderatsiyaga yuboring.</div>
          </div>
        </div>
      )}

      <div className="cb-layout">
        {/* ── Sidebar: live preview + vertical steps ── */}
        <aside className="cb-side">
          <div className="cb-preview fade-up">
            <div className={`pthumb ${!thumbPreview ? `thumb thumb-${form.thumb_color}` : ''}`}>
              {thumbPreview
                ? <img src={thumbPreview} alt="" />
                : <span>{form.thumb_emoji}</span>}
            </div>
            <div className="pbody">
              <div className="ptitle">{form.title || 'Yangi kurs'}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                <span className={`badge badge-${statusTone}`}>{statusLabel}</span>
                {isEdit && (
                  <span className="text-xs text-muted">{sectionsCount} bo'lim · {lessonsCount} dars</span>
                )}
              </div>
            </div>
          </div>

          <nav className="cb-steps fade-up-d1">
            {STEPS.map((s, i) => {
              const idx = i + 1
              const canGo = courseSlug || idx === 1
              return (
                <button key={s} type="button"
                  className={`cb-step ${step === idx ? 'active' : ''} ${step > idx ? 'done' : ''} ${!canGo ? 'locked' : ''}`}
                  onClick={() => canGo ? setStep(idx) : toast.error("Avval asosiy ma'lumotlarni saqlang")}>
                  <span className="num">{step > idx ? <Icon name="check" size={14} /> : idx}</span>
                  <span>
                    <span className="t" style={{ display: 'block' }}>{s}</span>
                    <span className="d" style={{ display: 'block' }}>{STEP_DESCS[i]}</span>
                  </span>
                </button>
              )
            })}
          </nav>

          {isEdit && courseSlug && (
            <div className="cb-side-actions fade-up-d2">
              <Link to={`${base}/courses/${courseSlug}/stats`} className="btn btn-secondary btn-sm btn-block">
                <Icon name="chart" size={14} /> Statistika
              </Link>
              <Link to={`/courses/${courseSlug}`} className="btn btn-secondary btn-sm btn-block">
                <Icon name="eye" size={14} /> Ko'rish
              </Link>
            </div>
          )}
        </aside>

        {/* ── Content ── */}
        <div className="cb-main">
          {step === 1 && (
            <div className="card fade-up" style={{ padding: 32 }}>
              <BasicsStep
                form={form} setForm={setForm}
                cats={cats}
                thumbPreview={thumbPreview} onPickThumb={onPickThumb}
                onSave={async () => { await save.mutateAsync() }}
                onNext={async () => { await save.mutateAsync(); setStep(2) }}
                saving={save.isPending}
              />
            </div>
          )}

          {step === 2 && (
            <div className="fade-up">
              <CurriculumGFS courseSlug={courseSlug} onNext={() => setStep(3)} onBack={() => setStep(1)} />
            </div>
          )}

          {step === 3 && (
            <div className="card fade-up" style={{ padding: 32 }}>
              <ReviewStep
                courseSlug={courseSlug}
                onBack={() => setStep(2)}
                isAdmin={user?.role === 'admin'}
                onSubmit={() => submitForReview.mutate()}
                onPublishDirect={() => publishDirect.mutate()}
                busy={submitForReview.isPending || publishDirect.isPending}
              />
            </div>
          )}
        </div>
      </div>
    </DashLayout>
  )
}

/* ============================================================
   STEP 1 — BASICS (unchanged, professional form)
   ============================================================ */
function BasicsStep({ form, setForm, cats, thumbPreview, onPickThumb, onSave, onNext, saving }) {
  const update = (k, v) => setForm({ ...form, [k]: v })
  return (
    <>
      <h2 style={{ fontSize: 20, fontFamily: 'var(--font-display)', marginBottom: 6 }}>Asosiy ma'lumot</h2>
      <p className="text-muted text-sm mb-6">O'quvchilar sizning kursingizni qanday topishi haqida ma'lumot bering.</p>

      <div className="field">
        <label className="label">Kurs nomi *</label>
        <input className="input" value={form.title} onChange={e => update('title', e.target.value)}
          placeholder="Masalan, Yer sayyorasi va materiklar" />
      </div>
      <div className="field">
        <label className="label">Tavsif</label>
        <textarea className="textarea" rows={4} value={form.description} onChange={e => update('description', e.target.value)}
          placeholder="O'quvchilar nima o'rganadi…" />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div className="field">
          <label className="label">Kategoriya</label>
          <select className="select" value={form.category_id || ''} onChange={e => update('category_id', e.target.value)}>
            <option value="">— Tanlash —</option>
            {cats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div className="field">
          <label className="label">Daraja</label>
          <select className="select" value={form.level} onChange={e => update('level', e.target.value)}>
            <option value="beginner">Boshlang'ich</option>
            <option value="intermediate">O'rta</option>
            <option value="advanced">Murakkab</option>
          </select>
        </div>
      </div>
      <div className="field">
        <label className="label">Muqova rasm</label>
        <ThumbUpload preview={thumbPreview} emoji={form.thumb_emoji} color={form.thumb_color} onPick={onPickThumb} />
        <div className="text-xs text-muted mt-2">Tavsiya: 1280×720. Rasm yuklamasangiz, emoji+rang ishlatiladi.</div>
      </div>
      <div className="field">
        <label className="label">Emoji</label>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {EMOJIS.map(e => (
            <button key={e} type="button" onClick={() => update('thumb_emoji', e)}
              style={{ width: 44, height: 44, borderRadius: 8,
                border: `2px solid ${form.thumb_emoji === e ? 'var(--green-600)' : 'var(--border)'}`,
                background: 'var(--white)', fontSize: 22, cursor: 'pointer' }}>{e}</button>
          ))}
        </div>
      </div>
      <div className="field">
        <label className="label">Muqova rangi</label>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {COLORS.map(c => (
            <button key={c} type="button" onClick={() => update('thumb_color', c)}
              className={`thumb thumb-${c}`}
              style={{ width: 72, height: 48, fontSize: 18,
                border: `2px solid ${form.thumb_color === c ? 'var(--green-600)' : 'transparent'}`,
                cursor: 'pointer' }}>{form.thumb_emoji}</button>
          ))}
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 24 }}>
        <button className="btn btn-secondary" onClick={onSave} disabled={saving || !form.title}>
          {saving ? 'Saqlanmoqda…' : 'Qoralama sifatida saqlash'}
        </button>
        <button className="btn btn-primary" onClick={onNext} disabled={saving || !form.title}>
          Keyingi <Icon name="arrowR" size={14} />
        </button>
      </div>
    </>
  )
}

function ThumbUpload({ preview, emoji, color, onPick }) {
  return (
    <div style={{ display: 'flex', gap: 16, alignItems: 'stretch' }}>
      <div style={{ width: 200, aspectRatio: '16/9', borderRadius: 10, overflow: 'hidden',
        border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: preview ? '#000' : '' }}
        className={!preview ? `thumb thumb-${color}` : ''}>
        {preview ? <img src={preview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: 56 }}>{emoji}</span>}
      </div>
      <label style={{
        flex: 1, border: '1.5px dashed var(--border)', borderRadius: 10, padding: 24,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', transition: 'border-color .15s',
      }}>
        <div style={{ width: 44, height: 44, borderRadius: 10, background: 'var(--green-50)', color: 'var(--green-600)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
          <Icon name="upload" size={18} />
        </div>
        <div style={{ fontWeight: 600, fontSize: 14 }}>Rasm yuklash uchun bosing</div>
        <div className="text-xs text-muted mt-1">yoki shu yerga sudrang</div>
        <input type="file" accept="image/*" hidden onChange={e => onPick(e.target.files?.[0])} />
      </label>
    </div>
  )
}

/* ============================================================
   STEP 2 — CURRICULUM (Google Forms style, fully inline)
   ============================================================ */
function CurriculumGFS({ courseSlug, onNext, onBack }) {
  const [focusedSection, setFocusedSection] = useState(null)
  const [editingLesson, setEditingLesson] = useState(null)   // {sectionId, lessonId|'new'}
  const [editingTest, setEditingTest] = useState(null)       // {sectionId, testId|'new'}
  const [editingQuestion, setEditingQuestion] = useState(null) // {testId, questionId|'new'}

  const { data: course, refetch } = useQuery({
    queryKey: ['edit-course', courseSlug],
    queryFn: () => api.get(`/courses/${courseSlug}/`).then(r => r.data),
    enabled: !!courseSlug,
  })
  const sections = course?.sections || []

  async function addSection() {
    const { data } = await api.post(`/courses/${courseSlug}/sections/`, {
      title: "Yangi bo'lim", order: sections.length + 1,
    })
    refetch()
    setFocusedSection(data.id)
  }

  async function updateSectionTitle(id, title) {
    await api.patch(`/sections/${id}/`, { title })
    refetch()
  }

  async function delSection(id) {
    if (!confirm("Bo'limni o'chirishni tasdiqlaysizmi? Ichidagi darslar ham o'chiriladi.")) return
    await api.delete(`/sections/${id}/`); refetch(); toast.success("O'chirildi")
  }

  // Reorder sections — renumber the whole list so duplicates can't appear
  async function moveSection(idx, dir) {
    const target = idx + dir
    if (target < 0 || target >= sections.length) return
    const arr = [...sections]
    const [it] = arr.splice(idx, 1)
    arr.splice(target, 0, it)
    await Promise.all(arr.map((s, i) => api.patch(`/sections/${s.id}/`, { order: i + 1 })))
    refetch()
  }

  if (!courseSlug) {
    return <div className="card" style={{ padding: 32, textAlign: 'center', color: 'var(--text-3)' }}>
      Avval asosiy ma'lumotlarni saqlang
    </div>
  }

  return (
    <>
      <div className="card" style={{ padding: 24, marginBottom: 16, background: 'linear-gradient(135deg, var(--green-50), var(--white))' }}>
        <h2 style={{ fontSize: 20, fontFamily: 'var(--font-display)', marginBottom: 4 }}>Bo'limlar va darslar</h2>
        <p className="text-muted text-sm">Bo'lim nomini yozing, darslarni qo'shing. Hammasi avtomatik saqlanadi.</p>
      </div>

      {sections.length === 0 && (
        <div className="card" style={{ padding: 40, textAlign: 'center', color: 'var(--text-3)', marginBottom: 12 }}>
          Hozircha bo'limlar yo'q. Pastdagi <strong>"Bo'lim qo'shish"</strong> tugmasini bosing.
        </div>
      )}

      {sections.map((s, i) => (
        <SectionCard key={s.id} section={s} index={i}
          focused={focusedSection === s.id}
          onFocus={() => setFocusedSection(s.id)}
          onBlur={() => setFocusedSection(null)}
          onRename={t => updateSectionTitle(s.id, t)}
          onDelete={() => delSection(s.id)}
          onMoveUp={i > 0 ? () => moveSection(i, -1) : null}
          onMoveDown={i < sections.length - 1 ? () => moveSection(i, 1) : null}
          refetch={refetch}
          editingLesson={editingLesson}
          setEditingLesson={setEditingLesson}
          editingTest={editingTest}
          setEditingTest={setEditingTest}
          editingQuestion={editingQuestion}
          setEditingQuestion={setEditingQuestion}
        />
      ))}

      <button className="gf-add-section" onClick={addSection}>
        <Icon name="plus" size={16} /> Bo'lim qo'shish
      </button>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24 }}>
        <button className="btn btn-secondary" onClick={onBack}><Icon name="arrowL" size={14} /> Oldingi</button>
        <button className="btn btn-primary" onClick={onNext}>Keyingi <Icon name="arrowR" size={14} /></button>
      </div>
    </>
  )
}

function SectionCard({ section, index, focused, onFocus, onBlur, onRename, onDelete, onMoveUp, onMoveDown, refetch,
  editingLesson, setEditingLesson, editingTest, setEditingTest, editingQuestion, setEditingQuestion }) {
  const [title, setTitle] = useState(section.title)
  useEffect(() => setTitle(section.title), [section.title])

  // Bo'limni yig'ib/ochib qo'yish (akkordeon). Ichida dars/test bori yig'ilgan,
  // yangi/bo'sh bo'limlar ochiq holda boshlanadi — shunda kam scroll qilinadi.
  const [open, setOpen] = useState(
    () => (section.lessons?.length || 0) + (section.tests?.length || 0) === 0
  )

  function handleTitleBlur() {
    if (title.trim() && title !== section.title) onRename(title.trim())
    onBlur()
  }

  const lessonForm = editingLesson?.sectionId === section.id && editingLesson?.lessonId === 'new'
  const testForm = editingTest?.sectionId === section.id && editingTest?.testId === 'new'

  async function delTest(id) {
    if (!confirm("Testni o'chirish?")) return
    await api.delete(`/tests/${id}/`); refetch(); toast.success("O'chirildi")
  }

  // Reorder lessons inside this section
  async function moveLesson(idx, dir) {
    const lessons = section.lessons || []
    const target = idx + dir
    if (target < 0 || target >= lessons.length) return
    const arr = [...lessons]
    const [it] = arr.splice(idx, 1)
    arr.splice(target, 0, it)
    await Promise.all(arr.map((l, i) => api.patch(`/lessons/${l.id}/`, { order: i + 1 })))
    refetch()
  }

  return (
    <div className={`gf-card ${focused ? 'focused' : ''}`} onClick={onFocus}>
      <div className="gf-section-head" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="icon-btn" onClick={() => setOpen(o => !o)}
          title={open ? "Bo'limni yig'ish" : "Bo'limni ochish"} style={{ flexShrink: 0 }}>
          <Icon name={open ? 'chevD' : 'chevR'} size={16} />
        </button>
        <div className="gf-section-num">{String(index + 1).padStart(2, '0')}</div>
        <input
          className="gf-section-title"
          value={title}
          onChange={e => setTitle(e.target.value)}
          onBlur={handleTitleBlur}
          onFocus={onFocus}
          onKeyDown={e => { if (e.key === 'Enter') e.target.blur() }}
          placeholder="Bo'lim nomi…"
        />
        <span className="gf-section-meta">{section.lessons?.length || 0} dars · {section.tests?.length || 0} test</span>
        <button className="icon-btn" onClick={onMoveUp || undefined} disabled={!onMoveUp} title="Yuqoriga"
          style={{ opacity: onMoveUp ? 1 : 0.3 }}><Icon name="chevU" size={15} /></button>
        <button className="icon-btn" onClick={onMoveDown || undefined} disabled={!onMoveDown} title="Pastga"
          style={{ opacity: onMoveDown ? 1 : 0.3 }}><Icon name="chevD" size={15} /></button>
        <button className="icon-btn" onClick={onDelete} title="O'chirish"><Icon name="trash" size={15} /></button>
      </div>

      {open && (
      <div className="gf-section-body">
        {/* LESSONS */}
        {(section.lessons || []).map((l, li) => (
          editingLesson?.sectionId === section.id && editingLesson?.lessonId === l.id ? (
            <LessonInlineForm key={l.id} sectionId={section.id} lesson={l}
              onClose={() => setEditingLesson(null)}
              onSaved={() => { refetch() }}
            />
          ) : (
            <div key={l.id} className="gf-lesson">
              <div className="gf-lesson-row">
                <div className="gf-lesson-icon"><Icon name="play" size={14} /></div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="gf-lesson-title">{l.title}</div>
                  <div className="gf-lesson-meta">
                    {l.duration_minutes} daq · {l.video_type === 'youtube' ? 'YouTube' : l.video_file ? 'Yuklangan' : "Video yo'q"}
                    {l.is_free_preview && <span style={{ marginLeft: 8, color: 'var(--green-600)' }}>· Bepul namuna</span>}
                  </div>
                </div>
                <button className="icon-btn" disabled={li === 0} style={{ opacity: li === 0 ? 0.3 : 1 }}
                  onClick={() => moveLesson(li, -1)} title="Yuqoriga"><Icon name="chevU" size={14} /></button>
                <button className="icon-btn" disabled={li === (section.lessons?.length || 0) - 1}
                  style={{ opacity: li === (section.lessons?.length || 0) - 1 ? 0.3 : 1 }}
                  onClick={() => moveLesson(li, 1)} title="Pastga"><Icon name="chevD" size={14} /></button>
                <button className="icon-btn" onClick={() => setEditingLesson({ sectionId: section.id, lessonId: l.id })} title="Tahrirlash">
                  <Icon name="edit" size={14} />
                </button>
                <DeleteLessonBtn lesson={l} onDone={refetch} />
              </div>
            </div>
          )
        ))}

        {lessonForm && (
          <LessonInlineForm sectionId={section.id} lesson={null}
            onClose={() => setEditingLesson(null)}
            onSaved={() => { refetch() }}
          />
        )}

        {/* TESTS */}
        {(section.tests || []).map(t => (
          editingTest?.sectionId === section.id && editingTest?.testId === t.id ? (
            <TestInlineForm key={t.id} sectionId={section.id} test={t}
              onClose={() => setEditingTest(null)}
              onSaved={() => refetch()} />
          ) : (
            <TestCard key={t.id} test={t}
              onEditTest={() => setEditingTest({ sectionId: section.id, testId: t.id })}
              onDeleteTest={() => delTest(t.id)}
              editingQuestion={editingQuestion}
              setEditingQuestion={setEditingQuestion}
              refetch={refetch} />
          )
        ))}

        {testForm && (
          <TestInlineForm sectionId={section.id} test={null}
            onClose={() => setEditingTest(null)}
            onSaved={(saved) => { refetch(); setEditingTest({ sectionId: section.id, testId: saved.id }) }} />
        )}

        <div className="gf-add-row">
          <button className="gf-add-btn" onClick={() => setEditingLesson({ sectionId: section.id, lessonId: 'new' })}>
            <Icon name="plus" size={14} /> Dars qo'shish
          </button>
          <button className="gf-add-btn" onClick={() => setEditingTest({ sectionId: section.id, testId: 'new' })}
            style={{ borderColor: 'var(--blue-600)', color: 'var(--blue-600)' }}>
            <Icon name="fileText" size={14} /> Test qo'shish
          </button>
        </div>
      </div>
      )}
    </div>
  )
}

function DeleteLessonBtn({ lesson, onDone }) {
  async function go() {
    if (!confirm("Darsni o'chirish?")) return
    await api.delete(`/lessons/${lesson.id}/`); onDone(); toast.success("O'chirildi")
  }
  return <button className="icon-btn" onClick={go} title="O'chirish"><Icon name="trash" size={14} /></button>
}

function LessonInlineForm({ sectionId, lesson, onClose, onSaved }) {
  const [tab, setTab] = useState('details')
  const [title, setTitle] = useState(lesson?.title || '')
  const [videoType, setVideoType] = useState(lesson?.video_type || 'youtube')
  const [youtubeUrl, setYoutubeUrl] = useState(lesson?.youtube_url || '')
  const [videoFile, setVideoFile] = useState(null)
  const [duration, setDuration] = useState(lesson?.duration_minutes || 10)
  const [description, setDescription] = useState(lesson?.description || '')
  const [isFreePreview, setIsFreePreview] = useState(lesson?.is_free_preview || false)
  const [busy, setBusy] = useState(false)
  const [savedId, setSavedId] = useState(lesson?.id || null)

  // Auto-detect duration from the uploaded video's metadata
  function onPickVideo(file) {
    setVideoFile(file)
    if (!file) return
    const url = URL.createObjectURL(file)
    const v = document.createElement('video')
    v.preload = 'metadata'
    v.onloadedmetadata = () => {
      if (Number.isFinite(v.duration) && v.duration > 0) {
        const mins = Math.max(1, Math.round(v.duration / 60))
        setDuration(mins)
        toast(`Davomiylik avtomatik aniqlandi: ${mins} daqiqa`, { icon: '🎬' })
      }
      URL.revokeObjectURL(url)
    }
    v.onerror = () => URL.revokeObjectURL(url)
    v.src = url
  }

  async function save() {
    setBusy(true)
    try {
      const fd = new FormData()
      fd.append('title', title)
      fd.append('video_type', videoType)
      fd.append('duration_minutes', duration)
      fd.append('description', description)
      fd.append('is_free_preview', isFreePreview)
      if (videoType === 'youtube') fd.append('youtube_url', youtubeUrl)
      if (videoType === 'upload' && videoFile) fd.append('video_file', videoFile)
      const headers = { 'Content-Type': 'multipart/form-data' }
      if (savedId) {
        await api.patch(`/lessons/${savedId}/`, fd, { headers })
      } else {
        fd.append('order', 0)
        const { data } = await api.post(`/sections/${sectionId}/lessons/`, fd, { headers })
        setSavedId(data.id)
      }
      onSaved()
      toast.success('Saqlandi')
    } catch { toast.error('Saqlashda xatolik') }
    finally { setBusy(false) }
  }

  return (
    <div className="gf-lesson-form" onClick={e => e.stopPropagation()}>
      <div className="gf-form-head">
        <span className="badge-mini">DARS</span>
        <span className="text-sm text-muted">{savedId ? `#${savedId}` : 'yangi'}</span>
        <button className="icon-btn" style={{ marginLeft: 'auto' }} onClick={onClose} title="Yopish">
          <Icon name="x" size={16} />
        </button>
      </div>

      <input className="gf-input-lg" autoFocus value={title} onChange={e => setTitle(e.target.value)}
        placeholder="Dars nomi" />

      <div className="gf-tabs" style={{ marginTop: 18 }}>
        <button className={tab === 'details' ? 'active' : ''} onClick={() => setTab('details')}>Asosiy</button>
        <button className={tab === 'materials' ? 'active' : ''}
          onClick={() => savedId ? setTab('materials') : toast('Avval darsni saqlang')}
          disabled={!savedId}>Materiallar</button>
      </div>

      {tab === 'details' && (
        <>
          <div className="field">
            <label className="label">Video</label>
            <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
              <button type="button" onClick={() => setVideoType('youtube')}
                className={`btn ${videoType === 'youtube' ? 'btn-primary' : 'btn-secondary'} btn-sm`}>YouTube</button>
              <button type="button" onClick={() => setVideoType('upload')}
                className={`btn ${videoType === 'upload' ? 'btn-primary' : 'btn-secondary'} btn-sm`}>Fayl yuklash</button>
            </div>
            {videoType === 'youtube' ? (
              <input className="input" type="url" value={youtubeUrl} onChange={e => setYoutubeUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..." />
            ) : (
              <FileInput accept="video/*" icon="video" hint="MP4, MOV — 500MB gacha (davomiylik avtomatik aniqlanadi)"
                onPick={onPickVideo} value={lesson?.video_file} />
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="field">
              <label className="label">Davomiyligi (daqiqa)</label>
              <input className="input" type="number" min={1} value={duration} onChange={e => setDuration(e.target.value)} />
            </div>
            <div className="field" style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: 10 }}>
              <label className="checkbox">
                <input type="checkbox" checked={isFreePreview} onChange={e => setIsFreePreview(e.target.checked)} />
                Bepul namuna
              </label>
            </div>
          </div>

          <div className="field">
            <label className="label">Tavsif</label>
            <RichTextEditor value={description} onChange={setDescription}
              placeholder="Darsda nima o'rganiladi…" />
          </div>

          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button className="btn btn-secondary btn-sm" onClick={onClose}>Yopish</button>
            <button className="btn btn-primary btn-sm" disabled={busy || !title.trim()} onClick={save}>
              {busy ? 'Saqlanmoqda…' : 'Saqlash'}
            </button>
          </div>
        </>
      )}

      {tab === 'materials' && savedId && <LessonMaterialsManager lessonId={savedId} />}
    </div>
  )
}

function TestCard({ test, onEditTest, onDeleteTest, editingQuestion, setEditingQuestion, refetch }) {
  const [open, setOpen] = useState(true)

  const { data: details, refetch: refetchT } = useQuery({
    queryKey: ['test-questions', test.id],
    queryFn: () => api.get(`/tests/${test.id}/detail/`).then(r => r.data),
    enabled: open,
  })

  async function delQ(qid) {
    if (!confirm("Savolni o'chirish?")) return
    await api.delete(`/questions/${qid}/`); refetchT(); refetch(); toast.success("O'chirildi")
  }

  return (
    <div style={{ padding: 14, background: 'var(--bg-soft)', borderRadius: 10, marginBottom: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div className="gf-lesson-icon test"><Icon name="fileText" size={14} /></div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="gf-lesson-title">{test.title}</div>
          <div className="gf-lesson-meta">{test.question_count} savol · O'tish bali {test.pass_percent || 60}%</div>
        </div>
        <button className="icon-btn" onClick={() => setOpen(o => !o)}><Icon name={open ? 'chevU' : 'chevD'} size={14} /></button>
        <button className="icon-btn" onClick={onEditTest}><Icon name="edit" size={14} /></button>
        <button className="icon-btn" onClick={onDeleteTest}><Icon name="trash" size={14} /></button>
      </div>

      {open && (
        <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border-2)' }}>
          {(details?.questions || []).map((q, i) => (
            editingQuestion?.testId === test.id && editingQuestion?.questionId === q.id ? (
              <QuestionInlineForm key={q.id} testId={test.id} question={q}
                onClose={() => setEditingQuestion(null)}
                onSaved={() => { refetchT(); refetch() }} />
            ) : (
              <div key={q.id} className="gf-q-card" style={{ background: 'var(--white)' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <span style={{ width: 24, height: 24, borderRadius: 999, background: 'var(--green-50)', color: 'var(--green-600)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>{i + 1}</span>
                  <div style={{ flex: 1, fontSize: 14, fontWeight: 500 }}>{q.text}</div>
                  <button className="icon-btn" onClick={() => setEditingQuestion({ testId: test.id, questionId: q.id })}><Icon name="edit" size={13} /></button>
                  <button className="icon-btn" onClick={() => delQ(q.id)}><Icon name="trash" size={13} /></button>
                </div>
                <div style={{ marginTop: 10, paddingLeft: 34, fontSize: 13, color: 'var(--text-3)' }}>
                  {q.options.length} variant
                </div>
              </div>
            )
          ))}

          {editingQuestion?.testId === test.id && editingQuestion?.questionId === 'new' && (
            <QuestionInlineForm testId={test.id} question={null}
              onClose={() => setEditingQuestion(null)}
              onSaved={() => { refetchT(); refetch() }} />
          )}

          <button className="gf-add-btn" style={{ marginTop: 6 }}
            onClick={() => setEditingQuestion({ testId: test.id, questionId: 'new' })}>
            <Icon name="plus" size={14} /> Savol qo'shish
          </button>
        </div>
      )}
    </div>
  )
}

function TestInlineForm({ sectionId, test, onClose, onSaved }) {
  const [title, setTitle] = useState(test?.title || '')
  const [pass, setPass] = useState(test?.pass_percent || 60)
  const [time, setTime] = useState(test?.time_limit_minutes || '')
  const [busy, setBusy] = useState(false)

  async function save() {
    setBusy(true)
    try {
      const payload = { title, pass_percent: pass, time_limit_minutes: time || null, section: sectionId }
      let saved
      if (test?.id) {
        const { data } = await api.patch(`/tests/${test.id}/`, payload); saved = data
      } else {
        const { data } = await api.post('/tests/', payload); saved = data
      }
      toast.success('Saqlandi'); onSaved(saved)
    } catch { toast.error('Xatolik') }
    finally { setBusy(false) }
  }

  return (
    <div className="gf-lesson-form" style={{ borderColor: 'var(--blue-600)', boxShadow: '0 10px 24px -10px rgba(37,99,235,0.2)' }}>
      <div className="gf-form-head">
        <span className="badge-mini test">TEST</span>
        <button className="icon-btn" style={{ marginLeft: 'auto' }} onClick={onClose}><Icon name="x" size={16} /></button>
      </div>
      <input className="gf-input-lg" autoFocus value={title} onChange={e => setTitle(e.target.value)}
        placeholder="Test nomi" />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 18 }}>
        <div className="field">
          <label className="label">O'tish bali (%)</label>
          <input className="input" type="number" min={0} max={100} value={pass} onChange={e => setPass(e.target.value)} />
        </div>
        <div className="field">
          <label className="label">Vaqt chegarasi (daq, ixtiyoriy)</label>
          <input className="input" type="number" min={1} value={time} onChange={e => setTime(e.target.value)} />
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <button className="btn btn-secondary btn-sm" onClick={onClose}>Yopish</button>
        <button className="btn btn-primary btn-sm" disabled={busy || !title.trim()} onClick={save}>
          {busy ? 'Saqlanmoqda…' : 'Saqlash'}
        </button>
      </div>
    </div>
  )
}

function QuestionInlineForm({ testId, question, onClose, onSaved }) {
  const [text, setText] = useState(question?.text || '')
  const [options, setOptions] = useState(() => {
    if (question?.options?.length) {
      // Backend sends is_correct to the course owner; keep the real answer.
      const opts = question.options.map((o, i) => ({ text: o.text, is_correct: !!o.is_correct, order: i }))
      if (!opts.some(o => o.is_correct)) opts[0].is_correct = true
      return opts
    }
    return [0, 1, 2, 3].map(i => ({ text: '', is_correct: i === 0, order: i }))
  })
  const [busy, setBusy] = useState(false)

  const setOpt = (i, patch) => setOptions(options.map((o, idx) => idx === i ? { ...o, ...patch } : o))
  const setCorrect = (i) => setOptions(options.map((o, idx) => ({ ...o, is_correct: idx === i })))

  async function save() {
    setBusy(true)
    try {
      const payload = { text, order: question?.order || 0, options }
      if (question?.id) await api.patch(`/questions/${question.id}/`, payload)
      else await api.post(`/tests/${testId}/questions/`, payload)
      toast.success('Saqlandi'); onSaved()
    } catch { toast.error('Xatolik') }
    finally { setBusy(false) }
  }

  return (
    <div className="gf-q-card focused" style={{ background: 'var(--white)' }}>
      <div className="gf-form-head" style={{ marginBottom: 14 }}>
        <span className="badge-mini">SAVOL</span>
        <button className="icon-btn" style={{ marginLeft: 'auto' }} onClick={onClose}><Icon name="x" size={16} /></button>
      </div>

      <textarea
        className="gf-input-lg" rows={2} autoFocus
        value={text} onChange={e => setText(e.target.value)}
        placeholder="Savol matni" style={{ resize: 'vertical', minHeight: 50 }}
      />

      <div className="gf-q-opts" style={{ marginTop: 16 }}>
        {options.map((o, i) => (
          <div key={i} className={`gf-q-opt ${o.is_correct ? 'correct' : ''}`}>
            <button type="button" onClick={() => setCorrect(i)} className="gf-q-opt-marker"
              title="To'g'ri javob deb belgilash">
              {String.fromCharCode(65 + i)}
            </button>
            <input value={o.text} onChange={e => setOpt(i, { text: e.target.value })}
              placeholder={`Variant ${String.fromCharCode(65 + i)}`} />
            {o.is_correct && <span className="badge badge-green">To'g'ri</span>}
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
        <button className="btn btn-secondary btn-sm" onClick={onClose}>Yopish</button>
        <button className="btn btn-primary btn-sm" disabled={busy || !text.trim() || options.some(o => !o.text.trim())} onClick={save}>
          {busy ? 'Saqlanmoqda…' : 'Saqlash'}
        </button>
      </div>
    </div>
  )
}

/* ============================================================
   STEP 4 — REVIEW
   ============================================================ */
function ReviewStep({ courseSlug, onBack, isAdmin, onSubmit, onPublishDirect, busy }) {
  const { data: course } = useQuery({
    queryKey: ['edit-course', courseSlug],
    queryFn: () => api.get(`/courses/${courseSlug}/`).then(r => r.data),
    enabled: !!courseSlug,
  })
  if (!course) return <div>Yuklanmoqda…</div>

  const lessonsTotal = course.lessons_count
  const testsTotal = (course.sections || []).reduce((s, x) => s + (x.test_count || 0), 0)
  const canPublish = lessonsTotal > 0

  return (
    <>
      <h2 style={{ fontSize: 20, fontFamily: 'var(--font-display)' }}>Ko'rib chiqish</h2>
      <p className="text-muted text-sm mb-6">Hammasi to'g'rimi? Nashrga yuboring.</p>

      <div style={{ background: 'var(--bg-soft)', borderRadius: 12, padding: 24, marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 20, alignItems: 'start' }}>
          {course.thumbnail
            ? <img src={absUrl(course.thumbnail)} alt="" style={{ width: 200, height: 124, objectFit: 'cover', borderRadius: 10, flexShrink: 0 }} />
            : <div className={`thumb thumb-${course.thumb_color}`} style={{ width: 200, height: 124, fontSize: 56, borderRadius: 10, flexShrink: 0 }}>{course.thumb_emoji}</div>}
          <div style={{ flex: 1 }}>
            {course.category && <span className="badge badge-blue">{course.category.name}</span>}
            <h3 style={{ fontSize: 22, margin: '8px 0' }}>{course.title}</h3>
            <p className="text-sm text-muted">{course.description?.slice(0, 240)}</p>
          </div>
          <span className="badge badge-green">Bepul</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginTop: 24 }}>
          <Tile v={course.sections?.length || 0} l="Bo'limlar" />
          <Tile v={lessonsTotal} l="Darslar" />
          <Tile v={testsTotal} l="Testlar" />
          <Tile v={`~${Math.round((course.total_duration_minutes || 0) / 60)}s`} l="Davomiylik" />
        </div>
      </div>

      {!canPublish && (
        <div className="card" style={{ background: 'var(--amber-50)', border: '1px solid var(--amber-600)', padding: 16, marginBottom: 16 }}>
          <strong>Diqqat:</strong> Nashr qilishdan oldin kamida bitta dars qo'shing.
        </div>
      )}

      {course.status === 'pending' && (
        <div className="card" style={{ background: 'var(--amber-50)', border: '1px solid var(--amber-600)', padding: 16, marginBottom: 16, display: 'flex', gap: 10, alignItems: 'center' }}>
          <Icon name="clock" size={18} style={{ color: 'var(--amber-600)' }} />
          <span>Kurs moderatsiyada. Admin tasdiqlagandan keyin ommaviy katalogga chiqadi.</span>
        </div>
      )}
      {course.status === 'published' && (
        <div className="card" style={{ background: 'var(--green-50)', border: '1px solid var(--green-200)', padding: 16, marginBottom: 16, display: 'flex', gap: 10, alignItems: 'center' }}>
          <Icon name="checkC" size={18} style={{ color: 'var(--green-600)' }} />
          <span>Kurs nashr etilgan — kiritilgan o'zgarishlar darhol o'quvchilarga ko'rinadi.</span>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24 }}>
        <button className="btn btn-secondary" onClick={onBack}><Icon name="arrowL" size={14} /> Oldingi</button>
        <div style={{ display: 'flex', gap: 8 }}>
          {isAdmin && canPublish && course.status !== 'published' && (
            <button className="btn btn-primary" onClick={onPublishDirect} disabled={busy}>
              <Icon name="check" size={14} /> {busy ? 'Saqlanmoqda…' : 'Darhol nashr etish'}
            </button>
          )}
          {!isAdmin && (course.status === 'draft' || course.status === 'rejected') && (
            <button className="btn btn-primary" onClick={onSubmit} disabled={busy || !canPublish}>
              <Icon name="check" size={14} /> {busy ? 'Yuborilmoqda…' : 'Moderatsiyaga yuborish'}
            </button>
          )}
        </div>
      </div>
    </>
  )
}

function Tile({ v, l }) {
  return (
    <div style={{ background: 'var(--white)', padding: 14, borderRadius: 8, border: '1px solid var(--border)' }}>
      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20 }}>{v}</div>
      <div className="text-xs text-muted mt-1">{l}</div>
    </div>
  )
}
