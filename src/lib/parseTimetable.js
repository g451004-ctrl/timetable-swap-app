import * as XLSX from 'xlsx'

const DAYS = ['월', '화', '수', '목', '금']
// column layout discovered from the source workbook:
// A=번호 B=교사 C..I=월(1-7) J..P=화(1-7) Q..V=수(1-6) W..AC=목(1-7) AD..AJ=금(1-7) AK=시수 AL=교사 AM=담임 AN=비고
const PERIODS_BY_DAY = { 월: 7, 화: 7, 수: 6, 목: 7, 금: 7 }
const HEADER_ROWS = 4 // rows 0-3 are titles/headers (0-indexed)

function dayColumnOffsets() {
  // returns { 월: startColIndex(0-based, relative to full row array), ... }
  let col = 2 // C is index 2 in a 0-based row array (A=0,B=1,C=2)
  const offsets = {}
  for (const day of DAYS) {
    offsets[day] = col
    col += PERIODS_BY_DAY[day]
  }
  return offsets
}

function isSpecialCell(ws, rowIdx0, colIdx0) {
  // rowIdx0/colIdx0 are 0-based; sheet_to_json row 0 = spreadsheet row 1
  const addr = XLSX.utils.encode_cell({ r: rowIdx0, c: colIdx0 })
  const cell = ws[addr]
  if (!cell) return false
  const fill = cell.s && cell.s.patternType === 'solid' ? cell.s.fgColor : null
  if (fill && fill.rgb && fill.rgb.toUpperCase() !== 'FFFFFFFF' && fill.rgb.toUpperCase() !== 'FFFFFF') {
    return true
  }
  return false
}

export function parseTimetableFile(arrayBuffer) {
  const wb = XLSX.read(arrayBuffer, { type: 'array', cellStyles: true })
  const sheetName = wb.SheetNames[0]
  const ws = wb.Sheets[sheetName]
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '', raw: false })

  const offsets = dayColumnOffsets()
  const teachers = []

  let r = HEADER_ROWS
  while (r < rows.length) {
    const row = rows[r]
    const name = (row[1] || '').toString().trim()
    if (!name) { r += 1; continue }

    const subjRow = row
    const classRow = rows[r + 1] || []

    const cells = {}
    for (const day of DAYS) {
      const arr = []
      for (let p = 0; p < PERIODS_BY_DAY[day]; p++) {
        const colIdx0 = offsets[day] + p
        const subject = (subjRow[colIdx0] || '').toString().trim()
        const className = (classRow[colIdx0] || '').toString().trim()
        if (!subject && !className) {
          arr.push(null)
        } else {
          arr.push({
            subject,
            className,
            special: isSpecialCell(ws, r, colIdx0) || /^[（(][^)）]{1,3}[)）]/.test(subject),
          })
        }
      }
      cells[day] = arr
    }

    const totalHoursColIdx = offsets['금'] + PERIODS_BY_DAY['금'] // AK
    teachers.push({
      name,
      totalHours: (subjRow[totalHoursColIdx] || '').toString().trim(),
      homeroom: (subjRow[totalHoursColIdx + 2] || '').toString().trim(), // AM 담임
      note: (subjRow[totalHoursColIdx + 3] || '').toString().trim(), // AN 비고
      cells,
    })

    r += 3 // subject row + class row + blank spacer row
  }

  return { days: DAYS, periodsByDay: PERIODS_BY_DAY, teachers }
}

export function buildClassView(parsed) {
  const classMap = {}
  for (const teacher of parsed.teachers) {
    for (const day of parsed.days) {
      parsed.periodsByDay[day]
      teacher.cells[day].forEach((cell, periodIdx) => {
        if (!cell || !cell.className) return
        // className can list multiple classes separated by , or / in rare merged cases
        const classNames = cell.className.split(/[,/]/).map((s) => s.trim()).filter(Boolean)
        for (const cn of classNames) {
          if (!classMap[cn]) {
            classMap[cn] = {}
            for (const d of parsed.days) {
              classMap[cn][d] = new Array(parsed.periodsByDay[d]).fill(null)
            }
          }
          classMap[cn][day][periodIdx] = {
            teacher: teacher.name,
            subject: cell.subject,
            special: cell.special,
          }
        }
      })
    }
  }
  return classMap
}

export { DAYS, PERIODS_BY_DAY }
