import { DAYS } from './parseTimetable'

// 한 선생님의 기본(반복) 주간 시간표 위에, 특정 한 주(weekStart~weekEnd)에 해당하는
// 교체/대강 내역을 덮어씌워 "그 주에 실제로 하는 시간표"를 만든다.
// 칸 kind: 'incoming'(새로 맡는 수업) | 'outgoing'(빠지는 수업) | null
export function buildEffectiveTeacherWeek(teacher, swaps, weekStart, weekEnd) {
  const grid = {}
  for (const day of DAYS) {
    grid[day] = teacher.cells[day].map((cell) => (cell ? { ...cell, kind: null } : null))
  }
  let changed = 0

  const inWeek = (date) => !!date && date >= weekStart && date <= weekEnd

  function outgoing(day, period, date, label) {
    if (!inWeek(date)) return
    const cell = grid[day]?.[period - 1]
    if (!cell) return
    grid[day][period - 1] = { ...cell, kind: 'outgoing', label }
    changed += 1
  }

  function incoming(day, period, date, subject, className, label) {
    if (!inWeek(date)) return
    if (!grid[day] || period < 1 || period > grid[day].length) return
    grid[day][period - 1] = { subject, className, special: false, kind: 'incoming', label }
    changed += 1
  }

  for (const s of swaps) {
    if (s.type === 'cover') {
      if (s.from_teacher === teacher.name) outgoing(s.from_day, s.from_period, s.from_date, '결강')
      if (s.cover_teacher === teacher.name) {
        incoming(s.from_day, s.from_period, s.from_date, s.from_subject, s.class_name, '대강')
      }
    } else {
      // 교체: 결강 교사는 결강 칸이 빠지고 교체 칸에 결강 수업을 맡는다. 상대 교사는 그 반대.
      if (s.from_teacher === teacher.name) {
        outgoing(s.from_day, s.from_period, s.from_date, '빠짐')
        incoming(s.to_day, s.to_period, s.to_date, s.from_subject, s.class_name, '교체')
      }
      if (s.to_teacher === teacher.name) {
        outgoing(s.to_day, s.to_period, s.to_date, '빠짐')
        incoming(s.from_day, s.from_period, s.from_date, s.to_subject, s.class_name, '교체')
      }
    }
  }

  return { grid, changed }
}
