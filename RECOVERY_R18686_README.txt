GS MUSUMBA R186.86 EMERGENCY ACCESS RECOVERY
- Removes service-worker fetch interception that could return ERR_FAILED.
- Unregisters all existing service workers after HTML loads.
- Deletes gsm-* caches.
- Forces fresh R186.86 JS/CSS query versions.
- Preserves R186.85 UI/mobile/service/marks/timetable fixes.
One-time action for browsers already trapped by the broken worker: clear site data or use Incognito once after deployment.
