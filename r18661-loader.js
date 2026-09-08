/* R186.71 staged application loader: login first, heavy workspace only after authentication. */
(function(){'use strict';
 if(window.GSM_loadAppExtensions)return;
 let promise=null;const started=performance.now();
 const APP_CSS='./r18661-app.css?v=R186.71',APP_JS='./r18661-extensions.js?v=R186.71';
 function css(href){return new Promise((ok,bad)=>{if(document.querySelector('link[data-r18661-app]'))return ok();const l=document.createElement('link');l.rel='stylesheet';l.href=href;l.dataset.r18661App='1';l.onload=ok;l.onerror=()=>bad(new Error('APP_CSS_LOAD_FAILED'));document.head.appendChild(l)})}
 function js(src){return new Promise((ok,bad)=>{if(window.__GSM_R18661_EXTENSIONS_LOADED__)return ok();const s=document.createElement('script');s.src=src;s.defer=true;s.onload=ok;s.onerror=()=>bad(new Error('APP_JS_LOAD_FAILED'));document.head.appendChild(s)})}
 function prefetch(){try{const c=navigator.connection||navigator.mozConnection||navigator.webkitConnection;if(c&&(c.saveData||/2g/i.test(c.effectiveType||'')))return;[[APP_CSS,'style'],[APP_JS,'script']].forEach(([href,as])=>{if(document.querySelector('link[data-r18661-prefetch="'+as+'"]'))return;const l=document.createElement('link');l.rel='prefetch';l.as=as;l.href=href;l.dataset.r18661Prefetch=as;document.head.appendChild(l)})}catch(_){}}
 window.GSM_loadAppExtensions=function(){if(promise)return promise;const t=performance.now();promise=Promise.all([css(APP_CSS),js(APP_JS)]).then(()=>{window.__GSM_R18661_EXTENSIONS_LOADED__=true;window.GSM_R18661_LOAD_METRICS={loaderReadyMs:Math.round(t-started),appLoadMs:Math.round(performance.now()-t)};return true}).catch(e=>{promise=null;throw e});return promise};
 if('requestIdleCallback'in window)requestIdleCallback(prefetch,{timeout:2800});else setTimeout(prefetch,1800);
})();
