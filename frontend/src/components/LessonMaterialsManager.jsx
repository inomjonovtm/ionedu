import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import api, { absUrl } from '../api/client'
import Icon from './Icon'
import FileInput from './FileInput'
import Confirm from './Confirm'

const css = `
  .lmm-note { font-size: 13px; color: var(--text-3); margin-bottom: 12px; }
  .lmm-list { display: flex; flex-direction: column; margin-bottom: 16px; background: var(--white); border: 1.5px solid var(--border); border-radius: 16px; overflow: hidden; }
  .lmm-empty { padding: 18px 16px; text-align: center; color: var(--text-3); font-size: 13px; font-weight: 500; }
  .lmm-row { display: flex; align-items: center; gap: 12px; padding: 11px 12px; border-bottom: 1.5px dashed var(--border-2); }
  .lmm-row:last-child { border-bottom: none; }
  .lmm-ico {
    width: 36px; height: 36px; border-radius: 11px; flex-shrink: 0;
    background: var(--sea-soft); color: var(--blue-600);
    display: flex; align-items: center; justify-content: center;
  }
  .lmm-main { flex: 1; min-width: 0; }
  .lmm-title { font-weight: 700; font-size: 14px; color: var(--text); }
  .lmm-file { font-family: var(--font-mono); font-size: 11px; color: var(--text-3); word-break: break-all; }
  .lmm-add { background: var(--bg-soft); border: 1.5px dashed var(--border); border-radius: 16px; padding: 16px; }
`

/**
 * Modal-like inline manager for a lesson's downloadable resources.
 * Used inside CourseBuilder.
 */
export default function LessonMaterialsManager({ lessonId }) {
  const qc = useQueryClient()
  const [title, setTitle] = useState('')
  const [file, setFile] = useState(null)
  const [busy, setBusy] = useState(false)
  const [toDelete, setToDelete] = useState(null)

  const { data: items = [] } = useQuery({
    queryKey: ['lesson-materials', lessonId],
    queryFn: () => api.get(`/lessons/${lessonId}/materials/`).then(r => r.data.results || r.data),
    enabled: !!lessonId,
  })

  async function add() {
    if (!file || !title.trim()) return toast.error("Nom va fayl kerak")
    setBusy(true)
    try {
      const fd = new FormData()
      fd.append('title', title.trim())
      fd.append('file', file)
      await api.post(`/lessons/${lessonId}/materials/`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setTitle(''); setFile(null)
      qc.invalidateQueries({ queryKey: ['lesson-materials', lessonId] })
      toast.success('Material qo\'shildi')
    } catch { toast.error("Yuklab bo'lmadi") }
    finally { setBusy(false) }
  }

  const del = useMutation({
    mutationFn: (id) => api.delete(`/materials/${id}/`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['lesson-materials', lessonId] }),
    onSettled: () => setToDelete(null),
  })

  return (
    <div>
      <style>{css}</style>
      <div className="lmm-note">
        Darsga biriktiriladigan fayllar (PDF, slide, vazifa va boshqalar).
      </div>

      <div className="lmm-list">
        {items.length === 0 && <div className="lmm-empty">Hozircha material yo'q</div>}
        {items.map(m => (
          <div key={m.id} className="lmm-row">
            <span className="lmm-ico"><Icon name="fileText" size={16} /></span>
            <div className="lmm-main">
              <div className="lmm-title">{m.title}</div>
              <div className="lmm-file">{m.file.split('/').pop()}</div>
            </div>
            <a href={absUrl(m.file)} target="_blank" rel="noreferrer" className="icon-btn" title="Yuklab olish">
              <Icon name="download" size={15} />
            </a>
            <button type="button" className="icon-btn danger" title="O'chirish" onClick={() => setToDelete(m)}>
              <Icon name="trash" size={15} />
            </button>
          </div>
        ))}
      </div>

      <div className="lmm-add">
        <div className="field">
          <label className="label">Material nomi</label>
          <input className="input" value={title} onChange={e => setTitle(e.target.value)}
            placeholder="Masalan, Dars konspekti" />
        </div>
        <div className="field">
          <label className="label">Fayl</label>
          <FileInput onPick={setFile} compact hint="PDF, DOCX, ZIP, MP4 — 50MB gacha" />
        </div>
        <button type="button" className="btn btn-primary btn-sm" onClick={add} disabled={busy || !title.trim() || !file}>
          <Icon name="plus" size={14} /> {busy ? 'Yuklanmoqda…' : "Material qo'shish"}
        </button>
      </div>

      {toDelete && (
        <Confirm
          danger
          title="Material o'chirilsinmi?"
          text={`"${toDelete.title}" darsdan olib tashlanadi. Bu amalni ortga qaytarib bo'lmaydi.`}
          confirmLabel="O'chirish"
          busy={del.isPending}
          onConfirm={() => del.mutate(toDelete.id)}
          onClose={() => setToDelete(null)}
        />
      )}
    </div>
  )
}
