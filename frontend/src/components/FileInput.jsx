import { useRef, useState } from 'react'
import Icon from './Icon'

const css = `
  .fi-compact { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }
  .fi-name { font-size: 13px; font-weight: 600; color: var(--text-3); word-break: break-all; }
  .fi-drop {
    display: flex; flex-direction: column; align-items: center; gap: 6px; text-align: center;
    padding: 22px 18px; cursor: pointer;
    background: var(--white); border: 1.5px dashed var(--border); border-radius: 16px;
    transition: border-color .15s ease, background .15s ease, box-shadow .15s ease, transform .15s ease;
  }
  .fi-drop:hover { border-color: var(--line); }
  .fi-drop.drag { border-color: var(--line); border-style: solid; background: var(--sun-soft); box-shadow: var(--hard-sm); transform: translate(-1px, -1px); }
  .fi-ico {
    width: 44px; height: 44px; border-radius: 14px; margin-bottom: 4px;
    background: var(--sun); color: #14213D; border: 1.5px solid var(--line); transform: rotate(-5deg);
    display: flex; align-items: center; justify-content: center;
  }
  .fi-title { font-weight: 700; font-size: 14px; color: var(--text); word-break: break-all; }
  .fi-sub { font-size: 12px; color: var(--text-3); }
`

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
      <div className="fi-compact">
        <style>{css}</style>
        <button type="button" onClick={() => ref.current?.click()} className="btn btn-secondary btn-sm">
          <Icon name={icon} size={14} /> Fayl tanlash
        </button>
        {filename && <span className="fi-name">{filename}</span>}
        <input ref={ref} type="file" accept={accept} onChange={onChange} hidden {...rest} />
      </div>
    )
  }

  return (
    <label
      className={`fi-drop${drag ? ' drag' : ''}${filename ? ' has' : ''}`}
      onClick={() => ref.current?.click()}
      onDragOver={e => { e.preventDefault(); setDrag(true) }}
      onDragLeave={() => setDrag(false)}
      onDrop={onDrop}>
      <style>{css}</style>
      <span className="fi-ico"><Icon name={icon} size={20} /></span>
      <span className="fi-title">{filename || 'Fayl yuklash uchun bosing'}</span>
      <span className="fi-sub">{filename ? 'Boshqasini tanlash uchun bosing' : 'yoki shu yerga sudrang'}</span>
      <span className="fi-sub">{hint}</span>
      <input ref={ref} type="file" accept={accept} onChange={onChange} hidden {...rest} />
    </label>
  )
}
