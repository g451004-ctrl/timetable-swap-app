import { useEffect, useMemo, useState } from 'react'
import TeacherGrid from './components/TeacherGrid'
import { CandidateList, SwapConfirm, PlanPanel } from './components/SwapForm'
import AdminPanel from './components/AdminPanel'
import WeeklyLog from './components/WeeklyLog'
import { findSwapCandidates, sortedTeacherNames } from './lib/swapCandidates'
import { generateSwapDocx } from './lib/generateDocx'
import { saveSwapRequests } from './lib/swapLog'
import { todayInputDate } from './lib/dateUtils'
import { useTimetable } from './hooks/useTimetable'
import { useAdminAuth } from './hooks/useAdminAuth'
import './App.css'

function App() {
  const timetable = useTimetable()
  const auth = useAdminAuth()

  const [tab, setTab] = useState('swap')
  const [selectedTeacher, setSelectedTeacher] = useState('')
  const [origin, setOrigin] = useState(null) // { day, period, cell }
  const [candidate, setCandidate] = useState(null)
  const [rows, setRows] = useState([])
  const [planInfo, setPlanInfo] = useState({
    teacherName: '',
    reason: '출장',
    submitDate: todayInputDate(),
  })
  const [saveStatus, setSaveStatus] = useState('')

  const teacherNames = useMemo(
    () => (timetable.parsed ? sortedTeacherNames(timetable.parsed) : []),
    [timetable.parsed]
  )

  useEffect(() => {
    if (teacherNames.length === 0) return
    if (!teacherNames.includes(selectedTeacher)) {
      setSelectedTeacher(teacherNames[0])
      setPlanInfo((p) => ({ ...p, teacherName: teacherNames[0] }))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teacherNames])

  const candidates = useMemo(() => {
    if (!timetable.parsed || !origin || !selectedTeacher) return []
    return findSwapCandidates(timetable.parsed, timetable.classMap, selectedTeacher, origin.day, origin.period)
  }, [timetable.parsed, timetable.classMap, origin, selectedTeacher])

  function handleSelectTeacher(name) {
    setSelectedTeacher(name)
    setOrigin(null)
    setCandidate(null)
    setPlanInfo((p) => ({ ...p, teacherName: name }))
  }

  function handlePickOrigin(day, period, cell) {
    setOrigin({ day, period, cell })
    setCandidate(null)
  }

  function handleConfirmRow(extra) {
    const newRow = {
      className: origin.cell.className,
      fromDay: origin.day,
      fromPeriod: origin.period,
      fromSubject: origin.cell.subject,
      fromTeacher: selectedTeacher,
      toDay: candidate.day,
      toPeriod: candidate.period,
      toSubject: candidate.subject,
      toTeacher: candidate.teacher,
      ...extra,
    }
    setRows((r) => [...r, newRow])
    setOrigin(null)
    setCandidate(null)
  }

  function handleRemoveRow(idx) {
    setRows((r) => r.filter((_, i) => i !== idx))
  }

  async function handleGenerate() {
    setSaveStatus('저장 중...')
    await generateSwapDocx({
      teacherName: planInfo.teacherName,
      reason: planInfo.reason,
      submitDate: planInfo.submitDate,
      rows,
    })
    const { error } = await saveSwapRequests({
      teacherName: planInfo.teacherName,
      reason: planInfo.reason,
      submitDate: planInfo.submitDate,
      rows,
    })
    if (error) {
      setSaveStatus('문서는 다운로드되었지만 공유 내역 저장에는 실패했습니다: ' + error.message)
    } else {
      setSaveStatus('문서를 다운로드했고, 주간 변경 내역에도 저장했습니다.')
      setRows([])
    }
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>수업 교체 &amp; 결보강계획서 자동 작성</h1>
        <p className="subtitle">
          결강할 선생님의 시간표에서 뺄 수업을 클릭하면, 서로 공강 시간이 맞는 교체 가능한 수업만 찾아
          보여줍니다.
        </p>
        <nav className="tabs">
          <button className={tab === 'swap' ? 'active' : ''} onClick={() => setTab('swap')}>
            수업 교체
          </button>
          <button className={tab === 'admin' ? 'active' : ''} onClick={() => setTab('admin')}>
            관리자
          </button>
        </nav>
      </header>

      {tab === 'admin' && <AdminPanel auth={auth} timetable={timetable} />}

      {tab === 'log' && <WeeklyLog />}

      {tab === 'swap' &&
        (timetable.loading ? (
          <p className="hint">시간표를 불러오는 중...</p>
        ) : !timetable.parsed ? (
          <div className="upload-step">
            <h2>{timetable.error ? '시간표를 불러오지 못했습니다' : '등록된 시간표가 없습니다'}</h2>
            {timetable.error ? (
              <>
                <p className="error">{timetable.error}</p>
                <button onClick={() => timetable.refetch()}>다시 시도</button>
              </>
            ) : (
              <>
                <p className="hint">관리자 탭에서 전체 교사 시간표를 먼저 업로드해주세요.</p>
                <button className="primary" onClick={() => setTab('admin')}>
                  관리자 탭으로 이동
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="main-grid">
            <div className="left-col">
              <div className="class-select-row">
                <h2>결강 예정 선생님</h2>
                <select value={selectedTeacher} onChange={(e) => handleSelectTeacher(e.target.value)}>
                  {teacherNames.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>
              <TeacherGrid
                parsed={timetable.parsed}
                teacherName={selectedTeacher}
                origin={origin}
                onPick={handlePickOrigin}
              />
              {origin && !candidate && (
                <CandidateList origin={origin} candidates={candidates} onSelect={setCandidate} />
              )}
              {origin && candidate && (
                <SwapConfirm
                  teacherName={selectedTeacher}
                  origin={origin}
                  candidate={candidate}
                  onConfirm={handleConfirmRow}
                  onCancel={() => setCandidate(null)}
                />
              )}
            </div>
            <div className="right-col">
              <PlanPanel
                planInfo={planInfo}
                onChange={setPlanInfo}
                rows={rows}
                onRemoveRow={handleRemoveRow}
                onGenerate={handleGenerate}
              />
              {saveStatus && <p className="hint">{saveStatus}</p>}
            </div>
          </div>
        ))}
    </div>
  )
}

export default App
