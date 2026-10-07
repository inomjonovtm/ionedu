import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import api from '../../api/client'
import DashLayout from '../../components/DashLayout'
import Icon from '../../components/Icon'
import Pagination from '../../components/Pagination'
import FilterBar from '../../components/FilterBar'
import { PageHead, EmptyState } from '../../components/Dash'
import { useAuth } from '../../store/auth'

const PAGE_SIZE = 10

const styles = `
  .tt-card { background: var(--white); border: 1px solid var(--border); border-radius: var(--r-card); margin-bottom: 12px; overflow: hidden; transition: border-color .18s, box-shadow .18s; }
  .tt-card:hover { border-color: #D8DCD7; box-shadow: var(--shadow-soft); }
  .tt-head { display: flex; align-items: center; gap: 14px; padding: 16px 20px; cursor: pointer; }
  .tt-ic { width: 40px; height: 40px; border-radius: 12px; background: var(--green-50); color: var(--green-700); box-shadow: inset 0 0 0 1px var(--green-100); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .tt-meta { font-family: var(--font-mono); font-size: 11px; color: var(--text-4); letter-spacing: 0.02em; }
  .tt-body { border-top: 1px solid var(--border-2); padding: 16px 20px; background: var(--bg-soft); }
  .tt-q { background: var(--white); border: 1px solid var(--border); border-radius: 14px; padding: 16px; margin-bottom: 10px; }
  .tt-q-opt { display: flex; align-items: center; gap: 12px; padding: 9px 13px; border: 1px solid var(--border); border-radius: 11px; background: var(--white); margin-bottom: 8px; transition: border-color .12s, background .12s; }
  .tt-q-opt.correct { border-color: var(--green-600); background: var(--green-50); }
  .tt-q-marker { width: 26px; height: 26px; border-radius: 999px; border: 1.5px solid var(--border); color: var(--text-3); display: inline-flex; align-items: center; justify-content: center; font-family: var(--font-mono); font-weight: 560; font-size: 12px; background: var(--white); cursor: pointer; flex-shrink: 0; transition: all .12s; }
  .tt-q-opt.correct .tt-q-marker { background: var(--green-600); border-color: var(--green-600); color: white; }
  .tt-q-opt input { flex: 1; border: none; outline: none; font-size: 14px; background: transparent; }
  .tt-input-lg { width: 100%; padding: 11px 2px; font-size: 16px; font-weight: 550; letter-spacing: -0.01em; border: none; outline: none; border-bottom: 1.5px solid var(--border); background: transparent; transition: border-color .12s; }
  .tt-input-lg:focus { border-bottom-color: var(--green-600); }
`

export default function TeacherTests() {
  const { user } = useAuth()
  const qc = useQueryClient()
  const [creating, setCreating] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [search, setSearch] = useState('')
  const [vis, setVis] = useState('')
  const [page, setPage] = useState(1)

  const { data: allTests = [], isLoading } = useQuery({
    queryKey: ['my-standalone-tests'],
    queryFn: () => api.get('/tests/mine/').then(r => r.data.results || r.data),
  })

  const q = search.trim().toLowerCase()
  const filtered = allTests
    .filter(t => !vis || (vis === 'public' ? t.is_public : !t.is_public))
    .filter(t => !q || (t.title || '').toLowerCase().includes(q))
  const total = filtered.length
  const tests = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const del = useMutation({
    mutationFn: (id) => api.delete(`/tests/${id}/`),
    onSuccess: () => { qc.invalidateQueries(['my-standalone-tests']); toast.success("O'chirildi") },
    onError: () => toast.error("O'chirib bo'lmadi"),
  })

  const kind = user?.role === 'admin' ? 'admin' : 'teacher'

  return (
    <DashLayout kind={kind}>
      <style>{styles}</style>
      <PageHead
        title="Mustaqil testlar"
        sub={`Kursga bog'lanmagan testlar — "Testlar" bo'limida barcha foydalanuvchilarga ko'rinadi.${user?.role === 'admin' ? " (Admin sifatida barcha testlarni ko'rasiz.)" : ''}`}>
        {!creating && (
          <button className="btn btn-primary" onClick={() => setCreating(true)}>
            <Icon name="plus" size={15} /> Yangi test
          </button>
        )}
      </PageHead>

      {creating && (
        <TestForm onClose={() => setCreating(false)}
          onSaved={(saved) => { setCreating(false); setEditingId(saved.id); qc.invalidateQueries(['my-standalone-tests']) }} />
      )}

      {allTests.length > 0 && (
        <FilterBar search={search} onSearch={v => { setSearch(v); setPage(1) }}
          placeholder="Test qidirish…" count={total}>
          <select className="select" value={vis} onChange={e => { setVis(e.target.value); setPage(1) }}>
            <option value="">Barcha holatlar</option>
            <option value="public">Ommaviy</option>
            <option value="hidden">Yashirin</option>
          </select>
        </FilterBar>
      )}

      {isLoading ? (
        <div className="loading-state"><span className="spinner" />Yuklanmoqda…</div>
      ) : allTests.length === 0 && !creating ? (
        <div className="card" style={{ padding: 0 }}>
          <EmptyState icon="fileText" title="Hozircha testlar yo'q"
            sub={`Birinchi mustaqil testingizni yarating — o'quvchilar uni "Testlar" bo'limida topadi.`}
            action={
              <button className="btn btn-primary btn-sm" onClick={() => setCreating(true)}>
                <Icon name="plus" size={13} /> Test yaratish
              </button>
            } />
        </div>
      ) : tests.length === 0 && !creating ? (
        <div className="card" style={{ padding: 0 }}>
          <EmptyState icon="search" title="Hech narsa topilmadi" sub="Qidiruv so'zini o'zgartirib ko'ring." />
        </div>
      ) : (
        <>
          {tests.map(t => (
            <TestRow key={t.id} test={t}
              open={editingId === t.id}
              onToggle={() => setEditingId(editingId === t.id ? null : t.id)}
              onDelete={() => { if (confirm(`"${t.title}" testini o'chirishni tasdiqlaysizmi?`)) del.mutate(t.id) }}
            />
          ))}
          <Pagination page={page} pageSize={PAGE_SIZE} total={total} onChange={setPage} />
        </>
      )}
    </DashLayout>
  )
}

function TestRow({ test, open, onToggle, onDelete }) {
  const qc = useQueryClient()
  const [editingMeta, setEditingMeta] = useState(false)

  return (
    <div className="tt-card">
      <div className="tt-head" onClick={onToggle}>
        <div className="tt-ic"><Icon name="fileText" size={19} /></div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 620, letterSpacing: '-0.015em', fontSize: 14.5 }}>{test.title}</div>
          <div className="tt-meta mt-1">
            {test.question_count} SAVOL · O'TISH {test.pass_percent}%
            {test.time_limit_minutes ? ` · ${test.time_limit_minutes} DAQ` : ''}
            {test.attempt_count > 0 ? ` · ${test.attempt_count} URINISH` : ''}
          </div>
        </div>
        <span className={`badge badge-${test.is_public ? 'green' : 'gray'}`}>
          {test.is_public ? 'Ommaviy' : 'Yashirin'}
        </span>
        <button className="icon-btn" onClick={e => { e.stopPropagation(); setEditingMeta(true); if (!open) onToggle() }} title="Sozlamalar">
          <Icon name="settings" size={15} />
        </button>
        <button className="icon-btn" onClick={e => { e.stopPropagation(); onDelete() }} title="O'chirish">
          <Icon name="trash" size={15} />
        </button>
        <Icon name={open ? 'chevU' : 'chevD'} size={16} style={{ color: 'var(--text-3)' }} />
      </div>

      {open && (
        <div className="tt-body">
          {editingMeta ? (
            <TestForm test={test} onClose={() => setEditingMeta(false)}
              onSaved={() => { setEditingMeta(false); qc.invalidateQueries(['my-standalone-tests']) }} />
          ) : (
            <QuestionManager testId={test.id} />
          )}
        </div>
      )}
    </div>
  )
}

function TestForm({ test, onClose, onSaved }) {
  const [title, setTitle] = useState(test?.title || '')
  const [description, setDescription] = useState(test?.description || '')
  const [category, setCategory] = useState(test?.category?.id || '')
  const [pass, setPass] = useState(test?.pass_percent ?? 60)
  const [time, setTime] = useState(test?.time_limit_minutes || '')
  const [isPublic, setIsPublic] = useState(test?.is_public ?? false)
  const [busy, setBusy] = useState(false)

  const { data: cats = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.get('/categories/').then(r => r.data.results || r.data),
  })

  async function save() {
    setBusy(true)
    try {
      const payload = {
        title: title.trim(), description,
        category: category || null,
        pass_percent: pass, time_limit_minutes: time || null,
        is_public: isPublic,
      }
      let saved
      if (test?.id) {
        const { data } = await api.patch(`/tests/${test.id}/`, payload); saved = data
      } else {
        const { data } = await api.post('/tests/', payload); saved = data
      }
      toast.success('Saqlandi')
      onSaved(saved)
    } catch { toast.error('Saqlashda xatolik') }
    finally { setBusy(false) }
  }

  return (
    <div className="card" style={{ padding: 24, marginBottom: 16, border: '1.5px solid var(--green-300)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <strong style={{ fontFamily: 'var(--font-display)', fontSize: 16 }}>
          {test ? 'Test sozlamalari' : 'Yangi test'}
        </strong>
        <button className="icon-btn" onClick={onClose}><Icon name="x" size={16} /></button>
      </div>
      <input className="tt-input-lg" autoFocus value={title} onChange={e => setTitle(e.target.value)}
        placeholder="Test nomi (masalan, Dunyo poytaxtlari)" />
      <div className="field" style={{ marginTop: 16 }}>
        <label className="label">Tavsif</label>
        <textarea className="textarea" rows={2} value={description} onChange={e => setDescription(e.target.value)}
          placeholder="Test nima haqida — o'quvchilar kartochkada ko'radi" />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        <div className="field">
          <label className="label">Kategoriya</label>
          <select className="select" value={category} onChange={e => setCategory(e.target.value)}>
            <option value="">— Tanlash —</option>
            {cats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div className="field">
          <label className="label">O'tish bali (%)</label>
          <input className="input" type="number" min={0} max={100} value={pass} onChange={e => setPass(e.target.value)} />
        </div>
        <div className="field">
          <label className="label">Vaqt (daq, ixtiyoriy)</label>
          <input className="input" type="number" min={1} value={time} onChange={e => setTime(e.target.value)} placeholder="Cheksiz" />
        </div>
      </div>
      <label className="checkbox" style={{ marginBottom: 16 }}>
        <input type="checkbox" checked={isPublic} onChange={e => setIsPublic(e.target.checked)} />
        Ommaviy — "Testlar" bo'limida hammaga ko'rinsin
      </label>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <button className="btn btn-secondary btn-sm" onClick={onClose}>Bekor</button>
        <button className="btn btn-primary btn-sm" disabled={busy || !title.trim()} onClick={save}>
          {busy ? 'Saqlanmoqda…' : 'Saqlash'}
        </button>
      </div>
    </div>
  )
}

function QuestionManager({ testId }) {
  const [editing, setEditing] = useState(null) // questionId | 'new' | null

  const { data: details, refetch } = useQuery({
    queryKey: ['test-questions', testId],
    queryFn: () => api.get(`/tests/${testId}/detail/`).then(r => r.data),
  })

  async function delQ(qid) {
    if (!confirm("Savolni o'chirish?")) return
    await api.delete(`/questions/${qid}/`)
    refetch()
    toast.success("O'chirildi")
  }

  const questions = details?.questions || []

  return (
    <div>
      {questions.length === 0 && editing !== 'new' && (
        <div className="text-sm text-muted" style={{ textAlign: 'center', padding: '12px 0' }}>
          Hali savollar yo'q — birinchi savolni qo'shing.
        </div>
      )}

      {questions.map((q, i) => (
        editing === q.id ? (
          <QuestionForm key={q.id} testId={testId} question={q}
            onClose={() => setEditing(null)}
            onSaved={() => { setEditing(null); refetch() }} />
        ) : (
          <div key={q.id} className="tt-q">
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <span style={{ width: 24, height: 24, borderRadius: 999, background: 'var(--green-50)', color: 'var(--green-600)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>{i + 1}</span>
              <div style={{ flex: 1, fontSize: 14, fontWeight: 500 }}>{q.text}</div>
              <button className="icon-btn" onClick={() => setEditing(q.id)}><Icon name="edit" size={13} /></button>
              <button className="icon-btn" onClick={() => delQ(q.id)}><Icon name="trash" size={13} /></button>
            </div>
            <div className="text-xs text-muted mt-2" style={{ paddingLeft: 34, display: 'flex', alignItems: 'center', gap: 10 }}>
              <span className="badge badge-gray" style={{ fontSize: 10 }}>
                {(Q_TYPES.find(t => t.id === (q.question_type || 'single')) || Q_TYPES[0]).label}
              </span>
              {q.question_type === 'text'
                ? `${q.options.length} ta qabul qilinadigan javob`
                : `${q.options.length} variant`}
            </div>
          </div>
        )
      ))}

      {editing === 'new' && (
        <QuestionForm testId={testId} question={null}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); refetch() }} />
      )}

      {editing !== 'new' && (
        <button className="btn btn-secondary btn-sm" onClick={() => setEditing('new')}>
          <Icon name="plus" size={14} /> Savol qo'shish
        </button>
      )}
    </div>
  )
}

const Q_TYPES = [
  { id: 'single', label: "Bitta to'g'ri javob", icon: 'checkC' },
  { id: 'multiple', label: "Bir nechta to'g'ri", icon: 'list' },
  { id: 'true_false', label: "To'g'ri / Noto'g'ri", icon: 'shield' },
  { id: 'text', label: 'Yozma javob', icon: 'edit' },
]

const defaultOptions = {
  single: () => [0, 1, 2, 3].map(i => ({ text: '', is_correct: i === 0, order: i })),
  multiple: () => [0, 1, 2, 3].map(i => ({ text: '', is_correct: i === 0, order: i })),
  true_false: () => [
    { text: "To'g'ri", is_correct: true, order: 0 },
    { text: "Noto'g'ri", is_correct: false, order: 1 },
  ],
  text: () => [{ text: '', is_correct: true, order: 0 }],
}

function QuestionForm({ testId, question, onClose, onSaved }) {
  const [text, setText] = useState(question?.text || '')
  const [qtype, setQtype] = useState(question?.question_type || 'single')
  const [options, setOptions] = useState(() => {
    if (question?.options?.length) {
      const opts = question.options.map((o, i) => ({ text: o.text, is_correct: !!o.is_correct, order: i }))
      if (!opts.some(o => o.is_correct)) opts[0].is_correct = true
      return opts
    }
    return defaultOptions[question?.question_type || 'single']()
  })
  const [busy, setBusy] = useState(false)

  function switchType(t) {
    if (t === qtype) return
    setQtype(t)
    // Keep typed variants when staying in the choice family, otherwise reset.
    if ((t === 'single' || t === 'multiple') && (qtype === 'single' || qtype === 'multiple')) {
      if (t === 'single') {
        const firstCorrect = options.findIndex(o => o.is_correct)
        setOptions(options.map((o, i) => ({ ...o, is_correct: i === Math.max(firstCorrect, 0) })))
      }
      return
    }
    setOptions(defaultOptions[t]())
  }

  const setOpt = (i, patch) => setOptions(options.map((o, idx) => idx === i ? { ...o, ...patch } : o))
  const mark = (i) => {
    if (qtype === 'multiple') setOpt(i, { is_correct: !options[i].is_correct })
    else setOptions(options.map((o, idx) => ({ ...o, is_correct: idx === i })))
  }
  const addOpt = () => setOptions([...options, { text: '', is_correct: qtype === 'text', order: options.length }])
  const delOpt = (i) => {
    const next = options.filter((_, idx) => idx !== i).map((o, idx) => ({ ...o, order: idx }))
    if (qtype !== 'text' && !next.some(o => o.is_correct) && next.length) next[0].is_correct = true
    setOptions(next)
  }

  const maxOpts = qtype === 'text' ? 6 : 8
  const minOpts = qtype === 'text' ? 1 : 2
  const canAdd = (qtype === 'single' || qtype === 'multiple' || qtype === 'text') && options.length < maxOpts

  const valid = text.trim()
    && options.every(o => o.text.trim())
    && options.some(o => o.is_correct)
    && options.length >= minOpts

  async function save() {
    setBusy(true)
    try {
      const payload = { text, question_type: qtype, order: question?.order || 0, options }
      if (question?.id) await api.patch(`/questions/${question.id}/`, payload)
      else await api.post(`/tests/${testId}/questions/`, payload)
      toast.success('Saqlandi')
      onSaved()
    } catch { toast.error('Xatolik') }
    finally { setBusy(false) }
  }

  return (
    <div className="tt-q" style={{ border: '1.5px solid var(--green-600)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <span className="badge badge-green">SAVOL</span>
        <button className="icon-btn" onClick={onClose}><Icon name="x" size={15} /></button>
      </div>
      <textarea className="tt-input-lg" rows={2} autoFocus value={text} onChange={e => setText(e.target.value)}
        placeholder="Savol matni" style={{ resize: 'vertical', minHeight: 46 }} />

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 14 }}>
        {Q_TYPES.map(t => (
          <button key={t.id} type="button" onClick={() => switchType(t.id)}
            className={`btn btn-sm ${qtype === t.id ? 'btn-primary' : 'btn-secondary'}`}>
            <Icon name={t.icon} size={13} /> {t.label}
          </button>
        ))}
      </div>

      {qtype === 'multiple' && (
        <div className="text-xs text-muted" style={{ marginTop: 10 }}>
          Bir nechta to'g'ri javobni belgilang — o'quvchi aynan shularning hammasini tanlasagina javob to'g'ri hisoblanadi.
        </div>
      )}
      {qtype === 'text' && (
        <div className="text-xs text-muted" style={{ marginTop: 10 }}>
          Qabul qilinadigan javob(lar)ni kiriting. Katta-kichik harf farqi hisobga olinmaydi.
        </div>
      )}

      <div style={{ marginTop: 14 }}>
        {options.map((o, i) => (
          <div key={i} className={`tt-q-opt ${o.is_correct ? 'correct' : ''}`}>
            {qtype === 'text' ? (
              <span className="tt-q-marker" style={{ background: 'var(--green-600)', borderColor: 'var(--green-600)', color: 'white', cursor: 'default' }}>
                <Icon name="check" size={13} />
              </span>
            ) : (
              <button type="button" onClick={() => mark(i)} className="tt-q-marker"
                style={qtype === 'multiple' ? { borderRadius: 8 } : {}}
                title={qtype === 'multiple' ? "To'g'ri javoblardan biri deb belgilash" : "To'g'ri javob deb belgilash"}>
                {o.is_correct && qtype === 'multiple' ? <Icon name="check" size={13} /> : String.fromCharCode(65 + i)}
              </button>
            )}
            <input value={o.text} onChange={e => setOpt(i, { text: e.target.value })}
              readOnly={qtype === 'true_false'}
              placeholder={qtype === 'text' ? `Qabul qilinadigan javob ${i + 1}` : `Variant ${String.fromCharCode(65 + i)}`} />
            {o.is_correct && <span className="badge badge-green" style={{ fontSize: 10 }}>To'g'ri</span>}
            {qtype !== 'true_false' && options.length > minOpts && (
              <button type="button" className="icon-btn" onClick={() => delOpt(i)} title="O'chirish">
                <Icon name="x" size={13} />
              </button>
            )}
          </div>
        ))}
        {canAdd && (
          <button type="button" className="btn btn-ghost btn-sm" onClick={addOpt}>
            <Icon name="plus" size={13} /> {qtype === 'text' ? "Muqobil javob qo'shish" : "Variant qo'shish"}
          </button>
        )}
      </div>

      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 12 }}>
        <button className="btn btn-secondary btn-sm" onClick={onClose}>Bekor</button>
        <button className="btn btn-primary btn-sm" disabled={busy || !valid} onClick={save}>
          {busy ? 'Saqlanmoqda…' : 'Saqlash'}
        </button>
      </div>
    </div>
  )
}
