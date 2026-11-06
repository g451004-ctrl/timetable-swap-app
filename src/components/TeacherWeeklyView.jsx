import { useEffect, useMemo, useState } from 'react'
import { DAYS, PERIODS_BY_DAY } from '../lib/parseTimetable'
import { sortedTeacherNames } from '../lib/swapCandidates'
import { buildEffectiveTeacherWeek } from '../lib/teacherWeekView'
import { fetchSwapsInRange } from '../lib/swapLog'
import { weekRangeContaining, shiftWeek, todayInputDate, formatKoreanDate } from '../lib/dateUtils'

// 선생님별 주간 시간표 (교체/대강 반영). 최대 3주를 A4 한 장에 모아서 인쇄할 수 있다.
export default function TeacherWeeklyView({ parsed, preset }) {
  const teacherNames = useMemo(() => sortedTeacherNames(parsed), [parsed])
  const [teacher, setTeacher] = useState(preset?.teacher || teacherNames[0] || '')
  const [anchor, setAnchor] = useState(preset?.anchor || todayInputDate())
  const [weeks, setWeeks] = useState(preset?.weeks || 1)
  const [swaps, setSwaps] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const ranges = useMemo(
    () => Array.from({ length: weeks }, (_, i) => weekRangeContaining(shiftWeek(anchor, i))),
    [anchor, weeks]
  )
  const rangeStart = ranges[0].start
  const rangeEnd = ranges[ranges.length - 1].end

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError('')
    fetchSwapsInRange(rangeStart, rangeEnd).then(({ data, error: err }) => {
      if (cancelled) return
      if (err) setError('불러오지 못했습니다: ' + err.message)
      else setSwaps(data)
      setLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [rangeStart, rangeEnd])

  const teacherObj = parsed.teachers.find((t) => t.name === teacher)

  const weekGrids = useMemo(() => {
    if (!teacherObj) return []
    return ranges.map((r) => ({ ...r, ...buildEffectiveTeacherWeek(teacherObj, swaps, r.start, r.end) }))
  }, [teacherObj, swaps, ranges])

  const maxPeriods = Math.max(...Object.values(PERIODS_BY_DAY))
  const totalChanged = weekGrids.reduce((sum, w) => sum + w.changed, 0)

  return (
    <div className="weekly-log">
      <div className="week-nav no-print">
        <select value={teacher} onChange={(e) => setTeacher(e.target.value)}>
          {teacherNames.map((name) => (
            <option key={name} value={name}>
              {name}
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
        {teacherObj && !loading && (
          <button className="primary" onClick={() => window.print()}>
            🖨 인쇄 (A4 한 장)
          </button>
        )}
      </div>

      {loading ? (
        <p className="hint">불러오는 중...</p>
      ) : error ? (
        <p className="error">{error}</p>
      ) : (
        teacherObj && (
          <>
            <p className="hint no-print">
              {totalChanged === 0
                ? '이 기간에 등록된 교체/대강이 없어 기본 시간표 그대로입니다.'
                : `이 기간에 이 선생님 시간표가 바뀐 칸이 ${totalChanged}개 있습니다.`}
            </p>
            <div className={`print-area weeks-${weeks}`}>
              {weekGrids.map((w) => (
                <section key={w.start} className="teacher-week-block">
                  <h2 className="print-title">
                    {teacher} 선생님 시간표 ({formatKoreanDate(w.start)} ~ {formatKoreanDate(w.end)})
                  </h2>
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
                              const cell = w.grid[day][pIdx]
                              const cls = ['cell', cell ? '' : 'blank', cell?.kind || ''].filter(Boolean).join(' ')
                              return (
                                <td key={day} className={cls}>
                                  {cell ? (
                                    <>
                                      <div className="subj">{cell.subject}</div>
                                      <div className="teacher">
                                        {cell.className}
                                        {cell.kind && <span className="preview-badge"> {cell.label}</span>}
                                      </div>
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
            <div className="legend no-print">
              <span className="legend-item">
                <i className="swatch incoming" /> 교체/대강으로 새로 맡는 수업
              </span>
              <span className="legend-item">
                <i className="swatch outgoing" /> 빠지는 수업(교체로 빠짐 / 결강)
              </span>
            </div>
          </>
        )
      )}
    </div>
  )
}
