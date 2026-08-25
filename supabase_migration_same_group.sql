-- ============================================================
-- 대강 후보의 "동교과(군)" 여부를 별도로 저장하기 위한 마이그레이션
-- (supabase_migration_cover.sql을 이미 실행한 프로젝트에서 실행하세요)
-- ============================================================

alter table swap_requests add column if not exists same_group boolean;
