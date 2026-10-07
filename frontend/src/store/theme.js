import { create } from 'zustand'

const KEY = 'theme'

function readInitial() {
  const saved = localStorage.getItem(KEY)
  if (saved === 'dark' || saved === 'light') return saved
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function apply(theme) {
  document.documentElement.setAttribute('data-theme', theme)
  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) meta.setAttribute('content', theme === 'dark' ? '#0F1311' : '#0E8345')
}

export const useTheme = create((set, get) => ({
  theme: readInitial(),

  toggle() {
    const next = get().theme === 'dark' ? 'light' : 'dark'
    localStorage.setItem(KEY, next)
    apply(next)
    set({ theme: next })
  },

  setTheme(theme) {
    localStorage.setItem(KEY, theme)
    apply(theme)
    set({ theme })
  },
}))

// Keep the DOM attribute in sync on first import (the inline script in
// index.html already set it, this just guarantees consistency in dev/HMR).
apply(readInitial())
