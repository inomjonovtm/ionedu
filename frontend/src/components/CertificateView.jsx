/* ─────────────────────────────────────────────────────────────
   CertificateView — saytdagi sertifikat ko'rinishi ("Atlas" uslubi).

   Maqsad: backend yaratadigan PDF (apps/certificates/utils.py) bilan
   bir xil ko'rinsin — bir xil tartib, ranglar, muhr, imzolar, QR kod
   va kontur chiziqlar. Shunda foydalanuvchi yuklab olganda "boshqa"
   narsa chiqmaydi.

   Sertifikat — qat'iy rangli hujjat: ranglar ataylab hex bilan
   berilgan, yorug' va qorong'i rejimda bir xil ko'rinadi.

   O'lchamlar konteyner eniga nisbatan (cqw) berilgan — sertifikat
   har qanday ekran kengligida bir xil nisbatda ko'rinadi
   (1cqw ≈ A4 landscape'da 2.97mm).
   ───────────────────────────────────────────────────────────── */

// PDF bilan bir xil Atlas palitrasi
const C = {
  paper: '#FBF6EA', card: '#FFFDF8',
  ink: '#14213D', muted: '#5B6478', light: '#8A91A3',
  sun: '#FFC83D', coral: '#FF6A4D', fold: '#D9CFB8',
}

const DISPLAY = `'Bricolage Grotesque', var(--font-display), 'Helvetica Neue', Arial, sans-serif`
const MONO = `var(--font-mono), ui-monospace, 'SF Mono', Menlo, Consolas, monospace`

const css = `
  .cv-frame {
    container-type: inline-size;
    width: 100%; aspect-ratio: 1.414 / 1; position: relative;
    background: ${C.paper};
    border: 1.5px solid ${C.ink};
    border-radius: 12px; overflow: hidden;
    font-family: var(--font-body), 'Helvetica Neue', Arial, sans-serif;
    color: ${C.ink}; color-scheme: light;
  }
  /* "stiker" karta: to'q ko'k ramka + qattiq siljigan soya */
  .cv-card {
    position: absolute; inset: 4cqw;
    background: ${C.card};
    border: 0.3cqw solid ${C.ink}; border-radius: 2cqw;
    box-shadow: 0.75cqw 0.75cqw 0 ${C.ink};
    overflow: hidden;
  }
  .cv-topo { position: absolute; inset: 0; width: 100%; height: 100%; }

  .cv-inner {
    position: absolute; inset: 0; z-index: 2;
    display: flex; flex-direction: column;
    padding: 2.6cqw 3.6cqw 1.8cqw;
  }

  /* yuqori qator: logo — koordinata */
  .cv-head { display: flex; align-items: center; justify-content: space-between; gap: 2cqw; }
  .cv-logo { display: flex; align-items: center; gap: 1cqw; }
  .cv-logo svg { width: 3.8cqw; height: 3.8cqw; display: block; flex-shrink: 0; }
  .cv-brand { font-family: ${DISPLAY}; font-weight: 800; font-size: 2.3cqw; line-height: 1;
    letter-spacing: -.045em; color: ${C.ink}; }
  .cv-sub { font-family: ${MONO}; font-size: .72cqw; font-weight: 600; letter-spacing: .14em;
    color: ${C.muted}; margin-top: .45cqw; }
  .cv-coord { font-family: ${MONO}; font-size: 1cqw; font-weight: 700; letter-spacing: .06em;
    color: ${C.ink}; display: flex; align-items: center; gap: .7cqw; white-space: nowrap; }
  .cv-coord::before { content: ''; width: .9cqw; height: .9cqw; border-radius: 50%;
    background: ${C.coral}; border: 0.16cqw solid ${C.ink}; }

  /* markaziy blok */
  .cv-top {
    flex: 1; min-height: 0; overflow: hidden;
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    text-align: center;
  }
  .cv-eyebrow { font-family: ${MONO}; font-size: 1.05cqw; font-weight: 700; letter-spacing: .16em;
    color: ${C.ink}; background: ${C.sun}; border: 0.18cqw solid ${C.ink}; border-radius: 99cqw;
    padding: .6cqw 1.8cqw; line-height: 1; }
  .cv-title { font-family: ${DISPLAY}; font-weight: 800; font-size: 6cqw; line-height: 1;
    letter-spacing: -.045em; margin-top: 1.5cqw; color: ${C.ink}; }

  .cv-given { font-size: 1.3cqw; font-weight: 500; color: ${C.muted}; margin-top: 1.6cqw; }
  .cv-name {
    font-family: 'Cormorant Garamond', Georgia, 'Times New Roman', serif;
    font-style: italic; font-weight: 700;
    font-size: 4.9cqw; line-height: 1.15; margin-top: .7cqw; color: ${C.ink};
    padding: 0 1.4cqw; box-shadow: inset 0 -1.5cqw 0 ${C.sun};
    max-width: 92%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  }
  .cv-course { font-size: 1.5cqw; font-weight: 500; margin-top: 1.6cqw; color: ${C.ink};
    max-width: 80%; line-height: 1.4; }
  .cv-course b { font-weight: 800; }
  .cv-score { font-size: 1.25cqw; font-weight: 500; margin-top: .6cqw; color: ${C.muted}; }

  /* footer: imzo — muhr — sana */
  .cv-footer { display: flex; align-items: flex-end; justify-content: space-between; padding: 0 5%; }
  .cv-sig { width: 25%; text-align: center; padding-bottom: 1.6cqw; }
  .cv-sig .line { height: 0.18cqw; background: ${C.ink}; margin-bottom: .9cqw; }
  .cv-sig .nm { font-family: ${DISPLAY}; font-size: 1.4cqw; font-weight: 700; color: ${C.ink};
    letter-spacing: -.01em; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .cv-sig .rl { font-family: ${MONO}; font-size: .82cqw; font-weight: 600; letter-spacing: .12em;
    text-transform: uppercase; color: ${C.muted}; margin-top: .45cqw; }

  /* kompas-muhr */
  .cv-seal { width: 11cqw; height: 11cqw; border-radius: 50%; position: relative; flex-shrink: 0;
    background: ${C.sun}; border: 0.3cqw solid ${C.ink};
    box-shadow: 0.45cqw 0.45cqw 0 ${C.ink};
    transform: rotate(-8deg);
    display: flex; flex-direction: column; align-items: center; justify-content: center; }
  .cv-seal::before { content: ''; position: absolute; inset: 0.6cqw;
    border: 0.14cqw dashed ${C.ink}; border-radius: 50%; }
  .cv-seal svg { width: 1.9cqw; height: 1.9cqw; display: block; }
  .cv-seal .s1 { font-family: ${DISPLAY}; font-size: 1.75cqw; font-weight: 800; color: ${C.ink};
    letter-spacing: -.045em; line-height: 1; margin-top: .2cqw; }
  .cv-seal .s2 { font-family: ${MONO}; font-size: .7cqw; font-weight: 700; color: ${C.ink};
    letter-spacing: .14em; margin-top: .4cqw; }
  .cv-seal .s3 { font-family: ${MONO}; font-size: 1.05cqw; font-weight: 700; color: ${C.ink};
    margin-top: .25cqw; }

  /* pastki qator: QR — ID (xarita buklama chizig'i bilan ajratilgan) */
  .cv-bottom { display: flex; align-items: center; justify-content: space-between;
    margin-top: 1.1cqw; padding-top: 1.1cqw; gap: 2cqw;
    border-top: 0.16cqw dashed ${C.fold}; }
  .cv-qr { display: flex; align-items: center; gap: 1cqw; }
  .cv-qr img { width: 6.6cqw; height: 6.6cqw; display: block; background: #fff;
    border: 0.18cqw solid ${C.ink}; border-radius: .7cqw; padding: .35cqw; }
  .cv-qr .cap { font-family: ${MONO}; font-size: .78cqw; font-weight: 600; letter-spacing: .08em;
    text-transform: uppercase; color: ${C.muted}; max-width: 9cqw; line-height: 1.35; }
  .cv-id { font-family: ${MONO}; font-size: .86cqw; color: ${C.muted}; text-align: right; line-height: 1.6; }
  .cv-id b { color: ${C.ink}; font-weight: 700; }
`

/* Kontur (topografik) chiziqlar — PDF'dagi _blob_points() bilan bir xil formula.
   Koordinatalar karta o'lchamida (273 × 186 mm), y pastga qarab. */
const TOPO_W = 273
const TOPO_H = 186
const TOPO_GROUPS = [
  { cx: 252, cy: 8, rings: 8 },   // yuqori-o'ng burchak
  { cx: 18, cy: 180, rings: 7 },  // pastki-chap burchak
]

function blobPath(cx, cy, r, phase) {
  const n = 12
  const pts = []
  for (let i = 0; i < n; i++) {
    const t = (2 * Math.PI * i) / n
    const rad = r * (1 + 0.09 * Math.sin(3 * t + phase) + 0.05 * Math.cos(2 * t - phase))
    pts.push([cx + rad * Math.cos(t), cy + rad * Math.sin(t)])
  }
  const f = v => v.toFixed(2)
  let d = `M${f(pts[0][0])} ${f(pts[0][1])}`
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n]
    d += ` C${f(p1[0] + (p2[0] - p0[0]) / 6)} ${f(p1[1] + (p2[1] - p0[1]) / 6)}`
      + ` ${f(p2[0] - (p3[0] - p1[0]) / 6)} ${f(p2[1] - (p3[1] - p1[1]) / 6)}`
      + ` ${f(p2[0])} ${f(p2[1])}`
  }
  return `${d}Z`
}

const TOPO_PATHS = TOPO_GROUPS.flatMap(g =>
  Array.from({ length: g.rings }, (_, k) => blobPath(g.cx, g.cy, 14 + 11 * k, k * 0.35)))

function Topo() {
  return (
    <svg className="cv-topo" viewBox={`0 0 ${TOPO_W} ${TOPO_H}`} preserveAspectRatio="none" fill="none" aria-hidden="true">
      {TOPO_PATHS.map((d, i) => (
        <path key={i} d={d} stroke={C.ink} strokeOpacity=".1" strokeWidth=".35" />
      ))}
    </svg>
  )
}

/* Brend belgisi (components/Logo.jsx dagi LogoMark bilan bir xil, cqw o'lchamda) */
function Mark() {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true">
      <rect x="2" y="2" width="44" height="44" rx="14" fill={C.sun} stroke={C.ink} strokeWidth="3" />
      <circle cx="24" cy="24" r="12" fill="#fff" stroke={C.ink} strokeWidth="2.6" />
      <path d="M29.5 18.5 26 26l-7.5 3.5L22 22z" fill={C.coral} stroke={C.ink} strokeWidth="2" strokeLinejoin="round" />
    </svg>
  )
}

export default function CertificateView({ cert }) {
  if (!cert) return null

  const name = cert.student?.display_name || cert.student?.email || 'Anonim'
  const teacher = cert.teacher_name || 'Ionedu'
  const course = cert.course_title || ''
  const score = Math.round(cert.score_percent || 0)
  const issued = cert.issued_at ? new Date(cert.issued_at) : new Date()
  const year = issued.getFullYear()
  const dateStr = issued.toLocaleDateString('en-GB').replace(/\//g, '-') // dd-mm-yyyy

  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://ioneda.uz'
  const verifyUrl = `${origin}/verify/${cert.unique_id}`
  const host = origin.replace(/^https?:\/\//, '')
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&margin=0&qzone=1&data=${encodeURIComponent(verifyUrl)}`

  return (
    <div className="cv-frame">
      <style>{css}</style>
      <div className="cv-card">
        <Topo />

        <div className="cv-inner">
          <div className="cv-head">
            <div className="cv-logo">
              <Mark />
              <div>
                <div className="cv-brand">ionedu</div>
                <div className="cv-sub">GEOGRAFIYA O'RGANISH PLATFORMASI</div>
              </div>
            </div>
            <div className="cv-coord">41.31°N · 69.24°E</div>
          </div>

          <div className="cv-top">
            <div className="cv-eyebrow">TUGATISH SERTIFIKATI</div>
            <div className="cv-title">Sertifikat</div>

            <div className="cv-given">Mazkur sertifikat quyidagi shaxsga taqdim etiladi</div>
            <div className="cv-name">{name}</div>

            <div className="cv-course"><b>“{course}”</b> kursini muvaffaqiyatli yakunlaganligi uchun.</div>
            <div className="cv-score">Yakuniy natija: {score}% va undan yuqori ko'rsatkich.</div>
          </div>

          <div className="cv-footer">
            <div className="cv-sig">
              <div className="line" />
              <div className="nm">{teacher}</div>
              <div className="rl">Kurs muallifi</div>
            </div>

            <div className="cv-seal">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 1.5 14.6 9.4 22.5 12 14.6 14.6 12 22.5 9.4 14.6 1.5 12 9.4 9.4z"
                  fill={C.coral} stroke={C.ink} strokeWidth="1.8" strokeLinejoin="round" />
              </svg>
              <div className="s1">ionedu</div>
              <div className="s2">TASDIQLANDI</div>
              <div className="s3">{year}</div>
            </div>

            <div className="cv-sig">
              <div className="line" />
              <div className="nm">{dateStr}</div>
              <div className="rl">Berilgan sana</div>
            </div>
          </div>

          <div className="cv-bottom">
            <div className="cv-qr">
              <img src={qrSrc} alt="QR" loading="lazy" onError={e => { e.currentTarget.parentElement.style.display = 'none' }} />
              <span className="cap">Skanerlab tekshiring</span>
            </div>
            <div className="cv-id">
              <b>ID:</b> {cert.short_id}<br />
              Tekshirish: {host}/verify/{cert.unique_id}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
