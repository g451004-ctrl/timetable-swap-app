import { weekColumns } from './dayOverrides'

// 한 선생님의 기본(반복) 주간 시간표 위에, 특정 한 주(weekStart는 월요일)의 요일 변경과
// 교체/대강 내역을 날짜 기준으로 덮어씌워 "그 주에 실제로 하는 시간표"를 만든다.
// 칸 kind: 'incoming'(새로 맡는 수업) | 'outgoing'(빠지는 수업) | null
export function buildEffectiveTeacherWeek(teacher, swaps, weekStart, overrides) {
  const columns = weekColumns(weekStart, overrides)
  const grid = {}
  for (const col of columns) {
    grid[col.day] = teacher.cells[col.templateDay].map((cell) => (cell ? { ...cell, kind: null } : null))
  }
  let changed = 0

  function outgoing(date, period, label) {
    const col = columns.find((c) => c.date === date)
    if (!col) return
    const cell = grid[col.day][period - 1]
    if (!cell) return
    grid[col.day][period - 1] = { ...cell, kind: 'outgoing', label }
    changed += 1
  }

  function incoming(date, period, subject, className, label) {
    const col = columns.find((c) => c.date === date)
    if (!col || period < 1 || period > grid[col.day].length) return
    grid[col.day][period - 1] = { subject, className, special: false, kind: 'incoming', label }
    changed += 1
  }

  for (const s of swaps) {
    if (s.type === 'cover') {
      if (s.from_teacher === teacher.name) outgoing(s.from_date, s.from_period, '결강')
      if (s.cover_teacher === teacher.name) {
        incoming(s.from_date, s.from_period, s.from_subject, s.class_name, '대강')
      }
    } else {
      // 교체: 결강 교사는 결강 칸이 빠지고 교체 칸에 결강 수업을 맡는다. 상대 교사는 그 반대.
      if (s.from_teacher === teacher.name) {
        outgoing(s.from_date, s.from_period, '빠짐')
        incoming(s.to_date, s.to_period, s.from_subject, s.class_name, '교체')
      }
      if (s.to_teacher === teacher.name) {
        outgoing(s.to_date, s.to_period, '빠짐')
        incoming(s.from_date, s.from_period, s.to_subject, s.class_name, '교체')
      }
    }
  }

  return { grid, changed, columns }
}
