import { useMemo, useState } from 'react'
import { DAYS, PERIODS_BY_DAY } from '../lib/parseTimetable'
import { teacherGroup } from '../lib/teacherGroups'

const DATALIST_ID = 'forced-teacher-names'

function findTeacher(parsed, name) {
  const n = name.trim()
  return n ? parsed.teachers.find((t) => t.name === n) || null : null
}

// 후보 목록에 없는 선생님을 직접 입력해서 교체/대강 상대로 넣는다. (공강이 안 맞아도 넣을 수 있음)
// 시간표에 없는 이름(외부 강사 등)도 그대로 쓸 수 있다.
export default function ForcedEntry({ mode, origin, absentTeacher, parsed, onSubmit }) {
  const [name, setName] = useState('')
  const [day, setDay] = useState('')
  const [period, setPeriod] = useState('')
  const [subjectInput, setSubjectInput] = useState('')

  const teacherNames = useMemo(
    () => parsed.teachers.map((t) => t.name).sort((a, b) => a.localeCompare(b, 'ko')),
    [parsed]
  )

  const trimmed = name.trim()
  const teacher = findTeacher(parsed, trimmed)
  const periodNum = Number(period)
  const maxPeriod = day ? PERIODS_BY_DAY[day] : 0
  const validPeriod = day && periodNum >= 1 && periodNum <= maxPeriod

  // 교체일 때: 그 선생님이 그 시간에 원래 하는 수업의 교과를 자동으로 채워준다
  const autoSubject = mode === 'swap' && teacher && validPeriod ? teacher.cells[day][periodNum - 1]?.subject || '' : ''
  const subject = (subjectInput || autoSubject).trim()

  const warnings = []
  const errors = []
  if (trimmed && trimmed === absentTeacher) errors.push('결강하는 선생님 본인은 선택할 수 없습니다.')
  if (trimmed && !teacher) warnings.push('시간표에 없는 이름입니다. 입력한 이름 그대로 계획서에 들어갑니다.')

  if (mode === 'swap') {
    if (day && validPeriod && day === origin.day && periodNum === origin.period) {
      errors.push('결강 수업과 같은 시간입니다. 다른 시간을 선택해주세요.')
    }
    if (teacher && !errors.length) {
      const originCell = teacher.cells[origin.day]?.[origin.period - 1]
      if (originCell) {
        warnings.push(`${teacher.name} 선생님은 ${origin.day} ${origin.period}교시에 이미 수업(${originCell.subject}/${originCell.className || '-'})이 있습니다.`)
      }
    }
    if (day && validPeriod && !errors.length) {
      const absent = findTeacher(parsed, absentTeacher)
      const absentCell = absent?.cells[day]?.[periodNum - 1]
      if (absentCell) {
        warnings.push(`${absentTeacher} 선생님은 ${day} ${periodNum}교시에 이미 수업(${absentCell.subject}/${absentCell.className || '-'})이 있습니다.`)
      }
    }
  } else if (teacher) {
    const originCell = teacher.cells[origin.day]?.[origin.period - 1]
    if (originCell) {
      warnings.push(`${teacher.name} 선생님은 ${origin.day} ${origin.period}교시에 이미 수업(${originCell.subject}/${originCell.className || '-'})이 있습니다.`)
    }
  }

  const ready =
    trimmed && errors.length === 0 && (mode === 'cover' ? true : validPeriod && subject.length > 0)

  function handleSubmit() {
    if (!ready) return
    if (mode === 'swap') {
      onSubmit({
        className: origin.cell.className,
        day,
        period: periodNum,
        teacher: trimmed,
        subject,
        special: false,
        forced: true,
      })
      return
    }
    const absentGroup = teacherGroup(absentTeacher)
    const teachesSame = teacher
      ? DAYS.some((d) => teacher.cells[d].some((c) => c && c.subject === origin.cell.subject))
      : false
    onSubmit({
      teacher: trimmed,
      className: origin.cell.className,
      subject: origin.cell.subject,
      ownSubject: origin.cell.subject,
      sameSubject: teachesSame,
      sameGroup: !!absentGroup && teacherGroup(trimmed) === absentGroup,
      forced: true,
    })
  }

  return (
    <details className="forced-box">
      <summary>후보에 없는 선생님 직접 입력 (강제)</summary>
      <p className="hint">
        공강이 맞지 않거나 목록에 없는 선생님도 직접 넣을 수 있습니다. 시간표 확인은 직접 해주세요.
      </p>
      <datalist id={DATALIST_ID}>
        {teacherNames.map((n) => (
          <option key={n} value={n} />
        ))}
      </datalist>
      <div className="field-row">
        <label>
          {mode === 'swap' ? '교체 선생님' : '대강 선생님'}
          <input
            type="text"
            list={DATALIST_ID}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="이름 입력 또는 선택"
          />
        </label>
        {mode === 'swap' && (
          <>
            <label>
              교체 요일
              <select
                value={day}
                onChange={(e) => {
                  setDay(e.target.value)
                  setPeriod('')
                }}
              >
                <option value="">선택</option>
                {DAYS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </label>
            <label>
              교체 교시
              <select value={period} onChange={(e) => setPeriod(e.target.value)} disabled={!day}>
                <option value="">선택</option>
                {Array.from({ length: maxPeriod }, (_, i) => i + 1).map((p) => (
                  <option key={p} value={p}>
                    {p}교시
                  </option>
                ))}
              </select>
            </label>
            <label>
              교체 교과
              <input
                type="text"
                value={subjectInput}
                onChange={(e) => setSubjectInput(e.target.value)}
                placeholder={autoSubject || '예: 영어A'}
              />
            </label>
          </>
        )}
      </div>
      {mode === 'cover' && (
        <p className="hint">대강 교과는 결강 수업의 교과({origin.cell.subject})로 표기됩니다.</p>
      )}
      {errors.map((m) => (
        <p key={m} className="error">
          {m}
        </p>
      ))}
      {warnings.map((m) => (
        <p key={m} className="warn">
          ⚠ {m}
        </p>
      ))}
      <div className="actions">
        <button className="primary" disabled={!ready} onClick={handleSubmit}>
          {mode === 'swap' ? '이 교체로 진행' : '이 대강으로 진행'}
        </button>
      </div>
    </details>
  )
}
