import { DAYS } from './parseTimetable'
import { isTeacherFree } from './swapCandidates'
import { teacherGroup } from './teacherGroups'

function teacherByName(parsed, name) {
  return parsed.teachers.find((t) => t.name === name) || null
}

function subjectCounts(teacher) {
  const counts = new Map()
  for (const day of DAYS) {
    for (const cell of teacher.cells[day]) {
      if (!cell || !cell.subject) continue
      counts.set(cell.subject, (counts.get(cell.subject) || 0) + 1)
    }
  }
  return counts
}

function dayLoad(teacher, day) {
  return teacher.cells[day].filter(Boolean).length
}

// Given a teacher who will be absent at (day, period), list every other teacher
// free at that same slot as a 보강(cover) candidate, ranked 동 과목 > 동 교과(군) >
// 당일 수업 시수가 적은 교사 순. 교과(군) is looked up from the school's teacher
// roster (교과군.xlsx), not guessed from subject text.
export function findCoverCandidates(parsed, teacherName, day, period) {
  const teacher = teacherByName(parsed, teacherName)
  if (!teacher) return []
  const originCell = teacher.cells[day][period - 1]
  if (!originCell) return []

  const originSubject = originCell.subject
  const originGroup = teacherGroup(teacherName)

  const candidates = []
  for (const t of parsed.teachers) {
    if (t.name === teacherName) continue
    if (!isTeacherFree(parsed, t.name, day, period)) continue

    const counts = subjectCounts(t)
    const subjects = [...counts.keys()]
    const sameSubject = counts.has(originSubject)
    const candidateGroup = teacherGroup(t.name)
    const sameGroup = !!originGroup && candidateGroup === originGroup

    const ownSubject = sameSubject
      ? originSubject
      : subjects.sort((a, b) => (counts.get(b) || 0) - (counts.get(a) || 0))[0] || ''

    candidates.push({
      teacher: t.name,
      className: originCell.className,
      subject: originSubject,
      ownSubject,
      sameSubject,
      sameGroup,
      teacherGroup: candidateGroup,
      dayLoad: dayLoad(t, day),
    })
  }

  candidates.sort((a, b) => {
    if (a.sameSubject !== b.sameSubject) return a.sameSubject ? -1 : 1
    if (a.sameGroup !== b.sameGroup) return a.sameGroup ? -1 : 1
    if (a.dayLoad !== b.dayLoad) return a.dayLoad - b.dayLoad
    return a.teacher.localeCompare(b.teacher, 'ko')
  })

  return candidates
}
