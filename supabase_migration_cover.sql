-- ============================================================
-- 대강(대신 수업) 기능 추가 마이그레이션
-- 이미 supabase_schema.sql을 실행한 프로젝트라면 이 파일을 SQL Editor에서 실행하세요
-- ============================================================

alter table swap_requests add column if not exists type text not null default 'swap';
alter table swap_requests add constraint swap_requests_type_check check (type in ('swap', 'cover'));

alter table swap_requests alter column to_day drop not null;
alter table swap_requests alter column to_period drop not null;
alter table swap_requests alter column to_subject drop not null;
alter table swap_requests alter column to_teacher drop not null;
alter table swap_requests alter column to_date drop not null;

alter table swap_requests add column if not exists cover_teacher text;
alter table swap_requests add column if not exists cover_subject text;
alter table swap_requests add column if not exists same_subject boolean;
alter table swap_requests add column if not exists cover_plan text;
