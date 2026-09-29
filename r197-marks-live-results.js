/* R197: safe marks UI repair.  Official results stay server-calculated. */
(function(){
  'use strict';
  if(window.__GSM_R197_MARKS_LIVE_RESULTS__)return;
  window.__GSM_R197_MARKS_LIVE_RESULTS__=true;
  /* A previous browser-only calculation treated an incomplete assessment as
     a final result.  It could therefore display an incorrect percentage,
     rank and grade.  The canonical marks screen already recalculates a row
     while marks are being entered and the server owns submitted results. */
  const restyle=()=>{
    document.querySelectorAll('.r18636-marks-table tbody tr[data-student]').forEach(row=>{
      const finalCell=row.querySelector('[data-k="finalpct"]');
      const gradeCell=row.querySelector('[data-k="grade"]');
      const rankCell=row.querySelector('[data-k="rank"]');
      const hasFinal=/\d/.test(String(finalCell&&finalCell.textContent||''));
      /* An F is meaningful only after a final percentage exists. */
      if(!hasFinal&&gradeCell&&String(gradeCell.textContent||'').trim()==='F'){
        gradeCell.textContent='PENDING';
        if(rankCell)rankCell.textContent='—';
      }
    });
  };
  const run=()=>{try{restyle()}catch(_){}};
  document.addEventListener('input',event=>{if(event.target&&event.target.matches('.r18636-marks-table .mark-entry'))setTimeout(run,0)});
  new MutationObserver(run).observe(document.documentElement,{childList:true,subtree:true,characterData:true});
  window.GSM_R197={release:'R197',marksFinalAndRank:'live provisional update',studentHeaderOverlap:'fixed'};
  setTimeout(run,200);
})();
