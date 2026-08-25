import { useEffect, useMemo, useState } from 'react'
import { DAYS, PERIODS_BY_DAY, sortedClassNames } from '../lib/parseTimetable'
import { buildEffectiveClassWeek } from '../lib/classWeekView'
import { fetchClassSwapsForWeek } from '../lib/swapLog'
import { weekRangeContaining, shiftWeek, todayInputDate, formatKoreanDate } from '../lib/dateUtils'

export default function ClassWeeklyView({ classMap }) {
  const classNames = useMemo(() => sortedClassNames(classMap), [classMap])
  const [selectedClass, setSelectedClass] = useState(classNames[0] || '')
  const [anchor, setAnchor] = useState(todayInputDate())
  const [swaps, setSwaps] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!selectedClass && classNames.length > 0) setSelectedClass(classNames[0])
  }, [classNames, selectedClass])

  const { start, end } = weekRangeContaining(anchor)

  useEffect(() => {
    if (!selectedClass) return
    let cancelled = false
    setLoading(true)
    setError('')
    fetchClassSwapsForWeek(selectedClass, start, end).then(({ data, error: err }) => {
      if (cancelled) return
      if (err) setError('불러오지 못했습니다: ' + err.message)
      else setSwaps(data)
      setLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [selectedClass, start, end])

  const grid = useMemo(() => {
    if (!selectedClass || !classMap[selectedClass]) return null
    return buildEffectiveClassWeek(classMap[selectedClass], DAYS, swaps)
  }, [classMap, selectedClass, swaps])

  const maxPeriods = Math.max(...Object.values(PERIODS_BY_DAY))

  return (
    <div className="weekly-log">
      <div className="week-nav">
        <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)}>
          {classNames.map((cn) => (
            <option key={cn} value={cn}>
              {cn}
            </option>
          ))}
        </select>
        <button onClick={() => setAnchor(shiftWeek(anchor, -1))}>← 이전 주</button>
        <h2>
          {formatKoreanDate(start)} ~ {formatKoreanDate(end)}
        </h2>
        <button onClick={() => setAnchor(shiftWeek(anchor, 1))}>다음 주 →</button>
        <button className="link-btn" onClick={() => setAnchor(todayInputDate())}>
          이번 주로
        </button>
      </div>

      {loading ? (
        <p className="hint">불러오는 중...</p>
      ) : error ? (
        <p className="error">{error}</p>
      ) : (
        grid && (
          <div className="grid-wrap">
            <table className="class-grid">
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
                      const cls = ['cell', cell ? '' : 'blank', cell?.changed ? 'changed' : '']
                        .filter(Boolean)
                        .join(' ')
                      return (
                        <td
                          key={day}
                          className={cls}
                          title={
                            cell?.changed
                              ? `원래: ${cell.originalSubject || ''}/${cell.originalTeacher || ''}`
                              : ''
                          }
                        >
                          {cell ? (
                            <>
                              <div className="subj">{cell.subject}</div>
                              <div className="teacher">{cell.teacher}</div>
                              {cell.changed && <div className="changed-badge">변경</div>}
                            </>
                          ) : (
                            ''
                          )}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="legend">
              <span className="legend-item">
                <i className="swatch changed" /> 이번 주 교체/대강으로 바뀐 수업 (마우스 올리면 원래 수업 표시)
              </span>
            </div>
          </div>
        )
      )}
    </div>
  )
}
