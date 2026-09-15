/*
 GS MUSUMBA R187.04 — DEEP ACADEMIC CONTEXT + 20-YEAR CONTROL + MARKS LOCK

 PURPOSE
 - Keep a 20-academic-year planning horizon (2025-2026 through 2044-2045).
 - Make 2026-2027 the current ACTIVE year when today's date falls inside it.
 - Ensure the current operational term is ACTIVE and current-year classes are ACTIVE.
 - Give SUPER_ADMIN explicit academic-year LOCK / UNLOCK control.
 - Give SUPER_ADMIN explicit MARKS ENTRY LOCK / UNLOCK control per term.
 - Enforce marks lock in the database, not only in the browser UI.
 - Preserve existing assessment workflow LOCK / UNLOCK and audit trail.
 - Do not delete students, marks, assessments, timetable rows or assignments.
*/

begin;

/* ------------------------------------------------------------
   1. 20-YEAR ACADEMIC YEAR HORIZON
   ------------------------------------------------------------ */
insert into public.academic_years
  (id, school_id, year_name, start_date, end_date, status, created_at, updated_at)
select
  gen_random_uuid(),
  s.id,
  y.y::text || '-' || (y.y+1)::text,
  make_date(y.y,9,1),
  make_date(y.y+1,7,31),
  case when current_date between make_date(y.y,9,1) and make_date(y.y+1,7,31) then 'ACTIVE' else 'PLANNED' end,
  now(), now()
from public.schools s
cross join generate_series(2025,2044) as y(y)
where s.school_code='280904'
  and not exists (
    select 1 from public.academic_years ay
    where ay.school_id=s.id
      and ay.year_name=y.y::text || '-' || (y.y+1)::text
  );

/* Add generic 3-term scaffolding only where a term is missing.
   Existing official term dates are never overwritten. */
insert into public.terms
  (id, academic_year_id, term_code, term_number, start_date, end_date, status, created_at, updated_at)
select
  gen_random_uuid(), ay.id,
  'TERM ' || t.n,
  t.n,
  case t.n when 1 then ay.start_date when 2 then make_date(extract(year from ay.start_date)::int+1,1,1) else make_date(extract(year from ay.start_date)::int+1,4,1) end,
  case t.n when 1 then make_date(extract(year from ay.start_date)::int,12,31) when 2 then make_date(extract(year from ay.start_date)::int+1,3,31) else ay.end_date end,
  case when current_date between
       case t.n when 1 then ay.start_date when 2 then make_date(extract(year from ay.start_date)::int+1,1,1) else make_date(extract(year from ay.start_date)::int+1,4,1) end
       and
       case t.n when 1 then make_date(extract(year from ay.start_date)::int,12,31) when 2 then make_date(extract(year from ay.start_date)::int+1,3,31) else ay.end_date end
       then 'ACTIVE' else 'PLANNED' end,
  now(), now()
from public.academic_years ay
cross join (values (1),(2),(3)) as t(n)
where ay.year_name between '2025-2026' and '2044-2045'
  and not exists (
    select 1 from public.terms tm
    where tm.academic_year_id=ay.id and tm.term_number=t.n
  );

/* ------------------------------------------------------------
   2. EXPLICIT LOCK STATE — ACADEMIC YEAR + MARKS ENTRY
   ------------------------------------------------------------ */
alter table public.academic_years
  add column if not exists is_locked boolean not null default false,
  add column if not exists locked_at timestamptz,
  add column if not exists locked_by uuid,
  add column if not exists lock_reason text;

alter table public.terms
  add column if not exists marks_entry_locked boolean not null default false,
  add column if not exists marks_entry_locked_at timestamptz,
  add column if not exists marks_entry_locked_by uuid,
  add column if not exists marks_entry_lock_reason text;

/* ------------------------------------------------------------
   3. CURRENT DATE-AUTHORITATIVE YEAR / TERM
   ------------------------------------------------------------ */
do $$
declare
  v_year uuid;
  v_term uuid;
begin
  select ay.id into v_year
  from public.academic_years ay
  where ay.start_date <= current_date and ay.end_date >= current_date
  order by ay.start_date desc
  limit 1;

  if v_year is not null then
    select t.id into v_term
    from public.terms t
    where t.academic_year_id=v_year
      and t.start_date <= current_date and t.end_date >= current_date
    order by t.term_number
    limit 1;

    /* SQL Editor has no authenticated staff session, so the migration performs
       the same state transition directly. The audited Super Admin RPC remains
       available for later UI-controlled year/term activation. */
    update public.academic_years
       set status=case when id=v_year then 'ACTIVE' when status='ACTIVE' then 'ARCHIVED' else status end,
           updated_at=now();

    if v_term is not null then
      update public.terms
         set status=case when id=v_term then 'ACTIVE' when status='ACTIVE' then 'CLOSED' else status end,
             updated_at=now();
    end if;

    update public.classes
       set status='ACTIVE',updated_at=now()
     where academic_year_id=v_year and status='PLANNED';
  end if;
end $$;

/* ------------------------------------------------------------
   4. CONTROL API — SUPER ADMIN ONLY
   ------------------------------------------------------------ */
create or replace function public.r18704_academic_year_control()
returns jsonb
language plpgsql
security definer
set search_path to 'public','auth','pg_catalog'
as $function$
declare
  v_role text := public.current_role_code();
  v_staff uuid := public.require_staff_session();
  v_school uuid;
  v_rows jsonb;
begin
  if v_role <> 'SUPER_ADMIN' then raise exception 'SUPER_ADMIN_REQUIRED'; end if;
  select school_id into v_school from public.staff where id=v_staff;
  if v_school is null then raise exception 'STAFF_SCHOOL_REQUIRED'; end if;

  select coalesce(jsonb_agg(to_jsonb(x) order by x.start_date), '[]'::jsonb)
    into v_rows
  from (
    select
      ay.id as academic_year_id,
      ay.year_name,
      ay.start_date,
      ay.end_date,
      ay.status,
      coalesce(ay.is_locked,false) as is_locked,
      ay.locked_at,
      ay.locked_by,
      ay.lock_reason,
      coalesce((
        select jsonb_agg(jsonb_build_object(
          'term_id',t.id,
          'term_code',t.term_code,
          'term_number',t.term_number,
          'start_date',t.start_date,
          'end_date',t.end_date,
          'status',t.status,
          'marks_entry_locked',coalesce(t.marks_entry_locked,false),
          'marks_entry_locked_at',t.marks_entry_locked_at,
          'marks_entry_lock_reason',t.marks_entry_lock_reason
        ) order by t.term_number)
        from public.terms t where t.academic_year_id=ay.id
      ),'[]'::jsonb) as terms
    from public.academic_years ay
    where ay.school_id=v_school
      and ay.start_date >= make_date(2025,9,1)
      and ay.start_date < make_date(2045,9,1)
  ) x;

  return jsonb_build_object('success',true,'school_id',v_school,'years',v_rows);
end;
$function$;

grant execute on function public.r18704_academic_year_control() to authenticated;
revoke execute on function public.r18704_academic_year_control() from public;

create or replace function public.r18704_set_academic_year_lock(
  p_academic_year_id uuid,
  p_locked boolean,
  p_reason text default null
)
returns jsonb
language plpgsql
security definer
set search_path to 'public','auth','pg_catalog'
as $function$
declare
  v_role text := public.current_role_code();
  v_staff uuid := public.require_staff_session();
  v_school uuid;
  v_name text;
  v_old boolean;
begin
  if v_role <> 'SUPER_ADMIN' then raise exception 'SUPER_ADMIN_REQUIRED'; end if;
  select school_id into v_school from public.staff where id=v_staff;
  select year_name,is_locked into v_name,v_old
  from public.academic_years
  where id=p_academic_year_id and school_id=v_school
  for update;
  if v_name is null then raise exception 'ACADEMIC_YEAR_NOT_FOUND'; end if;
  if nullif(btrim(coalesce(p_reason,'')),'') is null then raise exception 'LOCK_REASON_REQUIRED'; end if;

  update public.academic_years
     set is_locked=p_locked,
         locked_at=case when p_locked then now() else null end,
         locked_by=case when p_locked then v_staff else null end,
         lock_reason=btrim(p_reason),
         updated_at=now()
   where id=p_academic_year_id;

  perform public.write_audit_event(
    case when p_locked then 'ACADEMIC_YEAR_LOCK' else 'ACADEMIC_YEAR_UNLOCK' end,
    'academic_years',p_academic_year_id::text,
    jsonb_build_object('year_name',v_name,'previous_locked',coalesce(v_old,false),'locked',p_locked,'reason',btrim(p_reason))
  );

  return jsonb_build_object('success',true,'academic_year_id',p_academic_year_id,'year_name',v_name,'is_locked',p_locked);
end;
$function$;

grant execute on function public.r18704_set_academic_year_lock(uuid,boolean,text) to authenticated;
revoke execute on function public.r18704_set_academic_year_lock(uuid,boolean,text) from public;

create or replace function public.r18704_set_marks_entry_lock(
  p_academic_year_id uuid,
  p_term_id uuid,
  p_locked boolean,
  p_reason text default null
)
returns jsonb
language plpgsql
security definer
set search_path to 'public','auth','pg_catalog'
as $function$
declare
  v_role text := public.current_role_code();
  v_staff uuid := public.require_staff_session();
  v_school uuid;
  v_term text;
  v_old boolean;
begin
  if v_role <> 'SUPER_ADMIN' then raise exception 'SUPER_ADMIN_REQUIRED'; end if;
  select school_id into v_school from public.staff where id=v_staff;
  select term_code,marks_entry_locked into v_term,v_old
  from public.terms t
  join public.academic_years ay on ay.id=t.academic_year_id
  where t.id=p_term_id and t.academic_year_id=p_academic_year_id and ay.school_id=v_school
  for update;
  if v_term is null then raise exception 'TERM_NOT_FOUND'; end if;
  if nullif(btrim(coalesce(p_reason,'')),'') is null then raise exception 'MARKS_LOCK_REASON_REQUIRED'; end if;

  update public.terms
     set marks_entry_locked=p_locked,
         marks_entry_locked_at=case when p_locked then now() else null end,
         marks_entry_locked_by=case when p_locked then v_staff else null end,
         marks_entry_lock_reason=btrim(p_reason),
         updated_at=now()
   where id=p_term_id;

  perform public.write_audit_event(
    case when p_locked then 'MARKS_ENTRY_LOCK' else 'MARKS_ENTRY_UNLOCK' end,
    'terms',p_term_id::text,
    jsonb_build_object('academic_year_id',p_academic_year_id,'term_code',v_term,'previous_locked',coalesce(v_old,false),'locked',p_locked,'reason',btrim(p_reason))
  );

  return jsonb_build_object('success',true,'academic_year_id',p_academic_year_id,'term_id',p_term_id,'term_code',v_term,'marks_entry_locked',p_locked);
end;
$function$;

grant execute on function public.r18704_set_marks_entry_lock(uuid,uuid,boolean,text) to authenticated;
revoke execute on function public.r18704_set_marks_entry_lock(uuid,uuid,boolean,text) from public;

create or replace function public.r18704_marks_entry_status(p_academic_year_id uuid,p_term_id uuid)
returns jsonb
language plpgsql
stable security definer
set search_path to 'public','auth','pg_catalog'
as $function$
declare
  v_staff uuid := public.require_staff_session();
  v_school uuid;
  v_year_locked boolean;
  v_marks_locked boolean;
  v_year text;
  v_term text;
begin
  select school_id into v_school from public.staff where id=v_staff;
  select ay.year_name,coalesce(ay.is_locked,false) into v_year,v_year_locked
  from public.academic_years ay
  where ay.id=p_academic_year_id and ay.school_id=v_school;
  if v_year is null then raise exception 'ACADEMIC_YEAR_NOT_FOUND'; end if;
  select t.term_code,coalesce(t.marks_entry_locked,false) into v_term,v_marks_locked
  from public.terms t
  where t.id=p_term_id and t.academic_year_id=p_academic_year_id;
  if v_term is null then raise exception 'TERM_NOT_FOUND'; end if;
  return jsonb_build_object(
    'success',true,
    'academic_year_id',p_academic_year_id,'academic_year',v_year,'academic_year_locked',v_year_locked,
    'term_id',p_term_id,'term',v_term,'marks_entry_locked',v_marks_locked,
    'effective_marks_locked',(v_year_locked or v_marks_locked)
  );
end;
$function$;

grant execute on function public.r18704_marks_entry_status(uuid,uuid) to authenticated;
revoke execute on function public.r18704_marks_entry_status(uuid,uuid) from public;

/* ------------------------------------------------------------
   5. MARKS BACKEND HARD GATE
   ------------------------------------------------------------ */

CREATE OR REPLACE FUNCTION public.save_teacher_marks(p_assessment_id uuid, p_rows jsonb, p_submit boolean DEFAULT false)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'auth'
AS $function$
declare
    v_staff uuid;
    v_role text;
    v_a public.assessments%rowtype;
    v_expected integer;
    v_supplied integer;
    v_distinct integer;
    v_completed integer;
    v_changes jsonb;
    v_year_locked boolean := false;
    v_marks_locked boolean := false;
begin
    v_staff := public.require_staff_session();
    v_role := public.current_role_code();
    if v_role<>'TEACHER' then raise exception 'MARKS_ENTRY_TEACHER_ONLY'; end if;

    select * into v_a from public.assessments where id=p_assessment_id for update;
    if v_a.id is null then raise exception 'ASSESSMENT_NOT_FOUND'; end if;
    if not public.can_manage_marks(v_a.class_id,v_a.subject_id) then raise exception 'MARKS_SCOPE_DENIED'; end if;
    select coalesce(ay.is_locked,false), coalesce(t.marks_entry_locked,false) into v_year_locked,v_marks_locked
      from public.academic_years ay join public.terms t on t.academic_year_id=ay.id
     where ay.id=v_a.academic_year_id and t.id=v_a.term_id;
    if coalesce(v_year_locked,false) or coalesce(v_marks_locked,false) then
      raise exception 'MARKS_ENTRY_LOCKED';
    end if;
    if v_a.workflow_status not in ('DRAFT','RETURNED') then raise exception 'MARKS_NOT_EDITABLE: %',v_a.workflow_status; end if;
    if p_rows is null or jsonb_typeof(p_rows)<>'array' then raise exception 'MARK_ROWS_MUST_BE_ARRAY'; end if;

    select count(*) into v_expected
    from public.enrollments e join public.students st on st.id=e.student_id
    where e.academic_year_id=v_a.academic_year_id and e.class_id=v_a.class_id
      and e.enrollment_status='ACTIVE' and st.status='ACTIVE';

    select count(*),count(distinct x.student_id) into v_supplied,v_distinct
    from jsonb_to_recordset(p_rows) as x(student_id uuid,mark numeric,mark_status text,remarks text);
    if v_supplied<>v_distinct then raise exception 'DUPLICATE_STUDENT_IN_MARK_BATCH'; end if;

    if exists(
      select 1 from jsonb_to_recordset(p_rows) as x(student_id uuid,mark numeric,mark_status text,remarks text)
      where upper(coalesce(nullif(btrim(x.mark_status),''),'MARK')) not in ('MARK','A','E','S','N','P')
    ) then raise exception 'INVALID_MARK_STATUS'; end if;

    if exists(
      select 1 from jsonb_to_recordset(p_rows) as x(student_id uuid,mark numeric,mark_status text,remarks text)
      where (
        upper(coalesce(nullif(btrim(x.mark_status),''),'MARK'))='MARK'
        and (x.mark is null or x.mark<0 or x.mark>v_a.max_mark)
      ) or (
        upper(coalesce(nullif(btrim(x.mark_status),''),'MARK')) in ('A','E','S','N','P')
        and x.mark is not null
      )
    ) then raise exception 'INVALID_MARK_OR_STATUS_FOR_MAXIMUM_%',v_a.max_mark; end if;

    if exists(
      select 1
      from jsonb_to_recordset(p_rows) as x(student_id uuid,mark numeric,mark_status text,remarks text)
      left join public.enrollments e on e.student_id=x.student_id and e.academic_year_id=v_a.academic_year_id
        and e.class_id=v_a.class_id and e.enrollment_status='ACTIVE'
      left join public.students st on st.id=x.student_id and st.status='ACTIVE'
      where e.id is null or st.id is null
    ) then raise exception 'STUDENT_OUTSIDE_ACTIVE_CLASS_ROSTER'; end if;

    select coalesce(jsonb_agg(jsonb_build_object(
      'student_id',x.student_id,'old_mark',m.mark,'new_mark',x.mark,
      'old_status',case when m.id is null then null else m.mark_status end,
      'new_status',upper(coalesce(nullif(btrim(x.mark_status),''),'MARK'))
    )) filter(where m.mark is distinct from x.mark
       or (case when m.id is null then null else m.mark_status end) is distinct from upper(coalesce(nullif(btrim(x.mark_status),''),'MARK'))
       or m.remarks is distinct from x.remarks),'[]'::jsonb)
    into v_changes
    from jsonb_to_recordset(p_rows) as x(student_id uuid,mark numeric,mark_status text,remarks text)
    left join public.marks m on m.assessment_id=v_a.id and m.student_id=x.student_id;

    insert into public.marks(assessment_id,student_id,mark,is_absent,remarks,entered_by,mark_status)
    select v_a.id,x.student_id,
      case when upper(coalesce(nullif(btrim(x.mark_status),''),'MARK'))='MARK' then x.mark else null end,
      upper(coalesce(nullif(btrim(x.mark_status),''),'MARK'))='A',
      nullif(btrim(coalesce(x.remarks,'')),''),v_staff,
      upper(coalesce(nullif(btrim(x.mark_status),''),'MARK'))
    from jsonb_to_recordset(p_rows) as x(student_id uuid,mark numeric,mark_status text,remarks text)
    on conflict (assessment_id,student_id) do update set
      mark=excluded.mark,is_absent=excluded.is_absent,remarks=excluded.remarks,
      entered_by=excluded.entered_by,entered_at=now(),mark_status=excluded.mark_status,updated_at=now();

    -- N/P are deliberately not completion statuses; they preserve state but prevent final Submit.
    select count(*) into v_completed
    from public.marks m
    join public.enrollments e on e.student_id=m.student_id and e.academic_year_id=v_a.academic_year_id
      and e.class_id=v_a.class_id and e.enrollment_status='ACTIVE'
    join public.students st on st.id=m.student_id and st.status='ACTIVE'
    where m.assessment_id=v_a.id
      and ((m.mark_status='MARK' and m.mark is not null) or m.mark_status in ('A','E','S'));

    if p_submit and v_completed<>v_expected then
      raise exception 'INCOMPLETE_MARKS: expected %, completed %',v_expected,v_completed;
    end if;

    if p_submit then
      update public.assessments set workflow_status='SUBMITTED',status='OPEN',submitted_by=v_staff,submitted_at=now(),
        return_reason=null,correction_deadline=null,updated_at=now() where id=v_a.id;
    else
      update public.assessments set workflow_status=case when workflow_status='RETURNED' then 'RETURNED' else 'DRAFT' end,
        updated_at=now() where id=v_a.id;
    end if;

    perform public.write_audit_event(
      case when p_submit then 'MARKS_SUBMIT' else 'MARKS_SAVE_DRAFT' end,
      'assessments',v_a.id::text,
      jsonb_build_object('class_id',v_a.class_id,'subject_id',v_a.subject_id,'assessment_name',v_a.assessment_name,
        'max_mark',v_a.max_mark,'expected_students',v_expected,'completed_students',v_completed,'changes',v_changes)
    );

    return public.get_teacher_marks_entry(v_a.id);
end;
$function$;

CREATE OR REPLACE FUNCTION public.open_or_create_teacher_assessment(p_academic_year_id uuid, p_term_id uuid, p_class_id uuid, p_subject_id uuid, p_category_id uuid, p_assessment_name text, p_max_mark numeric, p_assessment_date date DEFAULT NULL::date)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'auth'
AS $function$
declare
    v_staff uuid;
    v_role text;
    v_assessment_id uuid;
    v_creator uuid;
    v_year_locked boolean := false;
    v_marks_locked boolean := false;
    v_year_school uuid;
    v_term_year uuid;
begin
    v_staff := public.require_staff_session();
    v_role := public.current_role_code();

    if v_role<>'TEACHER' then
        raise exception 'MARKS_ENTRY_TEACHER_ONLY';
    end if;

    if not public.can_manage_marks(p_class_id,p_subject_id) then
        raise exception 'MARKS_SCOPE_DENIED';
    end if;
    select ay.school_id,coalesce(ay.is_locked,false),t.academic_year_id,coalesce(t.marks_entry_locked,false)
      into v_year_school,v_year_locked,v_term_year,v_marks_locked
      from public.academic_years ay join public.terms t on t.academic_year_id=ay.id
     where ay.id=p_academic_year_id and t.id=p_term_id;
    if v_year_school is null or v_year_school<>(select school_id from public.staff where id=v_staff) or v_term_year is distinct from p_academic_year_id then
        raise exception 'INVALID_ACADEMIC_CONTEXT';
    end if;
    if coalesce(v_year_locked,false) or coalesce(v_marks_locked,false) then
        raise exception 'MARKS_ENTRY_LOCKED';
    end if;

    if nullif(btrim(coalesce(p_assessment_name,'')),'') is null then
        raise exception 'ASSESSMENT_NAME_REQUIRED';
    end if;

    if p_max_mark is null or p_max_mark<=0 then
        raise exception 'INVALID_MAX_MARK';
    end if;

    if not exists (
        select 1 from public.assessment_categories ac
        where ac.id=p_category_id and ac.status='ACTIVE'
    ) then
        raise exception 'ACTIVE_ASSESSMENT_CATEGORY_REQUIRED';
    end if;

    select a.id,a.created_by
      into v_assessment_id,v_creator
      from public.assessments a
     where a.term_id=p_term_id
       and a.class_id=p_class_id
       and a.subject_id=p_subject_id
       and a.category_id=p_category_id
       and a.assessment_name=btrim(p_assessment_name)
     limit 1;

    if v_assessment_id is not null
       and v_role='TEACHER'
       and v_creator is distinct from v_staff then
        raise exception 'ASSESSMENT_OWNED_BY_ANOTHER_TEACHER';
    end if;

    if v_assessment_id is null then
        insert into public.assessments(
            academic_year_id,term_id,class_id,subject_id,category_id,
            assessment_name,max_mark,assessment_date,status,created_by,
            workflow_status
        )
        values(
            p_academic_year_id,p_term_id,p_class_id,p_subject_id,p_category_id,
            btrim(p_assessment_name),p_max_mark,p_assessment_date,'DRAFT',
            v_staff,'DRAFT'
        )
        returning id into v_assessment_id;

        perform public.write_audit_event(
            'ASSESSMENT_CREATE',
            'assessments',
            v_assessment_id::text,
            jsonb_build_object(
                'class_id',p_class_id,
                'subject_id',p_subject_id,
                'category_id',p_category_id,
                'assessment_name',btrim(p_assessment_name),
                'max_mark',p_max_mark
            )
        );
    else
        if exists (
            select 1 from public.assessments
            where id=v_assessment_id
              and workflow_status in ('DRAFT','RETURNED')
        ) then
            update public.assessments
               set max_mark=p_max_mark,
                   assessment_date=p_assessment_date,
                   updated_at=now()
             where id=v_assessment_id;
        end if;
    end if;

    return public.get_teacher_marks_entry(v_assessment_id);
end;
$function$;

CREATE OR REPLACE FUNCTION public.get_teacher_marks_entry(p_assessment_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'auth'
AS $function$
declare
    v_staff uuid;
    v_a public.assessments%rowtype;
    v_year_locked boolean := false;
    v_marks_locked boolean := false;
begin
    v_staff := public.require_staff_session();

    select *
      into v_a
      from public.assessments
     where id=p_assessment_id;

    if v_a.id is null then
        raise exception 'ASSESSMENT_NOT_FOUND';
    end if;

    if not public.can_manage_marks(v_a.class_id,v_a.subject_id) then
        raise exception 'MARKS_SCOPE_DENIED';
    end if;
    select coalesce(ay.is_locked,false),coalesce(t.marks_entry_locked,false) into v_year_locked,v_marks_locked
      from public.academic_years ay join public.terms t on t.academic_year_id=ay.id
     where ay.id=v_a.academic_year_id and t.id=v_a.term_id;

    return jsonb_build_object(
        'assessment',jsonb_build_object(
            'id',v_a.id,
            'academic_year_id',v_a.academic_year_id,
            'term_id',v_a.term_id,
            'class_id',v_a.class_id,
            'subject_id',v_a.subject_id,
            'category_id',v_a.category_id,
            'assessment_name',v_a.assessment_name,
            'max_mark',v_a.max_mark,
            'assessment_date',v_a.assessment_date,
            'workflow_status',v_a.workflow_status,
            'academic_year_locked',coalesce(v_year_locked,false),
            'marks_entry_locked',coalesce(v_marks_locked,false),
            'effective_marks_locked',(coalesce(v_year_locked,false) or coalesce(v_marks_locked,false)),
            'editable',(
                (public.current_role_code()<>'TEACHER'
                 or v_a.workflow_status in ('DRAFT','RETURNED'))
                and not (coalesce(v_year_locked,false) or coalesce(v_marks_locked,false))
            )
        ),
        'expected_students',(
            select count(*)
            from public.enrollments e
            join public.students st on st.id=e.student_id
            where e.academic_year_id=v_a.academic_year_id
              and e.class_id=v_a.class_id
              and e.enrollment_status='ACTIVE'
              and st.status='ACTIVE'
        ),
        'roster',coalesce((
            select jsonb_agg(
                jsonb_build_object(
                    'student_id',st.id,
                    'sdms_code',st.sdms_code,
                    'student_name',st.full_name,
                    'sex',st.sex,
                    'mark',m.mark,
                    'mark_status',case
                        when m.id is null then null
                        else m.mark_status
                    end,
                    'remarks',m.remarks
                )
                order by st.full_name,st.sdms_code
            )
            from public.enrollments e
            join public.students st on st.id=e.student_id
            left join public.marks m
              on m.assessment_id=v_a.id
             and m.student_id=st.id
            where e.academic_year_id=v_a.academic_year_id
              and e.class_id=v_a.class_id
              and e.enrollment_status='ACTIVE'
              and st.status='ACTIVE'
        ),'[]'::jsonb)
    );
end;
$function$;

grant execute on function public.save_teacher_marks(uuid,jsonb,boolean) to authenticated;
grant execute on function public.open_or_create_teacher_assessment(uuid,uuid,uuid,uuid,uuid,text,numeric,date) to authenticated;
grant execute on function public.get_teacher_marks_entry(uuid) to authenticated;

/* PostgREST schema reload */
select pg_notify('pgrst','reload schema');
commit;

/* ------------------------------------------------------------
   VERIFICATION — read-only audit queries
   ------------------------------------------------------------ */
select year_name,start_date,end_date,status,coalesce(is_locked,false) as is_locked
from public.academic_years
where year_name between '2025-2026' and '2044-2045'
order by start_date;

select ay.year_name,t.term_code,t.term_number,t.status,coalesce(t.marks_entry_locked,false) as marks_entry_locked
from public.academic_years ay join public.terms t on t.academic_year_id=ay.id
where ay.year_name between '2025-2026' and '2044-2045'
order by ay.start_date,t.term_number;

select
  (select count(*) from public.academic_years ay where ay.year_name between '2025-2026' and '2044-2045') as academic_year_count,
  (select count(*) from public.terms t join public.academic_years ay on ay.id=t.academic_year_id where ay.year_name between '2025-2026' and '2044-2045') as term_count,
  (select count(*) from public.academic_years ay where ay.status='ACTIVE' and current_date between ay.start_date and ay.end_date) as current_date_active_years,
  (select count(*) from public.terms t where t.status='ACTIVE' and current_date between t.start_date and t.end_date) as current_date_active_terms;
