const DAY_TO_JSDOW = { 월: 1, 화: 2, 수: 3, 목: 4, 금: 5 }

export function nextDateForDay(dayKorean, fromDate = new Date()) {
  const target = DAY_TO_JSDOW[dayKorean]
  const d = new Date(fromDate)
  d.setHours(0, 0, 0, 0)
  const diff = (target - d.getDay() + 7) % 7
  d.setDate(d.getDate() + diff)
  return toInputDate(d)
}

export function toInputDate(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function todayInputDate() {
  return toInputDate(new Date())
}

// Monday..Sunday range (as input-date strings) containing the given date.
export function weekRangeContaining(dateStr) {
  const d = new Date(dateStr + 'T00:00:00')
  const dow = d.getDay() // 0=Sun..6=Sat
  const mondayOffset = dow === 0 ? -6 : 1 - dow
  const monday = new Date(d)
  monday.setDate(d.getDate() + mondayOffset)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  return { start: toInputDate(monday), end: toInputDate(sunday) }
}

export function shiftWeek(dateStr, weeks) {
  const d = new Date(dateStr + 'T00:00:00')
  d.setDate(d.getDate() + weeks * 7)
  return toInputDate(d)
}

export function formatKoreanDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr + 'T00:00:00')
  const dows = ['일', '월', '화', '수', '목', '금', '토']
  return `${d.getMonth() + 1}/${d.getDate()}(${dows[d.getDay()]})`
}
