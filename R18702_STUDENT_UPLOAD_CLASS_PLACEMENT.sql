/* R187.02 STUDENT UPLOAD + MANUAL CLASS PLACEMENT */
create or replace function public.r18636_sync_student_roster(
  p_academic_year_id uuid,
  p_rows jsonb,
  p_source_file text default 'MANUAL_STUDENT_LIST'
)
returns jsonb language plpgsql security definer
set search_path to 'public','auth','pg_catalog' as $function$
declare
  v_role text:=public.current_role_code(); v_staff uuid:=public.require_staff_session();
  v_school uuid; v_year_id uuid; v_year_name text; v_year_status text; x jsonb;
  v_sdms text; v_name text; v_sex text; v_age int; v_father text; v_mother text; v_boarding text;
  v_district text; v_sector text; v_cell text; v_village text; v_class_code text; v_class_id uuid; v_id uuid;
  v_old_class uuid; v_old_status text; v_profile_changed boolean; v_class_changed boolean;
  v_processed int:=0; v_updated int:=0; v_created int:=0; v_unchanged int:=0; v_moved int:=0; v_invalid int:=0; v_unassigned int:=0;
  v_seen text[]:=array[]::text[]; v_errors jsonb:='[]'::jsonb; v_completion smallint; v_workflow_status text;
begin
  if v_role not in ('SUPER_ADMIN','HEADTEACHER','SECRETARY') then raise exception 'STUDENT_ROSTER_SYNC_DENIED'; end if;
  if p_rows is null or jsonb_typeof(p_rows)<>'array' then raise exception 'STUDENT_ROSTER_ROWS_MUST_BE_ARRAY'; end if;
  if jsonb_array_length(p_rows)>2000 then raise exception 'STUDENT_ROSTER_TOO_LARGE'; end if;
  select school_id into v_school from public.staff where id=v_staff;
  select id,year_name,status into v_year_id,v_year_name,v_year_status from public.academic_years
   where id=p_academic_year_id and school_id=v_school and status in ('ACTIVE','PLANNED') limit 1;
  if v_year_id is null then raise exception 'SELECTED_ACADEMIC_YEAR_NOT_FOUND'; end if;

  for x in select * from jsonb_array_elements(p_rows) loop
    v_processed:=v_processed+1;
    v_sdms:=nullif(btrim(coalesce(x->>'sdms_code',x->>'code','')),'');
    v_name:=nullif(btrim(coalesce(x->>'student_name',x->>'names',x->>'full_name','')),'');
    v_sex:=upper(nullif(btrim(coalesce(x->>'sex',x->>'gender','')),''));
    v_class_code:=upper(nullif(btrim(coalesce(x->>'class_code',x->>'class','')),''));
    v_father:=nullif(btrim(coalesce(x->>'father',x->>'father_guardian_name','')),'');
    v_mother:=nullif(btrim(coalesce(x->>'mother',x->>'mother_guardian_name','')),'');
    v_boarding:=nullif(btrim(coalesce(x->>'boarding_type',x->>'boarding','')),'');
    v_district:=nullif(btrim(coalesce(x->>'district','')),''); v_sector:=nullif(btrim(coalesce(x->>'sector','')),'');
    v_cell:=nullif(btrim(coalesce(x->>'cell','')),''); v_village:=nullif(btrim(coalesce(x->>'village','')),'');
    if v_sex in ('M','MALE','BOY') then v_sex:='MALE'; elsif v_sex in ('F','FEMALE','GIRL') then v_sex:='FEMALE'; else v_sex:=null; end if;
    if nullif(btrim(coalesce(x->>'age','')),'') is null then v_age:=null; elsif btrim(x->>'age')~'^\d{1,3}$' then v_age:=(btrim(x->>'age'))::int; else v_age:=null; end if;
    if v_sdms is null or v_name is null or v_sex is null then
      v_invalid:=v_invalid+1; v_errors:=v_errors||jsonb_build_array(jsonb_build_object('row',v_processed,'sdms_code',v_sdms,'issue','CODE_NAME_GENDER_REQUIRED')); continue;
    end if;
    if v_age is not null and (v_age<1 or v_age>100) then
      v_invalid:=v_invalid+1; v_errors:=v_errors||jsonb_build_array(jsonb_build_object('row',v_processed,'sdms_code',v_sdms,'issue','INVALID_AGE')); continue;
    end if;
    if v_sdms=any(v_seen) then
      v_invalid:=v_invalid+1; v_errors:=v_errors||jsonb_build_array(jsonb_build_object('row',v_processed,'sdms_code',v_sdms,'issue','DUPLICATE_CODE_IN_UPLOAD')); continue;
    end if;
    v_seen:=array_append(v_seen,v_sdms); v_class_id:=null;
    if v_class_code is not null then
      select id into v_class_id from public.classes where school_id=v_school and academic_year_id=v_year_id
       and status in ('ACTIVE','PLANNED') and upper(btrim(class_code))=v_class_code limit 1;
      if v_class_id is null then
        v_invalid:=v_invalid+1; v_errors:=v_errors||jsonb_build_array(jsonb_build_object('row',v_processed,'sdms_code',v_sdms,'class',v_class_code,'issue','INVALID_SELECTED_YEAR_CLASS')); continue;
      end if;
    end if;
    select id into v_id from public.students where school_id=v_school and sdms_code=v_sdms limit 1;
    if v_id is null then
      insert into public.students(school_id,sdms_code,full_name,sex,status,first_year,reported_age,boarding_type,father_guardian_name,mother_guardian_name,district,sector,cell,village)
      values(v_school,v_sdms,v_name,v_sex,'ACTIVE',v_year_name,v_age,v_boarding,v_father,v_mother,v_district,v_sector,v_cell,v_village) returning id into v_id;
      v_created:=v_created+1;
      if v_class_id is not null then
        insert into public.enrollments(student_id,academic_year_id,class_id,enrollment_status,enrolled_at,ended_at) values(v_id,v_year_id,v_class_id,'ACTIVE',now(),null)
        on conflict(student_id,academic_year_id) do update set class_id=excluded.class_id,enrollment_status='ACTIVE',ended_at=null,updated_at=now();
      else v_unassigned:=v_unassigned+1; end if;
    else
      select class_id,enrollment_status into v_old_class,v_old_status from public.enrollments where student_id=v_id and academic_year_id=v_year_id limit 1;
      v_profile_changed:=exists(select 1 from public.students s where s.id=v_id and (
        s.full_name is distinct from v_name or upper(coalesce(s.sex,'')) is distinct from v_sex or (v_age is not null and s.reported_age is distinct from v_age)
        or (v_boarding is not null and s.boarding_type is distinct from v_boarding) or (v_father is not null and s.father_guardian_name is distinct from v_father)
        or (v_mother is not null and s.mother_guardian_name is distinct from v_mother) or (v_district is not null and s.district is distinct from v_district)
        or (v_sector is not null and s.sector is distinct from v_sector) or (v_cell is not null and s.cell is distinct from v_cell)
        or (v_village is not null and s.village is distinct from v_village) or s.status is distinct from 'ACTIVE'));
      update public.students set full_name=v_name,sex=v_sex,reported_age=coalesce(v_age,reported_age),boarding_type=coalesce(v_boarding,boarding_type),father_guardian_name=coalesce(v_father,father_guardian_name),mother_guardian_name=coalesce(v_mother,mother_guardian_name),district=coalesce(v_district,district),sector=coalesce(v_sector,sector),cell=coalesce(v_cell,cell),village=coalesce(v_village,village),status='ACTIVE',updated_at=now() where id=v_id;
      v_class_changed:=false;
      if v_class_id is not null then
        insert into public.enrollments(student_id,academic_year_id,class_id,enrollment_status,enrolled_at,ended_at) values(v_id,v_year_id,v_class_id,'ACTIVE',now(),null)
        on conflict(student_id,academic_year_id) do update set class_id=excluded.class_id,enrollment_status='ACTIVE',ended_at=null,updated_at=now();
        v_class_changed:=v_old_class is distinct from v_class_id or coalesce(v_old_status,'')<>'ACTIVE';
        if v_class_changed then
          v_moved:=v_moved+1;
          insert into public.student_class_movements(student_id,academic_year_id,from_class_id,to_class_id,from_status,to_status,reason,moved_by)
          values(v_id,v_year_id,v_old_class,v_class_id,v_old_status,'ACTIVE','R187.02 UPLOAD CLASS PLACEMENT',v_staff);
        end if;
      elsif v_old_class is null then v_unassigned:=v_unassigned+1; end if;
      if v_profile_changed then v_updated:=v_updated+1; end if;
      if not v_profile_changed and not v_class_changed then v_unchanged:=v_unchanged+1; end if;
    end if;
    select round(((case when s.date_of_birth is not null then 1 else 0 end)+(case when s.reported_age is not null then 1 else 0 end)+(case when nullif(btrim(coalesce(s.boarding_type,'')),'') is not null then 1 else 0 end)+(case when nullif(btrim(coalesce(s.father_guardian_name,'')),'') is not null then 1 else 0 end)+(case when nullif(btrim(coalesce(s.mother_guardian_name,'')),'') is not null then 1 else 0 end)+(case when nullif(btrim(coalesce(s.father_guardian_id,'')),'') is not null then 1 else 0 end)+(case when nullif(btrim(coalesce(s.mother_guardian_id,'')),'') is not null then 1 else 0 end)+(case when nullif(btrim(coalesce(s.father_guardian_phone,'')),'') is not null then 1 else 0 end)+(case when nullif(btrim(coalesce(s.mother_guardian_phone,'')),'') is not null then 1 else 0 end)+(case when nullif(btrim(coalesce(s.district,'')),'') is not null then 1 else 0 end)+(case when nullif(btrim(coalesce(s.sector,'')),'') is not null then 1 else 0 end)+(case when nullif(btrim(coalesce(s.cell,'')),'') is not null then 1 else 0 end)+(case when nullif(btrim(coalesce(s.village,'')),'') is not null then 1 else 0 end))*100.0/13.0)::smallint,coalesce((select workflow_status from public.student_identification_workflow w where w.student_id=s.id),'DRAFT') into v_completion,v_workflow_status from public.students s where s.id=v_id;
    insert into public.student_identification_workflow(student_id,workflow_status,completion_percent,last_saved_by,last_saved_at,updated_at) values(v_id,case when v_workflow_status='VERIFIED' then 'VERIFIED' else 'DRAFT' end,v_completion,v_staff,now(),now()) on conflict(student_id) do update set workflow_status=case when public.student_identification_workflow.workflow_status='VERIFIED' then 'VERIFIED' else 'DRAFT' end,completion_percent=excluded.completion_percent,last_saved_by=v_staff,last_saved_at=now(),updated_at=now();
  end loop;
  perform public.write_audit_event('R18702_STUDENT_ROSTER_SYNC','students',coalesce(nullif(btrim(p_source_file),''),'MANUAL_STUDENT_LIST'),jsonb_build_object('processed',v_processed,'created',v_created,'updated',v_updated,'unchanged',v_unchanged,'moved',v_moved,'unassigned',v_unassigned,'invalid',v_invalid,'academic_year_id',v_year_id,'academic_year',v_year_name,'class_optional',true,'matching_key','SDMS CODE'));
  return jsonb_build_object('success',true,'academic_year_id',v_year_id,'academic_year',v_year_name,'academic_year_status',v_year_status,'processed',v_processed,'created',v_created,'updated',v_updated,'unchanged',v_unchanged,'moved',v_moved,'unassigned',v_unassigned,'invalid',v_invalid,'errors',v_errors);
end;$function$;

create or replace function public.r18702_student_class_options(p_academic_year_id uuid)
returns jsonb language plpgsql stable security definer set search_path to 'public','auth','pg_catalog' as $function$
declare v_staff uuid:=public.require_staff_session(); v_role text:=public.current_role_code(); v_school uuid; v_rows jsonb;
begin
 if v_role not in ('SUPER_ADMIN','HEADTEACHER','SECRETARY') then raise exception 'STUDENT_CLASS_OPTIONS_DENIED'; end if;
 select school_id into v_school from public.staff where id=v_staff;
 if not exists(select 1 from public.academic_years where id=p_academic_year_id and school_id=v_school and status in ('ACTIVE','PLANNED')) then raise exception 'SELECTED_ACADEMIC_YEAR_NOT_FOUND'; end if;
 select coalesce(jsonb_agg(jsonb_build_object('id',c.id,'class_code',c.class_code,'class_name',c.class_name,'level',c.level,'grade_order',c.grade_order,'stream',c.stream,'status',c.status) order by c.grade_order nulls last,c.class_code),'[]'::jsonb) into v_rows from public.classes c where c.school_id=v_school and c.academic_year_id=p_academic_year_id and c.status in ('ACTIVE','PLANNED');
 return jsonb_build_object('success',true,'academic_year_id',p_academic_year_id,'rows',v_rows);
end;$function$;

create or replace function public.r18702_assign_student_class(p_student_id uuid,p_academic_year_id uuid,p_class_id uuid)
returns jsonb language plpgsql security definer set search_path to 'public','auth','pg_catalog' as $function$
declare v_staff uuid:=public.require_staff_session(); v_role text:=public.current_role_code(); v_school uuid; v_student_school uuid; v_old_class uuid; v_old_status text; v_class_code text; v_student_code text; v_student_name text;
begin
 if v_role not in ('SUPER_ADMIN','HEADTEACHER','SECRETARY') then raise exception 'STUDENT_CLASS_ASSIGN_DENIED'; end if;
 select school_id into v_school from public.staff where id=v_staff;
 select school_id,sdms_code,full_name into v_student_school,v_student_code,v_student_name from public.students where id=p_student_id;
 if v_student_school is null or v_student_school<>v_school then raise exception 'STUDENT_NOT_IN_STAFF_SCHOOL'; end if;
 if not exists(select 1 from public.academic_years where id=p_academic_year_id and school_id=v_school and status in ('ACTIVE','PLANNED')) then raise exception 'SELECTED_ACADEMIC_YEAR_NOT_FOUND'; end if;
 if p_class_id is not null then select class_code into v_class_code from public.classes where id=p_class_id and school_id=v_school and academic_year_id=p_academic_year_id and status in ('ACTIVE','PLANNED'); if v_class_code is null then raise exception 'INVALID_SELECTED_YEAR_CLASS'; end if; end if;
 select class_id,enrollment_status into v_old_class,v_old_status from public.enrollments where student_id=p_student_id and academic_year_id=p_academic_year_id limit 1;
 if p_class_id is null then
   update public.enrollments set class_id=null,enrollment_status='ACTIVE',ended_at=null,updated_at=now() where student_id=p_student_id and academic_year_id=p_academic_year_id;
 else
   insert into public.enrollments(student_id,academic_year_id,class_id,enrollment_status,enrolled_at,ended_at) values(p_student_id,p_academic_year_id,p_class_id,'ACTIVE',now(),null)
   on conflict(student_id,academic_year_id) do update set class_id=excluded.class_id,enrollment_status='ACTIVE',ended_at=null,updated_at=now();
 end if;
 if v_old_class is distinct from p_class_id or coalesce(v_old_status,'')<>'ACTIVE' then
   insert into public.student_class_movements(student_id,academic_year_id,from_class_id,to_class_id,from_status,to_status,reason,moved_by) values(p_student_id,p_academic_year_id,v_old_class,p_class_id,v_old_status,'ACTIVE','R187.02 MANUAL CLASS PLACEMENT / CHANGE',v_staff);
 end if;
 perform public.write_audit_event('R18702_MANUAL_CLASS_ASSIGNMENT','students',v_student_code,jsonb_build_object('student_id',p_student_id,'student_name',v_student_name,'academic_year_id',p_academic_year_id,'from_class_id',v_old_class,'to_class_id',p_class_id,'to_class_code',v_class_code));
 return jsonb_build_object('success',true,'student_id',p_student_id,'sdms_code',v_student_code,'student_name',v_student_name,'class_id',p_class_id,'class_code',v_class_code);
end;$function$;

revoke all on function public.r18636_sync_student_roster(uuid,jsonb,text) from public;
grant execute on function public.r18636_sync_student_roster(uuid,jsonb,text) to authenticated;
revoke all on function public.r18702_student_class_options(uuid) from public;
grant execute on function public.r18702_student_class_options(uuid) to authenticated;
revoke all on function public.r18702_assign_student_class(uuid,uuid,uuid) from public;
grant execute on function public.r18702_assign_student_class(uuid,uuid,uuid) to authenticated;
notify pgrst,'reload schema';
