import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import api, { absUrl } from '../api/client'
import Icon from './Icon'
import FileInput from './FileInput'

/**
 * Modal-like inline manager for a lesson's downloadable resources.
 * Used inside CourseBuilder.
 */
export default function LessonMaterialsManager({ lessonId }) {
  const qc = useQueryClient()
  const [title, setTitle] = useState('')
  const [file, setFile] = useState(null)
  const [busy, setBusy] = useState(false)

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
      qc.invalidateQueries(['lesson-materials', lessonId])
      toast.success('Material qo\'shildi')
    } catch { toast.error("Yuklab bo'lmadi") }
    finally { setBusy(false) }
  }

  const del = useMutation({
    mutationFn: (id) => api.delete(`/materials/${id}/`),
    onSuccess: () => qc.invalidateQueries(['lesson-materials', lessonId]),
  })

  return (
    <div>
      <div className="text-sm text-muted mb-3">
        Darsga biriktiriladigan fayllar (PDF, slide, vazifa va boshqalar).
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
        {items.length === 0 && (
          <div className="card" style={{ padding: 16, textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>
            Hozircha material yo'q
          </div>
        )}
        {items.map(m => (
          <div key={m.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--green-50)', color: 'var(--green-600)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="fileText" size={16} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{m.title}</div>
              <div className="text-xs text-muted" style={{ wordBreak: 'break-all' }}>{m.file.split('/').pop()}</div>
            </div>
            <a href={absUrl(m.file)} target="_blank" rel="noreferrer" className="icon-btn" title="Yuklab olish">
              <Icon name="download" size={15} />
            </a>
            <button className="icon-btn" title="O'chirish" onClick={() => { if (confirm("O'chirilsinmi?")) del.mutate(m.id) }}>
              <Icon name="trash" size={15} />
            </button>
          </div>
        ))}
      </div>

      <div className="card" style={{ background: 'var(--bg-soft)', padding: 16 }}>
        <div className="field">
          <label className="label">Material nomi</label>
          <input className="input" value={title} onChange={e => setTitle(e.target.value)}
            placeholder="Masalan, Dars konspekti" />
        </div>
        <div className="field">
          <label className="label">Fayl</label>
          <FileInput onPick={setFile} compact hint="PDF, DOCX, ZIP, MP4 — 50MB gacha" />
        </div>
        <button className="btn btn-primary btn-sm" onClick={add} disabled={busy || !title.trim() || !file}>
          <Icon name="plus" size={14} /> {busy ? 'Yuklanmoqda…' : "Material qo'shish"}
        </button>
      </div>
    </div>
  )
}
