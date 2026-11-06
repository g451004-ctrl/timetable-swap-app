import { weekColumns } from './dayOverrides'

// 학급의 기본(반복) 주간 시간표 위에, 특정 한 주에 해당하는 요일 변경과 교체/대강 내역을
// 반영해서 "그 주에 실제로 하는 시간표"를 만든다. 내역은 날짜 기준으로 그 날짜의 열에 반영한다.
export function buildEffectiveClassWeek(baseWeek, weekStart, overrides, swaps) {
  const columns = weekColumns(weekStart, overrides)
  const grid = {}
  for (const col of columns) {
    grid[col.day] = baseWeek[col.templateDay].map((cell) => (cell ? { ...cell, changed: false } : null))
  }

  function applyChange(date, period, next) {
    const col = columns.find((c) => c.date === date)
    if (!col) return // 이 주에 속하지 않는 날짜
    const idx = period - 1
    if (idx < 0 || idx >= grid[col.day].length) return
    const orig = grid[col.day][idx]
    grid[col.day][idx] = {
      subject: next.subject,
      teacher: next.teacher,
      special: orig?.special || false,
      changed: true,
      kind: next.kind,
      originalSubject: orig?.subject ?? null,
      originalTeacher: orig?.teacher ?? null,
    }
  }

  for (const s of swaps) {
    if (s.type === 'cover') {
      applyChange(s.from_date, s.from_period, {
        subject: s.same_subject ? s.from_subject : s.cover_subject || s.from_subject,
        teacher: s.cover_teacher,
        kind: 'cover',
      })
    } else {
      applyChange(s.from_date, s.from_period, { subject: s.to_subject, teacher: s.to_teacher, kind: 'swap' })
      applyChange(s.to_date, s.to_period, { subject: s.from_subject, teacher: s.from_teacher, kind: 'swap' })
    }
  }

  return { grid, columns }
}
