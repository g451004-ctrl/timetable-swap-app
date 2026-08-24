import { useEffect, useState } from 'react'
import { nextDateForDay } from '../lib/dateUtils'

const REASON_OPTIONS = ['출장', '연수', '병가', '조퇴', '경조사', '기타']

export function CandidateList({ origin, candidates, onSelect }) {
  return (
    <div className="candidate-box">
      <h3>
        공강 시간이 맞는 교체 가능 수업 ({origin.day} {origin.period}교시 {origin.cell.subject}·
        {origin.cell.className})
      </h3>
      {candidates.length === 0 ? (
        <p className="hint">
          이 수업과 서로 공강 시간이 맞는 교체 대상이 없습니다. 다른 수업을 선택하거나 대강(대신 수업)을
          검토해주세요.
        </p>
      ) : (
        <table className="candidate-table">
          <thead>
            <tr>
              <th>학반</th>
              <th>요일</th>
              <th>교시</th>
              <th>교과</th>
              <th>교사</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {candidates.map((c, idx) => (
              <tr key={idx} className={c.special ? 'row-special' : ''}>
                <td>{c.className}</td>
                <td>{c.day}</td>
                <td>{c.period}교시</td>
                <td>{c.subject}</td>
                <td>{c.teacher}</td>
                <td>
                  <button className="link-btn" onClick={() => onSelect(c)}>
                    선택
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

export function CoverCandidateList({ origin, candidates, onSelect }) {
  return (
    <div className="candidate-box">
      <h3>
        공강인 대강 가능 교사 ({origin.day} {origin.period}교시 {origin.cell.subject}·
        {origin.cell.className})
      </h3>
      <p className="hint">동 과목 → 동 교과(군) → 당일 수업 시수가 적은 교사 순으로 정렬했습니다.</p>
      {candidates.length === 0 ? (
        <p className="hint">이 시간에 공강인 선생님이 없습니다.</p>
      ) : (
        <table className="candidate-table">
          <thead>
            <tr>
              <th>교사</th>
              <th>담당 교과</th>
              <th>동과목/동교과</th>
              <th>당일 수업시수</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {candidates.map((c, idx) => (
              <tr key={idx}>
                <td>{c.teacher}</td>
                <td>{c.ownSubject}</td>
                <td>{c.sameSubject ? '동과목' : c.sameGroup ? '동교과군' : '-'}</td>
                <td>{c.dayLoad}</td>
                <td>
                  <button className="link-btn" onClick={() => onSelect(c)}>
                    선택
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

export function SwapConfirm({ teacherName, origin, candidate, onConfirm, onCancel }) {
  const [fromDate, setFromDate] = useState(() => nextDateForDay(origin.day))
  const [toDate, setToDate] = useState(() => nextDateForDay(candidate.day))
  const [onOffline, setOnOffline] = useState('오프라인')

  useEffect(() => setFromDate(nextDateForDay(origin.day)), [origin.day])
  useEffect(() => setToDate(nextDateForDay(candidate.day)), [candidate.day])

  return (
    <div className="confirm-box">
      <h3>교체 내용 확인</h3>
      <table className="confirm-table">
        <thead>
          <tr>
            <th></th>
            <th>학반</th>
            <th>요일/교시</th>
            <th>교과</th>
            <th>교사</th>
            <th>실제 날짜</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>결강 수업</td>
            <td>{origin.cell.className}</td>
            <td>{origin.day} {origin.period}교시</td>
            <td>{origin.cell.subject}</td>
            <td>{teacherName}</td>
            <td>
              <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
            </td>
          </tr>
          <tr>
            <td>교체 수업</td>
            <td>{candidate.className}</td>
            <td>{candidate.day} {candidate.period}교시</td>
            <td>{candidate.subject}</td>
            <td>{candidate.teacher}</td>
            <td>
              <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
            </td>
          </tr>
        </tbody>
      </table>
      {(origin.cell.special || candidate.special) && (
        <p className="warn">
          ⚠ 선택한 수업 중 특수/이동수업으로 표시된 수업이 있습니다. 실제로 교체 가능한 수업인지 다시 한
          번 확인해주세요.
        </p>
      )}
      <div className="field-row">
        <label>
          온/오프라인
          <select value={onOffline} onChange={(e) => setOnOffline(e.target.value)}>
            <option value="오프라인">오프라인</option>
            <option value="온라인">온라인</option>
          </select>
        </label>
      </div>
      <div className="actions">
        <button className="primary" onClick={() => onConfirm({ fromDate, toDate, onOffline })}>
          이 교체 추가
        </button>
        <button onClick={onCancel}>취소</button>
      </div>
    </div>
  )
}

export function CoverConfirm({ teacherName, origin, candidate, onConfirm, onCancel }) {
  const [fromDate, setFromDate] = useState(() => nextDateForDay(origin.day))
  const [onOffline, setOnOffline] = useState('오프라인')
  const [coverPlan, setCoverPlan] = useState('')

  useEffect(() => setFromDate(nextDateForDay(origin.day)), [origin.day])

  return (
    <div className="confirm-box">
      <h3>대강 내용 확인</h3>
      <table className="confirm-table">
        <thead>
          <tr>
            <th></th>
            <th>학반</th>
            <th>요일/교시</th>
            <th>교과</th>
            <th>교사</th>
            <th>실제 날짜</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>결강 수업</td>
            <td>{origin.cell.className}</td>
            <td>{origin.day} {origin.period}교시</td>
            <td>{origin.cell.subject}</td>
            <td>{teacherName}</td>
            <td>
              <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
            </td>
          </tr>
          <tr>
            <td>대강 교사</td>
            <td>-</td>
            <td>{origin.day} {origin.period}교시 (동일)</td>
            <td>{candidate.ownSubject}</td>
            <td>{candidate.teacher}</td>
            <td>-</td>
          </tr>
        </tbody>
      </table>
      {origin.cell.special && (
        <p className="warn">
          ⚠ 특수/이동수업으로 표시된 수업입니다. 실제로 대강 처리 가능한 수업인지 다시 한 번 확인해주세요.
        </p>
      )}
      <div className="field-row">
        <label>
          온/오프라인
          <select value={onOffline} onChange={(e) => setOnOffline(e.target.value)}>
            <option value="오프라인">오프라인</option>
            <option value="온라인">온라인</option>
          </select>
        </label>
        <label style={{ flex: 1 }}>
          보강계획
          <input
            type="text"
            value={coverPlan}
            onChange={(e) => setCoverPlan(e.target.value)}
            placeholder="예: 자습, 학습지 풀이, 동영상 시청 등"
          />
        </label>
      </div>
      <div className="actions">
        <button className="primary" onClick={() => onConfirm({ fromDate, onOffline, coverPlan })}>
          이 대강 추가
        </button>
        <button onClick={onCancel}>취소</button>
      </div>
    </div>
  )
}

export function PlanPanel({ planInfo, onChange, rows, onRemoveRow, onGenerate }) {
  return (
    <div className="plan-panel">
      <h3>2. 결보강계획서 정보</h3>
      <div className="field-row">
        <label>
          결강 교사
          <input
            type="text"
            value={planInfo.teacherName}
            onChange={(e) => onChange({ ...planInfo, teacherName: e.target.value })}
            placeholder="예: 김남이"
          />
        </label>
        <label>
          사유
          <select
            value={planInfo.reason}
            onChange={(e) => onChange({ ...planInfo, reason: e.target.value })}
          >
            {REASON_OPTIONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </label>
        <label>
          신청일
          <input
            type="date"
            value={planInfo.submitDate}
            onChange={(e) => onChange({ ...planInfo, submitDate: e.target.value })}
          />
        </label>
      </div>

      <h3>3. 추가된 교체/대강 내역</h3>
      {rows.length === 0 ? (
        <p className="hint">위 시간표에서 결강시킬 수업을 클릭하고, 교체 또는 대강 대상을 선택해 추가하세요.</p>
      ) : (
        <table className="rows-table">
          <thead>
            <tr>
              <th>구분</th>
              <th>학반</th>
              <th>결강 수업</th>
              <th></th>
              <th>교체/대강 내용</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr key={idx}>
                <td>{row.type === 'cover' ? '대강' : '교체'}</td>
                <td>{row.className}</td>
                <td>
                  {row.fromDate}({row.fromDay} {row.fromPeriod}교시) {row.fromSubject}/{row.fromTeacher}
                </td>
                <td>→</td>
                <td>
                  {row.type === 'cover'
                    ? `${row.coverTeacher} (${row.coverSubject}${row.sameSubject ? ', 동과목' : ''}) - ${row.coverPlan || '보강계획 미입력'}`
                    : `${row.toDate}(${row.toDay} ${row.toPeriod}교시) ${row.toSubject}/${row.toTeacher}`}
                </td>
                <td>
                  <button className="link-btn" onClick={() => onRemoveRow(idx)}>
                    삭제
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <div className="actions">
        <button
          className="primary"
          disabled={rows.length === 0 || !planInfo.teacherName}
          onClick={onGenerate}
        >
          결보강계획서(.docx) 생성
        </button>
      </div>
    </div>
  )
}
