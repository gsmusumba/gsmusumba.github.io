/* GS MUSUMBA — R186.79 CLEAN STAFF PORTAL CACHE.
   Students are managed records and never portal login users.
   Navigation is network-first with a short timeout to prevent stale deployments;
   cached shell is fallback only. Supabase/auth/API responses are never cached. */
const CACHE='gsm-r186-79-clean-staff-portal-v1';
const V='R186.79';
const SHELL=[
  './index.html',
  './GS_MUSUMBA_LOGO_FAST.jpg',
  './r18661-login.css?v='+V,
  './r18679-critical.css?v='+V,
  './r18661-loader.js?v='+V,
  './r186-core.js?v='+V
];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>Promise.allSettled(SHELL.map(asset=>cache.add(asset)))).then(()=>self.skipWaiting()))});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim()))});
function timeout(ms){return new Promise((_,reject)=>setTimeout(()=>reject(new Error('TIMEOUT')),ms))}
self.addEventListener('fetch',event=>{
  const req=event.request,url=new URL(req.url);if(req.method!=='GET')return;if(url.hostname.includes('supabase.co'))return;
  if(req.mode==='navigate'){
    event.respondWith((async()=>{const cache=await caches.open(CACHE);try{const fresh=await Promise.race([fetch(req,{cache:'no-store'}),timeout(1800)]);if(fresh&&fresh.ok){cache.put('./index.html',fresh.clone());return fresh}}catch(_){}const cached=await cache.match('./index.html');if(cached)return cached;return fetch(req,{cache:'no-store'})})());return;
  }
  if(url.origin!==self.location.origin)return;
  event.respondWith((async()=>{const cache=await caches.open(CACHE),cached=await cache.match(req);if(cached){event.waitUntil(fetch(req,{cache:'no-store'}).then(resp=>{if(resp&&resp.ok)return cache.put(req,resp.clone())}).catch(()=>{}));return cached}try{const fresh=await fetch(req,{cache:'no-store'});if(fresh&&fresh.ok)cache.put(req,fresh.clone());return fresh}catch(_){return Response.error()}})());
});
