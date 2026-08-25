// Overlays confirmed 교체/대강 changes for one specific calendar week onto a
// class's normal recurring weekly grid, so you can see what actually happens
// that week rather than the static template.
export function buildEffectiveClassWeek(baseWeek, days, swaps) {
  const grid = {}
  for (const day of days) {
    grid[day] = baseWeek[day].map((cell) => (cell ? { ...cell, changed: false } : null))
  }

  function applyChange(day, period, next) {
    const idx = period - 1
    if (!grid[day] || grid[day][idx] === undefined) return
    const orig = grid[day][idx]
    grid[day][idx] = {
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
      applyChange(s.from_day, s.from_period, {
        subject: s.same_subject ? s.from_subject : s.cover_subject || s.from_subject,
        teacher: s.cover_teacher,
        kind: 'cover',
      })
    } else {
      applyChange(s.from_day, s.from_period, { subject: s.to_subject, teacher: s.to_teacher, kind: 'swap' })
      applyChange(s.to_day, s.to_period, { subject: s.from_subject, teacher: s.from_teacher, kind: 'swap' })
    }
  }

  return grid
}
