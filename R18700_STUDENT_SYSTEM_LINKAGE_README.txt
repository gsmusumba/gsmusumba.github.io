GS MUSUMBA R187.00 — STUDENT SYSTEM-WIDE LINKAGE

WHY THE PREVIOUS UPLOAD SHOWED NO CHANGE:
The upload RPC used the database's ACTIVE academic year, while the UI was showing/selecting 2026-2027. Student 360 also called r164_student_master_all() without passing the UI-selected academic year. Therefore an upload could update one year's enrolment while Student Management displayed another year's enrolment.

R187.00 FIX:
1. Upload uses BOOT.context.academic_year_id — the academic year selected in the UI.
2. Classes are matched only inside that selected academic year and may be ACTIVE or PLANNED.
3. Existing students are matched by SDMS CODE.
4. Uploaded identification fields update the student master; blank optional values do not erase existing values.
5. The selected year's enrolment is created/updated to the uploaded class.
6. Existing history, health/special-needs, IDs, phones and documents are preserved.
7. Student 360 reads the SAME selected academic year.
8. After successful synchronization, the system emits a gsm:students-synchronized event so an already-open Student 360 workspace can refresh.
9. No DELETE/TRUNCATE operation is included.

DEPLOY ORDER:
A) Run R18700_STUDENT_SYSTEM_LINKAGE.sql in Supabase SQL Editor.
B) Deploy the ZIP/frontend.
C) Select 2026-2027 and click APPLY.
D) Upload the 13-column list and SAVE & SYNCHRONIZE.
E) Open/refresh STUDENTS MANAGEMENT. It must now read the same selected year.

IMPORTANT:
Do NOT delete all students before testing. Test with a small 2–5 row file first.
