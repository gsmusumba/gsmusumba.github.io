/* GS MUSUMBA — R186.85 TEACHER FAST CACHE v2.
   - HTML navigation: short network-first, then cached shell.
   - Versioned JS/CSS/images: cached immediately, refreshed in background.
   - Supabase/API traffic is NEVER cached. */
const CACHE='gsm-r186-85-teacher-fast-v2';
const V='R186.85';
const SHELL=[
  './index.html',
  './GS_MUSUMBA_LOGO_FAST.jpg',
  './GS_MUSUMBA_OFFICIAL_LOGO.jpg',
  './r18661-login.css?v='+V,
  './r18679-critical.css?v='+V,
  './r18680-recovery.js?v='+V,
  './r18661-loader.js?v='+V,
  './r186-core.js?v='+V,
  './teacher-portal.css?v='+V,
  './teacher-portal.js?v='+V,
  './r18681-final.css?v='+V,
  './r18681-final.js?v='+V
];
self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE).then(cache=>Promise.allSettled(SHELL.map(asset=>cache.add(asset)))).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));
});
function timeout(ms){return new Promise((_,reject)=>setTimeout(()=>reject(new Error('TIMEOUT')),ms))}
async function networkFirst(req,fallbackKey,ms=1800){
  const cache=await caches.open(CACHE);
  try{
    const fresh=await Promise.race([fetch(req,{cache:'no-store'}),timeout(ms)]);
    if(fresh&&fresh.ok){cache.put(fallbackKey||req,fresh.clone());return fresh}
  }catch(_){}
  const cached=await cache.match(fallbackKey||req);
  if(cached)return cached;
  return fetch(req,{cache:'no-store'});
}
async function staleFast(req){
  const cache=await caches.open(CACHE),cached=await cache.match(req);
  const refresh=fetch(req,{cache:'no-store'}).then(resp=>{if(resp&&resp.ok)cache.put(req,resp.clone());return resp}).catch(()=>null);
  if(cached){refresh.catch(()=>{});return cached}
  const fresh=await refresh;if(fresh)return fresh;return Response.error();
}
self.addEventListener('fetch',event=>{
  const req=event.request,url=new URL(req.url);
  if(req.method!=='GET')return;
  if(url.hostname.includes('supabase.co'))return;
  if(url.origin!==self.location.origin)return;
  if(req.mode==='navigate'){event.respondWith(networkFirst(req,'./index.html',1800));return}
  if(/\.(?:js|css|jpg|jpeg|png|webp|svg)$/i.test(url.pathname)){event.respondWith(staleFast(req));return}
  event.respondWith(networkFirst(req,req,1800));
});
