import { supabase } from './supabase'
import { withTimeout } from './withTimeout'

export async function saveSwapRequests({ teacherName, reason, submitDate, rows }) {
  const records = rows.map((row) => ({
    teacher_name: teacherName,
    reason,
    submit_date: submitDate,
    class_name: row.className,
    from_day: row.fromDay,
    from_period: row.fromPeriod,
    from_subject: row.fromSubject,
    from_teacher: row.fromTeacher,
    from_date: row.fromDate,
    to_day: row.toDay,
    to_period: row.toPeriod,
    to_subject: row.toSubject,
    to_teacher: row.toTeacher,
    to_date: row.toDate,
    on_offline: row.onOffline || '오프라인',
  }))
  try {
    const { error } = await withTimeout(supabase.from('swap_requests').insert(records))
    return { error }
  } catch (e) {
    return { error: new Error('저장하지 못했습니다. Supabase 연결(.env) 설정을 확인해주세요.') }
  }
}

export async function deleteSwapRequest(id) {
  try {
    const { error } = await withTimeout(supabase.from('swap_requests').delete().eq('id', id))
    return { error }
  } catch (e) {
    return { error: new Error('삭제하지 못했습니다. Supabase 연결(.env) 설정을 확인해주세요.') }
  }
}

export async function fetchSwapsBetween(startDate, endDate) {
  try {
    const { data, error } = await withTimeout(
      supabase
        .from('swap_requests')
        .select('*')
        .gte('from_date', startDate)
        .lte('from_date', endDate)
        .order('from_date', { ascending: true })
    )
    return { data: data || [], error }
  } catch (e) {
    return { data: [], error: new Error('불러오지 못했습니다. Supabase 연결(.env) 설정을 확인해주세요.') }
  }
}
