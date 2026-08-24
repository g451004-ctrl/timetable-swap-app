-- ============================================================
-- 수업 교체 & 결보강계획서 앱 - Supabase DB 스키마
-- Supabase 대시보드 > SQL Editor 에서 실행하세요
-- ============================================================

-- 전체 교사 시간표 (학기당 1건, 관리자가 업로드/삭제)
create table if not exists timetables (
  id          bigint primary key default 1,
  file_name   text,
  data        jsonb not null,        -- { days, periodsByDay, teachers } (parseTimetableFile 결과)
  uploaded_at timestamptz default now(),
  constraint timetables_singleton check (id = 1)
);

-- 수업 교체(결보강) 내역 - 결보강계획서를 생성할 때마다 한 건씩 저장
create table if not exists swap_requests (
  id            uuid primary key default gen_random_uuid(),
  teacher_name  text not null,   -- 결강 교사 (신청자)
  reason        text not null,
  submit_date   date not null,
  class_name    text not null,
  from_day      text not null,
  from_period   integer not null,
  from_subject  text not null,
  from_teacher  text not null,
  from_date     date not null,
  to_day        text not null,
  to_period     integer not null,
  to_subject    text not null,
  to_teacher    text not null,
  to_date       date not null,
  on_offline    text not null default '오프라인',
  created_at    timestamptz default now()
);

create index if not exists swap_requests_from_date_idx on swap_requests(from_date);
create index if not exists swap_requests_to_date_idx on swap_requests(to_date);

-- ============================================================
-- Row Level Security (RLS) 설정
-- 읽기: 누구나 (전체 교사 공개 조회)
-- 쓰기: anon 허용 (관리자 인증은 프론트엔드에서 처리, 배드민턴 앱과 동일한 방식)
-- ============================================================
alter table timetables enable row level security;
alter table swap_requests enable row level security;

create policy "public read timetables" on timetables for select using (true);
create policy "anon write timetables"  on timetables for all using (true) with check (true);

create policy "public read swap_requests" on swap_requests for select using (true);
create policy "anon write swap_requests"  on swap_requests for all using (true) with check (true);

-- Realtime 활성화 (주간 변경 내역 화면에서 실시간 반영)
alter publication supabase_realtime add table swap_requests;
