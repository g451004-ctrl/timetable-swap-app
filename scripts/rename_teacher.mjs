// 공유 시간표(Supabase) 안의 교사 이름을 고칠 때 쓰는 유틸리티.
// 사용법: node scripts/rename_teacher.mjs <기존이름> <새이름>
// (teacherGroups.js에 교과군이 등록돼 있다면 그 파일도 같이 고쳐줘야 함)
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

const env = Object.fromEntries(
  readFileSync(new URL('../.env', import.meta.url), 'utf8')
    .split('\n')
    .filter((l) => l.includes('='))
    .map((l) => {
      const i = l.indexOf('=')
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()]
    })
)

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY)

const [fromName, toName] = process.argv.slice(2)
if (!fromName || !toName) {
  console.error('usage: node rename_teacher.mjs <fromName> <toName>')
  process.exit(1)
}

const { data, error: fetchErr } = await supabase.from('timetables').select('*').eq('id', 1).maybeSingle()
if (fetchErr || !data) {
  console.error('fetch failed', fetchErr)
  process.exit(1)
}

const parsed = data.data
const teacher = parsed.teachers.find((t) => t.name === fromName)
if (!teacher) {
  console.error(`teacher "${fromName}" not found`)
  process.exit(1)
}
teacher.name = toName

const { error: upErr } = await supabase
  .from('timetables')
  .upsert({ id: 1, file_name: data.file_name, data: parsed, uploaded_at: new Date().toISOString() })

if (upErr) {
  console.error('upsert failed', upErr)
  process.exit(1)
}
console.log(`renamed ${fromName} -> ${toName}`)
