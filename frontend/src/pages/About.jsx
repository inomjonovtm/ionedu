import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import api, { absUrl } from '../api/client'
import Layout from '../components/Layout'
import Icon from '../components/Icon'

const styles = `
  .ab { overflow-x: clip; }

  /* ── Hero: statement + live stat stickers ── */
  .ab-hero { padding: 60px 0 0; }
  .ab-hero-grid { display: grid; grid-template-columns: minmax(0, 1.15fr) minmax(0, .85fr); gap: 56px; align-items: center; }
  .ab-kick { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; margin-bottom: 24px; }
  .ab-hero h1 {
    font-family: var(--font-display); font-weight: 800;
    font-size: clamp(38px, 5.6vw, 72px); line-height: 1; letter-spacing: -0.045em;
  }
  .ab-hero p { font-size: 17.5px; color: var(--text-2); line-height: 1.7; max-width: 540px; margin-top: 26px; font-weight: 500; }
  .ab-hero-acts { display: flex; gap: 12px; flex-wrap: wrap; margin-top: 30px; }

  .ab-statgrid { position: relative; display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
  .ab-stat {
    border: 2px solid var(--line); border-radius: 24px; padding: 22px 20px 20px;
    color: #14213D; box-shadow: var(--hard); display: flex; flex-direction: column; gap: 22px;
  }
  .ab-stat:nth-child(1) { background: var(--sun); transform: rotate(-2deg); }
  .ab-stat:nth-child(2) { background: #9DBDFF; transform: rotate(1.5deg) translateY(18px); }
  .ab-stat:nth-child(3) { background: #8FE0B4; transform: rotate(1.5deg); }
  .ab-stat:nth-child(4) { background: #FF9D88; transform: rotate(-1.5deg) translateY(18px); }
  .ab-stat .e { font-size: 30px; line-height: 1; }
  .ab-stat .v { font-family: var(--font-display); font-weight: 800; font-size: clamp(34px, 4vw, 48px); letter-spacing: -0.05em; line-height: 1; }
  .ab-stat .l { font-family: var(--font-mono); font-size: 10.5px; letter-spacing: .1em; text-transform: uppercase; font-weight: 600; margin-top: 6px; opacity: .8; }
  .ab-seal {
    position: absolute; left: 50%; top: 50%; width: 92px; height: 92px; margin: -37px 0 0 -46px;
    border-radius: 999px; background: var(--white); border: 2px solid var(--line);
    display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 1px;
    transform: rotate(-12deg); color: var(--text); box-shadow: var(--hard-sm);
    font-family: var(--font-mono); font-size: 8.5px; letter-spacing: .12em; font-weight: 600;
  }
  .ab-seal::before { content: ''; position: absolute; inset: 5px; border-radius: 999px; border: 1.5px dashed var(--line); }

  /* ── Section scaffolding ── */
  .ab-sec { padding: 104px 0 0; }
  .ab-h2 { font-family: var(--font-display); font-size: clamp(28px, 3.6vw, 42px); font-weight: 800; letter-spacing: -0.04em; line-height: 1.06; margin-top: 16px; }

  /* ── Mission: ink panel ── */
  .ab-mission {
    position: relative; overflow: hidden;
    display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 56px; align-items: center;
    background: var(--ink); color: #fff; border: 2px solid var(--line); border-radius: 32px; padding: 60px 56px;
  }
  .ab-mission svg.lines { position: absolute; inset: 0; width: 100%; height: 100%; }
  .ab-mission > div { position: relative; }
  .ab-mission .coord { color: var(--sun); }
  .ab-mission h2 { font-family: var(--font-display); font-size: clamp(30px, 4vw, 50px); font-weight: 800; letter-spacing: -0.045em; line-height: 1.04; color: #fff; margin-top: 14px; }
  .ab-mission h2 span { color: var(--sun); }
  .ab-mission .txt { color: #B7C0D8; font-size: 16.5px; line-height: 1.75; margin-top: 20px; font-weight: 500; }
  .ab-pts { display: flex; flex-direction: column; }
  .ab-pt { display: flex; gap: 16px; align-items: flex-start; padding: 20px 0; font-size: 15.5px; line-height: 1.55; color: #fff; font-weight: 600; }
  .ab-pt + .ab-pt { border-top: 1.5px dashed rgba(255,255,255,.22); }
  .ab-pt .ic {
    width: 30px; height: 30px; border-radius: 10px; flex-shrink: 0; background: var(--sun); color: #14213D;
    display: flex; align-items: center; justify-content: center;
  }

  .ab-tiles { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 14px; margin-top: 16px; }
  .ab-tile {
    display: flex; align-items: center; gap: 14px; padding: 16px 18px;
    background: var(--white); border: 1.5px solid var(--border); border-radius: 18px;
    font-weight: 700; font-size: 14.5px; line-height: 1.25;
    transition: transform .16s ease, box-shadow .16s ease, border-color .16s ease;
  }
  .ab-tile:hover { transform: translate(-2px, -2px); border-color: var(--line); box-shadow: var(--hard-sm); }
  .ab-tile .e { font-size: 30px; line-height: 1; }

  /* ── Values: editorial rows ── */
  .ab-values { display: grid; grid-template-columns: minmax(0, 4fr) minmax(0, 8fr); gap: 56px; align-items: start; }
  .ab-values .side { position: sticky; top: 104px; }
  .ab-values .side p { color: var(--text-3); font-size: 16px; line-height: 1.65; margin-top: 16px; font-weight: 500; }
  .ab-vrow {
    display: grid; grid-template-columns: 56px minmax(0, 1fr); gap: 22px; align-items: start;
    padding: 30px 0; border-top: 2px solid var(--line);
  }
  .ab-vrow:last-child { border-bottom: 2px solid var(--line); }
  .ab-vrow .ic {
    width: 56px; height: 56px; border-radius: 18px; border: 2px solid var(--line); color: #14213D;
    display: flex; align-items: center; justify-content: center; transition: transform .2s ease, box-shadow .2s ease;
  }
  .ab-vrow:hover .ic { transform: translate(-2px, -2px) rotate(-6deg); box-shadow: var(--hard-sm); }
  .ab-vrow .top { display: flex; align-items: baseline; justify-content: space-between; gap: 16px; }
  .ab-vrow h3 { font-family: var(--font-display); font-size: 26px; font-weight: 800; letter-spacing: -0.035em; }
  .ab-vrow p { color: var(--text-3); font-size: 15.5px; line-height: 1.7; margin-top: 8px; max-width: 560px; font-weight: 500; }

  /* ── Steps: one ticket, three stubs ── */
  .ab-ticket { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); background: var(--white); border: 2px solid var(--line); border-radius: 26px; box-shadow: var(--hard); margin-top: 36px; }
  .ab-stub { position: relative; padding: 30px 28px 32px; }
  .ab-stub + .ab-stub { border-left: 2px dashed var(--line); }
  .ab-stub + .ab-stub::before {
    content: '→'; position: absolute; left: -19px; top: 30px; width: 36px; height: 36px; border-radius: 999px;
    background: var(--sun); color: #14213D; border: 2px solid var(--line); font-weight: 800; font-size: 16px;
    display: flex; align-items: center; justify-content: center;
  }
  .ab-stub .n { font-family: var(--font-display); font-size: 52px; font-weight: 800; letter-spacing: -0.05em; line-height: 1; color: var(--text-4); }
  .ab-stub h3 { font-family: var(--font-display); font-size: 21px; font-weight: 800; letter-spacing: -0.03em; margin: 18px 0 8px; }
  .ab-stub p { color: var(--text-3); font-size: 14.5px; line-height: 1.65; font-weight: 500; }

  /* ── Team ── */
  .ab-head { display: flex; align-items: flex-end; justify-content: space-between; gap: 24px; flex-wrap: wrap; }
  .ab-head p { color: var(--text-3); font-size: 16px; max-width: 380px; line-height: 1.6; font-weight: 500; }
  .ab-team { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 22px; margin-top: 36px; }
  .ab-member {
    background: var(--white); border: 1.5px solid var(--border); border-radius: var(--r-card); padding: 12px 12px 20px;
    transition: transform .16s ease, box-shadow .16s ease, border-color .16s ease;
  }
  .ab-member:hover { transform: translate(-3px, -3px); border-color: var(--line); box-shadow: var(--hard); }
  .ab-member .ph {
    aspect-ratio: 4 / 3; border-radius: 14px; overflow: hidden; color: #14213D;
    display: flex; align-items: center; justify-content: center;
    font-family: var(--font-display); font-size: 56px; font-weight: 800; letter-spacing: -.04em;
  }
  .ab-member:nth-child(4n+1) .ph { background: var(--sun); }
  .ab-member:nth-child(4n+2) .ph { background: #9DBDFF; }
  .ab-member:nth-child(4n+3) .ph { background: #8FE0B4; }
  .ab-member:nth-child(4n+4) .ph { background: #C4B6FF; }
  .ab-member .ph img { width: 100%; height: 100%; object-fit: cover; }
  .ab-member .body { padding: 16px 8px 0; }
  .ab-member .pos { font-family: var(--font-mono); font-size: 10.5px; letter-spacing: .1em; text-transform: uppercase; color: var(--text-3); font-weight: 600; }
  .ab-member h3 { font-family: var(--font-display); font-size: 21px; font-weight: 800; letter-spacing: -0.03em; margin-top: 5px; }
  .ab-member .bio { color: var(--text-3); font-size: 14px; line-height: 1.65; margin-top: 10px; font-weight: 500; }
  .ab-member .socials { display: flex; gap: 8px; margin-top: 16px; padding-top: 14px; border-top: 1.5px dashed var(--border); }
  .ab-member .socials a {
    display: inline-flex; align-items: center; gap: 7px; height: 34px; padding: 0 12px; border-radius: 999px;
    border: 1.5px solid var(--border); font-size: 12.5px; font-weight: 700; color: var(--text-2);
    transition: border-color .14s ease, color .14s ease;
  }
  .ab-member .socials a:hover { border-color: var(--line); color: var(--text); }

  /* ── CTA: sun panel ── */
  .ab-cta-sec { padding: 104px 0 104px; }
  .ab-cta {
    position: relative; display: flex; align-items: center; justify-content: space-between; gap: 32px; flex-wrap: wrap;
    background: var(--sun); color: #14213D; border: 2px solid var(--line); border-radius: 32px;
    box-shadow: var(--hard-lg); padding: 52px 56px;
  }
  .ab-cta .coord { color: #14213D; opacity: .7; }
  .ab-cta h2 { font-family: var(--font-display); font-size: clamp(28px, 3.8vw, 46px); font-weight: 800; letter-spacing: -0.045em; line-height: 1.04; color: #14213D; max-width: 560px; margin-top: 10px; }
  .ab-cta p { font-size: 16.5px; font-weight: 600; margin-top: 12px; opacity: .8; }
  .ab-cta-acts { display: flex; gap: 12px; flex-wrap: wrap; }
  .ab-cta .btn-dark { background: #14213D; color: #fff; border-color: #14213D; box-shadow: 3px 3px 0 #fff; }
  .ab-cta .btn-lite { background: #fff; color: #14213D; border-color: #14213D; }
  .ab-cta .pin { position: absolute; right: 44px; top: -30px; font-size: 54px; line-height: 1; transform: rotate(10deg); }

  @media (max-width: 1000px) {
    .ab-hero-grid { grid-template-columns: 1fr; gap: 48px; }
    .ab-statgrid { max-width: 520px; }
    .ab-mission { grid-template-columns: 1fr; gap: 28px; padding: 48px 36px; }
    .ab-tiles { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .ab-values { grid-template-columns: 1fr; gap: 28px; }
    .ab-values .side { position: static; }
  }
  @media (max-width: 768px) {
    .ab-hero { padding-top: 36px; }
    .ab-sec { padding-top: 72px; }
    .ab-ticket { grid-template-columns: 1fr; }
    .ab-stub { padding: 26px 22px; }
    .ab-stub + .ab-stub { border-left: none; border-top: 2px dashed var(--line); }
    .ab-stub + .ab-stub::before { content: '↓'; left: auto; right: 22px; top: -19px; }
    .ab-cta-sec { padding: 72px 0 76px; }
    .ab-cta { padding: 40px 28px; border-radius: 26px; box-shadow: var(--hard); }
    .ab-cta .pin { right: 20px; font-size: 44px; top: -24px; }
  }
  @media (max-width: 520px) {
    .ab-stat { padding: 16px 14px; gap: 14px; border-radius: 20px; }
    .ab-stat:nth-child(n) { transform: none; }
    .ab-seal { display: none; }
    .ab-mission { padding: 36px 22px; border-radius: 26px; }
    .ab-tiles { grid-template-columns: 1fr; }
    .ab-vrow { grid-template-columns: 1fr; gap: 14px; padding: 24px 0; }
    .ab-vrow h3 { font-size: 22px; }
    .ab-hero-acts .btn, .ab-cta-acts .btn { flex: 1 1 100%; }
    .ab-cta-acts { width: 100%; }
  }
`

const VALUES = [
  { icon: 'users', bg: 'var(--sun)', t: "O'quvchi birinchi", d: "Har bir qaror o'quvchining qulayligi va manfaati uchun qabul qilinadi. Interfeys sodda, yo'l xaritasi aniq." },
  { icon: 'shield', bg: '#9DBDFF', t: 'Sifat kafolati', d: "Har bir kurs nashrdan oldin moderatsiyadan o'tadi. Faqat tekshirilgan o'qituvchilar va sifatli kontent." },
  { icon: 'globe', bg: '#8FE0B4', t: 'Hammaga ochiq', d: "Bepul kurslar bilan har bir o'quvchi geografiyani o'rganishni boshlay oladi — qayerda yashashidan qat'i nazar." },
]

const STEPS = [
  { t: "Ro'yxatdan o'ting", d: "Email yoki Google akkauntingiz orqali bir necha soniyada bepul akkaunt yarating." },
  { t: 'Kurs tanlang', d: "Mavzu yoki daraja bo'yicha tanlang. Video darslar, testlar va materiallar — hammasi bir joyda." },
  { t: 'Sertifikat oling', d: "Darslar va testlarni tugatsangiz, tekshirish kodiga ega rasmiy sertifikat avtomatik beriladi." },
]

const TILES = [
  ['🌍', 'Interaktiv darslar'],
  ['🧭', "Aniq yo'l xaritasi"],
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
      <div className="ab">

        {/* ── Hero + live stats ── */}
        <section className="ab-hero">
          <div className="container">
            <div className="ab-hero-grid">
              <div className="fade-up">
                <div className="ab-kick">
                  <span className="eyebrow">Biz haqimizda</span>
                  <span className="coord">TOSHKENT · 41.31°N · 69.24°E</span>
                </div>
                <h1>Geografiyani <span className="mark-sun">sevdiradigan</span> platforma</h1>
                <p>
                  Ionedu — O'zbekiston o'quvchilari uchun yaratilgan onlayn ta'lim makoni.
                  Eng yaxshi o'qituvchilar, sifatli video darslar va interaktiv testlar — hammasi bir joyda, hammaga ochiq.
                </p>
                <div className="ab-hero-acts">
                  <Link to="/courses" className="btn btn-primary btn-lg">Kurslarni ko'rish <Icon name="arrowR" size={16} /></Link>
                  <Link to="/contact" className="btn btn-secondary btn-lg">Bog'lanish</Link>
                </div>
              </div>

              <div className="ab-statgrid fade-up-d2">
                {[
                  ['🎒', stats.students ?? 0, "O'quvchilar"],
                  ['📚', stats.courses ?? 0, 'Kurslar'],
                  ['🧑‍🏫', stats.teachers ?? 0, "O'qituvchilar"],
                  ['🎓', stats.certificates ?? 0, 'Sertifikatlar'],
                ].map(([e, v, l]) => (
                  <div key={l} className="ab-stat">
                    <span className="e">{e}</span>
                    <div>
                      <div className="v">{v}</div>
                      <div className="l">{l}</div>
                    </div>
                  </div>
                ))}
                <span className="ab-seal" aria-hidden="true"><span>JONLI</span><span>· IONEDU ·</span><span>RAQAMLAR</span></span>
              </div>
            </div>
          </div>
        </section>

        {/* ── Mission ── */}
        <section className="ab-sec">
          <div className="container">
            <div className="ab-mission">
              <svg className="lines" viewBox="0 0 600 300" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
                <g fill="none" stroke="rgba(255,255,255,0.11)" strokeWidth="1.4">
                  <path d="M-20 250 C 90 190, 170 280, 290 220 S 480 160, 640 210" />
                  <path d="M-20 205 C 100 145, 190 235, 310 175 S 500 115, 640 165" />
                  <path d="M-20 160 C 110 100, 210 190, 330 130 S 520 70, 640 120" />
                  <path d="M-20 115 C 120 55, 230 145, 350 85 S 540 25, 640 75" />
                  <path d="M-20 70 C 130 10, 250 100, 370 40 S 560 -20, 640 30" />
                </g>
              </svg>
              <div>
                <span className="coord">MISSIYAMIZ</span>
                <h2>Bilim — manzilga olib boradigan <span>xarita</span></h2>
                <p className="txt">
                  Biz geografiya shunchaki yodlanadigan fan emas, dunyoni tushunish vositasi ekaniga ishonamiz.
                  Shuning uchun har bir darsni qiziqarli, har bir testni foydali va har bir sertifikatni qadrli qilishga harakat qilamiz.
                </p>
              </div>
              <div className="ab-pts">
                {[
                  "Maktab dasturidan DTM imtihonlarigacha — barcha bosqichlar uchun kurslar",
                  "Har bir kurs moderatsiyadan o'tgan, tajribali o'qituvchilar tomonidan tayyorlangan",
                  "Natijangiz tekshirish kodiga ega rasmiy sertifikat bilan tasdiqlanadi",
                ].map(t => (
                  <div key={t} className="ab-pt">
                    <span className="ic"><Icon name="check" size={16} /></span>
                    <span>{t}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="ab-tiles">
              {TILES.map(([e, cap]) => (
                <div key={cap} className="ab-tile">
                  <span className="e">{e}</span>
                  <span>{cap}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Values ── */}
        <section className="ab-sec">
          <div className="container">
            <div className="ab-values">
              <div className="side">
                <span className="eyebrow">Qadriyatlar</span>
                <h2 className="ab-h2">Biz nimaga <span className="mark-leaf">ishonamiz</span></h2>
                <p>Platformadagi har bir sahifa, har bir tugma shu uch tamoyil asosida quriladi.</p>
              </div>
              <div>
                {VALUES.map((v, i) => (
                  <div key={v.t} className="ab-vrow">
                    <span className="ic" style={{ background: v.bg }}><Icon name={v.icon} size={24} /></span>
                    <div>
                      <div className="top">
                        <h3>{v.t}</h3>
                        <span className="coord">0{i + 1} / 03</span>
                      </div>
                      <p>{v.d}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── How it works ── */}
        <section className="ab-sec">
          <div className="container">
            <div className="ab-head">
              <div>
                <span className="eyebrow">Yo'l xaritasi</span>
                <h2 className="ab-h2">Qanday <span className="mark-sea">ishlaydi</span></h2>
              </div>
              <p>Uch oddiy qadam — ro'yxatdan o'tishdan sertifikatgacha.</p>
            </div>
            <div className="ab-ticket">
              {STEPS.map((s, i) => (
                <div key={s.t} className="ab-stub">
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
          <section className="ab-sec">
            <div className="container">
              <div className="ab-head">
                <div>
                  <span className="eyebrow">Jamoa</span>
                  <h2 className="ab-h2">Ionedu ortidagi <span className="mark-coral">insonlar</span></h2>
                </div>
                <p>Platformani har kuni siz uchun yaxshilab boradigan jamoamiz bilan tanishing.</p>
              </div>
              <div className="ab-team">
                {team.map(m => (
                  <div key={m.id} className="ab-member">
                    <div className="ph">
                      {m.photo ? <img src={absUrl(m.photo)} alt={m.full_name} /> : m.initials}
                    </div>
                    <div className="body">
                      <div className="pos">{m.position}</div>
                      <h3>{m.full_name}</h3>
                      {m.bio && <p className="bio">{m.bio}</p>}
                      {(m.telegram || m.linkedin) && (
                        <div className="socials">
                          {m.telegram && (
                            <a href={m.telegram} target="_blank" rel="noreferrer" title="Telegram" aria-label="Telegram">
                              <Icon name="send" size={14} /> Telegram
                            </a>
                          )}
                          {m.linkedin && (
                            <a href={m.linkedin} target="_blank" rel="noreferrer" title="LinkedIn" aria-label="LinkedIn">
                              <Icon name="link" size={14} /> LinkedIn
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── CTA ── */}
        <section className="ab-cta-sec">
          <div className="container">
            <div className="ab-cta">
              <span className="pin" aria-hidden="true">📍</span>
              <div>
                <span className="coord">KEYINGI BEKAT — SIZ</span>
                <h2>Geografiya sayohatingizni bugun boshlang</h2>
                <p>Minglab o'quvchilar allaqachon biz bilan. Birinchi kurs — bepul.</p>
              </div>
              <div className="ab-cta-acts">
                <Link to="/auth/register" className="btn btn-lg btn-dark">
                  Ro'yxatdan o'tish <Icon name="arrowR" size={16} />
                </Link>
                <Link to="/courses" className="btn btn-lg btn-lite">
                  Kurslarni ko'rish
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </Layout>
  )
}
