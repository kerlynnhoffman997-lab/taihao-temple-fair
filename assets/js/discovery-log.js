/* Records opened cultural clues locally; a discovery is independent of a stamp. */
(() => {
 'use strict';
 function create({points={},annotationCounts={}}={}){
  const ids=new Set(Object.keys(points)),key='taihao-discoveries-v1';let entries={},persisted=true;
  function clean(value){
   const result={},now=Date.now();if(!value||typeof value!=='object')return result;
   for(const [id,item] of Object.entries(value)){
    if(!ids.has(id)||!item||!['annotation','story','video'].includes(item.kind)||!Number.isFinite(item.openedAt)||item.openedAt<=0||item.openedAt>now+60000)continue;
    const index=Number.isInteger(item.index)&&item.index>=0&&item.index<(annotationCounts[id]||0)?item.index:null;
    result[id]={kind:item.kind,index,openedAt:item.openedAt};
   }
   return result;
  }
  try{const saved=JSON.parse(localStorage.getItem(key)||'null');if(saved?.v===1)entries=clean(saved.entries)}catch(_){persisted=false}
  function all(){return Object.fromEntries(Object.entries(entries).map(([id,item])=>[id,{...item,takeaway:points[id].takeaway||'',summary:points[id].takeaway||''}]))}
  function notify(id=null){document.dispatchEvent(new CustomEvent('taihao:discoverychange',{detail:{id,count:Object.keys(entries).length,persisted}}))}
  function record(id,{kind='annotation',index=null}={}){
   if(!ids.has(id)||!['annotation','story','video'].includes(kind))return false;
   const fresh=!entries[id];entries=clean({...entries,[id]:{kind,index,openedAt:entries[id]?.openedAt||Date.now()}});
   try{localStorage.setItem(key,JSON.stringify({v:1,entries}));persisted=true}catch(_){persisted=false}
   if(fresh)notify(id);return fresh;
  }
  window.addEventListener('storage',event=>{if(event.key!==key&&event.key!==null)return;try{const saved=JSON.parse(event.newValue||'null');entries=saved?.v===1?clean(saved.entries):{};notify()}catch(_){}});
  return {record,getAll:all,has:id=>!!entries[id],get count(){return Object.keys(entries).length},get persisted(){return persisted}};
 }
 window.TaihaoDiscoveryLog={create};
})();
