/* R199: one horizontal, scrollable service tab bar per module. */
(function(){
  'use strict';
  if(window.__GSM_R199_MODULE_TABS__)return;
  window.__GSM_R199_MODULE_TABS__=true;
  const label=card=>String((card.querySelector('b')||card).textContent||'SERVICE').replace(/\s+/g,' ').trim();
  function enhance(grid){
    if(!grid||grid.dataset.r199TabsReady==='1')return;
    const cards=Array.from(grid.querySelectorAll(':scope > .r18638-card,:scope > .r132-card'));
    if(!cards.length)return;
    grid.dataset.r199TabsReady='1';
    const tabs=document.createElement('div');
    tabs.className='gsm-module-tabs';
    tabs.setAttribute('role','tablist');
    tabs.setAttribute('aria-label','Module services');
    const storageKey='gsm-module-tab:'+location.pathname+':'+(grid.id||label(cards[0]));
    const setActive=index=>tabs.querySelectorAll('button').forEach((tab,i)=>{
      const active=i===index;
      tab.classList.toggle('active',active);
      tab.setAttribute('aria-selected',active?'true':'false');
    });
    cards.forEach((card,index)=>{
      const tab=document.createElement('button');
      tab.type='button';
      tab.className='gsm-module-tab'+(index===0?' active':'');
      tab.textContent=label(card);
      tab.setAttribute('role','tab');
      tab.setAttribute('aria-selected',index===0?'true':'false');
      tab.onclick=()=>{setActive(index);try{sessionStorage.setItem(storageKey,String(index))}catch(_){}card.click();};
      tabs.appendChild(tab);
    });
    grid.parentNode.insertBefore(tabs,grid);
    grid.classList.add('gsm-module-tab-source');
    const saved=Number((()=>{try{return sessionStorage.getItem(storageKey)}catch(_){return null}})());
    if(Number.isInteger(saved)&&saved>=0&&saved<cards.length)setActive(saved);
  }
  function scan(root){
    if(!root||!root.querySelectorAll)return;
    if(root.matches&&root.matches('.r18638-card-grid,.r132-card-grid'))enhance(root);
    root.querySelectorAll('.r18638-card-grid,.r132-card-grid').forEach(enhance);
  }
  scan(document);
  new MutationObserver(records=>records.forEach(record=>{
    if(record.type==='attributes'&&record.attributeName==='hidden'&&record.target.classList&&record.target.classList.contains('gsm-module-tabs')){
      record.target.hidden=false;
      delete record.target.dataset.r18638FullpageLocked;
      delete record.target.dataset.r18638FullpageWasHidden;
    }
    record.addedNodes&&record.addedNodes.forEach(node=>{if(node.nodeType===1)scan(node)});
  })).observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['hidden']});
  const style=document.createElement('style');
  style.textContent=''
    +'.gsm-module-tabs{display:flex!important;align-items:stretch!important;gap:3px!important;width:100%!important;max-width:100%!important;overflow-x:auto!important;overscroll-behavior-inline:contain!important;padding:5px!important;margin:0 0 7px!important;background:#edf4f9!important;border:1px solid #b8cad9!important;border-radius:7px!important;scrollbar-width:thin!important}'
    +'.gsm-module-tab{flex:0 0 auto!important;min-height:34px!important;max-width:240px!important;border:1px solid transparent!important;border-radius:5px!important;background:transparent!important;color:#174a70!important;padding:7px 11px!important;font:800 10px/1.1 "Segoe UI",Arial,sans-serif!important;white-space:nowrap!important;cursor:pointer!important}'
    +'.gsm-module-tab:hover{background:#dcebf5!important;border-color:#9cb8cc!important}'
    +'.gsm-module-tab.active{background:#147a69!important;color:#fff!important;border-color:#0e6255!important;box-shadow:inset 0 -2px 0 rgba(0,0,0,.14)!important}'
    +'.gsm-module-tab:focus-visible{outline:3px solid #e2b700!important;outline-offset:1px!important}'
    +'.r18638-card-grid.gsm-module-tab-source,.r132-card-grid.gsm-module-tab-source{display:none!important}'
    +'@media(max-width:700px){.gsm-module-tabs{margin-inline:-2px!important;border-radius:0!important}.gsm-module-tab{min-height:38px!important;font-size:10px!important;padding:8px 12px!important}}';
  document.head.appendChild(style);
})();
