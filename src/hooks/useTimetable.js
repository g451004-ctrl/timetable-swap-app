import { useState, useEffect, useCallback, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import { parseTimetableFile, buildClassView } from '../lib/parseTimetable'
import { withTimeout } from '../lib/withTimeout'

export function useTimetable() {
  const [parsed, setParsed] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [uploading, setUploading] = useState(false)
  const [meta, setMeta] = useState(null) // { fileName, uploadedAt }

  const fetchTimetable = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const { data, error: err } = await withTimeout(
        supabase.from('timetables').select('*').eq('id', 1).maybeSingle()
      )
      if (err) {
        setError('시간표를 불러오지 못했습니다: ' + err.message)
      } else if (data) {
        setParsed(data.data)
        setMeta({ fileName: data.file_name, uploadedAt: data.uploaded_at })
      } else {
        setParsed(null)
        setMeta(null)
      }
    } catch (e) {
      setError('시간표를 불러오지 못했습니다. Supabase 연결(.env) 설정을 확인해주세요.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTimetable()
  }, [fetchTimetable])

  const uploadTimetable = useCallback(async (file) => {
    setUploading(true)
    setError('')
    try {
      const buf = await file.arrayBuffer()
      const parsedData = parseTimetableFile(buf)
      if (!parsedData.teachers.length) {
        throw new Error('시간표에서 교사 데이터를 찾지 못했습니다. 파일 형식을 확인해주세요.')
      }
      // 시간표 파일을 새로 올려도 이미 등록해 둔 요일 변경은 유지한다
      const { data: current } = await withTimeout(
        supabase.from('timetables').select('data').eq('id', 1).maybeSingle()
      )
      if (current?.data?.dayOverrides) parsedData.dayOverrides = current.data.dayOverrides
      const { error: err } = await withTimeout(
        supabase
          .from('timetables')
          .upsert({ id: 1, file_name: file.name, data: parsedData, uploaded_at: new Date().toISOString() })
      )
      if (err) throw new Error(err.message)
      setParsed(parsedData)
      setMeta({ fileName: file.name, uploadedAt: new Date().toISOString() })
      return { ok: true }
    } catch (e) {
      setError(e.message)
      return { ok: false, error: e.message }
    } finally {
      setUploading(false)
    }
  }, [])

  const deleteTimetable = useCallback(async () => {
    setError('')
    try {
      const { error: err } = await withTimeout(supabase.from('timetables').delete().eq('id', 1))
      if (err) {
        setError('삭제하지 못했습니다: ' + err.message)
        return { ok: false }
      }
      setParsed(null)
      setMeta(null)
      return { ok: true }
    } catch (e) {
      setError('삭제하지 못했습니다. Supabase 연결(.env) 설정을 확인해주세요.')
      return { ok: false }
    }
  }, [])

  // 요일 변경 목록 저장. 다른 데이터(교사 이름 수정 등)를 덮어쓰지 않도록 최신 데이터를 다시 읽어 합친다.
  const saveDayOverrides = useCallback(async (overrides) => {
    setError('')
    try {
      const { data: current, error: readErr } = await withTimeout(
        supabase.from('timetables').select('data').eq('id', 1).maybeSingle()
      )
      if (readErr || !current) throw new Error(readErr?.message || '등록된 시간표가 없습니다.')
      const next = { ...current.data, dayOverrides: overrides }
      const { error: err } = await withTimeout(supabase.from('timetables').update({ data: next }).eq('id', 1))
      if (err) throw new Error(err.message)
      setParsed(next)
      return { ok: true }
    } catch (e) {
      setError('요일 변경을 저장하지 못했습니다: ' + e.message)
      return { ok: false }
    }
  }, [])

  const classMap = useMemo(() => (parsed ? buildClassView(parsed) : null), [parsed])

  return {
    parsed,
    classMap,
    meta,
    loading,
    error,
    uploading,
    uploadTimetable,
    deleteTimetable,
    saveDayOverrides,
    refetch: fetchTimetable,
  }
}
