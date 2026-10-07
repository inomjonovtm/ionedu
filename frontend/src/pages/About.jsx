import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import api, { absUrl } from '../api/client'
import Layout from '../components/Layout'
import Icon from '../components/Icon'

const styles = `
  /* ── Hero ── */
  .ab-hero {
    position: relative; overflow: hidden; text-align: center;
    padding: 96px 24px 110px;
    background:
      radial-gradient(ellipse 60% 80% at 80% 110%, var(--green-100) 0%, transparent 65%),
      radial-gradient(ellipse 50% 70% at 12% -10%, var(--green-50) 0%, transparent 70%),
      linear-gradient(180deg, var(--paper) 0%, var(--green-50) 100%);
    border-bottom: 1px solid var(--green-100);
  }
  .ab-hero h1 {
    font-size: clamp(34px, 5vw, 54px); line-height: 1.08; letter-spacing: -0.03em;
    max-width: 760px; margin: 18px auto 0;
  }
  .ab-hero h1 em { font-style: normal; color: var(--green-600); }
  .ab-hero p { font-size: 17px; color: var(--text-3); max-width: 560px; margin: 18px auto 0; line-height: 1.65; }
  .ab-kicker {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 7px 16px; border-radius: 999px;
    background: var(--white); border: 1px solid var(--green-100);
    color: var(--green-700); font-size: 13px; font-weight: 600;
    box-shadow: var(--shadow-soft);
  }
  .ab-float {
    position: absolute; font-size: 36px; opacity: .85;
    filter: drop-shadow(0 10px 18px rgba(12,17,14,0.12));
    animation: abFloat 7s ease-in-out infinite;
  }
  @keyframes abFloat { 0%, 100% { transform: translateY(0) rotate(-4deg); } 50% { transform: translateY(-14px) rotate(4deg); } }

  /* ── Stats strip ── */
  .ab-stats {
    display: grid; grid-template-columns: repeat(4, 1fr);
    background: var(--white); border: 1px solid var(--border); border-radius: 20px;
    box-shadow: var(--shadow-soft);
    max-width: 920px; margin: -56px auto 0; position: relative; z-index: 2;
    overflow: hidden;
  }
  .ab-stat { padding: 28px 16px; text-align: center; }
  .ab-stat + .ab-stat { border-left: 1px solid var(--border-2); }
  .ab-stat .v { font-family: var(--font-mono); font-size: 32px; font-weight: 560; letter-spacing: -0.04em; line-height: 1; }
  .ab-stat .l { font-size: 13px; color: var(--text-3); margin-top: 8px; }

  /* ── Sections ── */
  .ab-section { padding: 72px 0; }
  .ab-label {
    font-family: var(--font-mono); font-size: 11px; font-weight: 500;
    letter-spacing: 0.14em; text-transform: uppercase; color: var(--green-600);
    display: block; text-align: center; margin-bottom: 10px;
  }
  .ab-h2 { font-size: clamp(26px, 3.2vw, 34px); letter-spacing: -0.025em; text-align: center; margin-bottom: 14px; }
  .ab-sub { color: var(--text-3); text-align: center; max-width: 540px; margin: 0 auto 44px; line-height: 1.65; }

  /* ── Mission ── */
  .ab-mission {
    display: grid; grid-template-columns: 1fr 1fr; gap: 48px; align-items: center;
    max-width: 1040px; margin: 0 auto;
  }
  .ab-mission .txt p { font-size: 16px; color: var(--text-2); line-height: 1.8; margin-bottom: 16px; }
  .ab-mission .pts { display: flex; flex-direction: column; gap: 12px; margin-top: 22px; }
  .ab-mission .pt { display: flex; gap: 12px; align-items: flex-start; font-size: 14.5px; color: var(--text-2); }
  .ab-mission .pt .ic {
    width: 26px; height: 26px; border-radius: 999px; flex-shrink: 0; margin-top: -1px;
    background: var(--green-50); color: var(--green-600);
    display: flex; align-items: center; justify-content: center;
    box-shadow: inset 0 0 0 1px var(--green-100);
  }
  .ab-mosaic { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
  .ab-tile {
    border-radius: 18px; aspect-ratio: 1; display: flex; flex-direction: column;
    align-items: center; justify-content: center; gap: 10px; font-size: 44px;
    border: 1px solid var(--border);
    transition: transform .2s ease, box-shadow .2s ease;
  }
  .ab-tile:hover { transform: translateY(-4px); box-shadow: var(--shadow-hover); }
  .ab-tile .cap { font-size: 12.5px; font-weight: 600; color: var(--text-2); }

  /* ── Values ── */
  .ab-values { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; max-width: 1040px; margin: 0 auto; }
  .ab-value {
    background: var(--white); border: 1px solid var(--border); border-radius: 18px;
    padding: 30px 26px; transition: transform .2s ease, box-shadow .2s ease, border-color .2s ease;
  }
  .ab-value:hover { transform: translateY(-4px); box-shadow: var(--shadow-hover); border-color: var(--green-200); }
  .ab-value .ic {
    width: 50px; height: 50px; border-radius: 14px;
    background: var(--green-50); color: var(--green-600);
    box-shadow: inset 0 0 0 1px var(--green-100);
    display: flex; align-items: center; justify-content: center; margin-bottom: 18px;
  }
  .ab-value h3 { font-size: 17px; margin-bottom: 8px; }
  .ab-value p { font-size: 14px; color: var(--text-3); line-height: 1.65; }

  /* ── Steps ── */
  .ab-steps { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; max-width: 1040px; margin: 0 auto; }
  .ab-step { position: relative; background: var(--white); border: 1px solid var(--border); border-radius: 18px; padding: 30px 26px; }
  .ab-step .n {
    font-family: var(--font-mono); font-size: 13px; font-weight: 560; color: var(--green-700);
    display: inline-flex; align-items: center; justify-content: center;
    width: 40px; height: 40px; border-radius: 12px;
    background: var(--green-50); box-shadow: inset 0 0 0 1px var(--green-100);
    margin-bottom: 16px;
  }
  .ab-step h3 { font-size: 16.5px; margin-bottom: 8px; }
  .ab-step p { font-size: 14px; color: var(--text-3); line-height: 1.65; }

  /* ── Team ── */
  .ab-team { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 24px; max-width: 1080px; margin: 0 auto; }
  @media (max-width: 620px) { .ab-team { grid-template-columns: 1fr; } }
  .ab-member {
    background: var(--white); border: 1px solid var(--border); border-radius: 22px;
    padding: 36px 28px 30px; text-align: center; position: relative; overflow: hidden;
    transition: transform .2s ease, box-shadow .2s ease, border-color .2s ease;
  }
  .ab-member::before {
    content: ''; position: absolute; left: 0; right: 0; top: 0; height: 88px;
    background: linear-gradient(180deg, var(--green-50), transparent);
  }
  .ab-member:hover { transform: translateY(-5px); box-shadow: var(--shadow-hover); border-color: var(--green-200); }
  .ab-member .ph {
    width: 112px; height: 112px; border-radius: 999px; margin: 0 auto 16px;
    overflow: hidden; position: relative;
    background: var(--green-100); color: var(--green-700);
    display: flex; align-items: center; justify-content: center;
    font-size: 34px; font-weight: 700; font-family: var(--font-display);
    box-shadow: 0 0 0 5px var(--white), 0 0 0 6.5px var(--green-200), 0 12px 28px -12px rgba(12,17,14,.3);
  }
  .ab-member .ph img { width: 100%; height: 100%; object-fit: cover; }
  .ab-member h3 { font-size: 18.5px; letter-spacing: -0.02em; }
  .ab-member .pos { color: var(--green-700); font-size: 13.5px; font-weight: 600; margin-top: 5px; }
  .ab-member .bio { color: var(--text-3); font-size: 13.5px; line-height: 1.65; margin-top: 12px; }
  .ab-member .socials { display: flex; justify-content: center; gap: 9px; margin-top: 18px; }
  .ab-member .socials a {
    width: 36px; height: 36px; border-radius: 10px;
    display: flex; align-items: center; justify-content: center;
    background: var(--bg-soft); color: var(--text-3);
    transition: all .15s;
  }
  .ab-member .socials a:hover { background: var(--green-50); color: var(--green-700); }

  /* ── CTA ── */
  .ab-cta {
    position: relative; overflow: hidden; text-align: center;
    border-radius: 28px; padding: 72px 40px;
    background:
      radial-gradient(ellipse 55% 90% at 85% 110%, rgba(135,207,166,0.25), transparent 70%),
      radial-gradient(ellipse 45% 70% at 10% -20%, rgba(14,131,69,0.45), transparent 70%),
      var(--ink);
    max-width: 1040px; margin: 0 auto;
  }
  .ab-cta h2 { color: white; font-size: clamp(26px, 3.4vw, 36px); letter-spacing: -0.025em; margin-bottom: 14px; }
  .ab-cta p { color: rgba(255,255,255,0.72); font-size: 16px; max-width: 460px; margin: 0 auto 30px; line-height: 1.65; }

  @media (max-width: 920px) {
    .ab-stats { grid-template-columns: repeat(2, 1fr); }
    .ab-stat:nth-child(3) { border-left: none; }
    .ab-stat:nth-child(n+3) { border-top: 1px solid var(--border-2); }
    .ab-mission { grid-template-columns: 1fr; gap: 32px; }
    .ab-values, .ab-steps { grid-template-columns: 1fr; }
  }
`

const VALUES = [
  { icon: 'users', t: "O'quvchi birinchi", d: "Har bir qaror o'quvchining qulayligi va manfaati uchun qabul qilinadi. Interfeys sodda, yo'l xaritasi aniq." },
  { icon: 'shield', t: 'Sifat kafolati', d: "Har bir kurs nashrdan oldin moderatsiyadan o'tadi. Faqat tekshirilgan o'qituvchilar va sifatli kontent." },
  { icon: 'globe', t: 'Hammaga ochiq', d: "Bepul kurslar bilan har bir o'quvchi geografiyani o'rganishni boshlay oladi — qayerda yashashidan qat'i nazar." },
]

const STEPS = [
  { t: "Ro'yxatdan o'ting", d: "Email yoki Google akkauntingiz orqali bir necha soniyada bepul akkaunt yarating." },
  { t: 'Kurs tanlang', d: "Mavzu yoki daraja bo'yicha tanlang. Video darslar, testlar va materiallar — hammasi bir joyda." },
  { t: 'Sertifikat oling', d: "Darslar va testlarni tugatsangiz, tekshirish kodiga ega rasmiy sertifikat avtomatik beriladi." },
]

const TILES = [
  ['🌍', 'Interaktiv darslar'],
  ['🧭', 'Aniq yo\'l xaritasi'],
  ['📝', 'Professional testlar'],
  ['🎓', 'Rasmiy sertifikat'],
]

export default function About() {
  const { data: stats = {} } = useQuery({
    queryKey: ['home-stats'],
    queryFn: () => api.get('/stats/').then(r => r.data).catch(() => ({})),
  })
  const { data: team = [] } = useQuery({
    queryKey: ['public-team'],
    queryFn: () => api.get('/team/').then(r => r.data).catch(() => []),
  })

  return (
    <Layout>
      <style>{styles}</style>

      {/* ── Hero ── */}
      <section className="ab-hero">
        <span className="ab-float" style={{ top: '18%', left: '10%', animationDelay: '0s' }}>🌍</span>
        <span className="ab-float" style={{ top: '30%', right: '9%', animationDelay: '1.6s' }}>🗺️</span>
        <span className="ab-float" style={{ bottom: '22%', left: '17%', animationDelay: '3s', fontSize: 28 }}>🏔️</span>
        <span className="ab-float" style={{ bottom: '30%', right: '16%', animationDelay: '4.2s', fontSize: 28 }}>🧭</span>

        <div className="fade-up">
          <span className="ab-kicker"><Icon name="globe" size={14} /> Biz haqimizda</span>
          <h1>Geografiyani <em>sevdiradigan</em> platforma</h1>
          <p>
            Ionedu — O'zbekiston o'quvchilari uchun yaratilgan onlayn ta'lim makoni.
            Eng yaxshi o'qituvchilar, sifatli video darslar va interaktiv testlar — hammasi bir joyda, hammaga ochiq.
          </p>
        </div>
      </section>

      {/* ── Live stats ── */}
      <div className="container">
        <div className="ab-stats fade-up">
          {[
            [stats.students ?? 0, "O'quvchilar"],
            [stats.courses ?? 0, 'Kurslar'],
            [stats.teachers ?? 0, "O'qituvchilar"],
            [stats.certificates ?? 0, 'Sertifikatlar'],
          ].map(([v, l]) => (
            <div key={l} className="ab-stat">
              <div className="v">{v}</div>
              <div className="l">{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Mission ── */}
      <section className="ab-section">
        <div className="container">
          <div className="ab-mission">
            <div className="txt fade-up">
              <span className="ab-label" style={{ textAlign: 'left' }}>Missiyamiz</span>
              <h2 className="ab-h2" style={{ textAlign: 'left' }}>Bilim — manzilga olib boradigan xarita</h2>
              <p>
                Biz geografiya shunchaki yodlanadigan fan emas, dunyoni tushunish vositasi ekaniga ishonamiz.
                Shuning uchun har bir darsni qiziqarli, har bir testni foydali va har bir sertifikatni qadrli qilishga harakat qilamiz.
              </p>
              <div className="pts">
                {[
                  "Maktab dasturidan DTM imtihonlarigacha — barcha bosqichlar uchun kurslar",
                  "Har bir kurs moderatsiyadan o'tgan, tajribali o'qituvchilar tomonidan tayyorlangan",
                  "Natijangiz tekshirish kodiga ega rasmiy sertifikat bilan tasdiqlanadi",
                ].map(t => (
                  <div key={t} className="pt">
                    <span className="ic"><Icon name="check" size={14} /></span>
                    <span>{t}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="ab-mosaic fade-up-d2">
              {TILES.map(([e, cap], i) => (
                <div key={cap} className="ab-tile" style={{ background: i % 3 === 0 ? 'var(--green-50)' : i % 3 === 1 ? 'var(--blue-50)' : 'var(--amber-50)' }}>
                  <span>{e}</span>
                  <span className="cap">{cap}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Values ── */}
      <section className="ab-section" style={{ background: 'var(--bg-soft)', borderTop: '1px solid var(--border-2)', borderBottom: '1px solid var(--border-2)' }}>
        <div className="container">
          <span className="ab-label">Qadriyatlar</span>
          <h2 className="ab-h2">Biz nimaga ishonamiz</h2>
          <p className="ab-sub">Platformadagi har bir sahifa, har bir tugma shu uch tamoyil asosida quriladi.</p>
          <div className="ab-values">
            {VALUES.map((v, i) => (
              <div key={v.t} className={`ab-value fade-up-d${i + 1}`}>
                <div className="ic"><Icon name={v.icon} size={22} /></div>
                <h3>{v.t}</h3>
                <p>{v.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="ab-section">
        <div className="container">
          <span className="ab-label">Yo'l xaritasi</span>
          <h2 className="ab-h2">Qanday ishlaydi</h2>
          <p className="ab-sub">Uch oddiy qadam — ro'yxatdan o'tishdan sertifikatgacha.</p>
          <div className="ab-steps">
            {STEPS.map((s, i) => (
              <div key={s.t} className={`ab-step fade-up-d${i + 1}`}>
                <span className="n">{String(i + 1).padStart(2, '0')}</span>
                <h3>{s.t}</h3>
                <p>{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Team (admin-managed) ── */}
      {team.length > 0 && (
        <section className="ab-section" style={{ background: 'var(--bg-soft)', borderTop: '1px solid var(--border-2)', borderBottom: '1px solid var(--border-2)' }}>
          <div className="container">
            <span className="ab-label">Jamoa</span>
            <h2 className="ab-h2">Ionedu ortidagi insonlar</h2>
            <p className="ab-sub">Platformani har kuni siz uchun yaxshilab boradigan jamoamiz bilan tanishing.</p>
            <div className="ab-team">
              {team.map((m, i) => (
                <div key={m.id} className={`ab-member fade-up-d${Math.min(i % 4 + 1, 4)}`}>
                  <div className="ph">
                    {m.photo ? <img src={absUrl(m.photo)} alt={m.full_name} /> : m.initials}
                  </div>
                  <h3>{m.full_name}</h3>
                  <div className="pos">{m.position}</div>
                  {m.bio && <p className="bio">{m.bio}</p>}
                  {(m.telegram || m.linkedin) && (
                    <div className="socials">
                      {m.telegram && (
                        <a href={m.telegram} target="_blank" rel="noreferrer" title="Telegram" aria-label="Telegram">
                          <Icon name="twitter" size={15} />
                        </a>
                      )}
                      {m.linkedin && (
                        <a href={m.linkedin} target="_blank" rel="noreferrer" title="LinkedIn" aria-label="LinkedIn">
                          <Icon name="link" size={15} />
                        </a>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── CTA ── */}
      <section className="ab-section" style={{ paddingBottom: 96 }}>
        <div className="container">
          <div className="ab-cta fade-up">
            <h2>Geografiya sayohatingizni bugun boshlang</h2>
            <p>Minglab o'quvchilar allaqachon biz bilan. Birinchi kurs — bepul.</p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link to="/auth/register" className="btn btn-primary btn-lg">
                Ro'yxatdan o'tish <Icon name="arrowR" size={16} />
              </Link>
              <Link to="/courses" className="btn btn-lg" style={{ background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.22)' }}>
                Kurslarni ko'rish
              </Link>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  )
}
