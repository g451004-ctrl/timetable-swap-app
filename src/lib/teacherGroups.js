// 교과군.xlsx 기준 교사별 교과(군) 소속. 학기/인사이동에 따라 바뀌면 이 목록만 갱신하면 됨.
const TEACHER_GROUPS = {
  국어과: ['공지인', '김기진', '김선영', '김혜진', '박찬홍', '이승준', '정유경'],
  수학과: ['구소희', '김미희', '정수경', '정창택', '황혜영'],
  영어과: ['손예진', '양인자', '이진향', '임선미', '송유경', '하수미'],
  과학과: ['김정민', '박유빈', '서선영', '석경헌', '안소현', '임진우'],
  사회과: ['강민수', '김혜지', '박미향', '박시우', '서주연', '이연주', '정소이', '정호준', '지청운'],
  예체능과: ['김남이', '김태현', '배윤호', '서지영'],
  교양과: ['구현정', '김현천', '박정원', '서나리'],
}

const nameToGroup = new Map()
for (const [group, names] of Object.entries(TEACHER_GROUPS)) {
  for (const name of names) nameToGroup.set(name, group)
}

export function teacherGroup(teacherName) {
  return nameToGroup.get(teacherName) || null
}

export { TEACHER_GROUPS }
