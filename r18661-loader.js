/* GS MUSUMBA R186.85 — conditional authenticated workspace loader.
   TEACHER uses the lean portal only. Other roles keep the existing legacy workspace
   until they are migrated and QA-tested role by role. */
(function(){
'use strict';
if(window.GSM_loadAppExtensions)return;

const V='R186.85';
const APP_CSS='./r18661-app.css?v='+V;
const APP_JS='./r18661-extensions.js?v='+V;
const FINAL_CSS='./r18681-final.css?v='+V;
const FINAL_JS='./r18681-final.js?v='+V;
const TEACHER_CSS='./teacher-portal.css?v='+V;
const TEACHER_JS='./teacher-portal.js?v='+V;
let activePromise=null;
const bootStarted=performance.now();
const ASSET_TIMEOUT_MS=6000;

function currentRole(){
  return String(window.BOOT&&window.BOOT.profile&&window.BOOT.profile.role_code||'')
    .toUpperCase().replace(/[^A-Z_]/g,'');
}
function isSlowNetwork(){
  try{
    const c=navigator.connection||navigator.mozConnection||navigator.webkitConnection;
    return !!(c&&(c.saveData||/slow-2g|2g/i.test(c.effectiveType||'')));
  }catch(_){return false}
}
function waitExisting(el,ready){
  if(ready&&window[ready])return Promise.resolve(true);
  if(el.dataset.gsmLoaded==='1')return Promise.resolve(true);
  return new Promise((resolve,reject)=>{
    let timer=null;
    const cleanup=()=>{if(timer)clearTimeout(timer);el.removeEventListener('load',onLoad);el.removeEventListener('error',onError)};
    const onLoad=()=>{el.dataset.gsmLoaded='1';cleanup();resolve(true)};
    const onError=()=>{cleanup();reject(new Error((el.dataset.gsmLoad||'ASSET')+'_LOAD_FAILED'))};
    timer=setTimeout(()=>{cleanup();reject(new Error((el.dataset.gsmLoad||'ASSET')+'_LOAD_TIMEOUT'))},ASSET_TIMEOUT_MS);
    el.addEventListener('load',onLoad,{once:true});
    el.addEventListener('error',onError,{once:true});
  });
}
function addCss(href,key){
  const existing=document.querySelector('link[data-gsm-load="'+key+'"]');
  if(existing)return waitExisting(existing);
  return new Promise((resolve,reject)=>{
    const el=document.createElement('link');let timer=null,done=false;
    const finish=(ok,err)=>{if(done)return;done=true;if(timer)clearTimeout(timer);if(ok){el.dataset.gsmLoaded='1';resolve(true)}else{el.remove();reject(err)}};
    el.rel='stylesheet';el.href=href;el.dataset.gsmLoad=key;
    el.onload=()=>finish(true);el.onerror=()=>finish(false,new Error(key+'_CSS_LOAD_FAILED'));
    timer=setTimeout(()=>finish(false,new Error(key+'_CSS_LOAD_TIMEOUT')),ASSET_TIMEOUT_MS);
    document.head.appendChild(el);
  });
}
function addJs(src,key,ready){
  if(ready&&window[ready])return Promise.resolve(true);
  const existing=document.querySelector('script[data-gsm-load="'+key+'"]');
  if(existing)return waitExisting(existing,ready);
  return new Promise((resolve,reject)=>{
    const el=document.createElement('script');let timer=null,done=false;
    const finish=(ok,err)=>{if(done)return;done=true;if(timer)clearTimeout(timer);if(ok){el.dataset.gsmLoaded='1';resolve(true)}else{el.remove();reject(err)}};
    el.src=src;el.async=false;el.dataset.gsmLoad=key;
    el.onload=()=>finish(true);el.onerror=()=>finish(false,new Error(key+'_JS_LOAD_FAILED'));
    timer=setTimeout(()=>finish(false,new Error(key+'_JS_LOAD_TIMEOUT')),ASSET_TIMEOUT_MS);
    document.head.appendChild(el);
  });
}
function retry(fn,url,key,ready){
  return fn(url,key,ready).catch(()=>new Promise((resolve,reject)=>{
    setTimeout(()=>fn(url+(url.includes('?')?'&':'?')+'retry='+Date.now(),key,ready).then(resolve,reject),300);
  }));
}

window.GSM_loadAppExtensions=function(){
  if(activePromise)return activePromise;
  const started=performance.now();
  const role=currentRole();

  if(role==='TEACHER'){
    /* CSS first, then JS. This prevents the teacher renderer from painting before
       its layout/contrast authority is available. */
    activePromise=retry(addCss,TEACHER_CSS,'teacher85-css')
      .then(()=>retry(addJs,TEACHER_JS,'teacher85-js','__GSM_R18685_TEACHER__'))
      .then(()=>{
        window.GSM_R18685_LOAD_METRICS={
          role,loaderReadyMs:Math.round(started-bootStarted),
          appLoadMs:Math.round(performance.now()-started),
          slowNetwork:isSlowNetwork(),leanTeacher:true,legacyTeacherBundlesLoaded:false
        };
        return true;
      })
      .catch(err=>{activePromise=null;throw err});
    return activePromise;
  }

  /* Existing non-teacher roles are deliberately untouched by this release. */
  activePromise=retry(addCss,APP_CSS,'app85-css')
    .then(()=>retry(addJs,APP_JS,'app85-js','__GSM_R18661_EXTENSIONS_LOADED__'))
    .then(()=>retry(addCss,FINAL_CSS,'final85-css'))
    .then(()=>retry(addJs,FINAL_JS,'final85-js','__GSM_R18681_FINAL__'))
    .then(()=>{
      window.__GSM_R18661_EXTENSIONS_LOADED__=true;
      window.GSM_R18685_LOAD_METRICS={
        role,loaderReadyMs:Math.round(started-bootStarted),
        appLoadMs:Math.round(performance.now()-started),
        slowNetwork:isSlowNetwork(),leanTeacher:false,legacyOtherRoles:true
      };
      return true;
    })
    .catch(err=>{activePromise=null;throw err});
  return activePromise;
};
})();
