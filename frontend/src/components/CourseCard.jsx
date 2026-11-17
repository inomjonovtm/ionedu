import { Link } from 'react-router-dom'
import Icon from './Icon'
import { absUrl } from '../api/client'

const LEVELS = { beginner: "Boshlang'ich", intermediate: "O'rta", advanced: 'Murakkab' }

const css = `
  .cc {
    display: flex; flex-direction: column; height: 100%; min-width: 0;
    background: var(--white); border: 1.5px solid var(--border); border-radius: var(--r-card);
    padding: 10px; color: var(--text);
    transition: border-color .16s ease, box-shadow .16s ease, transform .16s ease;
  }
  .cc:hover { border-color: var(--line); box-shadow: var(--shadow-hover); transform: translate(-3px, -3px); }

  .cc .cc-thumb {
    position: relative; overflow: hidden; flex-shrink: 0;
    aspect-ratio: 16 / 9; border-radius: 15px; font-size: 60px;
    display: flex; align-items: center; justify-content: center;
  }
  .cc-thumb.photo { background: var(--bg-soft); }
  .cc-thumb img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
  .cc-emoji { display: block; line-height: 1; transform: rotate(-6deg); transition: transform .25s cubic-bezier(.21,.7,.25,1); }
  .cc:hover .cc-emoji { transform: rotate(5deg) scale(1.1); }
  .cc .cc-level, .cc .cc-count {
    position: absolute; z-index: 2;
    font-family: var(--font-mono); font-size: 10px; font-weight: 600; letter-spacing: .08em; text-transform: uppercase;
    line-height: 1; padding: 6px 9px; white-space: nowrap;
  }
  .cc .cc-level { top: 10px; left: 10px; background: var(--white); color: var(--text); border: 1.5px solid var(--line); border-radius: 999px; }
  .cc .cc-count { right: 10px; bottom: 10px; background: var(--sun); color: #14213D; border: 1.5px solid #14213D; border-radius: 9px; transform: rotate(-4deg); }

  .cc-body { display: flex; flex-direction: column; flex: 1; min-width: 0; padding: 14px 8px 4px; }
  .cc-cat {
    display: inline-flex; align-items: center; gap: 7px; margin-bottom: 8px;
    font-family: var(--font-mono); font-size: 10.5px; font-weight: 600; letter-spacing: .1em; text-transform: uppercase; color: var(--text-3);
  }
  .cc-cat::before { content: ''; width: 8px; height: 8px; border-radius: 999px 999px 999px 0; transform: rotate(-45deg); background: var(--coral); flex-shrink: 0; }
  .cc-title {
    font-family: var(--font-display); font-weight: 700; font-size: 19px; line-height: 1.2; letter-spacing: -0.03em;
    display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
  }
  .cc-teacher { display: flex; align-items: center; gap: 8px; margin-top: 10px; font-size: 13px; font-weight: 600; color: var(--text-3); min-width: 0; }
  .cc-teacher .avatar { width: 24px; height: 24px; font-size: 10px; }
  .cc-teacher span:last-child { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

  /* progress as a travelled route with a pin */
  .cc-route { margin-top: 14px; }
  .cc-route-line { position: relative; height: 16px; }
  .cc-route-line::before { content: ''; position: absolute; left: 0; right: 0; top: 7px; border-top: 2px dashed var(--border); }
  .cc-route-line i { position: absolute; left: 0; top: 6px; height: 4px; border-radius: 999px; background: var(--green-600); }
  .cc-route-line b {
    position: absolute; top: 1px; width: 14px; height: 14px; margin-left: -7px;
    border-radius: 999px; background: var(--sun); border: 2px solid var(--line);
  }
  .cc-route-txt { display: flex; justify-content: space-between; gap: 8px; margin-top: 4px; font-size: 12px; font-weight: 600; color: var(--text-3); }
  .cc-route-txt strong { color: var(--green-700); font-family: var(--font-mono); }

  .cc-foot {
    display: flex; align-items: center; gap: 14px; margin-top: auto; padding-top: 12px;
    font-size: 12.5px; font-weight: 700; color: var(--text-3);
  }
  .cc-foot-wrap { margin-top: auto; padding-top: 14px; }
  .cc-foot { border-top: 1.5px dashed var(--border); }
  .cc-foot > span { display: inline-flex; align-items: center; gap: 5px; white-space: nowrap; }
  .cc-foot .star { color: var(--text); }
  .cc-foot .star svg { color: #F5A300; }
  .cc-foot .star em { font-style: normal; font-weight: 500; color: var(--text-4); }
  .cc-go {
    margin-left: auto; width: 32px; height: 32px; border-radius: 11px; flex-shrink: 0;
    display: inline-flex; align-items: center; justify-content: center;
    border: 1.5px solid var(--border); color: var(--text-2);
    transition: background .16s ease, border-color .16s ease, color .16s ease;
  }
  .cc:hover .cc-go { background: var(--sun); border-color: #14213D; color: #14213D; }
`

export default function CourseCard({ course, showProgress }) {
  const pct = Math.max(0, Math.min(100, Math.round(course.progress || 0)))
  const enrolled = showProgress && course.is_enrolled
  return (
    <Link to={`/courses/${course.slug}`} className="cc">
      <style>{css}</style>
      {course.thumbnail ? (
        <div className="cc-thumb photo">
          <img src={absUrl(course.thumbnail)} alt={course.title} loading="lazy" />
          {LEVELS[course.level] && <span className="cc-level">{LEVELS[course.level]}</span>}
          <span className="cc-count">{course.lessons_count} dars</span>
        </div>
      ) : (
        <div className={`thumb thumb-${course.thumb_color || 'blue'} cc-thumb`}>
          <span className="cc-emoji">{course.thumb_emoji || '🌍'}</span>
          {LEVELS[course.level] && <span className="cc-level">{LEVELS[course.level]}</span>}
          <span className="cc-count">{course.lessons_count} dars</span>
        </div>
      )}
      <div className="cc-body">
        {course.category && <span className="cc-cat">{course.category.name}</span>}
        <div className="cc-title">{course.title}</div>
        <div className="cc-teacher">
          <span className="avatar">{course.teacher?.initials || '??'}</span>
          <span>{course.teacher?.display_name || '—'}</span>
        </div>
        {enrolled && (
          <div className="cc-route">
            <div className="cc-route-line">
              <i style={{ width: `${pct}%` }} />
              <b style={{ left: `clamp(7px, ${pct}%, calc(100% - 7px))` }} />
            </div>
            <div className="cc-route-txt">
              <span>{pct >= 100 ? 'Manzilga yetdingiz' : "Yo'lda davom eting"}</span>
              <strong>{pct}%</strong>
            </div>
          </div>
        )}
        <div className="cc-foot-wrap">
          <div className="cc-foot">
            <span className="star"><Icon name="starF" size={14} /> {course.rating_avg || 0} <em>({course.rating_count || 0})</em></span>
            {course.students_count > 0 && <span><Icon name="users" size={14} /> {course.students_count}</span>}
            <span className="cc-go"><Icon name="arrowR" size={15} /></span>
          </div>
        </div>
      </div>
    </Link>
  )
}
