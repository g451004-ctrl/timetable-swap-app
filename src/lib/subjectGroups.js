// The source timetable has no explicit subject-group column, so this is a best-effort
// keyword guess at 교과(군) grouping for 보강 candidate ranking. Adjust freely if it
// misclassifies a school-specific subject code.
const GROUPS = [
  { name: '국어', keywords: ['국어', '화법', '독서', '문학', '언어와매체', '고전'] },
  { name: '수학', keywords: ['수학', '미적분', '확률', '통계', '기하'] },
  { name: '영어', keywords: ['영어'] },
  {
    name: '사회',
    keywords: ['사회', '역사', '한사', '세사', '지리', '윤리', '정치', '경제', '사문', '생윤', '통사', '법과'],
  },
  { name: '과학', keywords: ['과학', '물리', '화학', '생명', '지구', '통과'] },
  { name: '체육', keywords: ['체육', '운동'] },
  { name: '예술', keywords: ['음악', '미술', '연극', '문예'] },
  { name: '기술가정정보', keywords: ['기술', '가정', '정보', '프로그래밍', '컴퓨터'] },
  { name: '외국어한문', keywords: ['일문', '중문', '독문', '불문', '스문', '한문', '일본어', '중국어'] },
  { name: '교양', keywords: ['교양', '심리', '철학', '논술', '진로', '보건', '환경'] },
  { name: '창체', keywords: ['창체', '자주', '자율', '동아리'] },
]

export function subjectGroup(subject) {
  if (!subject) return '기타'
  const s = subject.replace(/^[（(][^)）]{1,3}[)）]/, '').trim() // strip leading (가)/(나) style prefixes
  for (const g of GROUPS) {
    if (g.keywords.some((k) => s.includes(k))) return g.name
  }
  return '기타'
}
