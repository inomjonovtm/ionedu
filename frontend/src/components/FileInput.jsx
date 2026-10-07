import { useRef, useState } from 'react'
import Icon from './Icon'

/**
 * Styled file input.
 *
 * Props:
 *   onPick(file)       - called with the selected File
 *   value              - optional current filename or url string (for display)
 *   accept             - mime filter, e.g. "image/*" or ".pdf,.docx"
 *   icon               - lucide icon name (default "upload")
 *   hint               - text below button
 *   compact            - smaller variant
 */
export default function FileInput({
  onPick,
  value,
  accept,
  icon = 'upload',
  hint = 'PDF, PNG, JPG, video — 50 MB gacha',
  compact = false,
  ...rest
}) {
  const ref = useRef(null)
  const [drag, setDrag] = useState(false)
  const [name, setName] = useState('')

  function handle(file) {
    if (!file) return
    setName(file.name)
    onPick?.(file)
  }

  function onChange(e) {
    handle(e.target.files?.[0])
  }

  function onDrop(e) {
    e.preventDefault(); setDrag(false)
    handle(e.dataTransfer.files?.[0])
  }

  const filename = name || (value ? value.split('/').pop() : '')

  if (compact) {
    return (
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <button type="button" onClick={() => ref.current?.click()}
          className="btn btn-secondary btn-sm" style={{ height: 36 }}>
          <Icon name={icon} size={14} /> Fayl tanlash
        </button>
        {filename && <span className="text-sm text-muted" style={{ wordBreak: 'break-all' }}>{filename}</span>}
        <input ref={ref} type="file" accept={accept} onChange={onChange} hidden {...rest} />
      </div>
    )
  }

  return (
    <label
      onClick={() => ref.current?.click()}
      onDragOver={e => { e.preventDefault(); setDrag(true) }}
      onDragLeave={() => setDrag(false)}
      onDrop={onDrop}
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        gap: 8, padding: '22px 18px',
        border: `1.5px dashed ${drag ? 'var(--green-600)' : 'var(--border)'}`,
        background: drag ? 'var(--green-50)' : 'white',
        borderRadius: 12, cursor: 'pointer', transition: 'all .15s',
      }}>
      <div style={{
        width: 44, height: 44, borderRadius: 10,
        background: 'var(--green-50)', color: 'var(--green-600)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon name={icon} size={20} />
      </div>
      <div style={{ fontWeight: 600, fontSize: 14 }}>
        {filename || 'Fayl yuklash uchun bosing'}
      </div>
      <div className="text-xs text-muted">{filename ? "Boshqasini tanlash uchun bosing" : "yoki shu yerga sudrang"}</div>
      <div className="text-xs text-muted">{hint}</div>
      <input ref={ref} type="file" accept={accept} onChange={onChange} hidden {...rest} />
    </label>
  )
}
