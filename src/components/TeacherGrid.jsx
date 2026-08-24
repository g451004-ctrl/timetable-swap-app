import { DAYS, PERIODS_BY_DAY } from '../lib/parseTimetable'

export default function TeacherGrid({ parsed, teacherName, origin, onPick }) {
  const teacher = parsed.teachers.find((t) => t.name === teacherName)
  if (!teacher) return null

  const maxPeriods = Math.max(...Object.values(PERIODS_BY_DAY))

  return (
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
                const cell = teacher.cells[day][pIdx]
                const isOrigin = origin && origin.day === day && origin.period === pIdx + 1
                const cls = ['cell', cell ? '' : 'blank', cell?.special ? 'special' : '', isOrigin ? 'sel-from' : '']
                  .filter(Boolean)
                  .join(' ')
                return (
                  <td
                    key={day}
                    className={cls}
                    data-day={day}
                    data-period={pIdx + 1}
                    title={
                      cell
                        ? cell.special
                          ? '특수/이동수업으로 표시된 수업입니다. 교체 가능 여부를 확인하세요.'
                          : ''
                        : '공강'
                    }
                    onClick={() => cell && onPick(day, pIdx + 1, cell)}
                  >
                    {cell ? (
                      <>
                        <div className="subj">{cell.subject}</div>
                        <div className="teacher">{cell.className}</div>
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
      <div className="legend">
        <span className="legend-item">
          <i className="swatch special" /> 특수/이동수업 (교체 시 주의)
        </span>
        <span className="legend-item">
          <i className="swatch sel-from" /> 결강시킬 수업(클릭)
        </span>
      </div>
    </div>
  )
}
