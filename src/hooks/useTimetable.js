import { useState, useEffect, useCallback } from 'react'
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

  const classMap = parsed ? buildClassView(parsed) : null

  return { parsed, classMap, meta, loading, error, uploading, uploadTimetable, deleteTimetable, refetch: fetchTimetable }
}
