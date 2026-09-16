-- R186.71 MULTI CLASS-TEACHER AUTHORITY (REFERENCE COPY)
-- This migration was applied successfully to the live GS MUSUMBA Supabase project on 2026-09-08.
-- Do not re-run blindly; retained for audit/recovery documentation.
create or replace function public.r18671_is_class_teacher(p_staff_id uuid, p_class_id uuid, p_academic_year_id uuid)
returns boolean
language sql
stable
security definer
set search_path to 'public','auth','pg_catalog'
as $$
  select exists(
    select 1
    from public.classes c
    where c.id = p_class_id
      and c.academic_year_id = p_academic_year_id
      and c.status in ('ACTIVE','PLANNED')
      and (
        c.class_teacher_id = p_staff_id
        or exists (
          select 1
          from public.class_teacher_assignments cta
          where cta.academic_year_id = p_academic_year_id
            and cta.class_id = c.id
            and cta.staff_id = p_staff_id
            and cta.status = 'ACTIVE'
        )
      )
  );
$$;
