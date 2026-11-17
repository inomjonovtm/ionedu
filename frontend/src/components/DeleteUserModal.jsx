import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import api from '../api/client'
import Icon from './Icon'

const WORD = "O'CHIRISH"

/**
 * Permanent user deletion with an explicit typed confirmation.
 * `users` — one or many user objects ({ id, display_name, email, role }).
 */
export default function DeleteUserModal({ users, onClose, onDeleted }) {
  const [typed, setTyped] = useState('')
  const many = users.length > 1
  const hasTeacher = users.some(u => u.role === 'teacher' || u.role === 'admin')

  const del = useMutation({
    mutationFn: () => many
      ? api.post('/admin/users/bulk-delete/', { ids: users.map(u => u.id) }).then(r => r.data)
      : api.delete(`/admin/users/${users[0].id}/`).then(() => ({ deleted: [users[0].id], skipped: [] })),
    onSuccess: (res) => {
      if (res.deleted.length) toast.success(many ? `${res.deleted.length} ta foydalanuvchi o'chirildi` : "Foydalanuvchi butunlay o'chirildi")
      res.skipped?.forEach(s => toast.error(`${s.name}: ${s.reason}`, { duration: 6000 }))
      onDeleted?.(res)
      onClose()
    },
    onError: (e) => toast.error(e.response?.data?.detail || "O'chirib bo'lmadi"),
  })

  const ok = typed.trim().toUpperCase().replace(/[ʻʼ’‘`]/g, "'") === WORD

  return (
    <div className="modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget && !del.isPending) onClose() }}>
      <form className="modal" style={{ maxWidth: 500 }} onSubmit={e => { e.preventDefault(); if (ok) del.mutate() }}>
        <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', marginBottom: 16 }}>
          <span style={{
            width: 48, height: 48, borderRadius: 15, flexShrink: 0, background: 'var(--coral)', color: '#fff',
            border: '2px solid var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'center', transform: 'rotate(-5deg)',
          }}><Icon name="trash" size={21} /></span>
          <div>
            <h3 style={{ fontSize: 21 }}>{many ? `${users.length} ta foydalanuvchini o'chirish` : "Foydalanuvchini butunlay o'chirish"}</h3>
            <p className="text-sm text-muted" style={{ marginTop: 4 }}>Bu amalni ortga qaytarib bo'lmaydi.</p>
          </div>
        </div>

        <div style={{ border: '1.5px solid var(--border)', borderRadius: 16, maxHeight: 150, overflowY: 'auto', marginBottom: 14 }}>
          {users.map(u => (
            <div key={u.id} className="row-line" style={{ padding: '10px 14px' }}>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{u.display_name}</div>
                <div className="text-xs text-muted" style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{u.email || u.phone}</div>
              </div>
              <span className="badge badge-gray">{u.role === 'teacher' ? "O'qituvchi" : u.role === 'admin' ? 'Admin' : "O'quvchi"}</span>
            </div>
          ))}
        </div>

        <div style={{ background: 'var(--red-50)', borderRadius: 14, padding: '12px 14px', fontSize: 13, lineHeight: 1.6, color: 'var(--text-2)', marginBottom: 16 }}>
          <strong style={{ color: 'var(--red-600)' }}>Quyidagilar ham o'chadi:</strong> profil va avatar, kurslarga yozilishlar va
          progress, test natijalari, sertifikatlar, sharh va izohlar, bildirishnomalar
          {hasTeacher && <>, shuningdek <strong>o'qituvchining barcha kurslari, darslari, videolari va testlari</strong></>}.
        </div>

        <div className="field">
          <label className="label">Tasdiqlash uchun <span className="font-mono" style={{ color: 'var(--red-600)' }}>{WORD}</span> deb yozing</label>
          <input className="input" value={typed} onChange={e => setTyped(e.target.value)} autoFocus autoComplete="off" spellCheck={false} />
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={del.isPending}>Bekor qilish</button>
          <button type="submit" className="btn btn-danger" disabled={!ok || del.isPending}>
            <Icon name="trash" size={15} /> {del.isPending ? "O'chirilmoqda…" : "Butunlay o'chirish"}
          </button>
        </div>
      </form>
    </div>
  )
}
