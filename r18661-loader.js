/* R186.72 competition/production loader: login first, heavy workspace only after authentication.
   Slow-network policy: no speculative prefetch on Save-Data/2G; CSS then JS sequentially on constrained links; one retry on asset failure. */
(function(){'use strict';
 if(window.GSM_loadAppExtensions)return;
 let promise=null;const started=performance.now();
 const APP_CSS='./r18661-app.css?v=R186.72',APP_JS='./r18661-extensions.js?v=R186.72';
 const conn=()=>navigator.connection||navigator.mozConnection||navigator.webkitConnection||null;
 const slow=()=>{try{const c=conn();return !!(c&&(c.saveData||/slow-2g|2g/i.test(c.effectiveType||'')))}catch(_){return false}};
 function css(href){return new Promise((ok,bad)=>{if(document.querySelector('link[data-r18661-app]'))return ok();const l=document.createElement('link');l.rel='stylesheet';l.href=href;l.dataset.r18661App='1';l.onload=ok;l.onerror=()=>{l.remove();bad(new Error('APP_CSS_LOAD_FAILED'))};document.head.appendChild(l)})}
 function js(src){return new Promise((ok,bad)=>{if(window.__GSM_R18661_EXTENSIONS_LOADED__)return ok();const s=document.createElement('script');s.src=src;s.defer=true;s.dataset.r18661AppJs='1';s.onload=ok;s.onerror=()=>{s.remove();bad(new Error('APP_JS_LOAD_FAILED'))};document.head.appendChild(s)})}
 function retry(fn,url){return fn(url).catch(()=>new Promise((ok,bad)=>setTimeout(()=>fn(url+(url.includes('?')?'&':'?')+'retry='+Date.now()).then(ok,bad),1200)))}
 function prefetch(){try{if(slow())return;[[APP_CSS,'style'],[APP_JS,'script']].forEach(([href,as])=>{if(document.querySelector('link[data-r18661-prefetch="'+as+'"]'))return;const l=document.createElement('link');l.rel='prefetch';l.as=as;l.href=href;l.dataset.r18661Prefetch=as;document.head.appendChild(l)})}catch(_){}}
 window.GSM_loadAppExtensions=function(){if(promise)return promise;const t=performance.now();const work=slow()?retry(css,APP_CSS).then(()=>retry(js,APP_JS)):Promise.all([retry(css,APP_CSS),retry(js,APP_JS)]);promise=work.then(()=>{window.__GSM_R18661_EXTENSIONS_LOADED__=true;window.GSM_R18661_LOAD_METRICS={loaderReadyMs:Math.round(t-started),appLoadMs:Math.round(performance.now()-t),slowNetwork:slow()};return true}).catch(e=>{promise=null;throw e});return promise};
 if('requestIdleCallback'in window)requestIdleCallback(prefetch,{timeout:3200});else setTimeout(prefetch,2200);
})();
