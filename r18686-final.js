/* GS MUSUMBA R186.86 — FINAL DASHBOARD + MARKS + TIMETABLE PRINT AUTHORITY */
(function(){'use strict';
 if(window.__GSM_R18681_FINAL__)return;window.__GSM_R18681_FINAL__=true;
 const V=window.GSM_VIEWS||{},U=window.GSM_UTIL||{},L=window.GSM_LIVE||{};
 const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>Array.from(r.querySelectorAll(s));
 const esc=U.esc||function(v){return String(v==null?'':v).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))};
 const norm=v=>String(v||'').replace(/\s+/g,' ').trim().toUpperCase();
 const role=()=>norm(((window.BOOT&&BOOT.profile)||{}).role_code||'').replace(/\s+/g,'_');
 const profile=()=>((window.BOOT&&BOOT.profile)||{});
 const rpc=(n,p={})=>L&&typeof L.rpc==='function'?L.rpc(n,p):Promise.reject(new Error('LIVE_RPC_UNAVAILABLE'));
 const days=['MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY'];
 const tval=v=>String(v||'').slice(0,5);
 const timeNum=v=>{const m=tval(v).match(/^(\d{1,2}):(\d{2})$/);return m?Number(m[1])*60+Number(m[2]):99999};

 /* ---------------- GLOBAL CONTRAST ---------------- */
 function rgb(bg){const m=String(bg||'').match(/rgba?\((\d+)[, ]+(\d+)[, ]+(\d+)(?:[, /]+([\d.]+))?\)/i);return m?{r:+m[1],g:+m[2],b:+m[3],a:m[4]==null?1:+m[4]}:null}
 function classifyContrast(el){
   if(!el||el.nodeType!==1)return;let c;try{c=getComputedStyle(el)}catch(_){return}const x=rgb(c.backgroundColor);if(!x||x.a<.08)return;
   const max=Math.max(x.r,x.g,x.b),min=Math.min(x.r,x.g,x.b),chroma=max-min;
   const neutralLight=min>224&&chroma<18;
   el.classList.toggle('r18681-contrast-dark',neutralLight);el.classList.toggle('r18681-contrast-white',!neutralLight);
 }
 const contrastSelector='button,.r78-kpi,.r18674-kpi,.r1869-kpi,.r132-owner,.r132-pill,.r18636-marks-status,.r18663-id-btn,.r18663-id-status,.r173-status,.production-banner,.r176-alert,.r18676-pill,[class*="-red"],[class*="-yellow"],[class*="-gold"],[class*="-purple"],[class*="-navy"],[class*="-blue"],[class*="-green"],[class*="-black"]';
 function applyContrast(root=document){if(root.nodeType===1&&root.matches&&root.matches(contrastSelector))classifyContrast(root);$$(contrastSelector,root).forEach(classifyContrast)}

 /* ---------------- DUPLICATE TITLE + SERVICE FOCUS ---------------- */
 function dedupeTitles(){
   const main=$('#main'),crumb=norm($('#crumb')&&$('#crumb').textContent);if(!main||!crumb)return;
   $$('.r18681-duplicate-title',main).forEach(x=>x.classList.remove('r18681-duplicate-title'));
   const sel='.page-head h1,.page-head h2,.r18629-pagehead h1,.r18629-pagehead h2,.r159-marks-head h1,.r159-marks-head h2,.r170-focus-head h1,.r170-focus-head h2,.r172-head h1,.r172-head h2,.gsm-r168-head h1,.gsm-r168-head h2,.r185-focusbar b';
   $$(sel,main).forEach(h=>{if(norm(h.textContent)===crumb)h.classList.add('r18681-duplicate-title')});
 }
 function viewerHasWork(v){if(!v)return false;const txt=String(v.textContent||'').trim();if(!txt)return false;if(/^Loading/i.test(txt)&&v.children.length<2)return false;return v.children.length>0||txt.length>20}
 function serviceFocus(){
   const main=$('#main');if(!main)return;
   $$('.r132-page',main).forEach(page=>{const v=$(':scope > #r132Viewer',page)||$('#r132Viewer',page);page.classList.toggle('r18681-service-open',viewerHasWork(v))});
   $$('.r132-service-shell',main).forEach(shell=>{const n=$('#r132Nested',shell);shell.classList.toggle('r18681-subservice-open',viewerHasWork(n))});
   ['r136bAttViewer','r136bMarksViewer','rLiveViewer'].forEach(id=>{const v=$('#'+id,main),host=v&&v.parentElement;if(host)host.classList.toggle('r18681-service-open',viewerHasWork(v))});
 }
 function globalUi(root=document){applyContrast(root);dedupeTitles();serviceFocus()}
 let uiTimer=0;function scheduleUi(root=document){clearTimeout(uiTimer);uiTimer=setTimeout(()=>globalUi(root),20)}
 document.addEventListener('gsm:view-rendered',()=>scheduleUi(document));
 document.addEventListener('click',()=>{setTimeout(()=>scheduleUi(document),40);setTimeout(()=>scheduleUi(document),180)},true);
 const mainObserverTarget=$('#main');if(mainObserverTarget)new MutationObserver(ms=>{ms.forEach(m=>m.addedNodes&&m.addedNodes.forEach(n=>{if(n.nodeType===1)applyContrast(n)}));scheduleUi(document)}).observe(mainObserverTarget,{childList:true,subtree:true});

 /* ---------------- TIMETABLE GRID HELPERS ---------------- */
 function subjectKey(text){const t=norm(text);
   if(/\b(MATH|MATHEMATICS|IMIBARE)\b/.test(t))return'math';
   if(/\b(ENG|ENGLISH|ICYONGEREZA)\b/.test(t))return'english';
   if(/\b(KINY|KINYARWANDA|IKINYARWANDA)\b|INKURU MU KINYARWANDA/.test(t))return'kiny';
   if(/\b(FRE|FRENCH|IGIFARANSA)\b/.test(t))return'french';
   if(/\b(SWAH|SWAHILI|IGISWAHILI)\b/.test(t))return'swahili';
   if(/\b(SET|SCI|SCIENCE|BIO|BIOLOGY|CHEM|CHEMISTRY|PHYS|PHYSICS)\b|IBIDUKIKIJE/.test(t))return'science';
   if(/\b(HIST|HISTORY)\b/.test(t))return'history';if(/\b(GEO|GEOG|GEOGRAPHY)\b/.test(t))return'geography';
   if(/\b(SRE|REL|RELIG|RELIGION|SOCIAL|CIVIC)\b/.test(t))return'sre';if(/\b(ENT|ENTREPRENEUR)\b/.test(t))return'ent';
   if(/\b(ICT|COMPUT)\b/.test(t))return'ict';if(/\b(PES|SPORT)\b|IMIKINO/.test(t))return'pes';
   if(/\b(HOME SCI|HOME SCIENCE|HEALTH)\b|IBONEZA BUZIMA/.test(t))return'home';if(/\b(CREATIVE|ART|MUSIC|DANCE)\b|UBUGENI|UMUCO|IMBAMUTIMA/.test(t))return'arts';
   if(/\b(ASSEMBLY|HYGIENE)\b|KWAKIRA ABANA/.test(t))return'assembly';if(/\b(BREAK|LUNCH)\b/.test(t))return'break';
   if(/\b(CPD|CLUB|CCA|ITORERO|UMUGANDA)\b/.test(t))return'activity';return'general';
 }
 function periodLabel(p){return String(p.slot_label||p.period_label||p.label||((Number(p.lesson_number)>=0?'PERIOD '+p.lesson_number:'PERIOD'))).trim()}
 function slotKey(x){return String(x.lesson_number??'')+'|'+tval(x.start_time)+'|'+tval(x.end_time)}
 function sortedSlots(periods,entries){
   const map=new Map();(periods||[]).forEach(p=>{const k=slotKey(p);if(!map.has(k))map.set(k,{lesson_number:p.lesson_number,start_time:p.start_time,end_time:p.end_time,label:periodLabel(p),slot_type:p.slot_type||''})});
   (entries||[]).forEach(e=>{const k=slotKey(e);if(!map.has(k))map.set(k,{lesson_number:e.lesson_number,start_time:e.start_time,end_time:e.end_time,label:(Number(e.lesson_number)>=0?'PERIOD '+e.lesson_number:'PERIOD'),slot_type:e.activity_type||''})});
   return Array.from(map.values()).sort((a,b)=>timeNum(a.start_time)-timeNum(b.start_time)||Number(a.lesson_number||0)-Number(b.lesson_number||0));
 }
 function cellHtml(list,mode){
   if(!list||!list.length)return '<td class="empty">—</td>';
   const bySub=new Map();list.forEach(e=>{const label=String(e.subject_name||e.display_label||e.subject_code||e.activity_type||'ACTIVITY').trim(),k=norm(label);if(!bySub.has(k))bySub.set(k,{label,teacher:e.teacher_name||'',classes:new Set()});const x=bySub.get(k);if(e.class_code)x.classes.add(String(e.class_code));if(e.display_class_code)x.classes.add(String(e.display_class_code));if(!x.teacher&&e.teacher_name)x.teacher=e.teacher_name});
   const vals=Array.from(bySub.values()),primary=vals[0]||{},key=subjectKey(primary.label),lines=vals.map(x=>{const cls=Array.from(x.classes).sort().join(' + ');return '<b>'+esc(x.label||'—')+'</b>'+(mode==='teacher'&&cls?'<span>'+esc(cls)+'</span>':'')+(mode==='class'&&x.teacher?'<span>'+esc(x.teacher)+'</span>':'')}).join('<hr style="border:0;border-top:1px solid rgba(255,255,255,.45);margin:3px 0">');
   return '<td class="r18681-tt-'+key+'">'+lines+'</td>';
 }
 function gridFromWorkspace(data,filter,mode,title){
   const entries=(data.entries||[]).filter(e=>e.is_active!==false&&norm(e.status||'PUBLISHED')==='PUBLISHED').filter(filter),slots=sortedSlots([],entries);
   const cellMap=new Map();entries.forEach(e=>{const k=norm(e.day_of_week)+'|'+slotKey(e);if(!cellMap.has(k))cellMap.set(k,[]);cellMap.get(k).push(e)});
   return '<div class="r18681-live-source"><b>'+esc(title||'LIVE TIMETABLE')+'</b><span>LIVE SUPABASE · CURRENT PUBLISHED TIMETABLE</span></div><div class="r18681-week-wrap"><table class="r18681-week"><thead><tr><th>PERIOD / HOUR</th>'+days.map(d=>'<th>'+d+'</th>').join('')+'</tr></thead><tbody>'+slots.map(s=>'<tr><th><b>'+esc(s.label)+'</b><span>'+esc(tval(s.start_time)+'–'+tval(s.end_time))+'</span></th>'+days.map(d=>cellHtml(cellMap.get(d+'|'+slotKey(s))||[],mode)).join('')+'</tr>').join('')+'</tbody></table></div>';
 }
 function teacherLegacySlots(name,liveRows){
   const M=window.GSM_R18628_TIMETABLE_MASTER||{},all=M.teacher_timetables||{},n=norm(name),k=Object.keys(all).find(x=>norm(x)===n),t=k&&all[k];
   if(t&&Array.isArray(t.slots))return t.slots.map((s,i)=>{const tm=String(s.time||'').replace('–','-').split('-'),mm=String(s.label||'').match(/PERIOD\s+(\d+)/i);return{lesson_number:mm?Number(mm[1]):100+i,start_time:(tm[0]||'').trim(),end_time:(tm[1]||'').trim(),label:s.label||'PERIOD',slot_type:s.label||''}});
   return sortedSlots([],liveRows);
 }
 function teacherLiveGrid(rows,name){
   const slots=teacherLegacySlots(name,rows).map((s,i)=>{const a=tval(s.start_time),b=tval(s.end_time),u=norm(s.label);let label=s.label||'';if(a==='10:00'&&b==='10:20')label='BREAK';else if(a==='11:40'&&b==='12:40')label='LUNCH';else if(a==='12:40'&&b==='12:50')label='ASSEMBLY';else if(/^ISAHA\s*\d+$/i.test(label)||/^PERIOD\s+(10[0-9]|11[0-9]|12[0-9])$/i.test(label)){const teaching=['08:00','08:40','09:20','10:20','11:00','12:50','13:30','14:10','14:50'];const n=teaching.indexOf(a);if(n>=0)label='PERIOD '+(n+1)}return Object.assign({},s,{label})}),map=new Map();(rows||[]).forEach(e=>{const k=norm(e.day_of_week)+'|'+slotKey(e);if(!map.has(k))map.set(k,[]);map.get(k).push(e)});
   return '<div class="r18681-live-source"><b>MY CURRENT TIMETABLE · '+esc(name||'TEACHER')+'</b><span>LESSON ASSIGNMENTS: LIVE SUPABASE</span></div><div class="r18681-week-wrap"><table class="r18681-week"><thead><tr><th>PERIOD / HOUR</th>'+days.map(d=>'<th>'+d+'</th>').join('')+'</tr></thead><tbody>'+slots.map(s=>{const structure=subjectKey(s.label);return '<tr><th><b>'+esc(s.label)+'</b><span>'+esc(tval(s.start_time)+'–'+tval(s.end_time))+'</span></th>'+days.map(d=>{const list=map.get(d+'|'+slotKey(s))||[];if(list.length)return cellHtml(list,'teacher');if(['break','assembly','activity'].includes(structure))return '<td class="r18681-tt-'+structure+'"><b>'+esc(s.label)+'</b></td>';return '<td class="empty">—</td>'}).join('')+'</tr>'}).join('')+'</tbody></table></div>';
 }


 /* ---------------- R186.86 OFFICIAL TIMETABLE PRINTING ---------------- */
 function ctxName(data,key,fallback){const c=(data&&data.context)||((window.BOOT&&BOOT.context)||{});return String(c[key]||fallback||'').trim()}
 function tableOnly(data,filter,mode){const box=document.createElement('div');box.innerHTML=gridFromWorkspace(data,filter,mode,'');const t=box.querySelector('table.r18681-week');return t?t.outerHTML:'<p>No timetable rows available.</p>'}
 function teacherTableOnly(rows,name){const box=document.createElement('div');box.innerHTML=teacherLiveGrid(rows||[],name||'TEACHER');const t=box.querySelector('table.r18681-week');return t?t.outerHTML:'<p>No timetable rows available.</p>'}
 function timetablePrintCss(){return `
  @page{size:A4 landscape;margin:7mm}
  *{box-sizing:border-box;-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important}
  body{font-family:Arial,sans-serif;color:#111;margin:0;background:#fff}
  .tt-page{page-break-after:always;break-after:page}.tt-page:last-child{page-break-after:auto;break-after:auto}
  .tt-title{text-align:center;font-size:15px;font-weight:950;color:#073f72;margin:4px 0 6px;text-transform:uppercase}
  .tt-meta{text-align:center;font-size:8px;font-weight:800;margin:0 0 5px;color:#334e68}
  .r18681-week{width:100%;border-collapse:collapse;table-layout:fixed;border:1.5px solid #123f61}
  .r18681-week th,.r18681-week td{border:1px solid #6f8799;padding:2.5px 3px;vertical-align:middle;text-align:center;font-size:6.6pt;line-height:1.05;height:29px}
  .r18681-week thead th{background:#063f70!important;color:#fff!important;font-weight:950}
  .r18681-week thead th:first-child{background:#073f72!important;width:86px}
  .r18681-week tbody th{background:#073f72!important;color:#fff!important;width:86px;font-weight:950}
  .r18681-week tbody th b,.r18681-week tbody th span{display:block;color:#fff!important}.r18681-week tbody th span{font-size:5.8pt;margin-top:1px}
  .r18681-week td{font-weight:800;color:#fff!important}.r18681-week td b,.r18681-week td span,.r18681-week td small{display:block;color:inherit!important}.r18681-week td span{font-size:5.7pt;margin-top:1px}
  .r18681-week td.empty{background:#fff!important;color:#555!important}
  .r18681-tt-math{background:#6d28d9!important}.r18681-tt-english{background:#005eb8!important}.r18681-tt-kiny{background:#08783e!important}.r18681-tt-french{background:#7e22ce!important}.r18681-tt-swahili{background:#c2410c!important}.r18681-tt-science{background:#b42318!important}.r18681-tt-history{background:#854d0e!important}.r18681-tt-geography{background:#0f766e!important}.r18681-tt-sre{background:#8a6b00!important}.r18681-tt-ent{background:#9b3a59!important}.r18681-tt-ict{background:#334155!important}.r18681-tt-pes{background:#15803d!important}.r18681-tt-home{background:#be185d!important}.r18681-tt-arts{background:#5b21b6!important}.r18681-tt-assembly{background:#00695c!important}.r18681-tt-break{background:#37474f!important}.r18681-tt-activity{background:#1b5e20!important}.r18681-tt-general{background:#0b5d8e!important}
  .r18681-week td[class*="r18681-tt-"] *{color:#fff!important}
  .tt-foot{display:flex;justify-content:space-between;gap:12px;margin-top:5px;font-size:7px;color:#333}
 `}
 function officialPrintHeader(title,meta){if(typeof window.GSM_R18669_popupHeader==='function')return window.GSM_R18669_popupHeader(title,meta);return '<div class="tt-title">'+esc(title)+'</div><div class="tt-meta">'+esc(meta)+'</div>'}
 function openTimetablePrint(pages,data){if(!pages||!pages.length){alert('No timetable is available to print.');return}const c=(data&&data.context)||((window.BOOT&&BOOT.context)||{}),ay=c.academic_year||c.academic_year_name||'2026-2027',term=c.term||c.term_name||'TERM 1',w=window.open('','_blank');if(!w){alert('Popup blocked. Allow popups to print timetables.');return}const body=pages.map((p,i)=>'<section class="tt-page">'+officialPrintHeader(p.title,'ACADEMIC YEAR: '+ay+' · TERM: '+term)+p.table+'<div class="tt-foot"><span>GS MUSUMBA · LIVE SUPABASE CURRENT PUBLISHED TIMETABLE</span><span>Page '+(i+1)+' of '+pages.length+'</span></div></section>').join('');w.document.write('<!doctype html><html><head><meta charset="utf-8"><title>GS MUSUMBA TIMETABLE PRINT</title><style>'+timetablePrintCss()+'</style></head><body>'+body+'<script>window.onload=function(){setTimeout(function(){window.focus();window.print()},180)}<\/script></body></html>');w.document.close()}
 function classPage(data,cl){const id=String(cl.id),name=String(cl.class_code||cl.class_name||'CLASS').toUpperCase();return{title:'WEEKLY TIMETABLE FOR '+name,table:tableOnly(data,e=>String(e.class_id)===id,'class')}}
 function teacherPage(data,st){const id=String(st.id),name=String(st.full_name||st.staff_code||'TEACHER').toUpperCase(),rows=(data.entries||[]).filter(e=>e.is_active!==false&&norm(e.status||'PUBLISHED')==='PUBLISHED'&&String(e.staff_id)===id);return{title:name+' WEEKLY TIMETABLE',table:teacherTableOnly(rows,name)}}
 function printTeacherRows(rows,name){const data={entries:rows||[],periods:[],context:(window.BOOT&&BOOT.context)||{}};const n=String(name||'TEACHER').toUpperCase(),page={title:n+' WEEKLY TIMETABLE',table:teacherTableOnly(rows||[],n)};openTimetablePrint([page],data)}

 /* ---------------- TEACHER: FORCE LIVE SUPABASE SOURCE ---------------- */
 V.myteachertimetable=function(mount,ctx){
   if(role()!=='TEACHER'){const f=V.r18612_timetable_manager||V.r120_timetable_manager;return typeof f==='function'?f(mount,ctx):undefined}
   const p=profile(),name=p.full_name||p.username||'TEACHER';let rows=[],futureVisible=false,futurePlan=[],mode='current';
   mount.innerHTML='<div class="r18628-page"><div class="page-head"><div><h2>MY TIMETABLE</h2><p>Current published timetable from live Supabase.</p></div></div><section class="r18628-card"><div class="r18628-tabs"><button class="active" id="r81Current">CURRENT TIMETABLE</button><button id="r81Future">FUTURE TIMETABLE <span id="r81Lock">🔒</span></button><span class="grow"></span><button class="print" id="r81Print">PRINT / PDF</button><button id="r81Refresh">REFRESH</button></div><div id="r81Body"><div class="r18628-state">Loading live timetable…</div></div></section></div>';
   const body=$('#r81Body',mount),cur=$('#r81Current',mount),fut=$('#r81Future',mount),lock=$('#r81Lock',mount);
   function futureHtml(){if(!futureVisible)return '<div class="r18628-lock"><div class="ico">🔒</div><h3>FUTURE TIMETABLE IS LOCKED</h3><p>Only SUPER ADMIN can unlock the Future Timetable view.</p></div>';const mine=new Set(rows.map(x=>String(x.class_code||'').toUpperCase()).filter(Boolean)),plan=(futurePlan||[]).filter(x=>!mine.size||mine.has(String(x.current_class||'').toUpperCase()));return '<div class="r18628-state warn"><b>FUTURE VIEW UNLOCKED.</b><span>No future lesson is fabricated; only the approved future class plan is shown.</span></div><div class="r18628-future-table"><table><thead><tr><th>CURRENT CLASS</th><th>FUTURE CLASS(ES)</th><th>STATUS</th><th>REASON / ACTION</th></tr></thead><tbody>'+plan.map(x=>'<tr><td><b>'+esc(x.current_class)+'</b></td><td><b>'+esc(x.future_classes)+'</b></td><td>'+esc(x.status||x.plan_status||'')+'</td><td>'+esc(x.action||x.reason_action||'')+'</td></tr>').join('')+'</tbody></table></div>'}
   function draw(){cur.classList.toggle('active',mode==='current');fut.classList.toggle('active',mode==='future');body.innerHTML=mode==='current'?teacherLiveGrid(rows,name):futureHtml();scheduleUi(body)}
   async function load(){body.innerHTML='<div class="r18628-state">Loading live Supabase timetable…</div>';try{const d=await rpc('r136_teacher_timetable',{});rows=Array.isArray(d&&d.rows)?d.rows:[];draw()}catch(e){body.innerHTML='<div class="r18628-state bad"><b>TIMETABLE LOAD FAILED.</b><span>'+esc(e&&e.message||e)+'</span></div>'}}
   cur.onclick=()=>{mode='current';draw()};fut.onclick=()=>{mode='future';draw()};$('#r81Print',mount).onclick=()=>{if(mode!=='current'){window.print();return}printTeacherRows(rows,name)};$('#r81Refresh',mount).onclick=load;
   rpc('r18628_get_timetable_visibility',{}).then(d=>{futureVisible=!!(d&&d.future_visible_to_teachers);futurePlan=Array.isArray(d&&d.future_plan)?d.future_plan:[];lock.textContent=futureVisible?'🔓':'🔒';if(mode==='future')draw()}).catch(()=>{});load();
 };

 /* ---------------- DOS / SUPER ADMIN: LIVE CLASS + TEACHER BROWSER ---------------- */
 const baseManager=V.r18612_timetable_manager||V.r120_timetable_manager||V.r119_timetable_manager||V.r171_timetable_workspace;
 function injectLiveManager(mount){
   const old=$('#r18628Manager',mount);if(!old||!old.isConnected)return;
   old.classList.add('r18681-live-upgraded');const p=$('.r18628-manager-head p',old);if(p)p.innerHTML='<b>CURRENT:</b> live Supabase published timetable for every class and teacher. <b>FUTURE:</b> existing visibility control retained.';
   if($('#r18681LiveBrowser',old))return;
   const host=document.createElement('div');host.id='r18681LiveBrowser';host.className='r18681-live-tt';host.innerHTML='<div class="r18681-live-source"><b>LIVE CURRENT TIMETABLE BROWSER</b><span>Loading Supabase…</span></div><div class="r18681-live-tools"><label>CURRENT CLASS<select id="r81Class"><option>Loading…</option></select></label><button id="r81ShowClass">SHOW CLASS TIMETABLE</button><label>CURRENT TEACHER<select id="r81Teacher"><option>Loading…</option></select></label><button id="r81ShowTeacher">SHOW TEACHER TIMETABLE</button></div><div class="r18683-print-tools"><button id="r83PrintClass">PRINT SELECTED CLASS</button><button id="r83PrintTeacher">PRINT SELECTED TEACHER</button><button id="r83PrintAllClasses">PRINT ALL CLASSES</button><button id="r83PrintAllTeachers">PRINT ALL TEACHERS</button></div><div id="r81ManagerView"><div class="r18628-state">Loading live timetable workspace…</div></div>';
   old.appendChild(host);let data=null;const cs=$('#r81Class',host),ts=$('#r81Teacher',host),view=$('#r81ManagerView',host);
   function drawClass(){if(!data)return;const id=cs.value,cl=(data.classes||[]).find(x=>String(x.id)===String(id));view.innerHTML=gridFromWorkspace(data,e=>String(e.class_id)===String(id),'class','CURRENT CLASS TIMETABLE · '+(cl&&(cl.class_code||cl.class_name)||'CLASS'));scheduleUi(view)}
   function drawTeacher(){if(!data)return;const id=ts.value,st=(data.staff||[]).find(x=>String(x.id)===String(id));view.innerHTML=gridFromWorkspace(data,e=>String(e.staff_id)===String(id),'teacher','CURRENT TEACHER TIMETABLE · '+(st&&st.full_name||'TEACHER'));scheduleUi(view)}
   async function load(){try{data=await rpc('r120_get_timetable_workspace',{});const classes=(data.classes||[]).filter(x=>String(x.status||'ACTIVE').toUpperCase()!=='ARCHIVED'),staff=(data.staff||[]).filter(x=>String(x.status||'ACTIVE').toUpperCase()==='ACTIVE');cs.innerHTML=classes.map(x=>'<option value="'+esc(x.id)+'">'+esc(x.class_code||x.class_name||'CLASS')+'</option>').join('');ts.innerHTML=staff.map(x=>'<option value="'+esc(x.id)+'">'+esc(x.full_name||x.staff_code||'TEACHER')+'</option>').join('');const src=$('.r18681-live-source span',host);if(src)src.textContent='LIVE SUPABASE · '+(data.entries||[]).filter(e=>e.is_active!==false&&norm(e.status)==='PUBLISHED').length+' published rows';drawClass()}catch(e){view.innerHTML='<div class="r18628-state bad"><b>LIVE TIMETABLE BROWSER FAILED.</b><span>'+esc(e&&e.message||e)+'</span></div>'}}
   $('#r81ShowClass',host).onclick=drawClass;$('#r81ShowTeacher',host).onclick=drawTeacher;cs.onchange=drawClass;ts.onchange=drawTeacher;
   $('#r83PrintClass',host).onclick=()=>{if(!data)return;const cl=(data.classes||[]).find(x=>String(x.id)===String(cs.value));if(cl)openTimetablePrint([classPage(data,cl)],data)};
   $('#r83PrintTeacher',host).onclick=()=>{if(!data)return;const st=(data.staff||[]).find(x=>String(x.id)===String(ts.value));if(st)openTimetablePrint([teacherPage(data,st)],data)};
   $('#r83PrintAllClasses',host).onclick=()=>{if(!data)return;const entries=data.entries||[],ids=new Set(entries.filter(e=>e.is_active!==false&&norm(e.status||'PUBLISHED')==='PUBLISHED').map(e=>String(e.class_id)));const cls=(data.classes||[]).filter(x=>ids.has(String(x.id))&&String(x.status||'ACTIVE').toUpperCase()!=='ARCHIVED');openTimetablePrint(cls.map(x=>classPage(data,x)),data)};
   $('#r83PrintAllTeachers',host).onclick=()=>{if(!data)return;const entries=data.entries||[],ids=new Set(entries.filter(e=>e.is_active!==false&&norm(e.status||'PUBLISHED')==='PUBLISHED'&&e.staff_id).map(e=>String(e.staff_id)));const staff=(data.staff||[]).filter(x=>ids.has(String(x.id))&&String(x.status||'ACTIVE').toUpperCase()==='ACTIVE');openTimetablePrint(staff.map(x=>teacherPage(data,x)),data)};
   load();
 }
 if(typeof baseManager==='function'){
   const liveManager=function(mount,ctx){const out=baseManager(mount,ctx);[90,260,820,1400].forEach(ms=>setTimeout(()=>injectLiveManager(mount),ms));return out};
   V.r18612_timetable_manager=liveManager;V.r120_timetable_manager=liveManager;V.r119_timetable_manager=liveManager;V.r171_timetable_workspace=liveManager;
 }

 /* Make identification importer use the included R186.86 CSV without stale cache. */
 window.GSM_R18681={release:'R186.86',globalContrast:true,serviceFocusGlobal:true,duplicateTitleAuthority:true,timetableSource:'LIVE_SUPABASE',periodBackground:'DARK_NAVY_WHITE_TEXT',includedIdentificationCsv:'GS_MUSUMBA_STUDENT_IDENTIFICATION_SDMS_990.csv'};
 if(window.GSM_R18628)window.GSM_R18628.currentTimetable='LIVE_SUPABASE';
 try{document.documentElement.setAttribute('data-gsm-release','R186.86');document.documentElement.setAttribute('data-gsm-component-release','R186.86')}catch(_){}
 setTimeout(()=>globalUi(document),120);setTimeout(()=>globalUi(document),700);
})();

/* ===== R186.86 MOBILE OPERATIONS + MARKS LIVE FORMULA / ALL-MARKS AUDIT ===== */
(function(){'use strict';
 if(window.__GSM_R18684_MOBILE_MARKS__)return;window.__GSM_R18684_MOBILE_MARKS__=true;
 const V=window.GSM_VIEWS||{},U=window.GSM_UTIL||{},L=window.GSM_LIVE||{};
 const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>Array.from(r.querySelectorAll(s));
 const esc=U.esc||function(v){return String(v==null?'':v).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))};
 const rpc=(n,p={})=>L&&typeof L.rpc==='function'?L.rpc(n,p):Promise.reject(new Error('LIVE_RPC_UNAVAILABLE'));
 const up=v=>String(v||'').replace(/\s+/g,' ').trim().toUpperCase();
 const num=v=>{const n=Number(v);return Number.isFinite(n)?n:null};

 /* Retire the old public GitHub Pages copy if a cached tab is still opened. */
 try{if(String(location.hostname||'').toLowerCase()==='gsmusumba.github.io'){location.replace('https://musumba.pages.dev'+location.pathname+location.search+location.hash);return}}catch(_){}

 const exceptionStatuses=new Set(['ABSENT','ABSENT_UNEXCUSED','ABSENT_EXCUSED','LATE','EXCUSED','PERMISSION','MEDICAL','SICK','LEFT_EARLY','LEFT_WITH_PERMISSION','SUSPENDED']);
 function proxyButton(label,source,cls){const b=document.createElement('button');b.type='button';b.className='r18684-save-proxy '+(cls||'');b.textContent=label;b.disabled=!!source.disabled;b.onclick=()=>{if(!source.disabled)source.click()};return b}
 function syncProxy(dock,sourceButtons){if(!dock)return;sourceButtons.forEach((s,i)=>{const b=dock.querySelectorAll('button')[i];if(b)b.disabled=!!s.disabled})}
 function makeDock(key,anchor,buttons){if(!anchor||!buttons.length||$('#'+key,anchor.parentElement||document))return;const dock=document.createElement('div');dock.id=key;dock.className='r18684-mobile-save-dock r186-no-print';buttons.forEach(x=>dock.appendChild(proxyButton(x.label,x.source,x.cls)));const spacer=document.createElement('div');spacer.className='r18684-save-spacer';anchor.parentElement.insertBefore(dock,anchor);anchor.parentElement.insertBefore(spacer,anchor);syncProxy(dock,buttons.map(x=>x.source));}

 function updateAttendanceRow(tr,focusReason){const sel=$('.t160-status-select',tr),note=$('.t160-note',tr);if(!sel||!note)return;const st=up(sel.value),need=exceptionStatuses.has(st);tr.classList.toggle('r18684-att-exception',need);tr.classList.toggle('r18684-att-present',st==='PRESENT');note.required=need;note.placeholder=need?'REASON REQUIRED — write the reason here':'Reason / teacher note (optional for present)';if(need&&focusReason){try{note.focus({preventScroll:true})}catch(_){note.focus()}try{note.scrollIntoView({behavior:'smooth',block:'center',inline:'nearest'})}catch(_){}}}
 function enhanceAttendance(root=document){
   $$('.r18669-attendance-roster tr[data-t160-student]',root).forEach(tr=>{const sel=$('.t160-status-select',tr),note=$('.t160-note',tr);if(!sel||!note)return;if(!tr.dataset.r18684Attendance){tr.dataset.r18684Attendance='1';const td=sel.parentElement,quick=document.createElement('div');quick.className='r18684-att-quick';[['P','PRESENT'],['A','ABSENT'],['E','EXCUSED'],['L','LATE']].forEach(([lab,val])=>{const b=document.createElement('button');b.type='button';b.textContent=lab;b.title=val;b.dataset.attQuick=val;b.disabled=sel.disabled;b.onclick=()=>{if(sel.disabled)return;sel.value=val;sel.dispatchEvent(new Event('change',{bubbles:true}));updateAttendanceRow(tr,val!=='PRESENT')};quick.appendChild(b)});td.insertBefore(quick,sel);sel.addEventListener('change',()=>updateAttendanceRow(tr,false));note.addEventListener('input',()=>tr.classList.toggle('r18684-reason-filled',!!note.value.trim()))}updateAttendanceRow(tr,false)});
   $$('.r18669b-att-savebar',root).forEach(bar=>{const draft=$('[data-t160-bottom-draft]',bar),save=$('[data-t160-bottom-save]',bar);if(!draft||!save)return;const panel=bar.closest('.t160-panel-b'),table=panel&&$('.t160-table-wrap',panel);if(table)makeDock('r18684AttDock',table,[{label:'SAVE DRAFT',source:draft,cls:'green'},{label:save.textContent.trim()||'SAVE ATTENDANCE',source:save,cls:'green'}]);const dock=$('#r18684AttDock',panel||document);syncProxy(dock,[draft,save]);draft.classList.add('r18684-green-save');save.classList.add('r18684-green-save')});
 }

 function enhanceStudentProfile(root=document){
   ['r58Save','r58Submit','r58SaveNext','r176StuSave','r176StuSubmit','r176StuSaveNext'].forEach(id=>{const b=$('#'+id,root);if(b)b.classList.add('r18684-green-save')});
   const detail=$('#r58StuDetail',root);if(detail){const page=detail.closest('.r18658-students')||detail.parentElement;page&&page.classList.toggle('r18684-profile-open',!detail.hidden);if(!detail.hidden){const originals=['r58Save','r58Submit','r58SaveNext'].map(id=>$('#'+id,detail)).filter(b=>b&&!b.hidden);const form=$('#r58StuForm',detail);if(form&&originals.length)makeDock('r18684ProfileDock',form,originals.map(b=>({label:b.textContent.trim(),source:b,cls:'green'})));syncProxy($('#r18684ProfileDock',detail),originals)}}
   const old=$('#r176StuEditor',root);if(old&&old.offsetParent!==null){const originals=['r176StuSave','r176StuSubmit','r176StuSaveNext'].map(id=>$('#'+id,old)).filter(Boolean);if(originals.length)makeDock('r18684OldProfileDock',old,originals.map(b=>({label:b.textContent.trim(),source:b,cls:'green'})));syncProxy($('#r18684OldProfileDock',old.parentElement||root),originals)}
 }

 function enhanceMarksSave(root=document){const bottom=$('.r18636-marks-bottom',root),host=$('#r18637MxTableHost',root);if(!bottom||!host)return;const draft=$('#r18636MxDraft',bottom),submit=$('#r18636MxSubmit',bottom);if(!draft||!submit)return;draft.classList.add('r18684-green-save');submit.classList.add('r18684-green-save');makeDock('r18684MarksDock',host,[{label:'SAVE DRAFT',source:draft,cls:'green'},{label:'SUBMIT MARKS',source:submit,cls:'green'}]);syncProxy($('#r18684MarksDock',host.parentElement||root),[draft,submit])}

 function exclusiveServices(root=document){
   const ah=$('#r18674AttendanceHost',root);if(ah){const p=ah.closest('.r18674-page');if(p)p.classList.toggle('r18684-child-open',String(ah.textContent||'').trim().length>20)}
   const mh=$('#r18629MarksHost',root);if(mh){const p=mh.closest('.r18629-page');if(p)p.classList.toggle('r18684-child-open',String(mh.textContent||'').trim().length>20)}
 }

 function typeLabel(c){const z=up((c&&c.category_code)||(c&&c.category_name)||'ASSESSMENT').replace(/[\s-]+/g,'_');if(z.includes('END_UNIT'))return'END UNIT';if(z.includes('QUIZ'))return'QUIZ';if(z.includes('HOME'))return'HOMEWORK';if(z.includes('PRACT'))return'PRACTICAL';if(z.includes('MID'))return'MIDTERM';if(z.includes('TEST'))return'TEST';return'ASSESSMENT'}
 function matrixDisplay(d,row,col){const mm=(d.assessment_matrix||{})[String(row.student_id)]||{},x=mm[String(col.id)]||{};const v=x.display??x.mark??x.status;return v==null||String(v).trim()===''?'—':String(v)}
 function doneTypeSummary(d,row){const counts={},cols=d.assessment_columns||[];let done=0;cols.forEach(c=>{const v=matrixDisplay(d,row,c);if(v==='—')return;done++;const k=typeLabel(c);counts[k]=(counts[k]||0)+1});return{done,text:Object.entries(counts).map(([k,v])=>k+' '+v).join(' · ')||'—'}}
 function pctText(a,b){a=num(a);b=num(b);return a!=null&&b!=null&&b>0?(100*a/b).toFixed(2)+'%':'—'}
 function valText(v){return v==null||v===''?'—':String(v)}
 function renderFullMarksDetail(box,d,meta){
   const cols=d.assessment_columns||[],rows=d.rows||[],exam=up((d.config&&d.config.official_exam_type)||'EXAM').replace(/_/g,' '),matrix=d.assessment_matrix||{};
   const dynamic=cols.map(c=>'<th class="r18684-ass-col">'+esc(c.assessment_name||c.category_name||'ASSESSMENT')+'<small>/ '+esc(c.max_mark??'—')+'</small></th>').join('');
   const body=rows.map((r,i)=>{const cnt=doneTypeSummary(d,r),m=matrix[String(r.student_id)]||{},assRaw=valText(r.all_ass_obtained)+' / '+valText(r.all_ass_max),assPct=r.assessment_percent!=null?Number(r.assessment_percent).toFixed(2)+'%':pctText(r.all_ass_obtained,r.all_ass_max),eu=r.camis_eu_official??r.camis_eu,examRaw=r.exam_raw==null?'—':valText(r.exam_raw)+' / '+valText(r.exam_raw_max),examPct=pctText(r.exam_raw,r.exam_raw_max),examC=r.camis_exam_official??r.camis_exam,total=r.total_camis_official??r.total_marks,totalMax=r.total_camis_max_official??r.total_marks_max,perf=r.final_percent_official??r.percentage,rank=r.rank??'—';return '<tr><td>'+(i+1)+'</td><td><b>'+esc(r.sdms_code||'')+'</b></td><td class="name">'+esc(r.student_name||'')+'</td>'+cols.map(c=>'<td>'+esc(matrixDisplay(d,r,c))+'</td>').join('')+'<td><b>'+cnt.done+'</b></td><td class="r18684-type-counts">'+esc(cnt.text)+'</td><td>'+esc(assRaw)+'</td><td>'+esc(assPct)+'</td><td><b>'+esc(valText(eu))+'</b></td><td>'+esc(examRaw)+'</td><td>'+esc(examPct)+'</td><td><b>'+esc(valText(examC))+'</b></td><td>'+esc(r.total_raw==null?'—':valText(r.total_raw)+' / '+valText(r.total_raw_max))+'</td><td><b>'+esc(valText(total))+'</b></td><td>'+esc(valText(totalMax))+'</td><td><b>'+esc(perf==null?'—':Number(perf).toFixed(2)+'%')+'</b></td><td><b>'+esc(r.grade||'—')+'</b></td><td><b>'+esc(rank)+'</b></td></tr>'}).join('');
   box.innerHTML='<section class="t160-panel r18684-full-marks-detail"><div class="t160-panel-h"><div><h3>FULL STUDENT MARKS · '+esc(meta.class_code||'')+' · '+esc(meta.subject_name||meta.subject_code||'')+'</h3><small>Every continuous assessment RAW mark + assessment totals/% + CAMIS E.U + '+esc(exam)+' RAW/% + CAMIS '+esc(exam)+' + live/final result.</small></div><div class="t160-mini-actions"><button class="t160-btn success" id="r18684ContinueMarks">CONTINUE ENTRY</button><button class="t160-btn" id="r18684CloseMarks">CLOSE</button></div></div><div class="r18684-marks-detail-note"><b>'+cols.length+' CONTINUOUS ASSESSMENT(S) CREATED.</b> The “DONE BY TYPE” column shows counts such as QUIZ 10 · END UNIT 3 for each learner when those marks exist.</div><div class="t160-table-wrap r18684-allmarks-wrap"><table class="t160-table r18684-allmarks-table"><thead><tr><th>NO.</th><th>SDMS</th><th>STUDENT</th>'+dynamic+'<th># ASS. DONE</th><th>DONE BY TYPE</th><th>ASS. RAW</th><th>ASS. %</th><th>CAMIS E.U</th><th>'+esc(exam)+' RAW</th><th>EXAM %</th><th>CAMIS '+esc(exam)+'</th><th>TOTAL RAW</th><th>CAMIS TOTAL</th><th>TOTAL MAX</th><th>PERFORMANCE %</th><th>GRADE</th><th>RANK</th></tr></thead><tbody>'+body+'</tbody></table></div></section>';
   const close=$('#r18684CloseMarks',box);if(close)close.onclick=()=>box.innerHTML='';const cont=$('#r18684ContinueMarks',box);if(cont)cont.onclick=()=>{const tab=document.querySelector('[data-r18629-marktab="entry"]');if(tab)tab.click()};try{box.scrollIntoView({behavior:'smooth',block:'start'})}catch(_){}
 }
 function installAllMarks(mount){
   if(!mount||mount.dataset.r18684AllMarks)return;mount.dataset.r18684AllMarks='1';let busy=false;
   const bind=()=>{$$('[data-am-action]',mount).forEach(b=>{if(b.dataset.r18684Bound)return;b.dataset.r18684Bound='1';const mode=up(b.dataset.amMode);b.textContent=mode==='CONTINUE'?'VIEW / CONTINUE':'VIEW MARKS';b.onclick=async()=>{if(busy)return;busy=true;const id=b.dataset.amAction,box=$('#t160AMDetail',mount);if(!id||!box){busy=false;return}box.innerHTML='<div class="t160-status info">Loading complete assessment matrix and calculated results…</div>';try{const reg=await rpc('r136_teacher_all_marks',{}),meta=(reg.rows||[]).find(x=>String(x.assessment_id||x.id)===String(id));if(!meta)throw new Error('ASSESSMENT_METADATA_NOT_FOUND');const d=await rpc('r18637_teacher_marks_matrix',{p_class_id:meta.class_id,p_subject_id:meta.subject_id,p_assessment_id:id});renderFullMarksDetail(box,d,meta)}catch(e){box.innerHTML='<div class="t160-status bad"><b>FULL MARKS LOAD FAILED:</b> '+esc(e&&e.message||e)+'</div>'}finally{busy=false}}})};
   bind();new MutationObserver(()=>bind()).observe(mount,{childList:true,subtree:true});
 }
 const baseAllMarks=V.allmarks;if(typeof baseAllMarks==='function')V.allmarks=function(mount,ctx){const out=baseAllMarks(mount,ctx);setTimeout(()=>installAllMarks(mount),0);return out};

 function enhance(root=document){enhanceAttendance(root);enhanceStudentProfile(root);enhanceMarksSave(root);exclusiveServices(root)}
 let timer=0;function queue(root=document){clearTimeout(timer);timer=setTimeout(()=>enhance(root),35)}
 document.addEventListener('gsm:view-rendered',()=>{queue(document);setTimeout(()=>enhance(document),250);setTimeout(()=>enhance(document),900)});
 document.addEventListener('click',()=>setTimeout(()=>enhance(document),90),true);
 const main=$('#main');if(main)new MutationObserver(()=>queue(main)).observe(main,{childList:true,subtree:true,attributes:true,attributeFilter:['hidden','disabled','class']});
 window.GSM_R18684={release:'R186.86',mobileAttendance:'CARD_ROSTER_REASON_DIRECT',mobileScroll:'UNFROZEN',studentSave:'VISIBLE_GREEN',marksLiveFormula:'RAW_CAMIS_EXAM_PERCENT_GRADE_RANK',allMarks:'FULL_ASSESSMENT_MATRIX_AND_COUNTS',exclusiveServices:true,canonicalHost:'musumba.pages.dev'};
 try{document.documentElement.setAttribute('data-gsm-release','R186.86');document.documentElement.setAttribute('data-gsm-component-release','R186.86')}catch(_){}
 setTimeout(()=>enhance(document),120);setTimeout(()=>enhance(document),700);
})();


/* ===== R186.86 GLOBAL EXCLUSIVE SERVICE + MOBILE SCROLL + OLD-ASSET GUARD ===== */
(function(){'use strict';
  if(window.__GSM_R18685_AUTHORITY__)return;
  window.__GSM_R18685_AUTHORITY__=true;
  const RELEASE='R186.86';
  const q=(s,r=document)=>r.querySelector(s);
  const qa=(s,r=document)=>Array.from(r.querySelectorAll(s));

  function hasWork(v){
    if(!v || v.hidden || v.getAttribute('aria-hidden')==='true')return false;
    const text=String(v.textContent||'').replace(/\s+/g,' ').trim();
    if(!text && !v.children.length)return false;
    if(/^loading\b/i.test(text) && v.children.length<2)return false;
    return v.children.length>0 || text.length>18;
  }

  const viewerIds=[
    'r132Viewer','r132Nested','r136bAttViewer','r136bMarksViewer','rLiveViewer',
    'r18674AttendanceHost','r18629MarksHost','r18637CenterView','r18638RoleViewer',
    'r38StuView','r38SysView','r38AllView','deptViewer','finHost','waViewer',
    'mgHost','healthHost','apHost','imhHost','r134SecretaryHost',
    'r144SystemViewer','r145SystemViewer','r146SysViewer','r159Viewer',
    'r170MHost','r171PerfHost','r171PerfView'
  ];

  function containerFor(v){
    if(!v)return null;
    if(v.id==='r132Nested')return v.closest('.r132-service-shell')||v.parentElement;
    if(v.id==='r132Viewer')return v.closest('.r132-page')||v.parentElement;
    if(v.id==='r18674AttendanceHost')return v.closest('.r18674-page')||v.parentElement;
    if(v.id==='r18629MarksHost')return v.closest('.r18629-page')||v.parentElement;
    if(v.id==='r18637CenterView')return v.closest('.r18637-center')||v.parentElement;
    if(v.id==='r38StuView'||v.id==='r38SysView'||v.id==='r38AllView')return v.parentElement;
    return v.closest('.r18638-role-shell,.r18652-center,.r136b-page,.r132-page,.r18674-page,.r18629-page,.page,#main')||v.parentElement;
  }

  function clearExclusive(){
    qa('.r18685-parent-hidden').forEach(x=>x.classList.remove('r18685-parent-hidden'));
    qa('.r18685-active-service').forEach(x=>x.classList.remove('r18685-active-service'));
    qa('.r18685-exclusive-container').forEach(x=>x.classList.remove('r18685-exclusive-container'));
  }

  function preserveSibling(el){
    if(!el || el.nodeType!==1)return true;
    if(el.matches('script,style,template,#toast,#modalBg,.modal-bg,.print-sheet'))return true;
    if(el.matches('#gsm77ServiceBar,.gsm77-servicebar,.r18677-servicebar'))return true;
    return false;
  }

  let lastActiveKey='';
  function depth(el){let n=0;while(el&&el.parentElement){n++;el=el.parentElement}return n}
  function enforceExclusive(){
    clearExclusive();
    const active=viewerIds.map(id=>document.getElementById(id)).filter(hasWork);
    active.forEach(v=>{
      const c=containerFor(v);
      if(!c)return;
      c.classList.add('r18685-exclusive-container');
      v.classList.add('r18685-active-service');
      Array.from(c.children).forEach(ch=>{
        if(ch===v || ch.contains(v) || preserveSibling(ch))return;
        ch.classList.add('r18685-parent-hidden');
      });
    });
    const focus=active.slice().sort((a,b)=>depth(b)-depth(a))[0]||null;
    const key=focus?focus.id+'|'+String(focus.textContent||'').slice(0,60):'';
    if(focus&&key!==lastActiveKey){
      lastActiveKey=key;
      setTimeout(()=>{try{focus.scrollIntoView({block:'start',inline:'nearest',behavior:'auto'})}catch(_){}},0);
    }else if(!focus){lastActiveKey=''}
  }

  function normalizeWideTables(root=document){
    qa('table',root).forEach(t=>{
      const wrap=t.closest('.t160-table-wrap,.r18658-stu-list,.r176-table-wrap,.r18636-table-wrap,.r18637-marks-table-host,.r18661-tablewrap,.r18684-allmarks-wrap,.r18681-week-wrap,.table-wrap,.table-responsive,[class*="table-wrap"],[class*="tablewrap"]');
      if(wrap)wrap.classList.add('r18685-horizontal-scroll');
    });
  }

  function run(root=document){
    normalizeWideTables(root);
    enforceExclusive();
    try{
      document.documentElement.setAttribute('data-gsm-release',RELEASE);
      document.documentElement.setAttribute('data-gsm-component-release',RELEASE);
    }catch(_){}
  }

  try{
    if('caches' in window){
      caches.keys().then(keys=>Promise.all(keys.filter(k=>/^gsm-/i.test(k)&&k!=='gsm-r18685-shell-v1').map(k=>caches.delete(k)))).catch(()=>{});
    }
    if(navigator.serviceWorker&&navigator.serviceWorker.controller){
      navigator.serviceWorker.controller.postMessage({type:'PURGE_OLD_GSM_CACHES',release:RELEASE});
    }
  }catch(_){}

  let timer=0;
  function queue(){clearTimeout(timer);timer=setTimeout(()=>run(document),30)}
  document.addEventListener('gsm:view-rendered',()=>{queue();setTimeout(()=>run(document),220);setTimeout(()=>run(document),800)});
  document.addEventListener('click',()=>{setTimeout(()=>run(document),60);setTimeout(()=>run(document),260)},true);
  const main=q('#main');
  if(main)new MutationObserver(queue).observe(main,{childList:true,subtree:true,attributes:true,attributeFilter:['class','hidden','aria-hidden']});
  window.GSM_R18685={
    release:RELEASE,
    cacheAuthority:'DELETE_OLD_GSM_CACHES_AND_CURRENT_VERSION_QUERY',
    horizontalScrollPhone:'ALLOWED_IN_WIDE_TABLES',
    frozenColumnsPhone:'DISABLED',
    exclusiveServiceSurface:'GLOBAL_PARENT_HIDDEN_WHEN_CHILD_OPEN',
    canonicalHost:'musumba.pages.dev'
  };
  setTimeout(()=>run(document),100);
  setTimeout(()=>run(document),650);
})();
