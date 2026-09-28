/* R195 text-encoding repair: presentation only; no data or workflow changes. */
(function(){
  'use strict';
  if(window.__GSM_R195_ENCODING_REPAIR__)return;
  window.__GSM_R195_ENCODING_REPAIR__=true;
  var fixes=[
    [/\u251c\u2563/g,'-'],[/\u252c\u2556/g,'\u00b7'],
    [/\u0393\u00c7\u00f6/g,'\u2014'],[/\u0393\u00c7\u00f4/g,'\u2014'],
    [/\u0393\u00c7\u00aa/g,'\u2026'],[/\u0393\u00a3\u00f4/g,'\u2713'],
    [/\u0393\u00dc\u00e1/g,'!'],[/\u0393\u00e5\u00c6/g,'\u2192'],
    [/\u251c\u00f9/g,'x'],[/\u251c\u00f2/g,'\u00f7']
  ];
  function clean(value){
    var out=value;
    for(var i=0;i<fixes.length;i++)out=out.replace(fixes[i][0],fixes[i][1]);
    return out;
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
      for(var j=0;j<el.childNodes.length;j++)if(el.childNodes[j].nodeType===3)cleanNode(el.childNodes[j]);
    }
  }
  function run(){cleanNode(document.body)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run,{once:true});else run();
  new MutationObserver(function(records){
    for(var i=0;i<records.length;i++){
      var r=records[i];
      if(r.type==='characterData')cleanNode(r.target);
      else for(var j=0;j<r.addedNodes.length;j++)cleanNode(r.addedNodes[j]);
    }
  }).observe(document.documentElement,{childList:true,subtree:true,characterData:true});
})();
