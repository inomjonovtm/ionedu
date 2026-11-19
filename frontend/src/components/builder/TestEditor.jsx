import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import api, { absUrl, apiError } from '../../api/client'
import Icon from '../Icon'
import Confirm from '../Confirm'
import { EmptyState } from '../Dash'

/* ════════════════════════════════════════════════════════════════
   TestEditor — the full test authoring surface.
   Used inline by the course studio (course tests) and by the
   standalone test manager. Tabs: Savollar · Sozlamalar · Natijalar.
   ════════════════════════════════════════════════════════════════ */

const QTYPES = [
  { id: 'single', label: 'Bitta javob', icon: 'checkC', hint: "Faqat bitta variant to'g'ri" },
  { id: 'multiple', label: 'Bir nechta javob', icon: 'list', hint: "Bir nechta variant to'g'ri" },
  { id: 'true_false', label: "To'g'ri / Noto'g'ri", icon: 'check', hint: 'Tasdiq rost yoki yolg\'on' },
  { id: 'text', label: 'Yozma javob', icon: 'pen', hint: "O'quvchi javobni o'zi yozadi" },
]
const QTYPE = Object.fromEntries(QTYPES.map(t => [t.id, t]))

const css = `
  .te-tabs { display: flex; gap: 4px; padding: 4px; background: var(--bg-soft); border: 1.5px solid var(--border); border-radius: 14px; width: fit-content; max-width: 100%; overflow-x: auto; }
  .te-tabs button { display: inline-flex; align-items: center; gap: 7px; padding: 8px 14px; border-radius: 10px; font-size: 13.5px; font-weight: 700; color: var(--text-3); white-space: nowrap; }
  .te-tabs button:hover { color: var(--text); }
  .te-tabs button.on { background: var(--ink); color: #fff; }
  .te-tabs .cnt { font-family: var(--font-mono); font-size: 10.5px; padding: 0 6px; border-radius: 99px; background: var(--sun); color: #14213D; }
  html[data-theme="dark"] .te-tabs button.on { background: var(--sun); color: #14213D; }
  html[data-theme="dark"] .te-tabs button.on .cnt { background: #14213D; color: var(--sun); }

  .te-toolbar { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; margin: 16px 0 14px; }
  .te-toolbar .sp { flex: 1; }
  .te-sum { font-size: 13px; color: var(--text-3); font-weight: 600; }
  .te-sum b { color: var(--text); }

  .te-q { background: var(--white); border: 1.5px solid var(--border); border-radius: 18px; margin-bottom: 10px; transition: border-color .14s ease, box-shadow .14s ease, opacity .14s ease; }
  .te-q:hover { border-color: var(--line); }
  .te-q.dragging { opacity: .4; }
  .te-q.over-top { box-shadow: 0 -4px 0 var(--sea); }
  .te-q.over-bot { box-shadow: 0 4px 0 var(--sea); }
  .te-q-head { display: flex; align-items: flex-start; gap: 10px; padding: 14px 14px 12px; }
  .te-grip { cursor: grab; color: var(--text-4); padding: 4px 0; flex-shrink: 0; }
  .te-grip:active { cursor: grabbing; }
  .te-num { width: 30px; height: 30px; border-radius: 10px; background: var(--sun); border: 1.5px solid var(--line); color: #14213D; font-family: var(--font-mono); font-weight: 700; font-size: 12.5px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .te-q-body { flex: 1; min-width: 0; }
  .te-q-text { font-weight: 700; font-size: 15px; line-height: 1.45; color: var(--text); white-space: pre-wrap; word-break: break-word; }
  .te-q-meta { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 8px; }
  .te-q-acts { display: flex; gap: 1px; flex-shrink: 0; }
  .te-opts { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; padding: 0 14px 14px 54px; }
  .te-opt { display: flex; align-items: center; gap: 8px; padding: 7px 10px; border-radius: 11px; background: var(--bg-soft); font-size: 13.5px; color: var(--text-2); min-width: 0; }
  .te-opt span:last-child { overflow: hidden; text-overflow: ellipsis; }
  .te-opt.ok { background: var(--green-100); color: var(--green-800); font-weight: 700; }
  .te-opt .mk { width: 20px; height: 20px; border-radius: 7px; background: var(--white); font-family: var(--font-mono); font-size: 11px; font-weight: 700; display: flex; align-items: center; justify-content: center; flex-shrink: 0; color: var(--text-3); }
  .te-opt.ok .mk { background: var(--green-600); color: #fff; }
  .te-img { margin: 0 14px 12px 54px; max-width: 280px; border-radius: 12px; border: 1.5px solid var(--border); overflow: hidden; }
  .te-img img { width: 100%; display: block; }
  .te-expl { margin: 0 14px 14px 54px; padding: 8px 12px; border-left: 3px solid var(--sun); background: var(--bg-soft); border-radius: 0 10px 10px 0; font-size: 13px; color: var(--text-2); }

  /* Question form */
  .te-form { background: var(--white); border: 2px solid var(--line); border-radius: 20px; box-shadow: var(--hard); padding: 18px; margin-bottom: 12px; }
  .te-form h4 { font-size: 17px; margin-bottom: 14px; display: flex; align-items: center; gap: 8px; }
  .te-types { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-bottom: 16px; }
  .te-type { text-align: left; padding: 10px 12px; border-radius: 14px; border: 1.5px solid var(--border); background: var(--white); transition: all .13s ease; }
  .te-type:hover { border-color: var(--line); }
  .te-type.on { border: 2px solid var(--line); background: var(--sun-soft); }
  .te-type .tl { font-weight: 750; font-size: 13.5px; display: flex; align-items: center; gap: 6px; }
  .te-type .th { font-size: 11.5px; color: var(--text-3); margin-top: 3px; line-height: 1.35; }
  .te-orow { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
  .te-mark { width: 40px; height: 40px; border-radius: 12px; border: 1.5px solid var(--border); background: var(--white); color: var(--text-4); display: flex; align-items: center; justify-content: center; flex-shrink: 0; font-family: var(--font-mono); font-weight: 700; font-size: 13px; transition: all .12s ease; }
  .te-mark:hover { border-color: var(--green-600); color: var(--green-600); }
  .te-mark.on { background: var(--green-600); border-color: var(--green-600); color: #fff; }
  .te-orow .input { height: 40px; }
  .te-orow .input.ok { border-color: var(--green-600); background: var(--green-50); }
  .te-form-foot { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; margin-top: 16px; padding-top: 14px; border-top: 1.5px dashed var(--border); }
  .te-form-foot .sp { flex: 1; }
  .te-row2 { display: grid; grid-template-columns: 120px 1fr; gap: 12px; }
  .te-imgpick { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
  .te-imgpick img { height: 64px; border-radius: 10px; border: 1.5px solid var(--border); }

  /* Settings */
  .te-set { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 16px; }
  .te-box { background: var(--white); border: 1.5px solid var(--border); border-radius: 20px; padding: 18px; }
  .te-box h4 { font-size: 16px; margin-bottom: 14px; display: flex; align-items: center; gap: 8px; }
  .te-sw { display: flex; align-items: flex-start; justify-content: space-between; gap: 14px; padding: 11px 0; border-bottom: 1.5px dashed var(--border-2); }
  .te-sw:last-child { border-bottom: none; padding-bottom: 0; }
  .te-sw .t { font-weight: 700; font-size: 14px; }
  .te-sw .d { font-size: 12.5px; color: var(--text-3); margin-top: 2px; line-height: 1.45; }
  .te-g2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }

  /* Stats */
  .te-kpis { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin: 16px 0; }
  .te-kpi { background: var(--white); border: 1.5px solid var(--border); border-radius: 18px; padding: 14px 16px; }
  .te-kpi .v { font-family: var(--font-display); font-size: 28px; font-weight: 800; letter-spacing: -.04em; line-height: 1; }
  .te-kpi .l { font-size: 12px; color: var(--text-3); font-weight: 650; margin-top: 6px; }
  .te-dist { display: flex; align-items: flex-end; gap: 10px; height: 130px; padding-top: 8px; }
  .te-dist .col { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 6px; height: 100%; justify-content: flex-end; }
  .te-dist .bar { width: 100%; border-radius: 10px 10px 4px 4px; border: 1.5px solid var(--line); min-height: 6px; }
  .te-dist .lb { font-family: var(--font-mono); font-size: 10px; color: var(--text-3); }
  .te-dist .nv { font-family: var(--font-mono); font-size: 11px; font-weight: 700; }
  .te-qrate { display: flex; align-items: center; gap: 12px; padding: 9px 0; border-bottom: 1.5px dashed var(--border-2); font-size: 13.5px; }
  .te-qrate:last-child { border-bottom: none; }
  .te-qrate .tx { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .te-qrate .pr { width: 110px; flex-shrink: 0; }

  /* Import */
  .te-import textarea { font-family: var(--font-mono); font-size: 13px; min-height: 260px; line-height: 1.6; }
  .te-help { background: var(--bg-soft); border-radius: 14px; padding: 12px 14px; font-size: 12.5px; line-height: 1.7; color: var(--text-2); font-family: var(--font-mono); white-space: pre-wrap; }

  @media (max-width: 900px) {
    .te-types { grid-template-columns: 1fr 1fr; } .te-set { grid-template-columns: 1fr; } .te-kpis { grid-template-columns: 1fr 1fr; }
  }
  @media (max-width: 600px) {
    .te-opts { grid-template-columns: 1fr; padding-left: 14px; } .te-img, .te-expl { margin-left: 14px; }
    .te-g2, .te-row2 { grid-template-columns: 1fr; }
  }
`

const blankOptions = (type) => {
  if (type === 'true_false') return [{ text: "To'g'ri", is_correct: true }, { text: "Noto'g'ri", is_correct: false }]
  if (type === 'text') return [{ text: '', is_correct: true }]
  return Array.from({ length: 4 }, (_, i) => ({ text: '', is_correct: i === 0 }))
}

/** Client-side mirror of the server rules, so errors show before saving. */
function validateQuestion(q) {
  if (!q.text.trim()) return 'Savol matnini kiriting'
  const opts = q.options.map(o => ({ ...o, text: o.text.trim() })).filter(o => o.text)
  const correct = opts.filter(o => o.is_correct).length
  if (q.question_type === 'text') return opts.length ? null : "Kamida bitta to'g'ri javob variantini yozing"
  if (opts.length < 2) return 'Kamida 2 ta variant kiriting'
  if (new Set(opts.map(o => o.text.toLowerCase())).size !== opts.length) return 'Variantlar takrorlanmasligi kerak'
  if (q.question_type === 'multiple') return correct >= 1 ? null : "Kamida bitta to'g'ri javobni belgilang"
  return correct === 1 ? null : "Aynan bitta to'g'ri javobni belgilang"
}

/**
 * Parse pasted text into questions.
 *   1. Savol matni            ← a new question (number optional)
 *   A) variant                 ← option
 *   *B) to'g'ri variant        ← "*" or "+" marks the correct option
 *   Javob: Toshkent; Tashkent  ← written-answer question (accepted answers)
 *   Izoh: ...                  ← explanation shown after the test
 * Questions are separated by a blank line.
 */
function parseQuestions(raw) {
  const blocks = raw.replace(/\r/g, '').split(/\n\s*\n/).map(b => b.trim()).filter(Boolean)
  const out = []
  blocks.forEach((block, bi) => {
    const lines = block.split('\n').map(l => l.trim()).filter(Boolean)
    if (!lines.length) return
    const q = { text: '', question_type: 'single', points: 1, explanation: '', options: [], _n: bi + 1 }
    const textLines = []
    for (const line of lines) {
      const ans = line.match(/^(javob|answer)\s*[:：]\s*(.+)$/i)
      const expl = line.match(/^(izoh|tushuntirish)\s*[:：]\s*(.+)$/i)
      const pts = line.match(/^ball\s*[:：]\s*(\d+)$/i)
      const opt = line.match(/^([*+])?\s*([A-Ha-h]|\d{1,2})\s*[).]\s*(.+)$/)
      if (ans) {
        q.question_type = 'text'
        q.options = ans[2].split(/[;|]/).map(t => t.trim()).filter(Boolean).map(t => ({ text: t, is_correct: true }))
      } else if (expl) q.explanation = expl[2]
      else if (pts) q.points = Math.max(1, Math.min(100, Number(pts[1])))
      else if (opt && (textLines.length > 0) && (opt[1] || /^[A-Ha-h]$/.test(opt[2]) || q.options.length > 0)) {
        let text = opt[3]
        let ok = !!opt[1]
        if (/\s[*+]$/.test(text)) { ok = true; text = text.replace(/\s[*+]$/, '') }
        q.options.push({ text: text.trim(), is_correct: ok })
      } else textLines.push(line.replace(/^\d{1,3}\s*[).]\s*/, ''))
    }
    q.text = textLines.join('\n')
    if (q.question_type !== 'text') {
      const c = q.options.filter(o => o.is_correct).length
      const tf = q.options.length === 2 && q.options.every(o => /^(to'g'ri|noto'g'ri|ha|yo'q|rost|yolg'on|true|false)$/i.test(o.text.replace(/[ʻʼ’‘`]/g, "'")))
      q.question_type = tf ? 'true_false' : c > 1 ? 'multiple' : 'single'
    }
    q._error = validateQuestion(q)
    out.push(q)
  })
  return out
}

const errMsg = apiError

/* ─────────────────────────── Question form ─────────────────────────── */

function QuestionForm({ testId, question, onClose, onSaved }) {
  const isEdit = !!question?.id
  const [q, setQ] = useState(() => ({
    text: question?.text || '',
    question_type: question?.question_type || 'single',
    points: question?.points || 1,
    explanation: question?.explanation || '',
    options: question?.options?.length
      ? question.options.map(o => ({ text: o.text, is_correct: o.is_correct }))
      : blankOptions(question?.question_type || 'single'),
  }))
  const [image, setImage] = useState(null)            // File to upload
  const [imageUrl, setImageUrl] = useState(question?.image ? absUrl(question.image) : '')
  const [removeImage, setRemoveImage] = useState(false)
  const [busy, setBusy] = useState(false)
  const [touched, setTouched] = useState(false)
  const textRef = useRef(null)
  const optRefs = useRef([])

  useEffect(() => { textRef.current?.focus() }, [])

  const set = (patch) => setQ(s => ({ ...s, ...patch }))
  const type = q.question_type
  const error = validateQuestion(q)

  function changeType(next) {
    if (next === type) return
    let options = q.options
    if (next === 'true_false' || next === 'text' || type === 'true_false' || type === 'text') options = blankOptions(next)
    else if (next === 'single') {
      const first = options.findIndex(o => o.is_correct)
      options = options.map((o, i) => ({ ...o, is_correct: i === (first < 0 ? 0 : first) }))
    }
    set({ question_type: next, options })
  }

  function mark(i) {
    if (type === 'text') return
    set({
      options: q.options.map((o, k) => type === 'multiple'
        ? (k === i ? { ...o, is_correct: !o.is_correct } : o)
        : { ...o, is_correct: k === i }),
    })
  }
  const setOpt = (i, text) => set({ options: q.options.map((o, k) => k === i ? { ...o, text } : o) })
  function addOpt() {
    if (q.options.length >= 8) return
    set({ options: [...q.options, { text: '', is_correct: type === 'text' }] })
    requestAnimationFrame(() => optRefs.current[q.options.length]?.focus())
  }
  const delOpt = (i) => set({ options: q.options.filter((_, k) => k !== i) })

  function pickImage(e) {
    const f = e.target.files?.[0]
    if (!f) return
    if (f.size > 5 * 1024 * 1024) return toast.error('Rasm hajmi 5 MB dan oshmasin')
    setImage(f); setImageUrl(URL.createObjectURL(f)); setRemoveImage(false)
  }

  async function save(addAnother) {
    setTouched(true)
    if (error) return toast.error(error)
    setBusy(true)
    try {
      const payload = {
        text: q.text.trim(), question_type: type, points: Number(q.points) || 1,
        explanation: q.explanation.trim(),
        options: q.options.filter(o => o.text.trim()).map((o, i) => ({ text: o.text.trim(), is_correct: type === 'text' ? true : o.is_correct, order: i })),
      }
      const { data } = isEdit
        ? await api.patch(`/questions/${question.id}/`, payload)
        : await api.post(`/tests/${testId}/questions/`, payload)
      if (image) {
        const fd = new FormData(); fd.append('image', image)
        await api.post(`/questions/${data.id}/image/`, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      } else if (removeImage && isEdit) {
        await api.delete(`/questions/${data.id}/image/`)
      }
      toast.success(isEdit ? 'Savol saqlandi' : "Savol qo'shildi")
      onSaved(addAnother)
    } catch (e) { toast.error(errMsg(e, 'Savolni saqlashda xatolik')) }
    finally { setBusy(false) }
  }

  function onKey(e) {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); save(e.shiftKey && !isEdit) }
    if (e.key === 'Escape') onClose()
  }

  return (
    <div className="te-form fade-up" onKeyDown={onKey}>
      <h4><Icon name={isEdit ? 'edit' : 'plus'} size={17} /> {isEdit ? 'Savolni tahrirlash' : 'Yangi savol'}</h4>

      <div className="te-types">
        {QTYPES.map(t => (
          <button key={t.id} type="button" className={`te-type ${type === t.id ? 'on' : ''}`} onClick={() => changeType(t.id)}>
            <div className="tl"><Icon name={t.icon} size={14} /> {t.label}</div>
            <div className="th">{t.hint}</div>
          </button>
        ))}
      </div>

      <div className="field">
        <label className="label">Savol matni</label>
        <textarea ref={textRef} className="textarea" rows={2} value={q.text} onChange={e => set({ text: e.target.value })}
          placeholder="Masalan: Dunyodagi eng uzun daryo qaysi?" />
      </div>

      <div className="field">
        <label className="label">
          {type === 'text' ? "Qabul qilinadigan javoblar" : 'Javob variantlari'}
          <span className="text-muted" style={{ fontWeight: 500, marginLeft: 8 }}>
            {type === 'text' ? "— katta-kichik harf va tinish belgilari farq qilmaydi"
              : type === 'multiple' ? "— to'g'ri variantlarni belgilang" : "— to'g'ri variantni belgilang"}
          </span>
        </label>
        {q.options.map((o, i) => (
          <div className="te-orow" key={i}>
            {type !== 'text' && (
              <button type="button" className={`te-mark ${o.is_correct ? 'on' : ''}`} onClick={() => mark(i)}
                title={o.is_correct ? "To'g'ri javob" : "To'g'ri deb belgilash"} aria-pressed={o.is_correct}>
                {o.is_correct ? <Icon name="check" size={17} /> : String.fromCharCode(65 + i)}
              </button>
            )}
            <input ref={el => { optRefs.current[i] = el }} className={`input ${o.is_correct && type !== 'text' ? 'ok' : ''}`}
              value={o.text} disabled={type === 'true_false'}
              onChange={e => setOpt(i, e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.ctrlKey && !e.metaKey) {
                  e.preventDefault()
                  if (i === q.options.length - 1) addOpt(); else optRefs.current[i + 1]?.focus()
                }
              }}
              placeholder={type === 'text' ? (i === 0 ? "To'g'ri javob" : 'Muqobil yozilishi') : `${String.fromCharCode(65 + i)} variant`} />
            {type !== 'true_false' && q.options.length > (type === 'text' ? 1 : 2) && (
              <button type="button" className="icon-btn danger" onClick={() => delOpt(i)} title="Variantni o'chirish"><Icon name="x" size={15} /></button>
            )}
          </div>
        ))}
        {type !== 'true_false' && q.options.length < 8 && (
          <button type="button" className="btn btn-ghost btn-sm" onClick={addOpt}>
            <Icon name="plus" size={13} /> {type === 'text' ? "Muqobil javob qo'shish" : "Variant qo'shish"}
          </button>
        )}
      </div>

      <div className="te-row2">
        <div className="field">
          <label className="label">Ball</label>
          <input className="input" type="number" min={1} max={100} value={q.points} onChange={e => set({ points: e.target.value })} />
        </div>
        <div className="field">
          <label className="label">Rasm <span className="text-muted" style={{ fontWeight: 500 }}>(ixtiyoriy — xarita, diagramma…)</span></label>
          <div className="te-imgpick">
            {imageUrl && <img src={imageUrl} alt="" />}
            <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer' }}>
              <Icon name="image" size={14} /> {imageUrl ? 'Almashtirish' : 'Rasm tanlash'}
              <input type="file" accept="image/*" hidden onChange={pickImage} />
            </label>
            {imageUrl && <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setImage(null); setImageUrl(''); setRemoveImage(true) }}>Olib tashlash</button>}
          </div>
        </div>
      </div>

      <div className="field" style={{ marginBottom: 0 }}>
        <label className="label">Izoh <span className="text-muted" style={{ fontWeight: 500 }}>(ixtiyoriy — test tugagach o'quvchiga ko'rsatiladi)</span></label>
        <textarea className="textarea" rows={2} style={{ minHeight: 60 }} value={q.explanation} onChange={e => set({ explanation: e.target.value })}
          placeholder="Nega aynan shu javob to'g'ri ekanini tushuntiring" />
      </div>

      {touched && error && <div className="field-error" style={{ marginTop: 10 }}>{error}</div>}

      <div className="te-form-foot">
        <span className="text-xs text-muted">Ctrl+Enter — saqlash · Esc — yopish</span>
        <span className="sp" />
        <button type="button" className="btn btn-ghost btn-sm" onClick={onClose} disabled={busy}>Bekor qilish</button>
        {!isEdit && <button type="button" className="btn btn-secondary btn-sm" onClick={() => save(true)} disabled={busy}>Saqlash va yana qo'shish</button>}
        <button type="button" className="btn btn-primary btn-sm" onClick={() => save(false)} disabled={busy}>
          {busy ? 'Saqlanmoqda…' : 'Saqlash'}
        </button>
      </div>
    </div>
  )
}

/* ─────────────────────────── Import modal ─────────────────────────── */

const IMPORT_SAMPLE = `1. Dunyodagi eng katta okean qaysi?
A) Atlantika okeani
*B) Tinch okeani
C) Hind okeani
D) Shimoliy Muz okeani
Izoh: Tinch okeani Yer yuzining uchdan biridan ko'pini egallaydi.

2. Quyidagilardan qaysilari materik?
*A) Afrika
*B) Avstraliya
C) Grenlandiya

3. O'zbekiston poytaxti qaysi shahar?
Javob: Toshkent; Tashkent`

function ImportModal({ testId, onClose, onDone }) {
  const [raw, setRaw] = useState('')
  const [busy, setBusy] = useState(false)
  const parsed = raw.trim() ? parseQuestions(raw) : []
  const bad = parsed.filter(q => q._error)

  async function submit() {
    if (!parsed.length || bad.length) return
    setBusy(true)
    try {
      const questions = parsed.map(q => ({ text: q.text, question_type: q.question_type, points: q.points, explanation: q.explanation, options: q.options.map((o, i) => ({ ...o, order: i })) }))
      const { data } = await api.post(`/tests/${testId}/questions/bulk/`, { questions })
      toast.success(`${data.created} ta savol qo'shildi`)
      onDone()
    } catch (e) { toast.error(errMsg(e, 'Import qilishda xatolik')) }
    finally { setBusy(false) }
  }

  return (
    <div className="modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget && !busy) onClose() }}>
      <div className="modal te-import" style={{ maxWidth: 860 }}>
        <h3 style={{ fontSize: 22, marginBottom: 4 }}>Savollarni matndan import qilish</h3>
        <p className="text-sm text-muted" style={{ marginBottom: 16 }}>Word yoki boshqa fayldan savollarni ko'chirib qo'ying — bir yo'la hammasi qo'shiladi.</p>
        <div className="te-g2" style={{ gridTemplateColumns: '1.4fr 1fr', alignItems: 'start' }}>
          <div>
            <textarea className="textarea" value={raw} onChange={e => setRaw(e.target.value)} autoFocus spellCheck={false}
              placeholder={'1. Savol matni\nA) variant\n*B) to\'g\'ri variant\nC) variant'} />
            <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setRaw(IMPORT_SAMPLE)}>Namuna qo'yish</button>
              {parsed.length > 0 && (
                <span className="text-sm" style={{ fontWeight: 700, color: bad.length ? 'var(--red-600)' : 'var(--green-700)' }}>
                  {parsed.length} ta savol aniqlandi{bad.length > 0 && ` · ${bad.length} tasida xato`}
                </span>
              )}
            </div>
            {bad.length > 0 && (
              <div style={{ marginTop: 10, maxHeight: 110, overflowY: 'auto' }}>
                {bad.map(q => (
                  <div key={q._n} className="field-error" style={{ marginTop: 4 }}>
                    {q._n}-savol{q.text ? ` («${q.text.slice(0, 40)}…»)` : ''}: {q._error}
                  </div>
                ))}
              </div>
            )}
          </div>
          <div>
            <div className="label">Format qoidalari</div>
            <div className="te-help">{`• Savollar orasida bo'sh qator
• Variantlar: A) B) C) …
• To'g'ri variant oldiga * yoki +
• Bir nechta * → ko'p javobli savol
• Javob: matn; muqobil → yozma savol
• Izoh: tushuntirish (ixtiyoriy)
• Ball: 2 (ixtiyoriy)`}</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 18 }}>
          <button className="btn btn-secondary" onClick={onClose} disabled={busy}>Bekor qilish</button>
          <button className="btn btn-primary" onClick={submit} disabled={busy || !parsed.length || bad.length > 0}>
            {busy ? 'Qo\'shilmoqda…' : `${parsed.length || ''} ta savolni qo'shish`}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─────────────────────────── Settings tab ─────────────────────────── */

function Switch({ checked, onChange, title, desc }) {
  return (
    <div className="te-sw">
      <div><div className="t">{title}</div>{desc && <div className="d">{desc}</div>}</div>
      <label className="switch"><input type="checkbox" checked={!!checked} onChange={e => onChange(e.target.checked)} /><span /></label>
    </div>
  )
}

function SettingsTab({ test, standalone, onSaved }) {
  const blank = (v) => v ?? ''
  const init = () => ({
    title: test.title, description: test.description || '',
    time_limit_minutes: blank(test.time_limit_minutes), pass_percent: test.pass_percent,
    question_limit: blank(test.question_limit), max_attempts: blank(test.max_attempts),
    shuffle_questions: test.shuffle_questions, shuffle_options: test.shuffle_options,
    show_answers: test.show_answers, strict_mode: test.strict_mode, focus_loss_limit: test.focus_loss_limit,
    category: blank(test.category), is_public: test.is_public,
  })
  const [f, setF] = useState(init)
  const [busy, setBusy] = useState(false)
  const set = (k, v) => setF(s => ({ ...s, [k]: v }))
  const dirty = JSON.stringify(f) !== JSON.stringify(init())

  const { data: cats = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.get('/categories/').then(r => r.data.results || r.data),
    enabled: standalone,
  })

  async function save(e) {
    e?.preventDefault()
    if (!f.title.trim()) return toast.error('Test nomini kiriting')
    setBusy(true)
    try {
      const num = (v) => (v === '' || v === null ? null : Number(v))
      const payload = {
        ...f, title: f.title.trim(),
        time_limit_minutes: num(f.time_limit_minutes), question_limit: num(f.question_limit),
        max_attempts: num(f.max_attempts), pass_percent: Number(f.pass_percent) || 0,
        focus_loss_limit: Number(f.focus_loss_limit) || 3,
        category: standalone ? num(f.category) : test.category,
      }
      if (!standalone) delete payload.is_public
      await api.patch(`/tests/${test.id}/`, payload)
      toast.success('Sozlamalar saqlandi')
      onSaved()
    } catch (err) { toast.error(errMsg(err, 'Saqlashda xatolik')) }
    finally { setBusy(false) }
  }

  return (
    <form onSubmit={save}>
      <div className="te-set">
        <div className="te-box">
          <h4><Icon name="fileText" size={16} /> Asosiy</h4>
          <div className="field">
            <label className="label">Test nomi</label>
            <input className="input" value={f.title} onChange={e => set('title', e.target.value)} maxLength={200} required />
          </div>
          <div className="field">
            <label className="label">Tavsif <span className="text-muted" style={{ fontWeight: 500 }}>(test boshlanishidan oldin ko'rinadi)</span></label>
            <textarea className="textarea" rows={3} value={f.description} onChange={e => set('description', e.target.value)} />
          </div>
          <div className="te-g2">
            <div className="field">
              <label className="label">Vaqt chegarasi (daqiqa)</label>
              <input className="input" type="number" min={1} max={600} value={f.time_limit_minutes}
                onChange={e => set('time_limit_minutes', e.target.value)} placeholder="Cheksiz" />
            </div>
            <div className="field">
              <label className="label">O'tish bali (%)</label>
              <input className="input" type="number" min={0} max={100} value={f.pass_percent} onChange={e => set('pass_percent', e.target.value)} />
            </div>
          </div>
          {standalone && (
            <div className="field" style={{ marginBottom: 0 }}>
              <label className="label">Kategoriya</label>
              <select className="select" value={f.category} onChange={e => set('category', e.target.value)}>
                <option value="">Kategoriyasiz</option>
                {cats.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
              </select>
            </div>
          )}
        </div>

        <div className="te-box">
          <h4><Icon name="sliders" size={16} /> Topshirish qoidalari</h4>
          {standalone && (
            <Switch checked={f.is_public} onChange={v => set('is_public', v)} title="Ommaga ochiq"
              desc="Yoqilsa, test «Testlar» katalogida hamma uchun ko'rinadi." />
          )}
          <Switch checked={f.shuffle_questions} onChange={v => set('shuffle_questions', v)} title="Savollarni aralashtirish"
            desc="Har bir urinishda savollar tartibi har xil bo'ladi." />
          <Switch checked={f.shuffle_options} onChange={v => set('shuffle_options', v)} title="Variantlarni aralashtirish"
            desc="A, B, C variantlar o'rni har bir o'quvchida boshqacha." />
          <Switch checked={f.show_answers} onChange={v => set('show_answers', v)} title="To'g'ri javoblarni ko'rsatish"
            desc="Test tugagach o'quvchi to'g'ri javob va izohlarni ko'radi." />
          <Switch checked={f.strict_mode} onChange={v => set('strict_mode', v)} title="Nazorat rejimi"
            desc="Boshqa oyna yoki varaqqa o'tish qoidabuzarlik sifatida sanaladi." />
          {f.strict_mode && (
            <div className="field" style={{ marginTop: 12, marginBottom: 0 }}>
              <label className="label">Nechta qoidabuzarlikdan keyin test yakunlansin</label>
              <input className="input" type="number" min={1} max={20} value={f.focus_loss_limit} onChange={e => set('focus_loss_limit', e.target.value)} />
            </div>
          )}
          <div className="te-g2" style={{ marginTop: 14 }}>
            <div className="field" style={{ marginBottom: 0 }}>
              <label className="label">Urinishlar soni</label>
              <input className="input" type="number" min={1} max={99} value={f.max_attempts}
                onChange={e => set('max_attempts', e.target.value)} placeholder="Cheksiz" />
            </div>
            <div className="field" style={{ marginBottom: 0 }}>
              <label className="label">Savollar banki</label>
              <input className="input" type="number" min={1} value={f.question_limit}
                onChange={e => set('question_limit', e.target.value)} placeholder="Hammasi" />
              <div className="field-hint">Har urinishda tasodifiy N ta savol beriladi</div>
            </div>
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16, alignItems: 'center' }}>
        {dirty && <span className="text-sm" style={{ color: 'var(--amber-600)', fontWeight: 700 }}>Saqlanmagan o'zgarishlar bor</span>}
        <button type="submit" className="btn btn-primary" disabled={busy || !dirty}>{busy ? 'Saqlanmoqda…' : 'Sozlamalarni saqlash'}</button>
      </div>
    </form>
  )
}

/* ─────────────────────────── Stats tab ─────────────────────────── */

const fmtDur = (s) => !s ? '—' : s < 60 ? `${s} son` : `${Math.floor(s / 60)} daq ${s % 60 ? `${s % 60} son` : ''}`
const REASON = { manual: '', timeout: 'Vaqt tugadi', focus_lost: 'Qoidabuzarlik', left: 'Tark etdi' }

function StatsTab({ testId, resultBase }) {
  const { data: st, isLoading, isError } = useQuery({
    queryKey: ['test-stats', testId],
    queryFn: () => api.get(`/tests/${testId}/stats/`).then(r => r.data),
  })
  if (isLoading) return <div className="loading-state"><span className="spinner" />Statistika yuklanmoqda…</div>
  if (isError) return <EmptyState icon="alert" title="Statistikani yuklab bo'lmadi" />
  if (!st.attempts) {
    return <EmptyState icon="chart" title="Hali natijalar yo'q" sub="O'quvchilar testni topshirgach, bu yerda ballar, eng qiyin savollar va urinishlar ko'rinadi." />
  }
  const max = Math.max(...st.distribution, 1)
  const COLORS = ['var(--coral)', '#FF9D88', 'var(--sun)', '#8FE0B4', 'var(--green-600)']
  const hardest = [...st.questions].filter(q => q.correct_rate !== null).sort((a, b) => a.correct_rate - b.correct_rate)

  return (
    <>
      <div className="te-kpis">
        <div className="te-kpi"><div className="v">{st.attempts}</div><div className="l">Urinishlar · {st.students} o'quvchi</div></div>
        <div className="te-kpi"><div className="v">{Math.round(st.avg_score)}%</div><div className="l">O'rtacha ball</div></div>
        <div className="te-kpi"><div className="v">{st.pass_rate}%</div><div className="l">O'tganlar ulushi</div></div>
        <div className="te-kpi"><div className="v" style={{ fontSize: 22 }}>{fmtDur(st.avg_duration_seconds)}</div><div className="l">O'rtacha vaqt</div></div>
      </div>
      <div className="te-set" style={{ marginTop: 0 }}>
        <div className="te-box">
          <h4><Icon name="chart" size={16} /> Ballar taqsimoti</h4>
          <div className="te-dist">
            {st.distribution.map((n, i) => (
              <div className="col" key={i}>
                <span className="nv">{n}</span>
                <div className="bar" style={{ height: `${(n / max) * 100}%`, background: COLORS[i] }} />
                <span className="lb">{i * 20}–{i === 4 ? 100 : i * 20 + 19}%</span>
              </div>
            ))}
          </div>
        </div>
        <div className="te-box">
          <h4><Icon name="target" size={16} /> Eng qiyin savollar</h4>
          {hardest.slice(0, 6).map(q => (
            <div className="te-qrate" key={q.id}>
              <span className="font-mono text-xs text-muted">#{q.number}</span>
              <span className="tx" title={q.text}>{q.text}</span>
              <div className="pr">
                <div className="progress"><div className="progress-fill" style={{ width: `${q.correct_rate}%`, background: q.correct_rate < 40 ? 'var(--coral)' : q.correct_rate < 70 ? 'var(--sun)' : 'var(--green-600)' }} /></div>
              </div>
              <b className="font-mono text-xs" style={{ width: 36, textAlign: 'right' }}>{q.correct_rate}%</b>
            </div>
          ))}
        </div>
      </div>
      <div className="te-box" style={{ marginTop: 16, padding: 0, overflow: 'hidden' }}>
        <h4 style={{ padding: '16px 18px 0' }}><Icon name="users" size={16} /> So'nggi urinishlar</h4>
        <div style={{ overflowX: 'auto' }}>
          <table className="table">
            <thead><tr><th>O'quvchi</th><th>Ball</th><th>To'g'ri</th><th>Vaqt</th><th>Sana</th><th></th></tr></thead>
            <tbody>
              {st.recent.map(a => (
                <tr key={a.id}>
                  <td>
                    <span style={{ fontWeight: 700, color: 'var(--text)' }}>{a.student.display_name}</span>
                    {(REASON[a.finish_reason] || a.focus_losses > 0) && (
                      <span className="badge badge-amber" style={{ marginLeft: 8 }}>
                        {REASON[a.finish_reason] || `${a.focus_losses} ta chalg'ish`}
                      </span>
                    )}
                  </td>
                  <td><span className={`badge badge-${a.passed ? 'green' : 'red'}`}>{Math.round(a.score_percent)}%</span></td>
                  <td className="font-mono text-sm">{a.correct_count}/{a.correct_count + a.wrong_count}</td>
                  <td className="text-sm">{fmtDur(a.duration_seconds)}</td>
                  <td className="text-sm text-muted">{new Date(a.finished_at).toLocaleString('uz-UZ', { dateStyle: 'short', timeStyle: 'short' })}</td>
                  <td>{resultBase && <Link to={`${resultBase}/${a.id}`} className="icon-btn" title="Javoblarini ko'rish"><Icon name="eye" size={15} /></Link>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}

/* ─────────────────────────── Main ─────────────────────────── */

export default function TestEditor({ testId, standalone = false, onChanged, initialTab = 'questions' }) {
  const qc = useQueryClient()
  const [tab, setTab] = useState(initialTab)
  const [editing, setEditing] = useState(null)   // null | 'new' | question id
  const [importing, setImporting] = useState(false)
  const [toDelete, setToDelete] = useState(null)
  const [busyDel, setBusyDel] = useState(false)
  const [drag, setDrag] = useState(null)         // { id, over, pos }
  const [order, setOrder] = useState(null)       // optimistic id order

  const { data: test, isLoading, isError } = useQuery({
    queryKey: ['test-edit', testId],
    queryFn: () => api.get(`/tests/${testId}/detail/`).then(r => r.data),
  })

  useEffect(() => { setEditing(null); setTab(initialTab); setOrder(null) }, [testId, initialTab])

  const refresh = () => {
    setOrder(null)
    qc.invalidateQueries({ queryKey: ['test-edit', testId] })
    qc.invalidateQueries({ queryKey: ['test-stats', testId] })
    onChanged?.()
  }

  if (isLoading) return <div className="loading-state"><span className="spinner" />Test yuklanmoqda…</div>
  if (isError || !test) return <EmptyState icon="alert" title="Testni yuklab bo'lmadi" sub="Sahifani yangilab, qayta urinib ko'ring." />

  const byId = Object.fromEntries(test.questions.map(q => [q.id, q]))
  const questions = order ? order.map(id => byId[id]).filter(Boolean) : test.questions
  const totalPoints = questions.reduce((s, q) => s + q.points, 0)

  async function saveOrder(ids) {
    setOrder(ids)
    try { await api.post(`/tests/${testId}/questions/reorder/`, { ids }); refresh() }
    catch { toast.error("Tartibni saqlab bo'lmadi"); setOrder(null) }
  }
  function move(i, dir) {
    const ids = questions.map(q => q.id)
    const j = i + dir
    if (j < 0 || j >= ids.length) return
    ;[ids[i], ids[j]] = [ids[j], ids[i]]
    saveOrder(ids)
  }
  function drop() {
    if (!drag || drag.over == null || drag.over === drag.id) return setDrag(null)
    const ids = questions.map(q => q.id).filter(id => id !== drag.id)
    let at = ids.indexOf(drag.over)
    if (drag.pos === 'bot') at += 1
    ids.splice(at, 0, drag.id)
    setDrag(null)
    saveOrder(ids)
  }
  async function duplicate(q) {
    try {
      await api.post(`/tests/${testId}/questions/`, {
        text: q.text, question_type: q.question_type, points: q.points, explanation: q.explanation || '',
        options: q.options.map((o, i) => ({ text: o.text, is_correct: o.is_correct, order: i })),
      })
      toast.success('Savol nusxalandi'); refresh()
    } catch (e) { toast.error(errMsg(e, "Nusxalab bo'lmadi")) }
  }
  async function remove() {
    setBusyDel(true)
    try { await api.delete(`/questions/${toDelete.id}/`); toast.success("Savol o'chirildi"); setToDelete(null); refresh() }
    catch (e) { toast.error(errMsg(e, "O'chirib bo'lmadi")) }
    finally { setBusyDel(false) }
  }

  const resultBase = test.course_slug ? `/learn/${test.course_slug}/test/${testId}/result` : `/tests/${testId}/result`
  const takeUrl = test.course_slug ? `/learn/${test.course_slug}/test/${testId}` : `/tests/${testId}/take`

  return (
    <div>
      <style>{css}</style>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <div className="te-tabs">
          <button className={tab === 'questions' ? 'on' : ''} onClick={() => setTab('questions')}>
            <Icon name="list" size={15} /> Savollar <span className="cnt">{test.questions.length}</span>
          </button>
          <button className={tab === 'settings' ? 'on' : ''} onClick={() => setTab('settings')}><Icon name="sliders" size={15} /> Sozlamalar</button>
          <button className={tab === 'stats' ? 'on' : ''} onClick={() => setTab('stats')}><Icon name="chart" size={15} /> Natijalar</button>
        </div>
        <span style={{ flex: 1 }} />
        {test.questions.length > 0 && (
          <Link to={takeUrl} target="_blank" className="btn btn-secondary btn-sm" title="Testni o'quvchi sifatida sinab ko'rish">
            <Icon name="play" size={13} /> Sinab ko'rish
          </Link>
        )}
      </div>

      {tab === 'settings' && <SettingsTab key={test.id + JSON.stringify(test.title)} test={test} standalone={standalone} onSaved={refresh} />}
      {tab === 'stats' && <StatsTab testId={testId} resultBase={resultBase} />}

      {tab === 'questions' && (
        <>
          <div className="te-toolbar">
            <span className="te-sum">
              <b>{questions.length}</b> ta savol · jami <b>{totalPoints}</b> ball
              {test.time_limit_minutes ? <> · <b>{test.time_limit_minutes}</b> daqiqa</> : ' · vaqt cheksiz'}
              {' '}· o'tish <b>{test.pass_percent}%</b>
              {test.question_limit && questions.length > test.question_limit ? <> · har urinishda <b>{test.question_limit}</b> tasi</> : null}
            </span>
            <span className="sp" />
            <button className="btn btn-secondary btn-sm" onClick={() => setImporting(true)}><Icon name="upload" size={13} /> Matndan import</button>
            <button className="btn btn-primary btn-sm" onClick={() => setEditing('new')} disabled={editing === 'new'}><Icon name="plus" size={13} /> Savol qo'shish</button>
          </div>

          {questions.length === 0 && editing !== 'new' && (
            <div className="card">
              <EmptyState icon="fileText" title="Bu testda hali savol yo'q"
                sub="Savollarni bittalab qo'shing yoki tayyor matndan bir yo'la import qiling."
                action={<div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
                  <button className="btn btn-primary btn-sm" onClick={() => setEditing('new')}><Icon name="plus" size={13} /> Birinchi savol</button>
                  <button className="btn btn-secondary btn-sm" onClick={() => setImporting(true)}><Icon name="upload" size={13} /> Import</button>
                </div>} />
            </div>
          )}

          {questions.map((q, i) => editing === q.id ? (
            <QuestionForm key={q.id} testId={testId} question={q} onClose={() => setEditing(null)}
              onSaved={() => { setEditing(null); refresh() }} />
          ) : (
            <div key={q.id}
              className={`te-q ${drag?.id === q.id ? 'dragging' : ''} ${drag?.over === q.id && drag.id !== q.id ? (drag.pos === 'top' ? 'over-top' : 'over-bot') : ''}`}
              onDragOver={e => {
                if (!drag) return
                e.preventDefault()
                const r = e.currentTarget.getBoundingClientRect()
                const pos = e.clientY < r.top + r.height / 2 ? 'top' : 'bot'
                if (drag.over !== q.id || drag.pos !== pos) setDrag(d => ({ ...d, over: q.id, pos }))
              }}
              onDrop={e => { e.preventDefault(); drop() }}>
              <div className="te-q-head">
                <span className="te-grip" draggable title="Sudrab tartibini o'zgartiring"
                  onDragStart={e => { e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', String(q.id)); setDrag({ id: q.id, over: null }) }}
                  onDragEnd={() => setDrag(null)}>
                  <Icon name="drag" size={17} />
                </span>
                <span className="te-num">{i + 1}</span>
                <div className="te-q-body">
                  <div className="te-q-text">{q.text}</div>
                  <div className="te-q-meta">
                    <span className="badge badge-blue"><Icon name={QTYPE[q.question_type]?.icon} size={11} /> {QTYPE[q.question_type]?.label}</span>
                    <span className="badge badge-amber">{q.points} ball</span>
                    {q.image && <span className="badge badge-gray"><Icon name="image" size={11} /> Rasm</span>}
                    {q.explanation && <span className="badge badge-gray"><Icon name="comment" size={11} /> Izoh</span>}
                  </div>
                </div>
                <div className="te-q-acts">
                  <button className="icon-btn" title="Yuqoriga" disabled={i === 0} onClick={() => move(i, -1)}><Icon name="chevU" size={15} /></button>
                  <button className="icon-btn" title="Pastga" disabled={i === questions.length - 1} onClick={() => move(i, 1)}><Icon name="chevD" size={15} /></button>
                  <button className="icon-btn" title="Nusxalash" onClick={() => duplicate(q)}><Icon name="file" size={15} /></button>
                  <button className="icon-btn" title="Tahrirlash" onClick={() => setEditing(q.id)}><Icon name="edit" size={15} /></button>
                  <button className="icon-btn danger" title="O'chirish" onClick={() => setToDelete(q)}><Icon name="trash" size={15} /></button>
                </div>
              </div>
              {q.image && <div className="te-img"><img src={absUrl(q.image)} alt="" /></div>}
              <div className="te-opts">
                {q.options.map((o, k) => (
                  <div key={o.id} className={`te-opt ${o.is_correct ? 'ok' : ''}`}>
                    <span className="mk">{o.is_correct ? <Icon name="check" size={12} /> : q.question_type === 'text' ? '✎' : String.fromCharCode(65 + k)}</span>
                    <span>{o.text}</span>
                  </div>
                ))}
              </div>
              {q.explanation && <div className="te-expl">{q.explanation}</div>}
            </div>
          ))}

          {editing === 'new' && (
            <QuestionForm key={`new-${questions.length}`} testId={testId} onClose={() => setEditing(null)}
              onSaved={(another) => { setEditing(another ? 'new' : null); refresh() }} />
          )}
          {questions.length > 2 && editing !== 'new' && (
            <button className="btn btn-secondary btn-block" style={{ borderStyle: 'dashed' }} onClick={() => setEditing('new')}>
              <Icon name="plus" size={15} /> Savol qo'shish
            </button>
          )}
        </>
      )}

      {importing && <ImportModal testId={testId} onClose={() => setImporting(false)} onDone={() => { setImporting(false); refresh() }} />}
      {toDelete && (
        <Confirm danger title="Savolni o'chirish" text={`«${toDelete.text.slice(0, 90)}${toDelete.text.length > 90 ? '…' : ''}» savoli o'chiriladi.`}
          confirmLabel="O'chirish" busy={busyDel} onConfirm={remove} onClose={() => setToDelete(null)} />
      )}
    </div>
  )
}
