import { useMemo } from 'react'
import { DAYS, PERIODS_BY_DAY } from '../lib/parseTimetable'
import { buildSchedulePreview, CONSECUTIVE_WARN } from '../lib/schedulePreview'

// 교체/대강 후보 선생님의 주간 시간표를, 이 교체가 이뤄진 뒤의 모습으로 보여준다.
// 연속으로 수업이 몰리는지 확인하면서 후보를 고를 수 있게 하는 용도.
export default function CandidateSchedulePreview({ parsed, mode, origin, target }) {
  const teacher = parsed.teachers.find((t) => t.name === target.teacher)

  const preview = useMemo(() => {
    if (!teacher) return null
    return buildSchedulePreview(
      teacher,
      {
        day: origin.day,
        period: origin.period,
        subject: origin.cell.subject,
        className: origin.cell.className,
      },
      mode === 'swap' ? { day: target.day, period: target.period } : null
    )
  }, [teacher, origin, mode, target])

  if (!teacher || !preview) return null

  const maxPeriods = Math.max(...Object.values(PERIODS_BY_DAY))
  const { grid, run } = preview

  return (
    <div className="right-col preview-card sticky-preview">
      <h3>
        {target.teacher} 선생님 시간표{' '}
        <span className="preview-sub">({mode === 'swap' ? '교체' : '대강'} 후 모습)</span>
      </h3>
      <div className="grid-wrap">
        <table className="class-grid preview-grid">
          <thead>
            <tr>
              <th></th>
              {DAYS.map((d) => (
                <th key={d}>{d}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: maxPeriods }).map((_, pIdx) => (
              <tr key={pIdx}>
                <th>{pIdx + 1}</th>
                {DAYS.map((day) => {
                  if (pIdx >= PERIODS_BY_DAY[day]) return <td key={day} className="empty-slot" />
                  const cell = grid[day][pIdx]
                  const cls = ['cell', cell ? '' : 'blank', cell?.kind || ''].filter(Boolean).join(' ')
                  return (
                    <td key={day} className={cls}>
                      {cell ? (
                        <>
                          <div className="subj">{cell.subject}</div>
                          <div className="teacher">{cell.className}</div>
                          {cell.kind === 'incoming' && <div className="preview-badge">새로 맡음</div>}
                          {cell.kind === 'outgoing' && <div className="preview-badge">빠짐</div>}
                        </>
                      ) : (
                        <div className="free-label">공강</div>
                      )}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {run && (
        <p className={run.warn ? 'run-note warn' : 'run-note'}>
          {run.warn ? '⚠ ' : '✓ '}
          {run.day}요일 {run.start === run.end ? `${run.start}교시` : `${run.start}~${run.end}교시`} 연속 수업 {run.length}시간
          {run.warn ? ` (연속 ${CONSECUTIVE_WARN}시간 이상)` : ''}
        </p>
      )}
      <div className="legend">
        <span className="legend-item">
          <i className="swatch incoming" /> 새로 맡는 수업
        </span>
        {mode === 'swap' && (
          <span className="legend-item">
            <i className="swatch outgoing" /> 빠지는 수업
          </span>
        )}
      </div>
    </div>
  )
}
