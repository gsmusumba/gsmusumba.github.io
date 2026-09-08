/* GS MUSUMBA — R186.71 PERFORMANCE SHELL.
   Small login shell is pre-cached. Heavy workspace assets are cached only after authentication/on demand.
   Supabase/API responses are NEVER cached. */
const CACHE='gsm-r186-71-global-print-final-v1';
const V='R186.71';
const SHELL=[
  './index.html',
  './GS_MUSUMBA_OFFICIAL_LOGO.jpg',
  './r18661-login.css?v='+V,
  './r18661-loader.js?v='+V,
  './r186-core.js?v='+V
];
self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE)
    .then(cache=>Promise.allSettled(SHELL.map(asset=>cache.add(asset))))
    .then(()=>self.skipWaiting()));
});
self.addEventListener('activate',event=>{
  event.waitUntil(caches.keys()
    .then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key))))
    .then(()=>self.clients.claim()));
});
self.addEventListener('fetch',event=>{
  const req=event.request;
  const url=new URL(req.url);
  if(req.method!=='GET') return;
  if(url.hostname.includes('supabase.co')) return;
  if(req.mode==='navigate'){
    event.respondWith((async()=>{
      const cache=await caches.open(CACHE);
      try{
        const fresh=await fetch(req,{cache:'no-store'});
        if(fresh&&fresh.ok) cache.put('./index.html',fresh.clone());
        return fresh;
      }catch(_){
        return (await cache.match('./index.html')) || Response.error();
      }
    })());
    return;
  }
  if(url.origin!==self.location.origin) return;
  event.respondWith((async()=>{
    const cache=await caches.open(CACHE);
    const cached=await cache.match(req);
    if(cached){
      event.waitUntil(fetch(req,{cache:'no-store'}).then(resp=>{
        if(resp&&resp.ok) return cache.put(req,resp.clone());
      }).catch(()=>{}));
      return cached;
    }
    try{
      const fresh=await fetch(req);
      if(fresh&&fresh.ok) cache.put(req,fresh.clone());
      return fresh;
    }catch(_){
      return Response.error();
    }
  })());
});
