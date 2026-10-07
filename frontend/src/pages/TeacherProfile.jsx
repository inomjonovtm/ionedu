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

  return (
    <Layout>
      <style>{`
        .tprof-grid { display: grid; grid-template-columns: 1fr 320px; gap: 40px; padding-bottom: 80px; }
        .tprof-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; padding: 20px; margin-bottom: 32px; text-align: center; }
        @media (max-width: 920px) {
          .tprof-grid { grid-template-columns: 1fr; gap: 24px; }
          .tprof-stats { grid-template-columns: repeat(2, 1fr); }
        }
      `}</style>
      <div style={{
        height: 200,
        background: 'radial-gradient(ellipse 55% 90% at 85% 100%, var(--green-200) 0%, transparent 70%), radial-gradient(ellipse 45% 70% at 10% 0%, var(--green-100) 0%, transparent 70%), linear-gradient(180deg, var(--green-50) 0%, var(--bg-soft) 100%)',
        borderBottom: '1px solid var(--border-2)',
      }} />
      <div className="container">
        <div style={{ display: 'flex', alignItems: 'end', gap: 24, marginTop: -80, marginBottom: 32, flexWrap: 'wrap' }}>
          <div className="avatar avatar-amber" style={{ width: 140, height: 140, fontSize: 56, border: '5px solid var(--paper)', overflow: 'hidden', flexShrink: 0 }}>
            {teacher.avatar ? <img src={absUrl(teacher.avatar)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : teacher.initials}
          </div>
          <div style={{ flex: 1, paddingBottom: 8, minWidth: 200 }}>
            <h1 style={{ fontSize: 30 }}>{teacher.display_name}</h1>
            <div style={{ fontSize: 15, color: 'var(--text-3)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <span>{teacher.specialty || "Geografiya o'qituvchisi"}</span>
              {teacher.avg_rating > 0 && (
                <span className="badge badge-amber" style={{ fontSize: 12 }}>
                  <Icon name="starF" size={12} /> {teacher.avg_rating.toFixed(1)}
                </span>
              )}
              {credentials.length > 0 && (
                <span className="badge badge-green" style={{ fontSize: 12 }}>
                  <Icon name="checkC" size={12} /> Tasdiqlangan malaka
                </span>
              )}
            </div>
          </div>
          {user && user.id !== teacher.id && (
            <div style={{ display: 'flex', gap: 10, paddingBottom: 8 }}>
              <button className="btn btn-primary" onClick={() => setMsgOpen(true)}>
                <Icon name="message" size={14} /> Yozish
              </button>
            </div>
          )}
        </div>

        {msgOpen && (
          <div className="modal-backdrop" onClick={() => setMsgOpen(false)}>
            <div className="modal" style={{ maxWidth: 480 }} onClick={e => e.stopPropagation()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
                <h3 style={{ fontSize: 18, fontFamily: 'var(--font-display)' }}>O'qituvchiga xabar</h3>
                <button className="icon-btn" onClick={() => setMsgOpen(false)}><Icon name="x" size={18} /></button>
              </div>
              <div style={{ display: 'flex', gap: 12, marginBottom: 14, alignItems: 'center', padding: 10, background: 'var(--bg-soft)', borderRadius: 8 }}>
                <div className="avatar avatar-amber" style={{ width: 36, height: 36, fontSize: 13 }}>{teacher.initials}</div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{teacher.display_name}</div>
                  <div className="text-xs text-muted">{teacher.bio?.slice(0, 50) || "O'qituvchi"}</div>
                </div>
              </div>
              <div className="field">
                <label className="label">Xabar</label>
                <textarea className="textarea" rows={5} value={msgText} onChange={e => setMsgText(e.target.value)}
                  placeholder="Savolingiz yoki xabaringizni yozing…" autoFocus />
              </div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button className="btn btn-secondary" onClick={() => setMsgOpen(false)}>Bekor</button>
                <button className="btn btn-primary" disabled={!msgText.trim() || sendMessage.isPending}
                  onClick={() => user ? sendMessage.mutate() : toast.error("Avval kiring")}>
                  {sendMessage.isPending ? 'Yuborilmoqda…' : 'Yuborish'}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="tprof-grid">
          <div>
            <div className="card tprof-stats">
              <div><div style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 800 }}>{teacher.course_count ?? courses.length}</div><div className="text-xs text-muted mt-1">Kurslar</div></div>
              <div><div style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 800 }}>{teacher.students_count ?? 0}</div><div className="text-xs text-muted mt-1">O'quvchilar</div></div>
              <div><div style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 800, color: teacher.avg_rating > 0 ? 'var(--amber-600)' : 'inherit' }}>{(teacher.avg_rating ?? 0).toFixed(1)}</div><div className="text-xs text-muted mt-1">Reyting</div></div>
              <div><div style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 800 }}>{teacher.review_count ?? 0}</div><div className="text-xs text-muted mt-1">Sharhlar</div></div>
            </div>

            <h2 style={{ fontSize: 22, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
              Kurslari
              {courses.length > 0 && <span className="badge badge-gray" style={{ fontSize: 12 }}>{courses.length}</span>}
            </h2>
            {courses.length === 0 ? (
              <div className="card" style={{ padding: 48, textAlign: 'center', color: 'var(--text-3)' }}>
                <Icon name="book" size={32} style={{ color: 'var(--text-4)', margin: '0 auto 10px' }} />
                <div style={{ fontWeight: 600, color: 'var(--text-2)', marginBottom: 4 }}>Hozircha nashr etilgan kurslar yo'q</div>
                <div className="text-sm">O'qituvchi kurs nashr etganida shu yerda ko'rinadi</div>
              </div>
            ) : (
              <>
                <div className="grid grid-2">
                  {courses.slice((coursePage - 1) * COURSES_PER_PAGE, coursePage * COURSES_PER_PAGE)
                    .map(c => <CourseCard key={c.id} course={c} />)}
                </div>
                <Pagination page={coursePage} pageSize={COURSES_PER_PAGE} total={courses.length} onChange={setCoursePage} />
              </>
            )}

            {credentials.length > 0 && (
              <>
                <h2 style={{ fontSize: 22, margin: '40px 0 20px', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Icon name="award" size={22} style={{ color: 'var(--amber-600)' }} /> Sertifikatlari
                </h2>
                <div className="grid grid-2">
                  {credentials.map(c => (
                    <div key={c.id} className="card" style={{ display: 'flex', gap: 14, padding: 18 }}>
                      <div style={{ width: 52, height: 52, borderRadius: 12, background: 'var(--amber-50)', color: 'var(--amber-600)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Icon name="award" size={24} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{c.title}</div>
                        {(c.issuer || c.issued_year) && (
                          <div className="text-sm text-muted">
                            {[c.issuer, c.issued_year].filter(Boolean).join(' · ')}
                          </div>
                        )}
                        {c.note && <div className="text-xs text-muted mt-2" style={{ lineHeight: 1.5 }}>{c.note}</div>}
                        {c.file && (
                          <a href={absUrl(c.file)} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm" style={{ marginTop: 10 }}>
                            <Icon name="eye" size={13} /> Ko'rish
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          <aside>
            <div className="card mb-4">
              <h4 style={{ fontSize: 14, marginBottom: 12, fontFamily: 'var(--font-display)' }}>O'qituvchi haqida</h4>
              {teacher.bio && (
                <p className="text-sm" style={{ color: 'var(--text-2)', lineHeight: 1.6, marginBottom: 14, paddingBottom: 14, borderBottom: '1px solid var(--border-2)' }}>
                  {teacher.bio}
                </p>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13, color: 'var(--text-2)' }}>
                {teacher.specialty && (
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <Icon name="award" size={15} style={{ color: 'var(--text-3)', marginTop: 2 }} />
                    <span>{teacher.specialty}</span>
                  </div>
                )}
                {teacher.experience_years && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Icon name="clock" size={15} style={{ color: 'var(--text-3)' }} />
                    <span>{teacher.experience_years} yil tajriba</span>
                  </div>
                )}
                {teacher.education && (
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <Icon name="book" size={15} style={{ color: 'var(--text-3)', marginTop: 2 }} />
                    <span style={{ lineHeight: 1.5 }}>{teacher.education}</span>
                  </div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Icon name="mapPin" size={15} style={{ color: 'var(--text-3)' }} />
                  <span>{teacher.city || teacher.region || 'O\'zbekiston'}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Icon name="calendar" size={15} style={{ color: 'var(--text-3)' }} />
                  <span>{joinYear ? `${joinYear}-yildan beri Ionedu a'zosi` : "Ionedu a'zosi"}</span>
                </div>
              </div>
            </div>
            {credentials.length > 0 && (
              <div className="card mb-4" style={{ background: 'linear-gradient(135deg, var(--amber-50), var(--white))', border: '1px solid var(--border-2)' }}>
                <h4 style={{ fontSize: 14, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Icon name="award" size={16} style={{ color: 'var(--amber-600)' }} />
                  Tasdiqlangan malaka
                </h4>
                <div className="text-sm text-muted">
                  <strong style={{ color: 'var(--text)' }}>{credentials.length}</strong> ta sertifikat va malaka guvohnomasi
                </div>
              </div>
            )}
          </aside>
        </div>
      </div>
    </Layout>
  )
}
