/* ─────────────────────────────────────────────────────────────
   CertificateView — saytdagi sertifikat ko'rinishi.

   Maqsad: backend yaratadigan PDF (apps/certificates/utils.py) bilan
   AYNAN bir xil ko'rinsin — bir xil tartib, ranglar, muhr, imzolar,
   QR kod va naqshlar. Shunda foydalanuvchi yuklab olganda "boshqa"
   narsa chiqmaydi.

   O'lchamlar konteyner eniga nisbatan (cqw) berilgan — sertifikat
   har qanday ekran kengligida bir xil nisbatda ko'rinadi. Tartib
   flexbox asosida — matn va imzo/muhr hech qachon ustma-ust tushmaydi.
   ───────────────────────────────────────────────────────────── */

// PDF bilan bir xil ranglar palitrasi
const C = {
  green: '#16A34A', greenDark: '#15803D', greenMid: '#86EFAC',
  greenSoft: '#DCFCE7', greenPale: '#F0FDF4',
  textDark: '#111827', textMuted: '#6B7280', textLight: '#9CA3AF',
  gold: '#D97706',
}

const css = `
  .cv-frame {
    container-type: inline-size;
    width: 100%; aspect-ratio: 1.414 / 1; position: relative;
    background: ${C.greenPale};
    border-radius: 12px; overflow: hidden;
    box-shadow: 0 24px 70px -24px rgba(12,17,14,.28), 0 0 0 1px rgba(12,17,14,.05);
    font-family: 'Helvetica Neue', Arial, var(--font-body), sans-serif;
    color: ${C.textDark};
  }
  .cv-paper { position: absolute; inset: 3.4%; background: #fff; }
  .cv-border-1 { position: absolute; inset: 4.7%; border: 0.22cqw solid ${C.green}; }
  .cv-border-2 { position: absolute; inset: 6%; border: 0.08cqw solid ${C.greenMid}; }

  .cv-corner { position: absolute; width: 6.5cqw; height: 6.5cqw; z-index: 2; }
  .cv-corner.tl { top: 6.3%; left: 6.3%; }
  .cv-corner.tr { top: 6.3%; right: 6.3%; transform: scaleX(-1); }
  .cv-corner.bl { bottom: 6.3%; left: 6.3%; transform: scaleY(-1); }
  .cv-corner.br { bottom: 6.3%; right: 6.3%; transform: scale(-1,-1); }

  /* flex-ustun: yuqori blok markazda, footer pastda */
  .cv-inner {
    position: absolute; inset: 0; z-index: 3;
    display: flex; flex-direction: column;
    padding: 7.5% 9.5% 4.5%;
  }
  .cv-top {
    flex: 1; min-height: 0; overflow: hidden;
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    text-align: center;
  }
  .cv-brand { font-weight: 800; font-size: 2.4cqw; letter-spacing: .12em; color: ${C.green}; }
  .cv-sub { font-size: 1.02cqw; letter-spacing: .2em; color: ${C.textLight}; margin-top: .8cqw; }

  .cv-eyebrow { display: flex; align-items: center; gap: 1.5cqw; margin-top: 2.2cqw; }
  .cv-eyebrow .ln { width: 7cqw; height: 0.07cqw; background: ${C.greenMid}; }
  .cv-eyebrow .tx { font-size: 1.22cqw; font-weight: 700; letter-spacing: .14em; color: ${C.green}; }

  .cv-title { font-family: Georgia, 'Times New Roman', serif; font-style: italic; font-weight: 600;
    font-size: 5.6cqw; line-height: 1; margin-top: 1.6cqw; color: ${C.textDark}; }

  .cv-div { display: flex; align-items: center; gap: 1.4cqw; margin-top: 1.6cqw; }
  .cv-div .ln { width: 6cqw; height: 0.16cqw; background: ${C.green}; }
  .cv-div .dm { width: 1cqw; height: 1cqw; background: ${C.green}; transform: rotate(45deg); }

  .cv-given { font-size: 1.26cqw; color: ${C.textMuted}; margin-top: 1.9cqw; }
  .cv-name {
    font-family: Georgia, 'Times New Roman', serif; font-style: italic; font-weight: 700;
    font-size: 3.9cqw; line-height: 1.45; margin-top: 1cqw; color: ${C.textDark};
    padding-bottom: .9cqw; border-bottom: 0.07cqw solid ${C.greenMid};
    max-width: 92%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  }
  .cv-course { font-size: 1.5cqw; margin-top: 1.7cqw; color: ${C.textDark}; max-width: 78%; line-height: 1.4; }
  .cv-course b { font-weight: 700; }
  .cv-score { font-size: 1.22cqw; margin-top: .7cqw; color: ${C.textMuted}; }

  /* footer: imzo — muhr — sana */
  .cv-footer { display: flex; align-items: flex-end; justify-content: space-between; padding: 0 1.5%; }
  .cv-sig { width: 27%; text-align: center; }
  .cv-sig .line { height: 0.07cqw; background: ${C.textDark}; margin-bottom: .9cqw; }
  .cv-sig .nm { font-size: 1.26cqw; font-weight: 700; color: ${C.textDark};
    overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .cv-sig .rl { font-size: 1cqw; color: ${C.textMuted}; margin-top: .4cqw; }

  .cv-seal { width: 11.5cqw; height: 11.5cqw; border-radius: 50%; position: relative; flex-shrink: 0;
    background: ${C.greenSoft}; border: 0.26cqw solid ${C.green};
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    box-shadow: 0 6px 16px -8px rgba(22,163,74,.5); }
  .cv-seal::before { content: ''; position: absolute; inset: 0.65cqw; border: 0.08cqw solid ${C.green}; border-radius: 50%; }
  .cv-seal .s1 { font-size: 1.4cqw; font-weight: 800; color: ${C.greenDark}; letter-spacing: .04em; }
  .cv-seal .s2 { font-size: .85cqw; color: ${C.greenDark}; letter-spacing: .1em; margin-top: .15cqw; }
  .cv-seal .s3 { font-size: 1.15cqw; font-weight: 800; color: ${C.gold}; margin-top: .25cqw; }

  .cv-wave { width: 100%; height: 2.4cqw; margin-top: 1.4cqw; opacity: .5; }

  .cv-bottom { display: flex; align-items: center; justify-content: space-between; margin-top: .6cqw; gap: 2cqw; }
  .cv-qr { display: flex; align-items: center; gap: .9cqw; }
  .cv-qr img { width: 7cqw; height: 7cqw; display: block; }
  .cv-qr .cap { font-size: .82cqw; color: ${C.textLight}; max-width: 9cqw; line-height: 1.25; }
  .cv-id { font-size: 1cqw; color: ${C.textLight}; text-align: right; }
  .cv-id b { color: ${C.textMuted}; font-weight: 700; }
`

function Corner({ pos }) {
  return (
    <svg className={`cv-corner ${pos}`} viewBox="0 0 100 100" fill="none">
      <path d="M0 64 A64 64 0 0 1 64 0" stroke={C.green} strokeWidth="2" />
      <path d="M0 44 A44 44 0 0 1 44 0" stroke={C.green} strokeWidth="1" />
      <circle cx="24" cy="24" r="2.6" fill={C.green} />
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
      <div className="cv-paper" />
      <div className="cv-border-1" />
      <div className="cv-border-2" />
      <Corner pos="tl" /><Corner pos="tr" /><Corner pos="bl" /><Corner pos="br" />

      <div className="cv-inner">
        <div className="cv-top">
          <div className="cv-brand">IONEDU</div>
          <div className="cv-sub">GEOGRAFIYA O'RGANISH PLATFORMASI</div>

          <div className="cv-eyebrow">
            <span className="ln" /><span className="tx">TUGATISH SERTIFIKATI</span><span className="ln" />
          </div>

          <div className="cv-title">Sertifikat</div>

          <div className="cv-div"><span className="ln" /><span className="dm" /><span className="ln" /></div>

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
            <div className="s1">IONEDU</div>
            <div className="s2">TASDIQLANDI</div>
            <div className="s3">{year}</div>
          </div>

          <div className="cv-sig">
            <div className="line" />
            <div className="nm">{dateStr}</div>
            <div className="rl">Berilgan sana</div>
          </div>
        </div>

        <svg className="cv-wave" viewBox="0 0 1200 24" preserveAspectRatio="none" fill="none">
          <path d="M0 12 C100 2 200 22 300 12 S500 2 600 12 700 22 800 12 1000 2 1100 12 1200 12"
            stroke={C.greenMid} strokeWidth="1.4" />
        </svg>

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
  )
}
