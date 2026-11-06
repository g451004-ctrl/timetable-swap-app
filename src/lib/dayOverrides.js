import { DAYS, PERIODS_BY_DAY } from './parseTimetable'
import { addDays } from './dateUtils'

// 요일 변경: 특정 날짜를 다른 요일 시간표로 진행하는 경우 (예: 11/16(월)을 금요일 시간표로)
// 공유 시간표 데이터(parsed.dayOverrides)에 { 'YYYY-MM-DD': { day: '금', note: '' } } 형태로 저장한다.
const NO_OVERRIDES = Object.freeze({})

// 없을 때도 항상 같은 객체를 돌려줘서, 이 값을 의존성으로 쓰는 effect가 매 렌더마다 다시 실행되지 않게 한다
export function getDayOverrides(parsed) {
  return parsed?.dayOverrides || NO_OVERRIDES
}

// weekStart(월요일) 기준 월~금 5개 열의 정보. 요일 변경이 있으면 그 날은 바꾼 요일의 시간표(와 교시 수)를 쓴다.
export function weekColumns(weekStart, overrides) {
  return DAYS.map((day, i) => {
    const date = addDays(weekStart, i)
    const templateDay = overrides?.[date]?.day || day
    return {
      day,
      date,
      templateDay,
      overridden: templateDay !== day,
      note: overrides?.[date]?.note || '',
      periods: PERIODS_BY_DAY[templateDay],
    }
  })
}

// 오늘(포함) 이후의 요일 변경 목록, 날짜순
export function upcomingOverrides(overrides, today) {
  return Object.entries(overrides || {})
    .filter(([date]) => date >= today)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, v]) => ({ date, day: v.day, note: v.note || '' }))
}
