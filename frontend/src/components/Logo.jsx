/** Ionedu brand mark — a compass on a sun-yellow sticker. */
export function LogoMark({ size = 34 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true" style={{ flexShrink: 0 }}>
      <rect x="2" y="2" width="44" height="44" rx="14" fill="#FFC83D" stroke="#14213D" strokeWidth="3" />
      <circle cx="24" cy="24" r="12" fill="#fff" stroke="#14213D" strokeWidth="2.6" />
      <path d="M29.5 18.5 26 26l-7.5 3.5L22 22z" fill="#FF6A4D" stroke="#14213D" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  )
}

export default function Logo({ size = 34, name = 'Ionedu', light = false }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 10,
      fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: size * 0.65,
      letterSpacing: '-0.045em', color: light ? '#fff' : 'var(--text)', lineHeight: 1,
    }}>
      <LogoMark size={size} />
      {name.toLowerCase()}
    </span>
  )
}
