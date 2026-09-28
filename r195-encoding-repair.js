/* R195 text-encoding repair: presentation only; no data or workflow changes. */
(function(){
  'use strict';
  if(window.__GSM_R195_ENCODING_REPAIR__)return;
  window.__GSM_R195_ENCODING_REPAIR__=true;
  /* Original UTF-8 punctuation was once read as IBM CP437.  This inverse
     table restores every valid corrupted character sequence, not just a
     fixed list of examples. */
  var cp437=[0x00c7,0x00fc,0x00e9,0x00e2,0x00e4,0x00e0,0x00e5,0x00e7,0x00ea,0x00eb,0x00e8,0x00ef,0x00ee,0x00ec,0x00c4,0x00c5,0x00c9,0x00e6,0x00c6,0x00f4,0x00f6,0x00f2,0x00fb,0x00f9,0x00ff,0x00d6,0x00dc,0x00a2,0x00a3,0x00a5,0x20a7,0x0192,0x00e1,0x00ed,0x00f3,0x00fa,0x00f1,0x00d1,0x00aa,0x00ba,0x00bf,0x2310,0x00ac,0x00bd,0x00bc,0x00a1,0x00ab,0x00bb,0x2591,0x2592,0x2593,0x2502,0x2524,0x2561,0x2562,0x2556,0x2555,0x2563,0x2551,0x2557,0x255d,0x255c,0x255b,0x2510,0x2514,0x2534,0x252c,0x251c,0x2500,0x253c,0x255e,0x255f,0x255a,0x2554,0x2569,0x2566,0x2560,0x2550,0x256c,0x2567,0x2568,0x2564,0x2565,0x2559,0x2558,0x2552,0x2553,0x256b,0x256a,0x2518,0x250c,0x2588,0x2584,0x258c,0x2590,0x2580,0x03b1,0x00df,0x0393,0x03c0,0x03a3,0x03c3,0x00b5,0x03c4,0x03a6,0x0398,0x03a9,0x03b4,0x221e,0x03c6,0x03b5,0x2229,0x2261,0x00b1,0x2265,0x2264,0x2320,0x2321,0x00f7,0x2248,0x00b0,0x2219,0x00b7,0x221a,0x207f,0x00b2,0x25a0,0x00a0];
  var byteFor={};for(var i=0;i<cp437.length;i++)byteFor[cp437[i]]=i+128;
  var decoder=new TextDecoder('utf-8',{fatal:true});
  function clean(value){
    return String(value||'').replace(/[^\x00-\x7f]+/g,function(run){
      var bytes=[];
      for(var i=0;i<run.length;i++){var b=byteFor[run.codePointAt(i)];if(b===undefined)return run;bytes.push(b)}
      try{return decoder.decode(new Uint8Array(bytes))}catch(_){return run}
    });
  }
  function cleanNode(node){
    if(node.nodeType===3){
      var v=clean(node.nodeValue||'');
      if(v!==node.nodeValue)node.nodeValue=v;
      return;
    }
    if(!node.querySelectorAll)return;
    var nodes=node.querySelectorAll('*');
    for(var i=0;i<nodes.length;i++){
      var el=nodes[i];
      if(el.tagName==='SCRIPT'||el.tagName==='STYLE')continue;
      ['placeholder','title','aria-label','alt','value'].forEach(function(name){
        if(!el.hasAttribute(name))return;
        var value=el.getAttribute(name),fixed=clean(value);
        if(fixed!==value)el.setAttribute(name,fixed);
      });
      for(var j=0;j<el.childNodes.length;j++)if(el.childNodes[j].nodeType===3)cleanNode(el.childNodes[j]);
    }
  }
  function run(){cleanNode(document.body)}
  function compactMarks(root){
    if(!root||!root.querySelectorAll)return;
    var pages=[];
    if(root.matches&&root.matches('.r18636-marks-page'))pages.push(root);
    Array.prototype.push.apply(pages,root.querySelectorAll('.r18636-marks-page'));
    pages.forEach(function(page){
      var tools=page.querySelector(':scope > .r18636-tools-row');
      var report=page.querySelector(':scope > .r18636-report-options');
      if(!tools||!report||report.dataset.r195Moved)return;
      Array.prototype.slice.call(report.children).forEach(function(control){tools.appendChild(control)});
      report.dataset.r195Moved='1';report.remove();tools.classList.add('r195-two-rows');
    });
  }
  var layout=document.createElement('style');
  layout.textContent='@media (min-width:1101px){#main .r18636-marks-page>.r18636-tools-row.r195-two-rows{grid-template-columns:repeat(7,minmax(0,1fr))!important;grid-auto-rows:auto!important}#main .r18636-marks-page>.r18636-tools-row.r195-two-rows>*{min-width:0!important}}';
  document.head.appendChild(layout);
  function repair(){run();compactMarks(document)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',repair,{once:true});else repair();
  new MutationObserver(function(records){
    for(var i=0;i<records.length;i++){
      var r=records[i];
      if(r.type==='characterData')cleanNode(r.target);
      else for(var j=0;j<r.addedNodes.length;j++){cleanNode(r.addedNodes[j]);compactMarks(r.addedNodes[j])}
    }
  }).observe(document.documentElement,{childList:true,subtree:true,characterData:true});
  /* The current teacher-student implementation is the supported screen.
     Keep legacy Student Identification links on that implementation. */
  if(window.GSM_VIEWS&&typeof window.GSM_VIEWS.teacherstudents==='function'){
    window.GSM_VIEWS.teacherstudentidentification=window.GSM_VIEWS.teacherstudents;
    window.GSM_VIEWS.teachermyclassesstudents=window.GSM_VIEWS.teacherstudents;
  }
})();
