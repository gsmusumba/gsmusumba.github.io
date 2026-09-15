GS MUSUMBA R186.99 — FULL STUDENT LIST UPLOAD

UPLOAD COLUMNS
SN, Code, Names, Gender, Age, Father, Mother, Boarding Type, District, Sector, Cell, Village, Class

MATCHING
- Code / SDMS CODE is the unique matching key.
- Existing student: uploaded identification fields are synchronized.
- Blank optional upload values do not erase existing values.
- Existing health/special-needs, documents, IDs, phones and historical records are preserved.
- Class is matched to the ACTIVE class in the current academic year and the current enrollment is synchronized.
- New student: created as ACTIVE and enrolled in the uploaded class.
- Duplicate Code inside the same upload is invalid.
- Missing Code, Names, Gender or Class is invalid.
- Age must be a number from 1 to 100 when supplied.

IMPORTANT DEPLOYMENT STEP
1. Deploy the web files from this ZIP to the site.
2. Before testing SAVE & SYNCHRONIZE, open Supabase SQL Editor and run:
   R18699_FULL_STUDENT_UPLOAD.sql
3. Do NOT delete all students before testing.
4. Test with 1–3 students first.
5. Then upload the full list.

The SQL migration updates the r18636_sync_student_roster RPC. The web page alone cannot change the database RPC.
