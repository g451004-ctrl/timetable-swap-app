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

export function addDays(dateStr, n) {
  const d = new Date(dateStr + 'T00:00:00')
  d.setDate(d.getDate() + n)
  return toInputDate(d)
}

const WEEKDAY_NAMES = ['월', '화', '수', '목', '금']

// 날짜의 실제 요일(월~금). 토/일이면 null
export function weekdayOf(dateStr) {
  const dow = new Date(dateStr + 'T00:00:00').getDay() // 0=일 .. 6=토
  return dow >= 1 && dow <= 5 ? WEEKDAY_NAMES[dow - 1] : null
}

// 그 날 실제로 적용되는 시간표의 요일. 요일 변경(예: 월요일에 금요일 시간표로 진행)이 있으면 그 요일.
// overrides: { 'YYYY-MM-DD': { day: '금', note: '' } }
export function effectiveDay(dateStr, overrides) {
  return overrides?.[dateStr]?.day || weekdayOf(dateStr)
}

// 오늘부터 가장 가까운, "day 요일 시간표"로 진행되는 날짜 (요일 변경 날짜 포함)
export function nextDateForTemplateDay(day, overrides, fromDate = new Date()) {
  const start = toInputDate(new Date(fromDate.getFullYear(), fromDate.getMonth(), fromDate.getDate()))
  for (let i = 0; i < 35; i += 1) {
    const date = addDays(start, i)
    if (effectiveDay(date, overrides) === day) return date
  }
  return nextDateForDay(day, fromDate)
}

// 주어진 날짜들이 걸쳐 있는 주를 구한다. { anchor: 첫 주 월요일, weeks: 걸친 주 수(최대 3) }
export function weekSpan(dateStrs) {
  const sorted = dateStrs.filter(Boolean).sort()
  if (sorted.length === 0) return { anchor: todayInputDate(), weeks: 1 }
  const first = weekRangeContaining(sorted[0]).start
  const last = weekRangeContaining(sorted[sorted.length - 1]).start
  const diff = Math.round((new Date(last + 'T00:00:00') - new Date(first + 'T00:00:00')) / (7 * 86400000))
  return { anchor: first, weeks: Math.min(3, diff + 1) }
}

export function formatKoreanDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr + 'T00:00:00')
  const dows = ['일', '월', '화', '수', '목', '금', '토']
  return `${d.getMonth() + 1}/${d.getDate()}(${dows[d.getDay()]})`
}
