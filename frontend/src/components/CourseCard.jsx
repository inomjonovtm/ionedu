import { Link } from 'react-router-dom'
import Icon from './Icon'
import { absUrl } from '../api/client'

export default function CourseCard({ course, showProgress }) {
  const thumbCls = `thumb thumb-${course.thumb_color || 'blue'}`
  return (
    <Link to={`/courses/${course.slug}`} className="card card-hover course-card">
      {course.thumbnail ? (
        <div style={{ aspectRatio: '16/9', borderRadius: 12, overflow: 'hidden' }}>
          <img src={absUrl(course.thumbnail)} alt={course.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
      ) : (
        <div className={thumbCls}>{course.thumb_emoji || '🌍'}</div>
      )}
      <div className="course-card-body">
        {course.category && (
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span className={`badge badge-${course.thumb_color === 'blue' ? 'blue' : 'green'}`}>{course.category.name}</span>
          </div>
        )}
        <div className="course-card-title">{course.title}</div>
        <div className="course-card-meta">
          <span className="avatar" style={{ width: 22, height: 22, fontSize: 10 }}>{course.teacher?.initials || '??'}</span>
          {course.teacher?.display_name || '—'}
        </div>
        {showProgress && course.is_enrolled && (
          <>
            <div className="progress mt-2"><div className="progress-fill" style={{ width: `${course.progress}%` }} /></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-3)', marginTop: 6 }}>
              <span>{course.lessons_count} dars</span>
              <span><strong style={{ color: 'var(--text)' }}>{Math.round(course.progress)}%</strong></span>
            </div>
          </>
        )}
        <div className="course-card-foot">
          <span className="rating"><Icon name="starF" size={14} /> {course.rating_avg || 0} ({course.rating_count || 0})</span>
          <span>{course.lessons_count} dars</span>
        </div>
      </div>
    </Link>
  )
}
