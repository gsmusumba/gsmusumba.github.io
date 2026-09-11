/* GS MUSUMBA — R186.86 EMERGENCY SERVICE-WORKER RECOVERY.
   This worker intentionally DOES NOT intercept fetches. It removes old GSM caches
   and unregisters itself so navigation always uses the live Cloudflare network. */
const V='R186.86';
self.addEventListener('install', event => { self.skipWaiting(); });
self.addEventListener('activate', event => {
  event.waitUntil((async()=>{
    try{
      const keys=await caches.keys();
      await Promise.all(keys.filter(k=>/^gsm-/i.test(k)).map(k=>caches.delete(k)));
    }catch(_){}
    try{await self.registration.unregister();}catch(_){}
    try{await self.clients.claim();}catch(_){}
  })());
});
self.addEventListener('message', event => {
  if(!event.data || !/PURGE|UNREGISTER|RECOVERY/i.test(String(event.data.type||''))) return;
  event.waitUntil((async()=>{
    try{const keys=await caches.keys();await Promise.all(keys.filter(k=>/^gsm-/i.test(k)).map(k=>caches.delete(k)));}catch(_){}
    try{await self.registration.unregister();}catch(_){}
  })());
});
