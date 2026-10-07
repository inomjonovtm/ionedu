// Helpers for descriptions written with the RichTextEditor component.

// Renders teacher-authored HTML safely: keeps formatting tags, drops
// scripts, event handlers and javascript: URLs.
export function sanitizeHtml(html) {
  const doc = new DOMParser().parseFromString(html, 'text/html')
  doc.querySelectorAll('script, style, iframe, object, embed, form').forEach(n => n.remove())
  doc.body.querySelectorAll('*').forEach(el => {
    for (const attr of [...el.attributes]) {
      const name = attr.name.toLowerCase()
      const value = attr.value.trim().toLowerCase()
      if (name.startsWith('on')) el.removeAttribute(attr.name)
      else if ((name === 'href' || name === 'src') && value.startsWith('javascript:')) el.removeAttribute(attr.name)
    }
    if (el.tagName === 'A') { el.setAttribute('target', '_blank'); el.setAttribute('rel', 'noopener noreferrer') }
  })
  return doc.body.innerHTML
}

// True when the saved description was written with the editor (HTML),
// false for old plain-text descriptions.
export function isHtmlContent(text) {
  return /<\/?[a-z][\s\S]*>/i.test(text || '')
}
