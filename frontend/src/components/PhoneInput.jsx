import { useState, useEffect, useRef } from 'react'

// Mask: +998 XX XXX XX XX → strips to 9 digits after +998
function formatPhone(digits) {
  const d = digits.replace(/\D/g, '').replace(/^998/, '').slice(0, 9)
  let out = '+998'
  if (d.length > 0) out += ' ' + d.slice(0, 2)
  if (d.length > 2) out += ' ' + d.slice(2, 5)
  if (d.length > 5) out += ' ' + d.slice(5, 7)
  if (d.length > 7) out += ' ' + d.slice(7, 9)
  return out
}

function stripPhone(formatted) {
  const d = formatted.replace(/\D/g, '').replace(/^998/, '')
  return d ? '+998' + d : ''
}

export default function PhoneInput({ value, onChange, autoFocus, required, placeholder = '+998 90 123 45 67', ...rest }) {
  const [display, setDisplay] = useState(() => value ? formatPhone(value) : '')
  const ref = useRef(null)

  useEffect(() => {
    if (value !== undefined && value !== null) {
      const next = value ? formatPhone(value) : ''
      if (next !== display) setDisplay(next)
    }
    // eslint-disable-next-line
  }, [value])

  function handle(e) {
    const f = formatPhone(e.target.value)
    setDisplay(f)
    onChange?.(stripPhone(f))
  }

  return (
    <input
      ref={ref}
      type="tel"
      inputMode="tel"
      autoComplete="tel"
      autoFocus={autoFocus}
      required={required}
      className="input"
      placeholder={placeholder}
      value={display}
      onChange={handle}
      onFocus={() => { if (!display) setDisplay('+998 ') }}
      {...rest}
    />
  )
}
