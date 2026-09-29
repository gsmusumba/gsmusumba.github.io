/* R198: presentation and duplicate-service safety fixes; no data writes. */
(function(){
  'use strict';
  if(window.__GSM_R198_UI_SAFETY__)return;
  window.__GSM_R198_UI_SAFETY__=true;
  const key=value=>String(value||'').toUpperCase().replace(/[^A-Z0-9]/g,'');
  function removeDuplicateSystemCards(root){
    const query=root&&root.querySelector?root:document;
    const grid=query.querySelector('#r39SysCards')||document.querySelector('#r39SysCards');
    if(!grid)return;
    const seen=new Set();
    Array.from(grid.querySelectorAll('.r18638-card')).forEach(card=>{
      const title=key((card.querySelector('b')||card).textContent);
      if(!title)return;
      if(seen.has(title))card.remove();else seen.add(title);
    });
    const status=document.querySelector('#r39SysLoad');
    if(status&&/SERVICE\(S\) LOADED/i.test(status.textContent))status.textContent=seen.size+' UNIQUE SYSTEM MANAGEMENT SERVICE(S) LOADED.';
  }
  const style=document.createElement('style');
  style.textContent='@media print{body{background:#fff!important;color:#000!important;font-size:10pt!important}#sidebar,#topbar,.sidebar,.topbar,button,.no-print,[data-no-print]{display:none!important}#main,#content,.print-sheet{width:100%!important;margin:0!important;padding:0!important;background:#fff!important;color:#000!important}table{width:100%!important;border-collapse:collapse!important;font-size:8pt!important}th,td{border:1px solid #222!important;color:#000!important;background:#fff!important;padding:3px!important}thead{display:table-header-group}tr{break-inside:avoid}a[href]:after{content:none!important}}';
  document.head.appendChild(style);
  removeDuplicateSystemCards(document);
  new MutationObserver(records=>records.forEach(record=>record.addedNodes.forEach(node=>{if(node.nodeType===1)removeDuplicateSystemCards(node)}))).observe(document.documentElement,{childList:true,subtree:true});
})();
