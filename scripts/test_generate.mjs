import { Packer } from 'docx'
import { writeFileSync } from 'fs'
import { buildSwapDocument } from '../src/lib/generateDocx.js'

const doc = buildSwapDocument({
  teacherName: '김남이',
  reason: '출장',
  submitDate: '2026-08-24',
  rows: [
    {
      className: '1-4',
      fromDay: '화',
      fromPeriod: 6,
      fromSubject: '체육1',
      fromTeacher: '김남이',
      fromDate: '2026-08-25',
      toDay: '수',
      toPeriod: 3,
      toSubject: '교창',
      toTeacher: '구현정',
      toDate: '2026-08-26',
      onOffline: '오프라인',
    },
  ],
})

const buf = await Packer.toBuffer(doc)
writeFileSync('scripts/output_test.docx', buf)
console.log('wrote scripts/output_test.docx', buf.length, 'bytes')
