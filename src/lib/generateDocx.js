import {
  Document,
  Packer,
  Paragraph,
  Table,
  TableRow,
  TableCell,
  TextRun,
  WidthType,
  AlignmentType,
  VerticalAlign,
  PageOrientation,
} from 'docx'

const FONT = '맑은 고딕'

// A4 portrait, ~1.9cm margins -> usable content width in twips (1/1440 inch)
const PAGE_WIDTH = 11906
const PAGE_HEIGHT = 16838
const MARGIN = 1100
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2 // 9706

const HEADER_COLS = [1800, 6206, 1700] // label / value / suffix
const SWAP_COLS = [850, 550, 650, 550, 1050, 1050, 850, 550, 550, 1150, 1100, 806]
// 결강 수업: 일시,요일,학반,교시,교과,교사 (6) | 수업 교체: 일시,요일,교시,교과,교사 (5) | 비고 (1)
const SWAP_GROUP_WIDTHS = [
  SWAP_COLS.slice(0, 6).reduce((a, b) => a + b, 0),
  SWAP_COLS.slice(6, 11).reduce((a, b) => a + b, 0),
  SWAP_COLS[11],
]

const COVER_COLS = [850, 550, 650, 550, 1050, 1050, 900, 900, 1200, 1200, 806]
// 결강 수업: 일시,요일,학반(그룹),교시,교과,교사 (6) | 수업 대강: 교과,교사,동교과 대강,보강계획 (4) | 비고 (1)
const COVER_GROUP_WIDTHS = [
  COVER_COLS.slice(0, 6).reduce((a, b) => a + b, 0),
  COVER_COLS.slice(6, 10).reduce((a, b) => a + b, 0),
  COVER_COLS[10],
]

function cellText(text, opts = {}) {
  return new Paragraph({
    alignment: opts.align || AlignmentType.CENTER,
    children: [
      new TextRun({
        text: text ?? '',
        font: FONT,
        size: opts.size || 20,
        bold: !!opts.bold,
      }),
    ],
  })
}

function cell(text, width, opts = {}) {
  return new TableCell({
    width: { size: width, type: WidthType.DXA },
    columnSpan: opts.colSpan,
    verticalAlign: VerticalAlign.CENTER,
    shading: opts.shaded ? { fill: 'F2F2F2' } : undefined,
    children: [cellText(text, opts)],
  })
}

function formatDate(dateStr) {
  if (!dateStr) return { y: '', m: '', d: '', dow: '' }
  const dt = new Date(dateStr + 'T00:00:00')
  const dows = ['일', '월', '화', '수', '목', '금', '토']
  return {
    y: String(dt.getFullYear()),
    m: String(dt.getMonth() + 1),
    d: String(dt.getDate()),
    dow: dows[dt.getDay()],
  }
}

function shortDate(dateStr) {
  if (!dateStr) return ''
  const dt = new Date(dateStr + 'T00:00:00')
  return `${dt.getMonth() + 1}/${dt.getDate()}`
}

export function buildSwapDocument({ teacherName, reason, submitDate, rows }) {
  const sub = formatDate(submitDate)

  const title = new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 300 },
    children: [new TextRun({ text: '수업교체(결보강) 계획서', font: FONT, size: 32, bold: true })],
  })

  const headerTable = new Table({
    width: { size: CONTENT_WIDTH, type: WidthType.DXA },
    columnWidths: HEADER_COLS,
    rows: [
      new TableRow({
        children: [
          cell('교      사:', HEADER_COLS[0]),
          cell(teacherName, HEADER_COLS[1]),
          cell('(인)', HEADER_COLS[2]),
        ],
      }),
      new TableRow({
        children: [
          cell('대체 사유:', HEADER_COLS[0]),
          cell(reason, HEADER_COLS[1] + HEADER_COLS[2], { colSpan: 2, align: AlignmentType.LEFT }),
        ],
      }),
      new TableRow({
        children: [
          cell('일      시:', HEADER_COLS[0]),
          cell(`${sub.y}년   ${sub.m}월   ${sub.d}일   ${sub.dow}요일`, HEADER_COLS[1] + HEADER_COLS[2], {
            colSpan: 2,
            align: AlignmentType.LEFT,
          }),
        ],
      }),
    ],
  })

  const intro = new Paragraph({
    spacing: { before: 300, after: 200 },
    children: [
      new TextRun({
        text: '  위와 같은 사유로 아래와 같이 수업 교체(결보강)을 계획하여 운영하고자 합니다.',
        font: FONT,
        size: 20,
      }),
    ],
  })

  const headRow1 = new TableRow({
    children: [
      cell('결강 수업', SWAP_GROUP_WIDTHS[0], { colSpan: 6, bold: true, shaded: true }),
      cell('수업 교체', SWAP_GROUP_WIDTHS[1], { colSpan: 5, bold: true, shaded: true }),
      cell('비고', SWAP_GROUP_WIDTHS[2], { bold: true, shaded: true }),
    ],
  })
  const headRow2Labels = ['일시', '요일', '학반', '교시', '교과', '교사', '일시', '요일', '교시', '교과', '교사', '온/오프']
  const headRow2 = new TableRow({
    children: headRow2Labels.map((label, i) => cell(label, SWAP_COLS[i], { shaded: true })),
  })

  const swapRows = rows.filter((r) => r.type !== 'cover')
  const coverRows = rows.filter((r) => r.type === 'cover')

  const dataRows = swapRows.map((row) => {
    const from = formatDate(row.fromDate)
    const to = formatDate(row.toDate)
    const values = [
      shortDate(row.fromDate),
      from.dow,
      row.className,
      String(row.fromPeriod),
      row.fromSubject,
      row.fromTeacher,
      shortDate(row.toDate),
      to.dow,
      String(row.toPeriod),
      row.toSubject,
      row.toTeacher,
      row.onOffline || '오프라인',
    ]
    return new TableRow({
      children: values.map((v, i) => cell(v, SWAP_COLS[i])),
    })
  })

  const swapTable = new Table({
    width: { size: CONTENT_WIDTH, type: WidthType.DXA },
    columnWidths: SWAP_COLS,
    rows: [headRow1, headRow2, ...dataRows],
  })

  const coverHeadRow1 = new TableRow({
    children: [
      cell('결강 수업', COVER_GROUP_WIDTHS[0], { colSpan: 6, bold: true, shaded: true }),
      cell('수업 대강', COVER_GROUP_WIDTHS[1], { colSpan: 4, bold: true, shaded: true }),
      cell('비고', COVER_GROUP_WIDTHS[2], { bold: true, shaded: true }),
    ],
  })
  const coverHeadRow2Labels = ['일시', '요일', '학반(그룹)', '교시', '교과', '교사', '교과', '교사', '동교과 대강', '보강계획', '온/오프']
  const coverHeadRow2 = new TableRow({
    children: coverHeadRow2Labels.map((label, i) => cell(label, COVER_COLS[i], { shaded: true })),
  })
  const coverDataRows = coverRows.map((row) => {
    const from = formatDate(row.fromDate)
    const values = [
      shortDate(row.fromDate),
      from.dow,
      row.className,
      String(row.fromPeriod),
      row.fromSubject,
      row.fromTeacher,
      row.coverSubject || row.fromSubject,
      row.coverTeacher,
      row.sameGroup ? 'O' : 'X',
      row.coverPlan || '',
      row.onOffline || '오프라인',
    ]
    return new TableRow({
      children: values.map((v, i) => cell(v, COVER_COLS[i])),
    })
  })
  // the original paper form ships with two blank rows for hand-written entries when unused
  const coverBlankRows =
    coverDataRows.length > 0
      ? []
      : [0, 1].map(
          () =>
            new TableRow({
              children: COVER_COLS.map((w) => cell('', w)),
            })
        )

  const coverTable = new Table({
    width: { size: CONTENT_WIDTH, type: WidthType.DXA },
    columnWidths: COVER_COLS,
    rows: [coverHeadRow1, coverHeadRow2, ...coverDataRows, ...coverBlankRows],
  })

  const notes = [
    '○ 결강 사유가 발생하면 교육과정부와 사전에 협의하여야 하며, 교환수업 계획서를 작성하여 교육과정부에 제출한다.',
    '○ 결강은 수업 교체를 원칙으로 하며, 대강이 부득이 한 경우에는 "동 과목 - 동 교과(군) - 결강 시수가 많은 교사 - 당일 수업 시수가 적은 교사 순"으로 배치한다.',
    '○ 결강 교사가 사전에 수업 교체 내용을 해당 학반 학생들과 보강 교사에게 직접 공지하여 수업결손을 방지한다.',
  ].map(
    (t) =>
      new Paragraph({
        spacing: { before: 120 },
        children: [new TextRun({ text: t, font: FONT, size: 18 })],
      })
  )

  return new Document({
    sections: [
      {
        properties: {
          page: {
            size: { width: PAGE_WIDTH, height: PAGE_HEIGHT, orientation: PageOrientation.PORTRAIT },
            margin: { top: MARGIN, bottom: MARGIN, left: MARGIN, right: MARGIN },
          },
        },
        children: [
          title,
          headerTable,
          intro,
          swapTable,
          new Paragraph({ text: '', spacing: { before: 200 } }),
          coverTable,
          new Paragraph({ text: '', spacing: { before: 300 } }),
          ...notes,
        ],
      },
    ],
  })
}

export async function generateSwapDocx(data) {
  const { saveAs } = await import('file-saver')
  const doc = buildSwapDocument(data)
  const blob = await Packer.toBlob(doc)
  const fname = `결보강계획서_${data.teacherName}_${data.submitDate || ''}.docx`
  saveAs(blob, fname)
}
