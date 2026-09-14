-- GS MUSUMBA R186.97 BACKEND PREFLIGHT / SAFE REPAIR
-- Run this AFTER making a real Supabase backup with the terminal commands supplied separately.
-- This script is intentionally NON-DESTRUCTIVE: it does not DROP application tables or data.

create table if not exists public.gsm_r18697_repair_log (
  id bigint generated always as identity primary key,
  repair_code text not null,
  detail jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

comment on table public.gsm_r18697_repair_log is
  'GS MUSUMBA R186.97 repair/preflight audit log. Non-destructive.';

-- Record the build being applied.
insert into public.gsm_r18697_repair_log(repair_code, detail)
values ('R186.97_FRONTEND_REPAIR', jsonb_build_object(
  'release','R186.97',
  'purpose','Timetable form restoration, service-route deduplication and print reliability',
  'destructive',false,
  'created_at',now()
));

-- Backend preflight: show whether the RPCs required by the restored timetable form exist.
with required(name) as (
  values
    ('r120_get_timetable_workspace'),
    ('r120_save_timetable_entry'),
    ('r120_archive_timetable_entry'),
    ('r120_validate_timetable'),
    ('r120_sync_timetable_assignments'),
    ('r120_publish_timetable'),
    ('r120_save_period_config'),
    ('r120_seed_slots_from_baseline'),
    ('r119_import_timetable_baseline'),
    ('r162_get_teacher_assignment_matrix'),
    ('r162_save_teacher_assignment_matrix'),
    ('r162_delete_teacher_assignment'),
    ('r136_teacher_timetable'),
    ('r18628_get_timetable_visibility'),
    ('r18628_set_future_timetable_visibility'),
    ('r18638_my_services'),
    ('r18638_service_reports'),
    ('r18638_service_report')
)
select r.name as required_rpc,
       exists (
         select 1
         from pg_proc p
         join pg_namespace n on n.oid=p.pronamespace
         where n.nspname='public' and p.proname=r.name
       ) as exists
from required r
order by r.name;

-- Store the preflight result in a compact JSON record.
insert into public.gsm_r18697_repair_log(repair_code, detail)
select 'R18697_RPC_PREFLIGHT',
       jsonb_build_object(
         'required_rpc_count',count(*),
         'present_rpc_count',count(*) filter (where exists_flag),
         'missing_rpc_count',count(*) filter (where not exists_flag),
         'missing_rpcs',coalesce(jsonb_agg(name) filter (where not exists_flag),'[]'::jsonb)
       )
from (
  select r.name,
         exists (
           select 1 from pg_proc p
           join pg_namespace n on n.oid=p.pronamespace
           where n.nspname='public' and p.proname=r.name
         ) as exists_flag
  from (values
    ('r120_get_timetable_workspace'),('r120_save_timetable_entry'),('r120_archive_timetable_entry'),
    ('r120_validate_timetable'),('r120_sync_timetable_assignments'),('r120_publish_timetable'),
    ('r120_save_period_config'),('r120_seed_slots_from_baseline'),('r119_import_timetable_baseline'),
    ('r162_get_teacher_assignment_matrix'),('r162_save_teacher_assignment_matrix'),('r162_delete_teacher_assignment'),
    ('r136_teacher_timetable'),('r18628_get_timetable_visibility'),('r18628_set_future_timetable_visibility'),
    ('r18638_my_services'),('r18638_service_reports'),('r18638_service_report')
  ) as r(name)
) q;

-- Show the current public tables without changing them.
select table_name
from information_schema.tables
where table_schema='public' and table_type='BASE TABLE'
order by table_name;

-- Show RLS state for public tables.
select schemaname, tablename, rowsecurity
from pg_tables
where schemaname='public'
order by tablename;

-- IMPORTANT:
-- If the RPC preflight reports missing functions, DO NOT create guessed functions here.
-- The application already contains the exact RPC names and parameter contracts; create the
-- missing backend functions from your known production schema/migrations, or first run:
--   supabase db pull
-- against the live project and inspect the resulting schema before changing it.
