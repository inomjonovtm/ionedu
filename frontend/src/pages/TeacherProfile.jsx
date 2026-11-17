import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import api, { absUrl } from '../api/client'
import Layout from '../components/Layout'
import CourseCard from '../components/CourseCard'
import Pagination from '../components/Pagination'
import Icon from '../components/Icon'
import { useAuth } from '../store/auth'

const COURSES_PER_PAGE = 6

const css = `
  .tp-page { display: grid; grid-template-columns: 340px 1fr; gap: 44px; align-items: start; padding-top: 40px; padding-bottom: 90px; }

  /* ── Left: the teacher's "passport" ── */
  .tp-pass { position: sticky; top: 96px; background: var(--white); border: 2px solid var(--line); border-radius: 26px; box-shadow: var(--hard-lg); overflow: hidden; }
  .tp-pass-top { background-color: var(--sun); background-image: var(--topo); background-size: 420px 290px; padding: 16px 20px 62px; display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid var(--line); color: #14213D; }
  .tp-pass-top span { font-family: var(--font-mono); font-size: 10.5px; font-weight: 700; letter-spacing: .14em; text-transform: uppercase; }
  .tp-photo {
    width: 132px; height: 132px; margin: -50px 0 0 22px; border-radius: 26px; overflow: hidden; position: relative;
    border: 2px solid var(--line); background: #C9DCFF; color: #14213D; transform: rotate(-3deg);
    display: flex; align-items: center; justify-content: center;
    font-family: var(--font-display); font-weight: 800; font-size: 48px; letter-spacing: -.04em;
  }
  .tp-photo img { width: 100%; height: 100%; object-fit: cover; }
  .tp-pass-body { padding: 18px 22px 22px; }
  .tp-name { font-size: 30px; letter-spacing: -0.04em; line-height: 1.05; overflow-wrap: anywhere; }
  .tp-spec { font-size: 14.5px; color: var(--text-3); margin-top: 8px; font-weight: 600; line-height: 1.45; }
  .tp-badges { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 12px; }
  .tp-facts { margin-top: 18px; border-top: 1.5px dashed var(--border); }
  .tp-fact { display: grid; grid-template-columns: 34px 1fr; gap: 12px; align-items: center; padding: 11px 0; border-bottom: 1.5px dashed var(--border); font-size: 13.5px; color: var(--text-2); line-height: 1.45; }
  .tp-fact .ic { width: 34px; height: 34px; border-radius: 11px; background: var(--bg-soft); color: var(--text-2); display: flex; align-items: center; justify-content: center; }
  .tp-fact small { display: block; font-family: var(--font-mono); font-size: 9.5px; font-weight: 600; letter-spacing: .12em; text-transform: uppercase; color: var(--text-4); }
  .tp-pass .btn { margin-top: 18px; }

  /* ── Right: content ── */
  .tp-main { min-width: 0; }
  .tp-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
  .tp-stat { border: 1.5px solid var(--line); border-radius: 20px; padding: 16px 16px 14px; color: #14213D; }
  .tp-stat:nth-child(1) { background: #9DBDFF; } .tp-stat:nth-child(2) { background: #8FE0B4; }
  .tp-stat:nth-child(3) { background: var(--sun); transform: rotate(-2deg); box-shadow: var(--hard-sm); } .tp-stat:nth-child(4) { background: #FF9D88; }
  .tp-stat .v { font-family: var(--font-display); font-size: 38px; font-weight: 800; letter-spacing: -0.05em; line-height: 1; }
  .tp-stat .l { font-family: var(--font-mono); font-size: 10.5px; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; margin-top: 8px; opacity: .8; }

  .tp-sec { margin-top: 44px; }
  .tp-sec-head { display: flex; align-items: center; gap: 12px; margin-bottom: 18px; }
  .tp-sec-head .no { font-family: var(--font-mono); font-size: 11px; font-weight: 700; color: var(--text-3); border: 1.5px solid var(--line); border-radius: 999px; padding: 2px 9px; background: var(--white); }
  .tp-sec-head h2 { font-size: 28px; letter-spacing: -0.04em; }
  .tp-sec-head .rule { flex: 1; border-top: 1.5px dashed var(--border); }
  .tp-sec-head .cnt { font-family: var(--font-mono); font-size: 11px; font-weight: 700; background: var(--sun); color: #14213D; border-radius: 999px; padding: 2px 10px; }
  .tp-bio { font-size: 16.5px; line-height: 1.7; color: var(--text-2); max-width: 680px; white-space: pre-line; }
  .tp-courses { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }

  .tp-creds { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
  .tp-cred { display: flex; gap: 14px; background: var(--white); border: 1.5px solid var(--border); border-radius: 20px; padding: 16px; }
  .tp-cred .seal { width: 50px; height: 50px; border-radius: 16px; flex-shrink: 0; background: var(--sun); color: #14213D; border: 1.5px solid var(--line); transform: rotate(-6deg); display: flex; align-items: center; justify-content: center; }
  .tp-cred .ttl { font-family: var(--font-display); font-weight: 700; font-size: 16px; letter-spacing: -0.02em; line-height: 1.25; }
  .tp-cred .by { font-family: var(--font-mono); font-size: 11px; color: var(--text-3); letter-spacing: .04em; margin-top: 5px; }
  .tp-cred .body { flex: 1; min-width: 0; }
  .tp-cred .btn { margin-top: 10px; }
  .tp-fact strong { color: var(--text); }
  .tp-cred .note { font-size: 12.5px; color: var(--text-3); line-height: 1.5; margin-top: 8px; }

  .tp-to { display: flex; gap: 12px; align-items: center; padding: 12px; background: var(--bg-soft); border-radius: 16px; margin-bottom: 16px; }
  .tp-to .nm { font-weight: 700; font-size: 14px; }
  .tp-to .who { min-width: 0; }
  .tp-to .avatar { width: 38px; height: 38px; font-size: 13px; border-radius: 12px; border: 1.5px solid var(--line); }
  .tp-modal-head { display: flex; justify-content: space-between; align-items: center; gap: 12px; margin-bottom: 18px; }
  .tp-modal-head h3 { font-size: 22px; }
  .tp-modal-foot { display: flex; gap: 8px; justify-content: flex-end; flex-wrap: wrap; padding-top: 16px; border-top: 1.5px dashed var(--border); }

  @media (max-width: 1024px) {
    .tp-page { grid-template-columns: 300px 1fr; gap: 28px; }
    .tp-stats { grid-template-columns: 1fr 1fr; }
    .tp-courses, .tp-creds { grid-template-columns: 1fr; }
  }
  @media (max-width: 768px) {
    .tp-page { grid-template-columns: 1fr; padding-top: 22px; gap: 26px; }
    .tp-pass { position: static; box-shadow: var(--hard); }
    .tp-stat .v { font-size: 30px; }
    .tp-stat:nth-child(3) { transform: none; }
    .tp-sec { margin-top: 34px; }
    .tp-sec-head h2 { font-size: 23px; }
  }
`

export default function TeacherProfile() {
  const { id } = useParams()
  const [msgOpen, setMsgOpen] = useState(false)
  const [msgText, setMsgText] = useState('')
  const [coursePage, setCoursePage] = useState(1)
  const { user } = useAuth()

  const sendMessage = useMutation({
    mutationFn: () => api.post(`/teachers/${id}/message/`, { text: msgText }),
    onSuccess: () => { toast.success("Xabar yuborildi"); setMsgOpen(false); setMsgText('') },
    onError: () => toast.error("Yuborib bo'lmadi"),
  })

  const { data: teacher } = useQuery({
    queryKey: ['teacher', id],
    queryFn: () => api.get(`/teachers/${id}/`).then(r => r.data),
  })
  const { data: courses = [] } = useQuery({
    queryKey: ['teacher-courses', id],
    queryFn: () => api.get(`/courses/?teacher=${id}&status=published`).then(r => r.data.results || r.data),
    enabled: !!id,
  })
  const { data: credentials = [] } = useQuery({
    queryKey: ['teacher-credentials', id],
    queryFn: () => api.get(`/teachers/${id}/credentials/`).then(r => r.data),
    enabled: !!id,
  })

  if (!teacher) return <Layout><div className="loading-state"><span className="spinner" />Yuklanmoqda…</div></Layout>

  const joinYear = teacher.date_joined ? new Date(teacher.date_joined).getFullYear() : null
  let secNo = 0
  const no = () => String(++secNo).padStart(2, '0')

  return (
    <Layout>
      <style>{css}</style>
      <div className="container tp-page">
        <aside className="tp-pass fade-up">
          <div className="tp-pass-top">
            <span>Ustoz pasporti</span>
            <span>№ {String(teacher.id).padStart(3, '0')}</span>
          </div>
          <div className="tp-photo">
            {teacher.avatar ? <img src={absUrl(teacher.avatar)} alt="" /> : teacher.initials}
          </div>
          <div className="tp-pass-body">
            <h1 className="tp-name">{teacher.display_name}</h1>
            <div className="tp-spec">{teacher.specialty || "Geografiya o'qituvchisi"}</div>
            <div className="tp-badges">
              {teacher.avg_rating > 0 && (
                <span className="badge badge-amber"><Icon name="starF" size={12} /> {teacher.avg_rating.toFixed(1)}</span>
              )}
              {credentials.length > 0 && (
                <span className="badge badge-green"><Icon name="checkC" size={12} /> Tasdiqlangan malaka</span>
              )}
            </div>

            <div className="tp-facts">
              {teacher.experience_years && (
                <div className="tp-fact">
                  <span className="ic"><Icon name="clock" size={16} /></span>
                  <span><small>Tajriba</small>{teacher.experience_years} yil tajriba</span>
                </div>
              )}
              {teacher.education && (
                <div className="tp-fact">
                  <span className="ic"><Icon name="book" size={16} /></span>
                  <span><small>Ta'lim</small>{teacher.education}</span>
                </div>
              )}
              <div className="tp-fact">
                <span className="ic"><Icon name="mapPin" size={16} /></span>
                <span><small>Manzil</small>{teacher.city || teacher.region || 'O\'zbekiston'}</span>
              </div>
              <div className="tp-fact">
                <span className="ic"><Icon name="calendar" size={16} /></span>
                <span><small>A'zolik</small>{joinYear ? `${joinYear}-yildan beri Ionedu a'zosi` : "Ionedu a'zosi"}</span>
              </div>
              {credentials.length > 0 && (
                <div className="tp-fact">
                  <span className="ic"><Icon name="award" size={16} /></span>
                  <span><small>Malaka</small><strong>{credentials.length}</strong> ta sertifikat va malaka guvohnomasi</span>
                </div>
              )}
            </div>

            {user && user.id !== teacher.id && (
              <button className="btn btn-primary btn-block" onClick={() => setMsgOpen(true)}>
                <Icon name="message" size={15} /> Yozish
              </button>
            )}
          </div>
        </aside>

        <div className="tp-main">
          <div className="tp-stats fade-up-d1">
            <div className="tp-stat"><div className="v">{teacher.course_count ?? courses.length}</div><div className="l">Kurslar</div></div>
            <div className="tp-stat"><div className="v">{teacher.students_count ?? 0}</div><div className="l">O'quvchilar</div></div>
            <div className="tp-stat"><div className="v">{(teacher.avg_rating ?? 0).toFixed(1)}</div><div className="l">Reyting</div></div>
            <div className="tp-stat"><div className="v">{teacher.review_count ?? 0}</div><div className="l">Sharhlar</div></div>
          </div>

          {teacher.bio && (
            <section className="tp-sec">
              <div className="tp-sec-head"><span className="no">{no()}</span><h2>O'qituvchi haqida</h2><span className="rule" /></div>
              <p className="tp-bio">{teacher.bio}</p>
            </section>
          )}

          <section className="tp-sec">
            <div className="tp-sec-head">
              <span className="no">{no()}</span><h2>Kurslari</h2>
              {courses.length > 0 && <span className="cnt">{courses.length}</span>}
              <span className="rule" />
            </div>
            {courses.length === 0 ? (
              <div className="card">
                <div className="empty-state empty-sm">
                  <div className="es-ico"><Icon name="book" size={18} /></div>
                  <div className="es-title">Hozircha nashr etilgan kurslar yo'q</div>
                  <div className="es-sub">O'qituvchi kurs nashr etganida shu yerda ko'rinadi</div>
                </div>
              </div>
            ) : (
              <>
                <div className="tp-courses">
                  {courses.slice((coursePage - 1) * COURSES_PER_PAGE, coursePage * COURSES_PER_PAGE)
                    .map(c => <CourseCard key={c.id} course={c} />)}
                </div>
                <Pagination page={coursePage} pageSize={COURSES_PER_PAGE} total={courses.length} onChange={setCoursePage} />
              </>
            )}
          </section>

          {credentials.length > 0 && (
            <section className="tp-sec">
              <div className="tp-sec-head"><span className="no">{no()}</span><h2>Sertifikatlari</h2><span className="rule" /></div>
              <div className="tp-creds">
                {credentials.map(c => (
                  <div key={c.id} className="tp-cred">
                    <div className="seal"><Icon name="award" size={24} /></div>
                    <div className="body">
                      <div className="ttl">{c.title}</div>
                      {(c.issuer || c.issued_year) && (
                        <div className="by">{[c.issuer, c.issued_year].filter(Boolean).join(' · ')}</div>
                      )}
                      {c.note && <div className="note">{c.note}</div>}
                      {c.file && (
                        <a href={absUrl(c.file)} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm">
                          <Icon name="eye" size={13} /> Ko'rish
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {msgOpen && (
          <div className="modal-backdrop" onClick={() => setMsgOpen(false)}>
            <div className="modal tp-modal" role="dialog" aria-modal="true" onClick={e => e.stopPropagation()}>
              <div className="tp-modal-head">
                <h3>O'qituvchiga xabar</h3>
                <button type="button" className="icon-btn" aria-label="Yopish" onClick={() => setMsgOpen(false)}><Icon name="x" size={18} /></button>
              </div>
              <div className="tp-to">
                <div className="avatar avatar-amber">{teacher.initials}</div>
                <div className="who">
                  <div className="nm">{teacher.display_name}</div>
                  <div className="text-xs text-muted">{teacher.bio?.slice(0, 50) || "O'qituvchi"}</div>
                </div>
              </div>
              <div className="field">
                <label className="label">Xabar</label>
                <textarea className="textarea" rows={5} value={msgText} onChange={e => setMsgText(e.target.value)}
                  placeholder="Savolingiz yoki xabaringizni yozing…" autoFocus />
              </div>
              <div className="tp-modal-foot">
                <button type="button" className="btn btn-secondary" onClick={() => setMsgOpen(false)}>Bekor</button>
                <button type="button" className="btn btn-primary" disabled={!msgText.trim() || sendMessage.isPending}
                  onClick={() => user ? sendMessage.mutate() : toast.error("Avval kiring")}>
                  {sendMessage.isPending ? 'Yuborilmoqda…' : 'Yuborish'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
