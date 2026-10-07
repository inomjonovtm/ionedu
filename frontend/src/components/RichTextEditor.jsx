import { useEffect, useRef, useState } from 'react'
import {
  Bold, Italic, Underline, Link as LinkIcon, Quote, Code, Image as ImageIcon,
  List, ListOrdered, Heading2, Heading3, Eraser, Undo2, Redo2,
} from 'lucide-react'

const TOOLS = [
  { cmd: 'h2', icon: Heading2, title: 'Sarlavha (katta)' },
  { cmd: 'h3', icon: Heading3, title: 'Sarlavha (kichik)' },
  'sep',
  { cmd: 'bold', icon: Bold, title: 'Qalin (Ctrl+B)' },
  { cmd: 'italic', icon: Italic, title: 'Yotiq (Ctrl+I)' },
  { cmd: 'underline', icon: Underline, title: 'Tagiga chizish (Ctrl+U)' },
  'sep',
  { cmd: 'link', icon: LinkIcon, title: 'Havola' },
  { cmd: 'quote', icon: Quote, title: 'Iqtibos' },
  { cmd: 'code', icon: Code, title: 'Kod' },
  { cmd: 'image', icon: ImageIcon, title: 'Rasm qo‘shish' },
  'sep',
  { cmd: 'insertUnorderedList', icon: List, title: "Belgili ro'yxat" },
  { cmd: 'insertOrderedList', icon: ListOrdered, title: "Raqamli ro'yxat" },
  { cmd: 'removeFormat', icon: Eraser, title: 'Formatni tozalash' },
  'sep',
  { cmd: 'undo', icon: Undo2, title: 'Ortga (Ctrl+Z)' },
  { cmd: 'redo', icon: Redo2, title: 'Oldinga (Ctrl+Y)' },
]

export default function RichTextEditor({ value, onChange, placeholder = '', minHeight = 110, onImageUpload }) {
  const ref = useRef(null)
  const fileRef = useRef(null)
  const savedRange = useRef(null)
  const [focused, setFocused] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [busy, setBusy] = useState(false)

  // Sync external value into the editor only when it differs, so the caret
  // never jumps while typing.
  useEffect(() => {
    const el = ref.current
    if (el && (value || '') !== el.innerHTML) el.innerHTML = value || ''
  }, [value])

  function emit() {
    const el = ref.current
    if (!el) return
    const html = el.innerHTML
    onChange(html === '<br>' || html === '<div><br></div>' || html === '<p><br></p>' ? '' : html)
  }

  function saveSelection() {
    const sel = window.getSelection()
    if (sel && sel.rangeCount && ref.current?.contains(sel.anchorNode)) {
      savedRange.current = sel.getRangeAt(0).cloneRange()
    }
  }

  function insertNodeAtCaret(node) {
    const el = ref.current
    el.focus()
    const sel = window.getSelection()
    if (savedRange.current) { sel.removeAllRanges(); sel.addRange(savedRange.current) }
    const range = sel.rangeCount ? sel.getRangeAt(0) : null
    if (range && el.contains(range.commonAncestorContainer)) {
      range.collapse(false)
      range.insertNode(node)
      range.setStartAfter(node)
      range.collapse(true)
      sel.removeAllRanges()
      sel.addRange(range)
    } else {
      el.appendChild(node)
    }
    savedRange.current = sel.rangeCount ? sel.getRangeAt(0).cloneRange() : null
  }

  function insertImageUrl(url) {
    const img = document.createElement('img')
    img.src = url
    insertNodeAtCaret(img)
    insertNodeAtCaret(document.createElement('br'))
    emit()
  }

  async function uploadFiles(files) {
    const imgs = [...files].filter(f => f.type.startsWith('image/'))
    if (!imgs.length || !onImageUpload) return
    setBusy(true)
    for (const f of imgs) {
      try {
        const url = await onImageUpload(f)
        if (url) insertImageUrl(url)
      } catch { /* the upload handler surfaces the error */ }
    }
    setBusy(false)
  }

  function exec(cmd) {
    const el = ref.current
    if (!el) return
    el.focus()
    try {
      if (cmd === 'h2' || cmd === 'h3') {
        const tag = cmd === 'h2' ? 'H2' : 'H3'
        const cur = (document.queryCommandValue('formatBlock') || '').toUpperCase()
        document.execCommand('formatBlock', false, cur === tag ? 'P' : tag)
      } else if (cmd === 'link') {
        const url = prompt('Havola manzili (https://...)')
        if (url) document.execCommand('createLink', false, url)
      } else if (cmd === 'image') {
        if (onImageUpload) { saveSelection(); fileRef.current?.click(); return }
        const url = prompt('Rasm manzili (https://...)')
        if (url) document.execCommand('insertImage', false, url)
      } else if (cmd === 'quote') {
        document.execCommand('formatBlock', false, 'BLOCKQUOTE')
      } else if (cmd === 'code') {
        const sel = window.getSelection()
        const text = sel?.toString()
        if (text) {
          const code = document.createElement('code')
          code.textContent = text
          const range = sel.getRangeAt(0)
          range.deleteContents()
          range.insertNode(code)
          sel.collapseToEnd()
        } else {
          document.execCommand('formatBlock', false, 'PRE')
        }
      } else {
        document.execCommand(cmd, false, null)
      }
    } catch { /* execCommand is deprecated but the simplest cross-browser path */ }
    emit()
  }

  function onPaste(e) {
    const files = e.clipboardData?.files
    if (onImageUpload && files && files.length && [...files].some(f => f.type.startsWith('image/'))) {
      e.preventDefault(); saveSelection(); uploadFiles(files); return
    }
    e.preventDefault()
    const text = (e.clipboardData || window.clipboardData).getData('text/plain')
    document.execCommand('insertText', false, text)
    emit()
  }

  function onDrop(e) {
    if (!onImageUpload) return
    const files = e.dataTransfer?.files
    if (files && files.length && [...files].some(f => f.type.startsWith('image/'))) {
      e.preventDefault(); setDragOver(false); saveSelection(); uploadFiles(files)
    }
  }

  // ── Word-like block exit ────────────────────────────────────────────────
  // Inside a heading: Enter starts a fresh normal paragraph (headings don't
  // continue). Inside a quote/code block: a single Enter adds a line, but an
  // Enter on an empty line breaks out into a normal paragraph below.
  function blockAncestor(node) {
    const el = ref.current
    while (node && node !== el) {
      if (node.nodeType === 1 && ['BLOCKQUOTE', 'PRE', 'H2', 'H3'].includes(node.tagName)) return node
      node = node.parentNode
    }
    return null
  }

  function exitBlock(block, removeEmptyTail) {
    const sel = window.getSelection()
    const range = sel.getRangeAt(0)
    // Move everything after the caret (within the block) into a new paragraph.
    const after = document.createRange()
    after.setStart(range.endContainer, range.endOffset)
    after.setEnd(block, block.childNodes.length)
    const frag = after.extractContents()
    const p = document.createElement('p')
    if (!frag.textContent.trim()) p.innerHTML = '<br>'
    else p.appendChild(frag)
    block.after(p)

    if (removeEmptyTail) {
      while (block.lastChild && (
        block.lastChild.nodeName === 'BR' ||
        (block.lastChild.nodeType === 1 && !block.lastChild.textContent.trim()) ||
        (block.lastChild.nodeType === 3 && !block.lastChild.textContent.trim())
      )) block.removeChild(block.lastChild)
    }
    if (!block.textContent.trim() && block.querySelector('img, br') === null) block.remove()

    const r = document.createRange()
    r.setStart(p, 0); r.collapse(true)
    sel.removeAllRanges(); sel.addRange(r)
    emit()
  }

  function onKeyDown(e) {
    if (e.key !== 'Enter' || e.shiftKey || e.isComposing) return
    const sel = window.getSelection()
    if (!sel || !sel.rangeCount) return
    const block = blockAncestor(sel.anchorNode)
    if (!block) return
    const range = sel.getRangeAt(0)

    if (block.tagName === 'H2' || block.tagName === 'H3') {
      e.preventDefault()
      exitBlock(block, false)
      return
    }
    // BLOCKQUOTE / PRE — exit only when the current line is empty.
    const before = (() => { const r = document.createRange(); r.selectNodeContents(block); r.setEnd(range.endContainer, range.endOffset); return r.toString() })()
    const after = (() => { const r = document.createRange(); r.selectNodeContents(block); r.setStart(range.endContainer, range.endOffset); return r.toString() })()
    const curLine = before.split('\n').pop() + after.split('\n')[0]
    if (curLine.trim() === '') {
      e.preventDefault()
      exitBlock(block, true)
    }
  }

  return (
    <div className={`rte ${focused ? 'focused' : ''} ${dragOver ? 'dragover' : ''}`}>
      <div className="rte-toolbar" onMouseDown={e => e.preventDefault()}>
        {TOOLS.map((t, i) => t === 'sep'
          ? <span key={i} className="rte-sep" />
          : (
            <button key={t.cmd} type="button" className="rte-btn" title={t.title} onClick={() => exec(t.cmd)}>
              <t.icon size={15} strokeWidth={2} />
            </button>
          ))}
        {busy && <span className="rte-uploading">Rasm yuklanmoqda…</span>}
      </div>
      {onImageUpload && (
        <input ref={fileRef} type="file" accept="image/*" multiple hidden
          onChange={e => { const fs = [...e.target.files]; e.target.value = ''; uploadFiles(fs) }} />
      )}
      <div
        ref={ref}
        className="rte-area rte-content"
        contentEditable
        suppressContentEditableWarning
        data-placeholder={placeholder}
        style={{ minHeight }}
        onInput={emit}
        onPaste={onPaste}
        onKeyDown={onKeyDown}
        onKeyUp={saveSelection}
        onMouseUp={saveSelection}
        onDragOver={e => { if (onImageUpload) { e.preventDefault(); setDragOver(true) } }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
    </div>
  )
}
