/* Browser history follows map -> scene -> annotation -> image. */
(() => {
 'use strict';
 const field='__taihaoFlow';
 function create(options){
  const ids=new Set(options.ids),axis=new Set(options.axisIds);
  const tabs=['习俗','非遗','提示'];
  const blank=()=>({point:null,route:false,tab:'习俗',media:null,overlay:null,image:false});
  function clean(value={}){
   value=value||{};
   const point=ids.has(value.point)?value.point:null;
   return {point,route:!!point&&axis.has(point)&&value.route===true,tab:tabs.includes(value.tab)?value.tab:'习俗',media:point&&Number.isInteger(value.media)&&value.media>=0&&value.media<(options.noteCounts?.[point]??20)?value.media:null,overlay:['atlas','menu'].includes(value.overlay)?value.overlay:null,image:!!point&&value.image===true};
  }
  const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
  const samePlace=(a,b)=>a.point===b.point&&a.route===b.route&&a.media===b.media&&a.overlay===b.overlay&&a.image===b.image;
  function fromURL(){
   const params=new URLSearchParams(location.hash.slice(1));
   if(!ids.has(params.get('point')))return null;
   const note=Number(params.get('note'));
   return clean({point:params.get('point'),route:params.get('route')==='1',media:params.has('note')&&Number.isInteger(note)&&note>0?note-1:null,image:params.get('image')==='1'});
  }
  const previous=history.state?.[field];
  let key=previous?.v===1&&typeof previous.key==='string'?previous.key:Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,9);
  let trail=[],position=0,current=blank(),pending=null,replaying=false,revision=0,destroyed=false;
  const listeners=[];
  function urlFor(snapshot){
   const url=new URL(location.href);url.searchParams.delete('resume');url.searchParams.delete('fresh');
   const hash=new URLSearchParams();
   if(snapshot.point){hash.set('point',snapshot.point);if(snapshot.route)hash.set('route','1');if(snapshot.media!==null)hash.set('note',String(snapshot.media+1));if(snapshot.image)hash.set('image','1')}
   url.hash=hash.toString();return url.href;
  }
  function write(snapshot,push=false){
   if(push){position++;trail=trail.slice(0,position)}
   current=clean(snapshot);trail[position]=current;
   const state={...(history.state&&typeof history.state==='object'?history.state:{}),[field]:{v:1,key,position,snapshot:current,trail:trail.slice(0,position+1)}};
   history[push?'pushState':'replaceState'](state,'',urlFor(current));
  }
  function changed(){revision++;options.onCommit?.({...current})}
  function restore(snapshot,initial=false){
   if(destroyed)return;
   revision++;replaying=true;
   try{Promise.resolve(options.onRestore({...snapshot},{initial})).catch(error=>options.onError?.(error))}
   catch(error){options.onError?.(error)}
   finally{replaying=false}
  }
  function commit(value,intent='open'){
   if(destroyed||replaying)return;
   const target=clean(value);
   if(pending){current=target;pending.target=target;pending.intent=intent;changed();return}
   if(same(target,current))return;
   const before=current;current=target;changed();
   if(intent==='close'){
    let ancestor=-1;
    for(let i=position-1;i>=0;i--)if(samePlace(trail[i],target)){ancestor=i;break}
    if(ancestor>=0){pending={target,intent,destination:ancestor};history.go(ancestor-position);return}
   }
   const replace=intent==='replace'||(intent==='point'&&before.point!==null)||
    (intent==='point'&&(before.overlay!==null||before.media!==null))||
    (intent==='overlay'&&(before.overlay!==null||before.media!==null))||
    (intent==='media'&&before.media!==null)||intent==='close';
   write(target,!replace);
  }
  function onPop(event){
   if(destroyed)return;
   const entry=event.state?.[field];
   if(entry?.v===1&&entry.key===key){
    position=Math.max(0,Math.trunc(entry.position)||0);trail=(entry.trail||[]).map(clean);current=clean(entry.snapshot);trail[position]=current;
   }else{
    current=fromURL()||blank();position=0;trail=[current];write(current);
   }
   if(pending){
    const desired=pending;pending=null;
    if(position<desired.destination){restore(current);return}
    if(!samePlace(desired.target,current)){commit(desired.target,desired.intent);return}
    if(!same(desired.target,current))write(desired.target);
    return; // The close button has already updated the visible interface.
   }
   restore(current);
  }
  function onHash(){
   if(destroyed||history.state?.[field]?.key===key)return;
   const target=fromURL()||blank();write(target);restore(target);
  }
  window.addEventListener('popstate',onPop);window.addEventListener('hashchange',onHash);
  listeners.push(()=>window.removeEventListener('popstate',onPop),()=>window.removeEventListener('hashchange',onHash));
  const api={
   point(id,route=false){commit({...blank(),point:id,route},'point')},
   map(){commit(blank(),'close')},
   tab(value){commit({...current,tab:value},'replace')},
   openOverlay(name){commit({...current,media:null,image:false,overlay:name},'overlay')},
   closeOverlay(name){if(current.overlay===name)commit({...current,overlay:null},'close')},
   media(index){commit({...current,media:index,overlay:null,image:false},'media')},
   closeMedia(){if(current.media!==null)commit({...current,media:null,image:false},'close')},
   image(open){commit({...current,image:open===true},open?'open':'close')},
   silently(work){const before=replaying;replaying=true;try{return work()}finally{replaying=before}},
   refresh(){pending=null;onPop({state:history.state})},
   get snapshot(){return {...current}},get revision(){return revision},get replaying(){return replaying},
   destroy(){destroyed=true;for(const dispose of listeners)dispose()}
  };
  let initial;
  if(previous?.v===1&&previous.key===key&&Array.isArray(previous.trail)){
   trail=previous.trail.map(clean);position=Math.max(0,Math.trunc(previous.position)||0);initial=clean(previous.snapshot);trail[position]=initial;write(initial);
  }else{
   initial=fromURL()||clean(options.initialState||{});write(blank());
   if(initial.point){const base={...initial,media:null,image:false,overlay:null};write(base,true)}
   if(initial.media!==null)write({...initial,image:false,overlay:null},true);
   if(initial.image)write(initial,true);
   if(!initial.point&&initial.overlay)write(initial,true);
  }
  current=initial;queueMicrotask(()=>restore(initial,true));
  return api;
 }
 window.TaihaoVisitorFlow={create};
})();
