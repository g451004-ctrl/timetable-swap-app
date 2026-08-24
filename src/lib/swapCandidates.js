import { DAYS, PERIODS_BY_DAY } from './parseTimetable'

function teacherByName(parsed, name) {
  return parsed.teachers.find((t) => t.name === name) || null
}

export function isTeacherFree(parsed, teacherName, day, period) {
  const teacher = teacherByName(parsed, teacherName)
  if (!teacher) return false
  if (period < 1 || period > PERIODS_BY_DAY[day]) return false // that period doesn't exist that day (e.g. 수 7교시)
  return !teacher.cells[day][period - 1]
}

// Given a teacher who will be absent at (day, period), find every other slot
// belonging to the SAME class where swapping is actually feasible: the absent
// teacher must be free at the candidate slot, and the candidate slot's teacher
// must be free at the original (day, period).
export function findSwapCandidates(parsed, classMap, teacherName, day, period) {
  const teacher = teacherByName(parsed, teacherName)
  if (!teacher) return []
  const originCell = teacher.cells[day][period - 1]
  if (!originCell) return []

  const classNames = originCell.className
    .split(/[,/]/)
    .map((s) => s.trim())
    .filter(Boolean)

  const candidates = []
  for (const className of classNames) {
    const week = classMap[className]
    if (!week) continue
    for (const d of DAYS) {
      week[d].forEach((slot, idx) => {
        const p = idx + 1
        if (d === day && p === period) return // same slot
        if (!slot) return // class has nothing there
        if (slot.teacher === teacherName) return // same teacher already, not a useful swap
        if (!isTeacherFree(parsed, teacherName, d, p)) return // absent teacher not free then
        if (!isTeacherFree(parsed, slot.teacher, day, period)) return // candidate teacher not free at origin time
        candidates.push({
          className,
          day: d,
          period: p,
          teacher: slot.teacher,
          subject: slot.subject,
          special: slot.special,
        })
      })
    }
  }
  return candidates
}

export function sortedTeacherNames(parsed) {
  return parsed.teachers.map((t) => t.name).sort((a, b) => a.localeCompare(b, 'ko'))
}
