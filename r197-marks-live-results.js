/* R197: safe marks UI repair and provisional live Final % / Rank. */
(function(){
  'use strict';
  if(window.__GSM_R197_MARKS_LIVE_RESULTS__)return;
  window.__GSM_R197_MARKS_LIVE_RESULTS__=true;
  const number=value=>{const n=Number(String(value==null?'':value).replace(/[^0-9.-]/g,''));return Number.isFinite(n)?n:null};
  const put=(row,key,value)=>{const cell=row.querySelector(`[data-k="${key}"]`);if(cell&&cell.textContent!==value)cell.textContent=value;};
  const restyle=()=>{
    document.querySelectorAll('.r18636-marks-table').forEach(table=>{
      const rows=Array.from(table.querySelectorAll('tbody tr[data-student]'));
      const scored=[];
      rows.forEach(row=>{
        const eu=number((row.querySelector('[data-k="eu"]')||{}).textContent);
        const exam=number((row.querySelector('[data-k="exconv"]')||{}).textContent);
        const max=number((row.querySelector('[data-k="totalmax"]')||{}).textContent);
        const total=(eu||0)+(exam||0);
        if(max&&total>=0){const pct=total/max*100;put(row,'finalpct',pct.toFixed(2)+'%');row.dataset.r197Provisional='1';scored.push({row,pct});}
      });
      scored.sort((a,b)=>b.pct-a.pct);
      let last=null,rank=0;
      scored.forEach((item,index)=>{if(last===null||item.pct!==last)rank=index+1;last=item.pct;put(item.row,'rank',String(rank));});
    });
  };
  const run=()=>{try{restyle()}catch(_){}};
  document.addEventListener('input',event=>{if(event.target&&event.target.matches('.r18636-marks-table .mark-entry'))setTimeout(run,0)});
  new MutationObserver(run).observe(document.documentElement,{childList:true,subtree:true,characterData:true});
  window.GSM_R197={release:'R197',marksFinalAndRank:'live provisional update',studentHeaderOverlap:'fixed'};
  setTimeout(run,200);
})();
