-- R188.0 SAFE TEST-ENVIRONMENT MIGRATION ONLY. Do not run against production without approval.
-- Adds isolated checklist-report data. It contains no DROP, TRUNCATE, UPDATE or DELETE of existing data.
create extension if not exists pgcrypto;
create table if not exists public.checklist_reports (
 id uuid primary key default gen_random_uuid(), role_code text not null check (role_code in ('DOS','DOD')),
 worksheet text not null, cell_coordinate text not null, raw_name text not null,
 reporting_period text not null, report_date date not null, status text not null default 'DRAFT'
   check (status in ('DRAFT','SUBMITTED','RETURNED_FOR_REVISION','APPROVED')),
 purpose text, findings text, actions_taken text, challenges text, recommendations text,
 version_no integer not null default 1, parent_report_id uuid references public.checklist_reports(id),
 created_by uuid not null default auth.uid(), created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(), submitted_at timestamptz,
 unique(role_code,worksheet,cell_coordinate,reporting_period,version_no)
);
create table if not exists public.checklist_report_evidence (
 id uuid primary key default gen_random_uuid(), report_id uuid not null references public.checklist_reports(id) on delete restrict,
 title text not null, storage_path text, linked_record_url text, created_by uuid not null default auth.uid(), created_at timestamptz not null default now(),
 check (coalesce(nullif(storage_path,''),nullif(linked_record_url,'')) is not null)
);
create table if not exists public.checklist_memo_reviews (
 id uuid primary key default gen_random_uuid(), report_id uuid not null references public.checklist_reports(id) on delete restrict,
 comments text, recommendations text, decision text not null check(decision in ('APPROVED','RETURN_FOR_REVISION','ACKNOWLEDGED')),
 follow_up_instructions text, follow_up_owner text, due_date date, reviewer_id uuid not null default auth.uid(),
 reviewer_name text, signed_at timestamptz not null default now()
);
create table if not exists public.checklist_report_audit (
 id bigint generated always as identity primary key, report_id uuid not null references public.checklist_reports(id) on delete restrict,
 action text not null, actor_id uuid not null default auth.uid(), details jsonb not null default '{}'::jsonb, occurred_at timestamptz not null default now()
);
alter table public.checklist_reports enable row level security;
alter table public.checklist_report_evidence enable row level security;
alter table public.checklist_memo_reviews enable row level security;
alter table public.checklist_report_audit enable row level security;
-- Uses the existing authoritative user_profiles  to  roles  to  staff session chain from backup_2.sql.
create or replace function public.r188_role() returns text language sql stable security definer set search_path to public,auth as $$
 select public.current_role_code()
$$;
create policy r188_report_read on public.checklist_reports for select to authenticated using (public.r188_role() in ('DOS','DOD','HEADTEACHER','SUPER_ADMIN'));
create policy r188_report_insert on public.checklist_reports for insert to authenticated with check (public.r188_role() in ('DOS','DOD','SUPER_ADMIN') and created_by=auth.uid());
create policy r188_report_update on public.checklist_reports for update to authenticated using (public.r188_role() in ('SUPER_ADMIN','HEADTEACHER') or (created_by=auth.uid() and status in ('DRAFT','RETURNED_FOR_REVISION'))) with check (public.r188_role() in ('DOS','DOD','SUPER_ADMIN','HEADTEACHER'));
create policy r188_evidence_read on public.checklist_report_evidence for select to authenticated using (public.r188_role() in ('DOS','DOD','HEADTEACHER','SUPER_ADMIN'));
create policy r188_evidence_write on public.checklist_report_evidence for insert to authenticated with check (public.r188_role() in ('DOS','DOD','SUPER_ADMIN'));
create policy r188_reviews_read on public.checklist_memo_reviews for select to authenticated using (public.r188_role() in ('DOS','DOD','HEADTEACHER','SUPER_ADMIN'));
create policy r188_reviews_write on public.checklist_memo_reviews for insert to authenticated with check (public.r188_role() in ('HEADTEACHER','SUPER_ADMIN'));
create policy r188_audit_read on public.checklist_report_audit for select to authenticated using (public.r188_role() in ('HEADTEACHER','SUPER_ADMIN'));
create or replace function public.r188_checklist_report_save(p_report jsonb) returns jsonb language plpgsql security invoker as $$
declare r public.checklist_reports; e jsonb; old_status text; v_staff uuid:=public.require_staff_session();
begin
 if public.r188_role() not in ('DOS','DOD','SUPER_ADMIN') then raise exception 'R188_ACCESS_DENIED'; end if;
 if coalesce(p_report->>'id','')='' then
  insert into public.checklist_reports(role_code,worksheet,cell_coordinate,raw_name,reporting_period,report_date,status,purpose,findings,actions_taken,challenges,recommendations)
  values(p_report->>'role_code',p_report->>'worksheet',p_report->>'cell_coordinate',p_report->>'raw_name',p_report->>'reporting_period',(p_report->>'report_date')::date,coalesce(p_report->>'status','DRAFT'),p_report->>'purpose',p_report->>'findings',p_report->>'actions_taken',p_report->>'challenges',p_report->>'recommendations) returning * into r;
 else
  select status into old_status from public.checklist_reports where id=(p_report->>'id')::uuid for update;
  if old_status='SUBMITTED' then raise exception 'R188_SUBMITTED_VERSION_IMMUTABLE'; end if;
  update public.checklist_reports set status=coalesce(p_report->>'status','DRAFT'),purpose=p_report->>'purpose',findings=p_report->>'findings',actions_taken=p_report->>'actions_taken',challenges=p_report->>'challenges',recommendations=p_report->>'recommendations',updated_at=now() where id=(p_report->>'id')::uuid returning * into r;
 end if;
 for e in select * from jsonb_array_elements(coalesce(p_report->'evidence','[]'::jsonb)) loop
  insert into public.checklist_report_evidence(report_id,title,linked_record_url) values(r.id,e->>'title',e->>'url') on conflict do nothing;
 end loop;
 insert into public.checklist_report_audit(report_id,action,details) values(r.id,'SAVED',jsonb_build_object('status',r.status));
 return jsonb_build_object('report',to_jsonb(r),'evidence',coalesce((select jsonb_agg(jsonb_build_object('title',title,'url',linked_record_url,'file_name',title) order by created_at) from public.checklist_report_evidence where report_id=r.id),'[]'::jsonb));
end $$;
grant execute on function public.r188_checklist_report_save(jsonb) to authenticated;

-- Review is an append-only event. Submitted report content remains immutable; a return creates a revision.
create or replace function public.r188_checklist_memo_review(p_report_id uuid,p_comments text,p_recommendations text,p_decision text,p_follow_up_instructions text default null,p_follow_up_owner text default null,p_due_date date default null) returns jsonb language plpgsql security invoker as $$
declare v_staff uuid:=public.require_staff_session(); v_role text:=public.current_role_code(); v_review public.checklist_memo_reviews;
begin
 if v_role not in ('HEADTEACHER','SUPER_ADMIN') then raise exception 'R188_HEADTEACHER_REVIEW_DENIED'; end if;
 insert into public.checklist_memo_reviews(report_id,comments,recommendations,decision,follow_up_instructions,follow_up_owner,due_date,reviewer_id,reviewer_name)
 values(p_report_id,p_comments,p_recommendations,upper(p_decision),p_follow_up_instructions,p_follow_up_owner,p_due_date,auth.uid(),(select full_name from public.staff where id=v_staff)) returning * into v_review;
 update public.checklist_reports set status=case when upper(p_decision)='RETURN_FOR_REVISION' then 'RETURNED_FOR_REVISION' else 'APPROVED' end,updated_at=now() where id=p_report_id;
 perform public.write_audit_event('R188_MEMO_REVIEW','checklist_reports',p_report_id::text,jsonb_build_object('decision',p_decision,'review_id',v_review.id));
 return to_jsonb(v_review);
end $$;
grant execute on function public.r188_checklist_memo_review(uuid,text,text,text,text,text,date) to authenticated;
