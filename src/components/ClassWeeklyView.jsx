import { useEffect, useMemo, useState } from 'react'
import { PERIODS_BY_DAY, sortedClassNames } from '../lib/parseTimetable'
import { buildEffectiveClassWeek } from '../lib/classWeekView'
import { fetchClassSwapsForWeek } from '../lib/swapLog'
import { weekRangeContaining, shiftWeek, todayInputDate, formatKoreanDate } from '../lib/dateUtils'

// 열 머리글: 요일 + 날짜, 요일 변경이 있으면 어떤 요일 시간표인지 표시
export function ColumnHeader({ col }) {
  return (
    <th className={col.overridden ? 'col-overridden' : ''}>
      {col.day}
      <span className="col-date">{col.date.slice(5).replace('-', '/')}</span>
      {col.overridden && <span className="col-override">{col.templateDay}요일 시간표</span>}
    </th>
  )
}

// 학급별 주간 시간표. 최대 3주를 A4 한 장에 모아서 인쇄할 수 있다.
export default function ClassWeeklyView({ classMap, overrides }) {
  const classNames = useMemo(() => sortedClassNames(classMap), [classMap])
  const [selectedClass, setSelectedClass] = useState(classNames[0] || '')
  const [anchor, setAnchor] = useState(todayInputDate())
  const [weeks, setWeeks] = useState(1)
  const [swaps, setSwaps] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!selectedClass && classNames.length > 0) setSelectedClass(classNames[0])
  }, [classNames, selectedClass])

  const ranges = useMemo(
    () => Array.from({ length: weeks }, (_, i) => weekRangeContaining(shiftWeek(anchor, i))),
    [anchor, weeks]
  )
  const rangeStart = ranges[0].start
  const rangeEnd = ranges[ranges.length - 1].end

  useEffect(() => {
    if (!selectedClass) return
    let cancelled = false
    setLoading(true)
    setError('')
    fetchClassSwapsForWeek(selectedClass, rangeStart, rangeEnd).then(({ data, error: err }) => {
      if (cancelled) return
      if (err) setError('불러오지 못했습니다: ' + err.message)
      else setSwaps(data)
      setLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [selectedClass, rangeStart, rangeEnd])

  const weekGrids = useMemo(() => {
    if (!selectedClass || !classMap[selectedClass]) return []
    return ranges.map((r) => ({
      ...r,
      ...buildEffectiveClassWeek(classMap[selectedClass], r.start, overrides, swaps),
    }))
  }, [classMap, selectedClass, ranges, overrides, swaps])

  const maxPeriods = Math.max(...Object.values(PERIODS_BY_DAY))
  const hasWeeks = weekGrids.length > 0

  return (
    <div className="weekly-log">
      <div className="week-nav no-print">
        <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)}>
          {classNames.map((cn) => (
            <option key={cn} value={cn}>
              {cn}
            </option>
          ))}
        </select>
        <button onClick={() => setAnchor(shiftWeek(anchor, -1))}>← 이전 주</button>
        <h2>
          {formatKoreanDate(rangeStart)} ~ {formatKoreanDate(rangeEnd)}
        </h2>
        <button onClick={() => setAnchor(shiftWeek(anchor, 1))}>다음 주 →</button>
        <label className="inline-label">
          표시
          <select value={weeks} onChange={(e) => setWeeks(Number(e.target.value))}>
            <option value={1}>1주</option>
            <option value={2}>2주</option>
            <option value={3}>3주</option>
          </select>
        </label>
        <button className="link-btn" onClick={() => setAnchor(todayInputDate())}>
          이번 주로
        </button>
        {hasWeeks && !loading && (
          <button className="primary" onClick={() => window.print()}>
            🖨 인쇄 (게시용{weeks > 1 ? `, ${weeks}주 A4 한 장` : ''})
          </button>
        )}
      </div>

      {loading ? (
        <p className="hint">불러오는 중...</p>
      ) : error ? (
        <p className="error">{error}</p>
      ) : (
        hasWeeks && (
          <div className={`print-area weeks-${weeks}`}>
            {weekGrids.map((w) => (
              <section key={w.start} className="teacher-week-block">
                <h2 className="print-title">
                  {selectedClass}반 시간표 ({formatKoreanDate(w.start)} ~ {formatKoreanDate(w.end)})
                </h2>
                <div className="grid-wrap">
                  <table className="class-grid">
                    <thead>
                      <tr>
                        <th></th>
                        {w.columns.map((col) => (
                          <ColumnHeader key={col.day} col={col} />
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {Array.from({ length: maxPeriods }).map((_, pIdx) => (
                        <tr key={pIdx}>
                          <th>{pIdx + 1}</th>
                          {w.columns.map((col) => {
                            if (pIdx >= col.periods) return <td key={col.day} className="empty-slot" />
                            const cell = w.grid[col.day][pIdx]
                            const cls = ['cell', cell ? '' : 'blank', cell?.changed ? 'changed' : '']
                              .filter(Boolean)
                              .join(' ')
                            return (
                              <td key={col.day} className={cls}>
                                {cell ? (
                                  <>
                                    <div className="subj">{cell.subject}</div>
                                    <div className="teacher">{cell.teacher}</div>
                                    {cell.changed && (
                                      <>
                                        <div className="changed-badge">변경</div>
                                        <div className="changed-orig">
                                          (원래 {cell.originalSubject}/{cell.originalTeacher})
                                        </div>
                                      </>
                                    )}
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
                </div>
              </section>
            ))}
          </div>
        )
      )}
      {hasWeeks && (
        <div className="legend no-print">
          <span className="legend-item">
            <i className="swatch changed" /> 교체/대강으로 바뀐 수업
          </span>
        </div>
      )}
    </div>
  )
}
