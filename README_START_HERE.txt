GS MUSUMBA SCHOOL MANAGEMENT SYSTEM — R186.72 COMPETITION & PRODUCTION POLISH

OFFICIAL PRODUCTION URL
https://musumba.pages.dev/

DEPLOY ALL FILES TOGETHER. DO NOT MIX WITH OLDER R186.71 ASSETS.

R186.72 FINALIZES
- Competition-clean compact UI while preserving the approved R186.71 working architecture.
- Reduced repetitive status/authority text and removed floating PRINT SETTINGS button; Print Settings remains inside System Management.
- Protected student names and SDMS codes from truncation; controlled horizontal scrolling on narrow screens.
- Softer red attendance monitoring and compact cards/fonts without sacrificing readability.
- Class + Subject Attendance Monitoring periods: DAILY, WEEKLY, MONTHLY, TERMLY.
- Level summaries: Nursery, Primary, Secondary and Whole School — Present Boys/Girls and percentages.
- Attendance CSV/Excel + Print/PDF outputs. Timetable CSV/Excel button added where a timetable table is available.
- Attendance save actions remain at the lower-left after the roster with blue success confirmation.
- Marks bottom save/submit area preserved and visually standardized.
- 2G/Save-Data-aware heavy asset loading with one retry on flaky mobile networks.
- Production SEO/canonical/sitemap moved to https://musumba.pages.dev/.

IMPORTANT
- Supabase/API responses are never service-worker cached.
- R186.72 does not alter database schema or production data.
- <1 second cannot be certified for remote Supabase calls without live p50/p95 measurements on the target networks.
- Perform authenticated browser QA for saves and role permissions before calling the competition build final.
