-- GS MUSUMBA R186.76 — STUDENT ACCESS AUTHORITY
-- Applied to production Supabase project on 2026-09-09.
-- Policy: full-school student READ for SUPER_ADMIN, HEADTEACHER, DOS, DOD,
-- SECRETARY, BURSAR, LIBRARIAN; teachers only classes they teach or own as class teacher.
-- IMPORTANT: BURSAR/LIBRARIAN write access is NOT granted to student master/profile tables.

alter policy students_admin_or_teacher_read on public.students
using (
  (id = current_student_id())
  or has_any_role(array['SUPER_ADMIN','HEADTEACHER','DOS','DOD','SECRETARY','BURSAR','LIBRARIAN']::text[])
  or exists (
    select 1 from public.enrollments e
    where e.student_id = students.id
      and teacher_has_class(e.class_id)
      and e.enrollment_status='ACTIVE'
  )
);

alter policy enrolment_admin_or_teacher_read on public.enrollments
using (
  (student_id = current_student_id())
  or has_any_role(array['SUPER_ADMIN','HEADTEACHER','DOS','DOD','SECRETARY','BURSAR','LIBRARIAN']::text[])
  or teacher_has_class(class_id)
);

-- r126_find_students was replaced in production to include BURSAR/LIBRARIAN while
-- preserving TEACHER class scope and redacting guardian phone outside authorized scope.
-- r18676_student_directory was created as the safe role-aware directory RPC.
-- See R186.76_ACCESS_LOGIN_QA.txt for verified production behavior.
