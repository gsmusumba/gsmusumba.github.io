/* GS MUSUMBA — R186.85 OLD-FILE ELIMINATION / CACHE AUTHORITY.
   Goals:
   1) Never resurrect an older JS/CSS/HTML release after refresh.
   2) Keep a current-release fallback for slow/offline networks.
   3) Supabase/API traffic is never cached.
*/
const V='R186.85';
const CACHE='gsm-r18685-shell-v1';
const SHELL=[
  './index.html',
  './GS_MUSUMBA_LOGO_FAST.jpg',
  './GS_MUSUMBA_OFFICIAL_LOGO.jpg',
  './r18661-login.css?v='+V,
  './r18679-critical.css?v='+V,
  './r18680-recovery.js?v='+V,
  './r18661-loader.js?v='+V,
  './r186-core.js?v='+V,
  './r18661-app.css?v='+V,
  './r18661-extensions.js?v='+V,
  './r18685-final.css?v='+V,
  './r18685-final.js?v='+V
];

self.addEventListener('install',event=>{
  event.waitUntil(
    caches.open(CACHE)
      .then(cache=>Promise.allSettled(SHELL.map(asset=>cache.add(new Request(asset,{cache:'reload'})))))
      .then(()=>self.skipWaiting())
  );
});

self.addEventListener('activate',event=>{
  event.waitUntil(
    caches.keys()
      .then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key))))
      .then(()=>self.clients.claim())
  );
});

self.addEventListener('message',event=>{
  if(!event.data||event.data.type!=='PURGE_OLD_GSM_CACHES')return;
  event.waitUntil(
    caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key))))
  );
});

function timeout(ms){return new Promise((_,reject)=>setTimeout(()=>reject(new Error('NETWORK_TIMEOUT')),ms));}
function currentUrl(req){
  const u=new URL(req.url);
  if(/\.(?:js|css)$/i.test(u.pathname))u.searchParams.set('v',V);
  return u;
}
async function networkFirst(req,fallback,ms=7000){
  const cache=await caches.open(CACHE);
  const u=currentUrl(req);
  const netReq=new Request(u.toString(),req);
  try{
    const fresh=await Promise.race([fetch(netReq,{cache:'no-store'}),timeout(ms)]);
    if(fresh&&fresh.ok){
      await cache.put(fallback||netReq,fresh.clone());
      return fresh;
    }
  }catch(_){}
  const cached=await cache.match(fallback||netReq);
  if(cached)return cached;
  return fetch(netReq,{cache:'no-store'});
}

self.addEventListener('fetch',event=>{
  const req=event.request;
  if(req.method!=='GET')return;
  const url=new URL(req.url);

  if(url.hostname.includes('supabase.co'))return;

  if(req.mode==='navigate'){
    event.respondWith(networkFirst(req,'./index.html',7000));
    return;
  }
  if(url.origin!==self.location.origin)return;

  if(/\.(?:js|css|csv)$/i.test(url.pathname)){
    event.respondWith(networkFirst(req,null,7000));
    return;
  }

  event.respondWith((async()=>{
    const cache=await caches.open(CACHE);
    const cached=await cache.match(req);
    const refresh=fetch(req,{cache:'no-store'}).then(resp=>{
      if(resp&&resp.ok)cache.put(req,resp.clone());
      return resp;
    }).catch(()=>null);
    if(cached){event.waitUntil(refresh);return cached;}
    return (await refresh)||Response.error();
  })());
});
