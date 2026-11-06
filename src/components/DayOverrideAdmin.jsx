import { useState } from 'react'
import { DAYS } from '../lib/parseTimetable'
import { formatKoreanDate, todayInputDate, weekdayOf } from '../lib/dateUtils'

// 관리자용: 특정 날짜를 다른 요일 시간표로 진행하도록 등록/삭제 (예: 11/16(월)을 금요일 시간표로)
export default function DayOverrideAdmin({ overrides, onSave, disabled }) {
  const [date, setDate] = useState('')
  const [day, setDay] = useState('금')
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)

  const entries = Object.entries(overrides || {}).sort(([a], [b]) => a.localeCompare(b))
  const actual = date ? weekdayOf(date) : null
  const sameDay = !!date && actual === day

  async function save(next) {
    setSaving(true)
    const res = await onSave(next)
    setSaving(false)
    return res
  }

  async function handleAdd() {
    if (!date || sameDay) return
    const res = await save({ ...overrides, [date]: { day, note: note.trim() } })
    if (res.ok) {
      setDate('')
      setNote('')
    }
  }

  return (
    <div style={{ marginTop: 32 }}>
      <h2>요일 변경 (다른 요일 시간표로 진행하는 날)</h2>
      <p className="hint">
        시간이 모자라 특정 날짜를 다른 요일 시간표로 진행할 때 등록합니다. 예) 11/16(월)을 금요일 시간표로 →
        그날은 금요일 수업 순서대로 시간표/교체 후보/인쇄물에 반영됩니다.
      </p>
      {disabled ? (
        <p className="hint">시간표를 먼저 등록해주세요.</p>
      ) : (
        <>
          <div className="field-row">
            <label>
              날짜
              <input type="date" value={date} min={todayInputDate()} onChange={(e) => setDate(e.target.value)} />
            </label>
            <label>
              적용할 시간표 요일
              <select value={day} onChange={(e) => setDay(e.target.value)}>
                {DAYS.map((d) => (
                  <option key={d} value={d}>
                    {d}요일 시간표
                  </option>
                ))}
              </select>
            </label>
            <label>
              메모(선택)
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="예: 보충 수업 확보"
              />
            </label>
          </div>
          {date && !actual && <p className="warn">주말 날짜입니다. 주간 시간표 화면에는 월~금만 표시됩니다.</p>}
          {sameDay && <p className="error">그 날짜의 원래 요일과 같은 요일입니다. 다른 요일을 선택해주세요.</p>}
          <div className="actions">
            <button className="primary" disabled={!date || sameDay || saving} onClick={handleAdd}>
              {saving ? '저장 중...' : '요일 변경 추가'}
            </button>
          </div>
        </>
      )}

      {entries.length > 0 && (
        <table className="log-table" style={{ marginTop: 12 }}>
          <thead>
            <tr>
              <th>날짜</th>
              <th>적용 시간표</th>
              <th>메모</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {entries.map(([d, v]) => (
              <tr key={d}>
                <td>{formatKoreanDate(d)}</td>
                <td>{v.day}요일 시간표</td>
                <td>{v.note || '-'}</td>
                <td>
                  <button
                    className="link-btn"
                    disabled={saving}
                    onClick={() => {
                      const next = { ...overrides }
                      delete next[d]
                      save(next)
                    }}
                  >
                    삭제
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
