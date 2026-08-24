import { useRef, useState } from 'react'

function AdminLoginForm({ onLogin, loading, error }) {
  const [pw, setPw] = useState('')
  return (
    <div className="upload-step">
      <h2>관리자 로그인</h2>
      <p className="hint">시간표를 등록/삭제하려면 관리자 비밀번호가 필요합니다.</p>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          onLogin(pw)
        }}
        className="field-row"
      >
        <input
          type="password"
          placeholder="비밀번호"
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          autoFocus
        />
        <button className="primary" type="submit" disabled={loading || !pw}>
          {loading ? '확인 중...' : '로그인'}
        </button>
      </form>
      {error && <p className="error">{error}</p>}
    </div>
  )
}

export default function AdminPanel({ auth, timetable }) {
  const inputRef = useRef(null)
  const [confirmDelete, setConfirmDelete] = useState(false)

  if (!auth.isAdmin) {
    return <AdminLoginForm onLogin={auth.login} loading={auth.loading} error={auth.error} />
  }

  async function handleFile(file) {
    if (!file) return
    await timetable.uploadTimetable(file)
  }

  return (
    <div className="upload-step">
      <div className="class-select-row">
        <h2>관리자 - 시간표 관리</h2>
        <button className="link-btn" onClick={auth.logout}>
          로그아웃
        </button>
      </div>

      {timetable.meta ? (
        <p className="hint">
          현재 등록된 파일: <strong>{timetable.meta.fileName}</strong> (
          {new Date(timetable.meta.uploadedAt).toLocaleString('ko-KR')} 업로드)
        </p>
      ) : (
        <p className="hint">아직 등록된 시간표가 없습니다.</p>
      )}

      <div
        className="dropzone"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault()
          handleFile(e.dataTransfer.files?.[0])
        }}
        onClick={() => inputRef.current?.click()}
      >
        {timetable.uploading
          ? '업로드 중...'
          : '새 전체 교사 시간표(.xlsx)를 끌어다 놓거나 클릭하여 선택하세요'}
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.xlsm"
          style={{ display: 'none' }}
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
      </div>
      <p className="hint">새 파일을 올리면 기존 시간표를 덮어씁니다. 모든 선생님이 즉시 새 시간표를 보게 됩니다.</p>

      {timetable.meta && (
        <div style={{ marginTop: 16 }}>
          {!confirmDelete ? (
            <button onClick={() => setConfirmDelete(true)}>현재 시간표 삭제</button>
          ) : (
            <div className="actions">
              <span className="warn">정말 삭제할까요? 모든 선생님이 더 이상 시간표를 볼 수 없게 됩니다.</span>
              <button
                onClick={async () => {
                  await timetable.deleteTimetable()
                  setConfirmDelete(false)
                }}
              >
                삭제 확정
              </button>
              <button onClick={() => setConfirmDelete(false)}>취소</button>
            </div>
          )}
        </div>
      )}

      {timetable.error && <p className="error">{timetable.error}</p>}
    </div>
  )
}
