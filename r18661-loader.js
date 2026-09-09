/* GS MUSUMBA R186.76 final compact/contrast loader.
   Heavy workspace CSS/JS load in parallel AFTER authenticated shell becomes visible.
   No speculative prefetch on Save-Data/2G. */
(function(){'use strict';
 if(window.GSM_loadAppExtensions)return;
 let promise=null;const started=performance.now();
 const APP_CSS='./r18661-app.css?v=R186.76',APP_JS='./r18661-extensions.js?v=R186.76';
 const conn=()=>navigator.connection||navigator.mozConnection||navigator.webkitConnection||null;
 const slow=()=>{try{const c=conn();return !!(c&&(c.saveData||/slow-2g|2g/i.test(c.effectiveType||'')))}catch(_){return false}};
 function css(href){return new Promise((ok,bad)=>{if(document.querySelector('link[data-r18661-app]'))return ok();const l=document.createElement('link');l.rel='stylesheet';l.href=href;l.dataset.r18661App='1';l.onload=ok;l.onerror=()=>{l.remove();bad(new Error('APP_CSS_LOAD_FAILED'))};document.head.appendChild(l)})}
 function js(src){return new Promise((ok,bad)=>{if(window.__GSM_R18661_EXTENSIONS_LOADED__)return ok();const s=document.createElement('script');s.src=src;s.async=true;s.dataset.r18661AppJs='1';s.onload=ok;s.onerror=()=>{s.remove();bad(new Error('APP_JS_LOAD_FAILED'))};document.head.appendChild(s)})}
 function retry(fn,url){return fn(url).catch(()=>new Promise((ok,bad)=>setTimeout(()=>fn(url+(url.includes('?')?'&':'?')+'retry='+Date.now()).then(ok,bad),650)))}
 function prefetch(){try{if(slow())return;[[APP_CSS,'style'],[APP_JS,'script']].forEach(([href,as])=>{if(document.querySelector('link[data-r18673-prefetch="'+as+'"]'))return;const l=document.createElement('link');l.rel='prefetch';l.as=as;l.href=href;l.dataset.r18673Prefetch=as;document.head.appendChild(l)})}catch(_){}}
 window.GSM_loadAppExtensions=function(){if(promise)return promise;const t=performance.now();promise=Promise.all([retry(css,APP_CSS),retry(js,APP_JS)]).then(()=>{window.__GSM_R18661_EXTENSIONS_LOADED__=true;window.GSM_R18673_LOAD_METRICS={loaderReadyMs:Math.round(t-started),appLoadMs:Math.round(performance.now()-t),slowNetwork:slow(),parallel:true};return true}).catch(e=>{promise=null;throw e});return promise};
 if('requestIdleCallback'in window)requestIdleCallback(prefetch,{timeout:2500});else setTimeout(prefetch,1800);
})();
