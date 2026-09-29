# R188 checklist coverage and test handoff

The implementation uses the exact non-empty supporting-document strings from the supplied **DoS Evaluation Tool** and **DoD** worksheets: DOS B19:B52 (26 rows) and DOD B19:B47 (24 rows). Section headings, indicators, subtotals and totals are intentionally not emitted as reports/evidence, per the source rules.

Each catalogue record persists worksheet, coordinate, role, immutable raw string, reporting period, report fields, evidence and audit data. Every record starts as `Missing Evidence`; an Annex number appears only after an actual URL/linked record is saved.

| Scope | Source/module | Data/evidence status | Memo | Test status |
|---|---|---|---|---|
| 26 DOS rows B19:B52 | R188 DOS Checklist Reports | Manual verified input or real linked evidence; no fabricated data | Generated title preserves raw name | Implemented but not tested against DB |
| 24 DOD rows B19:B47 | R188 DOD Checklist Reports | Manual verified input or real linked evidence; no fabricated data | Generated title preserves raw name | Implemented but not tested against DB |
| HT feedback | `checklist_memo_reviews` test migration | Comment, recommendation, decision, owner, due date, reviewer/sign date schema | Submission/revision audit schema | Blocked by absent test schema/auth mapping |

Before testing, bind `r188_role()` to the deployed authoritative staff-profile role source; this export contains no database schema from which that table can safely be guessed. Then run the migration only in a non-production Supabase project and test DOS/DOD draft-save, update, annex URL, print/PDF, HT review, returned revision, denial for Teacher/Secretary, empty evidence and persistence.
