import { DAYS } from './parseTimetable'

// 연속으로 이 시간 이상 수업하게 되면 경고
export const CONSECUTIVE_WARN = 3

// 학급 표기가 있는 칸만 "실제 수업"으로 본다 (창체/자주처럼 학급이 없는 칸은 연속 수업 계산에서 제외)
function isTeachingCell(cell) {
  return !!cell && !!cell.className
}

function isOccupiedAfterChange(cell) {
  if (!cell) return false
  if (cell.kind === 'outgoing') return false
  if (cell.kind === 'incoming') return true
  return isTeachingCell(cell)
}

// incoming 슬롯 앞뒤로 이어지는 연속 수업 구간을 구한다.
function consecutiveRunAround(grid, day, period) {
  const cells = grid[day]
  const idx = period - 1
  let start = idx
  let end = idx
  while (start - 1 >= 0 && isOccupiedAfterChange(cells[start - 1])) start -= 1
  while (end + 1 < cells.length && isOccupiedAfterChange(cells[end + 1])) end += 1
  const length = end - start + 1
  return { day, start: start + 1, end: end + 1, length, warn: length >= CONSECUTIVE_WARN }
}

// teacher: parsed.teachers의 한 명
// incoming: { day, period, subject, className } - 이 선생님이 새로 맡게 되는 수업
// outgoing: { day, period } | null - 교체 시 이 선생님에게서 빠지는 수업 (대강이면 null)
export function buildSchedulePreview(teacher, incoming, outgoing) {
  const grid = {}
  for (const day of DAYS) {
    grid[day] = teacher.cells[day].map((cell) => (cell ? { ...cell, kind: null } : null))
  }

  if (outgoing) {
    const cell = grid[outgoing.day]?.[outgoing.period - 1]
    if (cell) grid[outgoing.day][outgoing.period - 1] = { ...cell, kind: 'outgoing' }
  }

  const slots = grid[incoming.day]
  const idx = incoming.period - 1
  if (!slots || idx < 0 || idx >= slots.length) return { grid, run: null }

  slots[idx] = {
    subject: incoming.subject,
    className: incoming.className,
    special: false,
    kind: 'incoming',
    conflict: isTeachingCell(slots[idx]),
  }

  return { grid, run: consecutiveRunAround(grid, incoming.day, incoming.period) }
}
