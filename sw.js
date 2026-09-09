/* GS MUSUMBA — R186.74 DISTRICT PERFORMANCE SHELL.
   Returning navigation uses cached shell immediately and refreshes in background.
   Supabase/API/auth responses are NEVER cached. */
const CACHE='gsm-r186-74-district-dashboard-v1';
const V='R186.74';
const SHELL=[
  './index.html',
  './GS_MUSUMBA_LOGO_FAST.jpg',
  './r18661-login.css?v='+V,
  './r18673-critical.css?v='+V,
  './r18661-loader.js?v='+V,
  './r186-core.js?v='+V
];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>Promise.allSettled(SHELL.map(asset=>cache.add(asset)))).then(()=>self.skipWaiting()))});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',event=>{
  const req=event.request,url=new URL(req.url);if(req.method!=='GET')return;if(url.hostname.includes('supabase.co'))return;
  if(req.mode==='navigate'){
    event.respondWith((async()=>{const cache=await caches.open(CACHE),cached=await cache.match('./index.html');const refresh=fetch(req,{cache:'no-store'}).then(resp=>{if(resp&&resp.ok)cache.put('./index.html',resp.clone());return resp}).catch(()=>null);if(cached){event.waitUntil(refresh);return cached}return (await refresh)||Response.error()})());return;
  }
  if(url.origin!==self.location.origin)return;
  event.respondWith((async()=>{const cache=await caches.open(CACHE),cached=await cache.match(req);if(cached){event.waitUntil(fetch(req,{cache:'no-store'}).then(resp=>{if(resp&&resp.ok)return cache.put(req,resp.clone())}).catch(()=>{}));return cached}try{const fresh=await fetch(req);if(fresh&&fresh.ok)cache.put(req,fresh.clone());return fresh}catch(_){return Response.error()}})());
});
