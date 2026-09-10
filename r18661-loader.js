/* GS MUSUMBA R186.83 conditional authenticated workspace loader.
   TEACHER gets a lean dedicated portal and does NOT load the historical heavy workspace bundles.
   Other roles keep the proven R186.82 workspace until they are migrated one role at a time. */
(function(){'use strict';
 if(window.GSM_loadAppExtensions)return;
 let promise=null;const started=performance.now();
 const V='R186.83';
 const APP_CSS='./r18661-app.css?v='+V,APP_JS='./r18661-extensions.js?v='+V,FINAL_CSS='./r18681-final.css?v='+V,FINAL_JS='./r18681-final.js?v='+V;
 const TEACHER_CSS='./teacher-portal.css?v='+V,TEACHER_JS='./teacher-portal.js?v='+V;
 const conn=()=>navigator.connection||navigator.mozConnection||navigator.webkitConnection||null;
 const slow=()=>{try{const c=conn();return !!(c&&(c.saveData||/slow-2g|2g/i.test(c.effectiveType||'')))}catch(_){return false}};
 const role=()=>String(window.BOOT&&window.BOOT.profile&&window.BOOT.profile.role_code||'').toUpperCase().replace(/[^A-Z_]/g,'');
 function addCss(href,key){return new Promise((ok,bad)=>{if(document.querySelector('link[data-gsm-load="'+key+'"]'))return ok();const l=document.createElement('link');l.rel='stylesheet';l.href=href;l.dataset.gsmLoad=key;l.onload=ok;l.onerror=()=>{l.remove();bad(new Error(key+'_CSS_LOAD_FAILED'))};document.head.appendChild(l)})}
 function addJs(src,key,ready){return new Promise((ok,bad)=>{if(ready&&window[ready])return ok();if(document.querySelector('script[data-gsm-load="'+key+'"]'))return ok();const s=document.createElement('script');s.src=src;s.async=false;s.dataset.gsmLoad=key;s.onload=ok;s.onerror=()=>{s.remove();bad(new Error(key+'_JS_LOAD_FAILED'))};document.head.appendChild(s)})}
 function retry(fn,url,...args){return fn(url,...args).catch(()=>new Promise((ok,bad)=>setTimeout(()=>fn(url+(url.includes('?')?'&':'?')+'retry='+Date.now(),...args).then(ok,bad),500)))}
 window.GSM_loadAppExtensions=function(){
  if(promise)return promise;const t=performance.now(),r=role();
  if(r==='TEACHER'){
    promise=Promise.all([retry(addCss,TEACHER_CSS,'teacher83'),retry(addJs,TEACHER_JS,'teacher83js','__GSM_R18683_TEACHER__')])
      .then(()=>{window.GSM_R18683_LOAD_METRICS={role:r,loaderReadyMs:Math.round(t-started),appLoadMs:Math.round(performance.now()-t),slowNetwork:slow(),leanTeacher:true,legacyTeacherBundlesLoaded:false};return true})
      .catch(e=>{promise=null;throw e});
    return promise;
  }
  promise=Promise.all([retry(addCss,APP_CSS,'app82'),retry(addJs,APP_JS,'app82js','__GSM_R18661_EXTENSIONS_LOADED__')])
    .then(()=>{window.__GSM_R18661_EXTENSIONS_LOADED__=true;return Promise.all([retry(addCss,FINAL_CSS,'final82'),retry(addJs,FINAL_JS,'final82js','__GSM_R18681_FINAL__')])})
    .then(()=>{window.GSM_R18683_LOAD_METRICS={role:r,loaderReadyMs:Math.round(t-started),appLoadMs:Math.round(performance.now()-t),slowNetwork:slow(),leanTeacher:false,legacyOtherRoles:true};return true})
    .catch(e=>{promise=null;throw e});
  return promise;
 };
})();
