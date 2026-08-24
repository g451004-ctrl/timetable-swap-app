import { useEffect, useState } from 'react'
import { fetchSwapsBetween } from '../lib/swapLog'
import { weekRangeContaining, shiftWeek, todayInputDate, formatKoreanDate } from '../lib/dateUtils'

export default function WeeklyLog() {
  const [anchor, setAnchor] = useState(todayInputDate())
  const [swaps, setSwaps] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const { start, end } = weekRangeContaining(anchor)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError('')
    fetchSwapsBetween(start, end).then(({ data, error: err }) => {
      if (cancelled) return
      if (err) setError('불러오지 못했습니다: ' + err.message)
      else setSwaps(data)
      setLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [start, end])

  return (
    <div className="weekly-log">
      <div className="week-nav">
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
      ) : swaps.length === 0 ? (
        <p className="hint">이 주에 등록된 수업 교체 내역이 없습니다.</p>
      ) : (
        <table className="log-table">
          <thead>
            <tr>
              <th>신청 교사</th>
              <th>사유</th>
              <th>학반</th>
              <th>결강 수업</th>
              <th></th>
              <th>교체 수업</th>
              <th>온/오프</th>
            </tr>
          </thead>
          <tbody>
            {swaps.map((s) => (
              <tr key={s.id}>
                <td>{s.teacher_name}</td>
                <td>{s.reason}</td>
                <td>{s.class_name}</td>
                <td>
                  {formatKoreanDate(s.from_date)} {s.from_period}교시 {s.from_subject}/{s.from_teacher}
                </td>
                <td>→</td>
                <td>
                  {formatKoreanDate(s.to_date)} {s.to_period}교시 {s.to_subject}/{s.to_teacher}
                </td>
                <td>{s.on_offline}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
